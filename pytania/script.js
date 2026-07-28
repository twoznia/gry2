// ── Mowa (Web Speech API) — czytanie po kliknięciu w głośnik ────────────────
const speechAvailable = 'speechSynthesis' in window;
let preferredVoice = null;
function pickVoice() {
    if (!speechAvailable) return;
    const voices = window.speechSynthesis.getVoices();
    const candidates = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('pl'));
    const femaleHints = ['female', 'kobie', 'zosia', 'paulina', 'ewa', 'agnieszka', 'maja', 'google'];
    preferredVoice =
        candidates.find(v => femaleHints.some(h => v.name.toLowerCase().includes(h))) ||
        candidates[0] || null;
}
if (speechAvailable) {
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
}

// Czytanie z obietnicą — rozwiązywaną po zakończeniu wypowiedzi
function speakAsync(text) {
    return new Promise(resolve => {
        if (!speechAvailable || !text) { resolve(); return; }
        try {
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'pl-PL';
            if (preferredVoice) u.voice = preferredVoice;
            u.rate = 0.95;
            u.onend = resolve;
            u.onerror = resolve;
            window.speechSynthesis.speak(u);
        } catch (e) { resolve(); }
    });
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// Sekwencja: przeczytaj pytanie, potem podświetlaj i czytaj każdą odpowiedź (0,5 s po podświetleniu)
let speakSeqToken = 0;
let seqActive = false;

async function readQuestionAndAnswers() {
    if (!speechAvailable) return;
    window.speechSynthesis.cancel();
    const token = ++speakSeqToken;
    seqActive = true;
    const speakBtn = document.getElementById('q-speak-btn');
    speakBtn.classList.add('playing');
    const stillValid = () => token === speakSeqToken && !state.answered;
    try {
        const q = state.questions[state.currentQ];
        await speakAsync(q.question);                 // 1) czytaj pytanie
        const btns = [...document.querySelectorAll('#answers-grid .answer-btn')];
        for (const btn of btns) {                     // 2) odpowiedzi po kolei
            if (!stillValid()) return;
            btn.classList.add('speaking');            // podświetl
            await delay(500);                         // 0,5 s po podświetleniu
            if (!stillValid()) { btn.classList.remove('speaking'); return; }
            await speakAsync(btn.textContent);        // czytaj odpowiedź
            btn.classList.remove('speaking');
        }
    } finally {
        if (token === speakSeqToken) { seqActive = false; speakBtn.classList.remove('playing'); }
    }
}

// Sekwencja: przeczytaj kategorię, a potem podkategorię bieżącego pytania
async function readCategoryAndSubcategory() {
    if (!speechAvailable) return;
    window.speechSynthesis.cancel();
    const token = ++speakSeqToken;
    seqActive = true;
    const speakBtn = document.getElementById('q-speak-btn');
    speakBtn.classList.add('playing');
    try {
        const q = state.questions[state.currentQ];
        if (q._category) await speakAsync(q._category);       // 1) kategoria
        if (token !== speakSeqToken) return;
        if (q.subcategory) await speakAsync(q.subcategory);   // 2) podkategoria
    } finally {
        if (token === speakSeqToken) { seqActive = false; speakBtn.classList.remove('playing'); }
    }
}

// Klik w głośnik: 1. klik czyta pytanie i odpowiedzi, kolejny — kategorię i podkategorię
let speakClickCount = 0;
function handleSpeakClick() {
    const readCategory = speakClickCount % 2 === 1;
    speakClickCount++;
    if (readCategory) {
        readCategoryAndSubcategory();
    } else {
        readQuestionAndAnswers();
    }
}

// Przerwij sekwencję (np. przy zmianie pytania lub udzieleniu odpowiedzi)
function stopSpeechSequence() {
    speakSeqToken++;
    seqActive = false;
    if (speechAvailable) window.speechSynthesis.cancel();
    const speakBtn = document.getElementById('q-speak-btn');
    if (speakBtn) speakBtn.classList.remove('playing');
    document.querySelectorAll('#answers-grid .answer-btn.speaking')
        .forEach(b => b.classList.remove('speaking'));
}

// ── Data loading ─────────────────────────────────────────────────────────────
let allData = [];      // [{category, icon, questions:[{subcategory,question,answers}]}]
let loadError = false;
const ISSUE_TEMPLATE_NAME = 'zgloszenie-bledu-pytania.md';
const ISSUE_URL = 'https://github.com/twoznia/gry/issues/new';

const CATEGORY_ICONS = {
    'Film i Telewizja':            '🎬',
    'Geografia i Turystyka':       '🗺️',
    'Historia':                    '📜',
    'Kulinaria i Smaki':           '🍽️',
    'Literatura i Język':          '📚',
    'Matura Geografia':            '🌍',
    'Matura Język Polski':         '🖋️',
    'Motoryzacja i Transport':     '🚗',
    'Muzyka':                      '🎵',
    'Nauka i Odkrycia':            '🔬',
    'Przyroda i Biologia':         '🌿',
    'Rozrywka i Popkultura':       '🎭',
    'Sport':                       '⚽',
    'Społeczeństwo i Prawo':       '⚖️',
    'Sztuka i Architektura':       '🎨',
    'Technologie i IT':            '💻',
    'Tradycje i Religie':          '⛪',
    'Wiedza Ogólna i Ciekawostki': '🧠',
};

const reportModal = document.getElementById('report-modal');
const reportForm = document.getElementById('report-form');
const reportError = document.getElementById('report-error');
const reportSuccess = document.getElementById('report-success');
const reportCategory = document.getElementById('report-category');
const reportSubcategory = document.getElementById('report-subcategory');
const reportQuestion = document.getElementById('report-question');
const reportCorrect = document.getElementById('report-correct');
const reportWebsite = document.getElementById('report-website');
const reportComment = document.getElementById('report-comment');
const reportCommentCount = document.getElementById('report-comment-count');

async function loadAllData() {
    try {
        const text = await fetch('./dane/pytania.csv').then(r => r.text());
        const lines = text.split('\n');
        const categoryMap = new Map(); // category -> {category, icon, questions:[]}
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(';');
            if (cols.length < 8) continue;
            const [category, subcategory, level, question, correct, wrong1, wrong2, wrong3] = cols;
            if (!category || !question || !correct) continue;
            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    category,
                    icon: CATEGORY_ICONS[category] || '❓',
                    questions: [],
                });
            }
            categoryMap.get(category).questions.push({
                subcategory,
                level,
                question,
                answers: shuffle([
                    { text: correct, is_correct: true },
                    { text: wrong1,  is_correct: false },
                    { text: wrong2,  is_correct: false },
                    { text: wrong3,  is_correct: false },
                ]),
            });
        }
        allData = Array.from(categoryMap.values());
        document.getElementById('btn-start').disabled = false;
        document.getElementById('btn-start').textContent = 'Rozpocznij Quiz →';
        populateCategorySelect();
    } catch (e) {
        loadError = true;
        document.getElementById('setup-error').textContent = 'Błąd ładowania danych.';
    }
}

function populateCategorySelect() {
    const sel = document.getElementById('sel-category');
    allData.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.category;
        opt.textContent = (d.icon || '❓') + ' ' + d.category;
        sel.appendChild(opt);
    });
    populateLevelSelect();
}

function populateLevelSelect() {
    const sel = document.getElementById('sel-level');
    const levels = [...new Set(allData.flatMap(d => d.questions.map(q => q.level)).filter(Boolean))].sort();
    levels.forEach(level => {
        const opt = document.createElement('option');
        opt.value = level;
        opt.textContent = level.charAt(0).toUpperCase() + level.slice(1);
        sel.appendChild(opt);
    });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function escapeIssueValue(str) {
    return String(str ?? '').replace(/\r/g, '').trim();
}

function getDeviceContext() {
    return [
        `Czas zgłoszenia: ${new Date().toISOString()}`,
        `Adres gry: ${window.location.href}`,
        `Język przeglądarki: ${navigator.language || 'brak danych'}`,
        `User agent: ${navigator.userAgent || 'brak danych'}`,
    ].join('\n');
}

function getIssueTitle(questionText) {
    const snippet = String(questionText || 'Bez treści pytania').slice(0, 80);
    return `[Pytania] Błąd w pytaniu: ${snippet}`;
}

function getIssueBody({ category, subcategory, question, correctAnswer, comment }) {
    const lines = [
        '## Dane pytania',
        '',
        `**Kategoria:** ${escapeIssueValue(category)}`,
        `**Subkategoria:** ${escapeIssueValue(subcategory)}`,
        `**Pytanie:** ${escapeIssueValue(question)}`,
        `**Poprawna odpowiedź:** ${escapeIssueValue(correctAnswer)}`,
    ];
    if (comment) {
        lines.push('', '## Komentarz', '', escapeIssueValue(comment));
    }
    lines.push('', '## Kontekst techniczny', '', '```text', getDeviceContext(), '```');
    return lines.join('\n');
}

function openGitHubIssue(payload) {
    const url = new URL(ISSUE_URL);
    url.searchParams.set('template', ISSUE_TEMPLATE_NAME);
    url.searchParams.set('title', getIssueTitle(payload.question));
    url.searchParams.set('body', getIssueBody(payload));
    const issueWindow = window.open(url.toString(), '_blank', 'noopener,noreferrer');
    return Boolean(issueWindow);
}

function resetReportForm() {
    reportForm.reset();
    reportError.textContent = '';
    reportSuccess.textContent = '';
    reportCommentCount.textContent = '0';
    reportCategory.value = '';
    reportSubcategory.value = '';
    reportQuestion.value = '';
    reportCorrect.value = '';
}

function openReportModal(context = {}) {
    resetReportForm();
    state.reportContext = context;
    if (context.question) {
        const q = context.question;
        const correctAnswer = q.answers.find(a => a.is_correct)?.text || 'brak danych';
        reportCategory.value = q._category || 'brak danych';
        reportSubcategory.value = q.subcategory || 'brak danych';
        reportQuestion.value = q.question || 'brak danych';
        reportCorrect.value = correctAnswer;
    }
    reportModal.classList.add('open');
    reportModal.setAttribute('aria-hidden', 'false');
    reportComment.focus();
}

function closeReportModal() {
    reportModal.classList.remove('open');
    reportModal.setAttribute('aria-hidden', 'true');
}

function validateReportForm() {
    if (reportWebsite.value.trim()) {
        return 'Nie udało się wysłać zgłoszenia.';
    }
    return '';
}

function getRandomCategoryQuestions(numQ, levelFilter) {
    const categoryPools = shuffle(allData.map(d => ({
        category: d.category,
        questions: shuffle(
            d.questions
                .filter(q => !levelFilter || levelFilter === '__all__' || q.level === levelFilter)
                .map(q => ({ ...q, _category: d.category }))
        ),
    }))).filter(d => d.questions.length > 0);

    const selected = [];

    while (selected.length < numQ) {
        let addedThisRound = false;

        categoryPools.forEach(pool => {
            if (selected.length >= numQ || !pool.questions.length) return;

            selected.push(pool.questions.pop());
            addedThisRound = true;
        });

        if (!addedThisRound) break;
    }

    return selected;
}

function getQuestions(categoryName, numQ, levelFilter) {
    let pool;
    if (categoryName === '__random__') {
        return getRandomCategoryQuestions(numQ, levelFilter);
    } else {
        const catData = allData.find(d => d.category === categoryName);
        if (!catData) return [];
        pool = catData.questions.map(q => ({ ...q, _category: catData.category }));
    }
    if (levelFilter && levelFilter !== '__all__') {
        pool = pool.filter(q => q.level === levelFilter);
    }
    return shuffle(pool).slice(0, numQ);
}

// ── Screens ──────────────────────────────────────────────────────────────────
const screens = {
    setup:   document.getElementById('screen-setup'),
    game:    document.getElementById('screen-game'),
    results: document.getElementById('screen-results'),
};

function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
}

// ── State ────────────────────────────────────────────────────────────────────
let state = {};

function startGame() {
    const categoryName = document.getElementById('sel-category').value;
    const numQ = parseInt(document.getElementById('sel-questions').value, 10);
    const levelFilter = document.getElementById('sel-level').value;
    const questions = getQuestions(categoryName, numQ, levelFilter);

    if (!questions.length) {
        document.getElementById('setup-error').textContent = 'Brak pytań dla wybranej kategorii.';
        return;
    }

    state = {
        questions,
        currentQ: 0,
        currentAnswerOrder: [],
        score: 0,
        answered: false,
        results: [],
    };

    buildProgressBar(questions.length);
    renderQuestion();
    showScreen('game');
}

// ── Progress bar ─────────────────────────────────────────────────────────────
function buildProgressBar(n) {
    const bar = document.getElementById('progress-bar');
    bar.innerHTML = '';
    for (let i = 0; i < n; i++) {
        const dot = document.createElement('div');
        dot.className = 'progress-dot';
        bar.appendChild(dot);
    }
}

function updateProgressBar(idx, isCorrect) {
    const dots = document.getElementById('progress-bar').children;
    if (dots[idx]) {
        dots[idx].classList.remove('current');
        dots[idx].classList.add('done');
        if (!isCorrect) dots[idx].classList.add('wrong');
    }
    if (dots[idx + 1]) dots[idx + 1].classList.add('current');
}

function initProgressBar(idx) {
    const dots = document.getElementById('progress-bar').children;
    if (dots[idx]) dots[idx].classList.add('current');
}

// ── Render question ───────────────────────────────────────────────────────────
function renderQuestion() {
    stopSpeechSequence();                 // przerwij ewentualne czytanie z poprzedniego pytania
    speakClickCount = 0;                  // nowy zestaw: pierwszy klik znów czyta pytanie i odpowiedzi
    const { currentQ, questions } = state;
    const q = questions[currentQ];

    document.getElementById('q-counter').textContent = `Pytanie ${currentQ + 1} / ${questions.length}`;
    document.getElementById('score-display').textContent = state.score;
    document.getElementById('q-category-name').textContent = q._category;
    document.getElementById('q-subcategory-name').textContent = q.subcategory;
    document.getElementById('q-question').textContent = q.question;
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
    document.getElementById('btn-next').style.display = 'none';
    document.getElementById('btn-report-question').style.display = 'none';

    initProgressBar(currentQ);

    const correctAnswer = q.answers.find(a => a.is_correct);
    const shuffledAnswers = shuffle(q.answers);
    state.currentAnswerOrder = shuffledAnswers.map(answer => answer.text);

    const grid = document.getElementById('answers-grid');
    grid.innerHTML = '';
    shuffledAnswers.forEach(ans => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = ans.text;
        btn.addEventListener('click', () => handleAnswer(ans, correctAnswer));
        grid.appendChild(btn);
    });

    state.answered = false;
}

// ── Handle answer ─────────────────────────────────────────────────────────────
function handleAnswer(chosen, correct) {
    if (state.answered) return;
    state.answered = true;
    stopSpeechSequence();                 // przerwij czytanie po wybraniu odpowiedzi

    const grid = document.getElementById('answers-grid');
    const btns = grid.querySelectorAll('.answer-btn');
    const isCorrect = chosen.is_correct;

    btns.forEach(btn => {
        btn.disabled = true;
        if (btn.textContent === correct.text) btn.classList.add('correct');
    });

    if (!isCorrect) {
        btns.forEach(btn => {
            if (btn.textContent === chosen.text) btn.classList.add('wrong');
        });
    }

    const fb = document.getElementById('feedback');
    if (isCorrect) {
        state.score++;
        fb.textContent = '✅ Dobrze!';
        fb.className = 'feedback ok';
    } else {
        fb.textContent = `❌ Błąd! Prawidłowa: ${correct.text}`;
        fb.className = 'feedback bad';
    }

    document.getElementById('score-display').textContent = state.score;
    updateProgressBar(state.currentQ, isCorrect);

    state.results.push({
        question: state.questions[state.currentQ],
        chosenText: chosen.text,
        isCorrect,
        visibleAnswers: state.currentAnswerOrder.slice(),
    });

    document.getElementById('btn-next').style.display = 'inline-block';
    document.getElementById('btn-report-question').style.display = 'inline-block';
}

// ── Next question / finish ────────────────────────────────────────────────────
document.getElementById('btn-next').addEventListener('click', () => {
    state.currentQ++;
    if (state.currentQ >= state.questions.length) {
        showResults();
    } else {
        renderQuestion();
    }
});

// ── Results ───────────────────────────────────────────────────────────────────
function showResults() {
    const { score, questions, results } = state;
    const n = questions.length;
    const pct = score / n;

    document.getElementById('result-score').textContent = score;
    document.getElementById('result-max').textContent = `na ${n} pytań`;

    let comment = '';
    if (pct === 1)       comment = '🏆 Doskonale! Bezbłędny wynik!';
    else if (pct >= 0.8) comment = '🎉 Świetny wynik!';
    else if (pct >= 0.6) comment = '👍 Nieźle!';
    else if (pct >= 0.4) comment = '📖 Jest nad czym popracować.';
    else                 comment = '💪 Spróbuj jeszcze raz!';
    document.getElementById('result-comment').textContent = comment;

    const list = document.getElementById('result-list');
    list.innerHTML = '';
    results.forEach(r => {
        const row = document.createElement('div');
        row.className = 'result-row';
        const icon = r.isCorrect ? '✅' : '❌';
        const correctText = r.question.answers.find(a => a.is_correct).text;
        row.innerHTML = `
            <span class="result-icon">${icon}</span>
            <div class="result-q">
                <div class="q-text">${r.question.question}</div>
                <div class="q-ans">
                    ${r.isCorrect
                        ? `<span class="correct-ans">${r.chosenText}</span>`
                        : `Twoja: ${r.chosenText} → <span class="correct-ans">${correctText}</span>`
                    }
                </div>
            </div>
            <button class="result-report-btn" type="button">Zgłoś</button>`;
        row.querySelector('.result-report-btn').addEventListener('click', () => {
            openReportModal({
                question: r.question,
                chosenText: r.chosenText,
                visibleAnswers: r.visibleAnswers,
            });
        });
        list.appendChild(row);
    });

    showScreen('results');
}

// ── Replay ────────────────────────────────────────────────────────────────────
document.getElementById('btn-replay').addEventListener('click', () => {
    showScreen('setup');
});

// ── Głośnik na pytaniu ──────────────────────────────────────────────────────
document.getElementById('q-speak-btn').addEventListener('click', handleSpeakClick);

// ── Start button ──────────────────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', () => {
    document.getElementById('setup-error').textContent = '';
    startGame();
});

document.getElementById('btn-report-question').addEventListener('click', () => {
    if (!state.questions?.length) return;
    openReportModal({
        question: state.questions[state.currentQ],
    });
});

document.getElementById('btn-report-tech').addEventListener('click', () => {
    const url = new URL(ISSUE_URL);
    url.searchParams.set('template', ISSUE_TEMPLATE_NAME);
    url.searchParams.set('title', '[Pytania] Problem techniczny');
    url.searchParams.set('body', [
        '## Opis problemu',
        '',
        '',
        '',
        '## Kontekst techniczny',
        '',
        '```text',
        getDeviceContext(),
        '```',
    ].join('\n'));
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
});

document.getElementById('btn-report-close').addEventListener('click', closeReportModal);
document.getElementById('btn-report-cancel').addEventListener('click', closeReportModal);
document.getElementById('report-modal-close').addEventListener('click', closeReportModal);

reportComment.addEventListener('input', () => {
    reportCommentCount.textContent = String(reportComment.value.length);
});

reportForm.addEventListener('submit', event => {
    event.preventDefault();

    reportError.textContent = '';
    reportSuccess.textContent = '';

    const validationError = validateReportForm();
    if (validationError) {
        reportError.textContent = validationError;
        return;
    }

    const payload = {
        category: reportCategory.value,
        subcategory: reportSubcategory.value,
        question: reportQuestion.value,
        correctAnswer: reportCorrect.value,
        comment: reportComment.value.trim(),
    };

    const opened = openGitHubIssue(payload);
    if (!opened) {
        reportError.textContent = 'Przeglądarka zablokowała nowe okno. Zezwól na popup i spróbuj ponownie.';
        return;
    }

    reportSuccess.textContent = 'Otwarto nowe zgłoszenie na GitHub w osobnej karcie. Sprawdź je i wyślij.';
});

document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && reportModal.classList.contains('open')) {
        closeReportModal();
    }
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadAllData();
