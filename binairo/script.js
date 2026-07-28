(() => {
    const SIZES = [6, 8, 10];
    const RECORDS_KEY = 'binairoRecords';
    const PREF_KEY = 'binairoPrefs';

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
    const MAX_HINTS = 3;
    const SYMBOLS = ['', '☀️', '🌙'];

    const boardEl = document.getElementById('board');
    const sizeButtonsEl = document.getElementById('sizeButtons');
    const diffButtonsEl = document.getElementById('diffButtons');
    const newGameBtn = document.getElementById('newGameBtn');
    const timerEl = document.getElementById('timer');
    const recordDisplayEl = document.getElementById('recordDisplay');
    const winBanner = document.getElementById('winBanner');
    const winText = document.getElementById('winText');
    const winPlayAgain = document.getElementById('winPlayAgain');
    const hintBtn = document.getElementById('hintBtn');
    const hintCountEl = document.getElementById('hintCount');
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

    // ── Solver: liczy rozwiązania (do `cap`) backtrackingiem z przycinaniem ──
    // (limity liczności w wierszu/kolumnie, zakaz trójek, unikalność ukończonych
    // wierszy i kolumn). nodeBudget twardo ogranicza przeszukiwanie — po
    // przekroczeniu wynik jest "nierozstrzygnięty" (-1) i wywołujący traktuje go
    // zachowawczo, więc łamigłówka nigdy nie jest fałszywie uznana za jednoznaczną.
    function countSolutions(n, puzzle, cap, nodeBudget) {
        const grid = puzzle.map(row => row.slice());
        const half = n / 2;
        const rowCnt = Array.from({ length: n }, () => [0, 0, 0]);
        const colCnt = Array.from({ length: n }, () => [0, 0, 0]);
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
            const v = grid[r][c];
            if (v) { rowCnt[r][v]++; colCnt[c][v]++; }
        }
        let solutions = 0, nodes = 0, budgetExceeded = false;

        function tripleOk(r, c) {
            const v = grid[r][c];
            for (let s = Math.max(0, c - 2); s <= c && s + 2 < n; s++) {
                if (grid[r][s] === v && grid[r][s + 1] === v && grid[r][s + 2] === v) return false;
            }
            for (let s = Math.max(0, r - 2); s <= r && s + 2 < n; s++) {
                if (grid[s][c] === v && grid[s + 1][c] === v && grid[s + 2][c] === v) return false;
            }
            return true;
        }
        function rowUniqueOk(r) {
            for (let rr = 0; rr < r; rr++) {
                let same = true;
                for (let c = 0; c < n; c++) if (grid[rr][c] !== grid[r][c]) { same = false; break; }
                if (same) return false;
            }
            return true;
        }
        function colUniqueOk(c) {
            for (let cc = 0; cc < c; cc++) {
                let same = true;
                for (let r = 0; r < n; r++) if (grid[r][cc] !== grid[r][c]) { same = false; break; }
                if (same) return false;
            }
            return true;
        }
        function backtrack(idx) {
            if (solutions >= cap || budgetExceeded) return;
            if (++nodes > nodeBudget) { budgetExceeded = true; return; }
            while (idx < n * n && grid[Math.floor(idx / n)][idx % n] !== 0) idx++;
            if (idx === n * n) { solutions++; return; }
            const r = Math.floor(idx / n), c = idx % n;
            for (const v of [1, 2]) {
                if (rowCnt[r][v] >= half || colCnt[c][v] >= half) continue;
                grid[r][c] = v;
                rowCnt[r][v]++; colCnt[c][v]++;
                let ok = tripleOk(r, c);
                if (ok && c === n - 1) ok = rowUniqueOk(r);
                if (ok && r === n - 1) ok = colUniqueOk(c);
                if (ok) backtrack(idx + 1);
                grid[r][c] = 0;
                rowCnt[r][v]--; colCnt[c][v]--;
                if (solutions >= cap || budgetExceeded) return;
            }
        }
        backtrack(0);
        return budgetExceeded ? -1 : solutions;
    }

    // ── Losowa pełna, poprawna plansza (backtracking z losową kolejnością) ──
    function randomFullGrid(n) {
        const half = n / 2;
        const grid = Array.from({ length: n }, () => new Array(n).fill(0));
        const rowCnt = Array.from({ length: n }, () => [0, 0, 0]);
        const colCnt = Array.from({ length: n }, () => [0, 0, 0]);

        function tripleOk(r, c) {
            const v = grid[r][c];
            for (let s = Math.max(0, c - 2); s <= c && s + 2 < n; s++) {
                if (grid[r][s] === v && grid[r][s + 1] === v && grid[r][s + 2] === v) return false;
            }
            for (let s = Math.max(0, r - 2); s <= r && s + 2 < n; s++) {
                if (grid[s][c] === v && grid[s + 1][c] === v && grid[s + 2][c] === v) return false;
            }
            return true;
        }
        function rowUniqueOk(r) {
            for (let rr = 0; rr < r; rr++) {
                let same = true;
                for (let c = 0; c < n; c++) if (grid[rr][c] !== grid[r][c]) { same = false; break; }
                if (same) return false;
            }
            return true;
        }
        function colUniqueOk(c) {
            for (let cc = 0; cc < c; cc++) {
                let same = true;
                for (let r = 0; r < n; r++) if (grid[r][cc] !== grid[r][c]) { same = false; break; }
                if (same) return false;
            }
            return true;
        }
        function backtrack(idx) {
            if (idx === n * n) return true;
            const r = Math.floor(idx / n), c = idx % n;
            for (const v of shuffle([1, 2])) {
                if (rowCnt[r][v] >= half || colCnt[c][v] >= half) continue;
                grid[r][c] = v;
                rowCnt[r][v]++; colCnt[c][v]++;
                let ok = tripleOk(r, c);
                if (ok && c === n - 1) ok = rowUniqueOk(r);
                if (ok && r === n - 1) ok = colUniqueOk(c);
                if (ok && backtrack(idx + 1)) return true;
                grid[r][c] = 0;
                rowCnt[r][v]--; colCnt[c][v]--;
            }
            return false;
        }
        backtrack(0);
        return grid;
    }

    // ── Generator: pełna plansza → kucie dziur z gwarancją jednego rozwiązania ──
    const NODE_BUDGET = 60000;
    function generatePuzzle(n, difficulty) {
        const targetEmpty = Math.round(n * n * (difficulty === 'hard' ? 0.72 : 0.55));
        const solution = randomFullGrid(n);
        const puzzle = solution.map(row => row.slice());
        let emptied = 0;
        for (const [r, c] of shuffle(Array.from({ length: n * n }, (_, i) => [Math.floor(i / n), i % n]))) {
            if (emptied >= targetEmpty) break;
            const backup = puzzle[r][c];
            puzzle[r][c] = 0;
            if (countSolutions(n, puzzle, 2, NODE_BUDGET) === 1) emptied++;
            else puzzle[r][c] = backup;
        }
        return { puzzle, solution };
    }

    // ── Stan gry ──────────────────────────────────────────────────────────────
    let n = 6;
    let difficulty = 'easy';
    let values = [];          // values[r][c] = 0 (puste), 1 (☀️), 2 (🌙)
    let solution = null;
    let given = [];           // given[r][c] = true — pole startowe lub z podpowiedzi
    let hintsUsed = 0;
    let recordSaved = false;
    let selected = null;      // {r, c} lub null
    let timerInterval = null;
    let elapsedSec = 0;
    let solved = false;

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
    function startTimer() {
        stopTimer();
        elapsedSec = 0;
        timerEl.textContent = formatTime(0);
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

    // ── Renderowanie ──────────────────────────────────────────────────────────
    function render() {
        boardEl.style.setProperty('--n', n);
        boardEl.style.setProperty('--cell-font', `${Math.max(14, 34 - n * 1.6)}px`);
        boardEl.innerHTML = '';
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const btn = document.createElement('button');
                btn.className = 'cell';
                btn.type = 'button';
                btn.dataset.r = r;
                btn.dataset.c = c;
                btn.addEventListener('click', () => cellClick(r, c));
                boardEl.appendChild(btn);
            }
        }
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) updateCellDisplay(r, c);
    }

    function cellEl(r, c) {
        return boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    }
    function updateCellDisplay(r, c) {
        const el = cellEl(r, c);
        el.textContent = SYMBOLS[values[r][c]];
        el.classList.toggle('given', given[r][c]);
    }

    function selectCell(r, c) {
        if (solved) return;
        selected = { r, c };
        boardEl.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
        cellEl(r, c).classList.add('selected');
    }

    function cellClick(r, c) {
        if (solved) return;
        selectCell(r, c);
        if (given[r][c]) return;
        setValue(r, c, (values[r][c] + 1) % 3); // puste → ☀️ → 🌙 → puste
    }

    function setValue(r, c, v) {
        values[r][c] = v;
        updateCellDisplay(r, c);
        updateConflicts();
        checkWin();
    }

    // ── Naruszenia reguł: trójki, nadmiar symbolu, powtórzone wiersze/kolumny ──
    function findConflicts() {
        const half = n / 2;
        const bad = new Set();
        const mark = (r, c) => bad.add(r * n + c);

        for (let r = 0; r < n; r++) {
            for (let c = 0; c + 2 < n; c++) {
                const v = values[r][c];
                if (v && values[r][c + 1] === v && values[r][c + 2] === v) { mark(r, c); mark(r, c + 1); mark(r, c + 2); }
            }
        }
        for (let c = 0; c < n; c++) {
            for (let r = 0; r + 2 < n; r++) {
                const v = values[r][c];
                if (v && values[r + 1][c] === v && values[r + 2][c] === v) { mark(r, c); mark(r + 1, c); mark(r + 2, c); }
            }
        }
        for (let r = 0; r < n; r++) {
            for (const v of [1, 2]) {
                if (values[r].filter(x => x === v).length > half) {
                    for (let c = 0; c < n; c++) if (values[r][c] === v) mark(r, c);
                }
            }
        }
        for (let c = 0; c < n; c++) {
            const col = values.map(row => row[c]);
            for (const v of [1, 2]) {
                if (col.filter(x => x === v).length > half) {
                    for (let r = 0; r < n; r++) if (values[r][c] === v) mark(r, c);
                }
            }
        }
        // powtórzone kompletne wiersze/kolumny
        for (let a = 0; a < n; a++) {
            if (values[a].includes(0)) continue;
            for (let b = a + 1; b < n; b++) {
                if (values[b].includes(0)) continue;
                if (values[a].every((v, c) => v === values[b][c])) {
                    for (let c = 0; c < n; c++) { mark(a, c); mark(b, c); }
                }
            }
        }
        for (let a = 0; a < n; a++) {
            const colA = values.map(row => row[a]);
            if (colA.includes(0)) continue;
            for (let b = a + 1; b < n; b++) {
                const colB = values.map(row => row[b]);
                if (colB.includes(0)) continue;
                if (colA.every((v, r) => v === colB[r])) {
                    for (let r = 0; r < n; r++) { mark(r, a); mark(r, b); }
                }
            }
        }
        return bad;
    }
    function updateConflicts() {
        const bad = findConflicts();
        boardEl.querySelectorAll('.cell').forEach(el => {
            const idx = Number(el.dataset.r) * n + Number(el.dataset.c);
            el.classList.toggle('conflict', bad.has(idx));
        });
    }

    function checkWin() {
        if (values.some(row => row.includes(0))) return;
        if (findConflicts().size > 0) return;

        solved = true;
        stopTimer();
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

    // ── Podpowiedź: uzupełnia losowe błędne/puste pole poprawną wartością ────
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
        hintsUsed++;
        updateHintBtn();
        updateCellDisplay(r, c);
        selectCell(r, c);
        const el = cellEl(r, c);
        el.classList.add('hint-flash');
        setTimeout(() => el.classList.remove('hint-flash'), 900);
        updateConflicts();
        checkWin();
    }
    hintBtn.addEventListener('click', hint);

    // ── Klawiatura: 1 = ☀️, 2 = 🌙, 0/Backspace czyści, strzałki wybierają ──
    document.addEventListener('keydown', (e) => {
        if (e.target === playerNameEl) return; // pisanie imienia nie steruje grą
        if (!selected) return;
        const { r, c } = selected;
        if (e.key === '1' || e.key === '2') {
            if (!given[r][c] && !solved) setValue(r, c, Number(e.key));
            e.preventDefault();
            return;
        }
        if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
            if (!given[r][c] && !solved) setValue(r, c, 0);
            e.preventDefault();
            return;
        }
        const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (moves[e.key]) {
            const [dr, dc] = moves[e.key];
            selectCell(Math.min(n - 1, Math.max(0, r + dr)), Math.min(n - 1, Math.max(0, c + dc)));
            e.preventDefault();
        }
    });

    function newGame() {
        winBanner.hidden = true;
        solved = false;
        selected = null;
        hintsUsed = 0;
        recordSaved = false;
        syncSizeButtons();
        syncDiffButtons();
        const generated = generatePuzzle(n, difficulty);
        solution = generated.solution;
        values = generated.puzzle.map(row => row.slice());
        given = generated.puzzle.map(row => row.map(v => v !== 0));
        render();
        updateHintBtn();
        updateRecordDisplay();
        startTimer();
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
        document.querySelector('.game-subtitle').textContent = 'Fill the board with suns and moons — equal counts in every row and column, never three of the same next to each other.';
        const labels = document.querySelectorAll('.control-label');
        labels[0].textContent = 'Size';
        labels[1].textContent = 'Difficulty';
        diffButtonsEl.querySelector('[data-diff="easy"]').textContent = 'Easy';
        diffButtonsEl.querySelector('[data-diff="hard"]').textContent = 'Hard';
        hintBtn.firstChild.textContent = '💡 Hint ';
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
            <p>Fill every cell with a sun ☀️ or a moon 🌙. Tapping a cell cycles: empty → ☀️ → 🌙 → empty.</p>
            <p>Each row and each column must contain the same number of suns and moons. Three identical symbols may never stand next to each other (horizontally or vertically). No two rows may be identical — and no two columns either.</p>
            <p>Cells filled at the start (highlighted) are locked. Rule violations are highlighted in red.</p>
            <p>Keyboard: arrows select a cell, 1 = ☀️, 2 = 🌙, 0/Backspace clears. A hint fills one cell (3 per game). Records rank by hints used first, then by time.</p>`;
    }

    loadPrefs();
    newGame();

    // ── Jasny/ciemny motyw ────────────────────────────────────────────────
    (() => {
        const themeBtn = document.getElementById('themeBtn');
        const saved = localStorage.getItem('binairoTheme');
        if (saved === 'light') { document.body.classList.add('light'); themeBtn.textContent = TR.themeDark; } else { themeBtn.textContent = TR.themeLight; }
        themeBtn.addEventListener('click', () => {
            const light = document.body.classList.toggle('light');
            themeBtn.textContent = light ? TR.themeDark : TR.themeLight;
            localStorage.setItem('binairoTheme', light ? 'light' : 'dark');
        });
    })();
})();
