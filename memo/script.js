/* ═══════════════════════════════════════
   LANGUAGE
═══════════════════════════════════════ */
let lang = localStorage.getItem('lang') || 'pl';

const T = {
    pl: {
        backLabel: 'Menu',
        imgType: 'Rodzaj obrazków',
        typePisanie: 'Pisanie',
        typeKraje: 'Kraje',
        boardSize: 'Rozmiar planszy',
        start: '▶ Graj',
        noRecord: '—',
        pairs: 'par',
        winTitle: 'Brawo!',
        winAgain: '🔄 Jeszcze raz',
        winMenu: '🏠 Menu',
        newRecord: '🏆 Nowy rekord!',
        prevRecord: 'Poprzedni rekord:',
        moves: 'ruchów',
    },
    en: {
        backLabel: 'Menu',
        imgType: 'Image type',
        typePisanie: 'Spelling',
        typeKraje: 'Countries',
        boardSize: 'Board size',
        start: '▶ Play',
        noRecord: '—',
        pairs: 'pairs',
        winTitle: 'Well done!',
        winAgain: '🔄 Play again',
        winMenu: '🏠 Menu',
        newRecord: '🏆 New record!',
        prevRecord: 'Previous record:',
        moves: 'moves',
    }
};

function setLang(l) {
    lang = l;
    localStorage.setItem('lang', l);
    applyLang();
}

function applyLang() {
    const t = T[lang];
    const activeStyle  = { background: 'rgba(255,255,255,0.45)', border: '2px solid rgba(255,255,255,0.9)' };
    const inactiveStyle = { background: 'rgba(255,255,255,0.1)',  border: '2px solid rgba(255,255,255,0.3)' };
    const plBtn = document.getElementById('lang-pl');
    const enBtn = document.getElementById('lang-en');
    Object.assign((lang === 'pl' ? plBtn : enBtn).style, activeStyle);
    Object.assign((lang === 'pl' ? enBtn : plBtn).style, inactiveStyle);

    document.getElementById('back-label').textContent         = t.backLabel;
    document.getElementById('lbl-imgtype').textContent        = t.imgType;
    document.getElementById('lbl-type-pisanie').textContent   = t.typePisanie;
    document.getElementById('lbl-type-kraje').textContent     = t.typeKraje;
    document.getElementById('lbl-boardsize').textContent      = t.boardSize;
    document.getElementById('lbl-start').textContent          = t.start;
    document.getElementById('win-title').textContent          = t.winTitle;
    document.getElementById('win-again-btn').textContent      = t.winAgain;
    document.getElementById('win-menu-btn').textContent       = t.winMenu;

    renderSizeGrid();
}

/* ═══════════════════════════════════════
   DATA
═══════════════════════════════════════ */

// 40 emoji images (from pisanie-style icon set)
const EMOJI_POOL = [
    '🐱','🐶','🦁','🐸','🐧','🦊','🐻','🦋',
    '🐴','🦔','🐍','🦌','🦞','🐞','🦄','🐬',
    '🦉','🦜','🏠','🚌','🎮','🍎','🍕','🌸',
    '⭐','🌈','🚀','🎯','🎨','🎸','🏆','💎',
    '🌴','🌊','🍭','🎃','🧊','🧀','🐘','🌟'
];

// 40 country flag codes (flagcdn.com)
const FLAG_POOL = [
    'pl','de','fr','es','it','gb','us','jp','cn','br',
    'au','ca','ru','in','mx','za','ar','kr','tr','nl',
    'se','no','fi','dk','pt','be','ch','at','gr','cz',
    'hu','ro','ua','eg','ng','ke','sa','ae','th','id'
];

// Board sizes per device: cols × rows → pairs count
const BOARD_SIZES_MOBILE = [
    { key: '4x4', cols: 4, rows: 4, pairs: 8  },
    { key: '4x5', cols: 4, rows: 5, pairs: 10 },
    { key: '4x6', cols: 4, rows: 6, pairs: 12 },
];
const BOARD_SIZES_DESKTOP = [
    { key: '4x4', cols: 4, rows: 4, pairs: 8  },
    { key: '5x4', cols: 5, rows: 4, pairs: 10 },
    { key: '6x4', cols: 6, rows: 4, pairs: 12 },
    { key: '6x5', cols: 6, rows: 5, pairs: 15 },
    { key: '8x6', cols: 8, rows: 6, pairs: 24 },
];
const ALL_BOARD_SIZES = [...BOARD_SIZES_MOBILE, ...BOARD_SIZES_DESKTOP];
function getBoardSizes() { return window.innerWidth <= 520 ? BOARD_SIZES_MOBILE : BOARD_SIZES_DESKTOP; }

/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
let selectedType    = 'pisanie';
let selectedSizeKey = '4x4';
let timerInterval   = null;
let startTime       = null;
let elapsedSeconds  = 0;
let flippedCards    = [];
let matchedPairs    = 0;
let totalPairs      = 0;
let moveCount       = 0;
let isLocked        = false;
let pendingClose    = null;

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function getSize()             { return ALL_BOARD_SIZES.find(s => s.key === selectedSizeKey); }
function getRecord(key)        { const v = localStorage.getItem('memo-rec-' + key); return v !== null ? parseInt(v) : null; }
function saveRecord(key, secs) { localStorage.setItem('memo-rec-' + key, secs); }
function fmtTime(sec)          { return String(Math.floor(sec/60)).padStart(2,'0') + ':' + String(sec%60).padStart(2,'0'); }

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

/* ═══════════════════════════════════════
   SETUP UI
═══════════════════════════════════════ */
function renderSizeGrid() {
    const grid = document.getElementById('size-grid');
    grid.innerHTML = '';
    const sizes = getBoardSizes();
    grid.style.gridTemplateColumns = `repeat(${sizes.length}, 1fr)`;
    sizes.forEach(size => {
        const rec = getRecord(size.key);
        const btn = document.createElement('button');
        btn.className = 'size-btn' + (size.key === selectedSizeKey ? ' selected' : '');
        btn.innerHTML =
            `<div class="size-label">${size.key.replace('x','×')}</div>` +
            `<div class="size-record">${rec !== null ? fmtTime(rec) : T[lang].noRecord}</div>`;
        btn.onclick = () => selectSize(size.key);
        grid.appendChild(btn);
    });
}

function selectType(type) {
    selectedType = type;
    document.getElementById('type-pisanie').classList.toggle('selected', type === 'pisanie');
    document.getElementById('type-kraje').classList.toggle('selected', type === 'kraje');
}

function selectSize(key) {
    selectedSizeKey = key;
    renderSizeGrid();
}

function showSetup() {
    clearInterval(timerInterval);
    renderSizeGrid();
    showScreen('screen-setup');
}

/* ═══════════════════════════════════════
   GAME
═══════════════════════════════════════ */
function startGame() {
    clearInterval(timerInterval);
    timerInterval = null;

    const size  = getSize();
    totalPairs  = size.pairs;
    matchedPairs = 0;
    cancelPendingClose();
    flippedCards = [];
    moveCount    = 0;
    isLocked     = false;
    elapsedSeconds = 0;

    // Pick images
    const pool    = selectedType === 'pisanie' ? EMOJI_POOL : FLAG_POOL;
    const images  = shuffle(pool).slice(0, totalPairs);

    // Duplicate for pairs, shuffle
    let cards = shuffle([...images, ...images]);

    // Pad to fill grid (5×5 needs 1 empty cell)
    const totalCells = size.cols * size.rows;
    while (cards.length < totalCells) cards.push(null);

    // Determine card pixel size
    const gapPx      = 7;
    const paddingPx  = 16;
    const maxW       = Math.min(window.innerWidth - 24, 960);
    const availW     = maxW - paddingPx * 2 - gapPx * (size.cols - 1);
    const rawSize    = Math.floor(availW / size.cols);
    const cardSize   = Math.max(38, Math.min(rawSize, 100));
    const emojiFontSz = Math.max(14, Math.floor(cardSize * 0.52));
    const frontSymSz  = Math.max(12, Math.floor(cardSize * 0.32));

    // Build board DOM
    const board = document.getElementById('board');
    board.style.gridTemplateColumns = `repeat(${size.cols}, ${cardSize}px)`;
    board.style.gap = gapPx + 'px';
    board.innerHTML = '';

    cards.forEach(imgVal => {
        const card = document.createElement('div');
        card.className = 'card' + (imgVal === null ? ' empty' : '');
        card.style.width  = cardSize + 'px';
        card.style.height = cardSize + 'px';

        if (imgVal !== null) {
            card.dataset.value = imgVal;
            card.addEventListener('click', () => flipCard(card));
        }

        const inner = document.createElement('div');
        inner.className = 'card-inner';

        // Front face (hidden side)
        const front = document.createElement('div');
        front.className = 'card-face card-front';
        const sym = document.createElement('span');
        sym.className = 'card-front-symbol';
        sym.style.fontSize = frontSymSz + 'px';
        sym.textContent = '?';
        front.appendChild(sym);

        // Back face (revealed side)
        const back = document.createElement('div');
        back.className = 'card-face card-back';

        if (selectedType === 'pisanie') {
            const span = document.createElement('span');
            span.className = 'emoji-content';
            span.style.fontSize = emojiFontSz + 'px';
            span.textContent = imgVal;
            back.appendChild(span);
        } else {
            const img = document.createElement('img');
            img.src = `https://flagcdn.com/40x30/${imgVal}.png`;
            img.alt = imgVal;
            img.style.maxWidth  = Math.floor(cardSize * 0.76) + 'px';
            img.style.maxHeight = Math.floor(cardSize * 0.76) + 'px';
            back.appendChild(img);
        }

        inner.appendChild(front);
        inner.appendChild(back);
        card.appendChild(inner);
        board.appendChild(card);
    });

    updatePairsCounter();

    // Timer
    document.getElementById('timer-display').textContent = '00:00';
    startTime = Date.now();
    timerInterval = setInterval(() => {
        elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        document.getElementById('timer-display').textContent = fmtTime(elapsedSeconds);
    }, 1000);

    showScreen('screen-game');
}

function updatePairsCounter() {
    const el = document.getElementById('pairs-counter');
    if (el) el.textContent = `${matchedPairs}/${totalPairs} ${T[lang].pairs}`;
    const mv = document.getElementById('moves-counter');
    if (mv) mv.textContent = `${moveCount} ${T[lang].moves}`;
}

function cancelPendingClose() {
    if (pendingClose !== null) {
        clearTimeout(pendingClose);
        pendingClose = null;
        const [a, b] = flippedCards;
        a.classList.remove('flipped');
        b.classList.remove('flipped');
        flippedCards = [];
        isLocked = false;
    }
}

function flipCard(card) {
    if (card.classList.contains('flipped'))  return;
    if (card.classList.contains('matched'))  return;

    // If a non-matched pair is waiting to close, cancel and close it immediately
    cancelPendingClose();

    if (isLocked) return;

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
        isLocked = true;
        moveCount++;
        updatePairsCounter();
        checkMatch();
    }
}

function checkMatch() {
    const [a, b] = flippedCards;
    if (a.dataset.value === b.dataset.value) {
        setTimeout(() => {
            a.classList.add('matched', 'no-click');
            b.classList.add('matched', 'no-click');
            flippedCards = [];
            isLocked = false;
            matchedPairs++;
            updatePairsCounter();
            if (matchedPairs === totalPairs) endGame();
        }, 500);
    } else {
        pendingClose = setTimeout(() => {
            a.classList.remove('flipped');
            b.classList.remove('flipped');
            flippedCards = [];
            isLocked = false;
            pendingClose = null;
        }, 900);
    }
}

function endGame() {
    clearInterval(timerInterval);
    timerInterval = null;

    const finalSec  = Math.floor((Date.now() - startTime) / 1000);
    const prevRec   = getRecord(selectedSizeKey);
    const isNew     = prevRec === null || finalSec < prevRec;
    if (isNew) saveRecord(selectedSizeKey, finalSec);

    const t = T[lang];
    document.getElementById('win-time').textContent  = fmtTime(finalSec);
    document.getElementById('win-moves').textContent = `${moveCount} ${t.moves}`;

    const recEl = document.getElementById('win-record');
    if (isNew) {
        recEl.textContent  = t.newRecord;
        recEl.className    = 'win-record new-record';
    } else {
        recEl.textContent  = `${t.prevRecord} ${fmtTime(prevRec)}`;
        recEl.className    = 'win-record';
    }

    showScreen('screen-win');
}

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
applyLang();
