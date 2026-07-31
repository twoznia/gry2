const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const _isMobCheck = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.matchMedia('(max-width: 820px)').matches;

function resizeCanvas() {
    // Pełny ekran na każdym urządzeniu — proporcje wynikają z okna
    // (PC: poziome/szerokie, mobile: pionowe/wąskie)
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => { resizeCanvas(); initRiver(); });
const scoreEl = document.getElementById('score');
const hiScoreEl = document.getElementById('hiScore');
const livesEl = document.getElementById('lives');
const fuelFill = document.getElementById('fuelFill');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('comboDisplay');
// Mobile HUD mirrors
const hiScoreMobEl  = document.getElementById('hiScoreMob');
const comboMobEl    = document.getElementById('comboDisplayMob');
const levelMobEl    = document.getElementById('levelMob');
function syncMobHud() {
    if (!isMobile) return;
    hiScoreMobEl.innerText  = hiScoreEl.innerText;
    comboMobEl.innerText    = 'x' + combo;
    comboMobEl.style.color  = combo > 2 ? '#f00' : '#fa0';
    levelMobEl.innerText    = levelEl.innerText;
}

const themes = [
    { name: "GREEN VALLEY", land: "#2d2", water: "#0044aa" },
    { name: "ARID DESERT", land: "#d2b48c", water: "#0077aa" },
    { name: "FROZEN TUNDRA", land: "#eef", water: "#001133" },
    { name: "NIGHT OPS", land: "#0a1a0a", water: "#00000a" }
];
let currentTheme = 0;

let score = 0;
let lives = 3;
let highScore = localStorage.getItem('riverRaidHighScore') || 0;
hiScoreEl.innerText = highScore.toString().padStart(5, '0');
let fuel = 100;
let state = 'START'; 
let frame = 0;
let isNewRecord = false; 

let level = 1;
let initialBaseSpeed = 3.5;
let baseSpeed = initialBaseSpeed;
let currentSpeed = baseSpeed;
let combo = 1;
let comboTimer = 0;
let invincibilityTimer = 0; 

// Zmienne dla power-upów
let playerShielded = false;
let spreadShotTimer = 0;

let spawnDistance = 0;
let bridgeTimer = 0; 
let islandTimer = 0;
let activeIsland = null;

let currentRiverCenter = 400;
let targetRiverCenter = 400;
let currentRiverWidth = 500;
let targetRiverWidth = 500;

const player = { x: 0, y: 0, w: 26, h: 32 };
let bullets = [];
let enemyBullets = []; 
let entities = []; 
let riverPoints = [];
let particles = [];
let floatingTexts = [];

function initRiver() {
    riverPoints = []; activeIsland = null; islandTimer = 0;
    currentRiverCenter = canvas.width / 2; targetRiverCenter = canvas.width / 2;
    currentRiverWidth = Math.round(canvas.width * 0.625); targetRiverWidth = Math.round(canvas.width * 0.625);
    const rows = Math.ceil(canvas.height / 2);
    const sideMargin = Math.round(canvas.width * 0.1875);
    for (let i = 0; i < rows; i++) riverPoints.push({ left: sideMargin, right: sideMargin, islandCenter: canvas.width / 2, islandWidth: 0 });
}
initRiver();

const keys = {};
window.addEventListener('keydown', (e) => {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) e.preventDefault(); 
    keys[e.code] = true;
});
window.addEventListener('keyup', (e) => keys[e.code] = false);

// --- Mobile / Gyroscope ---
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.matchMedia('(max-width: 820px)').matches;
player.x = canvas.width / 2 - player.w / 2;
player.y = isMobile ? Math.round(canvas.height * 0.72) : Math.round(canvas.height * 0.867);
let gyroGamma = 0;   // left/right tilt (-90 to +90)
let gyroBeta  = 0;   // forward/back tilt (-180 to +180)
let gyroActive = false;
let gyroPermissionRequested = false;
const gyroBarEl = document.getElementById('gyroBar');
// Steering constants (phone held vertically: beta ≈ 70-90°)
const GYRO_DEADZONE = 7;    // degrees of tilt before steering begins
const GYRO_MAX_TILT = 38;   // degrees at which maximum speed is reached
const GYRO_BETA_SLOW_MAX   = 25;  // 0–25° tilt → slow
const GYRO_BETA_NORMAL_MAX = 65;  // 25–65° tilt → normal; >65° → fast
const GYRO_BETA_MAX        = 90;  // clamp tilt to 0–90°

function handleOrientation(e) {
    if (e.gamma !== null && e.beta !== null) {
        gyroGamma = e.gamma;
        gyroBeta  = e.beta;
        gyroActive = true;
        // Update tilt indicator: gyroGamma range -40..+40 → 0%..100% position
        const pct = Math.min(Math.max((gyroGamma + 40) / 80, 0), 1) * 100;
        gyroBarEl.style.left = pct + '%';
        gyroBarEl.style.background = Math.abs(gyroGamma) > 7 ? '#fa0' : '#0f0';
    }
}

function setupGyro() {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ requires explicit permission
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                } else {
                    showGyroFallbackHint();
                }
            })
            .catch(() => { showGyroFallbackHint(); });
    } else if (typeof DeviceOrientationEvent !== 'undefined') {
        window.addEventListener('deviceorientation', handleOrientation);
    }
}

let touchSteering = false;

function enableTouchSteering() {
    touchSteering = true;
    gyroActive = true; // reuse gyro path — gyroGamma will be set from touch X
}

function showGyroFallbackHint() {
    if (isMobile) {
        enableTouchSteering();
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 + 80, text: "Przeciągnij palcem", life: 180, maxLife: 180, color: "#fa0", size: "16px" });
    } else {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 + 80, text: "Użyj klawiatury", life: 180, maxLife: 180, color: "#fa0", size: "16px" });
    }
}

const iosPermissionActive = false;

// Tap-to-start on mobile
window.addEventListener('touchstart', (e) => {
    if (state === 'START' || state === 'GAMEOVER') {
        keys['Space'] = true;
        setTimeout(() => { keys['Space'] = false; }, 100);
    }
}, { passive: true });

// D-pad buttons (mobile only)
if (isMobile) {
    const btnLeft  = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    ['touchstart', 'touchend', 'touchcancel'].forEach(type => {
        btnLeft.addEventListener(type, e => {
            e.preventDefault();
            keys['ArrowLeft']  = (type === 'touchstart');
            keys['ArrowRight'] = false;
        }, { passive: false });
        btnRight.addEventListener(type, e => {
            e.preventDefault();
            keys['ArrowRight'] = (type === 'touchstart');
            keys['ArrowLeft']  = false;
        }, { passive: false });
    });
}

function drawPlayer() {
    let hullColor = "#fff"; 
    let tailColor = "#f00"; 
    if (fuel <= 20) { hullColor = "#f00"; tailColor = "#fff"; } 
    else if (fuel <= 50) { hullColor = "#ff0"; }

    if (invincibilityTimer > 0) {
        ctx.globalAlpha = Math.floor(frame / 5) % 2 === 0 ? 0.3 : 0.8;
    }

    if (playerShielded) {
        ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.w/2, player.y + player.h/2 + 2, 24, 0, Math.PI*2);
        ctx.stroke();
        ctx.fillStyle = "rgba(0, 255, 255, 0.1)";
        ctx.fill();
    }

    ctx.fillStyle = hullColor; ctx.fillRect(player.x + 10, player.y, 6, 32); ctx.fillRect(player.x, player.y + 12, 26, 6); 
    ctx.fillStyle = tailColor; ctx.fillRect(player.x + 8, player.y + 26, 10, 4); 
    
    if (keys['ArrowUp'] && state === 'PLAYING' && frame % 4 < 2) {
        ctx.fillStyle = "#fa0"; ctx.fillRect(player.x + 10, player.y + 30, 6, 8);
    }

    if (spreadShotTimer > 0 && frame % 4 < 2) {
        ctx.fillStyle = "#0ff"; ctx.fillRect(player.x + 4, player.y + 18, 4, 6); ctx.fillRect(player.x + 18, player.y + 18, 4, 6);
    }

    ctx.globalAlpha = 1.0;
}

function drawEntity(en) {
    if (en.type === 'ship') {
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; ctx.beginPath(); ctx.arc(en.x + 20, en.y + 15, 22, 0, Math.PI); ctx.fill();
        ctx.fillStyle = "#445"; ctx.beginPath(); ctx.moveTo(en.x, en.y + 15); ctx.lineTo(en.x + 5, en.y + 5); ctx.lineTo(en.x + 35, en.y + 5); ctx.lineTo(en.x + 40, en.y + 15); ctx.lineTo(en.x + 35, en.y + 25); ctx.lineTo(en.x + 5, en.y + 25); ctx.fill();
        ctx.fillStyle = "#b33"; ctx.fillRect(en.x + 8, en.y + 9, 10, 10); ctx.fillStyle = "#33b"; ctx.fillRect(en.x + 19, en.y + 9, 10, 10); ctx.fillStyle = "#ddd"; ctx.fillRect(en.x + 30, en.y + 11, 6, 6); ctx.fillStyle = "#0ff"; ctx.fillRect(en.x + 31, en.y + 13, 2, 2);
    } else if (en.type === 'heli') {
        ctx.fillStyle = "#fff"; ctx.fillRect(en.x + 12, en.y + 10, 16, 12); ctx.fillStyle = "#999"; ctx.fillRect(en.x + 18, en.y + 22, 4, 8); ctx.fillStyle = "#ccc";
        if (Math.floor(frame / 3) % 2 === 0) ctx.fillRect(en.x, en.y + 6, 40, 2); else ctx.fillRect(en.x + 18, en.y + 2, 4, 10);
    } else if (en.type === 'jet') {
        ctx.fillStyle = "#888"; ctx.beginPath(); ctx.moveTo(en.x+20, en.y+40); ctx.lineTo(en.x+40, en.y+10); ctx.lineTo(en.x, en.y+10); ctx.fill(); ctx.fillStyle = "#aaa"; ctx.fillRect(en.x + 16, en.y, 8, 40);
        if(frame%2==0) { ctx.fillStyle="#fa0"; ctx.fillRect(en.x+17, en.y-8, 6, 8); }
    } else if (en.type === 'tank') {
        ctx.fillStyle = "#111"; ctx.fillRect(en.x, en.y + 2, 6, 20); ctx.fillRect(en.x + 18, en.y + 2, 6, 20); ctx.fillStyle = "#555"; 
        for(let j=0; j<5; j++) { ctx.fillRect(en.x, en.y + 3 + j*4, 6, 2); ctx.fillRect(en.x + 18, en.y + 3 + j*4, 6, 2); }
        ctx.fillStyle = "#464"; ctx.fillRect(en.x + 4, en.y + 4, 16, 16); ctx.fillStyle = "#242"; ctx.fillRect(en.x + 6, en.y + 6, 12, 12);
        ctx.fillStyle = "#353"; ctx.beginPath(); ctx.arc(en.x + 12, en.y + 12, 5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = "#777";
        if (en.onLeft) { ctx.fillRect(en.x + 14, en.y + 10, 14, 4); ctx.fillStyle = "#111"; ctx.fillRect(en.x + 25, en.y + 9, 4, 6); } 
        else { ctx.fillRect(en.x - 4, en.y + 10, 14, 4); ctx.fillStyle = "#111"; ctx.fillRect(en.x - 5, en.y + 9, 4, 6); }
    } else if (en.type === 'fuel') {
        ctx.fillStyle = "#fff"; ctx.fillRect(en.x, en.y, 30, 40); ctx.fillStyle = "#f00"; ctx.font = "bold 10px Arial"; ctx.fillText("FUEL", en.x + 1, en.y + 25);
    } else if (en.type === 'bridge') {
        ctx.fillStyle = "#555"; ctx.fillRect(0, en.y, canvas.width, 24); ctx.fillStyle = "#333"; ctx.fillRect(0, en.y + 6, canvas.width, 12);
        ctx.fillStyle = "#fff"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center"; ctx.fillText("FLY OVER TO REFUEL", en.bridgeCenter || canvas.width/2, en.y + 17); ctx.textAlign = "left";
    } else if (en.type === 'mine') {
        ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(en.x + 12, en.y + 12, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#222"; ctx.fillRect(en.x + 10, en.y - 2, 4, 28); ctx.fillRect(en.x - 2, en.y + 10, 28, 4); 
        if (frame % 30 < 15) { ctx.fillStyle = "#f00"; ctx.fillRect(en.x + 10, en.y + 10, 4, 4); }
    } else if (en.type === 'power_spread') {
        ctx.fillStyle = "#0af"; ctx.fillRect(en.x, en.y, 24, 24);
        ctx.fillStyle = "#fff"; ctx.font = "bold 16px Arial"; ctx.fillText("S", en.x + 6, en.y + 18);
    } else if (en.type === 'power_shield') {
        ctx.fillStyle = "#a0f"; ctx.fillRect(en.x, en.y, 24, 24);
        ctx.fillStyle = "#fff"; ctx.font = "bold 16px Arial"; ctx.fillText("O", en.x + 5, en.y + 18);
    }
}

function createExplosion(x, y, color) {
    for(let i=0; i<25; i++) {
        particles.push({ x: x + 15, y: y + 15, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 20 + Math.random() * 15, color: color || "#fa0" });
    }
}

function resetGame() {
    score = 0; lives = 3; level = 1; baseSpeed = initialBaseSpeed; combo = 1; comboTimer = 0; currentTheme = 0;
    livesEl.innerText = lives; levelEl.innerText = level; comboEl.innerText = "COMBO: x1";
    isNewRecord = false; spawnDistance = 0; bridgeTimer = 0; invincibilityTimer = 0;
    playerShielded = false; spreadShotTimer = 0; 
    entities = []; particles = []; floatingTexts = [];
    initRiver(); respawnPlayer(); state = 'PLAYING';
    floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 + 40, text: themes[currentTheme].name, life: 100, maxLife: 100, color: "#fff", size: "24px" });
}

function playerHomeY() {
    return isMobile ? Math.round(canvas.height * 0.72) : Math.round(canvas.height * 0.867);
}

function respawnPlayer() {
    fuel = 100; combo = 1; playerShielded = false; spreadShotTimer = 0;
    entities = entities.filter(e => e.y < canvas.height * 0.42 || e.type === 'bridge');
    if (bridgeTimer > 2100) bridgeTimer = 2100;
    bullets = []; enemyBullets = []; player.x = canvas.width / 2 - player.w / 2; player.y = playerHomeY(); invincibilityTimer = 120;
}

function checkHighScore() {
    // Zapis KAŻDEGO wyniku do chmury (top-20 na gracza pilnuje trigger) — jak w soltaire.
    if (score > 0 && window.GryScores && GryScores.submit) GryScores.submit('riverraid', score, {});
    if (score > highScore) { highScore = score; localStorage.setItem('riverRaidHighScore', highScore); hiScoreEl.innerText = highScore.toString().padStart(5, '0'); isNewRecord = true; }
}

function takeDamage(color) {
    if (state === 'RESPAWNING' || state === 'GAMEOVER' || invincibilityTimer > 0) return;
    
    if (playerShielded) {
        playerShielded = false;
        invincibilityTimer = 60; 
        createExplosion(player.x, player.y, "#0ff"); 
        floatingTexts.push({ x: canvas.width / 2, y: player.y - 20, text: "SHIELD LOST!", life: 60, maxLife: 60, color: "#0ff", size: "18px" });
        return;
    }

    createExplosion(player.x, player.y, color || "#ff0");
    lives--; livesEl.innerText = lives; state = 'RESPAWNING'; combo = 1; comboEl.innerText = "COMBO: x1"; comboEl.style.color = "#aaa";
    setTimeout(() => {
        if (lives <= 0) { checkHighScore(); state = 'GAMEOVER'; } else { respawnPlayer(); state = 'PLAYING'; }
    }, 1500); 
}

function die(color) { takeDamage(color); }

function checkGraze(obj, isBullet) {
    if (obj.grazed || invincibilityTimer > 0) return;

    let margin = 14; 
    let pBox = { left: player.x, right: player.x + player.w, top: player.y, bottom: player.y + player.h };
    let grazeBox = { left: pBox.left - margin, right: pBox.right + margin, top: pBox.top - margin, bottom: pBox.bottom + margin };

    if (obj.x < grazeBox.right && obj.x + obj.w > grazeBox.left && obj.y < grazeBox.bottom && obj.y + obj.h > grazeBox.top) {
        let isColliding = (obj.x < pBox.right && obj.x + obj.w > pBox.left && obj.y < pBox.bottom && obj.y + obj.h > pBox.top);
        
        if (!isColliding) {
            obj.grazed = true;
            score += 50;
            floatingTexts.push({ x: obj.x, y: obj.y - 10, text: "GRAZE +50", life: 30, maxLife: 30, color: "#fff", size: "12px" });
        }
    }
}

function projectileHitsBridge(projectile, prevX, prevY, bridge) {
    const previousBridgeY = bridge.y - currentSpeed;
    const sweptLeft = Math.min(prevX, projectile.x);
    const sweptRight = Math.max(prevX + projectile.w, projectile.x + projectile.w);
    const sweptTop = Math.min(prevY, projectile.y);
    const sweptBottom = Math.max(prevY + projectile.h, projectile.y + projectile.h);

    return sweptLeft < bridge.x + bridge.w &&
           sweptRight > bridge.x &&
           sweptTop < bridge.y + bridge.h &&
           sweptBottom > previousBridgeY;
}

function levelUp() {
    level++; levelEl.innerText = level; baseSpeed += 0.4;
    floatingTexts.push({ x: canvas.width/2, y: canvas.height/2, text: "LEVEL " + level, life: 80, maxLife: 80, color: "#0f0", size: "30px" });
    if ((level - 1) % 3 === 0) {
        currentTheme = Math.floor((level - 1) / 3) % themes.length;
        floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 + 40, text: themes[currentTheme].name, life: 100, maxLife: 100, color: "#fff", size: "24px" });
    }
}

function update() {
    if (state === 'START' || state === 'GAMEOVER') { if (keys['Space']) resetGame(); return; }
    frame++;
    
    if (state === 'PLAYING') {
        bridgeTimer++;
        if (invincibilityTimer > 0) invincibilityTimer--;
        if (spreadShotTimer > 0) spreadShotTimer--;
    }

    if (comboTimer > 0 && state === 'PLAYING') {
        comboTimer--; if (comboTimer <= 0) { combo = 1; comboEl.innerText = "COMBO: x1"; comboEl.style.color = "#aaa"; }
    }

    for (let i = particles.length - 1; i >= 0; i--) { let p = particles[i]; p.x += p.vx; p.y += p.vy; p.life--; if (p.life <= 0) particles.splice(i, 1); }
    for (let i = floatingTexts.length - 1; i >= 0; i--) { let ft = floatingTexts[i]; ft.y -= 1; ft.life--; if (ft.life <= 0) floatingTexts.splice(i, 1); }

    if (state === 'PLAYING') {
        // Gyroscope controls: 3 speed zones based on tilt angle
        const yHome = playerHomeY();
        const yMin  = Math.round(canvas.height * 0.25);
        if (gyroActive) {
            const tilt = Math.max(0, Math.min(GYRO_BETA_MAX, gyroBeta));
            if (tilt <= GYRO_BETA_SLOW_MAX) {
                currentSpeed = Math.max(1, baseSpeed - 2);
                if (player.y < yHome) player.y += 2;
            } else if (tilt <= GYRO_BETA_NORMAL_MAX) {
                currentSpeed = baseSpeed;
                if (player.y < yHome) player.y += 1.5;
            } else {
                currentSpeed = baseSpeed + 3;
                if (player.y > yMin) player.y -= 2;
            }
        } else {
            if (keys['ArrowUp']) { currentSpeed = baseSpeed + 3; if (player.y > yMin) player.y -= 2; }
            else if (keys['ArrowDown']) { currentSpeed = Math.max(1, baseSpeed - 2); if (player.y < yHome) player.y += 2; }
            else { currentSpeed = baseSpeed; if (player.y < yHome) player.y += 1.5; }
        }
    }

    // 1. MEANDRUJĄCA RZEKA
    let steps = Math.floor(currentSpeed / 2) || 1;
    let isBridgeSoon = bridgeTimer > 2340; 
    
    for(let i=0; i<steps; i++) {
        if (isBridgeSoon) { targetRiverWidth = 100; activeIsland = null; } 
        else {
            if (Math.random() < 0.03) {
                let maxShift = canvas.width * 0.3125 + (level * 10); targetRiverCenter = canvas.width / 2 + (Math.random() - 0.5) * maxShift;
                targetRiverCenter = Math.max(currentRiverWidth / 2 + 20, Math.min(canvas.width - currentRiverWidth / 2 - 20, targetRiverCenter));
            }
            if (Math.random() < 0.03) {
                targetRiverWidth = canvas.width * 0.625 - (level * 20) + (Math.random() - 0.5) * 150;
                targetRiverWidth = Math.max(160, Math.min(canvas.width * 0.75, targetRiverWidth));
            }
        }
        let smoothSpeed = isBridgeSoon ? 0.15 : (0.015 + level * 0.002);
        currentRiverCenter += (targetRiverCenter - currentRiverCenter) * smoothSpeed; currentRiverWidth += (targetRiverWidth - currentRiverWidth) * smoothSpeed;
        let wildness = Math.min(5, 1.0 + (level * 0.3));
        let targetLeft = (currentRiverCenter - currentRiverWidth / 2) + (Math.random() - 0.5) * wildness;
        let targetRight = (canvas.width - (currentRiverCenter + currentRiverWidth / 2)) + (Math.random() - 0.5) * wildness;

        if (level >= 4 && !isBridgeSoon) {
            islandTimer += currentSpeed;
            if (!activeIsland && islandTimer > 500 && Math.random() < 0.02) {
                let maxPossibleWidth = currentRiverWidth - 100; 
                if (maxPossibleWidth > 40) activeIsland = { offset: (Math.random() - 0.5) * 20, width: 0, targetWidth: 40 + Math.random() * Math.min(100, maxPossibleWidth - 40), length: 150 + Math.random() * 200 };
            }
        }
        let iC = 0, iW = 0;
        if (activeIsland) {
            activeIsland.length -= 1;
            if (activeIsland.length > 50) activeIsland.width += (activeIsland.targetWidth - activeIsland.width) * 0.1; else activeIsland.width += (0 - activeIsland.width) * 0.1;
            iC = currentRiverCenter + activeIsland.offset; iW = activeIsland.width;
            if (activeIsland.length <= 0) { activeIsland = null; islandTimer = 0; }
        }
        riverPoints.unshift({ left: targetLeft, right: targetRight, islandCenter: iC, islandWidth: iW }); riverPoints.pop();
    }

    // 2. Gracz
    if (state === 'PLAYING') {
        // Left/right movement: proportional gyro OR keyboard
        if (gyroActive) {
            const tilt = gyroGamma;
            if (Math.abs(tilt) > GYRO_DEADZONE) {
                const speed = ((Math.abs(tilt) - GYRO_DEADZONE) / (GYRO_MAX_TILT - GYRO_DEADZONE)) * 8;
                if (tilt < 0) player.x = Math.max(0, player.x - speed);
                else          player.x = Math.min(canvas.width - player.w, player.x + speed);
            }
        } else {
            if (keys['ArrowLeft']  && player.x > 0)                    player.x -= 5;
            if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += 5;
        }
        
        if (frame % 12 === 0) {
            if (spreadShotTimer > 0) {
                bullets.push({ x: player.x + 11, y: player.y, w: 4, h: 14, vx: 0, vy: -14 });
                bullets.push({ x: player.x + 11, y: player.y, w: 4, h: 14, vx: -3, vy: -13 });
                bullets.push({ x: player.x + 11, y: player.y, w: 4, h: 14, vx: 3, vy: -13 });
            } else {
                bullets.push({ x: player.x + 11, y: player.y, w: 4, h: 14, vx: 0, vy: -14 });
            }
        }

        let bankMargin = 6; let rp = riverPoints[Math.floor(player.y / 2)];
        if (player.x + bankMargin < rp.left || (player.x + player.w - bankMargin) > (canvas.width - rp.right)) takeDamage("#ff0");
        if (rp.islandWidth > 0) {
            if ((player.x + player.w - bankMargin) > rp.islandCenter - (rp.islandWidth / 2) && (player.x + bankMargin) < rp.islandCenter + (rp.islandWidth / 2)) takeDamage("#ff0");
        }

        fuel -= 0.08 * (currentSpeed / baseSpeed);
        if (fuel <= 0) die("#f00"); 
    }

    // 3. Spawnowanie
    if (bridgeTimer >= 2400) {
        bridgeTimer = 0; spawnDistance = 0; 
        entities.push({ x: 0, y: -60, type: 'bridge', w: canvas.width, h: 24, passed: false, bridgeCenter: currentRiverCenter });
    } else {
        spawnDistance += currentSpeed;
        let targetSpawnDist = Math.max(90, 220 - (level * 12)); 
        
        if (spawnDistance > targetSpawnDist && !isBridgeSoon) {
            spawnDistance = 0; let rp = riverPoints[0]; let rand = Math.random(); let eType = 'ship'; let eW = 40, eH = 40;
            
            if (rand < 0.15) eType = 'fuel';
            else if (rand < 0.23 && level >= 2) { eType = 'mine'; eW = 24; eH = 24; }
            else if (rand < 0.28) { eType = (Math.random() > 0.5) ? 'power_spread' : 'power_shield'; eW = 24; eH = 24; }
            else {
                let enemyRand = Math.random();
                if (level >= 8 && enemyRand > 0.85) { eType = 'tank'; eW = 24; eH = 24; }      
                else if (level >= 6 && enemyRand > 0.70) eType = 'jet';  
                else if (level >= 2 && enemyRand > 0.30) eType = 'heli'; 
                else eType = 'ship';                                     
            }

            if (eType === 'tank') {
                let onLeft = Math.random() > 0.5;
                entities.push({ x: onLeft ? rp.left - 24 : canvas.width - rp.right, y: -50, type: 'tank', w: eW, h: eH, onLeft: onLeft, grazed: false });
            } else {
                let spawnX = 0;
                if (rp.islandWidth > 5) {
                    let lSpace = (rp.islandCenter - rp.islandWidth/2) - rp.left; let rSpace = (canvas.width - rp.right) - (rp.islandCenter + rp.islandWidth/2);
                    if (Math.random() > 0.5 && lSpace > 50) spawnX = rp.left + Math.random() * (lSpace - 40);
                    else if (rSpace > 50) spawnX = (rp.islandCenter + rp.islandWidth/2) + Math.random() * (rSpace - 40);
                    else spawnX = rp.left + Math.random() * (canvas.width - rp.left - rp.right - 40); 
                } else {
                    spawnX = rp.left + Math.random() * (canvas.width - rp.left - rp.right - 40);
                }
                entities.push({ x: spawnX, y: -50, type: eType, w: eW, h: eH, heliDirX: (Math.random() > 0.5 ? 1 : -1) * (1.0 + (level * 0.2)), grazed: false });
            }
        }
    }

    // 4. Inteligencja, Ruch i Graze dla jednostek
    for (let i = entities.length - 1; i >= 0; i--) {
        let en = entities[i];
        
        if (en.type === 'jet') en.y += currentSpeed * 2.5; 
        else if (en.type === 'mine') en.y += currentSpeed * 0.8; 
        else en.y += currentSpeed;

        if (en.type === 'heli') {
            en.x += en.heliDirX; let rp = riverPoints[Math.max(0, Math.min(riverPoints.length - 1, Math.floor(en.y / 2)))];
            if (en.x < rp.left + 5) { en.x = rp.left + 5; en.heliDirX *= -1; } 
            else if (en.x + en.w > canvas.width - rp.right - 5) { en.x = canvas.width - rp.right - en.w - 5; en.heliDirX *= -1; }
            if (rp.islandWidth > 0) { if (en.x + en.w > rp.islandCenter - (rp.islandWidth / 2) && en.x < rp.islandCenter + (rp.islandWidth / 2)) { en.heliDirX *= -1; en.x += en.heliDirX * 2; } }
            if (Math.random() < (0.015 + level * 0.002)) { let dir = Math.sign(player.x - en.x); if (dir !== 0) en.heliDirX = dir * Math.abs(en.heliDirX); }
        }

        if (en.y > 0 && en.y < canvas.height - 100) {
            if (en.type === 'ship' && Math.random() < (0.005 + (level * 0.001))) {
                let dx = (player.x + player.w/2) - (en.x + en.w/2); let dy = (player.y + player.h/2) - (en.y + en.h/2);
                if (dy > 0) {
                    let bSpd = currentSpeed + 2 + (level * 0.4); let dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    enemyBullets.push({ x: en.x + 15, y: en.y + 15, w: 10, h: 10, vx: (dx/dist)*bSpd, vy: (dy/dist)*bSpd, shape: 'round', grazed: false });
                }
            } else if (en.type === 'tank' && Math.random() < (0.006 + (level * 0.002))) {
                let sx = en.onLeft ? en.x + 24 : en.x - 8; let dx = (player.x + player.w/2) - sx; let dy = (player.y + player.h/2) - (en.y + 13);
                if (dy > 0) {
                    let bSpd = currentSpeed + 3; let dist = Math.sqrt(dx*dx + dy*dy) || 1;
                    enemyBullets.push({ x: sx, y: en.y + 13, w: 10, h: 10, vx: (dx/dist)*bSpd, vy: (dy/dist)*bSpd, shape: 'round', grazed: false }); 
                }
            }
        }

        if (en.type !== 'bridge' && en.type !== 'heli' && en.type !== 'tank') {
            let rp = riverPoints[Math.max(0, Math.min(riverPoints.length - 1, Math.floor(en.y / 2)))];
            if (en.x < rp.left) en.x = rp.left;
            if (en.x + en.w > canvas.width - rp.right) en.x = canvas.width - rp.right - en.w;
            if (rp.islandWidth > 0) {
                let iLeft = rp.islandCenter - (rp.islandWidth / 2); let iRight = rp.islandCenter + (rp.islandWidth / 2);
                if (en.x + en.w > iLeft && en.x < iRight) { if(en.x + en.w/2 < rp.islandCenter) en.x = iLeft - en.w; else en.x = iRight; }
            }
        }

        if (en.type === 'bridge' && !en.passed && en.y > player.y) {
            en.passed = true; score += 500; levelUp(); floatingTexts.push({ x: canvas.width / 2, y: player.y - 20, text: "+500", life: 60, maxLife: 60, color: "#ff0", size: "24px" });
        }

        if (state === 'PLAYING' && (en.type === 'ship' || en.type === 'heli' || en.type === 'jet' || en.type === 'mine')) {
            checkGraze(en, false);
        }

        if (state === 'PLAYING') {
            if (player.x < en.x + en.w && player.x + player.w > en.x && player.y < en.y + en.h && player.y + player.h > en.y) {
                if (en.type === 'fuel') { fuel = Math.min(100, fuel + 2.0); } 
                else if (en.type === 'power_spread') {
                    spreadShotTimer = 360; // 6 sekund przy 60 FPS
                    floatingTexts.push({ x: player.x, y: player.y - 10, text: "SPREAD SHOT!", life: 60, maxLife: 60, color: "#0ff", size: "16px" });
                    entities.splice(i, 1);
                }
                else if (en.type === 'power_shield') {
                    playerShielded = true;
                    floatingTexts.push({ x: player.x, y: player.y - 10, text: "SHIELD ON!", life: 60, maxLife: 60, color: "#a0f", size: "16px" });
                    entities.splice(i, 1);
                }
                else if (en.type === 'bridge') { fuel = Math.min(100, fuel + 4.0); }
                else if (invincibilityTimer <= 0) takeDamage("#fa0"); 
            }
        }
        
        if (en.y > canvas.height) entities.splice(i, 1);
    }

    // 5. Pociski gracza
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
        let b = bullets[bi]; 
        let prevBulletX = b.x;
        let prevBulletY = b.y;
        b.x += b.vx; 
        b.y += b.vy; 
        
        let hit = false;
        
        for (let ei = entities.length - 1; ei >= 0; ei--) {
            let en = entities[ei];
            let intersects = (b.x < en.x + en.w && b.x + b.w > en.x && b.y < en.y + en.h && b.y + b.h > en.y);
            if (en.type === 'bridge') intersects = projectileHitsBridge(b, prevBulletX, prevBulletY, en);
            if (intersects) {
                if (en.type === 'fuel' || en.type === 'power_spread' || en.type === 'power_shield' || en.type === 'mine') continue; 
                
                if (en.type === 'bridge') {
                    createExplosion(b.x, b.y, '#fff'); bullets.splice(bi, 1); hit = true; break;
                }
                
                let basePts = 0;
                if (en.type === 'jet') basePts = 200; else if (en.type === 'tank') basePts = 250; else if (en.type === 'heli') basePts = 150; else if (en.type === 'ship') basePts = 100;
                let earned = basePts * combo; score += earned;
                
                combo = Math.min(combo + 1, 5); comboTimer = 150; 
                comboEl.innerText = "COMBO: x" + combo; comboEl.style.color = combo > 2 ? "#f00" : "#fa0";
                comboEl.style.transform = "scale(1.2)"; setTimeout(() => comboEl.style.transform = "scale(1)", 100);

                floatingTexts.push({ x: en.x + (en.w / 2), y: en.y + (en.h / 2), text: "+" + earned, life: 40, maxLife: 40, color: combo > 1 ? "#fa0" : "#ff0" });
                createExplosion(en.x, en.y, '#fa0'); entities.splice(ei, 1); bullets.splice(bi, 1); hit = true; break; 
            }
        }
        if (!hit && (b.y < 0 || b.x < 0 || b.x > canvas.width)) { 
            bullets.splice(bi, 1); combo = 1; comboTimer = 0; comboEl.innerText = "COMBO: x1"; comboEl.style.color = "#aaa";
        }
    }

    // 6. Wrogie pociski
    for (let ebi = enemyBullets.length - 1; ebi >= 0; ebi--) {
        let eb = enemyBullets[ebi];
        let prevEnemyBulletX = eb.x;
        let prevEnemyBulletY = eb.y;
        eb.x += eb.vx;
        eb.y += eb.vy;

        let bridgeHit = entities.some(en => en.type === 'bridge' && projectileHitsBridge(eb, prevEnemyBulletX, prevEnemyBulletY, en));
        if (bridgeHit) {
            createExplosion(eb.x, eb.y, '#fff');
            enemyBullets.splice(ebi, 1);
            continue;
        }
        
        if (state === 'PLAYING') {
            checkGraze(eb, true);
            
            if (player.x + 4 < eb.x + eb.w && player.x + player.w - 4 > eb.x && player.y + 4 < eb.y + eb.h && player.y + player.h - 4 > eb.y) {
                if (invincibilityTimer <= 0) takeDamage('#ff0');
                enemyBullets.splice(ebi, 1); 
                continue;
            }
        }
        if (eb.y > canvas.height || eb.x < 0 || eb.x > canvas.width) enemyBullets.splice(ebi, 1);
    }

    scoreEl.innerText = score.toString().padStart(5, '0');
    fuelFill.style.width = Math.max(0, fuel) + "%";
    fuelFill.style.background = fuel < 25 ? "#f00" : "#0f0";
    syncMobHud();
}

// --- RENDER ---
function draw() {
    ctx.fillStyle = themes[currentTheme].water; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = themes[currentTheme].land;
    riverPoints.forEach((p, i) => {
        ctx.fillRect(0, i * 2, p.left, 2); ctx.fillRect(canvas.width - p.right, i * 2, p.right, 2);
        if (p.islandWidth > 0) ctx.fillRect(p.islandCenter - (p.islandWidth/2), i * 2, p.islandWidth, 2);
    });

    entities.forEach(drawEntity);
    if (state === 'PLAYING' || state === 'START') drawPlayer();
    
    ctx.fillStyle = "#ff0"; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));

    enemyBullets.forEach(eb => {
        ctx.fillStyle = "#f00"; 
        if(eb.shape === 'flat') { ctx.fillRect(eb.x, eb.y, eb.w, eb.h); ctx.fillStyle = "#ff0"; ctx.fillRect(eb.x + (eb.vx > 0 ? 0 : eb.w-2), eb.y + 1, 2, 2); } 
        else { ctx.fillRect(eb.x, eb.y, eb.w, eb.h); ctx.fillStyle = "#a00"; ctx.fillRect(eb.x + 2, eb.y + 2, eb.w - 4, eb.h - 4); ctx.beginPath(); ctx.arc(eb.x + eb.w/2, eb.y + eb.h, eb.w/2, 0, Math.PI, false); ctx.fill(); }
    });

    particles.forEach(p => { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, 4, 4); });

    ctx.textAlign = "center";
    floatingTexts.forEach(ft => {
        let alpha = ft.life / ft.maxLife; ctx.font = `bold ${ft.size || '16px'} Arial`;
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`; ctx.fillText(ft.text, ft.x + 1, ft.y + 1); ctx.fillText(ft.text, ft.x - 1, ft.y - 1);
        ctx.fillStyle = ft.color ? ft.color : `rgba(255, 255, 0, ${alpha})`; ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.textAlign = "left"; 

    const cy = canvas.height / 2;
    if (state === 'START') {
        ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.fillStyle = "#fff"; ctx.textAlign = "center";
        ctx.font = "bold 34px 'Courier New'"; ctx.fillText("RIVER RAID", canvas.width/2, cy - 20); ctx.font = "16px 'Courier New'";
        ctx.fillText(isMobile ? "DOTKNIJ EKRANU, ABY STARTOWAĆ" : "PRESS SPACE TO START", canvas.width/2, cy + 30);
        if (isMobile) { ctx.fillStyle = "#888"; ctx.font = "13px 'Courier New'"; ctx.fillText("Przechyl telefon, aby sterować", canvas.width/2, cy + 65); }
    } else if (state === 'GAMEOVER') {
        ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.textAlign = "center"; ctx.font = "bold 34px 'Courier New'"; ctx.fillStyle = "#f00"; ctx.fillText("GAME OVER", canvas.width/2, cy - 80);
        ctx.fillStyle = "#fff"; ctx.font = "20px 'Courier New'"; ctx.fillText("SCORE: " + score, canvas.width/2, cy - 20);
        if(isNewRecord) { ctx.fillStyle = "#ff0"; ctx.fillText("NEW HIGH SCORE!", canvas.width/2, cy + 20); } else { ctx.fillStyle = "#aaa"; ctx.fillText("HI-SCORE: " + highScore, canvas.width/2, cy + 20); }
        ctx.fillStyle = "#fff"; ctx.font = "16px 'Courier New'";
        if (Math.floor(Date.now() / 500) % 2 === 0) ctx.fillText(isMobile ? "DOTKNIJ EKRANU" : "PRESS SPACE TO RESTART", canvas.width/2, cy + 100);
    }

    update(); requestAnimationFrame(draw);
}

draw();
