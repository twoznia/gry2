// ─────────────────────────────────────────────────────────────────
//  Puzzle game – canvas-based jigsaw
// ─────────────────────────────────────────────────────────────────

const IMAGES = {
  foka:   '../pisanie/images/foka.svg',
  ges:    '../pisanie/images/ges.svg',
  okno:   '../pisanie/images/okno.svg',
  wiadro: '../pisanie/images/wiadro.svg',
  dom:    '../pisanie/images/dom.svg',
  auto:   '../pisanie/images/auto.svg',
  most:   '../pisanie/images/most.svg'
};

// DOM refs
const boardCanvas  = document.getElementById('board');
const boardCtx     = boardCanvas.getContext('2d');
const dragCanvas   = document.getElementById('drag-piece');
const dragCtx      = dragCanvas.getContext('2d');
const traySlots    = [0,1,2].map(i => document.getElementById('tray-slot-' + i));

// ── Game state ──────────────────────────────────────────────────
let N = 4;              // grid dimension
let boardPx = 400;      // canvas px (square)
let pw, ph, tabSz;      // piece size + tab size

let imgEl = null;

// hEdges[r][c]: connector between row r and r+1 at column c
//   +1 = tab protrudes DOWN (piece r bottom convex, piece r+1 top concave)
//   -1 = tab protrudes UP
let hEdges = [];

// vEdges[r][c]: connector between col c and c+1 at row r
//   +1 = tab protrudes RIGHT (piece r,c right convex, piece r,c+1 left concave)
//   -1 = tab protrudes LEFT
let vEdges = [];

let placed    = [];   // [N][N] boolean
let remaining = [];   // [[r,c], ...] shuffled unplaced pieces
let tray      = [null, null, null];

// ── Drag state ──────────────────────────────────────────────────
let isDragging  = false;
let dragSlotIdx = -1;
let dragR = -1, dragC = -1;

// ═══════════════════════════════════════════════════════════════
//  Edge path helpers
// ═══════════════════════════════════════════════════════════════

/**
 * Horizontal jigsaw edge from (x0,y) → (x1,y).
 * bumpY > 0 → bump goes DOWN; bumpY < 0 → bump goes UP; 0 = straight.
 * Works correctly for both left→right and right→left directions.
 */
function hEdge(ctx, x0, y, x1, bumpY) {
  if (!bumpY) { ctx.lineTo(x1, y); return; }
  const mid = (x0 + x1) / 2;
  const s   = Math.abs(x1 - x0) * 0.28;  // half-width of tab
  const dir = x1 > x0 ? 1 : -1;
  const a   = mid - dir * s;  // first landmark in direction of travel
  const b   = mid + dir * s;  // second landmark
  ctx.lineTo(a, y);
  ctx.bezierCurveTo(a, y + bumpY * 0.5,
                    mid - dir * s * 0.35, y + bumpY,
                    mid, y + bumpY);
  ctx.bezierCurveTo(mid + dir * s * 0.35, y + bumpY,
                    b, y + bumpY * 0.5,
                    b, y);
  ctx.lineTo(x1, y);
}

/**
 * Vertical jigsaw edge from (x,y0) → (x,y1).
 * bumpX > 0 → bump goes RIGHT; bumpX < 0 → bump goes LEFT; 0 = straight.
 */
function vEdge(ctx, x, y0, y1, bumpX) {
  if (!bumpX) { ctx.lineTo(x, y1); return; }
  const mid = (y0 + y1) / 2;
  const s   = Math.abs(y1 - y0) * 0.28;
  const dir = y1 > y0 ? 1 : -1;
  const a   = mid - dir * s;
  const b   = mid + dir * s;
  ctx.lineTo(x, a);
  ctx.bezierCurveTo(x + bumpX * 0.5, a,
                    x + bumpX, mid - dir * s * 0.35,
                    x + bumpX, mid);
  ctx.bezierCurveTo(x + bumpX, mid + dir * s * 0.35,
                    x + bumpX * 0.5, b,
                    x, b);
  ctx.lineTo(x, y1);
}

/**
 * Build the clockwise jigsaw clip path for piece (r,c).
 * ox, oy: offset of piece origin within the target canvas
 *   (piece inner-rect top-left = c*pw + ox, r*ph + oy)
 */
function buildPath(ctx, r, c, ox, oy) {
  const x  = c * pw + ox,  y  = r * ph + oy;
  const x2 = x + pw,       y2 = y + ph;

  // Tab bump signs, from this piece's perspective:
  //  +tabSz on top/bottom: +ve bumpY → concave top / convex bottom
  //  +tabSz on right/left:  +ve bumpX → convex right / concave left
  const topB = r === 0   ? 0 : (hEdges[r-1][c]  ===  1 ?  tabSz : -tabSz);
  const botB = r === N-1 ? 0 : (hEdges[r][c]    ===  1 ?  tabSz : -tabSz);
  const rigB = c === N-1 ? 0 : (vEdges[r][c]    ===  1 ?  tabSz : -tabSz);
  const lefB = c === 0   ? 0 : (vEdges[r][c-1]  ===  1 ?  tabSz : -tabSz);

  ctx.beginPath();
  ctx.moveTo(x, y);
  hEdge(ctx, x,  y,  x2, topB);  // top   left→right
  vEdge(ctx, x2, y,  y2, rigB);  // right top→bottom
  hEdge(ctx, x2, y2, x,  botB);  // bottom right→left
  vEdge(ctx, x,  y2, y,  lefB);  // left  bottom→top
  ctx.closePath();
}

// ═══════════════════════════════════════════════════════════════
//  Game initialisation
// ═══════════════════════════════════════════════════════════════

function initGame() {
  clearWinTimers();
  hideReplayBar();
  N       = parseInt(document.getElementById('size-select').value);
  boardPx = Math.min(window.innerWidth - 40, 440);
  pw      = boardPx / N;
  ph      = boardPx / N;
  tabSz   = pw * 0.28;

  boardCanvas.width  = boardPx;
  boardCanvas.height = boardPx;

  // Random connectors
  hEdges = Array.from({length: N-1}, () =>
    Array.from({length: N},   () => Math.random() < 0.5 ? 1 : -1));
  vEdges = Array.from({length: N},   () =>
    Array.from({length: N-1}, () => Math.random() < 0.5 ? 1 : -1));

  placed    = Array.from({length: N}, () => Array(N).fill(false));
  remaining = [];
  for (let r = 0; r < N; r++)
    for (let c = 0; c < N; c++)
      remaining.push([r, c]);

  // Fisher-Yates shuffle
  for (let i = remaining.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
  }

  tray = [null, null, null];
  fillTray();
  updateProgress();

  // Load (or reuse) image
  const key = document.getElementById('img-select').value;
  if (imgEl && imgEl._key === key) {
    drawBoard();
    renderTray();
  } else {
    const img = new Image();
    img.onload = () => { img._key = key; imgEl = img; drawBoard(); renderTray(); };
    img.src = IMAGES[key];
  }
}

function fillTray(newSlots = null) {
  for (let i = 0; i < 3; i++) {
    if (tray[i] === null && remaining.length > 0) {
      tray[i] = remaining.shift();
      if (newSlots) newSlots.push(i);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  Drawing helpers
// ═══════════════════════════════════════════════════════════════

/** Draw piece (r,c) onto ctx, scaled by `scale`.
 *  Piece inner-rect is offset to (tabSz, tabSz) in the canvas. */
function drawPieceOnCtx(ctx, r, c, scale) {
  const ox = tabSz - c * pw;
  const oy = tabSz - r * ph;

  ctx.save();
  ctx.scale(scale, scale);

  // Clip + draw image
  ctx.save();
  buildPath(ctx, r, c, ox, oy);
  ctx.clip();
  ctx.drawImage(imgEl, ox, oy, boardPx, boardPx);
  ctx.restore();

  // Border
  buildPath(ctx, r, c, ox, oy);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth   = 1.5 / scale;
  ctx.stroke();

  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════
//  Board
// ═══════════════════════════════════════════════════════════════

// Pastelowy jasny żółty — tło planszy i tacki
const BOARD_BG = '#ffffff';

function paintBoardBg() {
  boardCtx.clearRect(0, 0, boardPx, boardPx);
  boardCtx.fillStyle = BOARD_BG;
  boardCtx.fillRect(0, 0, boardPx, boardPx);
}

function drawBoard() {
  paintBoardBg();

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      boardCtx.save();

      if (placed[r][c]) {
        // Clip to piece shape and draw image
        buildPath(boardCtx, r, c, 0, 0);
        boardCtx.clip();
        boardCtx.drawImage(imgEl, 0, 0, boardPx, boardPx);
        boardCtx.restore();

        // Subtle seam (ciemny — widoczny na jasnym tle)
        boardCtx.save();
        buildPath(boardCtx, r, c, 0, 0);
        boardCtx.strokeStyle = 'rgba(0,0,0,0.28)';
        boardCtx.lineWidth = 1;
        boardCtx.stroke();
      } else {
        // Empty slot – subtle inner fill
        buildPath(boardCtx, r, c, 0, 0);
        boardCtx.fillStyle = 'rgba(0,0,0,0.05)';
        boardCtx.fill();
        boardCtx.restore();

        // Dashed outline
        boardCtx.save();
        buildPath(boardCtx, r, c, 0, 0);
        boardCtx.strokeStyle = 'rgba(120,113,40,0.55)';
        boardCtx.lineWidth = 1.5;
        boardCtx.setLineDash([5, 4]);
        boardCtx.stroke();
        boardCtx.setLineDash([]);
      }

      boardCtx.restore();
    }
  }
}

// Ułożona plansza z wyróżnionymi ramkami puzzli (złota poświata)
function drawBoardHighlighted() {
  paintBoardBg();
  boardCtx.drawImage(imgEl, 0, 0, boardPx, boardPx);
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      boardCtx.save();
      buildPath(boardCtx, r, c, 0, 0);
      boardCtx.strokeStyle = 'rgba(250,204,21,0.95)';
      boardCtx.lineWidth = 2.5;
      boardCtx.shadowColor = 'rgba(250,204,21,0.9)';
      boardCtx.shadowBlur = 8;
      boardCtx.stroke();
      boardCtx.restore();
    }
  }
}

// Czysty obrazek bez ramek puzzli
function drawBoardClean() {
  paintBoardBg();
  boardCtx.drawImage(imgEl, 0, 0, boardPx, boardPx);
}

// ═══════════════════════════════════════════════════════════════
//  Tray
// ═══════════════════════════════════════════════════════════════

function renderTray() {
  for (let i = 0; i < 3; i++) renderSlot(i);
}

function renderSlot(i, isNew = false) {
  const slot = traySlots[i];
  const cvs  = slot.querySelector('canvas');

  if (!tray[i]) {
    cvs.width = cvs.height = 1;
    cvs.style.filter = '';
    slot.classList.remove('tray-slot-new');
    return;
  }

  const [r, c] = tray[i];
  // Scale so the piece core (pw×ph) renders at `trayPw` pixels
  const trayPw = Math.round(Math.max(58, Math.min(88, boardPx / N)));
  const scale  = trayPw / pw;
  const cw     = Math.ceil((pw + 2 * tabSz) * scale);
  const ch     = Math.ceil((ph + 2 * tabSz) * scale);

  cvs.width  = cw;
  cvs.height = ch;
  cvs.style.filter = 'drop-shadow(2px 4px 10px rgba(0,0,0,0.55))';

  const ctx = cvs.getContext('2d');
  ctx.clearRect(0, 0, cw, ch);
  drawPieceOnCtx(ctx, r, c, scale);

  if (isNew) {
    slot.classList.remove('tray-slot-new');
    // Force reflow to restart animation
    void slot.offsetWidth;
    slot.classList.add('tray-slot-new');
  }
}

// ═══════════════════════════════════════════════════════════════
//  Drag and drop
// ═══════════════════════════════════════════════════════════════

function startDrag(slotIdx, clientX, clientY) {
  if (!tray[slotIdx]) return;
  isDragging  = true;
  dragSlotIdx = slotIdx;
  [dragR, dragC] = tray[slotIdx];

  // Render piece to drag canvas at board scale (scale = 1)
  const cw = Math.ceil(pw + 2 * tabSz);
  const ch = Math.ceil(ph + 2 * tabSz);
  dragCanvas.width  = cw;
  dragCanvas.height = ch;
  dragCtx.clearRect(0, 0, cw, ch);
  drawPieceOnCtx(dragCtx, dragR, dragC, 1);
  dragCanvas.style.filter  = 'drop-shadow(0 8px 20px rgba(0,0,0,0.55))';
  dragCanvas.style.display = 'block';
  dragCanvas.style.opacity = '0.95';

  moveDrag(clientX, clientY);
  traySlots[slotIdx].querySelector('canvas').style.opacity = '0.2';
}

function moveDrag(clientX, clientY) {
  dragCanvas.style.left = (clientX - dragCanvas.width  / 2) + 'px';
  dragCanvas.style.top  = (clientY - dragCanvas.height / 2) + 'px';
}

function endDrag(clientX, clientY) {
  if (!isDragging) return;
  dragCanvas.style.display = 'none';

  const cell     = boardCell(clientX, clientY);
  let   accepted = false;

  if (cell) {
    const [r, c] = cell;
    if (r === dragR && c === dragC && !placed[r][c]) {
      placed[r][c] = true;
      tray[dragSlotIdx] = null;
      const newSlots = [];
      fillTray(newSlots);
      drawBoard();
      // Render all slots; animate the newly filled ones
      for (let i = 0; i < 3; i++) renderSlot(i, newSlots.includes(i));
      updateProgress();
      checkWin();
      accepted = true;
    }
  }

  if (!accepted) {
    traySlots[dragSlotIdx].querySelector('canvas').style.opacity = '1';
  }

  isDragging  = false;
  dragSlotIdx = -1;
}

/** Returns [row, col] of the board cell under the cursor, or null. */
function boardCell(clientX, clientY) {
  const rect = boardCanvas.getBoundingClientRect();
  const sx   = boardPx / rect.width;
  const sy   = boardPx / rect.height;
  const bx   = (clientX - rect.left) * sx;
  const by   = (clientY - rect.top)  * sy;
  const c    = Math.floor(bx / pw);
  const r    = Math.floor(by / ph);
  if (r >= 0 && r < N && c >= 0 && c < N) return [r, c];
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  Progress & win
// ═══════════════════════════════════════════════════════════════

function updateProgress() {
  const done = placed.flat().filter(Boolean).length;
  document.getElementById('progress').textContent = `Ułożono: ${done} / ${N * N}`;
}

let winTimers = [];
function clearWinTimers() { winTimers.forEach(clearTimeout); winTimers = []; }

function checkWin() {
  if (placed.every(row => row.every(Boolean))) {
    winTimers.push(setTimeout(runWinSequence, 350));
  }
}

function runWinSequence() {
  clearWinTimers();
  drawBoardHighlighted();                         // 1) wyróżnione puzzle (2 s)
  winTimers.push(setTimeout(() => {
    drawBoardClean();                             // 2) czysty obrazek bez ramek (2 s)
    winTimers.push(setTimeout(() => {
      showReplayBar();                            // 3) przycisk „Zagraj ponownie”
    }, 2000));
  }, 2000));
}

function showReplayBar() {
  document.getElementById('tray-label').style.display = 'none';
  document.getElementById('tray').style.display = 'none';
  document.getElementById('replay-bar').classList.add('show');
}

function hideReplayBar() {
  document.getElementById('tray-label').style.display = '';
  document.getElementById('tray').style.display = '';
  document.getElementById('replay-bar').classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════
//  Events
// ═══════════════════════════════════════════════════════════════

traySlots.forEach((slot, i) => {
  slot.addEventListener('mousedown', e => {
    e.preventDefault();
    startDrag(i, e.clientX, e.clientY);
  });
  slot.addEventListener('touchstart', e => {
    e.preventDefault();
    startDrag(i, e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: false });
});

window.addEventListener('mousemove', e => {
  if (isDragging) moveDrag(e.clientX, e.clientY);
});
window.addEventListener('mouseup', e => {
  if (isDragging) endDrag(e.clientX, e.clientY);
});
window.addEventListener('touchmove', e => {
  if (isDragging) { e.preventDefault(); moveDrag(e.touches[0].clientX, e.touches[0].clientY); }
}, { passive: false });
window.addEventListener('touchend', e => {
  if (isDragging) endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
});

document.getElementById('new-btn').addEventListener('click', initGame);
document.getElementById('size-select').addEventListener('change', initGame);
document.getElementById('img-select').addEventListener('change', initGame);
document.getElementById('replay-btn').addEventListener('click', initGame);

window.addEventListener('DOMContentLoaded', initGame);
