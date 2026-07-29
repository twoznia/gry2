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
  // Logowanie po nazwie: nazwa bez '@' zamieniana na syntetyczny e-mail.
  const USERNAME_DOMAIN = 'gry2.local';

  // Zamienia login (nazwa lub e-mail) na e-mail wymagany przez Supabase.
  function toEmail(login) {
    const v = String(login || '').trim();
    if (v.indexOf('@') >= 0) return v.toLowerCase();
    return v.toLowerCase().replace(/\s+/g, '_') + '@' + USERNAME_DOMAIN;
  }

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

    async signIn(login, password) {
      const { error } = await client.auth.signInWithPassword({ email: toEmail(login), password });
      if (error) throw error;
    },
    async signUp(login, password) {
      const name = String(login || '').trim();
      const { data, error } = await client.auth.signUp({
        email: toEmail(login),
        password,
        options: { data: { full_name: name.indexOf('@') >= 0 ? name.split('@')[0] : name } },
      });
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

  // Kolumna z metryką: czas (niższy lepszy) lub punkty.
  function metricCol(opts) { return opts && opts.lowerIsBetter ? 'time_seconds' : 'score'; }

  const GryScores = {
    /**
     * Zapisuje wynik do gry2.scores. Zalogowany -> Supabase; gość -> null.
     * @param {string} game  gra, np. 'snake', 'reflex'
     * @param {number} value wartość głównej metryki (punkty lub czas)
     * @param {object} [opts] { subgame, mode, level, errors, wave, lowerIsBetter, meta, metric }
     */
    async submit(game, value, opts) {
      opts = opts || {};
      if (!ready || !currentUser) return null; // gość — nie zapisujemy rekordów
      const lower = !!opts.lowerIsBetter;
      const row = {
        user_id: currentUser.id,
        display_name: displayName(currentUser),
        game: String(game),
        subgame: String(opts.subgame || ''),
        mode: String(opts.mode || ''),
        level: String(opts.level || ''),
        score: null,
        time_seconds: null,
        errors: opts.errors != null ? Number(opts.errors) : null,
        wave: opts.wave != null ? Number(opts.wave) : null,
        lower_is_better: lower,
        meta: opts.meta || {},
      };
      if (value != null) {
        const metric = opts.metric || (lower ? 'time' : 'score');
        if (metric === 'time') row.time_seconds = Number(value);
        else row.score = Number(value);
      }
      const { data, error } = await client.from('scores').insert(row).select().single();
      if (error) { console.warn('[GryScores] zapis nieudany:', error.message); return null; }
      return data;
    },

    /** Najlepszy wynik zalogowanego gracza (+ opcjonalnie subgame/mode/level). */
    async best(game, opts) {
      opts = opts || {};
      if (!ready || !currentUser) return null;
      const col = metricCol(opts);
      let q = client.from('scores').select(col)
        .eq('game', game).eq('user_id', currentUser.id)
        .order(col, { ascending: !!opts.lowerIsBetter, nullsFirst: false }).limit(1);
      if (opts.subgame != null) q = q.eq('subgame', String(opts.subgame));
      if (opts.mode != null) q = q.eq('mode', String(opts.mode));
      if (opts.level != null) q = q.eq('level', String(opts.level));
      const { data, error } = await q;
      if (error || !data || !data.length) return null;
      return data[0][col];
    },

    /** Globalna tabela rekordów (top N wśród zalogowanych). */
    async leaderboard(game, opts) {
      opts = opts || {};
      if (!ready) return [];
      const col = metricCol(opts);
      let q = client.from('scores').select('display_name,score,time_seconds,errors,wave,mode,level,subgame,created_at')
        .eq('game', game)
        .order(col, { ascending: !!opts.lowerIsBetter, nullsFirst: false }).limit(opts.limit || 10);
      if (opts.subgame != null) q = q.eq('subgame', String(opts.subgame));
      if (opts.mode != null) q = q.eq('mode', String(opts.mode));
      if (opts.level != null) q = q.eq('level', String(opts.level));
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
  let rawSetItem = null;     // oryginalny localStorage.setItem (zapis bez wysyłki)

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

  // Wariant (podgra) reflex z URL, np. 'znikanie'.
  function reflexSubgame() {
    const parts = location.pathname.split('/').filter(Boolean);
    const i = parts.indexOf('reflex');
    if (i >= 0 && parts[i + 1] && parts[i + 1] !== 'index.html') return parts[i + 1];
    return '';
  }
  // Warianty reflex liczone na czas (niższy lepszy).
  const REFLEX_TIME = { kolory: 1, kolory2: 1, liczby: 1, litery: 1 };

  function installWatch() {
    try {
      const proto = window.Storage && window.Storage.prototype;
      if (!proto || proto.__gryPatched) return;
      const orig = proto.setItem;
      rawSetItem = orig;
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

  // Zaciąga najlepszy wynik gracza z chmury do localStorage (odczyt rekordów z Supabase).
  // Gra czyta rekord z localStorage przy starcie — po zsynchronizowaniu pokaże wartość z chmury
  // (na bieżącej stronie po odświeżeniu, potem na żywo).
  async function syncNumericFromCloud() {
    if (!ready || !currentUser) return;
    for (const w of WATCH) {
      if (!w.key) continue; // pomiń klucze prefiksowe (np. memo)
      try {
        const cloud = await GryScores.best(w.game, { mode: w.mode || '', lowerIsBetter: !!w.lowerIsBetter });
        if (cloud == null) continue;
        let localNum = null;
        try { const lv = localStorage.getItem(w.key); if (lv != null) localNum = parseFloat(lv); } catch (e) { /* noop */ }
        let best = cloud;
        if (localNum != null && isFinite(localNum)) best = w.lowerIsBetter ? Math.min(cloud, localNum) : Math.max(cloud, localNum);
        if (rawSetItem) rawSetItem.call(localStorage, w.key, String(best));
        lastSubmitted[w.key] = best; // nie wysyłaj tej samej wartości z powrotem
      } catch (e) { /* noop */ }
    }
  }

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
      signin: 'Podaj nazwę użytkownika i hasło.',
      signup: 'Wybierz nazwę i hasło, aby zapisywać wyniki w chmurze.',
      reset: 'Podaj e-mail — wyślemy link do zmiany hasła.',
    };
    const showPass = mode !== 'reset';
    const btn = { signin: 'Zaloguj', signup: 'Utwórz konto', reset: 'Wyślij link' }[mode];
    const loginField = mode === 'reset'
      ? '<input type="email" data-f="email" placeholder="ty@example.com" autocomplete="email" />'
      : '<input type="text" data-f="email" placeholder="Nazwa użytkownika (lub e-mail)" autocomplete="username" />';
    return `<div class="gry-modal">
      <button class="gry-close" data-act="close">&times;</button>
      <h2>${titles[mode]}</h2>
      <p class="sub">${subs[mode]}</p>
      ${loginField}
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
      if (!email.trim()) return setErr(mode === 'reset' ? 'Podaj e-mail.' : 'Podaj nazwę użytkownika.');
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
      client = sb.createClient(SUPABASE_URL, SUPABASE_KEY, { db: { schema: 'gry2' } });
      const { data } = await client.auth.getSession();
      currentUser = (data && data.session && data.session.user) || null;
      client.auth.onAuthStateChange((_event, session) => {
        currentUser = (session && session.user) || null;
        notifyChange();
      });
      ready = true;
      injectStyles();
      renderWidget();
      initReflex();
      syncNumericFromCloud();
      GryAuth.onChange(() => syncNumericFromCloud());
      readyCbs.forEach((cb) => { try { cb(); } catch (e) { /* noop */ } });
    } catch (e) {
      console.warn('[GryAuth] init nieudany:', e.message);
      ready = true; // tryb offline / gość
      injectStyles();
      renderWidget();
      initReflex();
      readyCbs.forEach((cb) => { try { cb(); } catch (e2) { /* noop */ } });
    }
  }

  // Reflex: tabela rekordów czytana z chmury (gry2.scores), zapis do chmury,
  // brak zapisu/odczytu z localStorage. Plus auto-uzupełnienie imienia i auto-zapis.
  let reflexCache = {}; // mode -> level -> [{name, score, time, errors, date}]
  function initReflex() {
    const btn = document.getElementById('save-record-btn');
    const input = document.getElementById('player-name-input');
    const section = document.getElementById('save-section');
    if (!btn || !input || !section) return; // to nie strona reflex
    if (typeof window.loadRecords !== 'function') return; // brak leaderboardu

    const subgame = reflexSubgame();
    const lower = !!REFLEX_TIME[subgame];

    // Odczyt rekordów wyłącznie z chmury (podmiana źródła danych gry).
    window.loadRecords = function () { return reflexCache; };
    // Koniec zapisu lokalnego.
    window.saveRecordsToStorage = function () { /* no-op: rekordy trzymamy w chmurze */ };

    // Każdy wpis rekordu zalogowanego gracza leci do chmury (per poziom + total).
    const origAdd = window.addRecord;
    if (typeof origAdd === 'function') {
      window.addRecord = function (mode, levelKey, name, value, errors) {
        origAdd.apply(this, arguments);
        try {
          if (!ready || !currentUser) return;
          const me = String(GryAuth.displayName() || '').trim().toLowerCase();
          if (String(name || '').trim().toLowerCase() !== me) return;
          const v = Number(value);
          if (!isFinite(v)) return;
          const dk = 'radd|' + subgame + '|' + mode + '|' + levelKey + '|' + v;
          if (lastSubmitted[dk]) return;
          lastSubmitted[dk] = 1;
          GryScores.submit('reflex', v, {
            subgame: subgame, mode: mode, level: levelKey,
            errors: (errors != null ? errors : null), lowerIsBetter: lower,
          });
        } catch (e) { /* noop */ }
      };
    }

    // Pobierz wszystkie rekordy tej podgry z chmury i przebuduj cache.
    async function refreshReflexCache() {
      if (!ready || !currentUser || !client) { reflexCache = {}; return; }
      try {
        const { data, error } = await client.from('scores')
          .select('display_name,score,time_seconds,errors,mode,level,created_at')
          .eq('game', 'reflex').eq('subgame', subgame).limit(3000);
        if (error) return;
        const cache = {};
        for (const r of (data || [])) {
          const mode = r.mode || 'adult';
          const lvl = r.level || 'total';
          const v = r.score != null ? Number(r.score) : (r.time_seconds != null ? Number(r.time_seconds) : null);
          if (v == null || !isFinite(v)) continue;
          (cache[mode] = cache[mode] || {});
          (cache[mode][lvl] = cache[mode][lvl] || []);
          const date = r.created_at ? new Date(r.created_at).toLocaleDateString('pl-PL') : '';
          cache[mode][lvl].push({ name: r.display_name || '—', score: v, time: v, errors: (r.errors != null ? r.errors : 0), date: date });
        }
        for (const mode of Object.keys(cache))
          for (const lvl of Object.keys(cache[mode]))
            cache[mode][lvl].sort((a, b) => lower ? (a.score - b.score) : (b.score - a.score));
        reflexCache = cache;
        rerenderRecordsIfOpen();
      } catch (e) { /* noop */ }
    }

    // Odśwież widoczną tabelę rekordów po zaciągnięciu danych.
    function rerenderRecordsIfOpen() {
      const rv = document.getElementById('records-view');
      if (!rv || rv.classList.contains('hidden')) return;
      const modeTab = document.querySelector('.records-mode-tab.bg-blue-600');
      const mode = modeTab ? modeTab.dataset.mode : null;
      if (mode && typeof window.buildPlayerFilter === 'function') { try { window.buildPlayerFilter(mode); } catch (e) { /* noop */ } }
      const lvlTab = document.querySelector('.records-level-tab.bg-green-600');
      if (lvlTab) lvlTab.click(); // ponowny render z aktualnego cache
    }

    // Odśwież cache przy każdym otwarciu tabeli rekordów.
    const origShow = window.showRecordsView;
    if (typeof origShow === 'function') {
      window.showRecordsView = function () { origShow.apply(this, arguments); refreshReflexCache(); };
    }

    // Auto-uzupełnienie imienia + auto-zapis (bez klikania „Zapisz").
    const tryAuto = () => {
      if (section.classList.contains('hidden')) return;
      if (!currentUser) return;           // gość -> ręcznie
      if (btn.disabled) return;           // już zapisano w tym cyklu
      const name = GryAuth.displayName();
      if (name) input.value = name;
      btn.click();                        // -> savePlayerRecord -> addRecord -> chmura
    };
    new MutationObserver(tryAuto).observe(section, { attributes: true, attributeFilter: ['class'] });
    GryAuth.onChange(() => { tryAuto(); refreshReflexCache(); });
    refreshReflexCache();
    tryAuto();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
