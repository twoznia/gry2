    const MANIFEST_PATH = 'data/manifest.json';
    const OXFORD_CATEGORY_NAME = 'Oxford3000';
    const OXFORD_DEFAULT_SET = 'Oxford3000_pl';
    const HEADER_WITH_METADATA = 'english,polish,type,level';
    const LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const ALL_WORDS_VALUE = '__all__';

    let sessionQueue = [];
    let fails = {};
    let mode = 'pl_en';
    let totalInitialWords = 0;
    let completedCount = 0;
    let answerDelayMs = 5000;
    let revealTimeoutId = null;
    let revealIntervalId = null;
    let currentSource = 'github';
    let currentSessionFileName = '';
    let lastLocalCsvText = '';
    let lastLocalFileName = '';
    let reuseLastLocalSelection = false;
    let wordsManifest = null;
    let sessionItemsById = {};
    let selectedLevel = ALL_WORDS_VALUE;
    let selectedWordCount = '20';
    let localSectionVisible = false;
    const levelOptionsCache = new Map();

    const speechAvailable = 'speechSynthesis' in window;
    let audioEnabled = speechAvailable;

    function speak(text, lang) {
        if (!speechAvailable || !text) return;
        try {
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(String(text).replace(/\s*\/\s*/g, ', '));
            utt.lang = lang || 'en-US';
            window.speechSynthesis.speak(utt);
        } catch (e) {}
    }

    function attachAudioButton(boxEl, text, lang) {
        if (!audioEnabled || !boxEl || !text) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'audio-btn';
        btn.textContent = '🔊';
        btn.setAttribute('aria-label', 'Odsłuchaj: ' + text);
        btn.addEventListener('click', (e) => { e.stopPropagation(); speak(text, lang); });
        boxEl.appendChild(btn);
    }

    // ── Chip helpers ──────────────────────────────────────────────────────────
    function setDirection(dir) {
        mode = dir;
        document.querySelectorAll('.dir-btn').forEach(b => b.classList.toggle('active', b.dataset.dir === dir));
    }

    function setDelay(chip) {
        answerDelayMs = Number(chip.dataset.delay);
        document.querySelectorAll('#delayChips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    }

    function setWordCount(chip) {
        selectedWordCount = chip.dataset.count;
        document.querySelectorAll('#wordCountChips .chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    }

    function setLevelChip(value) {
        selectedLevel = value;
        document.querySelectorAll('#levelChips .chip').forEach(c => c.classList.toggle('active', c.dataset.level === value));
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    async function init() {
        try {
            const res = await fetch(MANIFEST_PATH, { cache: 'no-store' });
            if (!res.ok) throw new Error();
            const manifest = await res.json();
            if (!Array.isArray(manifest.categories) || !manifest.categories.length) throw new Error();

            wordsManifest = manifest;
            const catSelect = document.getElementById('categorySelect');
            catSelect.innerHTML = '';
            manifest.categories.forEach(c => catSelect.add(new Option(c.name, c.name)));
            catSelect.disabled = false;

            document.getElementById('loader').textContent = '';

            // Auto-select Oxford3000
            const oxfordIndex = manifest.categories.findIndex(c => c.name === OXFORD_CATEGORY_NAME);
            catSelect.selectedIndex = oxfordIndex >= 0 ? oxfordIndex : 0;
            await loadSubcategories();

        } catch (e) {
            document.getElementById('loader').textContent = 'Nie udało się wczytać zestawów. Użyj pliku lokalnego.';
            document.getElementById('categorySelect').disabled = true;
            document.getElementById('subcategorySelect').disabled = true;
        }
    }

    async function loadSubcategories() {
        const cat = document.getElementById('categorySelect').value;
        const subSelect = document.getElementById('subcategorySelect');
        subSelect.disabled = true;
        if (!wordsManifest) return;

        const category = wordsManifest.categories.find(c => c.name === cat);
        const sets = Array.isArray(category?.sets) ? category.sets : [];
        subSelect.innerHTML = '';
        if (!sets.length) {
            subSelect.add(new Option('Brak zestawów', ''));
            resetLevelFilter(); return;
        }

        sets.forEach(s => {
            const opt = new Option(s.name, encodeURI(s.path));
            opt.dataset.filename = s.fileName;
            subSelect.add(opt);
        });
        subSelect.disabled = false;

        // Auto-select default Oxford set
        if (cat === OXFORD_CATEGORY_NAME) {
            const defIndex = sets.findIndex(s => s.name === OXFORD_DEFAULT_SET);
            if (defIndex >= 0) subSelect.selectedIndex = defIndex;
        }

        await handleSubcategoryChange();
    }

    async function handleSubcategoryChange() {
        const cat = document.getElementById('categorySelect').value;
        const path = document.getElementById('subcategorySelect').value;
        if (cat !== OXFORD_CATEGORY_NAME || !path) {
            resetLevelFilter();
            resetWordCountFilter();
            return;
        }
        showWordCountFilter();
        await populateLevelFilter(path);
    }

    async function populateLevelFilter(csvPath) {
        const levelChips = document.getElementById('levelChips');
        let levels = levelOptionsCache.get(csvPath);
        if (!levels) {
            try {
                const res = await fetch(csvPath);
                if (!res.ok) { resetLevelFilter(); return; }
                levels = getAvailableLevels(parseCsvText(await res.text()));
                levelOptionsCache.set(csvPath, levels);
            } catch (e) { resetLevelFilter(); return; }
        }

        levelChips.innerHTML = '';
        const all = document.createElement('span');
        all.className = 'chip' + (selectedLevel === ALL_WORDS_VALUE ? ' active' : '');
        all.dataset.level = ALL_WORDS_VALUE;
        all.textContent = 'Wszystkie';
        all.onclick = () => setLevelChip(ALL_WORDS_VALUE);
        levelChips.appendChild(all);

        levels.forEach(lvl => {
            const chip = document.createElement('span');
            chip.className = 'chip' + (selectedLevel === lvl ? ' active' : '');
            chip.dataset.level = lvl;
            chip.textContent = lvl;
            chip.onclick = () => setLevelChip(lvl);
            levelChips.appendChild(chip);
        });

        document.getElementById('levelFilterGroup').classList.remove('hidden');
    }

    function resetLevelFilter() {
        selectedLevel = ALL_WORDS_VALUE;
        document.getElementById('levelChips').innerHTML = '';
        document.getElementById('levelFilterGroup').classList.add('hidden');
    }

    function showWordCountFilter() {
        document.getElementById('wordCountGroup').classList.remove('hidden');
    }

    function resetWordCountFilter() {
        document.getElementById('wordCountGroup').classList.add('hidden');
    }

    function toggleLocalSection() {
        localSectionVisible = !localSectionVisible;
        document.getElementById('localSection').classList.toggle('hidden', !localSectionVisible);
        currentSource = localSectionVisible ? 'local' : 'github';
        document.getElementById('githubSection').classList.toggle('hidden', localSectionVisible);
        if (localSectionVisible && (lastLocalCsvText || lastLocalFileName)) updateLocalReuseBox();
    }

    function updateLocalReuseBox() {
        const box = document.getElementById('localReuseBox');
        if (!lastLocalCsvText || !lastLocalFileName) { box.classList.add('hidden'); return; }
        document.getElementById('localReuseText').textContent = `Ostatni plik: ${lastLocalFileName}`;
        box.classList.remove('hidden');
    }

    function reuseLastLocalFile() {
        if (!lastLocalCsvText) return;
        reuseLastLocalSelection = true;
        document.getElementById('fileInput').value = '';
        updateLocalReuseBox();
    }

    function selectNewLocalFile() {
        reuseLastLocalSelection = false;
        updateLocalReuseBox();
    }

    // ── Start ─────────────────────────────────────────────────────────────────
    async function startGame() {
        let csvText = '';

        if (currentSource === 'local') {
            const file = document.getElementById('fileInput').files[0];
            if (file) {
                csvText = await file.text();
                lastLocalCsvText = csvText;
                lastLocalFileName = file.name;
                reuseLastLocalSelection = false;
                currentSessionFileName = file.name;
            } else if (reuseLastLocalSelection && lastLocalCsvText) {
                csvText = lastLocalCsvText;
                currentSessionFileName = lastLocalFileName;
            } else {
                return alert('Wybierz plik lub użyj ostatnio załadowanego.');
            }
        } else {
            if (!wordsManifest) return alert('Manifest zestawów niedostępny. Użyj pliku lokalnego.');
            const url = document.getElementById('subcategorySelect').value;
            if (!url) return alert('Wybierz zestaw!');
            const res = await fetch(url);
            csvText = await res.text();
            const opt = document.getElementById('subcategorySelect').selectedOptions[0];
            currentSessionFileName = opt?.dataset.filename || opt?.textContent || '';
        }

        let words = parseCsvText(csvText);
        audioEnabled = speechAvailable;

        const isOxford = currentSource === 'github' &&
            document.getElementById('categorySelect').value === OXFORD_CATEGORY_NAME;

        if (isOxford) {
            if (selectedLevel !== ALL_WORDS_VALUE) {
                words = words.filter(w => w.level === selectedLevel);
            }
            words = applyWordLimit(words);
        }

        if (!words.length) {
            const msg = selectedLevel !== ALL_WORDS_VALUE
                ? `Brak słówek dla poziomu ${selectedLevel}.`
                : 'Wybrany zestaw nie zawiera słówek.';
            return alert(msg);
        }

        sessionQueue = words;
        fails = {};
        sessionItemsById = {};
        totalInitialWords = words.length;
        completedCount = 0;
        words.forEach(w => { fails[w.id] = 0; sessionItemsById[w.id] = w; });
        sessionQueue.sort(() => Math.random() - 0.5);

        document.getElementById('setup').classList.add('hidden');
        document.getElementById('game').classList.remove('hidden');
        renderCard();
    }

    // ── Game loop ─────────────────────────────────────────────────────────────
    function renderCard() {
        if (!sessionQueue.length) return showResults();
        const item = sessionQueue[0];

        const errCount = getErrorCount();
        document.getElementById('progressCount').textContent = `${completedCount} / ${totalInitialWords}`;
        document.getElementById('progressErrors').textContent = errCount ? `Błędy: ${errCount}` : '';

        const qText = mode === 'pl_en' ? item.pl : item.en;
        const qLang = mode === 'pl_en' ? 'pl-PL' : 'en-US';
        const aText = mode === 'pl_en' ? item.en : item.pl;
        const aLang = mode === 'pl_en' ? 'en-US' : 'pl-PL';
        const typeLabel = item.type ? `(${item.type})` : '';

        const qBox = document.getElementById('questionBox');
        qBox.textContent = qText;
        attachAudioButton(qBox, qText, qLang);

        document.getElementById('questionMeta').textContent =
            mode === 'en_pl' && item.type ? typeLabel : '';

        const aBox = document.getElementById('answerBox');
        aBox.innerHTML = '';
        const aSpan = document.createElement('span');
        aSpan.textContent = aText + (mode === 'pl_en' && typeLabel ? ' ' + typeLabel : '');
        aBox.appendChild(aSpan);
        attachAudioButton(aBox, aText, aLang);

        aBox.classList.add('hidden');
        document.getElementById('controls').classList.add('hidden');
        document.getElementById('quickActions').classList.remove('hidden');
        startRevealCountdown();
    }

    function submitResult(isCorrect) {
        clearTimeout(revealTimeoutId); clearInterval(revealIntervalId);
        const item = sessionQueue.shift();
        if (isCorrect) { completedCount++; }
        else { fails[item.id]++; sessionQueue.push(item); }
        renderCard();
    }

    function revealAnswer(focusAfter = false) {
        clearTimeout(revealTimeoutId); clearInterval(revealIntervalId);
        const timerBar = document.getElementById('timerBar');
        timerBar.style.transition = 'none';
        timerBar.style.width = '0%';
        document.getElementById('countdownText').textContent = '';
        document.getElementById('answerBox').classList.remove('hidden');
        document.getElementById('controls').classList.remove('hidden');
        document.getElementById('quickActions').classList.add('hidden');
        if (focusAfter) document.getElementById('answerBox').focus();
        document.getElementById('countdownStatus').textContent = 'Poprawna odpowiedź pokazana.';
    }

    function startRevealCountdown() {
        clearTimeout(revealTimeoutId); clearInterval(revealIntervalId);
        const timerBar = document.getElementById('timerBar');
        const cdText = document.getElementById('countdownText');
        const cdStatus = document.getElementById('countdownStatus');
        const secs = Math.round(answerDelayMs / 1000);
        timerBar.style.transition = 'none';
        timerBar.style.width = '100%';
        timerBar.setAttribute('aria-valuenow', '100');
        cdText.textContent = `Odpowiedź za ${secs} s`;
        cdStatus.textContent = `Odpowiedź pojawi się za ${secs} ${secsLabel(secs)}.`;

        requestAnimationFrame(() => {
            const t0 = Date.now();
            timerBar.style.transition = `width ${answerDelayMs}ms linear`;
            timerBar.style.width = '0%';

            revealIntervalId = setInterval(() => {
                const elapsed = Date.now() - t0;
                const rem = Math.max(0, Math.ceil((answerDelayMs - elapsed) / 1000));
                timerBar.setAttribute('aria-valuenow', String(Math.max(0, 100 - Math.round((elapsed / answerDelayMs) * 100))));
                cdText.textContent = rem ? `Odpowiedź za ${rem} s` : '';
            }, 500);
        });

        revealTimeoutId = setTimeout(() => revealAnswer(true), answerDelayMs);
    }

    function secsLabel(s) {
        if (s === 1) return 'sekundę';
        if (s >= 2 && s <= 4) return 'sekundy';
        return 'sekund';
    }

    function getErrorCount() {
        return Object.values(fails).reduce((s, c) => s + c, 0);
    }

    function applyWordLimit(words) {
        const shuffled = [...words].sort(() => Math.random() - 0.5);
        if (selectedWordCount === ALL_WORDS_VALUE) return shuffled;
        const n = Number(selectedWordCount);
        return Number.isFinite(n) && n > 0 ? shuffled.slice(0, n) : shuffled;
    }

    // ── Results ───────────────────────────────────────────────────────────────
    function showResults() {
        clearTimeout(revealTimeoutId); clearInterval(revealIntervalId);
        document.getElementById('game').classList.add('hidden');
        document.getElementById('results').classList.remove('hidden');
        document.getElementById('resultsFile').textContent =
            currentSessionFileName ? `Zestaw: ${currentSessionFileName}` : '';

        const sorted = Object.entries(fails).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);
        let html = '<table class="stats-table"><thead><tr><th>Słowo</th><th>Błędy</th></tr></thead><tbody>';
        if (!sorted.length) {
            html = '<div class="no-errors">Bez błędów! Brawo! 🎉</div>';
        } else {
            sorted.forEach(([id, count]) => {
                const item = sessionItemsById[id];
                html += `<tr><td>${escapeHtml(item ? (item.type ? `${item.en} (${item.type})` : item.en) : id)}</td><td>${count}</td></tr>`;
            });
            html += '</tbody></table>';
        }
        document.getElementById('statsContent').innerHTML = html;
    }

    function backToSetup() {
        clearTimeout(revealTimeoutId); clearInterval(revealIntervalId);
        sessionQueue = []; fails = {}; sessionItemsById = {};
        totalInitialWords = 0; completedCount = 0; currentSessionFileName = '';

        document.getElementById('results').classList.add('hidden');
        document.getElementById('game').classList.add('hidden');
        document.getElementById('setup').classList.remove('hidden');
        document.getElementById('statsContent').innerHTML = '';
        document.getElementById('countdownText').textContent = '';
        document.getElementById('countdownStatus').textContent = '';
        document.getElementById('answerBox').classList.add('hidden');
        document.getElementById('controls').classList.add('hidden');
        document.getElementById('quickActions').classList.remove('hidden');
        const tb = document.getElementById('timerBar');
        tb.style.transition = 'none'; tb.style.width = '100%';
    }

    // ── CSV parsing ───────────────────────────────────────────────────────────
    function parseCsvText(csvText) {
        const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const hasHeader = lines[0]?.toLowerCase().replace(/\s+/g,'') === HEADER_WITH_METADATA;
        return (hasHeader ? lines.slice(1) : lines)
            .filter(l => l.includes(','))
            .map((l, i) => {
                const [en, pl, type='', level=''] = l.split(',').map(v => v.trim());
                if (!en || !pl) return null;
                return { id: `${en}__${pl}__${type}__${level}__${i}`, en, pl, type, level };
            })
            .filter(Boolean);
    }

    function getAvailableLevels(words) {
        return [...new Set(words.map(w => w.level).filter(Boolean))].sort((a,b) => {
            const li = LEVEL_ORDER.indexOf(a), ri = LEVEL_ORDER.indexOf(b);
            if (li !== -1 && ri !== -1) return li - ri;
            if (li !== -1) return -1; if (ri !== -1) return 1;
            return a.localeCompare(b, 'pl');
        });
    }

    function escapeHtml(t) {
        return String(t)
            .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
            .replaceAll('"','&quot;').replaceAll("'",'&#39;');
    }

    init();
