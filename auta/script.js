    const TRANSLATIONS = {
        pl: {
            easyMode:  'TRYB SPOKOJNY\nHave Fun!!!',
            hardMode:  'TRYB SZYBKI\nDla odważnych!',
            crash:     'KRAKSA!',
            yourScore: 'TWÓJ WYNIK:',
            record:    'REKORD:',
            playAgain: 'ZAGRAJ PONOWNIE',
            resetRecord:   'RESETUJ REKORD',
            confirmReset:  'Wyzerować rekord?',
            streak:    'SERIA',
            milestone: 'REKORD POBITY!',
        },
        en: {
            easyMode:  'EASY MODE\nHave Fun!!!',
            hardMode:  'FAST MODE\nFor the brave!',
            crash:     'CRASH!',
            yourScore: 'YOUR SCORE:',
            record:    'RECORD:',
            playAgain: 'PLAY AGAIN',
            resetRecord:   'RESET RECORD',
            confirmReset:  'Reset high score?',
            streak:    'STREAK',
            milestone: 'NEW RECORD!',
        }
    };

    let lang = localStorage.getItem('lang') || 'pl';

    function applyLang() {
        const t = TRANSLATIONS[lang];
        updateOverlayInfo();
        document.getElementById('btn-reset-hi').innerText = t.resetRecord;
        document.getElementById('btn-easy').innerText = lang === 'pl' ? 'SPOKOJNY' : 'EASY';
        document.getElementById('btn-hard').innerText = lang === 'pl' ? 'SZYBKI'   : 'FAST';
        document.getElementById('btn-pl').style.borderColor = lang === 'pl' ? '#fff' : '#888';
        document.getElementById('btn-en').style.borderColor = lang === 'en' ? '#fff' : '#888';
    }

    function setLang(l) {
        localStorage.setItem('lang', l);
        location.reload();
    }

    const screen   = document.getElementById('screen');
    const player   = document.getElementById('player');
    const scoreEl  = document.getElementById('score');
    const hiScoreEl= document.getElementById('hi-score');
    const livesEl  = document.getElementById('lives');
    const streakEl = document.getElementById('streak');
    const overlay  = document.getElementById('overlay');
    const statusTitle = document.getElementById('status-title');
    const finalInfo   = document.getElementById('final-info');
    const actionBtn   = document.getElementById('action-btn');
    const modeBtns    = document.getElementById('mode-buttons');

    // ─── Config ────────────────────────────────────────────────────────────────────
    const MODE_CFG = {
        spokojny: { baseSpeed: 3.8, label: 'easyMode', hiKey: 'autoslalom_hi_easy' },
        szybki:   { baseSpeed: 5.5, label: 'hardMode', hiKey: 'autoslalom_hi_hard' },
    };

    const HIT_RECOVERY_MS = 800;
    const FREE_PASS_BLINK_MS = 250;
    const COLLISION_H_INSET = 10;
    const COLLISION_V_INSET = 6;
    const CAR_W = 54, CAR_H = 36, TRUCK_H = 52, HEART_H = 54, PLAYER_BOTTOM = 30;
    const HEART_INTERVAL = 15;

    // ─── State ─────────────────────────────────────────────────────────────────────
    let gameMode = 'spokojny';
    let lastMode = 'spokojny';
    let baseSpeed = MODE_CFG.spokojny.baseSpeed;
    let currentSpeed = baseSpeed;
    let hiScore = 0;
    let score = 0, lives = 3, streak = 0;
    let playerLane = 1;
    let gameActive = false;
    let obstacles = [];
    let spawnTimer = 0, patternStep = 0;
    let framesOnSameLane = 0, lastLane = 1;
    let lastHeartScore = 0, lastHeartTime = 0;
    let freePasses = 0;
    let recordBrokenThisRun = false;
    let lanes = [], cachedScreenH = 0;

    // ─── Hi-score ──────────────────────────────────────────────────────────────────
    function hiKey() { return MODE_CFG[gameMode].hiKey; }
    function loadHi() { return parseInt(localStorage.getItem(hiKey()) || '0', 10) || 0; }
    function saveHi() {
        if (score > hiScore) {
            hiScore = score;
            localStorage.setItem(hiKey(), hiScore.toString());
        }
    }

    function updateHiDisplay() {
        hiScoreEl.innerText = `HI: ${hiScore.toString().padStart(4, '0')}`;
    }

    function resetHiScore() {
        if (confirm(TRANSLATIONS[lang].confirmReset)) {
            localStorage.setItem(hiKey(), '0');
            hiScore = 0;
            updateHiDisplay();
            updateOverlayInfo();
        }
    }

    // ─── Overlay text ──────────────────────────────────────────────────────────────
    function updateOverlayInfo() {
        if (finalInfo.dataset.state === 'end') return;
        const t   = TRANSLATIONS[lang];
        const cfg = MODE_CFG[gameMode] || MODE_CFG.spokojny;
        const lines = [...t[cfg.label].split('\n'), `${t.record} ${hiScore.toString().padStart(4,'0')}`];
        finalInfo.replaceChildren();
        lines.forEach((line, i) => {
            if (i > 0) finalInfo.appendChild(document.createElement('br'));
            finalInfo.appendChild(document.createTextNode(line));
        });
    }

    // ─── Lanes ─────────────────────────────────────────────────────────────────────
    function calculateLanes() {
        const sw = screen.clientWidth;
        cachedScreenH = screen.clientHeight;
        const padding = (sw - CAR_W * 4) / 5;
        lanes = [0,1,2,3].map(i => padding * (i+1) + CAR_W * i);
    }
    window.addEventListener('resize', calculateLanes);
    calculateLanes();

    // ─── Road animation speed ──────────────────────────────────────────────────────
    function updateRoadSpeed() {
        const dur = Math.max(60, Math.round(700 / currentSpeed));
        document.documentElement.style.setProperty('--lane-dur', dur + 'ms');
        // Darker tint at high speed
        document.body.classList.toggle('speed-high', currentSpeed > 8);
    }

    // ─── Streak ────────────────────────────────────────────────────────────────────
    function updateStreak() {
        if (streak >= 5) {
            streakEl.innerText = `${TRANSLATIONS[lang].streak} ×${streak}`;
        } else {
            streakEl.innerText = '';
        }
    }

    // ─── Input ─────────────────────────────────────────────────────────────────────
    function handleMove(dir) {
        if (!gameActive) return;
        if (dir === 'L' && playerLane > 0) playerLane--;
        if (dir === 'P' && playerLane < 3) playerLane++;
        player.style.left = lanes[playerLane] + 'px';
    }

    window.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft')  handleMove('L');
        if (e.key === 'ArrowRight') handleMove('P');
    });

    let touchStartX = null, swipeFired = false;
    screen.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; swipeFired = false; }, { passive: true });
    screen.addEventListener('touchmove', e => {
        if (touchStartX === null || swipeFired) return;
        const dx = e.touches[0].clientX - touchStartX;
        if (Math.abs(dx) > 15) { handleMove(dx < 0 ? 'L' : 'P'); swipeFired = true; }
    }, { passive: true });
    screen.addEventListener('touchend', () => { touchStartX = null; swipeFired = false; }, { passive: true });

    window.oncontextmenu = e => { e.preventDefault(); e.stopPropagation(); return false; };

    // ─── Spawning ──────────────────────────────────────────────────────────────────
    function spawnCar(laneIdx) {
        const el = document.createElement('div');
        el.className = 'car-shape';
        el.innerHTML = '<div class="wheel w1"></div><div class="wheel w2"></div><div class="car-body"></div><div class="wheel w3"></div><div class="wheel w4"></div>';
        el.style.top  = '-50px';
        el.style.left = lanes[laneIdx] + 'px';
        screen.appendChild(el);
        obstacles.push({ el, lane: laneIdx, y: -50, h: CAR_H });
    }

    function spawnTruck(laneIdx) {
        const el = document.createElement('div');
        el.className = 'truck-shape';
        el.innerHTML = '<div class="wheel w1"></div><div class="wheel w2"></div><div class="truck-body"></div><div class="wheel w3"></div><div class="wheel w4"></div>';
        el.style.top  = '-60px';
        el.style.left = lanes[laneIdx] + 'px';
        screen.appendChild(el);
        obstacles.push({ el, lane: laneIdx, y: -60, h: TRUCK_H, isTruck: true });
    }

    function spawnHeart(laneIdx) {
        const el = document.createElement('div');
        el.className = 'heart-shape';
        el.textContent = '♥';
        el.style.top  = '-50px';
        el.style.left = lanes[laneIdx] + 'px';
        screen.appendChild(el);
        obstacles.push({ el, lane: laneIdx, y: -50, h: HEART_H, isHeart: true });
    }

    // ─── Collision ─────────────────────────────────────────────────────────────────
    function isCollidingWithPlayer(o) {
        const pLeft = lanes[playerLane];
        const pTop  = cachedScreenH - PLAYER_BOTTOM - CAR_H;
        const oLeft = lanes[o.lane];
        return (
            pLeft + COLLISION_H_INSET < oLeft + CAR_W - COLLISION_H_INSET &&
            pLeft + CAR_W - COLLISION_H_INSET > oLeft + COLLISION_H_INSET &&
            pTop  + COLLISION_V_INSET < o.y + o.h - COLLISION_V_INSET &&
            pTop  + CAR_H - COLLISION_V_INSET > o.y + COLLISION_V_INSET
        );
    }

    // ─── Milestone popup ───────────────────────────────────────────────────────────
    function showMilestone(text) {
        const el = document.createElement('div');
        el.className = 'milestone-pop';
        el.textContent = text;
        screen.appendChild(el);
        el.addEventListener('animationend', () => el.remove());
    }

    // ─── Game loop ─────────────────────────────────────────────────────────────────
    function gameLoop() {
        if (!gameActive) return;

        spawnTimer++;
        if (playerLane === lastLane) framesOnSameLane++;
        else { framesOnSameLane = 0; lastLane = playerLane; }

        const vScore   = score;
        const spawnRate = Math.max(14, 46 - vScore / 2.8);

        if (spawnTimer > spawnRate) {
            spawnTimer = 0;

            // Punish camping in one lane
            if (framesOnSameLane > 90) {
                spawnCar(playerLane);
                framesOnSameLane = 0;
            } else {
                const phase = Math.floor(score / 15) % 4;
                const truckChance = Math.min(0.15, score / 600); // trucks get more common
                const plan = []; // { lane, isTruck }

                if (phase === 0) {
                    // sequential lanes
                    const l = patternStep % 4;
                    plan.push({ lane: l, isTruck: Math.random() < truckChance });
                    patternStep++;
                } else if (phase === 1) {
                    // pairs
                    const pairs = [[0,3],[1,2],[0,1],[2,3]];
                    const [a,b] = pairs[patternStep % 4];
                    plan.push({ lane: a }, { lane: b });
                    patternStep++;
                } else if (phase === 2) {
                    // random, sometimes truck
                    const l = Math.floor(Math.random() * 4);
                    plan.push({ lane: l, isTruck: Math.random() < truckChance });
                    if (vScore > 50) plan.push({ lane: (l + 2) % 4 });
                } else {
                    // 3 lanes blocked — luka ZAWSZE w zasięgu gracza (±1 pas),
                    // dzięki czemu poziom jest zawsze przechodliwy, także na trybie szybkim
                    if (vScore > 80) {
                        const open = Math.max(0, Math.min(3, playerLane + (Math.floor(Math.random() * 3) - 1)));
                        [0,1,2,3].filter(l => l !== open).forEach(l => plan.push({ lane: l }));
                    } else {
                        plan.push({ lane: Math.floor(Math.random() * 4) });
                    }
                }

                // Zabezpieczenie ogólne: uwzględnij też przeszkody już będące w drodze
                // (blisko górnej krawędzi) — nowy spawn nigdy nie może zablokować
                // wszystkich 4 pasów naraz, inaczej plansza staje się nie do przejścia.
                const WAVE_TOP = 110;
                const incoming = new Set(
                    obstacles.filter(o => !o.isHeart && o.y < WAVE_TOP).map(o => o.lane)
                );
                plan.forEach(p => incoming.add(p.lane));
                while (incoming.size >= 4 && plan.length) {
                    const idx = plan.findIndex(p =>
                        !obstacles.some(o => !o.isHeart && o.y < WAVE_TOP && o.lane === p.lane)
                    );
                    const removeAt = idx === -1 ? 0 : idx;
                    const removedLane = plan[removeAt].lane;
                    plan.splice(removeAt, 1);
                    if (!plan.some(p => p.lane === removedLane)) incoming.delete(removedLane);
                }

                // Zawsze zostaw lukę osiągalną jednym ruchem (±1 pas) — brak niemożliwych
                // układów 3 aut z luką poza zasięgiem gracza.
                const nearPlayer = [playerLane - 1, playerLane, playerLane + 1].filter(l => l >= 0 && l <= 3);
                const reachableOpen = () => [0, 1, 2, 3].some(l => !incoming.has(l) && nearPlayer.includes(l));
                while (!reachableOpen() && plan.length) {
                    const idx = plan.findIndex(p => nearPlayer.includes(p.lane));
                    if (idx === -1) break; // blokada z już jadących przeszkód — nie ruszamy planu
                    const lane = plan[idx].lane;
                    plan.splice(idx, 1);
                    if (!plan.some(p => p.lane === lane)) incoming.delete(lane);
                }

                plan.forEach(p => (p.isTruck ? spawnTruck(p.lane) : spawnCar(p.lane)));
            }
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const o = obstacles[i];
            o.y += currentSpeed;
            o.el.style.top = o.y + 'px';

            if (isCollidingWithPlayer(o)) {
                if (o.isHeart) { handleHeartCollect(i); continue; }
                if (freePasses > 0) { handleFreePass(i); continue; }
                handleHit(o, i);
                continue;
            }

            if (o.y > cachedScreenH) {
                if (!o.isHeart) {
                    score++;
                    streak++;
                    updateStreak();

                    // Record check
                    if (!recordBrokenThisRun && score > hiScore) {
                        recordBrokenThisRun = true;
                        document.body.classList.add('record-beaten');
                        showMilestone(TRANSLATIONS[lang].milestone);
                    }

                    // Speed increase every 10 pts
                    if (score % 10 === 0) {
                        currentSpeed += baseSpeed * 0.04;
                        updateRoadSpeed();
                    }

                    scoreEl.innerText = score.toString().padStart(4, '0');

                    // Heart spawn
                    if (lives < 3 && score - lastHeartScore >= HEART_INTERVAL && Date.now() - lastHeartTime >= 10000) {
                        const validLanes = [0,1,2,3].filter(l =>
                            Math.abs(l - playerLane) >= 2 &&
                            !obstacles.some(o => !o.isHeart && o.lane === l && o.y < 140) // pas wolny od aut przy górze
                        );
                        if (validLanes.length) {
                            spawnHeart(validLanes[Math.floor(Math.random() * validLanes.length)]);
                            lastHeartScore = score;
                            lastHeartTime  = Date.now();
                        }
                    }
                }
                o.el.remove();
                obstacles.splice(i, 1);
            }
        }
        requestAnimationFrame(gameLoop);
    }

    // ─── Hit handlers ──────────────────────────────────────────────────────────────
    function handleHit(obstacle, index) {
        lives--;
        streak = 0;
        updateStreak();
        livesEl.innerText = '♥♥♥'.substring(0, lives);
        obstacle.el.classList.add('blink', 'hit-style');
        player.classList.add('blink', 'hit-style');
        gameActive = false;

        setTimeout(() => {
            obstacle.el.remove();
            obstacles.splice(index, 1);
            player.classList.remove('blink', 'hit-style');
            if (lives <= 0) endGame();
            else {
                freePasses = 1;
                gameActive = true;
                framesOnSameLane = 0;
                gameLoop();
            }
        }, HIT_RECOVERY_MS);
    }

    function handleFreePass(index) {
        freePasses--;
        player.classList.add('blink');
        obstacles[index].el.remove();
        obstacles.splice(index, 1);
        setTimeout(() => player.classList.remove('blink'), FREE_PASS_BLINK_MS);
    }

    function handleHeartCollect(index) {
        obstacles[index].el.remove();
        obstacles.splice(index, 1);
        if (lives < 3) {
            lives++;
            livesEl.innerText = '♥♥♥'.substring(0, lives);
        }
    }

    // ─── Start / End ───────────────────────────────────────────────────────────────
    function startGame(mode) {
        gameMode  = mode || 'spokojny';
        lastMode  = gameMode;
        baseSpeed = MODE_CFG[gameMode].baseSpeed;
        currentSpeed = baseSpeed;
        hiScore   = loadHi();

        calculateLanes();
        document.querySelectorAll('.car-shape:not(#player), .truck-shape, .heart-shape').forEach(o => o.remove());
        obstacles = [];
        score = 0; lives = 3; streak = 0;
        patternStep = 0; framesOnSameLane = 0;
        lastHeartScore = 0; lastHeartTime = 0;
        freePasses = 0; recordBrokenThisRun = false;

        scoreEl.innerText  = '0000';
        livesEl.innerText  = '♥♥♥';
        streakEl.innerText = '';
        updateHiDisplay();
        updateRoadSpeed();

        finalInfo.dataset.state = 'start';
        overlay.style.display = 'none';
        modeBtns.style.display = 'flex';
        actionBtn.style.display = 'none';

        playerLane = 1;
        player.style.left    = lanes[1] + 'px';
        player.style.display = 'block';
        document.body.classList.remove('record-beaten', 'speed-high');

        gameActive = true;
        gameLoop();
    }

    function endGame() {
        gameActive = false;
        saveHi();
        updateHiDisplay();

        // Zapis KAŻDEGO wyniku do chmury (top-20 na gracza pilnuje trigger) — logika jak w soltaire.
        if (score > 0 && window.GryScores && GryScores.submit) {
            GryScores.submit('auta', score, { mode: gameMode });
        }

        // Zatrzymaj obraz na 2 s (widać jak się skończyło), potem pokaż rekordy + menu.
        setTimeout(() => {
            statusTitle.innerText = TRANSLATIONS[lang].crash;
            finalInfo.dataset.state = 'end';
            finalInfo.textContent = `${TRANSLATIONS[lang].yourScore} ${score.toString().padStart(4,'0')}\n${TRANSLATIONS[lang].record} ${hiScore.toString().padStart(4,'0')}`;
            modeBtns.style.display  = 'none';
            actionBtn.style.display = 'block';
            actionBtn.innerText = TRANSLATIONS[lang].playAgain;
            overlay.style.display = 'flex';
            if (window.GryScores && GryScores.showRecords) {
                GryScores.showRecords('auta', {
                    actions: [{ label: TRANSLATIONS[lang].playAgain || 'Nowa gra', onClick: (close) => { close(); startGame(lastMode); } }]
                });
            }
        }, 2000);
    }

    // ─── Init ──────────────────────────────────────────────────────────────────────
    hiScore = loadHi();
    updateHiDisplay();
    applyLang();
    updateOverlayInfo();
    finalInfo.dataset.state = 'menu';
    overlay.style.display   = 'flex';
