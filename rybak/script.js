    const TRANSLATIONS = {
        pl: {
            fish: 'Ryby:',
            time: 'Czas:',
            record: 'Rekord:',
            level: 'Poziom:',
            run: 'UCIEKAJ!!!',
            endFishing: 'Koniec Połowu!',
            totalFish: 'Łącznie ryb:',
            levelReached: 'Osiągnięty Poziom:',
            newRecord: '🏆 NOWY REKORD!',
            playAgain: 'Zagraj ponownie',
            resetRecord: 'Resetuj rekord',
            hit: 'TRAFIONY! 💩',
            tryAgain: 'Spróbuj ponownie',
            confirmReset: 'Wyzerować rekord?',
            levelUp: (lvl) => `POZIOM ${lvl}!`
        },
        en: {
            fish: 'Fish:',
            time: 'Time:',
            record: 'Record:',
            level: 'Level:',
            run: 'RUN!!!',
            endFishing: 'End of Fishing!',
            totalFish: 'Total fish:',
            levelReached: 'Level reached:',
            newRecord: '🏆 NEW RECORD!',
            playAgain: 'Play again',
            resetRecord: 'Reset record',
            hit: 'HIT! 💩',
            tryAgain: 'Try again',
            confirmReset: 'Reset high score?',
            levelUp: (lvl) => `LEVEL ${lvl}!`
        }
    };
    const lang = localStorage.getItem('lang') || 'pl';
    const t = TRANSLATIONS[lang];

    function setLang(l) {
        localStorage.setItem('lang', l);
        location.reload();
    }

    function applyLang() {
        document.getElementById('lbl-fish').textContent = t.fish;
        document.getElementById('lbl-time').textContent = t.time;
        document.getElementById('lbl-total-fish').textContent = t.totalFish;
        document.getElementById('lbl-total-fish2').textContent = t.totalFish;
        document.getElementById('lbl-final-lvl').textContent = t.levelReached;
        document.getElementById('lbl-record-time').textContent = t.record;
        document.getElementById('lbl-record-bird').textContent = t.record;
        document.getElementById('new-record-time').textContent = t.newRecord;
        document.getElementById('new-record-bird').textContent = t.newRecord;
        document.getElementById('time-up-title').textContent = t.endFishing;
        document.getElementById('game-over-title').textContent = t.hit;
        document.getElementById('btn-play-again').textContent = t.playAgain;
        document.getElementById('btn-try-again').textContent = t.tryAgain;
        document.getElementById('btn-reset-time').textContent = t.resetRecord;
        document.getElementById('btn-reset-bird').textContent = t.resetRecord;
        document.getElementById('warning-msg').textContent = t.run;
        document.getElementById('btn-pl').style.borderColor = lang === 'pl' ? '#FFD700' : '#888';
        document.getElementById('btn-en').style.borderColor = lang === 'en' ? '#FFD700' : '#888';
    }
    applyLang();
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const scoreElement = document.getElementById("score");
    const targetElement = document.getElementById("target");
    const timerElement = document.getElementById("timer");
    const lvlDisplay = document.getElementById("lvl-display");
    const warningMsg = document.getElementById("warning-msg");
    const levelMsg = document.getElementById("level-msg");
    const hiScoreEl = document.getElementById("hi-score");

    canvas.width = 800; canvas.height = 600;

    let totalScore = 0;   
    let levelScore = 0;   
    let level = 1;
    let hiScore = parseInt(localStorage.getItem('rybak_hi')) || 0;
    let currentTarget = 10; 
    let nextIncrement = 15; // Ile ryb będzie potrzebne na następny poziom po obecnym
    let cumulativeTarget = 10; // Łączny cel ryb (sumuje cele wszystkich poziomów)
    let timeLeft = 60;
    let gameActive = true;
    let spawnTimer = 0;
    let birdTimer = 300;
    const waterLevel = canvas.height * 0.4;

    const player = { x: 360, y: waterLevel - 20, width: 80, height: 25, speed: 8, hookX: 400, hookY: waterLevel, hookSpeed: 6 };
    let fishes = [];
    let bird = null;
    let birdDropping = null;

    const keys = {};
    window.onkeydown = (e) => {
        keys[e.code] = true;
        if (!gameActive && ["Space", "Enter", "ArrowDown"].includes(e.code)) location.reload();
    };
    window.onkeyup = (e) => keys[e.code] = false;

    let mouseDown = false;
    window.addEventListener("mousemove", (e) => {
        if (!gameActive) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const mouseX = (e.clientX - rect.left) * scaleX;
        player.x = Math.max(0, Math.min(720, mouseX - 40));
    });
    window.addEventListener("mousedown", (e) => { if (e.button === 0) mouseDown = true; });
    window.addEventListener("mouseup", (e) => { if (e.button === 0) mouseDown = false; });

    canvas.addEventListener("touchmove", (e) => {
        if (!gameActive) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const touchX = (e.touches[0].clientX - rect.left) * scaleX;
        player.x = Math.max(0, Math.min(720, touchX - 40));
    }, { passive: false });
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        mouseDown = true;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const touchX = (e.touches[0].clientX - rect.left) * scaleX;
        player.x = Math.max(0, Math.min(720, touchX - 40));
    }, { passive: false });
    canvas.addEventListener("touchend", () => { mouseDown = false; });

    const timerInterval = setInterval(() => {
        if (gameActive) {
            timeLeft--;
            timerElement.innerText = timeLeft;
            if (timeLeft <= 0) endGame('time');
        }
    }, 1000);

    // ── Progresja poziomów ─────────────────────────────────────────────
    // Ryby z każdym poziomem nieco przyspieszają (z górnym limitem),
    // a tempo ich pojawiania się rośnie tak, by przy złapaniu wszystkich
    // ryb poziom zawsze dało się ukończyć w wyznaczonym czasie.
    const SPEED_STEP = 0.08;   // +8% prędkości ryb na każdy poziom
    const SPEED_MAX = 2.0;     // maksymalny mnożnik prędkości
    const SPAWN_BASE = 70;     // bazowy odstęp między rybami (klatki) na 1. poziomie
    function levelSpeedMul() { return Math.min(SPEED_MAX, 1 + (level - 1) * SPEED_STEP); }
    function avgSpawnInterval() { return Math.max(22, SPAWN_BASE / (1 + (level - 1) * 0.18)); }
    // Czas dodawany przy awansie — z zapasem względem minimum potrzebnego,
    // gdy gracz łapie każdą rybę (tempo pojawiania ogranicza tempo łapania).
    function levelTimeBonus() { return Math.ceil(currentTarget * (avgSpawnInterval() / 60) * 1.8) + 4; }

    function checkLevelUp() {
        if (levelScore >= currentTarget) {
            level++;
            levelScore = 0;

            // Nowa mechanika progresji: cel rośnie o 5 więcej niż poprzednio
            currentTarget = nextIncrement;
            nextIncrement += 5; // Każdy kolejny poziom będzie o 5 trudniejszy od poprzedniego (10, 15, 20, 25...)
            cumulativeTarget += currentTarget;

            timeLeft += levelTimeBonus(); // zapas czasu skrojony pod cel i tempo pojawiania ryb
            timerElement.innerText = timeLeft;
            scoreElement.innerText = totalScore;
            targetElement.innerText = cumulativeTarget;
            lvlDisplay.innerText = t.level + " " + level;
            levelMsg.innerText = t.levelUp(level);
            levelMsg.style.display = "block";
            setTimeout(() => { levelMsg.style.display = "none"; }, 2000);
        }
    }

    function spawnFish() {
        if (!gameActive) return;
        spawnTimer--;
        if (spawnTimer <= 0) {
            const d = Math.random() > 0.5 ? 1 : -1;
            fishes.push({
                x: d === 1 ? -60 : 860,
                y: waterLevel + 60 + Math.random() * (canvas.height - waterLevel - 100),
                speed: (1.5 + Math.random() * 2) * d * levelSpeedMul(),
                color: `hsl(${Math.random() * 360}, 80%, 50%)`,
                size: 18 + Math.random() * 10,
                active: true,
                // animacja pływania
                phase: Math.random() * Math.PI * 2,
                wiggleSpeed: 0.18 + Math.random() * 0.12,
                bobAmp: 1.5 + Math.random() * 2
            });
            spawnTimer = avgSpawnInterval() * (0.6 + Math.random() * 0.8);
        }
    }

    function handleBird() {
        if (!gameActive) return;
        birdTimer--;
        if (birdTimer <= 0 && !bird) {
            const d = Math.random() > 0.5 ? 1 : -1;
            bird = { x: d==1?-60:860, y: 30+Math.random()*40, speed: (4+Math.random()*2)*d, hasDropped: false, isAiming: false, aimCounter: 0, wingPhase: 0 };
        }
        if (bird) {
            bird.x += bird.speed;
            bird.wingPhase += 0.18;
            if (!bird.hasDropped && !bird.isAiming && Math.abs(bird.x - (player.x + 40)) < 150) bird.isAiming = true;
            if (bird.isAiming && !bird.hasDropped) {
                bird.aimCounter++;
                if (bird.aimCounter > 30) {
                    birdDropping = { x: bird.x, y: bird.y + 10, speed: 6.5, size: 8 };
                    bird.hasDropped = true;
                    warningMsg.style.display = "block";
                    setTimeout(() => warningMsg.style.display = "none", 1000);
                }
            }
            if (bird.x < -150 || bird.x > 950) { bird = null; birdTimer = 200 + Math.random()*200; }
        }
        if (birdDropping) {
            birdDropping.y += birdDropping.speed;
            if (birdDropping.y > player.y && birdDropping.y < player.y + 25 && birdDropping.x > player.x && birdDropping.x < player.x + 80) endGame('bird');
            if (birdDropping && birdDropping.y > waterLevel) { setTimeout(()=> birdDropping = null, 100); birdDropping.speed = 0; }
        }
    }

    function updateHiScoreDisplay() {
        hiScoreEl.innerText = t.record + " " + hiScore;
    }
    updateHiScoreDisplay();

    function resetHiScore() {
        if (confirm(t.confirmReset)) {
            hiScore = 0;
            localStorage.setItem('rybak_hi', 0);
            updateHiScoreDisplay();
        }
    }

    function endGame(reason) {
        gameActive = false;
        clearInterval(timerInterval);
        const isNewRecord = totalScore > hiScore;
        if (isNewRecord) {
            hiScore = totalScore;
            localStorage.setItem('rybak_hi', hiScore);
            updateHiScoreDisplay();
        }
        if (reason === 'time') {
            document.getElementById("time-up").style.display = "flex";
            document.getElementById("total-score-time").innerText = totalScore;
            document.getElementById("final-lvl-time").innerText = level;
            document.getElementById("hi-score-time").innerText = hiScore;
            if (isNewRecord) document.getElementById("new-record-time").style.display = "block";
        } else {
            document.getElementById("game-over").style.display = "flex";
            document.getElementById("total-score-bird").innerText = totalScore;
            document.getElementById("hi-score-bird").innerText = hiScore;
            if (isNewRecord) document.getElementById("new-record-bird").style.display = "block";
            warningMsg.style.display = "none";
        }
    }

    function update() {
        if (!gameActive) return;
        if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
        if (keys["ArrowRight"] && player.x < 720) player.x += player.speed;

        if ((keys["ArrowDown"] || keys["Space"] || mouseDown) && player.hookY < canvas.height - 35) player.hookY += 6;
        else if (player.hookY > waterLevel) player.hookY -= 6;

        player.hookX += (player.x + 40 - player.hookX) * 0.15;

        fishes.forEach((f, i) => {
            f.x += f.speed;
            f.phase += f.wiggleSpeed;        // animacja machania ogonem / pływania
            if (f.active) {
                let dx = player.hookX - f.x, dy = player.hookY - f.y;
                if (Math.sqrt(dx*dx + dy*dy) < 25) {
                    f.active = false; totalScore++; levelScore++;
                    scoreElement.innerText = totalScore;
                    checkLevelUp();
                }
            }
            if (f.x < -150 || f.x > 950) fishes.splice(i, 1);
        });
        spawnFish(); handleBird();
    }

    function draw() {
        ctx.clearRect(0, 0, 800, 600);
        fishes.forEach(f => {
            if (!f.active) return;
            const d = f.speed > 0 ? 1 : -1;
            const wag  = Math.sin(f.phase);            // machanie ogonem
            const bob  = Math.sin(f.phase * 0.6) * f.bobAmp;   // delikatne bujanie w pionie
            ctx.save();
            ctx.translate(f.x, f.y + bob);
            // lekkie falowanie ciała (squash) w rytm pływania
            ctx.scale(1, 1 + Math.cos(f.phase) * 0.06);

            ctx.fillStyle = f.color;
            // ogon — kołysze się góra/dół
            const tailWag = wag * f.size * 0.55;
            ctx.beginPath();
            ctx.moveTo(-f.size*d, 0);
            ctx.lineTo(-f.size*1.6*d, -f.size*0.5 + tailWag);
            ctx.lineTo(-f.size*1.6*d,  f.size*0.5 + tailWag);
            ctx.closePath();
            ctx.fill();

            // płetwa grzbietowa — faluje
            ctx.beginPath();
            ctx.moveTo(-f.size*0.2*d, -f.size*0.45);
            ctx.quadraticCurveTo(-f.size*0.1*d, -f.size*0.75 - wag*2, f.size*0.25*d, -f.size*0.4);
            ctx.closePath();
            ctx.fill();

            // ciało
            ctx.beginPath(); ctx.ellipse(0, 0, f.size, f.size/2, 0, 0, 7); ctx.fill();

            // płetwa piersiowa — macha
            ctx.beginPath();
            ctx.ellipse(f.size*0.15*d, f.size*0.28, f.size*0.28, f.size*0.14, wag*0.5, 0, Math.PI*2);
            ctx.fill();

            // oko
            ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(f.size*0.5*d, -f.size*0.15, 4, 0, 7); ctx.fill();
            ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(f.size*0.5*d + d, -f.size*0.15, 1.5, 0, 7); ctx.fill();
            ctx.restore();
        });
        if (bird) {
            const flash = bird.isAiming && !bird.hasDropped && bird.aimCounter%10<5;
            const bd = bird.speed > 0 ? 1 : -1;
            const bx = bird.x, by = bird.y;
            const wingFlap = Math.sin(bird.wingPhase) * 16;
            ctx.save();

            // Shadow pod ptakiem
            ctx.fillStyle = "rgba(0,0,0,0.18)";
            ctx.beginPath();
            ctx.ellipse(bx, by + 18, 22, 5, 0, 0, Math.PI*2);
            ctx.fill();

            // Ogon
            const tailColor = flash ? "#ff6666" : "#e0e0e0";
            ctx.fillStyle = tailColor;
            ctx.beginPath();
            ctx.moveTo(bx - 10*bd, by + 2);
            ctx.lineTo(bx - 20*bd, by - 4);
            ctx.lineTo(bx - 22*bd, by + 2);
            ctx.lineTo(bx - 20*bd, by + 7);
            ctx.closePath();
            ctx.fill();

            // Skrzydło dolne (szare)
            const wingBase = flash ? "#cc3333" : "#9e9e9e";
            ctx.fillStyle = wingBase;
            ctx.beginPath();
            ctx.moveTo(bx - 2*bd, by + 2);
            ctx.quadraticCurveTo(bx - 15*bd, by + 8 - wingFlap*0.3, bx - 30*bd, by + 4 - wingFlap*0.6);
            ctx.quadraticCurveTo(bx - 14*bd, by + 12, bx - 2*bd, by + 8);
            ctx.closePath();
            ctx.fill();

            // Skrzydło górne (białe/główne)
            const wingColor = flash ? "#ff4444" : "#f5f5f5";
            ctx.fillStyle = wingColor;
            ctx.beginPath();
            ctx.moveTo(bx, by);
            ctx.quadraticCurveTo(bx - 14*bd, by - wingFlap, bx - 30*bd, by + 2 - wingFlap * 0.7);
            ctx.quadraticCurveTo(bx - 13*bd, by + 7, bx, by + 4);
            ctx.closePath();
            ctx.fill();

            // Lotki (końcówki skrzydła)
            ctx.strokeStyle = flash ? "#cc0000" : "#555";
            ctx.lineWidth = 1;
            for (let f = 0; f < 4; f++) {
                const fx = bx - (22 + f*2)*bd;
                const fy = by + 1 - wingFlap * 0.65 + f*1.5;
                ctx.beginPath();
                ctx.moveTo(fx, fy);
                ctx.lineTo(fx - 3*bd, fy + 5);
                ctx.stroke();
            }

            // Korpus
            const bodyColor = flash ? "#ff5555" : "#fafafa";
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.ellipse(bx + 2*bd, by + 2, 13, 7, bd * 0.15, 0, Math.PI*2);
            ctx.fill();

            // Brzuch (jaśniejszy)
            ctx.fillStyle = flash ? "#ffaaaa" : "#ffffff";
            ctx.beginPath();
            ctx.ellipse(bx + 1*bd, by + 4, 8, 4, 0, 0, Math.PI*2);
            ctx.fill();

            // Głowa
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.arc(bx + 13*bd, by - 3, 7, 0, Math.PI*2);
            ctx.fill();

            // Oko
            ctx.fillStyle = "#222";
            ctx.beginPath();
            ctx.arc(bx + 15*bd, by - 5, 2, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.arc(bx + 15.5*bd, by - 5.5, 0.8, 0, Math.PI*2);
            ctx.fill();

            // Dziób
            const beakColor = flash ? "#ff0000" : "#FFC107";
            ctx.fillStyle = beakColor;
            ctx.beginPath();
            ctx.moveTo(bx + 19*bd, by - 3);
            ctx.lineTo(bx + 27*bd, by - 1);
            ctx.lineTo(bx + 19*bd, by + 2);
            ctx.closePath();
            ctx.fill();
            // Czerwona kropka na dziobie
            if (!flash) {
                ctx.fillStyle = "#e53935";
                ctx.beginPath();
                ctx.arc(bx + 24*bd, by, 1.5, 0, Math.PI*2);
                ctx.fill();
            }

            ctx.restore();
        }
        if (birdDropping) { ctx.fillStyle = "#6D4C41"; ctx.beginPath(); ctx.arc(birdDropping.x, birdDropping.y, 8, 0, 7); ctx.fill(); }
        // Fishing line (behind everything)
        const rodTipX = player.x+60, rodTipY = player.y-32;
        ctx.strokeStyle = "rgba(255,255,255,0.6)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(rodTipX, rodTipY); ctx.lineTo(player.hookX, player.hookY); ctx.stroke();
        // Hook
        ctx.strokeStyle = "#bbb"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(player.hookX, player.hookY, 7, 0.5, 2.9); ctx.stroke();
        // Haczyk - grot
        ctx.beginPath(); ctx.moveTo(player.hookX + 6, player.hookY + 4); ctx.lineTo(player.hookX + 2, player.hookY + 7); ctx.stroke();

        const px = player.x, py = player.y;
        ctx.save();

        // === ŁÓDŹ ===
        // Cień łódki
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.beginPath();
        ctx.ellipse(px+40, py+28, 38, 5, 0, 0, Math.PI*2);
        ctx.fill();

        // Kadłub - gradient brąz
        const hullGrad = ctx.createLinearGradient(px, py, px, py+26);
        hullGrad.addColorStop(0, "#795548");
        hullGrad.addColorStop(1, "#3E2723");
        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.moveTo(px+4, py+2);
        ctx.lineTo(px+76, py+2);
        ctx.lineTo(px+70, py+22);
        ctx.quadraticCurveTo(px+40, py+28, px+10, py+22);
        ctx.closePath();
        ctx.fill();

        // Wnętrze łódki
        const interiorGrad = ctx.createLinearGradient(px, py+4, px, py+22);
        interiorGrad.addColorStop(0, "#A1887F");
        interiorGrad.addColorStop(1, "#6D4C41");
        ctx.fillStyle = interiorGrad;
        ctx.beginPath();
        ctx.moveTo(px+10, py+5);
        ctx.lineTo(px+70, py+5);
        ctx.lineTo(px+64, py+20);
        ctx.quadraticCurveTo(px+40, py+24, px+16, py+20);
        ctx.closePath();
        ctx.fill();

        // Górna krawędź łódki
        const rimGrad = ctx.createLinearGradient(px, py, px, py+4);
        rimGrad.addColorStop(0, "#5D4037");
        rimGrad.addColorStop(1, "#3E2723");
        ctx.fillStyle = rimGrad;
        ctx.fillRect(px+1, py, 78, 5);

        // Deski łódki
        ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px+28, py+5); ctx.lineTo(px+26, py+22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px+52, py+5); ctx.lineTo(px+54, py+22); ctx.stroke();

        // Metalowe nity na krawędzi
        ctx.fillStyle = "#aaa";
        [15,30,50,65].forEach(nx => {
            ctx.beginPath(); ctx.arc(px+nx, py+2, 2, 0, Math.PI*2); ctx.fill();
        });

        // === RYBAK ===
        // Nogi / spodnie
        const pantsGrad = ctx.createLinearGradient(px+30, py-8, px+30, py+2);
        pantsGrad.addColorStop(0, "#455A64");
        pantsGrad.addColorStop(1, "#263238");
        ctx.fillStyle = pantsGrad;
        ctx.beginPath();
        ctx.moveTo(px+32, py-8);
        ctx.lineTo(px+48, py-8);
        ctx.lineTo(px+46, py+2);
        ctx.lineTo(px+34, py+2);
        ctx.closePath();
        ctx.fill();
        // Kreska między nogami
        ctx.strokeStyle = "#1a252a"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(px+40, py-8); ctx.lineTo(px+40, py+1); ctx.stroke();

        // Kamizelka wędkarska (vest)
        const vestGrad = ctx.createLinearGradient(px+28, py-22, px+52, py-6);
        vestGrad.addColorStop(0, "#558B2F");
        vestGrad.addColorStop(1, "#33691E");
        ctx.fillStyle = vestGrad;
        ctx.beginPath();
        ctx.moveTo(px+28, py-22);
        ctx.lineTo(px+52, py-22);
        ctx.lineTo(px+50, py-7);
        ctx.lineTo(px+30, py-7);
        ctx.closePath();
        ctx.fill();
        // Kieszonki kamizelki
        ctx.fillStyle = "#2E7D32";
        ctx.fillRect(px+30, py-17, 7, 6);
        ctx.fillRect(px+43, py-17, 7, 6);
        ctx.strokeStyle = "#1B5E20"; ctx.lineWidth = 0.5;
        ctx.strokeRect(px+30, py-17, 7, 6);
        ctx.strokeRect(px+43, py-17, 7, 6);
        // Guziczki kieszonek
        ctx.fillStyle = "#bbb";
        ctx.beginPath(); ctx.arc(px+33, py-12, 1, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(px+46, py-12, 1, 0, Math.PI*2); ctx.fill();

        // Koszula pod kamizelką (kołnierzyk)
        ctx.fillStyle = "#1565C0";
        ctx.beginPath(); ctx.moveTo(px+37, py-22); ctx.lineTo(px+43, py-22); ctx.lineTo(px+41, py-18); ctx.lineTo(px+39, py-18); ctx.closePath(); ctx.fill();

        // Lewe ramię
        ctx.strokeStyle = "#558B2F"; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(px+30, py-20); ctx.lineTo(px+20, py-11); ctx.stroke();
        // Lewa ręka - skóra
        ctx.fillStyle = "#FFCCBC";
        ctx.beginPath(); ctx.arc(px+19, py-10, 4, 0, Math.PI*2); ctx.fill();
        // Palce lewej ręki
        ctx.strokeStyle = "#FFAB91"; ctx.lineWidth = 2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(px+17, py-12); ctx.lineTo(px+15, py-15); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px+19, py-13); ctx.lineTo(px+18, py-16); ctx.stroke();

        // Prawe ramię (trzyma wędkę)
        ctx.strokeStyle = "#558B2F"; ctx.lineWidth = 6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(px+50, py-20); ctx.lineTo(px+58, py-30); ctx.stroke();
        // Prawa ręka
        ctx.fillStyle = "#FFCCBC";
        ctx.beginPath(); ctx.arc(px+59, py-31, 4, 0, Math.PI*2); ctx.fill();

        // === GŁOWA ===
        // Szyja
        ctx.fillStyle = "#FFCCBC";
        ctx.fillRect(px+37, py-28, 6, 7);

        // Twarz
        const faceGrad = ctx.createRadialGradient(px+40, py-35, 2, px+40, py-35, 11);
        faceGrad.addColorStop(0, "#FFCCBC");
        faceGrad.addColorStop(1, "#FFAB91");
        ctx.fillStyle = faceGrad;
        ctx.beginPath(); ctx.arc(px+40, py-35, 11, 0, Math.PI*2); ctx.fill();

        // Uszy
        ctx.fillStyle = "#FFAB91";
        ctx.beginPath(); ctx.ellipse(px+29, py-35, 3, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px+51, py-35, 3, 4, 0, 0, Math.PI*2); ctx.fill();

        // Oczy
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.ellipse(px+36, py-37, 3, 3.5, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(px+44, py-37, 3, 3.5, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#5D4037";
        ctx.beginPath(); ctx.arc(px+36, py-37, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(px+44, py-37, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath(); ctx.arc(px+36.5, py-37.5, 1, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(px+44.5, py-37.5, 1, 0, Math.PI*2); ctx.fill();
        // Połysk w oczach
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(px+37, py-38, 0.6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(px+45, py-38, 0.6, 0, Math.PI*2); ctx.fill();

        // Brwi
        ctx.strokeStyle = "#5D4037"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(px+33, py-41); ctx.lineTo(px+39, py-40); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px+41, py-40); ctx.lineTo(px+47, py-41); ctx.stroke();

        // Nos
        ctx.fillStyle = "#FF8A65";
        ctx.beginPath(); ctx.ellipse(px+40, py-34, 2, 1.5, 0, 0, Math.PI*2); ctx.fill();

        // Wąsy
        ctx.strokeStyle = "#4E342E"; ctx.lineWidth = 1.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(px+34, py-31); ctx.quadraticCurveTo(px+38, py-30, px+40, py-31); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px+46, py-31); ctx.quadraticCurveTo(px+42, py-30, px+40, py-31); ctx.stroke();

        // Uśmiech
        ctx.strokeStyle = "#BF360C"; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(px+40, py-30, 5, 0.2, Math.PI-0.2); ctx.stroke();

        // === KAPELUSZ ===
        // Rondo
        const brimGrad = ctx.createLinearGradient(px+24, py-47, px+56, py-43);
        brimGrad.addColorStop(0, "#F9A825");
        brimGrad.addColorStop(1, "#F57F17");
        ctx.fillStyle = brimGrad;
        ctx.beginPath();
        ctx.ellipse(px+40, py-46, 18, 4, 0, 0, Math.PI*2);
        ctx.fill();

        // Główka kapelusza
        const topGrad = ctx.createLinearGradient(px+30, py-62, px+50, py-46);
        topGrad.addColorStop(0, "#F57F17");
        topGrad.addColorStop(1, "#E65100");
        ctx.fillStyle = topGrad;
        ctx.beginPath();
        ctx.moveTo(px+28, py-46);
        ctx.lineTo(px+52, py-46);
        ctx.lineTo(px+50, py-63);
        ctx.lineTo(px+30, py-63);
        ctx.closePath();
        ctx.fill();

        // Wstążka kapelusza
        ctx.fillStyle = "#B71C1C";
        ctx.fillRect(px+28, py-49, 24, 4);
        // Klamra wstążki
        ctx.strokeStyle = "#FFD700"; ctx.lineWidth = 1;
        ctx.strokeRect(px+38, py-50, 5, 6);

        // Zagięcie ronda z przodu
        ctx.strokeStyle = "#E65100"; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px+40, py-46, 18, Math.PI*0.05, Math.PI*0.95);
        ctx.stroke();

        // === WĘDKA ===
        // Trzonek wędki - gradient (ciemniejszy przy ręce, jaśniejszy przy końcu)
        const rodGrad = ctx.createLinearGradient(px+45, py-8, rodTipX, rodTipY);
        rodGrad.addColorStop(0, "#5D4037");
        rodGrad.addColorStop(0.5, "#8D6E63");
        rodGrad.addColorStop(1, "#A5D6A7");
        ctx.strokeStyle = "transparent";
        ctx.lineWidth = 4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(px+45, py-8); ctx.lineTo(rodTipX, rodTipY);
        ctx.strokeStyle = rodGrad; ctx.stroke();

        // Przelotki wędki
        const guides = [[px+50, py-14], [px+54, py-21], [px+57, py-27]];
        guides.forEach(([gx, gy]) => {
            ctx.strokeStyle = "#aaa"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(gx, gy, 2.5, 0, Math.PI*2); ctx.stroke();
        });

        ctx.restore();

        // Fishing rod
        // (rysowana wyżej przez stroke z gradientem)
    }

    function gameLoop() { update(); draw(); requestAnimationFrame(gameLoop); }
    gameLoop();
