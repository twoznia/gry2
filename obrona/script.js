        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const CELL_SIZE = 40;
        const COLS = canvas.width / CELL_SIZE;
        const ROWS = canvas.height / CELL_SIZE;

        // Firebase
        let db, auth, currentUser, appId;
        let highScore = 0, highWave = 0;

        try {
            const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
            if (Object.keys(firebaseConfig).length > 0) {
                const app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);
                appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const initAuth = async () => {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else { await signInAnonymously(auth); }
                };
                initAuth();
                onAuthStateChanged(auth, async (user) => { currentUser = user; if (user) await loadHighscore(); });
            }
        } catch (e) { console.warn("Błąd inicjalizacji zapisu w chmurze:", e); }

        async function loadHighscore() {
            const lsScore = parseInt(localStorage.getItem('obronaHighScore')) || 0;
            const lsWave = parseInt(localStorage.getItem('obronaHighWave')) || 0;
            if (lsScore > highScore) highScore = lsScore;
            if (lsWave > highWave) highWave = lsWave;
            if (highScore > 0 || highWave > 0) updateUI();
            if (!currentUser || !db) return;
            try {
                const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'records', 'highscore');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if ((data.score || 0) > highScore) highScore = data.score || 0;
                    if ((data.wave || 0) > highWave) highWave = data.wave || 0;
                    updateUI();
                }
            } catch (error) { console.error("Błąd:", error); }
        }

        async function saveHighscore() {
            let shouldSave = false;
            if (score > highScore) { highScore = score; shouldSave = true; }
            if (wave > highWave) { highWave = wave; shouldSave = true; }
            if (shouldSave) {
                localStorage.setItem('obronaHighScore', String(highScore));
                localStorage.setItem('obronaHighWave', String(highWave));
                if (currentUser && db) {
                    try {
                        const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'records', 'highscore');
                        await setDoc(docRef, { score: highScore, wave: highWave });
                    } catch (error) { console.error("Błąd:", error); }
                }
            }
        }

        // ═══ ŚCIEŻKA ═══
        const pathGrid = [
            {x:0,y:2},{x:4,y:2},{x:4,y:11},{x:10,y:11},{x:10,y:4},{x:16,y:4},{x:16,y:13},{x:19,y:13}
        ];
        const pathPixels = pathGrid.map(p => ({ x: p.x * CELL_SIZE + CELL_SIZE / 2, y: p.y * CELL_SIZE + CELL_SIZE / 2 }));

        // ═══ DANE WIEŻ ═══
        const TOWER_DATA = {
            basic: {
                name: 'Podstawowa', symbol: '■', color: '#60a5fa', shape: 'rect',
                desc: 'Solidna i tania. Dobra na start.',
                levels: [
                    { cost: 50,  damage: 22,  range: 120, cooldown: 50 },
                    { cost: 35,  damage: 34,  range: 132, cooldown: 45 },
                    { cost: 55,  damage: 50,  range: 144, cooldown: 40 },
                ],
            },
            rapid: {
                name: 'Szybkostrzelna', symbol: '▲', color: '#4ade80', shape: 'triangle',
                desc: 'Spowalnia wrogów. Idealna na szybkich.',
                slow: { factor: 0.3, frames: 90 },
                levels: [
                    { cost: 100, damage: 7,   range: 100, cooldown: 10 },
                    { cost: 65,  damage: 11,  range: 110, cooldown: 9  },
                    { cost: 95,  damage: 16,  range: 120, cooldown: 8  },
                ],
            },
            sniper: {
                name: 'Snajper', symbol: '◆', color: '#c084fc', shape: 'diamond',
                desc: 'Przebija wrogów — trafia też sąsiedniego. Kluczowy vs bossów.',
                pierce: true,
                levels: [
                    { cost: 200, damage: 120, range: 280, cooldown: 100 },
                    { cost: 130, damage: 180, range: 300, cooldown: 90  },
                    { cost: 200, damage: 260, range: 320, cooldown: 80  },
                ],
            },
        };

        // ═══ WROGOWIE ═══
        const ENEMY_TYPES = {
            normal: { hp: 100, speed: 1.5, reward: 15, color: '#f87171', radius: 12 },
            fast:   { hp: 50,  speed: 3.0, reward: 18, color: '#fbbf24', radius: 8  },
            tank:   { hp: 500, speed: 0.7, reward: 60, color: '#94a3b8', radius: 16 },
            boss:   { hp: 1500,speed: 0.5, reward: 400,color: '#dc2626', radius: 24 },
        };

        // ═══ ZDOLNOŚCI ═══
        const ABILITIES = {
            bombard: { cost: 100, cooldownMs: 45000, damage: 300, radius: 80 },
            freeze:  { cost: 75,  cooldownMs: 60000, slowFactor: 0.5, durationFrames: 240 },
        };

        // ═══ STAN GRY ═══
        let money = 200, lives = 25, wave = 0, score = 0;
        let gameState = 'IDLE';
        let selectedTowerType = 'basic';
        let selectedMapTower = null;
        let abilityMode = null;
        let abilityCooldownUntil = { bombard: 0, freeze: 0 };
        let mouseX = -100, mouseY = -100;

        const towers = [], enemies = [], projectiles = [], particles = [];
        let enemiesToSpawn = [], spawnTimer = 0;

        // ═══ KLASY ═══

        class Enemy {
            constructor(type, waveNum) {
                this.type = type;
                const base = ENEMY_TYPES[type];
                this.maxHp = base.hp * Math.pow(1.10, waveNum - 1);
                this.hp = this.maxHp;
                this.baseSpeed = base.speed;
                this.speed = base.speed;
                this.reward = base.reward;
                this.color = base.color;
                this.radius = base.radius;
                this.pathIndex = 0;
                this.x = pathPixels[0].x - CELL_SIZE;
                this.y = pathPixels[0].y;
                this.slowFrames = 0;
                this.slowFactor = 0;
            }

            get effectiveSpeed() {
                return this.slowFrames > 0 ? this.baseSpeed * (1 - this.slowFactor) : this.baseSpeed;
            }

            applySlow(factor, frames) {
                if (factor > this.slowFactor || frames > this.slowFrames) {
                    this.slowFactor = Math.max(this.slowFactor, factor);
                    this.slowFrames = Math.max(this.slowFrames, frames);
                }
            }

            getRemainingPathDist() {
                let dist = 0;
                const wp = pathPixels[this.pathIndex];
                if (!wp) return 0;
                dist += Math.hypot(wp.x - this.x, wp.y - this.y);
                for (let i = this.pathIndex; i < pathPixels.length - 1; i++) {
                    dist += Math.hypot(pathPixels[i+1].x - pathPixels[i].x, pathPixels[i+1].y - pathPixels[i].y);
                }
                return dist;
            }

            update() {
                if (this.slowFrames > 0) this.slowFrames--;
                if (this.slowFrames <= 0) this.slowFactor = 0;

                const target = pathPixels[this.pathIndex];
                if (!target) return;

                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const dist = Math.hypot(dx, dy);
                const spd = this.effectiveSpeed;

                if (dist < spd) {
                    this.x = target.x;
                    this.y = target.y;
                    this.pathIndex++;
                    if (this.pathIndex >= pathPixels.length) {
                        this.hp = 0;
                        lives--;
                        updateUI();
                        if (lives <= 0) gameOver();
                    }
                } else {
                    this.x += (dx / dist) * spd;
                    this.y += (dy / dist) * spd;
                }
            }

            draw() {
                const hpPct = Math.max(0, this.hp / this.maxHp);
                ctx.fillStyle = '#ef4444';
                ctx.fillRect(this.x - 15, this.y - this.radius - 8, 30, 4);
                ctx.fillStyle = '#22c55e';
                ctx.fillRect(this.x - 15, this.y - this.radius - 8, 30 * hpPct, 4);

                // slow indicator
                if (this.slowFrames > 0) {
                    ctx.strokeStyle = 'rgba(147, 197, 253, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.stroke();

                // boss crown
                if (this.type === 'boss') {
                    ctx.fillStyle = '#fbbf24';
                    ctx.font = `${Math.round(this.radius)}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('♚', this.x, this.y);
                }
            }
        }

        class Tower {
            constructor(gridX, gridY, type) {
                this.gridX = gridX;
                this.gridY = gridY;
                this.x = gridX * CELL_SIZE + CELL_SIZE / 2;
                this.y = gridY * CELL_SIZE + CELL_SIZE / 2;
                this.type = type;
                this.level = 0;
                this.angle = 0;

                const data = TOWER_DATA[type];
                const lvl = data.levels[0];
                this.range = lvl.range;
                this.damage = lvl.damage;
                this.cooldownMax = lvl.cooldown;
                this.cooldownTimer = 0;
                this.color = data.color;
                this.shape = data.shape;
            }

            applyLevel(lvl) {
                const data = TOWER_DATA[this.type].levels[lvl];
                this.level = lvl;
                this.range = data.range;
                this.damage = data.damage;
                this.cooldownMax = data.cooldown;
            }

            getUpgradeCost() {
                const data = TOWER_DATA[this.type];
                if (this.level >= data.levels.length - 1) return null;
                return data.levels[this.level + 1].cost;
            }

            getTotalInvested() {
                const data = TOWER_DATA[this.type];
                let total = 0;
                for (let i = 0; i <= this.level; i++) total += data.levels[i].cost;
                return total;
            }

            getSellValue() {
                return Math.floor(this.getTotalInvested() * 0.6);
            }

            update() {
                if (this.cooldownTimer > 0) this.cooldownTimer--;

                const getProgress = (e) => {
                    const wp = pathPixels[e.pathIndex];
                    return wp ? e.pathIndex - Math.hypot(wp.x - e.x, wp.y - e.y) / (CELL_SIZE * 4) : e.pathIndex;
                };

                let candidates = [];
                for (const e of enemies) {
                    if (e.hp <= 0) continue;
                    const dst = Math.hypot(this.x - e.x, this.y - e.y);
                    if (dst > this.range) continue;
                    candidates.push({ enemy: e, dist: dst, progress: getProgress(e) });
                }

                if (candidates.length === 0) return;

                // smart targeting: estimate contribution, skip if negligible
                const worthy = [];
                for (const c of candidates) {
                    const e = c.enemy;
                    const remainDist = e.getRemainingPathDist();
                    const framesLeft = remainDist / Math.max(0.1, e.effectiveSpeed);
                    const rangeTime = Math.min(framesLeft, (this.range * 1.5) / Math.max(0.1, e.effectiveSpeed));
                    const shots = Math.max(1, Math.floor(rangeTime / this.cooldownMax));
                    const contribution = shots * this.damage;
                    c.worthy = contribution >= e.hp * 0.08;
                    c.canKill = e.hp <= this.damage;
                    if (c.worthy || c.canKill) worthy.push(c);
                }

                let target = null;

                const pool = worthy.length > 0 ? worthy : candidates;

                // priority 1: kill shot (finish off weakened enemies)
                let killTarget = null, killProgress = -1;
                for (const c of pool) {
                    if (c.canKill && c.progress > killProgress) {
                        killProgress = c.progress;
                        killTarget = c.enemy;
                    }
                }

                if (killTarget) {
                    target = killTarget;
                } else if (this.type === 'sniper') {
                    let best = -1;
                    for (const c of pool) { if (c.progress > best) { best = c.progress; target = c.enemy; } }
                } else {
                    let minD = Infinity;
                    for (const c of pool) { if (c.dist < minD) { minD = c.dist; target = c.enemy; } }
                }

                if (target) {
                    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
                    if (this.cooldownTimer <= 0) {
                        this.shoot(target);
                        this.cooldownTimer = this.cooldownMax;
                    }
                }
            }

            shoot(target) {
                const data = TOWER_DATA[this.type];
                const p = new Projectile(this.x, this.y, target, this.damage, this.color);
                if (data.slow) p.slow = data.slow;
                if (data.pierce) p.pierce = true;
                projectiles.push(p);
            }

            draw() {
                const isSelected = selectedMapTower === this;
                ctx.save();
                ctx.translate(this.x, this.y);

                // base
                ctx.fillStyle = isSelected ? '#64748b' : '#475569';
                ctx.beginPath();
                ctx.arc(0, 0, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
                ctx.fill();

                if (isSelected) {
                    ctx.strokeStyle = '#fbbf24';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // level pips
                if (this.level >= 1) {
                    ctx.fillStyle = '#22c55e';
                    ctx.beginPath();
                    ctx.arc(-6, CELL_SIZE / 2 - 8, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (this.level >= 2) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.beginPath();
                    ctx.arc(6, CELL_SIZE / 2 - 8, 3, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.rotate(this.angle);

                ctx.fillStyle = this.color;
                if (this.shape === 'rect') {
                    ctx.fillRect(-10, -10, 25, 20);
                } else if (this.shape === 'triangle') {
                    ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-10, 10); ctx.lineTo(-10, -10); ctx.fill();
                } else if (this.shape === 'diamond') {
                    ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(0, 8); ctx.lineTo(-10, 0); ctx.lineTo(0, -8); ctx.fill();
                }

                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }
        }

        class Projectile {
            constructor(x, y, target, damage, color) {
                this.x = x; this.y = y;
                this.target = target;
                this.damage = damage;
                this.color = color;
                this.speed = 8;
                this.active = true;
                this.slow = null;
                this.pierce = false;
                this.pierced = false;
            }

            update() {
                if (!this.active) return;
                const tx = this.target.hp > 0 ? this.target.x : this.x;
                const ty = this.target.hp > 0 ? this.target.y : this.y;
                const dx = tx - this.x, dy = ty - this.y;
                const dist = Math.hypot(dx, dy);

                if (dist < this.speed) {
                    if (this.target.hp > 0) {
                        this.target.hp -= this.damage;
                        createParticles(this.target.x, this.target.y, this.color);
                        if (this.slow) this.target.applySlow(this.slow.factor, this.slow.frames);
                        if (this.target.hp <= 0) {
                            money += this.target.reward;
                            score += this.target.reward;
                            updateUI();
                        }
                        // pierce: hit one nearby enemy
                        if (this.pierce && !this.pierced) {
                            this.pierced = true;
                            for (const e of enemies) {
                                if (e === this.target || e.hp <= 0) continue;
                                if (Math.hypot(e.x - this.target.x, e.y - this.target.y) < 70) {
                                    e.hp -= this.damage;
                                    createParticles(e.x, e.y, this.color);
                                    if (e.hp <= 0) { money += e.reward; score += e.reward; updateUI(); }
                                    break;
                                }
                            }
                        }
                    }
                    this.active = false;
                } else {
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                }
            }

            draw() {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        class Particle {
            constructor(x, y, color) {
                this.x = x; this.y = y; this.color = color;
                const a = Math.random() * Math.PI * 2;
                const s = Math.random() * 2 + 1;
                this.vx = Math.cos(a) * s;
                this.vy = Math.sin(a) * s;
                this.life = 1.0;
            }
            update() { this.x += this.vx; this.y += this.vy; this.life -= 0.05; }
            draw() {
                ctx.globalAlpha = Math.max(0, this.life);
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, 3, 3);
                ctx.globalAlpha = 1.0;
            }
        }

        // ═══ EKSPLOZJA (bombardowanie) ═══
        let explosions = [];
        class Explosion {
            constructor(x, y, radius, damage) {
                this.x = x; this.y = y; this.radius = radius;
                this.life = 1.0;
                for (const e of enemies) {
                    if (e.hp <= 0) continue;
                    if (Math.hypot(e.x - x, e.y - y) <= radius) {
                        e.hp -= damage;
                        createParticles(e.x, e.y, '#f97316');
                        if (e.hp <= 0) { money += e.reward; score += e.reward; }
                    }
                }
                updateUI();
            }
            update() { this.life -= 0.04; }
            draw() {
                ctx.globalAlpha = Math.max(0, this.life * 0.5);
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * (1.2 - this.life * 0.2), 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        function createParticles(x, y, color) {
            for (let i = 0; i < 5; i++) particles.push(new Particle(x, y, color));
        }

        // ═══ ŚCIEŻKA ═══
        function isPathCell(x, y) {
            for (let i = 0; i < pathGrid.length - 1; i++) {
                const p1 = pathGrid[i], p2 = pathGrid[i+1];
                if (x >= Math.min(p1.x, p2.x) && x <= Math.max(p1.x, p2.x) &&
                    y >= Math.min(p1.y, p2.y) && y <= Math.max(p1.y, p2.y)) return true;
            }
            return false;
        }

        // ═══ UI ═══
        function updateUI() {
            document.getElementById('money-display').innerText = money;
            document.getElementById('lives-display').innerText = lives;
            document.getElementById('wave-display').innerText = wave;
            document.getElementById('score-display').innerText = score;
            const hsDisplay = document.getElementById('high-score-display');
            if (hsDisplay) hsDisplay.innerText = Math.max(score, highScore);
            const hwDisplay = document.getElementById('high-wave-display');
            if (hwDisplay) hwDisplay.innerText = Math.max(wave, highWave);

            const livesEl = document.getElementById('lives-display');
            if (lives > 10) livesEl.className = "stat-value text-green-500";
            else if (lives > 5) livesEl.className = "stat-value text-yellow-500";
            else livesEl.className = "stat-value text-red-500 font-bold animate-pulse";

            // tower shop button affordability
            for (const [type, data] of Object.entries(TOWER_DATA)) {
                const btn = document.querySelector(`.tower-btn[data-type="${type}"]`);
                if (btn) btn.classList.toggle('cant-afford', money < data.levels[0].cost);
            }

            updateTowerInfoPanel();
            updateAbilityButtons();
        }

        function updateTowerInfoPanel() {
            const panel = document.getElementById('tower-info');
            if (!selectedMapTower) { panel.classList.add('hidden'); return; }
            panel.classList.remove('hidden');

            const t = selectedMapTower;
            const data = TOWER_DATA[t.type];
            const lvl = data.levels[t.level];

            document.getElementById('ti-name').textContent = `${data.symbol} ${data.name}`;
            document.getElementById('ti-name').style.color = data.color;
            document.getElementById('ti-level').textContent = t.level + 1;
            document.getElementById('ti-damage').textContent = lvl.damage;
            document.getElementById('ti-range').textContent = lvl.range;
            document.getElementById('ti-dps').textContent = (lvl.damage * 60 / lvl.cooldown).toFixed(1);

            const upgBtn = document.getElementById('upgrade-btn');
            const upgCost = t.getUpgradeCost();
            if (upgCost === null) {
                upgBtn.textContent = 'MAX';
                upgBtn.disabled = true;
                upgBtn.classList.add('maxed');
            } else {
                upgBtn.textContent = `⬆️ Ulepsz: ${upgCost}💰`;
                upgBtn.disabled = money < upgCost;
                upgBtn.classList.remove('maxed');
            }

            document.getElementById('sell-btn').textContent = `💰 Sprzedaj: ${t.getSellValue()}💰`;
        }

        function updateAbilityButtons() {
            const now = Date.now();
            for (const [key, cfg] of Object.entries(ABILITIES)) {
                const btn = document.getElementById(`${key}-btn`);
                if (!btn) continue;
                const cdLeft = Math.max(0, abilityCooldownUntil[key] - now);
                const canUse = gameState === 'PLAYING' && money >= cfg.cost && cdLeft === 0;
                btn.disabled = !canUse;
                if (cdLeft > 0) {
                    btn.querySelector('.ability-cd').textContent = `(${Math.ceil(cdLeft / 1000)}s)`;
                } else {
                    btn.querySelector('.ability-cd').textContent = '';
                }
            }
        }

        // ═══ TOWER SELECTION ═══
        function selectTower(type) {
            selectedTowerType = type;
            selectedMapTower = null;
            abilityMode = null;
            document.querySelectorAll('.tower-btn').forEach(btn => btn.classList.remove('selected'));
            document.querySelector(`.tower-btn[data-type="${type}"]`).classList.add('selected');
            updateUI();
        }

        function selectMapTower(tower) {
            selectedMapTower = tower;
            abilityMode = null;
            document.querySelectorAll('.tower-btn').forEach(btn => btn.classList.remove('selected'));
            updateUI();
        }

        function deselectMapTower() {
            selectedMapTower = null;
            document.querySelector(`.tower-btn[data-type="${selectedTowerType}"]`).classList.add('selected');
            updateUI();
        }

        function upgradeTower() {
            if (!selectedMapTower) return;
            const cost = selectedMapTower.getUpgradeCost();
            if (cost === null || money < cost) return;
            money -= cost;
            selectedMapTower.applyLevel(selectedMapTower.level + 1);
            updateUI();
        }

        function sellTower() {
            if (!selectedMapTower) return;
            money += selectedMapTower.getSellValue();
            const idx = towers.indexOf(selectedMapTower);
            if (idx !== -1) towers.splice(idx, 1);
            selectedMapTower = null;
            deselectMapTower();
        }

        // ═══ ZDOLNOŚCI ═══
        function activateBombard() {
            if (money < ABILITIES.bombard.cost) return;
            if (Date.now() < abilityCooldownUntil.bombard) return;
            if (gameState !== 'PLAYING') return;
            abilityMode = 'bombard';
            selectedMapTower = null;
            document.querySelectorAll('.tower-btn').forEach(btn => btn.classList.remove('selected'));
            canvas.style.cursor = 'crosshair';
        }

        function activateFreeze() {
            if (money < ABILITIES.freeze.cost) return;
            if (Date.now() < abilityCooldownUntil.freeze) return;
            if (gameState !== 'PLAYING') return;
            money -= ABILITIES.freeze.cost;
            abilityCooldownUntil.freeze = Date.now() + ABILITIES.freeze.cooldownMs;
            for (const e of enemies) {
                e.applySlow(ABILITIES.freeze.slowFactor, ABILITIES.freeze.durationFrames);
            }
            createParticles(canvas.width / 2, canvas.height / 2, '#93c5fd');
            updateUI();
        }

        // ═══ FALE ═══
        function startWave() {
            if (gameState === 'PLAYING') return;
            wave++;
            updateUI();
            document.getElementById('start-wave-btn').disabled = true;
            document.getElementById('start-wave-btn').innerText = "Walka trwa...";

            enemiesToSpawn = [];
            const normalCount = 4 + wave * 2;
            const fastCount = wave > 2 ? wave : 0;
            const tankCount = wave > 4 ? Math.floor(wave / 3) : 0;

            for (let i = 0; i < normalCount; i++) enemiesToSpawn.push('normal');
            for (let i = 0; i < fastCount; i++) enemiesToSpawn.push('fast');
            for (let i = 0; i < tankCount; i++) enemiesToSpawn.push('tank');
            enemiesToSpawn.sort(() => Math.random() - 0.5);

            if (wave % 5 === 0) enemiesToSpawn.push('boss');

            gameState = 'PLAYING';
            spawnTimer = 60;
        }

        function checkWaveEnd() {
            if (gameState === 'PLAYING' && enemiesToSpawn.length === 0 && enemies.length === 0) {
                gameState = 'IDLE';
                document.getElementById('start-wave-btn').disabled = false;
                document.getElementById('start-wave-btn').innerText = "Rozpocznij Falę";

                money += 40 + wave * 8;
                score += 50 * wave;
                lives += Math.min(3, Math.ceil(wave / 3));

                saveHighscore();
                updateUI();
            }
        }

        function gameOver() {
            gameState = 'GAMEOVER';
            document.getElementById('game-over-overlay').classList.add('active');
            document.getElementById('final-waves').innerText = wave;
            saveHighscore();
            updateUI();
        }

        // ═══ RYSOWANIE ═══
        function drawMap() {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = '#334155';
            for (let i = 0; i < pathGrid.length - 1; i++) {
                const p1 = pathGrid[i], p2 = pathGrid[i+1];
                const sx = Math.min(p1.x, p2.x) * CELL_SIZE;
                const sy = Math.min(p1.y, p2.y) * CELL_SIZE;
                ctx.fillRect(sx, sy, (Math.abs(p1.x - p2.x) + 1) * CELL_SIZE, (Math.abs(p1.y - p2.y) + 1) * CELL_SIZE);
            }

            const last = pathGrid[pathGrid.length - 1];
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.fillRect(last.x * CELL_SIZE, last.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = "#fff";
            ctx.fillText("🛡️", last.x * CELL_SIZE + CELL_SIZE / 2, last.y * CELL_SIZE + CELL_SIZE / 2);

            // boss wave indicator
            if (wave > 0 && wave % 5 === 4 && gameState === 'IDLE') {
                ctx.fillStyle = 'rgba(220, 38, 38, 0.15)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.font = "bold 16px Arial";
                ctx.fillStyle = '#ef4444';
                ctx.textAlign = 'center';
                ctx.fillText('⚠ NASTĘPNA FALA: BOSS ⚠', canvas.width / 2, 20);
            }
        }

        function drawPreview() {
            if (gameState === 'GAMEOVER') return;

            const gridX = Math.floor(mouseX / CELL_SIZE);
            const gridY = Math.floor(mouseY / CELL_SIZE);

            if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return;

            if (abilityMode === 'bombard') {
                const cx = gridX * CELL_SIZE + CELL_SIZE / 2;
                const cy = gridY * CELL_SIZE + CELL_SIZE / 2;
                ctx.beginPath();
                ctx.arc(cx, cy, ABILITIES.bombard.radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(249, 115, 22, 0.15)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
                ctx.lineWidth = 2;
                ctx.stroke();
                return;
            }

            if (selectedMapTower) {
                // show range of selected tower
                ctx.beginPath();
                ctx.arc(selectedMapTower.x, selectedMapTower.y, selectedMapTower.range, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(251, 191, 36, 0.05)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
                ctx.lineWidth = 1;
                ctx.stroke();
                return;
            }

            const stats = TOWER_DATA[selectedTowerType].levels[0];
            const isPath = isPathCell(gridX, gridY);
            const hasTower = towers.some(t => t.gridX === gridX && t.gridY === gridY);
            const canAfford = money >= stats.cost;
            const canBuild = !isPath && !hasTower && canAfford;

            ctx.fillStyle = canBuild ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)';
            ctx.fillRect(gridX * CELL_SIZE, gridY * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            ctx.beginPath();
            const cx = gridX * CELL_SIZE + CELL_SIZE / 2;
            const cy = gridY * CELL_SIZE + CELL_SIZE / 2;
            ctx.arc(cx, cy, stats.range, 0, Math.PI * 2);
            ctx.fillStyle = canBuild ? 'rgba(255,255,255,0.05)' : 'rgba(239,68,68,0.05)';
            ctx.fill();
            ctx.strokeStyle = canBuild ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // ═══ PĘTLA GRY ═══
        function gameLoop() {
            if (gameState !== 'GAMEOVER') {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (gameState === 'PLAYING') {
                    if (enemiesToSpawn.length > 0) {
                        spawnTimer--;
                        if (spawnTimer <= 0) {
                            const type = enemiesToSpawn.shift();
                            enemies.push(new Enemy(type, wave));
                            spawnTimer = type === 'boss' ? 80 : 40;
                        }
                    }
                }

                for (const t of towers) t.update();
                for (let i = enemies.length - 1; i >= 0; i--) {
                    enemies[i].update();
                    if (enemies[i].hp <= 0) enemies.splice(i, 1);
                }
                for (let i = projectiles.length - 1; i >= 0; i--) {
                    projectiles[i].update();
                    if (!projectiles[i].active) projectiles.splice(i, 1);
                }
                for (let i = particles.length - 1; i >= 0; i--) {
                    particles[i].update();
                    if (particles[i].life <= 0) particles.splice(i, 1);
                }
                for (let i = explosions.length - 1; i >= 0; i--) {
                    explosions[i].update();
                    if (explosions[i].life <= 0) explosions.splice(i, 1);
                }

                checkWaveEnd();

                drawMap();
                for (const t of towers) t.draw();
                for (const e of enemies) e.draw();
                for (const p of projectiles) p.draw();
                for (const ex of explosions) ex.draw();
                for (const pt of particles) pt.draw();
                drawPreview();
            }
            requestAnimationFrame(gameLoop);
        }

        // ═══ OBSŁUGA MYSZY ═══
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            mouseX = (e.clientX - rect.left) * scaleX;
            mouseY = (e.clientY - rect.top) * scaleY;
        });

        canvas.addEventListener('mouseout', () => { mouseX = -100; mouseY = -100; });

        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const rect = canvas.getBoundingClientRect();
            mouseX = (touch.clientX - rect.left) * (canvas.width / rect.width);
            mouseY = (touch.clientY - rect.top) * (canvas.height / rect.height);
            canvas.dispatchEvent(new MouseEvent('click'));
        }, { passive: false });

        canvas.addEventListener('click', () => {
            if (gameState === 'GAMEOVER') return;

            const gridX = Math.floor(mouseX / CELL_SIZE);
            const gridY = Math.floor(mouseY / CELL_SIZE);
            if (gridX < 0 || gridX >= COLS || gridY < 0 || gridY >= ROWS) return;

            // bombardment targeting
            if (abilityMode === 'bombard') {
                const cx = gridX * CELL_SIZE + CELL_SIZE / 2;
                const cy = gridY * CELL_SIZE + CELL_SIZE / 2;
                money -= ABILITIES.bombard.cost;
                abilityCooldownUntil.bombard = Date.now() + ABILITIES.bombard.cooldownMs;
                explosions.push(new Explosion(cx, cy, ABILITIES.bombard.radius, ABILITIES.bombard.damage));
                abilityMode = null;
                document.querySelector(`.tower-btn[data-type="${selectedTowerType}"]`).classList.add('selected');
                updateUI();
                return;
            }

            // click on existing tower → select it
            const clickedTower = towers.find(t => t.gridX === gridX && t.gridY === gridY);
            if (clickedTower) {
                if (selectedMapTower === clickedTower) {
                    deselectMapTower();
                } else {
                    selectMapTower(clickedTower);
                }
                return;
            }

            // deselect map tower if clicking elsewhere
            if (selectedMapTower) {
                deselectMapTower();
            }

            if (isPathCell(gridX, gridY)) return;

            const data = TOWER_DATA[selectedTowerType];
            if (money >= data.levels[0].cost) {
                money -= data.levels[0].cost;
                towers.push(new Tower(gridX, gridY, selectedTowerType));
                updateUI();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (abilityMode) { abilityMode = null; deselectMapTower(); }
                if (selectedMapTower) deselectMapTower();
            }
        });

        // ═══ GLOBALNE DLA HTML onclick ═══
        window.selectTower = selectTower;
        window.startWave = startWave;
        window.upgradeTower = upgradeTower;
        window.sellTower = sellTower;
        window.activateBombard = activateBombard;
        window.activateFreeze = activateFreeze;

        // ═══ INIT ═══
        function init() {
            loadHighscore();
            updateUI();
            requestAnimationFrame(gameLoop);
        }
        init();
