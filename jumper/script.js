        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const overlay = document.getElementById('overlay');
        const overlayTitle = document.getElementById('overlay-title');
        const overlayDesc = document.getElementById('overlay-desc');
        const startBtn = document.getElementById('start-btn');
        
        let db, auth, currentUser, appId;
        let highScore = 0;

        const LS_KEY = 'neonJumperHighscore';

        function loadHighscoreLocal() {
            const saved = parseInt(localStorage.getItem(LS_KEY)) || 0;
            if (saved > highScore) {
                highScore = saved;
                document.getElementById('highscore-display').innerText = highScore;
            }
        }

        function saveHighscoreLocal() {
            if (score > highScore) {
                highScore = score;
                document.getElementById('highscore-display').innerText = highScore;
                localStorage.setItem(LS_KEY, highScore);
            }
        }

        async function loadHighscore() {
            loadHighscoreLocal();
            if (!currentUser || !db) return;
            try {
                const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'records', 'neon_highscore');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const cloudScore = docSnap.data().score || 0;
                    if (cloudScore > highScore) {
                        highScore = cloudScore;
                        document.getElementById('highscore-display').innerText = highScore;
                        localStorage.setItem(LS_KEY, highScore);
                    }
                }
            } catch (e) {}
        }

        async function saveHighscore() {
            saveHighscoreLocal();
            if (!currentUser || !db) return;
            try {
                const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'records', 'neon_highscore');
                await setDoc(docRef, { score: highScore });
            } catch (e) {}
        }

        // Firebase Setup
        loadHighscoreLocal();
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
                    } else {
                        await signInAnonymously(auth);
                    }
                };
                initAuth();

                onAuthStateChanged(auth, async (user) => {
                    currentUser = user;
                    if (user) await loadHighscore();
                });
            }
        } catch (e) { console.warn("Firebase Init Error"); }

        let score = 0;
        let level = 1;
        let lives = 3;
        let gameState = 'START'; // START, PLAYING, GAMEOVER, NEXT_LEVEL
        let animationReq;
        
        // Obiekty gry
        let player;
        let platforms = [];
        let orbs = [];
        let enemies = [];
        let particles = [];

        // Definicje Map (3 różne układy platform, powtarzane cyklicznie)
        const MAP_LAYOUTS = [
            // Layout 0: Klasyczny 3-poziomowy
            [
                {x: 100, y: 150, w: 200}, {x: 500, y: 150, w: 200},
                {x: 300, y: 300, w: 200},
                {x: 50, y: 450, w: 250}, {x: 500, y: 450, w: 250}
            ],
            // Layout 1: Piramida
            [
                {x: 350, y: 150, w: 100},
                {x: 250, y: 280, w: 300},
                {x: 150, y: 420, w: 500},
                {x: 20, y: 520, w: 150}, {x: 630, y: 520, w: 150}
            ],
            // Layout 2: Rozrzucone wysepki
            [
                {x: 100, y: 200, w: 100}, {x: 400, y: 120, w: 100}, {x: 600, y: 250, w: 100},
                {x: 250, y: 350, w: 100}, {x: 500, y: 400, w: 100},
                {x: 50, y: 500, w: 150}, {x: 650, y: 500, w: 100}, {x: 350, y: 520, w: 100}
            ]
        ];

        const keys = { left: false, right: false, up: false, down: false };

        window.addEventListener('keydown', (e) => {
            if(e.code === 'ArrowLeft') keys.left = true;
            if(e.code === 'ArrowRight') keys.right = true;
            if(e.code === 'ArrowDown') { keys.down = true; e.preventDefault(); }
            if(e.code === 'ArrowUp' || e.code === 'Space') {
                keys.up = true;
                if(gameState === 'START' || gameState === 'GAMEOVER') startGame();
                else e.preventDefault(); // Zapobiega skrolowaniu
            }
        });

        window.addEventListener('keyup', (e) => {
            if(e.code === 'ArrowLeft') keys.left = false;
            if(e.code === 'ArrowRight') keys.right = false;
            if(e.code === 'ArrowDown') keys.down = false;
            if(e.code === 'ArrowUp' || e.code === 'Space') keys.up = false;
        });

        // Touch Controls
        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnJump = document.getElementById('btn-jump');

        const addTouch = (elem, keyName) => {
            elem.addEventListener('touchstart', (e) => { e.preventDefault(); keys[keyName] = true; if(keyName==='up' && (gameState === 'START' || gameState === 'GAMEOVER')) startGame(); });
            elem.addEventListener('touchend', (e) => { e.preventDefault(); keys[keyName] = false; });
        };
        addTouch(btnLeft, 'left');
        addTouch(btnRight, 'right');
        addTouch(btnJump, 'up');

        class Player {
            constructor() {
                this.w = 24;
                this.h = 32;
                this.invulnerableTimer = 0;
                this.prevJumpKey = false;
                this.hasDoubleJumped = false;
                this.reset();
                this.speed = 5;
                this.jumpPower = -12;
                this.gravity = 0.5;
            }

            reset() {
                this.x = 400 - this.w/2;
                this.y = 500;
                this.vx = 0;
                this.vy = 0;
                this.isGrounded = false;
                this.hasDoubleJumped = false;
                this.prevJumpKey = false;
                this.invulnerableTimer = 120; // 2 sekundy nietykalności po starcie lub utracie życia (przy 60 FPS)
            }

            update() {
                if (this.invulnerableTimer > 0) this.invulnerableTimer--;

                // Ruch X
                if (keys.left) this.vx = -this.speed;
                else if (keys.right) this.vx = this.speed;
                else this.vx *= 0.8; // Tarcie
                
                this.x += this.vx;

                // Zawijanie ekranu (Bomb Jack style)
                if (this.x > canvas.width) this.x = -this.w;
                if (this.x < -this.w) this.x = canvas.width;

                // Skok i Grawitacja (Y)
                let currentGravity = this.gravity;
                
                // Szybowanie: jeśli opada i trzyma UP, spada wolniej
                if (this.vy > 0 && keys.up) {
                    currentGravity = 0.1; 
                }

                // Szybkie opadanie: strzałka w dół
                if (!this.isGrounded && keys.down) {
                    currentGravity = this.gravity * 4;
                }

                this.vy += currentGravity;
                
                // Wykrywanie POJEDYNCZEGO naciśnięcia klawisza skoku
                let jumpJustPressed = keys.up && !this.prevJumpKey;
                
                if (jumpJustPressed) {
                    if (this.isGrounded) {
                        // Pierwszy skok z ziemi/platformy
                        this.vy = this.jumpPower;
                        this.isGrounded = false;
                        this.hasDoubleJumped = false;
                    } else if (!this.hasDoubleJumped) {
                        // Drugi skok (z powietrza)
                        this.vy = this.jumpPower; 
                        this.hasDoubleJumped = true;
                        // Efekt odrzutu/chmurki przy podwójnym skoku
                        if (typeof createExplosion === 'function') {
                            createExplosion(this.x + this.w/2, this.y + this.h, '#ffffff', 10);
                        }
                    }
                }
                
                // Zapisujemy stan klawisza na następną klatkę
                this.prevJumpKey = keys.up;

                let prevY = this.y;
                this.y += this.vy;
                this.isGrounded = false;

                // Ograniczenie góry planszy (sufit)
                if (this.y < 0) {
                    this.y = 0;
                    this.vy = 0; // Zatrzymuje wznoszenie po uderzeniu w sufit
                }

                // Podłoga canvasa
                if (this.y > canvas.height - this.h) {
                    this.y = canvas.height - this.h;
                    this.vy = 0;
                    this.isGrounded = true;
                    this.hasDoubleJumped = false; // Reset podwójnego skoku
                }

                // Kolizja z platformami (Tylko jeśli opada!)
                if (this.vy > 0) {
                    for (let p of platforms) {
                        // Sprawdzamy czy nachodzi w X
                        if (this.x + this.w > p.x && this.x < p.x + p.w) {
                            // Sprawdzamy czy WŁAŚNIE przekroczył górną krawędź platformy
                            if (prevY + this.h <= p.y && this.y + this.h >= p.y) {
                                this.y = p.y - this.h;
                                this.vy = 0;
                                this.isGrounded = true;
                                this.hasDoubleJumped = false; // Reset podwójnego skoku
                            }
                        }
                    }
                }
            }

            draw() {
                // Mruganie podczas nietykalności
                if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 10) % 2 === 0) return;

                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#0ff';
                ctx.fillStyle = '#e0ffff';
                
                // Rysowanie "Neona" (prosty robot)
                ctx.beginPath();
                ctx.roundRect(this.x, this.y, this.w, this.h, 5);
                ctx.fill();
                
                // Oko / wizjer
                ctx.fillStyle = '#050510';
                ctx.shadowBlur = 0;
                let dirOffset = keys.right ? 6 : (keys.left ? 2 : 4);
                ctx.fillRect(this.x + dirOffset, this.y + 6, 14, 6);
                
                ctx.fillStyle = '#0ff';
                ctx.fillRect(this.x + dirOffset + 2, this.y + 8, 4, 2);

                // Ogień z jetpacka przy skoku/szybowaniu
                if (!this.isGrounded && this.vy > 0 && keys.up) {
                    ctx.fillStyle = '#f0f';
                    ctx.shadowColor = '#f0f';
                    ctx.shadowBlur = 10;
                    ctx.beginPath();
                    ctx.moveTo(this.x + 6, this.y + this.h);
                    ctx.lineTo(this.x + 18, this.y + this.h);
                    ctx.lineTo(this.x + 12, this.y + this.h + Math.random() * 15 + 10);
                    ctx.fill();
                }

                ctx.restore();
            }
        }

        class Platform {
            constructor(x, y, w) {
                this.x = x; this.y = y; this.w = w; this.h = 10;
            }
            draw() {
                ctx.save();
                ctx.fillStyle = '#1e1e40';
                ctx.strokeStyle = '#0ff';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#0ff';
                
                ctx.beginPath();
                ctx.roundRect(this.x, this.y, this.w, this.h, 5);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        class Orb {
            constructor(x, y) {
                this.x = x; this.y = y; this.radius = 12;
                this.isActive = false;
                this.hoverY = 0;
                this.time = Math.random() * 100;
            }
            draw() {
                this.time += 0.1;
                this.hoverY = Math.sin(this.time) * 5;

                ctx.save();
                ctx.beginPath();
                ctx.arc(this.x, this.y + this.hoverY, this.radius, 0, Math.PI * 2);
                
                if (this.isActive) {
                    ctx.fillStyle = '#fff';
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#f0f';
                    ctx.strokeStyle = '#f0f';
                } else {
                    ctx.fillStyle = '#fbbf24';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#fbbf24';
                    ctx.strokeStyle = '#fff';
                }
                
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Wewnętrzny blask dla aktywnego
                if(this.isActive) {
                    ctx.fillStyle = '#f0f';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y + this.hoverY, this.radius/2, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        class Particle {
            constructor(x, y, color) {
                this.x = x; this.y = y;
                this.color = color;
                let angle = Math.random() * Math.PI * 2;
                let spd = Math.random() * 3 + 1;
                this.vx = Math.cos(angle) * spd;
                this.vy = Math.sin(angle) * spd;
                this.life = 1.0;
            }
            update() {
                this.x += this.vx; this.y += this.vy;
                this.life -= 0.05;
            }
            draw() {
                ctx.globalAlpha = Math.max(0, this.life);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 3, 0, Math.PI*2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        class Enemy {
            constructor(lvl) {
                this.radius = 15;
                // Losowy spawn na górze ekranu
                this.x = Math.random() * (canvas.width - 40) + 20;
                this.y = -20; 
                
                // Bouncer - odbija się od ścian i losowo zmienia kierunek
                let speedMult = 1 + (lvl * 0.15); // Przyspieszają z poziomem
                this.vx = (Math.random() > 0.5 ? 2 : -2) * speedMult;
                this.vy = (2 + Math.random() * 2) * speedMult;
                this.time = 0;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.time += 0.1;

                // Odbijanie od krawędzi
                if (this.x - this.radius < 0) { this.x = this.radius; this.vx *= -1; }
                if (this.x + this.radius > canvas.width) { this.x = canvas.width - this.radius; this.vx *= -1; }
                
                // Odbijanie góra dół
                if (this.y - this.radius < 0 && this.vy < 0) { this.vy *= -1; }
                if (this.y + this.radius > canvas.height) { this.y = canvas.height - this.radius; this.vy *= -1; }

                // Lekkie homingowanie na gracza co jakiś czas
                if (Math.random() < 0.01) {
                    this.vx = (player.x > this.x ? Math.abs(this.vx) : -Math.abs(this.vx));
                }
            }
            draw() {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.time);
                
                ctx.fillStyle = '#050510';
                ctx.strokeStyle = '#f00';
                ctx.lineWidth = 3;
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#f00';

                // Kolczasta kula
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    let a = (i / 8) * Math.PI * 2;
                    let r = i % 2 === 0 ? this.radius : this.radius - 8;
                    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                
                ctx.fillStyle = '#f00';
                ctx.beginPath();
                ctx.arc(0,0, 4, 0, Math.PI*2);
                ctx.fill();

                ctx.restore();
            }
        }

        function loadLevel() {
            platforms = [];
            orbs = [];
            enemies = [];
            
            // Wybór mapy na podstawie poziomu
            let mapIndex = (level - 1) % MAP_LAYOUTS.length;
            let layout = MAP_LAYOUTS[mapIndex];

            // Budowanie platform z układu
            for (let p of layout) {
                platforms.push(new Platform(p.x, p.y, p.w));
                // Na każdej platformie stawiamy Rdzeń (Orb)
                orbs.push(new Orb(p.x + p.w/2, p.y - 25));
            }
            
            // Dodanie kilku losowych ordbów na podłodze
            orbs.push(new Orb(150, canvas.height - 25));
            orbs.push(new Orb(canvas.width - 150, canvas.height - 25));

            setActiveOrb();

            // Dodawanie wrogów (ilość zależy od poziomu)
            let enemyCount = Math.min(2 + Math.floor(level / 2), 7); // Max 7 wrogów
            for(let i=0; i<enemyCount; i++) {
                enemies.push(new Enemy(level));
            }
            
            // Gracz na środku podłogi
            player.reset();
        }

        function setActiveOrb() {
            if (orbs.length === 0) return;
            // Zresetuj wszystkie
            orbs.forEach(o => o.isActive = false);
            // Wybierz losowy
            let idx = Math.floor(Math.random() * orbs.length);
            orbs[idx].isActive = true;
        }

        function createExplosion(x, y, color, amount) {
            for(let i=0; i<amount; i++) {
                particles.push(new Particle(x, y, color));
            }
        }

        startBtn.addEventListener('click', () => {
            if (gameState === 'START' || gameState === 'GAMEOVER') {
                startGame();
            }
        });

        function startGame() {
            score = 0;
            level = 1;
            lives = 3;
            player = new Player();
            loadLevel();
            updateUI();
            gameState = 'PLAYING';
            overlay.classList.remove('active');
        }

        function gameOver() {
            gameState = 'GAMEOVER';
            saveHighscore();
            if (score > 0 && window.GryScores && GryScores.submit) GryScores.submit('jumper', score, {}); // każdy wynik -> chmura
            overlayTitle.innerHTML = 'KONIEC<br>GRY';
            overlayDesc.innerText = `Ukończyłeś ${level-1} poziomów i zdobyłeś ${score} punktów!`;
            startBtn.innerText = 'JESZCZE RAZ';
            overlay.classList.add('active');
        }

        function levelComplete() {
            gameState = 'NEXT_LEVEL';
            level++;
            updateUI();
            
            // Krótka pauza i nowy poziom
            setTimeout(() => {
                if(gameState !== 'GAMEOVER') {
                    loadLevel();
                    gameState = 'PLAYING';
                }
            }, 1500);
        }

        function updateUI() {
            document.getElementById('score-display').innerText = score;
            document.getElementById('level-display').innerText = level;
            
            let hearts = "";
            for(let i=0; i<lives; i++) hearts += "❤️";
            document.getElementById('lives-display').innerText = hearts || "💀";
        }

        function checkCollisions() {
            // Zbieranie rdzeni
            for (let i = orbs.length - 1; i >= 0; i--) {
                let orb = orbs[i];
                // Prosta kolizja okrąg - prostokąt
                let distX = Math.abs(orb.x - player.x - player.w/2);
                let distY = Math.abs(orb.y - player.y - player.h/2);

                if (distX < (player.w/2 + orb.radius) && distY < (player.h/2 + orb.radius)) {
                    // Zebrano!
                    if (orb.isActive) {
                        score += 50;
                        createExplosion(orb.x, orb.y, '#f0f', 20);
                        document.getElementById('score-display').classList.add('score-active');
                        setTimeout(() => document.getElementById('score-display').classList.remove('score-active'), 300);
                    } else {
                        score += 10;
                        createExplosion(orb.x, orb.y, '#fbbf24', 10);
                    }
                    
                    orbs.splice(i, 1);
                    updateUI();
                    
                    if (orbs.length > 0) {
                        if(orb.isActive) setActiveOrb(); // Jeśli zebrano aktywny, wylosuj nowy aktywny
                    } else {
                        levelComplete();
                    }
                }
            }

            // Kolizja z wrogami
            for (let e of enemies) {
                let distX = Math.abs(e.x - player.x - player.w/2);
                let distY = Math.abs(e.y - player.y - player.h/2);
                
                // Mniejszy hitbox dla gracza żeby wybaczał błędy
                if (distX < (player.w/2 + e.radius - 5) && distY < (player.h/2 + e.radius - 5)) {
                    if (player.invulnerableTimer <= 0) {
                        createExplosion(player.x + player.w/2, player.y + player.h/2, '#0ff', 30);
                        lives--;
                        updateUI();
                        
                        if (lives <= 0) {
                            gameOver();
                        } else {
                            player.reset(); // Przywraca postać na środek ekranu z nietykalnością
                        }
                    }
                }
            }
        }

        function gameLoop() {
            // Tło z efektem siatki/wygaszania
            ctx.fillStyle = 'rgba(5, 5, 16, 0.4)'; // Lekki motion blur
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (gameState === 'PLAYING' || gameState === 'NEXT_LEVEL') {
                
                if(gameState === 'PLAYING') {
                    player.update();
                    enemies.forEach(e => e.update());
                    checkCollisions();
                }
                
                particles.forEach(p => p.update());
                // Usuwanie martwych cząsteczek
                particles = particles.filter(p => p.life > 0);

                // Rysowanie
                platforms.forEach(p => p.draw());
                orbs.forEach(o => o.draw());
                enemies.forEach(e => e.draw());
                particles.forEach(p => p.draw());
                if(gameState === 'PLAYING') player.draw();

                // Napis "Poziom ukończony"
                if(gameState === 'NEXT_LEVEL') {
                    ctx.save();
                    ctx.fillStyle = '#0ff';
                    ctx.font = '40px Orbitron';
                    ctx.textAlign = 'center';
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = '#0ff';
                    ctx.fillText("POZIOM UKOŃCZONY!", canvas.width/2, canvas.height/2);
                    ctx.restore();
                }
            }

            animationReq = requestAnimationFrame(gameLoop);
        }

        // Uruchomienie animacji tła dla menu startowego
        player = new Player(); // Dummy player
        platforms.push(new Platform(100, 500, 600));
        gameLoop();
