(() => {
    const SIZES = [5, 10, 15];
    const RECORDS_KEY = 'nonogramRecords';
    const PREF_KEY = 'nonogramPrefs';

    // ── Język: wspólny przełącznik PL/EN (klucz 'lang', jak w Pisaniu) ────────
    const lang = localStorage.getItem('lang') || 'pl';
    const MOTIF_EN = {
        'Serce': 'Heart', 'Plus': 'Plus', 'Choinka': 'Tree', 'Kielich': 'Goblet',
        'Strzałka': 'Arrow', 'Domek': 'House', 'Litera T': 'Letter T',
        'Kotek': 'Kitten', 'Łódka': 'Boat', 'Grzybek': 'Mushroom', 'Kubek': 'Mug',
        'Motyl': 'Butterfly', 'Kot': 'Cat', 'Żaglówka': 'Sailboat', 'Gwiazda': 'Star', 'Rakieta': 'Rocket',
    };
    const TR = lang === 'en' ? {
        solved: t => `Solved! Time: ${t}`,
        solvedMotif: (m, t) => `Solved! It's: ${MOTIF_EN[m] || m} 🖼️ Time: ${t}`,
        hintsInfo: h => `💡 Hints used: ${h} — results with fewer hints rank higher.`,
        saved: '✓ Score saved!',
        noRecords: 'No records for this mode yet.',
        thName: 'Name', thTime: 'Time', thDate: 'Date',
        themeDark: '🌙 Dark', themeLight: '☀️ Light',
    } : {
        solved: t => `Rozwiązane! Czas: ${t}`,
        solvedMotif: (m, t) => `Rozwiązane! To: ${m} 🖼️ Czas: ${t}`,
        hintsInfo: h => `💡 Użyto podpowiedzi: ${h} — w rankingu wygrywają wyniki z mniejszą liczbą podpowiedzi.`,
        saved: '✓ Wynik zapisany!',
        noRecords: 'Brak rekordów dla tego trybu.',
        thName: 'Imię', thTime: 'Czas', thDate: 'Data',
        themeDark: '🌙 Ciemny', themeLight: '☀️ Jasny',
    };
    const SAVE_KEY = 'nonogramSave';
    const MAX_HINTS = 3;

    const boardEl = document.getElementById('board');
    const toolbarEl = document.getElementById('toolbar');
    const sizeButtonsEl = document.getElementById('sizeButtons');
    const modeButtonsEl = document.getElementById('modeButtons');
    const newGameBtn = document.getElementById('newGameBtn');
    const timerEl = document.getElementById('timer');
    const recordDisplayEl = document.getElementById('recordDisplay');
    const winBanner = document.getElementById('winBanner');
    const winText = document.getElementById('winText');
    const winPlayAgain = document.getElementById('winPlayAgain');
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

    // ── Ciągi zamalowanych pól w linii, np. [1,0,1,1,0] → [1,2] ──────────────
    function runsOf(line) {
        const runs = [];
        let len = 0;
        for (const v of line) {
            if (v === 1) len++;
            else if (len) { runs.push(len); len = 0; }
        }
        if (len) runs.push(len);
        return runs;
    }

    // ── Dedukcje liniowe: przecięcie wszystkich legalnych ułożeń ciągów ──────
    // cells: 0 = nieznane, 1 = zamalowane, 2 = puste. Zwraca listę wymuszeń
    // [indeks, wartość] albo null przy sprzeczności.
    function lineDeductions(cells, runs) {
        const L = cells.length;
        const canFill = new Array(L).fill(false);
        const canEmpty = new Array(L).fill(false);
        let any = false;
        const layout = new Array(L).fill(2);

        (function rec(pos, runIdx) {
            if (runIdx === runs.length) {
                for (let i = pos; i < L; i++) {
                    if (cells[i] === 1) return;
                    layout[i] = 2;
                }
                any = true;
                for (let i = 0; i < L; i++) {
                    if (layout[i] === 1) canFill[i] = true; else canEmpty[i] = true;
                }
                return;
            }
            const len = runs[runIdx];
            for (let s = pos; s + len <= L; s++) {
                let ok = true;
                for (let i = pos; i < s; i++) if (cells[i] === 1) { ok = false; break; }
                if (!ok) break; // pominięta „1” — dalsze starty też ją pomijają
                for (let i = s; i < s + len; i++) if (cells[i] === 2) { ok = false; break; }
                if (ok && s + len < L && cells[s + len] === 1) ok = false;
                if (!ok) continue;
                for (let i = pos; i < s; i++) layout[i] = 2;
                for (let i = s; i < s + len; i++) layout[i] = 1;
                if (s + len < L) layout[s + len] = 2;
                rec(s + len + (s + len < L ? 1 : 0), runIdx + 1);
            }
        })(0, 0);

        if (!any) return null;
        const forced = [];
        for (let i = 0; i < L; i++) {
            if (cells[i] !== 0) continue;
            if (canFill[i] && !canEmpty[i]) forced.push([i, 1]);
            else if (!canFill[i] && canEmpty[i]) forced.push([i, 2]);
        }
        return forced;
    }

    // ── Line-solver: propagacja do punktu stałego. Plansza w pełni rozwiązana
    // samą logiką liniową ⇒ ma dokładnie jedno rozwiązanie i człowiek dojdzie
    // do niego bez zgadywania. ──────────────────────────────────────────────
    function lineSolvable(n, rowRuns, colRuns) {
        const cells = Array.from({ length: n }, () => new Array(n).fill(0));
        let changed = true;
        while (changed) {
            changed = false;
            for (let r = 0; r < n; r++) {
                const forced = lineDeductions(cells[r], rowRuns[r]);
                if (forced === null) return false;
                for (const [i, v] of forced) { cells[r][i] = v; changed = true; }
            }
            for (let c = 0; c < n; c++) {
                const forced = lineDeductions(cells.map(row => row[c]), colRuns[c]);
                if (forced === null) return false;
                for (const [i, v] of forced) { cells[i][c] = v; changed = true; }
            }
        }
        return cells.every(row => row.every(v => v !== 0));
    }

    // ── Bank obrazków: każdy motyw ZWERYFIKOWANY line-solverem przed dodaniem
    // (rozwiązuje się w całości logiką liniową — jednoznaczny, bez zgadywania).
    // Format: wiersze ze znaków '#' (zamalowane) i '.' (puste).
    const MOTIFS = {
        5: [
            { name: 'Serce', rows: ['.#.#.', '#####', '#####', '.###.', '..#..'] },
            { name: 'Plus', rows: ['..#..', '..#..', '#####', '..#..', '..#..'] },
            { name: 'Choinka', rows: ['..#..', '.###.', '#####', '..#..', '..#..'] },
            { name: 'Kielich', rows: ['#####', '.###.', '..#..', '..#..', '.###.'] },
            { name: 'Strzałka', rows: ['..#..', '.###.', '#####', '.###.', '.###.'] },
            { name: 'Domek', rows: ['..#..', '.###.', '#####', '.#.#.', '.###.'] },
            { name: 'Litera T', rows: ['#####', '..#..', '..#..', '..#..', '..#..'] },
        ],
        10: [
            { name: 'Serce', rows: ['..##..##..', '.####.####', '##########', '##########', '##########', '.########.', '..######..', '...####...', '....##....', '..........'] },
            { name: 'Domek', rows: ['....##....', '...####...', '..######..', '.########.', '##########', '.##....##.', '.##.##.##.', '.##.##.##.', '.##....##.', '.########.'] },
            { name: 'Kotek', rows: ['.#......#.', '.##....##.', '.########.', '.########.', '#.##..##.#', '#########.', '.########.', '.#.####.#.', '.########.', '..##..##..'] },
            { name: 'Łódka', rows: ['.....#....', '....##....', '...###....', '..####....', '.#####....', '######....', '....#.....', '##########', '.########.', '..######..'] },
            { name: 'Choinka', rows: ['....##....', '...####...', '..######..', '.########.', '...####...', '..######..', '.########.', '##########', '....##....', '....##....'] },
            { name: 'Grzybek', rows: ['...####...', '..######..', '.########.', '##########', '##########', '...####...', '...####...', '...####...', '...####...', '..######..'] },
            { name: 'Kubek', rows: ['..........', '.#######..', '.########.', '.#######.#', '.#######.#', '.########.', '.#######..', '.#######..', '..#####...', '..........'] },
        ],
        15: [
            { name: 'Motyl', rows: ['.##.........##.', '####.......####', '#####..#..#####', '######.#.######', '######.#.######', '.#####.#.#####.', '..####.#.####..', '...###.#.###...', '..####.#.####..', '.#####.#.#####.', '######.#.######', '######.#.######', '#####.....#####', '.###.......###.', '.##.........##.'] },
            { name: 'Kot', rows: ['..#.........#..', '..##.......##..', '..###.....###..', '..###########..', '..###########..', '.#############.', '.##.#######.##.', '.#############.', '.###.#####.###.', '..###########..', '...#########...', '....#######....', '...##.###.##...', '..##...#...##..', '..###########..'] },
            { name: 'Żaglówka', rows: ['.......#.......', '.......##......', '.......###.....', '.......####....', '.......#####...', '.......######..', '.......#####...', '.......####....', '.......###.....', '.......##......', '###############', '.#############.', '..###########..', '...#########...', '...............'] },
            { name: 'Gwiazda', rows: ['.......#.......', '......###......', '......###......', '.....#####.....', '###############', '.#############.', '..###########..', '...#########...', '....#######....', '....#######....', '...####.####...', '...###...###...', '..###.....###..', '..##.......##..', '..#.........#..'] },
            { name: 'Rakieta', rows: ['.......#.......', '......###......', '......###......', '.....#####.....', '.....#####.....', '.....##.##.....', '.....##.##.....', '.....#####.....', '.....#####.....', '....#######....', '...#########...', '..####.#.####..', '..###..#..###..', '..##...#...##..', '.......#.......'] },
        ],
    };

    // ── Generator ─────────────────────────────────────────────────────────────
    // Tryb losowy: plansza ~50% wypełnienia, aż przejdzie line-solver.
    // Tryb obrazkowy: losowy motyw z banku (inny niż poprzedni).
    let lastMotifName = null;
    function generatePuzzle(n, mode) {
        if (mode === 'picture') {
            const pool = MOTIFS[n].filter(m => m.name !== lastMotifName);
            const motif = pool[Math.floor(Math.random() * pool.length)];
            lastMotifName = motif.name;
            const grid = motif.rows.map(row => [...row].map(ch => (ch === '#' ? 1 : 0)));
            return {
                solution: grid,
                rowRuns: grid.map(row => runsOf(row)),
                colRuns: Array.from({ length: n }, (_, c) => runsOf(grid.map(row => row[c]))),
                motifName: motif.name,
            };
        }
        for (;;) {
            const grid = Array.from({ length: n }, () =>
                Array.from({ length: n }, () => (Math.random() < 0.5 ? 1 : 0)));
            const rowRuns = grid.map(row => runsOf(row));
            const colRuns = Array.from({ length: n }, (_, c) => runsOf(grid.map(row => row[c])));
            if (lineSolvable(n, rowRuns, colRuns)) return { solution: grid, rowRuns, colRuns, motifName: null };
        }
    }

    // ── Stan gry ──────────────────────────────────────────────────────────────
    let n = 5;
    let mode = 'random';      // 'random' | 'picture'
    let motifName = null;     // nazwa obrazka (tryb obrazkowy)
    let tool = 1;             // narzędzie dotykowe: 1 = maluj, 2 = krzyżyk
    let solution = null;      // solution[r][c] = 0/1
    let rowRuns = null, colRuns = null;
    let values = [];          // 0 = nieznane, 1 = zamalowane, 2 = krzyżyk
    let given = [];           // pola poprawione podpowiedzią (zablokowane)
    let hintsUsed = 0;
    let recordSaved = false;
    let selected = null;
    let timerInterval = null;
    let elapsedSec = 0;
    let solved = false;
    let history = [];         // stos ruchów do cofania: { r, c, oldVal }

    function loadPrefs() {
        try {
            const p = JSON.parse(localStorage.getItem(PREF_KEY)) || {};
            if (SIZES.includes(p.n)) n = p.n;
            if (p.mode === 'random' || p.mode === 'picture') mode = p.mode;
            if (p.tool === 1 || p.tool === 2) { tool = p.tool; syncToolButtons(); }
        } catch (e) { /* domyślne wartości */ }
    }
    function savePrefs() {
        localStorage.setItem(PREF_KEY, JSON.stringify({ n, mode, tool }));
    }

    // ── Autozapis: gra wznawia się z tego samego miejsca po powrocie ─────────
    function saveState() {
        if (solved || !solution) return;
        const state = { n, mode, motifName, solution, rowRuns, colRuns, values, given, hintsUsed, elapsedSec, history };
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* brak miejsca — trudno */ }
    }
    function clearSave() {
        localStorage.removeItem(SAVE_KEY);
    }
    function restoreState() {
        let s;
        try { s = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
        if (!s || !SIZES.includes(s.n) || !s.solution || !s.values) return false;
        n = s.n;
        mode = s.mode === 'picture' ? 'picture' : 'random';
        motifName = s.motifName || null;
        lastMotifName = motifName;
        solution = s.solution;
        rowRuns = s.rowRuns;
        colRuns = s.colRuns;
        values = s.values;
        given = s.given;
        history = s.history || [];
        hintsUsed = s.hintsUsed || 0;
        solved = false;
        selected = null;
        recordSaved = false;
        syncSizeButtons();
        syncModeButtons();
        render();
        updateAllClues();
        updateHintBtn();
        updateUndoBtn();
        updateRecordDisplay();
        startTimer(s.elapsedSec || 0);
        return true;
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); });
    window.addEventListener('pagehide', saveState);

    // ── Rekordy: ranking najpierw wg liczby podpowiedzi, potem czasu ─────────
    function recordKey() { return String(n); }
    function recordLabel(key) { return `${key}×${key}`; }
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
        SIZES.map(String).forEach(key => {
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

    // ── Przyciski rozmiaru i narzędzia ────────────────────────────────────────
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
    modeButtonsEl.querySelectorAll('.pill').forEach(b => {
        b.addEventListener('click', () => { mode = b.dataset.mode; savePrefs(); newGame(); });
    });
    function syncModeButtons() {
        modeButtonsEl.querySelectorAll('.pill').forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
    }
    toolbarEl.querySelectorAll('.pill').forEach(b => {
        b.addEventListener('click', () => { tool = Number(b.dataset.tool); syncToolButtons(); savePrefs(); });
    });
    function syncToolButtons() {
        toolbarEl.querySelectorAll('.pill').forEach(b => b.classList.toggle('active', Number(b.dataset.tool) === tool));
    }

    // ── Renderowanie: siatka (n+1)×(n+1) — wskazówki na brzegach + pola ──────
    function render() {
        boardEl.style.gridTemplateColumns = `minmax(1.6rem, auto) repeat(${n}, 1fr)`;
        boardEl.style.gridTemplateRows = `minmax(1.6rem, auto) repeat(${n}, 1fr)`;
        boardEl.style.setProperty('--clue-font', `${Math.max(9, 16 - n * 0.5)}px`);
        boardEl.style.setProperty('--cell-font', `${Math.max(10, 24 - n)}px`);
        boardEl.innerHTML = '';

        const corner = document.createElement('div');
        corner.className = 'corner';
        boardEl.appendChild(corner);

        for (let c = 0; c < n; c++) {
            const div = document.createElement('div');
            div.className = 'clue col-clue';
            if (c > 0 && c % 5 === 0) div.classList.add('gb-l');
            div.dataset.col = c;
            div.innerHTML = (colRuns[c].length ? colRuns[c] : [0]).map(v => `<span>${v}</span>`).join('');
            boardEl.appendChild(div);
        }
        for (let r = 0; r < n; r++) {
            const div = document.createElement('div');
            div.className = 'clue row-clue';
            if (r > 0 && r % 5 === 0) div.classList.add('gb-t');
            div.dataset.row = r;
            div.innerHTML = (rowRuns[r].length ? rowRuns[r] : [0]).map(v => `<span>${v}</span>`).join('');
            boardEl.appendChild(div);
            for (let c = 0; c < n; c++) {
                const btn = document.createElement('button');
                btn.className = 'cell';
                btn.type = 'button';
                btn.dataset.r = r;
                btn.dataset.c = c;
                if (c > 0 && c % 5 === 0) btn.classList.add('gb-l');
                if (r > 0 && r % 5 === 0) btn.classList.add('gb-t');
                // wejście obsługuje delegowany pointerdown na planszy (przeciąganie)
                boardEl.appendChild(btn);
                updateCellDisplay(r, c, btn);
            }
        }
    }

    function cellEl(r, c) {
        return boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
    }
    function updateCellDisplay(r, c, el = cellEl(r, c)) {
        el.classList.toggle('filled', values[r][c] === 1);
        el.classList.toggle('given', given[r][c]);
        el.textContent = values[r][c] === 2 ? '✕' : '';
    }

    function selectCell(r, c) {
        if (solved) return;
        selected = { r, c };
        boardEl.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
        cellEl(r, c).classList.add('selected');
    }

    function pushHistory(r, c) {
        history.push({ r, c, oldVal: values[r][c] });
        if (history.length > 400) history.shift();
        updateUndoBtn();
    }

    function applyCell(r, c, newVal) {
        if (solved) return;
        selectCell(r, c);
        if (given[r][c]) return;
        pushHistory(r, c);
        values[r][c] = newVal;
        updateCellDisplay(r, c);
        updateLineClues(r, c);
        checkWin();
        saveState();
    }
    // przełącznik konkretnego stanu (klawiatura 1/2)
    function toggleCell(r, c, t) {
        applyCell(r, c, values[r][c] === t ? 0 : t);
    }

    // ── Malowanie przeciąganiem ───────────────────────────────────────────────
    // Mysz: lewy = maluj, prawy = krzyżyk, środkowy = czyść. Dotyk: narzędzie
    // z paska nad planszą. Start na polu już oznaczonym = czyszczenie. Ruch po
    // drugim polu blokuje oś (wiersz albo kolumnę) — jedno pociągnięcie oznacza
    // całą linię. Jedna akcja obowiązuje przez całe pociągnięcie.
    let stroke = null; // { action, r0, c0, axis: null|'h'|'v' }

    function strokeApply(r, c) {
        if (solved || given[r][c] || values[r][c] === stroke.action) return;
        selectCell(r, c);
        pushHistory(r, c);
        values[r][c] = stroke.action;
        updateCellDisplay(r, c);
        updateLineClues(r, c);
        checkWin();
    }
    function cellFromPoint(x, y) {
        const el = document.elementFromPoint(x, y);
        const cell = el && el.closest ? el.closest('.cell') : null;
        return cell && boardEl.contains(cell) ? cell : null;
    }
    boardEl.addEventListener('contextmenu', (e) => e.preventDefault());
    boardEl.addEventListener('pointerdown', (e) => {
        const cell = e.target.closest ? e.target.closest('.cell') : null;
        if (!cell || solved) return;
        e.preventDefault();
        const r = Number(cell.dataset.r), c = Number(cell.dataset.c);
        let base;
        if (e.pointerType === 'mouse') {
            if (e.button === 0) base = 1;
            else if (e.button === 2) base = 2;
            else if (e.button === 1) base = 0;
            else return;
        } else {
            base = tool;
        }
        const action = base !== 0 && values[r][c] === base ? 0 : base;
        stroke = { action, r0: r, c0: c, axis: null };
        boardEl.setPointerCapture(e.pointerId);
        strokeApply(r, c);
    });
    boardEl.addEventListener('pointermove', (e) => {
        if (!stroke) return;
        const cell = cellFromPoint(e.clientX, e.clientY);
        if (!cell) return;
        let r = Number(cell.dataset.r), c = Number(cell.dataset.c);
        if (r === stroke.r0 && c === stroke.c0) return;
        if (!stroke.axis) stroke.axis = r === stroke.r0 ? 'h' : 'v';
        // trzymaj się linii startowej — przeciąganie oznacza jeden wiersz/kolumnę
        if (stroke.axis === 'h') r = stroke.r0; else c = stroke.c0;
        strokeApply(r, c);
    });
    function endStroke() {
        if (!stroke) return;
        stroke = null;
        saveState();
    }
    boardEl.addEventListener('pointerup', endStroke);
    boardEl.addEventListener('pointercancel', endStroke);

    // ── Cofanie ───────────────────────────────────────────────────────────────
    function updateUndoBtn() { undoBtn.disabled = history.length === 0; }
    function undo() {
        if (solved || !history.length) return;
        const { r, c, oldVal } = history.pop();
        values[r][c] = oldVal;
        selectCell(r, c);
        updateCellDisplay(r, c);
        updateLineClues(r, c);
        updateUndoBtn();
        saveState();
    }
    undoBtn.addEventListener('click', undo);

    // ── Wskazówki: wygaszenie zgodnych linii, czerwień przy nadmiarze ────────
    function updateClueState(el, runs, line) {
        const current = runsOf(line);
        const filled = line.filter(v => v === 1).length;
        const total = runs.reduce((a, b) => a + b, 0);
        el.classList.toggle('done', JSON.stringify(current) === JSON.stringify(runs));
        el.classList.toggle('over', filled > total);
    }
    function updateLineClues(r, c) {
        updateClueState(boardEl.querySelector(`.row-clue[data-row="${r}"]`), rowRuns[r], values[r]);
        updateClueState(boardEl.querySelector(`.col-clue[data-col="${c}"]`), colRuns[c], values.map(row => row[c]));
    }
    function updateAllClues() {
        for (let r = 0; r < n; r++) updateClueState(boardEl.querySelector(`.row-clue[data-row="${r}"]`), rowRuns[r], values[r]);
        for (let c = 0; c < n; c++) updateClueState(boardEl.querySelector(`.col-clue[data-col="${c}"]`), colRuns[c], values.map(row => row[c]));
    }

    function checkWin() {
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
            if ((values[r][c] === 1) !== (solution[r][c] === 1)) return;
        }
        solved = true;
        stopTimer();
        clearSave();
        // odsłoń wzór: usuń krzyżyki i zaznaczenie
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
            if (values[r][c] === 2) { values[r][c] = 0; updateCellDisplay(r, c); }
        }
        boardEl.querySelectorAll('.cell.selected').forEach(el => el.classList.remove('selected'));
        winText.textContent = motifName
            ? TR.solvedMotif(motifName, formatTime(elapsedSec))
            : TR.solved(formatTime(elapsedSec));
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

    // ── Podpowiedź: poprawia losowe błędne pole zgodnie z rozwiązaniem ───────
    function updateHintBtn() {
        const remaining = MAX_HINTS - hintsUsed;
        hintCountEl.textContent = `(${remaining})`;
        hintBtn.disabled = remaining <= 0;
    }
    function hint() {
        if (solved || hintsUsed >= MAX_HINTS) return;
        const wrong = [];
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
            if (!given[r][c] && (values[r][c] === 1) !== (solution[r][c] === 1)) wrong.push({ r, c });
        }
        if (!wrong.length) return;
        const { r, c } = wrong[Math.floor(Math.random() * wrong.length)];
        values[r][c] = solution[r][c] === 1 ? 1 : 2;
        given[r][c] = true;
        hintsUsed++;
        updateHintBtn();
        updateCellDisplay(r, c);
        selectCell(r, c);
        const el = cellEl(r, c);
        el.classList.add('hint-flash');
        setTimeout(() => el.classList.remove('hint-flash'), 900);
        updateLineClues(r, c);
        checkWin();
        saveState();
    }
    hintBtn.addEventListener('click', hint);

    // ── Klawiatura ────────────────────────────────────────────────────────────
    document.addEventListener('keydown', (e) => {
        if (e.target === playerNameEl) return; // pisanie imienia nie steruje grą
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { undo(); e.preventDefault(); return; }
        if (!selected) return;
        const { r, c } = selected;
        if (e.key === '1' || e.key === '2') {
            toggleCell(r, c, Number(e.key));
            e.preventDefault();
            return;
        }
        if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
            if (values[r][c] !== 0) applyCell(r, c, 0);
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
        history = [];
        updateUndoBtn();
        clearSave();
        syncSizeButtons();
        syncModeButtons();
        const generated = generatePuzzle(n, mode);
        solution = generated.solution;
        rowRuns = generated.rowRuns;
        colRuns = generated.colRuns;
        motifName = generated.motifName;
        values = Array.from({ length: n }, () => new Array(n).fill(0));
        given = Array.from({ length: n }, () => new Array(n).fill(false));
        render();
        updateAllClues();
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
        document.querySelector('.game-subtitle').textContent = 'Paint cells so the runs of painted cells in every row and column match the numbers on the edges.';
        const labels = document.querySelectorAll('.control-label');
        labels[0].textContent = 'Size';
        labels[1].textContent = 'Board';
        modeButtonsEl.querySelector('[data-mode="random"]').textContent = '🎲 Random';
        modeButtonsEl.querySelector('[data-mode="picture"]').textContent = '🖼️ Picture';
        toolbarEl.querySelector('[data-tool="1"]').textContent = '⬛ Paint';
        toolbarEl.querySelector('[data-tool="2"]').textContent = '✕ Cross';
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
            <p>The numbers next to a row/column describe the lengths of consecutive runs of painted cells — with at least one empty cell between runs. "0" means an empty row/column.</p>
            <p>A "Random" board is an abstract pattern; a "Picture" hides a drawing whose name you learn after solving. Every board (in both modes) is solvable with pure logic — no guessing.</p>
            <p>On a computer: the left mouse button paints, the right one places a cross (definitely empty), the middle one (wheel click) clears. On a touch screen pick the ⬛/✕ tool just above the board and tap cells. Starting on an already-marked cell clears.</p>
            <p>Drag (with a finger or the mouse) along a row or column to mark a whole line at once. Row/column numbers dim when the line matches and turn red when too many cells are painted.</p>
            <p>Keyboard: arrows select a cell, 1 = paint, 2 = cross, 0/Backspace clears. "Undo" (Ctrl+Z) reverts moves.</p>
            <p>A hint corrects one cell (3 per game) — records rank by hints used first, then by time. The game saves automatically and resumes when you return.</p>`;
    }

    loadPrefs();
    if (!restoreState()) newGame(); // wznów zapisaną grę, jeśli jest

    // ── Jasny/ciemny motyw ────────────────────────────────────────────────
    (() => {
        const themeBtn = document.getElementById('themeBtn');
        const saved = localStorage.getItem('nonogramTheme');
        if (saved === 'light') { document.body.classList.add('light'); themeBtn.textContent = TR.themeDark; } else { themeBtn.textContent = TR.themeLight; }
        themeBtn.addEventListener('click', () => {
            const light = document.body.classList.toggle('light');
            themeBtn.textContent = light ? TR.themeDark : TR.themeLight;
            localStorage.setItem('nonogramTheme', light ? 'light' : 'dark');
        });
    })();
})();
