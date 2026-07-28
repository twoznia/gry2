(() => {
    const SIZES = [4, 5, 6, 7];
    const RECORDS_KEY = 'calcudokuRecords';
    const PREF_KEY = 'calcudokuPrefs';

    // ── Język: wspólny przełącznik PL/EN (klucz 'lang', jak w Pisaniu) ────────
    const lang = localStorage.getItem('lang') || 'pl';
    const TR = lang === 'en' ? {
        solved: 'Solved! Time:',
        hintsInfo: h => `💡 Hints used: ${h} — results with fewer hints rank higher.`,
        saved: '✓ Score saved!',
        noRecords: 'No records for this mode yet.',
        thName: 'Name', thTime: 'Time', thDate: 'Date',
        easy: 'Easy', hard: 'Hard',
        themeDark: '🌙 Dark', themeLight: '☀️ Light',
    } : {
        solved: 'Rozwiązane! Czas:',
        hintsInfo: h => `💡 Użyto podpowiedzi: ${h} — w rankingu wygrywają wyniki z mniejszą liczbą podpowiedzi.`,
        saved: '✓ Wynik zapisany!',
        noRecords: 'Brak rekordów dla tego trybu.',
        thName: 'Imię', thTime: 'Czas', thDate: 'Data',
        easy: 'Łatwy', hard: 'Trudny',
        themeDark: '🌙 Ciemny', themeLight: '☀️ Jasny',
    };
    const SAVE_KEY = 'calcudokuSave';
    const MAX_HINTS = 3;

    const boardEl = document.getElementById('board');
    const numpadEl = document.getElementById('numpad');
    const sizeButtonsEl = document.getElementById('sizeButtons');
    const diffButtonsEl = document.getElementById('diffButtons');
    const newGameBtn = document.getElementById('newGameBtn');
    const timerEl = document.getElementById('timer');
    const recordDisplayEl = document.getElementById('recordDisplay');
    const winBanner = document.getElementById('winBanner');
    const winText = document.getElementById('winText');
    const winPlayAgain = document.getElementById('winPlayAgain');
    const noteBtn = document.getElementById('noteBtn');
    const hintBtn = document.getElementById('hintBtn');
    const hintCountEl = document.getElementById('hintCount');
    const undoBtn = document.getElementById('undoBtn');
    const nameRow = document.getElementById('nameRow');
    const playerNameEl = document.getElementById('playerName');
    const saveBtn = document.getElementById('saveBtn');
    const saveInfoEl = document.getElementById('saveInfo');
    const recordsBtn = document.getElementById('recordsBtn');
    const recPanel = document.getElementById('recPanel');
    const recTabsEl = document.getElementById('recTabs');
    const recTableEl = document.getElementById('recTable');
    const recCloseBtn = document.getElementById('recCloseBtn');

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ── Losowy kwadrat łaciński n×n (jak w Piramidach) ────────────────────────
    function randomLatinSquare(n) {
        let grid = [];
        for (let r = 0; r < n; r++) {
            const row = [];
            for (let c = 0; c < n; c++) row.push(((c + r) % n) + 1);
            grid.push(row);
        }
        const rowOrder = shuffle([...Array(n).keys()]);
        const colOrder = shuffle([...Array(n).keys()]);
        const symbolMap = shuffle([...Array(n).keys()]).map(v => v + 1);
        grid = rowOrder.map(r => colOrder.map(c => symbolMap[grid[r][c] - 1]));
        return grid;
    }

    // ── Podział planszy na klatki (losowy rozrost regionów) + działania ──────
    function makeCages(n, difficulty, grid) {
        const cageId = Array.from({ length: n }, () => new Array(n).fill(-1));
        const cages = []; // { cells: [[r,c],...], op, target }
        const maxSize = difficulty === 'hard' ? 4 : 3;
        const singleChance = difficulty === 'hard' ? 0.05 : 0.15;

        for (const [r0, c0] of shuffle(Array.from({ length: n * n }, (_, i) => [Math.floor(i / n), i % n]))) {
            if (cageId[r0][c0] !== -1) continue;
            const id = cages.length;
            const cells = [[r0, c0]];
            cageId[r0][c0] = id;
            const targetSize = Math.random() < singleChance ? 1 : 2 + Math.floor(Math.random() * (maxSize - 1));
            while (cells.length < targetSize) {
                const frontier = [];
                for (const [r, c] of cells) {
                    for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                        const rr = r + dr, cc = c + dc;
                        if (rr >= 0 && rr < n && cc >= 0 && cc < n && cageId[rr][cc] === -1) frontier.push([rr, cc]);
                    }
                }
                if (!frontier.length) break;
                const [r, c] = frontier[Math.floor(Math.random() * frontier.length)];
                cageId[r][c] = id;
                cells.push([r, c]);
            }
            cages.push({ cells });
        }

        // Działanie i cel na podstawie wartości z rozwiązania. Łatwy: tylko + i −;
        // trudny: także × i ÷ (÷ preferowane, gdy wartości są podzielne).
        for (const cage of cages) {
            const vals = cage.cells.map(([r, c]) => grid[r][c]);
            if (vals.length === 1) { cage.op = '='; cage.target = vals[0]; continue; }
            const sum = vals.reduce((a, b) => a + b, 0);
            const prod = vals.reduce((a, b) => a * b, 1);
            const hi = Math.max(...vals), lo = Math.min(...vals);
            const ops = [];
            if (difficulty === 'hard') {
                if (vals.length === 2) {
                    ops.push('+', '-', '×');
                    if (hi % lo === 0) ops.push('÷', '÷');
                } else {
                    ops.push('+', '×');
                }
            } else {
                if (vals.length === 2) ops.push('+', '-', '-');
                else ops.push('+');
            }
            cage.op = ops[Math.floor(Math.random() * ops.length)];
            cage.target = cage.op === '+' ? sum
                : cage.op === '-' ? hi - lo
                : cage.op === '×' ? prod
                : hi / lo;
        }
        return { cageId, cages };
    }

    // ── Solver: liczy rozwiązania (do cap) z przycinaniem klatek ─────────────
    // nodeBudget twardo ogranicza przeszukiwanie — wynik -1 = nierozstrzygnięte,
    // traktowane zachowawczo (nowa plansza), więc łamigłówka nigdy nie jest
    // fałszywie uznana za jednoznaczną.
    function countSolutions(n, cages, cageId, cap, nodeBudget) {
        const grid = Array.from({ length: n }, () => new Array(n).fill(0));
        const rowUsed = new Array(n).fill(0);
        const colUsed = new Array(n).fill(0);
        const cageState = cages.map(cage => ({ left: cage.cells.length, vals: [] }));
        let solutions = 0, nodes = 0, budgetExceeded = false;
        const found = [];

        function cageOk(cg, st, closing) {
            const { op, target } = cg;
            const vals = st.vals;
            if (op === '=') return vals[0] === target;
            if (op === '+') {
                const sum = vals.reduce((a, b) => a + b, 0);
                if (closing) return sum === target;
                return sum + st.left <= target && sum + st.left * n >= target;
            }
            if (op === '×') {
                const prod = vals.reduce((a, b) => a * b, 1);
                if (closing) return prod === target;
                return target % prod === 0;
            }
            // − i ÷ tylko 2-komórkowe: sprawdzane przy domknięciu
            if (!closing) return true;
            const [a, b] = vals;
            const hi = Math.max(a, b), lo = Math.min(a, b);
            return op === '-' ? hi - lo === target : hi === lo * target;
        }

        function backtrack(idx) {
            if (solutions >= cap || budgetExceeded) return;
            if (++nodes > nodeBudget) { budgetExceeded = true; return; }
            if (idx === n * n) {
                solutions++;
                if (found.length < 2) found.push(grid.map(row => row.slice()));
                return;
            }
            const r = Math.floor(idx / n), c = idx % n;
            const cid = cageId[r][c];
            const cg = cages[cid], st = cageState[cid];
            for (let v = 1; v <= n; v++) {
                const bit = 1 << (v - 1);
                if ((rowUsed[r] & bit) || (colUsed[c] & bit)) continue;
                st.vals.push(v); st.left--;
                if (cageOk(cg, st, st.left === 0)) {
                    grid[r][c] = v;
                    rowUsed[r] |= bit; colUsed[c] |= bit;
                    backtrack(idx + 1);
                    rowUsed[r] &= ~bit; colUsed[c] &= ~bit;
                    grid[r][c] = 0;
                }
                st.vals.pop(); st.left++;
                if (solutions >= cap || budgetExceeded) return;
            }
        }
        backtrack(0);
        return { count: budgetExceeded ? -1 : solutions, found };
    }

    // ── Generator: plansza + klatki; jeśli układ niejednoznaczny, wydziela
    //    1-polową klatkę w miejscu, gdzie alternatywne rozwiązanie się różni ──
    const NODE_BUDGET = 200000;
    function generatePuzzle(n, difficulty) {
        for (;;) {
            const grid = randomLatinSquare(n);
            const { cageId, cages } = makeCages(n, difficulty, grid);
            let splits = 0;
            while (splits < n * n) {
                const res = countSolutions(n, cages, cageId, 2, NODE_BUDGET);
                if (res.count === 1) return { solution: grid, cageId, cages };
                if (res.count === -1) break; // budżet przekroczony — nowa plansza
                const alt = res.found.find(sol => sol.some((row, r) => row.some((v, c) => v !== grid[r][c])));
                if (!alt) break;
                const diffs = [];
                for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
                    if (alt[r][c] !== grid[r][c] && cages[cageId[r][c]].cells.length > 1) diffs.push([r, c]);
                }
                if (!diffs.length) break;
                const [r, c] = diffs[Math.floor(Math.random() * diffs.length)];
                const old = cages[cageId[r][c]];
                old.cells = old.cells.filter(([rr, cc]) => rr !== r || cc !== c);
                const vals = old.cells.map(([rr, cc]) => grid[rr][cc]);
                if (vals.length === 1) { old.op = '='; old.target = vals[0]; }
                else if (old.op === '+') old.target = vals.reduce((a, b) => a + b, 0);
                else if (old.op === '×') old.target = vals.reduce((a, b) => a * b, 1);
                else {
                    const hi = Math.max(...vals), lo = Math.min(...vals);
                    if (old.op === '÷' && hi % lo !== 0) old.op = '-';
                    old.target = old.op === '-' ? hi - lo : hi / lo;
                }
                cageId[r][c] = cages.length;
                cages.push({ cells: [[r, c]], op: '=', target: grid[r][c] });
                splits++;
            }
        }
    }

    // ── Stan gry ──────────────────────────────────────────────────────────────
    let n = 4;
    let difficulty = 'easy';
    let cages = null;         // [{ cells, op, target }]
    let cageId = null;        // cageId[r][c] = indeks klatki
    let solution = null;
    let values = [];
    let notes = [];
    let given = [];           // pola uzupełnione podpowiedzią (zablokowane)
    let noteMode = false;
    let hintsUsed = 0;
    let recordSaved = false;
    let selected = null;
    let timerInterval = null;
    let elapsedSec = 0;
    let solved = false;
    let history = [];         // stos ruchów do cofania: { r, c, oldVal, oldNotes }

    function loadPrefs() {
        try {
            const p = JSON.parse(localStorage.getItem(PREF_KEY)) || {};
            if (SIZES.includes(p.n)) n = p.n;
            if (p.difficulty === 'easy' || p.difficulty === 'hard') difficulty = p.difficulty;
        } catch (e) { /* domyślne wartości */ }
    }
    function savePrefs() {
        localStorage.setItem(PREF_KEY, JSON.stringify({ n, difficulty }));
    }

    // ── Autozapis: gra wznawia się z tego samego miejsca po powrocie ─────────
    function saveState() {
        if (solved || !cages) return;
        const state = {
            n, difficulty, cages, cageId, solution, hintsUsed, elapsedSec,
            values,
            given,
            notes: notes.map(row => row.map(set => [...set])),
            history: history.map(h => ({ r: h.r, c: h.c, oldVal: h.oldVal, oldNotes: [...h.oldNotes] })),
        };
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* brak miejsca — trudno */ }
    }
    function clearSave() {
        localStorage.removeItem(SAVE_KEY);
    }
    function restoreState() {
        let s;
        try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
        if (!s || !SIZES.includes(s.n) || !s.cages || !s.cageId || !s.solution || !s.values) return false;
        n = s.n;
        difficulty = s.difficulty === 'hard' ? 'hard' : 'easy';
        cages = s.cages;
        cageId = s.cageId;
        solution = s.solution;
        values = s.values;
        given = s.given;
        notes = s.notes.map(row => row.map(arr => new Set(arr)));
        history = (s.history || []).map(h => ({ r: h.r, c: h.c, oldVal: h.oldVal, oldNotes: new Set(h.oldNotes) }));
        hintsUsed = s.hintsUsed || 0;
        solved = false;
        selected = null;
        noteMode = false;
        recordSaved = false;
        syncSizeButtons();
        syncDiffButtons();
        render();
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) updateCellDisplay(r, c);
        updateConflicts();
        updateCageFeedback();
        updateHintBtn();
        updateUndoBtn();
        updateRecordDisplay();
        startTimer(s.elapsedSec || 0);
        return true;
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); });
    window.addEventListener('pagehide', saveState);

    // ── Rekordy: ranking najpierw wg liczby podpowiedzi, potem czasu ─────────
    function recordKey() { return `${n}-${difficulty}`; }
    function recordLabel(key) {
        const [size, diff] = key.split('-');
        return `${size}×${size} ${diff === 'hard' ? TR.hard : TR.easy}`;
    }
    function loadRecords() {
        try { return JSON.parse(localStorage.getItem(RECORDS_KEY)) || {}; } catch (e) { return {}; }
    }
    function recHints(row) { return row.hints || 0; }
    function bestTime() {
        const rows = loadRecords()[recordKey()];
        return Array.isArray(rows) && rows.length ? rows[0].time : null;
    }
    function saveRecord(name, key, sec, hints) {
        const records = loadRecords();
        const rows = Array.isArray(records[key]) ? records[key] : [];
        rows.push({ name, time: sec, hints, date: new Date().toLocaleDateString('pl-PL') });
        rows.sort((a, b) => recHints(a) - recHints(b) || a.time - b.time);
        records[key] = rows.slice(0, 10);
        localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
    }
    function formatTime(sec) {
        const m = Math.floor(sec / 60), s = sec % 60;
        return `${m}:${String(s).padStart(2, '0')}`;
    }
    function updateRecordDisplay() {
        const b = bestTime();
        recordDisplayEl.textContent = b == null ? '—' : formatTime(b);
    }

    function recordCombos() {
        const combos = [];
        SIZES.forEach(size => ['easy', 'hard'].forEach(diff => combos.push(`${size}-${diff}`)));
        return combos;
    }
    let recActiveKey = recordKey();
    function renderRecTable(key) {
        const rows = loadRecords()[key];
        if (!Array.isArray(rows) || !rows.length) return `<p class="rec-empty">${TR.noRecords}</p>`;
        const medals = ['🥇', '🥈', '🥉'];
        let h = `<table class="rec-table"><thead><tr><th>#</th><th>${TR.thName}</th><th>${TR.thTime}</th><th>💡</th><th>${TR.thDate}</th></tr></thead><tbody>`;
        rows.forEach((r, i) => {
            h += `<tr><td>${medals[i] || `${i + 1}.`}</td><td>${r.name}</td><td>${formatTime(r.time)}</td><td>${recHints(r)}</td><td>${r.date}</td></tr>`;
        });
        return h + '</tbody></table>';
    }
    function buildRecTabs() {
        recTabsEl.innerHTML = '';
        recordCombos().forEach(key => {
            const b = document.createElement('button');
            b.className = 'rec-tab' + (key === recActiveKey ? ' active' : '');
            b.textContent = recordLabel(key);
            b.addEventListener('click', () => {
                recActiveKey = key;
                buildRecTabs();
                recTableEl.innerHTML = renderRecTable(recActiveKey);
            });
            recTabsEl.appendChild(b);
        });
        recTableEl.innerHTML = renderRecTable(recActiveKey);
    }
    function openRecords() {
        recActiveKey = recordKey();
        buildRecTabs();
        recPanel.classList.add('show');
    }
    recordsBtn.addEventListener('click', openRecords);
    recCloseBtn.addEventListener('click', () => recPanel.classList.remove('show'));

    function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null; } }
    function startTimer(fromSec = 0) {
        stopTimer();
        elapsedSec = fromSec;
        timerEl.textContent = formatTime(elapsedSec);
        timerInterval = setInterval(() => {
            elapsedSec++;
            timerEl.textContent = formatTime(elapsedSec);
        }, 1000);
    }

    // ── Przyciski rozmiaru i trudności ────────────────────────────────────────
    SIZES.forEach(size => {
        const b = document.createElement('button');
        b.className = 'pill';
        b.textContent = `${size}×${size}`;
        b.dataset.size = size;
        b.addEventListener('click', () => { n = size; savePrefs(); newGame(); });
        sizeButtonsEl.appendChild(b);
    });
    function syncSizeButtons() {
        [...sizeButtonsEl.children].forEach(b => b.classList.toggle('active', Number(b.dataset.size) === n));
    }
    diffButtonsEl.querySelectorAll('.pill').forEach(b => {
        b.addEventListener('click', () => { difficulty = b.dataset.diff; savePrefs(); newGame(); });
    });
    function syncDiffButtons() {
        diffButtonsEl.querySelectorAll('.pill').forEach(b => b.classList.toggle('active', b.dataset.diff === difficulty));
    }

    // ── Renderowanie: siatka + grube granice klatek + etykiety wyników ───────
    function cageLabelText(cage) {
        return cage.op === '=' ? String(cage.target) : `${cage.target}${cage.op}`;
    }
    function render() {
        boardEl.style.setProperty('--n', n);
        boardEl.style.setProperty('--cell-font', `${Math.max(15, 32 - n * 2)}px`);
        boardEl.style.setProperty('--label-font', `${Math.max(8, 15 - n)}px`);
        boardEl.innerHTML = '';

        // komórka-kotwica klatki (pierwsza w kolejności czytania) dostaje etykietę
        const anchor = cages.map(cage => cage.cells.reduce((best, cell) =>
            (cell[0] * n + cell[1] < best[0] * n + best[1] ? cell : best)));

        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const btn = document.createElement('button');
                btn.className = 'cell';
                btn.type = 'button';
                btn.dataset.r = r;
                btn.dataset.c = c;
                if (r > 0 && cageId[r - 1][c] !== cageId[r][c]) btn.classList.add('cb-t');
                if (c > 0 && cageId[r][c - 1] !== cageId[r][c]) btn.classList.add('cb-l');
                btn.addEventListener('click', () => selectCell(r, c));
                boardEl.appendChild(btn);
            }
        }
        anchor.forEach(([r, c], id) => {
            const span = document.createElement('span');
            span.className = 'cage-label';
            span.textContent = cageLabelText(cages[id]);
            cellEl(r, c).appendChild(span);
        });
        renderNumpad();
    }

    function renderNumpad() {
        numpadEl.innerHTML = '';
        for (let v = 1; v <= n; v++) {
            const b = document.createElement('button');
            b.className = 'num-btn';
            b.textContent = v;
            b.addEventListener('click', () => inputValue(v));
            numpadEl.appendChild(b);
        }
        const clearBtn = document.createElement('button');
        clearBtn.className = 'num-btn clear-btn';
        clearBtn.textContent = '×';
        clearBtn.addEventListener('click', () => inputValue(0));
        numpadEl.appendChild(clearBtn);
    }

    function cellEl(r, c) {
        return boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    }

    // ── Notatki: mini-siatka kandydujących liczb (etykieta klatki zostaje) ───
    function buildNotesHtml(noteSet) {
        const cols = Math.ceil(Math.sqrt(n));
        let h = `<div class="notes-grid" style="grid-template-columns: repeat(${cols}, 1fr);">`;
        for (let v = 1; v <= n; v++) h += `<div class="note${noteSet.has(v) ? '' : ' off'}">${v}</div>`;
        return h + '</div>';
    }

    function updateCellDisplay(r, c) {
        const el = cellEl(r, c);
        el.classList.toggle('given', given[r][c]);
        const label = el.querySelector('.cage-label');
        el.textContent = values[r][c] !== 0 ? values[r][c] : '';
        if (values[r][c] === 0 && notes[r][c].size > 0) el.innerHTML = buildNotesHtml(notes[r][c]);
        if (label) el.prepend(label);
    }

    function selectCell(r, c) {
        if (solved) return;
        selected = { r, c };
        boardEl.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
        cellEl(r, c).classList.add('selected');
    }

    function pushHistory(r, c) {
        history.push({ r, c, oldVal: values[r][c], oldNotes: new Set(notes[r][c]) });
        if (history.length > 300) history.shift();
        updateUndoBtn();
    }

    function inputValue(v) {
        if (!selected || solved) return;
        const { r, c } = selected;
        if (given[r][c]) return;

        if (noteMode && v !== 0) {
            pushHistory(r, c);
            if (notes[r][c].has(v)) notes[r][c].delete(v); else notes[r][c].add(v);
            updateCellDisplay(r, c);
            saveState();
            return;
        }

        pushHistory(r, c);
        values[r][c] = values[r][c] === v ? 0 : v;   // ponowne kliknięcie tej samej liczby czyści pole
        if (values[r][c] !== 0) {
            notes[r][c].clear();
            for (let i = 0; i < n; i++) { notes[r][i].delete(values[r][c]); notes[i][c].delete(values[r][c]); }
        }
        updateCellDisplay(r, c);
        updateConflicts();
        updateCageFeedback();
        checkWin();
        saveState();
    }

    // ── Cofanie ───────────────────────────────────────────────────────────────
    function updateUndoBtn() { undoBtn.disabled = history.length === 0; }
    function undo() {
        if (solved || !history.length) return;
        const { r, c, oldVal, oldNotes } = history.pop();
        values[r][c] = oldVal;
        notes[r][c] = new Set(oldNotes);
        selectCell(r, c);
        updateCellDisplay(r, c);
        updateConflicts();
        updateCageFeedback();
        updateUndoBtn();
        saveState();
    }
    undoBtn.addEventListener('click', undo);

    // ── Podświetlenie powtórzonych liczb w wierszu/kolumnie ──────────────────
    function groupByValue(getValue, length) {
        const groups = new Map();
        for (let i = 0; i < length; i++) {
            const v = getValue(i);
            if (!v) continue;
            if (!groups.has(v)) groups.set(v, []);
            groups.get(v).push(i);
        }
        return groups;
    }
    function updateConflicts() {
        boardEl.querySelectorAll('.cell.conflict').forEach(el => el.classList.remove('conflict'));
        for (let r = 0; r < n; r++) {
            for (const cols of groupByValue(c => values[r][c], n).values()) {
                if (cols.length > 1) cols.forEach(c => cellEl(r, c).classList.add('conflict'));
            }
        }
        for (let c = 0; c < n; c++) {
            for (const rows of groupByValue(r => values[r][c], n).values()) {
                if (rows.length > 1) rows.forEach(r => cellEl(r, c).classList.add('conflict'));
            }
        }
    }

    // ── Klatka wypełniona w całości i błędna → podświetlenie ─────────────────
    function cageSatisfied(cage) {
        const vals = cage.cells.map(([r, c]) => values[r][c]);
        if (vals.includes(0)) return null; // niekompletna
        const { op, target } = cage;
        if (op === '=') return vals[0] === target;
        if (op === '+') return vals.reduce((a, b) => a + b, 0) === target;
        if (op === '×') return vals.reduce((a, b) => a * b, 1) === target;
        const hi = Math.max(...vals), lo = Math.min(...vals);
        return op === '-' ? hi - lo === target : hi === lo * target;
    }
    function updateCageFeedback() {
        boardEl.querySelectorAll('.cell.cage-bad').forEach(el => el.classList.remove('cage-bad'));
        for (const cage of cages) {
            if (cageSatisfied(cage) === false) {
                cage.cells.forEach(([r, c]) => cellEl(r, c).classList.add('cage-bad'));
            }
        }
    }

    function checkWin() {
        if (values.some(row => row.includes(0))) return;
        if (boardEl.querySelectorAll('.cell.conflict').length > 0) return;
        if (cages.some(cage => cageSatisfied(cage) === false)) return;

        solved = true;
        stopTimer();
        clearSave();
        winText.textContent = `${TR.solved} ${formatTime(elapsedSec)}`;
        recordSaved = false;
        nameRow.style.display = 'flex';
        saveBtn.disabled = false;
        playerNameEl.value = '';
        saveInfoEl.style.display = hintsUsed > 0 ? 'block' : 'none';
        saveInfoEl.textContent = hintsUsed > 0
            ? TR.hintsInfo(hintsUsed)
            : '';
        winBanner.hidden = false;
        winBanner.scrollIntoView({ behavior: 'smooth', block: 'center' }); // na telefonie baner bywa poza ekranem
    }

    // ── Podpowiedź ────────────────────────────────────────────────────────────
    function updateHintBtn() {
        const remaining = MAX_HINTS - hintsUsed;
        hintCountEl.textContent = `(${remaining})`;
        hintBtn.disabled = remaining <= 0;
    }
    function hint() {
        if (solved || hintsUsed >= MAX_HINTS) return;
        const empties = [];
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                if (!given[r][c] && values[r][c] !== solution[r][c]) empties.push({ r, c });
            }
        }
        if (!empties.length) return;
        const { r, c } = empties[Math.floor(Math.random() * empties.length)];
        values[r][c] = solution[r][c];
        given[r][c] = true;
        notes[r][c].clear();
        for (let i = 0; i < n; i++) { notes[r][i].delete(values[r][c]); notes[i][c].delete(values[r][c]); }
        hintsUsed++;
        updateHintBtn();
        updateCellDisplay(r, c);
        selectCell(r, c);
        const el = cellEl(r, c);
        el.classList.add('hint-flash');
        setTimeout(() => el.classList.remove('hint-flash'), 900);
        updateConflicts();
        updateCageFeedback();
        checkWin();
        saveState();
    }
    hintBtn.addEventListener('click', hint);

    // ── Notatki: przełącznik trybu ────────────────────────────────────────
    function toggleNoteMode() {
        noteMode = !noteMode;
        noteBtn.classList.toggle('active', noteMode);
    }
    noteBtn.addEventListener('click', toggleNoteMode);

    // ── Klawiatura ────────────────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
        if (e.target === playerNameEl) return; // pisanie imienia nie steruje grą
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { undo(); e.preventDefault(); return; }
        if (e.key === 'n' || e.key === 'N') { toggleNoteMode(); return; }
        if (!selected) return;
        if (e.key >= '1' && e.key <= '9') {
            const v = Number(e.key);
            if (v <= n) { inputValue(v); e.preventDefault(); }
            return;
        }
        if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
            inputValue(0);
            e.preventDefault();
            return;
        }
        const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (moves[e.key]) {
            const [dr, dc] = moves[e.key];
            const r = Math.min(n - 1, Math.max(0, selected.r + dr));
            const c = Math.min(n - 1, Math.max(0, selected.c + dc));
            selectCell(r, c);
            e.preventDefault();
        }
    });

    function newGame() {
        winBanner.hidden = true;
        solved = false;
        selected = null;
        noteMode = false;
        noteBtn.classList.remove('active');
        hintsUsed = 0;
        recordSaved = false;
        history = [];
        updateUndoBtn();
        clearSave();
        syncSizeButtons();
        syncDiffButtons();
        const generated = generatePuzzle(n, difficulty);
        solution = generated.solution;
        cages = generated.cages;
        cageId = generated.cageId;
        values = Array.from({ length: n }, () => new Array(n).fill(0));
        notes = Array.from({ length: n }, () => Array.from({ length: n }, () => new Set()));
        given = Array.from({ length: n }, () => new Array(n).fill(false));
        render();
        updateHintBtn();
        updateRecordDisplay();
        startTimer();
        saveState(); // odświeżenie strony w trakcie gry wznowi tę samą planszę
    }

    newGameBtn.addEventListener('click', newGame);
    winPlayAgain.addEventListener('click', newGame);
    saveBtn.addEventListener('click', () => {
        if (recordSaved) return;
        const name = playerNameEl.value.trim();
        if (!name) { playerNameEl.focus(); return; }
        saveRecord(name, recordKey(), elapsedSec, hintsUsed);
        recordSaved = true;
        saveBtn.disabled = true;
        updateRecordDisplay();
        saveInfoEl.style.display = 'block';
        saveInfoEl.textContent = TR.saved;
    });
    playerNameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveBtn.click(); });

    // ── Przełącznik języka + tłumaczenie statycznych tekstów strony ─────────
    (() => {
        const pl = document.getElementById('langPl');
        const en = document.getElementById('langEn');
        (lang === 'en' ? en : pl).classList.add('active');
        pl.addEventListener('click', () => { localStorage.setItem('lang', 'pl'); location.reload(); });
        en.addEventListener('click', () => { localStorage.setItem('lang', 'en'); location.reload(); });
    })();
    if (lang === 'en') {
        document.documentElement.lang = 'en';
        document.querySelector('.game-subtitle').textContent = 'Fill the grid with numbers 1–n, no repeats in rows or columns, so every cage produces its result.';
        const labels = document.querySelectorAll('.control-label');
        labels[0].textContent = 'Size';
        labels[1].textContent = 'Difficulty';
        diffButtonsEl.querySelector('[data-diff="easy"]').textContent = 'Easy';
        diffButtonsEl.querySelector('[data-diff="hard"]').textContent = 'Hard';
        noteBtn.textContent = '✏️ Notes';
        hintBtn.firstChild.textContent = '💡 Hint ';
        undoBtn.textContent = '↩️ Undo';
        newGameBtn.textContent = 'New game';
        timerEl.parentNode.firstChild.textContent = 'Time: ';
        recordDisplayEl.parentNode.firstChild.textContent = 'Best: ';
        recordsBtn.textContent = '🏆 Records';
        playerNameEl.placeholder = 'Your name…';
        saveBtn.textContent = 'Save';
        winPlayAgain.textContent = 'Play again';
        recPanel.querySelector('h3').textContent = '🏆 Records';
        recCloseBtn.textContent = 'Close';
        document.querySelector('.rules').innerHTML = `
            <summary>How to play</summary>
            <p>Fill the grid with numbers 1 to n (n = board size) — each number exactly once in every row and column.</p>
            <p>The board is divided into cages (thick borders). Numbers in a cage must produce the result in its corner: e.g. "12×" means a product of 12, "3−" a difference of 3, "2÷" a quotient of 2. A cage with a plain number is a single cell of that value. Subtraction and division appear only in 2-cell cages — the order of numbers does not matter.</p>
            <p>Tap a cell, then a number on the keypad below the board. Repeated numbers and wrong cages turn red.</p>
            <p>Notes mode (the "Notes" button or the N key) stores candidate numbers. A hint fills one cell (3 per game) — records rank by hints used first, then by time. "Undo" (Ctrl+Z) reverts moves. The game saves automatically and resumes when you return.</p>`;
    }

    loadPrefs();
    if (!restoreState()) newGame(); // wznów zapisaną grę, jeśli jest

    // ── Jasny/ciemny motyw ────────────────────────────────────────────────
    (() => {
        const themeBtn = document.getElementById('themeBtn');
        const saved = localStorage.getItem('calcudokuTheme');
        if (saved === 'light') { document.body.classList.add('light'); themeBtn.textContent = TR.themeDark; } else { themeBtn.textContent = TR.themeLight; }
        themeBtn.addEventListener('click', () => {
            const light = document.body.classList.toggle('light');
            themeBtn.textContent = light ? TR.themeDark : TR.themeLight;
            localStorage.setItem('calcudokuTheme', light ? 'light' : 'dark');
        });
    })();
})();
