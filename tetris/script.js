/* ================================================================
   TETRIS  –  single-file Vanilla JS  |  @twoznia
   ================================================================ */

// ── Constants ────────────────────────────────────────────────────
const COLS  = 10;
const ROWS  = 20;
const CELL  = 30;           // base cell size in px (may be scaled)

// Points per line-clear at level 1 (×level afterwards)
const LINE_POINTS = [0, 100, 300, 500, 800];

// Gravity (ms per row) per level (capped at 20)
function gravityMs(level) {
  // Tetris guideline formula: (0.8 - (level-1)*0.007)^(level-1) seconds
  const l = Math.min(level, 20);
  return Math.pow(0.8 - (l - 1) * 0.007, l - 1) * 1000;
}

// ── Tetrominoes ──────────────────────────────────────────────────
// Each shape is an array of 4 rotations; each rotation is a 4-row mask
const TETROMINOES = {
  I: {
    color: 'var(--I)',
    states: [
      [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
      [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
    ]
  },
  O: {
    color: 'var(--O)',
    states: [
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
    ]
  },
  T: {
    color: 'var(--T)',
    states: [
      [[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
    ]
  },
  S: {
    color: 'var(--S)',
    states: [
      [[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],
      [[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],
      [[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]],
    ]
  },
  Z: {
    color: 'var(--Z)',
    states: [
      [[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],
      [[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]],
    ]
  },
  J: {
    color: 'var(--J)',
    states: [
      [[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]],
    ]
  },
  L: {
    color: 'var(--L)',
    states: [
      [[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],
      [[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],
      [[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],
      [[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],
    ]
  },
};

// SRS wall-kick data (non-I pieces)
const KICKS = {
  '0>1': [[-1,0],[-1,1],[0,-2],[-1,-2]],
  '1>0': [[ 1,0],[ 1,-1],[0, 2],[ 1, 2]],
  '1>2': [[ 1,0],[ 1,-1],[0, 2],[ 1, 2]],
  '2>1': [[-1,0],[-1, 1],[0,-2],[-1,-2]],
  '2>3': [[ 1,0],[ 1, 1],[0,-2],[ 1,-2]],
  '3>2': [[-1,0],[-1,-1],[0, 2],[-1, 2]],
  '3>0': [[-1,0],[-1,-1],[0, 2],[-1, 2]],
  '0>3': [[ 1,0],[ 1, 1],[0,-2],[ 1,-2]],
};
// SRS wall-kick data for I piece
const KICKS_I = {
  '0>1': [[-2,0],[ 1,0],[-2,-1],[ 1, 2]],
  '1>0': [[ 2,0],[-1,0],[ 2, 1],[-1,-2]],
  '1>2': [[-1,0],[ 2,0],[-1, 2],[ 2,-1]],
  '2>1': [[ 1,0],[-2,0],[ 1,-2],[-2, 1]],
  '2>3': [[ 2,0],[-1,0],[ 2, 1],[-1,-2]],
  '3>2': [[-2,0],[ 1,0],[-2,-1],[ 1, 2]],
  '3>0': [[ 1,0],[-2,0],[ 1,-2],[-2, 1]],
  '0>3': [[-1,0],[ 2,0],[-1, 2],[ 2,-1]],
};

// ── DOM ──────────────────────────────────────────────────────────
const boardCanvas  = document.getElementById('board');
const ctx          = boardCanvas.getContext('2d');
const nextCanvas   = document.getElementById('nextCanvas');
const nctx         = nextCanvas.getContext('2d');
const holdCanvas   = document.getElementById('holdCanvas');
const hctx         = holdCanvas.getContext('2d');
const wrapper      = document.getElementById('wrapper');

const overlay      = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMsg   = document.getElementById('overlayMsg');
const overlayScore = document.getElementById('overlayScore');
const finalScore   = document.getElementById('finalScore');
const overlayBtn   = document.getElementById('overlayBtn');

const scoreDisplay = document.getElementById('scoreDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const linesDisplay = document.getElementById('linesDisplay');

// ── State ────────────────────────────────────────────────────────
let board, bag, nextQueue, held, holdUsed;
let current, ghostY;
let score, level, lines;
let state;          // 'idle' | 'playing' | 'paused' | 'gameover'
let lastTime, gravityAccum, lockDelay, lockTimer;
let flashRows;      // array of rows being cleared (for animation)
let flashTimer;

const LOCK_DELAY = 500;    // ms before locking after landing
const NEXT_PREVIEW = 3;    // how many next pieces to show

// ── Board helpers ────────────────────────────────────────────────
function emptyBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function cellColor(type) {
  return TETROMINOES[type]?.color ?? null;
}

// ── Bag / random generator (7-bag) ──────────────────────────────
function newBag() {
  const pieces = Object.keys(TETROMINOES);
  // Fisher-Yates shuffle
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

function nextPiece() {
  if (bag.length < NEXT_PREVIEW + 1) bag = bag.concat(newBag());
  const type = bag.shift();
  return { type, rot: 0, x: 3, y: -1 };
}

// ── Collision ────────────────────────────────────────────────────
function shape(piece) {
  return TETROMINOES[piece.type].states[piece.rot];
}

function collides(piece, dx = 0, dy = 0, rot = piece.rot) {
  const s = TETROMINOES[piece.type].states[rot];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!s[r][c]) continue;
      const nx = piece.x + c + dx;
      const ny = piece.y + r + dy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

// ── Ghost piece ──────────────────────────────────────────────────
function calcGhost() {
  let dy = 0;
  while (!collides(current, 0, dy + 1)) dy++;
  return current.y + dy;
}

// ── Rotation (SRS) ───────────────────────────────────────────────
function rotatePiece(dir) {
  // dir: 1 = CW, -1 = CCW
  const numStates = 4;
  const from = current.rot;
  const to = (from + dir + numStates) % numStates;
  const key = `${from}>${to}`;
  const kicks = current.type === 'I' ? KICKS_I : KICKS;
  const tests = kicks[key] ?? [];

  // Try base position first
  if (!collides(current, 0, 0, to)) {
    current.rot = to;
    return true;
  }
  // Try wall kicks
  for (const [kx, ky] of tests) {
    if (!collides(current, kx, ky, to)) {
      current.x += kx;
      current.y += ky;
      current.rot = to;
      return true;
    }
  }
  return false; // rotation failed
}

// ── Lock piece ───────────────────────────────────────────────────
function lockPiece() {
  const s = shape(current);
  let topRow = ROWS;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!s[r][c]) continue;
      const ny = current.y + r;
      const nx = current.x + c;
      if (ny < 0) { gameOver(); return; }  // piece above top = game over
      board[ny][nx] = current.type;
      if (ny < topRow) topRow = ny;
    }
  }
  clearLines();
}

// ── Line clears ──────────────────────────────────────────────────
function clearLines() {
  const full = [];
  for (let r = 0; r < ROWS; r++) {
    if (board[r].every(c => c !== 0)) full.push(r);
  }
  if (full.length === 0) {
    spawnNext();
    return;
  }
  // Flash animation then remove
  flashRows = full;
  flashTimer = 200; // ms to show flash
  // Pause gravity during flash
  state = 'flashing';
}

function applyLineClear() {
  const count = flashRows.length;
  // Remove full rows (filter preserves correct indices)
  board = board.filter((_, r) => !flashRows.includes(r));
  // Add empty rows at top
  for (let i = 0; i < count; i++) board.unshift(new Array(COLS).fill(0));

  // Scoring
  lines += count;
  score += LINE_POINTS[count] * level;
  level = Math.floor(lines / 10) + 1;

  scoreDisplay.textContent = score.toLocaleString();
  levelDisplay.textContent = level;
  linesDisplay.textContent = lines;

  flashRows = [];
  spawnNext();
}

// ── Spawn next piece ─────────────────────────────────────────────
function spawnNext() {
  current = nextQueue.shift();
  nextQueue.push(nextPiece());
  holdUsed = false;
  gravityAccum = 0;
  lockTimer = 0;

  if (collides(current, 0, 0)) {
    gameOver();
  } else {
    state = 'playing';
  }
}

// ── Hold ─────────────────────────────────────────────────────────
function holdPiece() {
  if (holdUsed) return;
  holdUsed = true;
  const prev = held;
  held = current.type;
  if (prev) {
    current = { type: prev, rot: 0, x: 3, y: -1 };
    if (collides(current)) { gameOver(); return; }
    gravityAccum = 0;
    lockTimer = 0;
  } else {
    spawnNext();
  }
}

// ── Hard drop ────────────────────────────────────────────────────
function hardDrop() {
  let dropped = 0;
  while (!collides(current, 0, 1)) {
    current.y++;
    dropped++;
  }
  score += dropped * 2;
  scoreDisplay.textContent = score.toLocaleString();
  lockPiece();
  // Shake animation
  boardCanvas.parentElement.classList.remove('shake');
  // Force reflow to restart animation
  void boardCanvas.parentElement.offsetWidth;
  boardCanvas.parentElement.classList.add('shake');
}

// ── Game over ────────────────────────────────────────────────────
function gameOver() {
  state = 'gameover';
  overlayTitle.textContent = 'Game Over';
  overlayMsg.style.display = 'none';
  overlayScore.style.display = 'block';
  finalScore.textContent = score.toLocaleString();
  overlayBtn.textContent = '↺ Zagraj ponownie';
  overlay.style.display = 'flex';
}

// ── Init game ────────────────────────────────────────────────────
function initGame() {
  board      = emptyBoard();
  bag        = newBag();
  nextQueue  = [];
  held       = null;
  holdUsed   = false;
  score      = 0;
  level      = 1;
  lines      = 0;
  flashRows  = [];
  flashTimer = 0;
  gravityAccum = 0;
  lockTimer    = 0;
  lastTime     = null;

  // Pre-fill next queue
  for (let i = 0; i < NEXT_PREVIEW; i++) nextQueue.push(nextPiece());

  current = nextQueue.shift();
  nextQueue.push(nextPiece());

  scoreDisplay.textContent = '0';
  levelDisplay.textContent = '1';
  linesDisplay.textContent = '0';

  state = 'playing';
  overlay.style.display = 'none';
  overlayMsg.style.display = 'block';
  overlayScore.style.display = 'none';

  requestAnimationFrame(gameLoop);
}

// ── Drawing ──────────────────────────────────────────────────────

function colorWithAlpha(cssVar) {
  // Can't easily read CSS vars on canvas; use pre-resolved map
  return colorMap[cssVar] ?? '#ffffff';
}

// Resolved colour map (read once after DOM ready)
const colorMap = {};
function resolveColors() {
  const el = document.documentElement;
  const style = getComputedStyle(el);
  for (const key of ['--I','--O','--T','--S','--Z','--J','--L']) {
    colorMap[`var(${key})`] = style.getPropertyValue(key).trim();
  }
}

function drawCell(c, x, y, alpha = 1, glow = true, canvasCtx = ctx) {
  const color = colorWithAlpha(c);
  canvasCtx.globalAlpha = alpha;

  if (glow) {
    canvasCtx.shadowColor = color;
    canvasCtx.shadowBlur  = 12;
  }

  // Fill
  canvasCtx.fillStyle = color;
  canvasCtx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);

  // Highlight top-left edge
  canvasCtx.fillStyle = 'rgba(255,255,255,0.25)';
  canvasCtx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, 3);
  canvasCtx.fillRect(x * CELL + 1, y * CELL + 1, 3, CELL - 2);

  canvasCtx.shadowBlur = 0;
  canvasCtx.globalAlpha = 1;
}

function drawGhostCell(color, x, y) {
  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = colorWithAlpha(color);
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(x * CELL + 1.5, y * CELL + 1.5, CELL - 3, CELL - 3);
  ctx.globalAlpha = 1;
}

function drawGrid() {
  ctx.clearRect(0, 0, boardCanvas.width, boardCanvas.height);

  // Background grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth   = 0.5;
  for (let c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * CELL, 0); ctx.lineTo(c * CELL, ROWS * CELL); ctx.stroke();
  }
  for (let r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * CELL); ctx.lineTo(COLS * CELL, r * CELL); ctx.stroke();
  }
}

function drawBoard() {
  for (let r = 0; r < ROWS; r++) {
    // If row is being cleared, skip it (flash handled separately)
    if (flashRows.includes(r)) continue;
    for (let c = 0; c < COLS; c++) {
      if (board[r][c]) {
        drawCell(TETROMINOES[board[r][c]].color, c, r);
      }
    }
  }
}

let flashVisible = true;
function drawFlash() {
  if (!flashRows.length) return;
  if (flashVisible) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.shadowColor = '#fff';
    ctx.shadowBlur  = 20;
    for (const r of flashRows) {
      ctx.fillRect(0, r * CELL, COLS * CELL, CELL);
    }
    ctx.shadowBlur = 0;
  }
}

function drawPiece(piece, alpha = 1, canvasCtx = ctx) {
  const s = shape(piece);
  const color = TETROMINOES[piece.type].color;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!s[r][c]) continue;
      const px = piece.x + c;
      const py = piece.y + r;
      if (py < 0) continue;
      drawCell(color, px, py, alpha, true, canvasCtx);
    }
  }
}

function drawGhost() {
  ghostY = calcGhost();
  if (ghostY === current.y) return; // already at rest, don't draw redundant ghost
  const s = shape(current);
  const color = TETROMINOES[current.type].color;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!s[r][c]) continue;
      const px = current.x + c;
      const py = ghostY + r;
      if (py < 0) continue;
      drawGhostCell(color, px, py);
    }
  }
}

// Draw a mini piece on a small canvas (next/hold)
function drawMiniPiece(canvasEl, canvasCtx, type) {
  const w = canvasEl.width;
  const h = canvasEl.height;
  canvasCtx.clearRect(0, 0, w, h);
  if (!type) return;

  const s = TETROMINOES[type].states[0];
  const color = TETROMINOES[type].color;
  const cs = 18; // mini cell size

  // Bounding box of the shape
  let minR = 4, maxR = 0, minC = 4, maxC = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (s[r][c]) {
        if (r < minR) minR = r; if (r > maxR) maxR = r;
        if (c < minC) minC = c; if (c > maxC) maxC = c;
      }
    }
  }
  const pieceW = (maxC - minC + 1) * cs;
  const pieceH = (maxR - minR + 1) * cs;
  const offX = Math.floor((w - pieceW) / 2) - minC * cs;
  const offY = Math.floor((h - pieceH) / 2) - minR * cs;

  canvasCtx.shadowColor = colorWithAlpha(color);
  canvasCtx.shadowBlur  = 8;
  canvasCtx.fillStyle   = colorWithAlpha(color);

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!s[r][c]) continue;
      const px = offX + c * cs;
      const py = offY + r * cs;
      canvasCtx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
      // Highlight
      canvasCtx.fillStyle = 'rgba(255,255,255,0.25)';
      canvasCtx.fillRect(px + 1, py + 1, cs - 2, 3);
      canvasCtx.fillRect(px + 1, py + 1, 3, cs - 2);
      canvasCtx.fillStyle = colorWithAlpha(color);
    }
  }
  canvasCtx.shadowBlur = 0;
}

function drawNextQueue() {
  const w = nextCanvas.width;
  const h = nextCanvas.height;
  nctx.clearRect(0, 0, w, h);
  const slotH = h / NEXT_PREVIEW;
  for (let i = 0; i < nextQueue.length; i++) {
    const type = nextQueue[i].type;
    const s = TETROMINOES[type].states[0];
    const color = TETROMINOES[type].color;
    const cs = 16;
    let minR = 4, maxR = 0, minC = 4, maxC = 0;
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (s[r][c]) {
          if (r < minR) minR = r; if (r > maxR) maxR = r;
          if (c < minC) minC = c; if (c > maxC) maxC = c;
        }
    const pieceW = (maxC - minC + 1) * cs;
    const pieceH = (maxR - minR + 1) * cs;
    const slotMidY = slotH * i + slotH / 2;
    const offX = Math.floor((w - pieceW) / 2) - minC * cs;
    const offY = Math.floor(slotMidY - pieceH / 2) - minR * cs;

    nctx.shadowColor = colorWithAlpha(color);
    nctx.shadowBlur  = 8;
    nctx.fillStyle   = colorWithAlpha(color);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!s[r][c]) continue;
        const px = offX + c * cs;
        const py = offY + r * cs;
        nctx.fillRect(px + 1, py + 1, cs - 2, cs - 2);
        nctx.fillStyle = 'rgba(255,255,255,0.25)';
        nctx.fillRect(px + 1, py + 1, cs - 2, 3);
        nctx.fillRect(px + 1, py + 1, 3, cs - 2);
        nctx.fillStyle = colorWithAlpha(color);
      }
    }
    nctx.shadowBlur = 0;
  }
}

// ── Game loop ────────────────────────────────────────────────────
let flashToggle = 0;

function gameLoop(ts) {
  if (state === 'gameover' || state === 'idle') return;
  if (!lastTime) lastTime = ts;
  const dt = ts - lastTime;
  lastTime = ts;

  if (state === 'flashing') {
    flashTimer -= dt;
    flashToggle += dt;
    if (flashToggle > 80) { flashVisible = !flashVisible; flashToggle = 0; }

    drawGrid();
    drawBoard();
    drawFlash();

    if (flashTimer <= 0) {
      flashVisible = true;
      applyLineClear();
    }
    requestAnimationFrame(gameLoop);
    return;
  }

  if (state === 'paused') {
    requestAnimationFrame(gameLoop);
    return;
  }

  // Gravity
  gravityAccum += dt;
  const grav = gravityMs(level);
  if (gravityAccum >= grav) {
    gravityAccum -= grav;
    if (!collides(current, 0, 1)) {
      current.y++;
      lockTimer = 0;  // reset lock delay on successful drop
    } else {
      lockTimer += grav;
    }
  }

  // Lock delay
  if (collides(current, 0, 1)) {
    lockTimer += dt;
    if (lockTimer >= LOCK_DELAY) {
      lockTimer = 0;
      lockPiece();
    }
  }

  // Draw
  drawGrid();
  drawBoard();
  if (state === 'playing') {
    drawGhost();
    drawPiece(current);
  }
  drawMiniPiece(holdCanvas, hctx, held);
  drawNextQueue();

  requestAnimationFrame(gameLoop);
}

// ── Keyboard ─────────────────────────────────────────────────────
const keysHeld = {};
let softDropInterval = null;

document.addEventListener('keydown', e => {
  if (keysHeld[e.code]) return; // prevent key-repeat on action keys
  keysHeld[e.code] = true;

  if (state !== 'playing') {
    if (e.code === 'KeyP' && state === 'paused') togglePause();
    return;
  }

  switch (e.code) {
    case 'ArrowLeft':
      if (!collides(current, -1, 0)) { current.x--; lockTimer = 0; }
      break;
    case 'ArrowRight':
      if (!collides(current, 1, 0)) { current.x++; lockTimer = 0; }
      break;
    case 'ArrowDown':
      // Initial step on keydown; repeated via interval below
      if (!collides(current, 0, 1)) { current.y++; score += 1; scoreDisplay.textContent = score.toLocaleString(); lockTimer = 0; }
      if (!softDropInterval) {
        softDropInterval = setInterval(() => {
          if (state !== 'playing') { clearInterval(softDropInterval); softDropInterval = null; return; }
          if (!collides(current, 0, 1)) { current.y++; score += 1; scoreDisplay.textContent = score.toLocaleString(); lockTimer = 0; }
        }, 50);
      }
      break;
    case 'ArrowUp':
      rotatePiece(1);
      lockTimer = 0;
      break;
    case 'KeyZ':
      rotatePiece(-1);
      lockTimer = 0;
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
    case 'KeyC':
      holdPiece();
      break;
    case 'KeyP':
      togglePause();
      break;
  }
});

document.addEventListener('keyup', e => {
  delete keysHeld[e.code];
  if (e.code === 'ArrowDown') { clearInterval(softDropInterval); softDropInterval = null; }
});

// ── Pause ────────────────────────────────────────────────────────
function togglePause() {
  if (state === 'playing') {
    state = 'paused';
    overlayTitle.textContent = 'Pauza';
    overlayMsg.textContent   = 'Naciśnij P aby wznowić.';
    overlayMsg.style.display = 'block';
    overlayScore.style.display = 'none';
    overlayBtn.textContent   = '▶ Wznów';
    overlay.style.display    = 'flex';
  } else if (state === 'paused') {
    state = 'playing';
    overlay.style.display = 'none';
    lastTime = null;
  }
}

// ── Overlay button ───────────────────────────────────────────────
overlayBtn.addEventListener('click', () => {
  if (state === 'idle' || state === 'gameover') {
    initGame();
  } else if (state === 'paused') {
    togglePause();
  }
});

// ── Mobile controls ──────────────────────────────────────────────
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
if (isTouchDevice) {
  document.getElementById('controlsDesc').textContent = 'Użyj przycisków poniżej lub przesuń palcem po planszy.';
}

function mcAction(fn) {
  return (e) => { e.preventDefault(); if (state === 'playing') fn(); };
}

document.getElementById('mc-left').addEventListener('touchstart',
  mcAction(() => { if (!collides(current, -1, 0)) { current.x--; lockTimer = 0; } }), { passive: false });
document.getElementById('mc-right').addEventListener('touchstart',
  mcAction(() => { if (!collides(current, 1, 0)) { current.x++; lockTimer = 0; } }), { passive: false });
document.getElementById('mc-rotate').addEventListener('touchstart',
  mcAction(() => { rotatePiece(1); lockTimer = 0; }), { passive: false });
document.getElementById('mc-soft').addEventListener('touchstart',
  mcAction(() => { if (!collides(current, 0, 1)) { current.y++; score += 1; scoreDisplay.textContent = score.toLocaleString(); lockTimer = 0; } }), { passive: false });
document.getElementById('mc-drop').addEventListener('touchstart',
  mcAction(() => hardDrop()), { passive: false });
document.getElementById('mc-hold').addEventListener('touchstart',
  mcAction(() => holdPiece()), { passive: false });

// Swipe on board
let swipeStartX = 0, swipeStartY = 0;
boardCanvas.addEventListener('touchstart', (e) => {
  swipeStartX = e.touches[0].clientX;
  swipeStartY = e.touches[0].clientY;
}, { passive: true });
boardCanvas.addEventListener('touchend', (e) => {
  if (state !== 'playing') return;
  const dx = e.changedTouches[0].clientX - swipeStartX;
  const dy = e.changedTouches[0].clientY - swipeStartY;
  if (Math.abs(dx) < 15 && Math.abs(dy) < 15) { rotatePiece(1); lockTimer = 0; return; } // tap = rotate
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx < -20 && !collides(current, -1, 0)) { current.x--; lockTimer = 0; }
    else if (dx > 20 && !collides(current, 1, 0)) { current.x++; lockTimer = 0; }
  } else {
    if (dy > 30) hardDrop();
    else if (dy < -30) { rotatePiece(1); lockTimer = 0; }
  }
}, { passive: true });

// ── Responsive sizing ────────────────────────────────────────────
function resize() {
  const mobileBarH = isTouchDevice ? 90 : 60;
  const maxH = window.innerHeight - mobileBarH;
  const maxW = window.innerWidth  - 10;

  // Wrapper natural size: board (COLS*CELL × ROWS*CELL) + 2 panels (110px each) + gaps (12px × 2)
  const naturalW = COLS * CELL + 2 * 110 + 2 * 12;
  const naturalH = ROWS * CELL;

  const scale = Math.min(1, maxW / naturalW, maxH / naturalH);
  wrapper.style.transform = `scale(${scale})`;
  wrapper.style.transformOrigin = 'top center';

  // Adjust wrapper height to avoid it pushing layout
  const scaledH = naturalH * scale;
  wrapper.style.marginBottom = `${-(naturalH - scaledH)}px`;
}

window.addEventListener('resize', resize);

// ── Bootstrap ────────────────────────────────────────────────────
resolveColors();

// Set canvas sizes (fixed logical size; scaling done via CSS transform)
boardCanvas.width  = COLS * CELL;
boardCanvas.height = ROWS * CELL;

// Initial draw (empty board with overlay showing)
drawGrid();
state = 'idle';

resize();
