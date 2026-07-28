/* ═══════════════════════════════════════════════════════════════════
   IMMUNO — Obrona Organizmu
   Tower defense: jesteś układem odpornościowym. Rozstawiaj komórki
   obronne wzdłuż naczyń, by patogeny nie dotarły do narządu.
   Ręczne mapy (narządy) → potem nieskończony tryb proceduralny.
   ═══════════════════════════════════════════════════════════════════ */

// ── Siatka / wymiary ────────────────────────────────────────────────
const COLS = 16, ROWS = 10, CELL = 44;
const W = COLS * CELL, H = ROWS * CELL;

const canvas = document.getElementById('board');
canvas.width = W; canvas.height = H;
const ctx = canvas.getContext('2d');

// ── Wieże (komórki obronne) ─────────────────────────────────────────
const TOWERS = {
  limfocyt: { name: 'Limfocyt T', icon: '🛡️', cost: 50, range: 2.5 * CELL, dmg: 18, fireMs: 680, projSpeed: 7, color: '#2dd4bf', pierce: false,
    desc: 'Zrównoważony obrońca. Dobry na start.' },
  antibody: { name: 'Przeciwciało', icon: '🎯', cost: 40, range: 2.2 * CELL, dmg: 7, fireMs: 260, projSpeed: 9, color: '#38bdf8', pierce: false,
    desc: 'Szybkostrzelne, słabe. Na roje wirusów.' },
  makrofag: { name: 'Makrofag', icon: '🦠', cost: 85, range: 3.1 * CELL, dmg: 58, fireMs: 1250, projSpeed: 6, color: '#a78bfa', pierce: true,
    desc: 'Wolny, mocny, przebija pancerz zarodników.' },
};
const TOWER_KEYS = Object.keys(TOWERS);
const MAX_LEVEL = 3;

// ── Patogeny (wrogowie) ─────────────────────────────────────────────
const ENEMIES = {
  wirus:    { name: 'Wirus',    hp: 28,  speed: 1.7, reward: 6,  damage: 1, armor: 0,    color: '#f87171', r: 9,  shape: 'virus' },
  bakteria: { name: 'Bakteria', hp: 64,  speed: 1.05, reward: 9, damage: 1, armor: 0,    color: '#fb923c', r: 11, shape: 'rod' },
  zarodnik: { name: 'Zarodnik', hp: 170, speed: 0.62, reward: 17, damage: 2, armor: 0.5, color: '#c084fc', r: 13, shape: 'spore' },
};

// ── Mapy ręczne (narządy) ───────────────────────────────────────────
const HAND_MAPS = [
  { name: 'Skóra', blurb: 'Pierwsza linia obrony. Patogeny wdarły się przez ranę — nie wpuść ich głębiej.',
    env: '#1b2e22', vessel: '#3f6f52', waves: 5,
    path: [[-1,2],[3,2],[3,7],[8,7],[8,3],[13,3],[13,7],[16,7]] },
  { name: 'Gardło', blurb: 'Ciasne błony śluzowe. Bakterie próbują się zagnieździć.',
    env: '#2e1b24', vessel: '#7a3f55', waves: 6,
    path: [[-1,5],[2,5],[2,1],[7,1],[7,8],[11,8],[11,4],[16,4]] },
  { name: 'Płuca', blurb: 'Rozgałęzione oskrzela. Fala za falą napływa z powietrzem.',
    env: '#16242e', vessel: '#3f6b8a', waves: 7,
    path: [[-1,1],[4,1],[4,5],[1,5],[1,8],[9,8],[9,2],[13,2],[13,8],[16,8]] },
  { name: 'Jelita', blurb: 'Kręte kosmki jelitowe. Tu kryją się wytrzymałe zarodniki.',
    env: '#2e2616', vessel: '#8a6f3f', waves: 8,
    path: [[-1,8],[3,8],[3,2],[6,2],[6,7],[9,7],[9,2],[12,2],[12,7],[16,7]] },
  { name: 'Krwiobieg', blurb: 'Główna autostrada organizmu. Patogeny mkną do serca.',
    env: '#2e1616', vessel: '#8a3f3f', waves: 9,
    path: [[-1,4],[5,4],[5,1],[10,1],[10,8],[2,8],[2,6],[14,6],[14,3],[16,3]] },
  { name: 'Węzeł chłonny', blurb: 'Serce układu odpornościowego. Tu musisz zatrzymać inwazję.',
    env: '#241630', vessel: '#6f3f8a', waves: 10,
    path: [[-1,2],[2,2],[2,8],[5,8],[5,2],[8,2],[8,8],[11,8],[11,2],[14,2],[14,8],[16,8]] },
];

const ENDLESS_ORGANS = ['Wątroba','Nerki','Śledziona','Trzustka','Żołądek','Szpik kostny','Mózg','Serce','Tarczyca','Pęcherz'];
const ENDLESS_ENV = ['#16242e','#2e1b24','#1b2e22','#2e2616','#241630','#2e1616'];
const ENDLESS_VESSEL = ['#3f6b8a','#7a3f55','#3f6f52','#8a6f3f','#6f3f8a','#8a3f3f'];

// ── Stan ────────────────────────────────────────────────────────────
let level = 1;
let map = null;
let pathCells = new Set();
let pathPx = [];            // piksele-węzły trasy
let towers = [];            // {c,r,x,y,type,lvl,spent,lastFire}
let enemies = [];
let projectiles = [];
let occupied = new Set();

let money = 120, lives = 20;
let waveIndex = 0;          // numer fali w bieżącym poziomie (0 = jeszcze nie startowano)
let totalWavesCleared = 0;  // globalnie — do skalowania trudności
let waveActive = false;
let spawnQueue = [];
let spawnTimer = 0;
let bestLevel = parseInt(localStorage.getItem('imuno_hi_level') || '1', 10);

let selectedBuild = null;   // typ do postawienia
let selectedTower = null;   // postawiona wieża (panel)
let hoverCell = null;
let running = false;
let lastTs = 0;

// ── DOM ─────────────────────────────────────────────────────────────
const organNameEl = document.getElementById('organ-name');
const levelEl = document.getElementById('level-display');
const waveEl = document.getElementById('wave-display');
const moneyEl = document.getElementById('money-display');
const livesEl = document.getElementById('lives-display');
const bestEl = document.getElementById('best-display');
const startWaveBtn = document.getElementById('start-wave-btn');
const towerButtonsEl = document.getElementById('tower-buttons');
const towerPanel = document.getElementById('tower-panel');
const panelTitle = document.getElementById('panel-title');
const panelStats = document.getElementById('panel-stats');
const btnUpgrade = document.getElementById('btn-upgrade');
const btnSell = document.getElementById('btn-sell');
const banner = document.getElementById('organ-banner');
const overlay = document.getElementById('overlay');
const ovTitle = document.getElementById('ov-title');
const ovText = document.getElementById('ov-text');
const ovBtn = document.getElementById('ov-btn');

// ── Pomocnicze ──────────────────────────────────────────────────────
function cellCenter(c, r) { return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 }; }
function key(c, r) { return c + ',' + r; }

// Buduje listę komórek trasy oraz piksele-węzły z węzłów mapy
function buildPath(waypoints) {
  pathCells = new Set();
  pathPx = waypoints.map(([c, r]) => cellCenter(c, r));
  for (let i = 0; i < waypoints.length - 1; i++) {
    let [c1, r1] = waypoints[i], [c2, r2] = waypoints[i + 1];
    const dc = Math.sign(c2 - c1), dr = Math.sign(r2 - r1);
    let c = c1, r = r1;
    while (c !== c2 || r !== r2) {
      if (c >= 0 && c < COLS && r >= 0 && r < ROWS) pathCells.add(key(c, r));
      c += dc; r += dr;
    }
    if (c2 >= 0 && c2 < COLS && r2 >= 0 && r2 < ROWS) pathCells.add(key(c2, r2));
  }
}

// Proceduralna mapa dla poziomów > liczby ręcznych
function generateMap(lvl) {
  const stops = [];
  let c = 1 + Math.floor(Math.random() * 2);
  while (c < COLS - 1) { stops.push(c); c += 2 + Math.floor(Math.random() * 3); }
  let r = 1 + Math.floor(Math.random() * (ROWS - 2));
  const wp = [[-1, r]];
  for (const col of stops) {
    wp.push([col, r]);
    let nr;
    do { nr = 1 + Math.floor(Math.random() * (ROWS - 2)); } while (Math.abs(nr - r) < 2);
    wp.push([col, nr]);
    r = nr;
  }
  wp.push([COLS, r]);
  const idx = (lvl - 1) % ENDLESS_ORGANS.length;
  const cycle = Math.floor((lvl - 1) / ENDLESS_ORGANS.length);
  const name = ENDLESS_ORGANS[idx] + (cycle > 0 ? ` (mutacja ${cycle + 1})` : '');
  return {
    name, blurb: 'Patogeny zmutowały i atakują kolejny narząd. Trudność rośnie!',
    env: ENDLESS_ENV[idx % ENDLESS_ENV.length], vessel: ENDLESS_VESSEL[idx % ENDLESS_VESSEL.length],
    waves: 8 + Math.floor(Math.random() * 7), path: wp,
  };
}

function getMap(lvl) {
  return lvl <= HAND_MAPS.length ? HAND_MAPS[lvl - 1] : generateMap(lvl);
}

// ── Inicjalizacja poziomu ───────────────────────────────────────────
function startLevel(lvl) {
  level = lvl;
  map = getMap(lvl);
  buildPath(map.path);
  towers = []; enemies = []; projectiles = []; occupied = new Set();
  waveIndex = 0; waveActive = false; spawnQueue = []; spawnTimer = 0;
  money = 110 + lvl * 12;
  lives = 20;
  selectedBuild = TOWER_KEYS[0];
  selectedTower = null;
  updateHud();
  renderTowerButtons();
  hideTowerPanel();
  startWaveBtn.disabled = false;
  startWaveBtn.textContent = '▶ Rozpocznij Falę 1';
  showBanner(map.name, map.blurb);
}

function showBanner(title, text) {
  banner.innerHTML = `<h2>${title}</h2><p>${text}</p>`;
  banner.classList.add('show');
  setTimeout(() => banner.classList.remove('show'), 2200);
}

// ── HUD / UI ────────────────────────────────────────────────────────
function updateHud() {
  organNameEl.textContent = map ? map.name : '—';
  levelEl.textContent = level;
  waveEl.textContent = `${Math.min(waveIndex, map ? map.waves : 0)} / ${map ? map.waves : 0}`;
  moneyEl.textContent = money;
  livesEl.textContent = lives;
  livesEl.style.color = lives > 10 ? 'var(--green)' : lives > 4 ? 'var(--gold)' : 'var(--red)';
  bestEl.textContent = bestLevel;
}

function renderTowerButtons() {
  towerButtonsEl.innerHTML = '';
  TOWER_KEYS.forEach(k => {
    const t = TOWERS[k];
    const div = document.createElement('div');
    div.className = 'tower-btn' + (selectedBuild === k ? ' selected' : '') + (money < t.cost ? ' cant' : '');
    div.innerHTML = `<div class="tb-icon">${t.icon}</div><div class="tb-name">${t.name}</div>`
      + `<div class="tb-cost">⚡${t.cost}</div><div class="tb-desc">${t.desc}</div>`;
    div.addEventListener('click', () => {
      selectedBuild = k; selectedTower = null;
      hideTowerPanel(); renderTowerButtons();
    });
    towerButtonsEl.appendChild(div);
  });
}

function showTowerPanel(tw) {
  selectedTower = tw; selectedBuild = null;
  renderTowerButtons();
  towerPanel.classList.remove('hidden');
  const base = TOWERS[tw.type];
  const s = towerStats(tw);
  panelTitle.textContent = `${base.icon} ${base.name} — poziom ${tw.lvl}`;
  panelStats.innerHTML = `Obrażenia: <b>${Math.round(s.dmg)}</b> · Zasięg: <b>${(s.range / CELL).toFixed(1)}</b> · Tempo: <b>${(1000 / s.fireMs).toFixed(1)}/s</b>`;
  if (tw.lvl < MAX_LEVEL) {
    const uc = upgradeCost(tw);
    btnUpgrade.textContent = `Ulepsz (⚡${uc})`;
    btnUpgrade.disabled = money < uc;
  } else {
    btnUpgrade.textContent = 'Maks. poziom';
    btnUpgrade.disabled = true;
  }
  btnSell.textContent = `Sprzedaj (⚡${sellValue(tw)})`;
}
function hideTowerPanel() { towerPanel.classList.add('hidden'); selectedTower = null; }

// ── Statystyki / ekonomia wież ──────────────────────────────────────
function towerStats(tw) {
  const b = TOWERS[tw.type];
  const m = tw.lvl - 1;
  return {
    dmg: b.dmg * Math.pow(1.6, m),
    range: b.range * Math.pow(1.12, m),
    fireMs: b.fireMs * Math.pow(0.85, m),
    projSpeed: b.projSpeed, color: b.color, pierce: b.pierce,
  };
}
function upgradeCost(tw) { return Math.round(TOWERS[tw.type].cost * tw.lvl * 0.8); }
function sellValue(tw) { return Math.round(tw.spent * 0.7); }

// ── Budowa / interakcja ─────────────────────────────────────────────
function pointerCell(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) * (W / rect.width);
  const y = (clientY - rect.top) * (H / rect.height);
  return { c: Math.floor(x / CELL), r: Math.floor(y / CELL), x, y };
}

function handleClick(clientX, clientY) {
  const { c, r } = pointerCell(clientX, clientY);
  if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return;

  const existing = towers.find(t => t.c === c && t.r === r);
  if (existing) { showTowerPanel(existing); return; }

  // puste pole — postaw, jeśli wybrano typ
  if (!selectedBuild) { hideTowerPanel(); return; }
  if (pathCells.has(key(c, r)) || occupied.has(key(c, r))) return;
  const base = TOWERS[selectedBuild];
  if (money < base.cost) return;

  const { x, y } = cellCenter(c, r);
  money -= base.cost;
  towers.push({ c, r, x, y, type: selectedBuild, lvl: 1, spent: base.cost, lastFire: 0 });
  occupied.add(key(c, r));
  hideTowerPanel();
  updateHud(); renderTowerButtons();
}

canvas.addEventListener('click', e => handleClick(e.clientX, e.clientY));
canvas.addEventListener('mousemove', e => { hoverCell = pointerCell(e.clientX, e.clientY); });
canvas.addEventListener('mouseleave', () => { hoverCell = null; });

btnUpgrade.addEventListener('click', () => {
  const tw = selectedTower; if (!tw || tw.lvl >= MAX_LEVEL) return;
  const uc = upgradeCost(tw);
  if (money < uc) return;
  money -= uc; tw.spent += uc; tw.lvl++;
  updateHud(); renderTowerButtons(); showTowerPanel(tw);
});

btnSell.addEventListener('click', () => {
  const tw = selectedTower; if (!tw) return;
  money += sellValue(tw);
  occupied.delete(key(tw.c, tw.r));
  towers = towers.filter(t => t !== tw);
  hideTowerPanel(); updateHud(); renderTowerButtons();
});

// ── Fale ────────────────────────────────────────────────────────────
function startWave() {
  if (waveActive || !map) return;
  if (waveIndex >= map.waves) return;
  waveIndex++;
  waveActive = true;
  startWaveBtn.disabled = true;
  hideTowerPanel();
  spawnQueue = buildWave(waveIndex);
  spawnTimer = 0;
  updateHud();
}
startWaveBtn.addEventListener('click', startWave);

function buildWave(wIdx) {
  const isLast = wIdx === map.waves;
  const count = 6 + wIdx * 2 + Math.floor(level * 0.7);
  const hpMul = (1 + 0.11 * totalWavesCleared) * (1 + 0.16 * (level - 1));
  const q = [];
  for (let i = 0; i < count; i++) {
    let type;
    const roll = Math.random();
    if (wIdx <= 2 && level <= 2) type = roll < 0.75 ? 'wirus' : 'bakteria';
    else if (isLast) type = roll < 0.4 ? 'zarodnik' : (roll < 0.7 ? 'bakteria' : 'wirus');
    else type = roll < 0.5 ? 'wirus' : (roll < 0.82 ? 'bakteria' : 'zarodnik');
    q.push({ type, hpMul });
  }
  return q;
}

function spawnEnemy(type, hpMul) {
  const b = ENEMIES[type];
  enemies.push({
    type, x: pathPx[0].x, y: pathPx[0].y, seg: 0, t: 0,
    hp: b.hp * hpMul, maxHp: b.hp * hpMul,
    speed: b.speed, reward: b.reward, damage: b.damage, armor: b.armor,
    color: b.color, r: b.r, shape: b.shape, slow: 0,
  });
}

// ── Logika klatki ───────────────────────────────────────────────────
function update(dt) {
  // spawnowanie
  if (waveActive && spawnQueue.length) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      const e = spawnQueue.shift();
      spawnEnemy(e.type, e.hpMul);
      spawnTimer = Math.max(280, 620 - level * 12);
    }
  }

  // ruch wrogów po trasie
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    let step = e.speed * (dt / 16.67) * (e.slow > 0 ? 0.5 : 1);
    if (e.slow > 0) e.slow -= dt;
    while (step > 0 && e.seg < pathPx.length - 1) {
      const a = pathPx[e.seg], bp = pathPx[e.seg + 1];
      const dx = bp.x - e.x, dy = bp.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d <= step) { e.x = bp.x; e.y = bp.y; e.seg++; step -= d; }
      else { e.x += dx / d * step; e.y += dy / d * step; step = 0; }
    }
    e.progress = e.seg + (e.seg < pathPx.length - 1 ?
      1 - Math.hypot(pathPx[e.seg + 1].x - e.x, pathPx[e.seg + 1].y - e.y) /
          Math.max(1, Math.hypot(pathPx[e.seg + 1].x - pathPx[e.seg].x, pathPx[e.seg + 1].y - pathPx[e.seg].y)) : 0);

    if (e.seg >= pathPx.length - 1) {        // dotarł do narządu
      lives -= e.damage;
      enemies.splice(i, 1);
      updateHud();
      if (lives <= 0) { gameOver(); return; }
    }
  }

  // wieże strzelają
  for (const tw of towers) {
    tw.lastFire += dt;
    const s = towerStats(tw);
    if (tw.lastFire < s.fireMs) continue;
    // cel: najdalej na trasie w zasięgu
    let target = null, best = -1;
    for (const e of enemies) {
      const d = Math.hypot(e.x - tw.x, e.y - tw.y);
      if (d <= s.range && e.progress > best) { best = e.progress; target = e; }
    }
    if (target) {
      tw.lastFire = 0;
      projectiles.push({ x: tw.x, y: tw.y, target, speed: s.projSpeed, dmg: s.dmg, pierce: s.pierce, color: s.color });
    }
  }

  // pociski
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (!p.target || p.target.hp <= 0 || !enemies.includes(p.target)) { projectiles.splice(i, 1); continue; }
    const dx = p.target.x - p.x, dy = p.target.y - p.y;
    const d = Math.hypot(dx, dy);
    const step = p.speed * (dt / 16.67) * 2;
    if (d <= step) {
      let dmg = p.dmg;
      if (p.target.armor > 0 && !p.pierce) dmg *= (1 - p.target.armor);
      p.target.hp -= dmg;
      if (p.target.hp <= 0) {
        money += p.target.reward;
        enemies.splice(enemies.indexOf(p.target), 1);
        updateHud(); renderTowerButtons();
        if (selectedTower) showTowerPanel(selectedTower);
      }
      projectiles.splice(i, 1);
    } else { p.x += dx / d * step; p.y += dy / d * step; }
  }

  // koniec fali / poziomu
  if (waveActive && spawnQueue.length === 0 && enemies.length === 0) {
    waveActive = false;
    totalWavesCleared++;
    money += 18 + waveIndex * 5;
    updateHud(); renderTowerButtons();
    if (waveIndex >= map.waves) levelComplete();
    else { startWaveBtn.disabled = false; startWaveBtn.textContent = `▶ Rozpocznij Falę ${waveIndex + 1}`; }
  }
}

function levelComplete() {
  if (level + 1 > bestLevel) { bestLevel = level + 1; localStorage.setItem('imuno_hi_level', bestLevel); }
  running = false;
  ovTitle.textContent = '✅ Narząd ocalony!';
  ovText.textContent = `Oczyściłeś: ${map.name}.\nPozostała integralność: ${lives}.\nKolejny narząd czeka na obronę — trudność rośnie.`;
  ovBtn.textContent = `Broń: poziom ${level + 1} →`;
  ovBtn.onclick = () => { overlay.classList.add('hidden'); startLevel(level + 1); running = true; };
  overlay.classList.remove('hidden');
}

function gameOver() {
  running = false; waveActive = false;
  ovTitle.textContent = '💀 Organizm pokonany';
  ovText.textContent = `Patogeny przełamały obronę na poziomie ${level} (${map.name}).\nOsiągnięty poziom: ${level}\nRekord: ${bestLevel}`;
  ovBtn.textContent = '🔄 Zagraj ponownie';
  ovBtn.onclick = () => { overlay.classList.add('hidden'); startLevel(1); running = true; };
  overlay.classList.remove('hidden');
}

// ── Rysowanie ───────────────────────────────────────────────────────
function draw() {
  // tło narządu
  ctx.fillStyle = map ? map.env : '#0a0f14';
  ctx.fillRect(0, 0, W, H);

  // delikatna siatka pól do budowy
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, H); ctx.stroke(); }
  for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(W, r * CELL); ctx.stroke(); }

  // naczynie (trasa)
  if (pathPx.length) {
    ctx.strokeStyle = map.vessel;
    ctx.lineWidth = CELL * 0.8;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(pathPx[0].x, pathPx[0].y);
    for (let i = 1; i < pathPx.length; i++) ctx.lineTo(pathPx[i].x, pathPx[i].y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = CELL * 0.5;
    ctx.stroke();
    // rdzeń narządu (cel) na końcu
    const end = pathPx[pathPx.length - 1];
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(end.x, end.y, CELL * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.arc(end.x - 4, end.y - 4, CELL * 0.18, 0, Math.PI * 2); ctx.fill();
  }

  // podgląd budowy / zasięgu
  if (hoverCell && selectedBuild && !towers.find(t => t.c === hoverCell.c && t.r === hoverCell.r)) {
    const { c, r } = hoverCell;
    if (c >= 0 && c < COLS && r >= 0 && r < ROWS) {
      const ok = !pathCells.has(key(c, r)) && !occupied.has(key(c, r)) && money >= TOWERS[selectedBuild].cost;
      const ctr = cellCenter(c, r);
      ctx.fillStyle = ok ? 'rgba(45,212,191,0.18)' : 'rgba(239,68,68,0.18)';
      ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      if (ok) {
        ctx.strokeStyle = 'rgba(45,212,191,0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(ctr.x, ctr.y, TOWERS[selectedBuild].range, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }

  // zasięg wybranej wieży
  if (selectedTower) {
    const s = towerStats(selectedTower);
    ctx.strokeStyle = 'rgba(56,189,248,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(selectedTower.x, selectedTower.y, s.range, 0, Math.PI * 2); ctx.stroke();
  }

  // wieże
  for (const tw of towers) drawTower(tw);

  // wrogowie
  for (const e of enemies) drawEnemy(e);

  // pociski
  for (const p of projectiles) {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.pierce ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawTower(tw) {
  const b = TOWERS[tw.type];
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.roundRect(tw.c * CELL + 4, tw.r * CELL + 4, CELL - 8, CELL - 8, 8); ctx.fill();
  ctx.fillStyle = b.color;
  ctx.beginPath(); ctx.arc(tw.x, tw.y, CELL * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(tw.x - 4, tw.y - 4, CELL * 0.10, 0, Math.PI * 2); ctx.fill();
  // poziomy (kropki)
  ctx.fillStyle = '#fff';
  for (let i = 0; i < tw.lvl; i++) {
    ctx.beginPath(); ctx.arc(tw.x - 8 + i * 8, tw.y + CELL * 0.30, 2.2, 0, Math.PI * 2); ctx.fill();
  }
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.color;
  if (e.shape === 'virus') {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
      ctx.strokeStyle = e.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * e.r, Math.sin(a) * e.r);
      ctx.lineTo(Math.cos(a) * (e.r + 4), Math.sin(a) * (e.r + 4)); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.fill();
  } else if (e.shape === 'rod') {
    ctx.beginPath(); ctx.roundRect(-e.r, -e.r * 0.55, e.r * 2, e.r * 1.1, e.r * 0.55); ctx.fill();
  } else { // spore — opancerzony sześciokąt
    ctx.beginPath();
    for (let a = 0; a < 6; a++) { const ang = a / 6 * Math.PI * 2; const fn = a === 0 ? 'moveTo' : 'lineTo'; ctx[fn](Math.cos(ang) * e.r, Math.sin(ang) * e.r); }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2.5; ctx.stroke();
  }
  ctx.restore();
  // pasek życia
  if (e.hp < e.maxHp) {
    const w = e.r * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(e.x - w / 2, e.y - e.r - 8, w, 3);
    ctx.fillStyle = '#22c55e'; ctx.fillRect(e.x - w / 2, e.y - e.r - 8, w * (e.hp / e.maxHp), 3);
  }
}

// ── Pętla ───────────────────────────────────────────────────────────
function loop(ts) {
  const dt = Math.min(50, ts - lastTs || 16);
  lastTs = ts;
  if (running) update(dt);
  draw();
  requestAnimationFrame(loop);
}

// ── Start ───────────────────────────────────────────────────────────
function showIntro() {
  ovTitle.textContent = '🦠 IMMUNO';
  ovText.textContent = 'Organizm został zaatakowany. Jesteś dowódcą układu odpornościowego!\n\n'
    + 'Rozstawiaj komórki obronne wzdłuż naczyń, by patogeny nie dotarły do narządu (czerwony rdzeń). '
    + 'Ulepszaj i sprzedawaj komórki, przechodź kolejne narządy — trudność rośnie bez końca.';
  ovBtn.textContent = 'Rozpocznij obronę';
  ovBtn.onclick = () => { overlay.classList.add('hidden'); startLevel(1); running = true; };
  overlay.classList.remove('hidden');
}

bestEl.textContent = bestLevel;
showIntro();
requestAnimationFrame(loop);
