        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const overlay = document.getElementById('overlay');
        const overlayTitle = document.getElementById('overlay-title');
        const startBtn = document.getElementById('start-btn');
        const scoreDisplay = document.getElementById('current-score');
        const levelDisplay = document.getElementById('current-level');
        const highScoreDisplay = document.getElementById('high-score');
        const LOCAL_HIGHSCORE_KEY = 'ptak_highscore';

        // Baza Danych Firebase
        let db, auth, currentUser, appId;
        let highScore = 0;

        function loadLocalHighscore() {
            const stored = localStorage.getItem(LOCAL_HIGHSCORE_KEY);
            const parsed = stored !== null ? parseInt(stored, 10) : 0;
            return Number.isFinite(parsed) ? parsed : 0;
        }

        function syncHighscoreDisplay() {
            highScoreDisplay.innerText = highScore;
        }

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
                    if (user) {
                        await loadHighscore();
                    }
                });
            }
        } catch (e) {
            console.warn("Błąd Firebase:", e);
        }

        async function loadHighscore() {
            highScore = loadLocalHighscore();
            syncHighscoreDisplay();

            if (!currentUser || !db) return;
            try {
                const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'records', 'flappy_highscore');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    highScore = Math.max(highScore, docSnap.data().score || 0);
                    localStorage.setItem(LOCAL_HIGHSCORE_KEY, String(highScore));
                    syncHighscoreDisplay();
                }
            } catch (error) {
                console.error("Błąd ładowania rekordu:", error);
            }
        }

        async function saveHighscore() {
            if (score <= highScore) return;

            highScore = score;
            localStorage.setItem(LOCAL_HIGHSCORE_KEY, String(highScore));
            syncHighscoreDisplay();

            if (!currentUser || !db) return;

            try {
                const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'records', 'flappy_highscore');
                await setDoc(docRef, { score: highScore });
            } catch (error) {
                console.error("Błąd zapisu rekordu:", error);
            }
        }

        // Zmienne Gry
        let frames = 0;
        let score = 0;
        let level = 1;
        let gameState = 'START'; // START, PLAYING, GAMEOVER
        let animationReq;

        // Parametry Fizyki i Rur
        const GRAVITY = 0.25;
        const JUMP = -4.5;
        const BASE_SPEED = 2;
        let currentSpeed = BASE_SPEED;
        const PIPE_WIDTH = 50;
        const PIPE_GAP = 130; // Odstęp pionowy między rurami (trudność)

        // Paleta kolorów dla rur na różnych poziomach
        const PIPE_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ec4899', '#a855f7', '#f97316', '#ef4444'];

        // Obiekty
        const bird = {
            x: 50,
            y: 150,
            width: 30,
            height: 20,
            velocity: 0,
            rotation: 0,
            
            draw() {
                ctx.save();
                ctx.translate(this.x + this.width/2, this.y + this.height/2);
                
                // Rotacja zależna od prędkości (spada = patrzy w dół, leci = patrzy w górę)
                this.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.1)));
                ctx.rotate(this.rotation);
                
                // Rysowanie ptaka (prosty kształt, żeby unikać ładowania zewnętrznych obrazków)
                ctx.fillStyle = '#fbbf24'; // Żółty tułów
                ctx.beginPath();
                ctx.ellipse(0, 0, this.width/2, this.height/2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#000';
                ctx.stroke();

                // Skrzydło
                ctx.fillStyle = '#fef3c7';
                ctx.beginPath();
                // Animacja machania
                const wingY = (gameState === 'PLAYING' && frames % 10 < 5) ? 5 : 0;
                ctx.ellipse(-5, wingY, 8, 5, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Oko
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(8, -4, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(10, -4, 1.5, 0, Math.PI * 2);
                ctx.fill();

                // Dziób
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.moveTo(12, 2);
                ctx.lineTo(20, 5);
                ctx.lineTo(12, 8);
                ctx.fill();
                ctx.stroke();

                ctx.restore();
            },
            
            update() {
                this.velocity += GRAVITY;
                this.y += this.velocity;

                // Uderzenie w ziemię
                if (this.y + this.height >= canvas.height - 40) { // -40 bo jest "ziemia" na dole
                    this.y = canvas.height - 40 - this.height;
                    gameOver();
                }
                
                // Dotknięcie "sufitu" nie zabija, ale blokuje lot w górę
                if (this.y <= 0) {
                    this.y = 0;
                    this.velocity = 0;
                }
            },

            flap() {
                this.velocity = JUMP;
            },
            
            reset() {
                this.y = 150;
                this.velocity = 0;
                this.rotation = 0;
            }
        };

        const pipes = {
            list: [],
            distanceSinceLastPipe: 200, // Zaczynamy od 200 by pierwsza rura wygenerowała się od razu
            spawnCount: 0, // DODANE: Licznik wygenerowanych rur
            
            draw() {
                for (let i = 0; i < this.list.length; i++) {
                    let p = this.list[i];
                    
                    // Kolor rury przypisany na stałe do obiektu w momencie jej wygenerowania
                    ctx.fillStyle = p.color;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;

                    // Górna rura
                    ctx.fillRect(p.x, 0, PIPE_WIDTH, p.top);
                    ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.top);
                    // Kołnierz górny
                    ctx.fillRect(p.x - 2, p.top - 15, PIPE_WIDTH + 4, 15);
                    ctx.strokeRect(p.x - 2, p.top - 15, PIPE_WIDTH + 4, 15);

                    // Dolna rura
                    ctx.fillRect(p.x, p.bottom, PIPE_WIDTH, canvas.height - p.bottom - 40);
                    ctx.strokeRect(p.x, p.bottom, PIPE_WIDTH, canvas.height - p.bottom - 40);
                    // Kołnierz dolny
                    ctx.fillRect(p.x - 2, p.bottom, PIPE_WIDTH + 4, 15);
                    ctx.strokeRect(p.x - 2, p.bottom, PIPE_WIDTH + 4, 15);
                }
            },
            
            update() {
                // Generowanie nowej rury w oparciu o przebyty dystans
                this.distanceSinceLastPipe += currentSpeed;
                if (this.distanceSinceLastPipe >= 200) {
                    this.distanceSinceLastPipe -= 200; // Reset dystansu

                    // Min wysokość górnej rury to 50, max to (wysokość canvasa - ziemia - luka - min dolnej)
                    let minHeight = 50;
                    let maxHeight = canvas.height - 40 - PIPE_GAP - minHeight;
                    let topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);

                    // Zwiększamy licznik i obliczamy kolor dla nowej rury
                    this.spawnCount++;
                    let pipeLevel = Math.floor((this.spawnCount - 1) / 15);
                    let colorIndex = pipeLevel % PIPE_COLORS.length;

                    this.list.push({
                        x: canvas.width,
                        top: topHeight,
                        bottom: topHeight + PIPE_GAP,
                        passed: false, // Flaga czy gracz zdobył punkt
                        color: PIPE_COLORS[colorIndex] // Zapisujemy kolor dla tej konkretnej rury
                    });
                }

                for (let i = 0; i < this.list.length; i++) {
                    let p = this.list[i];
                    
                    // Poruszanie rury
                    p.x -= currentSpeed;

                    // Wykrywanie kolizji
                    // Najpierw sprawdzamy oś X
                    if (bird.x + bird.width > p.x && bird.x < p.x + PIPE_WIDTH) {
                        // Jeśli nachodzi na X, sprawdzamy oś Y (czy uderzył w górną lub dolną)
                        if (bird.y < p.top || bird.y + bird.height > p.bottom) {
                            gameOver();
                        }
                    }

                    // Zdobywanie punktów
                    if (p.x + PIPE_WIDTH < bird.x && !p.passed) {
                        score++;
                        scoreDisplay.innerText = score;
                        p.passed = true;

                        // Awans na kolejny poziom co 15 punktów
                        let newLevel = Math.floor(score / 15) + 1;
                        if (newLevel > level) {
                            level = newLevel;
                            levelDisplay.innerText = level;
                            currentSpeed = BASE_SPEED + (level - 1) * 0.5; // Zwiększamy prędkość
                        }
                    }

                    // Usuwanie starych rur (optymalizacja)
                    if (p.x + PIPE_WIDTH < 0) {
                        this.list.shift();
                        i--; // Zmniejszamy index bo usunęliśmy element
                    }
                }
            },
            
            reset() {
                this.list = [];
                this.distanceSinceLastPipe = 200;
                this.spawnCount = 0; // Resetujemy licznik
            }
        };

        const ground = {
            x: 0,
            y: canvas.height - 40,
            width: canvas.width,
            height: 40,
            
            draw() {
                // Ziemia
                ctx.fillStyle = '#ded895';
                ctx.fillRect(0, this.y, this.width, this.height);
                
                // Górny pasek ziemi (trawa)
                ctx.fillStyle = '#84cc16';
                ctx.fillRect(this.x, this.y, this.width + 100, 10); // Szersze dla płynności ruchu
                ctx.strokeRect(this.x, this.y, this.width + 100, 10);
                
                // Diagonale na trawie do animacji ruchu
                ctx.beginPath();
                ctx.strokeStyle = '#4d7c0f';
                for(let i=0; i<this.width+100; i+=20) {
                    ctx.moveTo(this.x + i, this.y);
                    ctx.lineTo(this.x + i - 10, this.y + 10);
                }
                ctx.stroke();
            },
            
            update() {
                // Iluzja ruchu ziemi
                if(gameState === 'PLAYING') {
                    this.x = (this.x - currentSpeed) % 20; // reset co 20px dla płynnej pętli
                }
            }
        }

        function drawBackground() {
            // Chmurki (stałe elementy dla ozdoby)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(100, 100, 20, 0, Math.PI*2);
            ctx.arc(120, 100, 25, 0, Math.PI*2);
            ctx.arc(140, 100, 20, 0, Math.PI*2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(300, 60, 15, 0, Math.PI*2);
            ctx.arc(315, 60, 20, 0, Math.PI*2);
            ctx.arc(330, 60, 15, 0, Math.PI*2);
            ctx.fill();
            
            // Miasto w tle
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(0, ground.y - 30, canvas.width, 30);
            ctx.fillRect(20, ground.y - 50, 40, 50);
            ctx.fillRect(80, ground.y - 70, 30, 70);
            ctx.fillRect(200, ground.y - 40, 50, 40);
            ctx.fillRect(280, ground.y - 60, 40, 60);
            ctx.fillRect(350, ground.y - 45, 30, 45);
        }

        // --- Logika Kontroli ---
        
        function flap() {
            if (gameState === 'PLAYING') {
                bird.flap();
            } else if (gameState === 'START') {
                // Rozpoczęcie gry jeśli ekran tytułowy/koncowy jest schowany (po kliknieciu guzika)
                if(!overlay.classList.contains('active')) {
                    gameState = 'PLAYING';
                    bird.flap();
                }
            }
        }

        canvas.addEventListener('mousedown', flap);
        canvas.addEventListener('touchstart', (e) => { e.preventDefault(); flap(); }, {passive: false});
        
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault(); // Zablokuj przewijanie strony
                flap();
            }
        });

        startBtn.addEventListener('click', () => {
            resetGame();
            overlay.classList.remove('active');
        });

        // --- Pętla Gry ---

        function resetGame() {
            bird.reset();
            pipes.reset();
            score = 0;
            level = 1;
            currentSpeed = BASE_SPEED;
            scoreDisplay.innerText = score;
            levelDisplay.innerText = level;
            frames = 0;
            gameState = 'START';
            
            // Rysowanie pierwszej klatki by pokazać ptaka w pozycji startowej
            draw(); 
        }

        function gameOver() {
            gameState = 'GAMEOVER';
            saveHighscore();
            
            overlayTitle.innerHTML = 'KONIEC<br>GRY';
            startBtn.innerText = 'JESZCZE RAZ';
            overlay.classList.add('active');
        }

        function update() {
            if (gameState === 'PLAYING') {
                bird.update();
                pipes.update();
                ground.update();
                frames++;
            } else if (gameState === 'GAMEOVER') {
                // Ptak spada po śmierci
                bird.update();
            }
        }

        function draw() {
            // Czyszczenie i tło
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBackground();
            
            // Obiekty
            pipes.draw();
            ground.draw(); // Ziemia zasłania dół rur
            bird.draw();
        }

        function loop() {
            update();
            draw();
            animationReq = requestAnimationFrame(loop);
        }

        // Uruchomienie pierwszej klatki
        loadHighscore().then(() => {
            draw();
            loop();
        });
