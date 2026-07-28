(() => {
    const SIZES = [4, 5, 6, 7];
    const RECORDS_KEY = 'piramidyRecords';
    const PREF_KEY = 'piramidyPrefs';
    const SAVE_KEY = 'piramidySave';

    // ── Język: wspólny przełącznik PL/EN (klucz 'lang', jak w Pisaniu) ────────
    const lang = localStorage.getItem('lang') || 'pl';
    const TR = lang === 'en' ? {
        solved: 'Solved! Time:',
        hintsInfo: h => `💡 Hints used: ${h} — results with fewer hints rank higher.`,
        saved: '✓ Score saved!',
        noRecords: 'No records for this mode yet.',
        thName: 'Name', thTime: 'Time', thDate: 'Date',
        easy: 'Easy', hard: 'Hard',
        generating: '⏳ Generating…',
        themeDark: '🌙 Dark', themeLight: '☀️ Light',
    } : {
        solved: 'Rozwiązane! Czas:',
        hintsInfo: h => `💡 Użyto podpowiedzi: ${h} — w rankingu wygrywają wyniki z mniejszą liczbą podpowiedzi.`,
        saved: '✓ Wynik zapisany!',
        noRecords: 'Brak rekordów dla tego trybu.',
        thName: 'Imię', thTime: 'Czas', thDate: 'Data',
        easy: 'Łatwy', hard: 'Trudny',
        generating: '⏳ Generowanie…',
        themeDark: '🌙 Ciemny', themeLight: '☀️ Jasny',
    };

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
    const MAX_HINTS = 3;
    const nameRow = document.getElementById('nameRow');
    const playerNameEl = document.getElementById('playerName');
    const saveBtn = document.getElementById('saveBtn');
    const saveInfoEl = document.getElementById('saveInfo');
    const recordsBtn = document.getElementById('recordsBtn');
    const recPanel = document.getElementById('recPanel');
    const recTabsEl = document.getElementById('recTabs');
    const recTableEl = document.getElementById('recTable');
    const recCloseBtn = document.getElementById('recCloseBtn');

    // ── Ile piramid widać, patrząc na tablicę wysokości od pierwszego elementu ──
    function countVisible(arr) {
        let maxSoFar = 0, count = 0;
        for (const v of arr) { if (v > maxSoFar) { count++; maxSoFar = v; } }
        return count;
    }

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // ── Losowy kwadrat łaciński n×n (wartości 1..n, bez powtórzeń w wierszu/kolumnie) ──
    function randomLatinSquare(n) {
        let grid = [];
        for (let r = 0; r < n; r++) {
            const row = [];
            for (let c = 0; c < n; c++) row.push(((c + r) % n) + 1);
            grid.push(row);
        }
        const rowOrder = shuffle([...Array(n).keys()]);
        const colOrder = shuffle([...Array(n).keys()]);
        const symbolMap = shuffle([...Array(n).keys()]).map(v => v + 1); // stara wartość i -> symbolMap[i-1]
        grid = rowOrder.map(r => colOrder.map(c => symbolMap[grid[r][c] - 1]));
        return grid;
    }

    function computeClues(grid) {
        const n = grid.length;
        const left = [], right = [], top = [], bottom = [];
        for (let r = 0; r < n; r++) {
            const row = grid[r];
            left.push(countVisible(row));
            right.push(countVisible(row.slice().reverse()));
        }
        for (let c = 0; c < n; c++) {
            const col = grid.map(row => row[c]);
            top.push(countVisible(col));
            bottom.push(countVisible(col.slice().reverse()));
        }
        return { top, bottom, left, right };
    }

    // ── Solver: backtracking po permutacjach wierszy ──────────────────────────
    // Zamiast wypełniać komórka po komórce, układa plansze wiersz po wierszu z listy
    // permutacji 1..n przefiltrowanych wskazówkami left/right i polami givens danego
    // wiersza. Kolumny przycinane na bieżąco (kolizje wartości + widoczność od góry).
    // To o rzędy wielkości szybsze niż backtracking komórkowy — dla 7×7 pojedyncze
    // sprawdzenie unikalności schodzi z minut do ułamków sekundy.
    const permCache = new Map();
    function allPerms(n) {
        if (permCache.has(n)) return permCache.get(n);
        const out = [];
        const arr = Array.from({ length: n }, (_, i) => i + 1);
        (function permute(k) {
            if (k === n) {
                const p = arr.slice();
                out.push({ vals: p, visL: countVisible(p), visR: countVisible(p.slice().reverse()) });
                return;
            }
            for (let i = k; i < n; i++) {
                [arr[k], arr[i]] = [arr[i], arr[k]];
                permute(k + 1);
                [arr[k], arr[i]] = [arr[i], arr[k]];
            }
        })(0);
        permCache.set(n, out);
        return out;
    }

    // Liczy rozwiązania (do `cap`); zbiera znalezione plansze (do dezambiguacji).
    // nodeBudget twardo ogranicza przeszukiwanie: po przekroczeniu wynik jest
    // "nierozstrzygnięty" (budgetExceeded) i wywołujący traktuje go zachowawczo —
    // dzięki temu czas generowania jest ograniczony, a wynik nigdy nie jest
    // fałszywie uznany za jednoznaczny.
    function solve(n, clues, givens, cap, nodeBudget) {
        const perms = allPerms(n);
        const rowPerms = [];
        for (let r = 0; r < n; r++) {
            const g = givens ? givens[r] : null;
            const list = perms.filter(p => {
                if (clues.left[r] != null && p.visL !== clues.left[r]) return false;
                if (clues.right[r] != null && p.visR !== clues.right[r]) return false;
                if (g) for (let c = 0; c < n; c++) if (g[c] !== 0 && p.vals[c] !== g[c]) return false;
                return true;
            });
            if (list.length === 0) return { count: 0, found: [], budgetExceeded: false };
            rowPerms.push(list);
        }

        const colUsed = new Array(n).fill(0);
        const visStack = [new Array(n).fill(0)];
        const maxStack = [new Array(n).fill(0)];
        const chosen = new Array(n).fill(null);
        let solutions = 0;
        let nodes = 0;
        let budgetExceeded = false;
        const found = [];

        function checkBottom() {
            for (let c = 0; c < n; c++) {
                if (clues.bottom[c] == null) continue;
                let maxSoFar = 0, count = 0;
                for (let r = n - 1; r >= 0; r--) {
                    const v = chosen[r].vals[c];
                    if (v > maxSoFar) { count++; maxSoFar = v; }
                }
                if (count !== clues.bottom[c]) return false;
            }
            return true;
        }

        function backtrack(r) {
            if (solutions >= cap || budgetExceeded) return;
            if (++nodes > nodeBudget) { budgetExceeded = true; return; }
            if (r === n) {
                for (let c = 0; c < n; c++) {
                    if (clues.top[c] != null && visStack[n][c] !== clues.top[c]) return;
                }
                if (!checkBottom()) return;
                solutions++;
                if (found.length < 2) found.push(chosen.map(p => p.vals.slice()));
                return;
            }
            const prevMax = maxStack[r], prevVis = visStack[r];
            outer: for (const p of rowPerms[r]) {
                for (let c = 0; c < n; c++) {
                    if (colUsed[c] & (1 << (p.vals[c] - 1))) continue outer;
                }
                const newMax = new Array(n), newVis = new Array(n);
                for (let c = 0; c < n; c++) {
                    const v = p.vals[c];
                    if (v > prevMax[c]) { newMax[c] = v; newVis[c] = prevVis[c] + 1; }
                    else { newMax[c] = prevMax[c]; newVis[c] = prevVis[c]; }
                    const t = clues.top[c];
                    if (t != null) {
                        if (newVis[c] > t) continue outer;                     // widoczność już przekroczona
                        if (newVis[c] + (n - r - 1) < t) continue outer;       // nieosiągalna (max +1 na wiersz)
                        if (newMax[c] === n && newVis[c] !== t) continue outer; // stoi n — widoczność ostateczna
                    }
                }
                for (let c = 0; c < n; c++) colUsed[c] |= 1 << (p.vals[c] - 1);
                maxStack[r + 1] = newMax; visStack[r + 1] = newVis;
                chosen[r] = p;
                backtrack(r + 1);
                for (let c = 0; c < n; c++) colUsed[c] &= ~(1 << (p.vals[c] - 1));
                if (solutions >= cap || budgetExceeded) return;
            }
        }
        backtrack(0);
        return { count: solutions, found, budgetExceeded };
    }

    // ── Generowanie łamigłówki ────────────────────────────────────────────────
    // Dla większych plansz (zwłaszcza 7×7) samo obramowanie prawie nigdy nie wyznacza
    // rozwiązania jednoznacznie — jak w drukowanych łamigłówkach, plansza dostaje wtedy
    // kilka wstępnie wypełnionych pól (givens):
    //   0. seed: kilka losowych givens od razu (tnie przestrzeń przeszukiwania),
    //   1. dezambiguacja: dopóki istnieje alternatywne rozwiązanie, przypnij givenem
    //      pole, w którym różni się od naszej planszy,
    //   2. minimalizacja: usuń każdy given, bez którego układ pozostaje jednoznaczny,
    //   3. kucie dziur: ukrywaj wskazówki (do celu wg trudności), o ile jednoznaczność
    //      pozostaje zachowana.
    const NODE_BUDGET = 25000;
    const SEED_GIVENS = { 4: 0, 5: 0, 6: 2, 7: 10 };

    function generatePuzzle(n, difficulty) {
        const hiddenFraction = difficulty === 'hard' ? 0.5 : 0.28;
        const targetHide = Math.round(4 * n * hiddenFraction);

        const grid = randomLatinSquare(n);
        const full = computeClues(grid);
        const clues = { top: full.top.slice(), bottom: full.bottom.slice(), left: full.left.slice(), right: full.right.slice() };
        const givens = Array.from({ length: n }, () => new Array(n).fill(0));

        const cells = shuffle(Array.from({ length: n * n }, (_, i) => [Math.floor(i / n), i % n]));
        for (let i = 0; i < (SEED_GIVENS[n] || 0); i++) {
            const [r, c] = cells[i];
            givens[r][c] = grid[r][c];
        }

        let guard = 0;
        let spare = cells.filter(([r, c]) => givens[r][c] === 0);
        while (guard++ < n * n) {
            const res = solve(n, clues, givens, 2, NODE_BUDGET);
            if (!res.budgetExceeded && res.count === 1) break;
            const alt = res.found.find(sol => sol.some((row, r) => row.some((v, c) => v !== grid[r][c])));
            let r, c;
            if (alt) {
                const diffs = [];
                for (let rr = 0; rr < n; rr++) for (let cc = 0; cc < n; cc++) {
                    if (alt[rr][cc] !== grid[rr][cc] && givens[rr][cc] === 0) diffs.push([rr, cc]);
                }
                [r, c] = diffs[Math.floor(Math.random() * diffs.length)];
            } else {
                if (!spare.length) break;
                [r, c] = spare.pop();
            }
            givens[r][c] = grid[r][c];
            spare = spare.filter(([rr, cc]) => rr !== r || cc !== c);
        }

        const givenCells = [];
        for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (givens[r][c] !== 0) givenCells.push([r, c]);
        for (const [r, c] of shuffle(givenCells)) {
            const backup = givens[r][c];
            givens[r][c] = 0;
            const res = solve(n, clues, givens, 2, NODE_BUDGET);
            if (res.budgetExceeded || res.count !== 1) givens[r][c] = backup;
        }

        const slots = shuffle([
            ...Array.from({ length: n }, (_, i) => ['top', i]),
            ...Array.from({ length: n }, (_, i) => ['bottom', i]),
            ...Array.from({ length: n }, (_, i) => ['left', i]),
            ...Array.from({ length: n }, (_, i) => ['right', i]),
        ]);
        let hidden = 0;
        for (const [key, idx] of slots) {
            if (hidden >= targetHide) break;
            const backup = clues[key][idx];
            clues[key][idx] = null;
            const res = solve(n, clues, givens, 2, NODE_BUDGET);
            if (!res.budgetExceeded && res.count === 1) hidden++;
            else clues[key][idx] = backup;
        }

        return { clues, givens, solution: grid };
    }

    // ── Stan gry ──────────────────────────────────────────────────────────────
    let n = 5;
    let difficulty = 'easy';
    let clues = null;
    let solution = null;      // solution[r][c] = poprawna wartość 1..n
    let values = [];          // values[r][c] = 0 (puste) lub 1..n
    let notes = [];           // notes[r][c] = Set kandydujących liczb
    let given = [];           // given[r][c] = true, jeśli pole uzupełnione podpowiedzią (zablokowane)
    let noteMode = false;
    let hintsUsed = 0;
    let recordSaved = false;
    let selected = null;      // {r, c} lub null
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
        if (solved || !clues) return;
        const state = {
            n, difficulty, clues, solution, hintsUsed, elapsedSec,
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
        if (!s || !SIZES.includes(s.n) || !s.clues || !s.solution || !s.values) return false;
        n = s.n;
        difficulty = s.difficulty === 'hard' ? 'hard' : 'easy';
        clues = s.clues;
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
        updateClueFeedback();
        updateHintBtn();
        updateUndoBtn();
        updateRecordDisplay();
        startTimer(s.elapsedSec || 0);
        return true;
    }
    // dozapisz aktualny czas, gdy karta znika (zamknięcie/przełączenie)
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); });
    window.addEventListener('pagehide', saveState);

    function recordKey() { return `${n}-${difficulty}`; }
    function recordLabel(key) {
        const [size, diff] = key.split('-');
        return `${size}×${size} ${diff === 'hard' ? TR.hard : TR.easy}`;
    }
    function loadRecords() {
        try { return JSON.parse(localStorage.getItem(RECORDS_KEY)) || {}; } catch (e) { return {}; }
    }
    function recHints(row) { return row.hints || 0; } // starsze wpisy bez pola hints = gry bez podpowiedzi
    function bestTime() {
        const rows = loadRecords()[recordKey()];
        return Array.isArray(rows) && rows.length ? rows[0].time : null;
    }
    // Ranking: najpierw mniejsza liczba podpowiedzi, przy równej — krótszy czas.
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

    // ── Panel rekordów (top 10 dla każdego rozmiaru/trudności) ───────────────
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

    // ── Budowa przycisków rozmiaru planszy ───────────────────────────────────
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

    // ── Renderowanie planszy (n+2)×(n+2): brzeg wskazówek + środek do gry ─────
    function render() {
        boardEl.style.setProperty('--n', n);
        boardEl.style.setProperty('--cell-font', `${Math.max(14, 30 - n * 2)}px`);
        boardEl.style.setProperty('--clue-font', `${Math.max(12, 22 - n * 1.5)}px`);
        boardEl.innerHTML = '';

        for (let R = 0; R < n + 2; R++) {
            for (let C = 0; C < n + 2; C++) {
                const isCornerRow = R === 0 || R === n + 1;
                const isCornerCol = C === 0 || C === n + 1;
                if (isCornerRow && isCornerCol) {
                    const div = document.createElement('div');
                    div.className = 'cell corner';
                    boardEl.appendChild(div);
                    continue;
                }
                if (isCornerRow) {
                    const c = C - 1;
                    const div = document.createElement('div');
                    div.className = 'cell clue';
                    const val = R === 0 ? clues.top[c] : clues.bottom[c];
                    div.textContent = val == null ? '' : val;
                    div.dataset.role = R === 0 ? 'top' : 'bottom';
                    div.dataset.index = c;
                    boardEl.appendChild(div);
                    continue;
                }
                if (isCornerCol) {
                    const r = R - 1;
                    const div = document.createElement('div');
                    div.className = 'cell clue';
                    const val = C === 0 ? clues.left[r] : clues.right[r];
                    div.textContent = val == null ? '' : val;
                    div.dataset.role = C === 0 ? 'left' : 'right';
                    div.dataset.index = r;
                    boardEl.appendChild(div);
                    continue;
                }
                const r = R - 1, c = C - 1;
                const btn = document.createElement('button');
                btn.className = 'cell play';
                btn.type = 'button';
                btn.dataset.r = r;
                btn.dataset.c = c;
                btn.addEventListener('click', () => selectCell(r, c));
                boardEl.appendChild(btn);
            }
        }
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

    function playCellEl(r, c) {
        return boardEl.querySelector(`.play[data-r="${r}"][data-c="${c}"]`);
    }

    // ── Notatki: mini-siatka kandydujących liczb wewnątrz pustego pola ───────
    function buildNotesHtml(noteSet) {
        const cols = Math.ceil(Math.sqrt(n));
        let h = `<div class="notes-grid" style="grid-template-columns: repeat(${cols}, 1fr);">`;
        for (let v = 1; v <= n; v++) h += `<div class="note${noteSet.has(v) ? '' : ' off'}">${v}</div>`;
        return h + '</div>';
    }

    function updateCellDisplay(r, c) {
        const el = playCellEl(r, c);
        el.classList.toggle('given', given[r][c]);
        if (values[r][c] !== 0) el.textContent = values[r][c];
        else if (notes[r][c].size > 0) el.innerHTML = buildNotesHtml(notes[r][c]);
        else el.textContent = '';
    }

    function selectCell(r, c) {
        if (solved) return;
        selected = { r, c };
        boardEl.querySelectorAll('.play.selected').forEach(el => el.classList.remove('selected'));
        playCellEl(r, c).classList.add('selected');
    }

    function pushHistory(r, c) {
        history.push({ r, c, oldVal: values[r][c], oldNotes: new Set(notes[r][c]) });
        if (history.length > 300) history.shift();
        updateUndoBtn();
    }

    function inputValue(v) {
        if (!selected || solved) return;
        const { r, c } = selected;
        if (given[r][c]) return;   // pole uzupełnione podpowiedzią jest zablokowane

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
        updateClueFeedback();
        checkWin();
        saveState();
    }

    // ── Cofanie: przywraca wartość i notatki pola sprzed ostatniego ruchu ────
    // (uproszczenie: nie odtwarza notatek wyczyszczonych w innych polach tego ruchu)
    function updateUndoBtn() { undoBtn.disabled = history.length === 0; }
    function undo() {
        if (solved || !history.length) return;
        const { r, c, oldVal, oldNotes } = history.pop();
        values[r][c] = oldVal;
        notes[r][c] = new Set(oldNotes);
        selectCell(r, c);
        updateCellDisplay(r, c);
        updateConflicts();
        updateClueFeedback();
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
        boardEl.querySelectorAll('.play.conflict').forEach(el => el.classList.remove('conflict'));
        for (let r = 0; r < n; r++) {
            for (const cols of groupByValue(c => values[r][c], n).values()) {
                if (cols.length > 1) cols.forEach(c => playCellEl(r, c).classList.add('conflict'));
            }
        }
        for (let c = 0; c < n; c++) {
            for (const rows of groupByValue(r => values[r][c], n).values()) {
                if (rows.length > 1) rows.forEach(r => playCellEl(r, c).classList.add('conflict'));
            }
        }
    }

    // ── Oznaczenie wskazówek jako spełnione/niespełnione (gdy wiersz/kolumna kompletne) ──
    function clueCellEl(role, index) {
        return boardEl.querySelector(`.clue[data-role="${role}"][data-index="${index}"]`);
    }
    function updateClueFeedback() {
        boardEl.querySelectorAll('.clue').forEach(el => el.classList.remove('clue-ok', 'clue-bad'));
        for (let r = 0; r < n; r++) {
            const row = values[r];
            if (row.includes(0)) continue;
            if (clues.left[r] != null) mark(clueCellEl('left', r), countVisible(row) === clues.left[r]);
            if (clues.right[r] != null) mark(clueCellEl('right', r), countVisible(row.slice().reverse()) === clues.right[r]);
        }
        for (let c = 0; c < n; c++) {
            const col = values.map(row => row[c]);
            if (col.includes(0)) continue;
            if (clues.top[c] != null) mark(clueCellEl('top', c), countVisible(col) === clues.top[c]);
            if (clues.bottom[c] != null) mark(clueCellEl('bottom', c), countVisible(col.slice().reverse()) === clues.bottom[c]);
        }
    }
    function mark(el, ok) { el.classList.add(ok ? 'clue-ok' : 'clue-bad'); }

    function checkWin() {
        if (values.some(row => row.includes(0))) return;
        const validLatin = boardEl.querySelectorAll('.play.conflict').length === 0;
        const cluesOk = [...boardEl.querySelectorAll('.clue')].filter(el => el.textContent !== '')
            .every(el => el.classList.contains('clue-ok'));
        if (!validLatin || !cluesOk) return;

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
        notes[r][c].clear();
        for (let i = 0; i < n; i++) { notes[r][i].delete(values[r][c]); notes[i][c].delete(values[r][c]); }
        hintsUsed++;
        updateHintBtn();
        updateCellDisplay(r, c);
        selectCell(r, c);
        const el = playCellEl(r, c);
        el.classList.add('hint-flash');
        setTimeout(() => el.classList.remove('hint-flash'), 900);
        updateConflicts();
        updateClueFeedback();
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

    // ── Klawiatura: cyfry ustawiają wartość, strzałki przesuwają zaznaczenie ──
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

    let genToken = 0; // szybkie klikanie rozmiaru/trudności: liczy się tylko ostatnie żądanie
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
        stopTimer();

        // Generowanie 7×7 może potrwać ok. sekundy — pokaż komunikat i oddaj
        // wątek przeglądarce, żeby zdążyła go namalować przed liczeniem.
        boardEl.style.setProperty('--n', n);
        boardEl.innerHTML = `<div class="board-loading">${TR.generating}</div>`;
        numpadEl.innerHTML = '';
        const token = ++genToken;
        setTimeout(() => {
            if (token !== genToken) return; // w międzyczasie zażądano innej gry
            const generated = generatePuzzle(n, difficulty);
            clues = generated.clues;
            solution = generated.solution;
            values = generated.givens.map(row => row.slice());
            given = generated.givens.map(row => row.map(v => v !== 0));
            notes = Array.from({ length: n }, () => Array.from({ length: n }, () => new Set()));
            render();
            for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
                if (given[r][c]) updateCellDisplay(r, c);
            }
            updateClueFeedback();
            updateHintBtn();
            updateRecordDisplay();
            startTimer();
            saveState(); // odświeżenie strony w trakcie gry wznowi tę samą planszę
        }, 30);
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
        document.title = 'Pyramids | @twoznia';
        document.querySelector('.game-title').textContent = '🔺 Pyramids';
        document.querySelector('.game-subtitle').textContent = 'Set heights 1–n so the number of visible pyramids matches the clues on the edges.';
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
            <p>Place pyramids of heights 1 to n (n = board size). Every row and column must contain each height exactly once.</p>
            <p>An edge number tells how many pyramids are visible from that side — taller pyramids hide the shorter ones standing behind them.</p>
            <p>On larger boards some cells may be pre-filled (highlighted) — without them the puzzle would have more than one solution.</p>
            <p>Tap a cell, then a number on the keypad below the board. Repeated numbers in a row/column turn red.</p>
            <p>Notes mode (the "Notes" button or the N key) stores candidate numbers in a cell. A hint fills one cell with the correct number (3 per game). Records rank by hints used first, then by time.</p>
            <p>"Undo" (or Ctrl+Z) reverts your moves. The game saves automatically — when you come back, you resume exactly where you left off (clock included).</p>`;
    }

    loadPrefs();
    if (!restoreState()) newGame(); // wznów zapisaną grę, jeśli jest

    // ── Jasny/ciemny motyw ────────────────────────────────────────────────
    (() => {
        const themeBtn = document.getElementById('themeBtn');
        const saved = localStorage.getItem('piramidyTheme');
        if (saved === 'light') { document.body.classList.add('light'); themeBtn.textContent = TR.themeDark; } else { themeBtn.textContent = TR.themeLight; }
        themeBtn.addEventListener('click', () => {
            const light = document.body.classList.toggle('light');
            themeBtn.textContent = light ? TR.themeDark : TR.themeLight;
            localStorage.setItem('piramidyTheme', light ? 'light' : 'dark');
        });
    })();
})();
