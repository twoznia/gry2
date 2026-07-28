(function () {
    // ── Canvas sizing ──────────────────────────────────────────────────
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // ── Permission / start ─────────────────────────────────────────────
    const permScreen = document.getElementById("permission-screen");
    const startBtn   = document.getElementById("start-btn");
    let gyroEnabled  = false;

    startBtn.addEventListener("click", async () => {
        // iOS 13+ requires permission for DeviceOrientationEvent
        if (typeof DeviceOrientationEvent !== "undefined" &&
            typeof DeviceOrientationEvent.requestPermission === "function") {
            try {
                const perm = await DeviceOrientationEvent.requestPermission();
                gyroEnabled = (perm === "granted");
            } catch (e) {
                gyroEnabled = false;
            }
        } else {
            // Android / non-iOS — assume available
            gyroEnabled = true;
        }
        permScreen.style.display = "none";
        initGame();
    });

    // ── Gyroscope ──────────────────────────────────────────────────────
    let tiltGamma = 0; // -90..90 left/right tilt

    window.addEventListener("deviceorientation", (e) => {
        if (!gyroEnabled) return;
        // gamma: left-right tilt. Clamp to ±30 for comfortable play
        tiltGamma = Math.max(-30, Math.min(30, e.gamma || 0));
    });

    // tilt-bar visual
    const tiltBar = document.getElementById("tilt-bar");
    function updateTiltBar() {
        const pct = (tiltGamma / 30) * 40; // ±40% from center
        tiltBar.style.left = `calc(50% + ${pct}%)`;
    }

    // ── Game state ─────────────────────────────────────────────────────
    let totalScore = 0;
    let levelScore = 0;
    let level = 1;
    let hiScore = parseInt(localStorage.getItem('rybak_hi')) || 0;
    let currentTarget = 10;
    let nextIncrement = 15;
    let cumulativeTarget = 10; // Łączny cel ryb (sumuje cele wszystkich poziomów)
    let timeLeft = 60;
    let gameActive = false;
    let spawnTimer = 0;
    let birdTimer = 300;
    let isTouching = false;

    const scoreEl   = document.getElementById("score");
    const targetEl  = document.getElementById("target");
    const timerEl   = document.getElementById("timer");
    const lvlEl     = document.getElementById("lvl-display");
    const warnMsg   = document.getElementById("warning-msg");
    const levelMsg  = document.getElementById("level-msg");
    const hiScoreHud = document.getElementById("hi-score-hud");

    function updateHiScoreDisplay() {
        hiScoreHud.innerText = "Rekord: " + hiScore;
    }
    updateHiScoreDisplay();

    function resetHiScore() {
        if (confirm("Wyzerować rekord?")) {
            hiScore = 0;
            localStorage.setItem('rybak_hi', 0);
            updateHiScoreDisplay();
        }
    }

    let player, fishes, bird, birdDropping, waterLevel, timerInterval;

    function initGame() {
        waterLevel = canvas.height * 0.38;

        player = {
            x: canvas.width / 2 - 40,
            y: waterLevel - 24,
            width: 80,
            height: 24,
            speed: 6,
            hookX: canvas.width / 2,
            hookY: waterLevel,
            hookSpeed: 5
        };

        fishes = [];
        bird = null;
        birdDropping = null;
        gameActive = true;

        timerInterval = setInterval(() => {
            if (!gameActive) return;
            timeLeft--;
            timerEl.innerText = timeLeft;
            if (timeLeft <= 0) endGame("time");
        }, 1000);

        requestAnimationFrame(gameLoop);
    }

    // ── Touch controls ─────────────────────────────────────────────────
    window.addEventListener("touchstart", () => { isTouching = true; }, { passive: true });
    window.addEventListener("touchend",   () => { isTouching = false; }, { passive: true });
    window.addEventListener("touchcancel",() => { isTouching = false; }, { passive: true });

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

    // ── Level up ───────────────────────────────────────────────────────
    function checkLevelUp() {
        if (levelScore >= currentTarget) {
            level++;
            levelScore = 0;
            currentTarget = nextIncrement;
            nextIncrement += 5;
            cumulativeTarget += currentTarget;
            timeLeft += levelTimeBonus(); // zapas czasu skrojony pod cel i tempo pojawiania ryb
            timerEl.innerText = timeLeft;
            scoreEl.innerText = totalScore;
            targetEl.innerText = cumulativeTarget;
            lvlEl.innerText = "Poziom " + level;
            levelMsg.innerText = "POZIOM " + level + "!";
            levelMsg.style.display = "block";
            setTimeout(() => { levelMsg.style.display = "none"; }, 2000);
        }
    }

    // ── Spawn fish ─────────────────────────────────────────────────────
    function spawnFish() {
        if (!gameActive) return;
        spawnTimer--;
        if (spawnTimer <= 0) {
            const d = Math.random() > 0.5 ? 1 : -1;
            fishes.push({
                x: d === 1 ? -60 : canvas.width + 60,
                y: waterLevel + 60 + Math.random() * (canvas.height - waterLevel - 110),
                speed: (1.2 + Math.random() * 2) * d * levelSpeedMul(),
                color: `hsl(${Math.random() * 360}, 80%, 55%)`,
                size: 16 + Math.random() * 12,
                active: true,
                phase: Math.random() * Math.PI * 2,
                wiggleSpeed: 0.18 + Math.random() * 0.12,
                bobAmp: 1.5 + Math.random() * 2
            });
            spawnTimer = avgSpawnInterval() * (0.6 + Math.random() * 0.8);
        }
    }

    // ── Bird ───────────────────────────────────────────────────────────
    function handleBird() {
        if (!gameActive) return;
        birdTimer--;
        if (birdTimer <= 0 && !bird) {
            const d = Math.random() > 0.5 ? 1 : -1;
            bird = {
                x: d===1 ? -60 : canvas.width+60,
                y: 28 + Math.random() * 40,
                speed: (3.5 + Math.random() * 2) * d,
                hasDropped: false,
                isAiming: false,
                aimCounter: 0,
                wingPhase: 0
            };
        }
        if (bird) {
            bird.x += bird.speed;
            bird.wingPhase += 0.18;
            if (!bird.hasDropped && !bird.isAiming && Math.abs(bird.x - (player.x + 40)) < 140) bird.isAiming = true;
            if (bird.isAiming && !bird.hasDropped) {
                bird.aimCounter++;
                if (bird.aimCounter > 30) {
                    birdDropping = { x: bird.x, y: bird.y + 10, speed: 5.5, size: 8 };
                    bird.hasDropped = true;
                    warnMsg.style.display = "block";
                    setTimeout(() => warnMsg.style.display = "none", 1000);
                }
            }
            if (bird.x < -160 || bird.x > canvas.width + 100) { bird = null; birdTimer = 200 + Math.random()*200; }
        }
        if (birdDropping) {
            birdDropping.y += birdDropping.speed;
            if (birdDropping.y > player.y && birdDropping.y < player.y + 28 &&
                birdDropping.x > player.x && birdDropping.x < player.x + 80) {
                endGame("bird");
            }
            if (birdDropping.y > waterLevel) {
                birdDropping.speed = 0;
                setTimeout(() => { birdDropping = null; }, 100);
            }
        }
    }

    // ── End game ───────────────────────────────────────────────────────
    function endGame(reason) {
        gameActive = false;
        clearInterval(timerInterval);
        const isNewRecord = totalScore > hiScore;
        if (isNewRecord) {
            hiScore = totalScore;
            localStorage.setItem('rybak_hi', hiScore);
            updateHiScoreDisplay();
        }
        if (reason === "time") {
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
            warnMsg.style.display = "none";
        }
    }

    // ── Update ─────────────────────────────────────────────────────────
    function update() {
        if (!gameActive) return;

        const W = canvas.width;
        const maxX = W - player.width;

        // Gyroscope movement — tiltGamma ±30 → speed ±player.speed
        if (gyroEnabled) {
            const tiltSpeed = (tiltGamma / 30) * player.speed * 1.6;
            player.x = Math.max(0, Math.min(maxX, player.x + tiltSpeed));
        }

        // Hook: down on touch, up otherwise
        if (isTouching && player.hookY < canvas.height - 40) {
            player.hookY += player.hookSpeed;
        } else if (!isTouching && player.hookY > waterLevel) {
            player.hookY -= player.hookSpeed;
        }

        // Hook follows boat horizontally
        player.hookX += (player.x + 40 - player.hookX) * 0.15;

        // Fish collision
        for (let i = fishes.length - 1; i >= 0; i--) {
            const f = fishes[i];
            f.x += f.speed;
            f.phase += f.wiggleSpeed;        // animacja pływania
            if (f.active) {
                const dx = player.hookX - f.x;
                const dy = player.hookY - f.y;
                if (Math.sqrt(dx*dx + dy*dy) < 28) {
                    f.active = false;
                    totalScore++;
                    levelScore++;
                    scoreEl.innerText = totalScore;
                    checkLevelUp();
                }
            }
            if (f.x < -160 || f.x > W + 160) fishes.splice(i, 1);
        }

        spawnFish();
        handleBird();
        updateTiltBar();
    }

    // ── Draw ───────────────────────────────────────────────────────────
    function draw() {
        const W = canvas.width;
        const H = canvas.height;

        // Sky
        const sky = ctx.createLinearGradient(0, 0, 0, waterLevel);
        sky.addColorStop(0, "#1e3a5f");
        sky.addColorStop(1, "#87CEEB");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, waterLevel);

        // Water
        const water = ctx.createLinearGradient(0, waterLevel, 0, H);
        water.addColorStop(0, "#1E90FF");
        water.addColorStop(1, "#000050");
        ctx.fillStyle = water;
        ctx.fillRect(0, waterLevel, W, H - waterLevel);

        // Water shimmer
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        for (let wx = 0; wx < W; wx += 28) {
            ctx.beginPath();
            ctx.moveTo(wx, waterLevel + 4);
            ctx.lineTo(wx + 14, waterLevel + 2);
            ctx.stroke();
        }

        // Fish
        fishes.forEach(f => {
            if (!f.active) return;
            const d = f.speed > 0 ? 1 : -1;
            const wag = Math.sin(f.phase);
            const bob = Math.sin(f.phase * 0.6) * f.bobAmp;
            ctx.save();
            ctx.translate(f.x, f.y + bob);
            ctx.scale(1, 1 + Math.cos(f.phase) * 0.06);
            ctx.fillStyle = f.color;
            // Tail — kołysze się
            const tailWag = wag * f.size * 0.55;
            ctx.beginPath();
            ctx.moveTo(-f.size * d, 0);
            ctx.lineTo(-f.size * 1.6 * d, -f.size * 0.5 + tailWag);
            ctx.lineTo(-f.size * 1.6 * d, f.size * 0.5 + tailWag);
            ctx.closePath();
            ctx.fill();
            // Dorsal fin — faluje
            ctx.beginPath();
            ctx.moveTo(-f.size * 0.2 * d, -f.size * 0.45);
            ctx.quadraticCurveTo(-f.size * 0.1 * d, -f.size * 0.75 - wag * 2, f.size * 0.25 * d, -f.size * 0.4);
            ctx.closePath();
            ctx.fill();
            // Body
            ctx.beginPath();
            ctx.ellipse(0, 0, f.size, f.size / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            // Pectoral fin — macha
            ctx.beginPath();
            ctx.ellipse(f.size * 0.15 * d, f.size * 0.28, f.size * 0.28, f.size * 0.14, wag * 0.5, 0, Math.PI * 2);
            ctx.fill();
            // Eye white
            ctx.fillStyle = "white";
            ctx.beginPath();
            ctx.arc(f.size * 0.5 * d, -f.size * 0.15, 4, 0, Math.PI * 2);
            ctx.fill();
            // Eye pupil
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(f.size * 0.5 * d + d, -f.size * 0.15, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Bird
        if (bird) {
            const flash = bird.isAiming && !bird.hasDropped && bird.aimCounter % 10 < 5;
            const birdColor = flash ? "red" : "white";
            const bd = bird.speed > 0 ? 1 : -1;
            const bx = bird.x, by = bird.y;
            const wingFlap = Math.sin(bird.wingPhase) * 12;
            ctx.fillStyle = birdColor;
            // Wing (curves up and down with flapping motion)
            ctx.beginPath();
            ctx.moveTo(bx, by - 1);
            ctx.quadraticCurveTo(bx - 13*bd, by - wingFlap, bx - 24*bd, by + 2 - wingFlap * 0.5);
            ctx.quadraticCurveTo(bx - 11*bd, by + 6, bx, by + 2);
            ctx.fill();
            // Body
            ctx.beginPath();
            ctx.ellipse(bx + 1*bd, by + 1, 9, 5, 0, 0, Math.PI * 2);
            ctx.fill();
            // Head
            ctx.beginPath();
            ctx.arc(bx + 9*bd, by - 2, 5, 0, Math.PI * 2);
            ctx.fill();
            // Beak
            ctx.fillStyle = flash ? "red" : "#FFD54F";
            ctx.beginPath();
            ctx.moveTo(bx + 13*bd, by - 3);
            ctx.lineTo(bx + 19*bd, by - 1);
            ctx.lineTo(bx + 13*bd, by + 1);
            ctx.fill();
        }

        // Bird dropping
        if (birdDropping) {
            ctx.fillStyle = "#6D4C41";
            ctx.beginPath();
            ctx.arc(birdDropping.x, birdDropping.y, birdDropping.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Fishing line (behind fisherman)
        const rodTipX = player.x + 57, rodTipY = player.y - 26;
        ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(rodTipX, rodTipY); ctx.lineTo(player.hookX, player.hookY); ctx.stroke();

        // Hook
        ctx.strokeStyle = "#ccc"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(player.hookX, player.hookY, 6, 0.6, 2.8); ctx.stroke();

        // Boat hull
        ctx.fillStyle = "#5D4037";
        ctx.beginPath(); ctx.moveTo(player.x+2, player.y+2); ctx.lineTo(player.x+78, player.y+2); ctx.lineTo(player.x+68, player.y+24); ctx.lineTo(player.x+12, player.y+24); ctx.closePath(); ctx.fill();
        // Boat interior
        ctx.fillStyle = "#8D6E63";
        ctx.beginPath(); ctx.moveTo(player.x+8, player.y+5); ctx.lineTo(player.x+72, player.y+5); ctx.lineTo(player.x+63, player.y+21); ctx.lineTo(player.x+17, player.y+21); ctx.closePath(); ctx.fill();
        // Boat rim
        ctx.fillStyle = "#3E2723"; ctx.fillRect(player.x, player.y, 80, 4);
        // Boat plank
        ctx.strokeStyle = "#4E342E"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(player.x+40, player.y+6); ctx.lineTo(player.x+40, player.y+21); ctx.stroke();
        // Fisherman pants
        ctx.fillStyle = "#37474F"; ctx.fillRect(player.x+34, player.y-5, 12, 7);
        // Fisherman torso / shirt
        ctx.fillStyle = "#1565C0";
        ctx.beginPath(); ctx.moveTo(player.x+30, player.y-18); ctx.lineTo(player.x+50, player.y-18); ctx.lineTo(player.x+48, player.y-5); ctx.lineTo(player.x+32, player.y-5); ctx.closePath(); ctx.fill();
        // Left arm
        ctx.strokeStyle = "#1565C0"; ctx.lineWidth = 4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(player.x+32, player.y-15); ctx.lineTo(player.x+25, player.y-8); ctx.stroke();
        // Right arm (holding rod)
        ctx.beginPath(); ctx.moveTo(player.x+48, player.y-15); ctx.lineTo(player.x+55, player.y-23); ctx.stroke();
        // Hands
        ctx.fillStyle = "#FFCCBC";
        ctx.beginPath(); ctx.arc(player.x+24, player.y-8, 3, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(player.x+56, player.y-24, 3, 0, Math.PI*2); ctx.fill();
        // Head
        ctx.beginPath(); ctx.arc(player.x+40, player.y-25, 9, 0, Math.PI*2); ctx.fill();
        // Eyes
        ctx.fillStyle = "#333";
        ctx.beginPath(); ctx.arc(player.x+37, player.y-26, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(player.x+43, player.y-26, 1.5, 0, Math.PI*2); ctx.fill();
        // Hat brim
        ctx.fillStyle = "#F9A825"; ctx.fillRect(player.x+27, player.y-33, 26, 4);
        // Hat top
        ctx.fillStyle = "#F57F17"; ctx.fillRect(player.x+30, player.y-45, 20, 14);
        // Hat band
        ctx.fillStyle = "#E65100"; ctx.fillRect(player.x+30, player.y-34, 20, 3);
        // Fishing rod
        ctx.strokeStyle = "#6D4C41"; ctx.lineWidth = 3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(player.x+43, player.y-4); ctx.lineTo(rodTipX, rodTipY); ctx.stroke();
    }

    // ── Game loop ──────────────────────────────────────────────────────
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
})();
