/*
 * shared/auth.js — wspólna warstwa logowania i zapisu wyników dla wszystkich gier.
 *
 * Jeden self-contained plik: sam doładowuje supabase-js z CDN, wstrzykuje widget
 * logowania (prawy górny róg) + modal, i udostępnia globalne API:
 *
 *   window.GryAuth   — logowanie / sesja
 *   window.GryScores — zapis i odczyt wyników (tylko dla zalogowanych)
 *
 * Użycie na stronie gry (jeden include, ścieżka względna do głębokości folderu):
 *   <script src="../shared/auth.js"></script>
 *
 * Zapis wyniku z gry:
 *   GryScores.submit('snake', score, { lowerIsBetter: false });
 *   GryScores.submit('soltaire', timeSeconds, { lowerIsBetter: true });
 *
 * Zalogowany  -> wynik trafia do Supabase (tabela public.scores).
 * Gość        -> nic nie zapisujemy (submit rozwiązuje się jako null).
 */
(function () {
  'use strict';

  // --- Konfiguracja projektu Supabase (klucz publiczny — bezpieczny w kliencie) ---
  const SUPABASE_URL = 'https://bvsbiwivavcnwazctdfh.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_vAQgqpNef0eQUErsNHm9HQ_uAjKWDvg';
  const SUPABASE_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
  const GUEST_KEY = 'gry_guest_mode';

  let client = null;
  let currentUser = null;
  let ready = false;
  const readyCbs = [];
  const changeCbs = [];

  // ---- Ładowanie SDK supabase-js z CDN ----
  function loadSdk() {
    return new Promise((resolve, reject) => {
      if (window.supabase && window.supabase.createClient) return resolve(window.supabase);
      const s = document.createElement('script');
      s.src = SUPABASE_CDN;
      s.onload = () => resolve(window.supabase);
      s.onerror = () => reject(new Error('Nie udało się załadować supabase-js'));
      document.head.appendChild(s);
    });
  }

  function displayName(user) {
    if (!user) return null;
    return (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name))
      || (user.email ? user.email.split('@')[0] : 'Gracz');
  }

  function notifyChange() {
    changeCbs.forEach((cb) => { try { cb(currentUser); } catch (e) { /* noop */ } });
    renderWidget();
  }

  // ================= Publiczne API =================
  const GryAuth = {
    get client() { return client; },
    get ready() { return ready; },
    user() { return currentUser; },
    isLoggedIn() { return !!currentUser; },
    isGuest() { try { return localStorage.getItem(GUEST_KEY) === '1'; } catch (e) { return false; } },
    displayName() { return displayName(currentUser); },

    onReady(cb) { if (ready) cb(); else readyCbs.push(cb); },
    onChange(cb) { changeCbs.push(cb); if (ready) cb(currentUser); },

    setGuest(v) {
      try { localStorage.setItem(GUEST_KEY, v ? '1' : '0'); } catch (e) { /* noop */ }
      renderWidget();
    },

    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    },
    async signUp(email, password) {
      const { data, error } = await client.auth.signUp({ email: email.trim(), password });
      if (error) throw error;
      return data;
    },
    async resetPassword(email) {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
    },
    async signOut() {
      await client.auth.signOut();
    },
    openLogin() { openModal('signin'); },
  };

  const GryScores = {
    /**
     * Zapisuje wynik. Zalogowany -> Supabase; gość -> null (bez zapisu).
     * @param {string} game  identyfikator gry, np. 'snake'
     * @param {number} value wynik/czas
     * @param {object} [opts] { mode, lowerIsBetter, meta }
     */
    async submit(game, value, opts) {
      opts = opts || {};
      if (!ready || !currentUser) return null; // gość — nie zapisujemy rekordów
      const row = {
        user_id: currentUser.id,
        display_name: displayName(currentUser),
        game: String(game),
        mode: String(opts.mode || ''),
        value: Number(value),
        lower_is_better: !!opts.lowerIsBetter,
        meta: opts.meta || {},
      };
      const { data, error } = await client.from('scores').insert(row).select().single();
      if (error) { console.warn('[GryScores] zapis nieudany:', error.message); return null; }
      return data;
    },

    /** Najlepszy wynik zalogowanego gracza dla gry (+ opcjonalnie mode). */
    async best(game, opts) {
      opts = opts || {};
      if (!ready || !currentUser) return null;
      const asc = !!opts.lowerIsBetter;
      let q = client.from('scores').select('value')
        .eq('game', game).eq('user_id', currentUser.id)
        .order('value', { ascending: asc }).limit(1);
      if (opts.mode != null) q = q.eq('mode', String(opts.mode));
      const { data, error } = await q;
      if (error || !data || !data.length) return null;
      return data[0].value;
    },

    /** Globalna tabela rekordów (top N wśród zalogowanych). */
    async leaderboard(game, opts) {
      opts = opts || {};
      if (!ready) return [];
      const asc = !!opts.lowerIsBetter;
      let q = client.from('scores').select('display_name,value,created_at')
        .eq('game', game)
        .order('value', { ascending: asc }).limit(opts.limit || 10);
      if (opts.mode != null) q = q.eq('mode', String(opts.mode));
      const { data, error } = await q;
      if (error) return [];
      return data || [];
    },
  };

  window.GryAuth = GryAuth;
  window.GryScores = GryScores;

  // ============ Mostek localStorage -> Supabase ============
  // Proste gry trzymają rekord jako liczbę pod stałym kluczem. Obserwujemy zapisy
  // do tych kluczy i lustrzanie wysyłamy nowy rekord do chmury (gdy zalogowany).
  // Dzięki temu nie trzeba zmieniać kodu każdej gry.
  const WATCH = [
    { game: 'snake',     key: 'snake_high_score' },
    { game: 'riverraid', key: 'riverRaidHighScore' },
    { game: 'obrona',    key: 'obronaHighScore' },
    { game: 'obrona',    key: 'obronaHighWave', mode: 'wave' },
    { game: 'rybak',     key: 'rybak_hi' },
    { game: 'imuno',     key: 'imuno_hi_level' },
    { game: 'jumper',    key: 'neonJumperHighscore' },
    { game: 'ptak',      key: 'ptak_highscore' },
    { game: 'soltaire',  key: 'solitaire_piatnik_best', lowerIsBetter: true },
    { game: 'memo',      prefix: 'memo-rec-', lowerIsBetter: true },
  ];
  const lastSubmitted = {}; // klucz -> wartość, żeby nie dublować

  function matchWatch(key) {
    for (const w of WATCH) {
      if (w.key && key === w.key) return { w, mode: w.mode || '' };
      if (w.prefix && key.indexOf(w.prefix) === 0) return { w, mode: key.slice(w.prefix.length) };
    }
    return null;
  }

  function handleWrite(key, rawValue) {
    const m = matchWatch(key);
    if (!m) return;
    const num = parseFloat(rawValue);
    if (!isFinite(num) || num <= 0) return;
    if (lastSubmitted[key] === num) return;
    if (!ready || !currentUser) return; // gość -> bez zapisu w chmurze
    lastSubmitted[key] = num;
    GryScores.submit(m.w.game, num, { mode: m.mode, lowerIsBetter: !!m.w.lowerIsBetter });
  }

  function installWatch() {
    try {
      const proto = window.Storage && window.Storage.prototype;
      if (!proto || proto.__gryPatched) return;
      const orig = proto.setItem;
      proto.setItem = function (key, value) {
        const r = orig.apply(this, arguments);
        if (this === window.localStorage) {
          try { handleWrite(String(key), value); } catch (e) { /* noop */ }
        }
        return r;
      };
      proto.__gryPatched = true;
    } catch (e) { /* noop */ }
  }
  installWatch();

  // ================= Widget + modal =================
  function injectStyles() {
    if (document.getElementById('gry-auth-styles')) return;
    const css = `
    #gry-auth-widget{position:fixed;top:10px;right:10px;z-index:2147483000;display:flex;gap:6px;align-items:center;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;font-size:13px}
    #gry-auth-widget .gry-chip{background:rgba(30,41,59,.92);color:#f8fafc;border:1px solid #334155;border-radius:9999px;padding:5px 12px;display:flex;gap:8px;align-items:center;box-shadow:0 2px 8px rgba(0,0,0,.35);backdrop-filter:blur(4px)}
    #gry-auth-widget button{cursor:pointer;border:none;border-radius:9999px;padding:5px 12px;font-weight:600;font-size:13px}
    #gry-auth-widget .gry-login{background:#38bdf8;color:#0f172a}
    #gry-auth-widget .gry-logout{background:transparent;color:#94a3b8;border:1px solid #334155;padding:4px 10px}
    #gry-auth-widget .gry-user{max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #gry-auth-overlay{position:fixed;inset:0;z-index:2147483001;background:rgba(2,6,23,.7);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
    #gry-auth-overlay .gry-modal{background:#1e293b;color:#f8fafc;border:1px solid #334155;border-radius:16px;width:100%;max-width:360px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.5)}
    #gry-auth-overlay h2{margin:0 0 4px;font-size:20px;font-weight:700}
    #gry-auth-overlay p.sub{margin:0 0 16px;color:#94a3b8;font-size:13px}
    #gry-auth-overlay input{width:100%;box-sizing:border-box;background:#0f172a;border:1px solid #334155;border-radius:10px;padding:11px 12px;color:#f8fafc;font-size:14px;margin-bottom:10px}
    #gry-auth-overlay input:focus{outline:none;border-color:#38bdf8}
    #gry-auth-overlay .gry-primary{width:100%;background:#38bdf8;color:#0f172a;border:none;border-radius:10px;padding:11px;font-weight:700;font-size:14px;cursor:pointer}
    #gry-auth-overlay .gry-primary:disabled{opacity:.6;cursor:default}
    #gry-auth-overlay .gry-link{background:none;border:none;color:#94a3b8;text-decoration:underline;cursor:pointer;font-size:13px;padding:6px 0}
    #gry-auth-overlay .gry-links{display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:10px}
    #gry-auth-overlay .gry-err{color:#ef4444;font-size:13px;margin:8px 0 0;text-align:center}
    #gry-auth-overlay .gry-ok{color:#22c55e;font-size:13px;margin:8px 0 0;text-align:center}
    #gry-auth-overlay .gry-close{float:right;background:none;border:none;color:#94a3b8;font-size:20px;cursor:pointer;line-height:1;margin:-6px -6px 0 0}
    `;
    const st = document.createElement('style');
    st.id = 'gry-auth-styles';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function renderWidget() {
    if (!document.body) return;
    let w = document.getElementById('gry-auth-widget');
    if (!w) {
      w = document.createElement('div');
      w.id = 'gry-auth-widget';
      document.body.appendChild(w);
    }
    if (currentUser) {
      w.innerHTML = '';
      const chip = document.createElement('div');
      chip.className = 'gry-chip';
      const name = document.createElement('span');
      name.className = 'gry-user';
      name.textContent = '👤 ' + displayName(currentUser);
      const out = document.createElement('button');
      out.className = 'gry-logout';
      out.textContent = 'Wyloguj';
      out.onclick = () => GryAuth.signOut();
      chip.appendChild(name);
      chip.appendChild(out);
      w.appendChild(chip);
    } else {
      w.innerHTML = '';
      const chip = document.createElement('div');
      chip.className = 'gry-chip';
      const label = document.createElement('span');
      label.textContent = GryAuth.isGuest() ? '🎮 Gość' : 'Niezalogowany';
      const login = document.createElement('button');
      login.className = 'gry-login';
      login.textContent = 'Zaloguj';
      login.onclick = () => openModal('signin');
      chip.appendChild(label);
      chip.appendChild(login);
      w.appendChild(chip);
    }
  }

  function openModal(mode) {
    injectStyles();
    let ov = document.getElementById('gry-auth-overlay');
    if (ov) ov.remove();
    ov = document.createElement('div');
    ov.id = 'gry-auth-overlay';
    ov.innerHTML = renderModalHtml(mode);
    document.body.appendChild(ov);
    wireModal(ov, mode);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
  }

  function renderModalHtml(mode) {
    const titles = { signin: 'Zaloguj się', signup: 'Utwórz konto', reset: 'Reset hasła' };
    const subs = {
      signin: 'Zaloguj się, aby zapisywać rekordy.',
      signup: 'Załóż konto, aby zapisywać wyniki w chmurze.',
      reset: 'Podaj e-mail — wyślemy link do zmiany hasła.',
    };
    const showPass = mode !== 'reset';
    const btn = { signin: 'Zaloguj', signup: 'Utwórz konto', reset: 'Wyślij link' }[mode];
    return `<div class="gry-modal">
      <button class="gry-close" data-act="close">&times;</button>
      <h2>${titles[mode]}</h2>
      <p class="sub">${subs[mode]}</p>
      <input type="email" data-f="email" placeholder="ty@example.com" autocomplete="email" />
      ${showPass ? '<input type="password" data-f="password" placeholder="Hasło (min. 6 znaków)" autocomplete="current-password" minlength="6" />' : ''}
      <button class="gry-primary" data-act="submit">${btn}</button>
      <div class="gry-msg"></div>
      <div class="gry-links">
        ${mode === 'signin' ? '<button class="gry-link" data-go="reset">Nie pamiętasz hasła?</button>' : ''}
        ${mode === 'signin' ? '<button class="gry-link" data-go="signup">Nowy tu? Załóż konto</button>' : ''}
        ${mode === 'signup' ? '<button class="gry-link" data-go="signin">Masz konto? Zaloguj się</button>' : ''}
        ${mode === 'reset' ? '<button class="gry-link" data-go="signin">Wróć do logowania</button>' : ''}
        <button class="gry-link" data-act="guest">Graj jako gość (bez zapisu)</button>
      </div>
    </div>`;
  }

  function wireModal(ov, mode) {
    const q = (s) => ov.querySelector(s);
    const msg = q('.gry-msg');
    const setErr = (t) => { msg.innerHTML = '<p class="gry-err">' + t + '</p>'; };
    const setOk = (t) => { msg.innerHTML = '<p class="gry-ok">' + t + '</p>'; };
    const btn = q('[data-act="submit"]');

    ov.querySelectorAll('[data-go]').forEach((b) => {
      b.onclick = () => openModal(b.getAttribute('data-go'));
    });
    q('[data-act="close"]').onclick = () => ov.remove();
    q('[data-act="guest"]').onclick = () => { GryAuth.setGuest(true); ov.remove(); };

    btn.onclick = async () => {
      const email = (q('[data-f="email"]') || {}).value || '';
      const passEl = q('[data-f="password"]');
      const password = passEl ? passEl.value : '';
      if (!email.trim()) return setErr('Podaj e-mail.');
      if (mode !== 'reset' && password.length < 6) return setErr('Hasło musi mieć min. 6 znaków.');
      btn.disabled = true; msg.innerHTML = '';
      try {
        if (mode === 'signin') {
          await GryAuth.signIn(email, password);
          ov.remove();
        } else if (mode === 'signup') {
          const data = await GryAuth.signUp(email, password);
          if (data && data.session) { ov.remove(); }
          else { setOk('Konto utworzone. Sprawdź e-mail, aby potwierdzić.'); }
        } else {
          await GryAuth.resetPassword(email);
          setOk('Jeśli konto istnieje, wysłaliśmy link.');
        }
      } catch (e) {
        setErr(e.message || 'Coś poszło nie tak.');
      } finally {
        btn.disabled = false;
      }
    };

    ov.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
  }

  // ================= Inicjalizacja =================
  async function init() {
    try {
      const sb = await loadSdk();
      client = sb.createClient(SUPABASE_URL, SUPABASE_KEY);
      const { data } = await client.auth.getSession();
      currentUser = (data && data.session && data.session.user) || null;
      client.auth.onAuthStateChange((_event, session) => {
        currentUser = (session && session.user) || null;
        notifyChange();
      });
      ready = true;
      injectStyles();
      renderWidget();
      readyCbs.forEach((cb) => { try { cb(); } catch (e) { /* noop */ } });
    } catch (e) {
      console.warn('[GryAuth] init nieudany:', e.message);
      ready = true; // tryb offline / gość
      injectStyles();
      renderWidget();
      readyCbs.forEach((cb) => { try { cb(); } catch (e2) { /* noop */ } });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
