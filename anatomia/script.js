/* ═══════════════════════════════════════════════════════════════════
   ANATOM — nauka anatomii człowieka
   Sylwetka w układzie SVG viewBox 0 0 200 384.
   Każda struktura ma współrzędne (x,y) w tym układzie.
   Tryby: "locate" (wskaż klikając) i "identify" (nazwij z opcji).
   4 poziomy: przedszkolak → uczeń → zaawansowany → fizjoterapeuta.
   ═══════════════════════════════════════════════════════════════════ */

// ── Dane: poziomy trudności ─────────────────────────────────────────
// item: { n: nazwa PL, lat?: nazwa łacińska, x, y }
const LEVELS = [
  {
    name: 'Przedszkolak', icon: '🧒', tag: 'Części ciała',
    tol: 30,
    items: [
      { n: 'głowa', x: 100, y: 44 },
      { n: 'oko', x: 90, y: 38 },
      { n: 'nos', x: 100, y: 48 },
      { n: 'usta', x: 100, y: 58 },
      { n: 'ucho', x: 72, y: 44 },
      { n: 'szyja', x: 100, y: 86 },
      { n: 'brzuch', x: 100, y: 198 },
      { n: 'ramię', x: 52, y: 145, h: 80 },
      { n: 'dłoń', x: 42, y: 212 },
      { n: 'noga', x: 84, y: 290, h: 120 },
      { n: 'kolano', x: 84, y: 305 },
      { n: 'stopa', x: 80, y: 376 },
    ],
  },
  {
    name: 'Uczeń', icon: '🎒', tag: 'Narządy wewnętrzne',
    tol: 24,
    items: [
      { n: 'mózg', x: 100, y: 32 },
      { n: 'serce', x: 109, y: 150 },
      { n: 'płuca', x: 82, y: 140 },
      { n: 'żołądek', x: 90, y: 178 },
      { n: 'wątroba', x: 114, y: 172 },
      { n: 'jelita', x: 100, y: 208 },
      { n: 'nerki', x: 82, y: 190 },
      { n: 'pęcherz', x: 100, y: 224 },
      { n: 'kręgosłup', x: 100, y: 185, h: 100 },
      { n: 'przepona', x: 100, y: 162 },
    ],
  },
  {
    name: 'Zaawansowany', icon: '🎓', tag: 'Kości i duże mięśnie',
    tol: 20,
    items: [
      { n: 'czaszka', lat: 'cranium', x: 100, y: 40 },
      { n: 'obojczyk', lat: 'clavicula', x: 86, y: 116 },
      { n: 'żebra', lat: 'costae', x: 100, y: 156 },
      { n: 'kręgosłup', lat: 'columna vertebralis', x: 100, y: 185 },
      { n: 'miednica', lat: 'pelvis', x: 100, y: 230 },
      { n: 'kość udowa', lat: 'femur', x: 84, y: 272 },
      { n: 'rzepka', lat: 'patella', x: 84, y: 305 },
      { n: 'kość piszczelowa', lat: 'tibia', x: 90, y: 338 },
      { n: 'biceps', lat: 'm. biceps brachii', x: 52, y: 142 },
      { n: 'mięsień piersiowy', lat: 'm. pectoralis major', x: 88, y: 134 },
      { n: 'mięsień czworogłowy uda', lat: 'm. quadriceps femoris', x: 84, y: 262 },
      { n: 'mięsień pośladkowy wielki', lat: 'm. gluteus maximus', x: 116, y: 246 },
      { n: 'mięsień brzuchaty łydki', lat: 'm. gastrocnemius', x: 84, y: 336 },
    ],
  },
  {
    name: 'Fizjoterapeuta', icon: '🩺', tag: 'Szczegółowe mięśnie i kości',
    tol: 16,
    items: [
      { n: 'mięsień naramienny', lat: 'm. deltoideus', x: 64, y: 122 },
      { n: 'mięsień dwugłowy ramienia', lat: 'm. biceps brachii', x: 52, y: 142 },
      { n: 'mięsień trójgłowy ramienia', lat: 'm. triceps brachii', x: 58, y: 150 },
      { n: 'mięsień piersiowy większy', lat: 'm. pectoralis major', x: 88, y: 134 },
      { n: 'mięsień prosty brzucha', lat: 'm. rectus abdominis', x: 100, y: 192 },
      { n: 'mięsień czworogłowy uda', lat: 'm. quadriceps femoris', x: 84, y: 262 },
      { n: 'mięsień dwugłowy uda', lat: 'm. biceps femoris', x: 88, y: 274 },
      { n: 'mięsień pośladkowy wielki', lat: 'm. gluteus maximus', x: 116, y: 246 },
      { n: 'mięsień brzuchaty łydki', lat: 'm. gastrocnemius', x: 84, y: 336 },
      { n: 'ścięgno Achillesa', lat: 'tendo calcaneus', x: 86, y: 362 },
      { n: 'kość ramienna', lat: 'humerus', x: 54, y: 138 },
      { n: 'kość promieniowa', lat: 'radius', x: 45, y: 188 },
      { n: 'kość łokciowa', lat: 'ulna', x: 50, y: 192 },
      { n: 'obojczyk', lat: 'clavicula', x: 86, y: 116 },
      { n: 'łopatka', lat: 'scapula', x: 120, y: 126 },
      { n: 'kość udowa', lat: 'femur', x: 84, y: 272 },
      { n: 'rzepka', lat: 'patella', x: 84, y: 305 },
      { n: 'kość piszczelowa', lat: 'tibia', x: 90, y: 338 },
      { n: 'kość strzałkowa', lat: 'fibula', x: 78, y: 338 },
    ],
  },
];

const ROUND = 10;          // pytań na rundę
const SVG_W = 200, SVG_H = 384;

// Struktury parzyste (występują po obu stronach ciała) — akceptujemy klik
// po dowolnej stronie. Pojedyncze/asymetryczne (serce, wątroba, żołądek...) NIE.
const PAIRED = new Set([
  'oko', 'ucho', 'ramię', 'dłoń', 'noga', 'kolano', 'stopa',
  'płuca', 'nerki',
  'obojczyk', 'łopatka', 'rzepka',
  'kość udowa', 'kość piszczelowa', 'kość strzałkowa',
  'kość ramienna', 'kość promieniowa', 'kość łokciowa',
  'biceps', 'mięsień piersiowy', 'mięsień piersiowy większy',
  'mięsień naramienny', 'mięsień dwugłowy ramienia', 'mięsień trójgłowy ramienia',
  'mięsień czworogłowy uda', 'mięsień dwugłowy uda',
  'mięsień pośladkowy wielki', 'mięsień brzuchaty łydki', 'ścięgno Achillesa',
]);

// Zwraca listę poprawnych punktów: dla struktur parzystych także lustrzany (oś x=100)
function itemTargets(item) {
  const t = [{ x: item.x, y: item.y, h: item.h }];
  if (PAIRED.has(item.n) && Math.abs(item.x - 100) > 1) t.push({ x: 200 - item.x, y: item.y, h: item.h });
  return t;
}

// ── Stan ────────────────────────────────────────────────────────────
let levelIdx = 0;
let mode = 'locate';       // 'locate' | 'identify'
let queue = [];            // lista itemów na rundę
let qPos = 0;
let score = 0, streak = 0;
let answered = false;

// ── DOM ─────────────────────────────────────────────────────────────
const screens = {
  start: document.getElementById('screen-start'),
  play: document.getElementById('screen-play'),
  result: document.getElementById('screen-result'),
};
const levelButtons = document.getElementById('level-buttons');
const modeButtons = document.getElementById('mode-buttons');
const promptEl = document.getElementById('prompt');
const qCounter = document.getElementById('q-counter');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const figure = document.getElementById('figure');
const markersG = document.getElementById('markers');
const optionsEl = document.getElementById('options');
const feedbackBar = document.getElementById('feedback-bar');
const btnNext = document.getElementById('btn-next');

const SVGNS = 'http://www.w3.org/2000/svg';

// ── Ekran startowy ──────────────────────────────────────────────────
function buildLevelButtons() {
  levelButtons.innerHTML = '';
  LEVELS.forEach((lv, i) => {
    const b = document.createElement('button');
    b.className = 'opt-btn level-btn' + (i === levelIdx ? ' selected' : '');
    b.dataset.idx = i;
    b.innerHTML = `<span class="opt-icon">${lv.icon}</span>`
      + `<span class="opt-name">${lv.name}</span>`
      + `<span class="opt-tag">${lv.tag}</span>`;
    b.addEventListener('click', () => {
      levelIdx = i;
      [...levelButtons.children].forEach(c => c.classList.toggle('selected', +c.dataset.idx === i));
    });
    levelButtons.appendChild(b);
  });
}

modeButtons.querySelectorAll('.mode-btn').forEach(b => {
  b.addEventListener('click', () => {
    mode = b.dataset.mode;
    modeButtons.querySelectorAll('.mode-btn').forEach(x => x.classList.toggle('selected', x === b));
  });
});

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ── Pomocnicze ──────────────────────────────────────────────────────
function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

function buildQueue() {
  const items = LEVELS[levelIdx].items;
  let q = shuffle(items);
  while (q.length < ROUND) q = q.concat(shuffle(items));
  return q.slice(0, ROUND);
}

function bestKey() { return `anatomia_best_${levelIdx}_${mode}`; }

// ── Start gry ───────────────────────────────────────────────────────
function startGame() {
  queue = buildQueue();
  qPos = 0; score = 0; streak = 0;
  scoreEl.textContent = '0';
  streakEl.textContent = '0';
  showScreen('play');
  nextQuestion();
}

function nextQuestion() {
  answered = false;
  feedbackBar.textContent = ''; feedbackBar.className = 'feedback-bar';
  btnNext.classList.add('hidden');
  markersG.innerHTML = '';
  optionsEl.innerHTML = '';
  figure.classList.remove('no-click');

  const item = queue[qPos];
  qCounter.textContent = `${qPos + 1} / ${ROUND}`;

  if (mode === 'locate') {
    const paired = itemTargets(item).length > 1;
    promptEl.innerHTML = `Wskaż: <b>${item.n}</b>`
      + (item.lat ? ` <span class="lat">(${item.lat})</span>` : '')
      + (paired ? ` <span class="lat">— dowolna strona</span>` : '');
    optionsEl.style.display = 'none';
  } else {
    // identify — podświetl marker (obie strony jeśli parzyste), pokaż opcje
    promptEl.innerHTML = 'Co to za struktura?';
    optionsEl.style.display = 'grid';
    itemTargets(item).forEach(t => drawRing(t.x, t.y));
    buildOptions(item);
  }
}

function drawRing(x, y) {
  const ring = document.createElementNS(SVGNS, 'circle');
  ring.setAttribute('cx', x); ring.setAttribute('cy', y); ring.setAttribute('r', 9);
  ring.setAttribute('class', 'marker-ring');
  markersG.appendChild(ring);
  const dot = document.createElementNS(SVGNS, 'circle');
  dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', 4);
  dot.setAttribute('class', 'marker');
  markersG.appendChild(dot);
}

function drawMarker(x, y, cls) {
  const dot = document.createElementNS(SVGNS, 'circle');
  dot.setAttribute('cx', x); dot.setAttribute('cy', y); dot.setAttribute('r', 6);
  dot.setAttribute('class', 'marker ' + cls);
  markersG.appendChild(dot);
}

function buildOptions(item) {
  const pool = LEVELS[levelIdx].items.filter(it => it.n !== item.n);
  const distractors = shuffle(pool).slice(0, 3);
  const opts = shuffle([item, ...distractors]);
  opts.forEach(o => {
    const b = document.createElement('button');
    b.className = 'ans-btn';
    b.innerHTML = o.lat ? `${o.n}<br><span class="lat" style="font-size:0.72rem;color:var(--muted)">${o.lat}</span>` : o.n;
    b.addEventListener('click', () => {
      if (answered) return;
      const correct = o.n === item.n;
      b.classList.add(correct ? 'correct' : 'wrong');
      if (!correct) {
        [...optionsEl.children].find(c => c.textContent.startsWith(item.n))?.classList.add('correct');
      }
      finishAnswer(correct, item);
    });
    optionsEl.appendChild(b);
  });
}

// ── Tryb "Wskaż": klik na sylwetce ──────────────────────────────────
figure.addEventListener('click', e => {
  if (mode !== 'locate' || answered) return;
  const rect = figure.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (SVG_W / rect.width);
  const y = (e.clientY - rect.top) * (SVG_H / rect.height);
  const item = queue[qPos];
  const targets = itemTargets(item);
  const tol = LEVELS[levelIdx].tol;
  const correct = targets.some(t => {
    if (t.h) return Math.abs(x - t.x) <= tol && y >= t.y - t.h / 2 && y <= t.y + t.h / 2;
    return Math.hypot(x - t.x, y - t.y) <= tol;
  });

  // pokaż klik gracza
  const clk = document.createElementNS(SVGNS, 'circle');
  clk.setAttribute('cx', x); clk.setAttribute('cy', y); clk.setAttribute('r', 5);
  clk.setAttribute('class', 'click-dot');
  markersG.appendChild(clk);
  // pokaż poprawne miejsce(a) — obie strony dla struktur parzystych
  targets.forEach(t => drawMarker(t.x, t.y, correct ? 'correct' : 'wrong'));
  finishAnswer(correct, item);
});

// ── Ocena odpowiedzi ────────────────────────────────────────────────
function finishAnswer(correct, item) {
  answered = true;
  figure.classList.add('no-click');
  if (mode === 'identify') [...optionsEl.children].forEach(c => c.disabled = true);

  if (correct) {
    score++; streak++;
    scoreEl.textContent = score;
    feedbackBar.textContent = '✅ Dobrze!';
    feedbackBar.className = 'feedback-bar ok';
  } else {
    streak = 0;
    const extra = item.lat ? ` (${item.lat})` : '';
    feedbackBar.innerHTML = `❌ To: <b>${item.n}</b>${extra}`;
    feedbackBar.className = 'feedback-bar bad';
  }
  streakEl.textContent = streak;
  btnNext.classList.remove('hidden');
  btnNext.textContent = qPos + 1 >= ROUND ? 'Zobacz wynik →' : 'Dalej →';
}

btnNext.addEventListener('click', () => {
  qPos++;
  if (qPos >= ROUND) showResult();
  else nextQuestion();
});

// ── Wynik ───────────────────────────────────────────────────────────
function showResult() {
  const best = parseInt(localStorage.getItem(bestKey()) || '0', 10);
  const isBest = score > best;
  if (isBest) localStorage.setItem(bestKey(), score);

  document.getElementById('result-score').textContent = `${score} / ${ROUND}`;
  const pct = score / ROUND;
  let emoji, comment;
  if (pct === 1) { emoji = '🏆'; comment = 'Perfekcyjnie! Znasz anatomię na wylot.'; }
  else if (pct >= 0.8) { emoji = '🎉'; comment = 'Świetny wynik!'; }
  else if (pct >= 0.6) { emoji = '👍'; comment = 'Nieźle — jeszcze trochę ćwiczeń.'; }
  else if (pct >= 0.4) { emoji = '📚'; comment = 'Jest nad czym popracować.'; }
  else { emoji = '💪'; comment = 'Spróbuj jeszcze raz — nauka idzie powoli!'; }

  document.getElementById('result-emoji').textContent = emoji;
  document.getElementById('result-comment').textContent =
    `${LEVELS[levelIdx].name} · ${mode === 'locate' ? 'Wskaż' : 'Nazwij'} — ${comment}`;
  document.getElementById('result-best').textContent =
    (isBest ? '🥇 Nowy rekord! ' : '') + `Najlepszy wynik: ${Math.max(best, score)} / ${ROUND}`;
  showScreen('result');
}

// ── Przyciski ───────────────────────────────────────────────────────
document.getElementById('btn-play').addEventListener('click', startGame);
document.getElementById('btn-again').addEventListener('click', startGame);
document.getElementById('btn-menu').addEventListener('click', () => { buildLevelButtons(); showScreen('start'); });

// ── Init ────────────────────────────────────────────────────────────
buildLevelButtons();
