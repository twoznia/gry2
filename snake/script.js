        // Konfiguracja i Stan Gry
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');

        // Ustawienie wymiarów renderowania Canvasu dla lepszej ostrości
        const RESOLUTION = 400;
        canvas.width = RESOLUTION;
        canvas.height = RESOLUTION;

        const GRID_SIZE = 20; // 20x20 pól
        const CELL_SIZE = RESOLUTION / GRID_SIZE;

        // Stan Gry
        let snake = [];
        let food = { x: 0, y: 0 };
        let dx = 1; // Prędkość początkowa w osi X
        let dy = 0; // Prędkość początkowa w osi Y
        let score = 0;
        let highScore = parseInt(localStorage.getItem('snake_high_score')) || 0;
        let gameSpeed = 150; // ms na klatkę (wolniejszy start)
        let gameInterval = null;
        let isPaused = false;
        let isGameOver = false;
        let isStarted = false;
        
        // Stan Super Jedzenia (Bonus Food)
        let bonusState = 'inactive'; // 'inactive' lub 'active'
        let bonusTimer = 10000; // 10 sekund w milisekundach (czas trwania / oczekiwania)
        let bonusFood = { x: -1, y: -1 };
        
        // Dynamiczne zapobieganie ruchom wstecznym w tej samej klatce
        let changingDirection = false; 

        // Opcje wizualne (skórki)
        let selectedDifficulty = 'medium';
        let selectedSkin = 'classic';
        let isMuted = true; // Domyślnie wyciszone zgodnie z życzeniem

        const skins = {
            classic: {
                head: '#10b981', // emerald-500
                body: '#34d399', // emerald-400
                glow: 'rgba(16, 185, 129, 0.6)',
                food: '#f43f5e', // rose-500
                foodGlow: 'rgba(244, 63, 94, 0.7)'
            },
            cyberpunk: {
                head: '#ec4899', // pink-500
                body: '#f43f5e', // rose-500
                glow: 'rgba(236, 72, 153, 0.6)',
                food: '#eab308', // yellow-500
                foodGlow: 'rgba(234, 179, 8, 0.7)'
            },
            aqua: {
                head: '#06b6d4', // cyan-500
                body: '#22d3ee', // cyan-400
                glow: 'rgba(6, 182, 212, 0.6)',
                food: '#a855f7', // purple-500
                foodGlow: 'rgba(168, 85, 247, 0.7)'
            },
            gold: {
                head: '#f59e0b', // amber-500
                body: '#fbbf24', // amber-400
                glow: 'rgba(245, 158, 11, 0.6)',
                food: '#3b82f6', // blue-500
                foodGlow: 'rgba(59, 130, 246, 0.7)'
            }
        };

        // Aktualizacja rekordu na starcie
        document.getElementById('high-score').innerText = highScore;

        // Web Audio API do generowania retro dźwięków bez zewnętrznych plików audio
        let audioCtx = null;

        function initAudio() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
        }

        function playSound(type) {
            if (isMuted) return;
            initAudio();
            if (!audioCtx) return;

            // Obsługa stanu zablokowanego audio contextu na mobilkach
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            if (type === 'eat') {
                // Przyjemny, wysoki sygnał ześlizgujący się do góry przy jedzeniu
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
                osc.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.15); // C6
                gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.16);
            } else if (type === 'die') {
                // Niski, spadający dźwięk przegranej
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
                osc.frequency.exponentialRampToValueAtTime(55, audioCtx.currentTime + 0.4); // A1
                gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.45);
            } else if (type === 'turn') {
                // Subtelny, bardzo krótki "klik" przy zmianie kierunku
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, audioCtx.currentTime);
                gainNode.gain.setValueAtTime(0.02, audioCtx.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
                osc.start();
                osc.stop(audioCtx.currentTime + 0.05);
            }
        }

        function toggleMute() {
            isMuted = !isMuted;
            const icon = document.getElementById('mute-icon');
            if (isMuted) {
                icon.className = 'fa-solid fa-volume-xmark text-sm text-rose-500';
            } else {
                icon.className = 'fa-solid fa-volume-high text-sm';
                playSound('turn');
            }
        }

        // Sterowanie Klawiaturą PC
        window.addEventListener('keydown', e => {
            // Zapobieganie przewijaniu strony spacją i strzałkami
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
            
            if (!isStarted || isGameOver) {
                if (e.code === 'Enter' || e.code === 'Space') {
                    startGame();
                }
                return;
            }

            if (e.code === 'Space') {
                togglePause();
                return;
            }

            if (isPaused) return;

            const keyPressed = e.code;
            handleDirectionChange(keyPressed);
        });

        function handleDirectionChange(key) {
            if (changingDirection) return;

            const goingUp = dy === -1;
            const goingDown = dy === 1;
            const goingRight = dx === 1;
            const goingLeft = dx === -1;

            if ((key === 'ArrowLeft' || key === 'KeyA') && !goingRight) {
                dx = -1; dy = 0;
                playSound('turn');
                changingDirection = true;
            }
            if ((key === 'ArrowUp' || key === 'KeyW') && !goingDown) {
                dx = 0; dy = -1;
                playSound('turn');
                changingDirection = true;
            }
            if ((key === 'ArrowRight' || key === 'KeyD') && !goingLeft) {
                dx = 1; dy = 0;
                playSound('turn');
                changingDirection = true;
            }
            if ((key === 'ArrowDown' || key === 'KeyS') && !goingUp) {
                dx = 0; dy = 1;
                playSound('turn');
                changingDirection = true;
            }
        }

        // Sterowanie za pomocą D-Pada (Mobilne)
        function changeDirectionMobile(direction) {
            if (!isStarted || isPaused || isGameOver) return;
            
            // Lekki impuls wibracji jeśli telefon to wspiera
            if (navigator.vibrate) {
                navigator.vibrate(15);
            }

            switch(direction) {
                case 'UP': handleDirectionChange('ArrowUp'); break;
                case 'DOWN': handleDirectionChange('ArrowDown'); break;
                case 'LEFT': handleDirectionChange('ArrowLeft'); break;
                case 'RIGHT': handleDirectionChange('ArrowRight'); break;
            }
        }

        // Sterowanie za pomocą Gestów (Swipe) na urządzeniach dotykowych
        let touchStartX = 0;
        let touchStartY = 0;
        const MIN_SWIPE_DISTANCE = 30; // Minimalna droga palca, aby uznać ją za swipe (w px)

        canvas.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        canvas.addEventListener('touchmove', e => {
            if (!isStarted || isPaused || isGameOver) return;
            // Zapobieganie standardowym akcjom dotykowym na obszarze gry
            e.preventDefault(); 
        }, { passive: false });

        canvas.addEventListener('touchend', e => {
            if (!isStarted || isPaused || isGameOver) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Sprawdzamy czy gest był wystarczająco wyraźny
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Poziomy swipe
                if (Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
                    if (deltaX > 0) {
                        handleDirectionChange('ArrowRight');
                    } else {
                        handleDirectionChange('ArrowLeft');
                    }
                }
            } else {
                // Pionowy swipe
                if (Math.abs(deltaY) > MIN_SWIPE_DISTANCE) {
                    if (deltaY > 0) {
                        handleDirectionChange('ArrowDown');
                    } else {
                        handleDirectionChange('ArrowUp');
                    }
                }
            }
        }, { passive: true });


        // Inicjalizacja gry i zmiana parametrów
        function setDifficulty(level) {
            selectedDifficulty = level;
            // Aktualizacja wizualna przycisków wyboru trudności
            ['easy', 'medium', 'hard'].forEach(l => {
                const btn = document.getElementById(`diff-${l}`);
                if (l === level) {
                    btn.className = 'btn-glow py-2 px-3 rounded-lg text-sm font-semibold bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400';
                } else {
                    btn.className = 'btn-glow py-2 px-3 rounded-lg text-sm font-semibold bg-slate-800 border border-slate-700 hover:border-emerald-500 text-slate-300';
                }
            });
        }

        function setSkin(skinName) {
            selectedSkin = skinName;
            // Aktualizacja wizualna przycisków wyboru skórki
            Object.keys(skins).forEach(s => {
                const btn = document.getElementById(`skin-${s}`);
                const colorHex = skins[s].head;
                if (s === skinName) {
                    btn.className = `btn-glow p-2 rounded-lg bg-${s === 'cyberpunk' ? 'rose' : s === 'aqua' ? 'cyan' : s === 'gold' ? 'amber' : 'emerald'}-500/20 border-2 border-${s === 'cyberpunk' ? 'rose' : s === 'aqua' ? 'cyan' : s === 'gold' ? 'amber' : 'emerald'}-500 flex flex-col items-center justify-center gap-1`;
                } else {
                    btn.className = 'btn-glow p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-500 flex flex-col items-center justify-center gap-1';
                }
            });
            drawSetupPreview();
        }

        function startGame() {
            initAudio(); // Aktywowanie Audio Context
            
            // Nowe, spowolnione prędkości dla lepszego startu (wartości w milisekundach na klatkę, im więcej tym wolniej)
            if (selectedDifficulty === 'easy') gameSpeed = 220;      // Poprzednio: 130ms (bardzo wolny, relaksujący start)
            else if (selectedDifficulty === 'medium') gameSpeed = 150; // Poprzednio: 90ms (dobrze zbalansowany start)
            else if (selectedDifficulty === 'hard') gameSpeed = 95;   // Poprzednio: 65ms (wymagający start)

            // Zerowanie stanu gry
            snake = [
                { x: 10, y: 10 },
                { x: 9, y: 10 },
                { x: 8, y: 10 }
            ];
            dx = 1;
            dy = 0;
            score = 0;
            isPaused = false;
            isGameOver = false;
            isStarted = true;
            changingDirection = false;

            // Reset stanu bonusowego jedzenia przy nowej rozgrywce
            bonusState = 'inactive';
            bonusTimer = 10000; // Czeka 10 sekund na pierwszy spawn
            bonusFood = { x: -1, y: -1 };

            document.getElementById('score').innerText = score;
            
            // Ukrycie ekranów menu i nakładek
            document.getElementById('start-screen').classList.add('hidden');
            document.getElementById('overlay-screen').classList.add('hidden');
            
            generateFood();

            // Uruchomienie pętli czasowej
            if (gameInterval) clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }

        function gameLoop() {
            if (isPaused || isGameOver) return;
            
            changingDirection = false; // Reset flagi kierunku dla nowej klatki
            
            // Aktualizacja zegara Super Jedzenia w oparciu o czas klatki
            updateBonusFood();

            moveSnake();
            checkCollision();
            
            if (!isGameOver) {
                draw();
            }
        }

        function updateBonusFood() {
            bonusTimer -= gameSpeed;
            if (bonusState === 'inactive') {
                if (bonusTimer <= 0) {
                    spawnBonusFood();
                }
            } else if (bonusState === 'active') {
                if (bonusTimer <= 0) {
                    hideBonusFood();
                }
            }
        }

        function spawnBonusFood() {
            let foodX, foodY;
            let foodOnSnakeOrRegular = true;

            while (foodOnSnakeOrRegular) {
                foodX = Math.floor(Math.random() * GRID_SIZE);
                foodY = Math.floor(Math.random() * GRID_SIZE);
                
                const onSnake = snake.some(segment => segment.x === foodX && segment.y === foodY);
                const onRegularFood = food.x === foodX && food.y === foodY;
                foodOnSnakeOrRegular = onSnake || onRegularFood;
            }

            bonusFood = { x: foodX, y: foodY };
            bonusState = 'active';
            bonusTimer = 10000; // Pojawia się dokładnie na 10 sekund
        }

        function hideBonusFood() {
            bonusFood = { x: -1, y: -1 };
            bonusState = 'inactive';
            bonusTimer = 10000; // Znika i pojawia się z powrotem za kolejne 10 sekund
        }

        function moveSnake() {
            // Obliczenie nowej pozycji głowy
            const head = { x: snake[0].x + dx, y: snake[0].y + dy };
            
            // Dodanie nowej głowy na początek tablicy
            snake.unshift(head);

            // Sprawdzenie, czy wąż zjadł jedzenie
            const hasEatenFood = snake[0].x === food.x && snake[0].y === food.y;
            const hasEatenBonus = bonusState === 'active' && snake[0].x === bonusFood.x && snake[0].y === bonusFood.y;

            if (hasEatenFood) {
                score += (selectedDifficulty === 'easy' ? 5 : selectedDifficulty === 'medium' ? 10 : 20);
                document.getElementById('score').innerText = score;
                playSound('eat');
                
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('snake_high_score', highScore);
                    document.getElementById('high-score').innerText = highScore;
                }
                
                generateFood();
            } else if (hasEatenBonus) {
                score += 10; // Stała wartość 10 punktów za Super Jedzenie
                document.getElementById('score').innerText = score;
                playSound('eat');
                
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('snake_high_score', highScore);
                    document.getElementById('high-score').innerText = highScore;
                }
                
                // Schowaj bonus i rozpocznij odliczanie 10 sekund do następnego spawnu
                hideBonusFood();
            } else {
                // Usunięcie ogona (wąż porusza się do przodu, zachowując długość)
                snake.pop();
            }
        }

        function generateFood() {
            // Tworzenie jedzenia na losowej wolnej pozycji
            let foodX, foodY;
            let foodOnSnake = true;

            while (foodOnSnake) {
                foodX = Math.floor(Math.random() * GRID_SIZE);
                foodY = Math.floor(Math.random() * GRID_SIZE);
                
                foodOnSnake = snake.some(segment => segment.x === foodX && segment.y === foodY);
            }

            food = { x: foodX, y: foodY };
        }

        function checkCollision() {
            const head = snake[0];

            // Kolizja ze ścianą
            if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                gameOver();
                return;
            }

            // Kolizja z własnym ciałem (od segmentu 1 wzwyż)
            for (let i = 1; i < snake.length; i++) {
                if (head.x === snake[i].x && head.y === snake[i].y) {
                    gameOver();
                    return;
                }
            }
        }

        function gameOver() {
            isGameOver = true;
            clearInterval(gameInterval);
            if (score > 0 && window.GryScores && GryScores.submit) GryScores.submit('snake', score, {}); // każdy wynik -> chmura
            playSound('die');

            // Przywrócenie wibracji przy porażce
            if (navigator.vibrate) {
                navigator.vibrate([100, 50, 100]);
            }

            // Ustawienia ekranu GameOver
            document.getElementById('overlay-title').innerText = "KONIEC GRY";
            document.getElementById('overlay-title').className = "text-3xl font-black font-orbitron mb-2 text-rose-500 neon-text-pink";
            document.getElementById('overlay-msg').innerText = "Uderzyłeś w ścianę lub we własne ciało!";
            document.getElementById('overlay-score').innerText = score;
            document.getElementById('overlay-high').innerText = highScore;
            
            document.getElementById('overlay-screen').classList.remove('hidden');
        }


        // Rysowanie Gry na Canvas
        function draw() {
            // Wyczyszczenie planszy z delikatnym rozmyciem tła dla efektu głębi neonów
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Rysowanie siatki w tle (bardzo subtelnej)
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1;
            for (let i = 0; i <= GRID_SIZE; i++) {
                ctx.beginPath();
                ctx.moveTo(i * CELL_SIZE, 0);
                ctx.lineTo(i * CELL_SIZE, canvas.height);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, i * CELL_SIZE);
                ctx.lineTo(canvas.width, i * CELL_SIZE);
                ctx.stroke();
            }

            const skin = skins[selectedSkin];

            // Rysowanie Jedzenia (świecący, neonowy okrąg/gwiazda)
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = skin.food;
            ctx.fillStyle = skin.food;
            
            ctx.beginPath();
            const centerX = food.x * CELL_SIZE + CELL_SIZE / 2;
            const centerY = food.y * CELL_SIZE + CELL_SIZE / 2;
            const radius = (CELL_SIZE / 2) - 2;
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fill();

            // Druga, jaśniejsza warstwa środka jedzenia
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Rysowanie Bonusowego Jedzenia (jeśli jest aktywne na planszy)
            if (bonusState === 'active') {
                ctx.save();
                const bCenterX = bonusFood.x * CELL_SIZE + CELL_SIZE / 2;
                const bCenterY = bonusFood.y * CELL_SIZE + CELL_SIZE / 2;
                const bRadius = (CELL_SIZE / 2) - 2;

                // Pulsowanie rozmiaru w oparciu o czas systemowy
                const pulse = 1 + 0.15 * Math.sin(Date.now() / 150);
                
                // Efekt neonu złotego / bursztynowego
                ctx.shadowBlur = 20 * pulse;
                ctx.shadowColor = '#fbbf24'; // Amber-400
                ctx.fillStyle = '#fbbf24';

                // Rysowanie złotego diamentu
                ctx.beginPath();
                ctx.moveTo(bCenterX, bCenterY - bRadius * pulse);
                ctx.lineTo(bCenterX + bRadius * pulse, bCenterY);
                ctx.lineTo(bCenterX, bCenterY + bRadius * pulse);
                ctx.lineTo(bCenterX - bRadius * pulse, bCenterY);
                ctx.closePath();
                ctx.fill();

                // Jasny, biały punkt wewnętrzny dla efektu błysku
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(bCenterX, bCenterY - bRadius * 0.4 * pulse);
                ctx.lineTo(bCenterX + bRadius * 0.4 * pulse, bCenterY);
                ctx.lineTo(bCenterX, bCenterY + bRadius * 0.4 * pulse);
                ctx.lineTo(bCenterX - bRadius * 0.4 * pulse, bCenterY);
                ctx.closePath();
                ctx.fill();

                // Okrągły wskaźnik pozostałego czasu wokół złotego diamentu
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + (Math.PI * 2) * (bonusTimer / 10000);
                ctx.arc(bCenterX, bCenterY, bRadius + 3, startAngle, endAngle);
                ctx.stroke();

                ctx.restore();
            }

            // Rysowanie Węża
            snake.forEach((segment, index) => {
                const isHead = index === 0;
                
                ctx.save();
                
                // Efekt neonu dla każdego segmentu
                ctx.shadowBlur = isHead ? 15 : 8;
                ctx.shadowColor = isHead ? skin.head : skin.body;
                ctx.fillStyle = isHead ? skin.head : skin.body;

                // Obliczanie położenia segmentu
                const x = segment.x * CELL_SIZE + 1;
                const y = segment.y * CELL_SIZE + 1;
                const size = CELL_SIZE - 2;
                const radius = isHead ? 6 : 4; // Zaokrąglone rogi węża

                // Rysowanie zaokrąglonego prostokąta dla estetyki weża
                ctx.beginPath();
                ctx.roundRect(x, y, size, size, radius);
                ctx.fill();

                // Dodanie światełka w oczach węża (tylko na głowie)
                if (isHead) {
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = '#ffffff';
                    
                    // Rozmieszczenie oczu w zależności od kierunku ruchu
                    let eyeX1, eyeY1, eyeX2, eyeY2;
                    const eyeOffset = size * 0.25;
                    const eyeRadius = size * 0.12;

                    if (dx === 1) { // Prawo
                        eyeX1 = x + size - eyeOffset; eyeY1 = y + eyeOffset;
                        eyeX2 = x + size - eyeOffset; eyeY2 = y + size - eyeOffset;
                    } else if (dx === -1) { // Lewo
                        eyeX1 = x + eyeOffset; eyeY1 = y + eyeOffset;
                        eyeX2 = x + eyeOffset; eyeY2 = y + size - eyeOffset;
                    } else if (dy === 1) { // Dół
                        eyeX1 = x + eyeOffset; eyeY1 = y + size - eyeOffset;
                        eyeX2 = x + size - eyeOffset; eyeY2 = y + size - eyeOffset;
                    } else { // Góra
                        eyeX1 = x + eyeOffset; eyeY1 = y + eyeOffset;
                        eyeX2 = x + size - eyeOffset; eyeY2 = y + eyeOffset;
                    }

                    ctx.beginPath();
                    ctx.arc(eyeX1, eyeY1, eyeRadius, 0, Math.PI * 2);
                    ctx.arc(eyeX2, eyeY2, eyeRadius, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            });
        }


        // Rysowanie podglądu skórki na ekranie startowym przed rozpoczęciem gry
        function drawSetupPreview() {
            ctx.fillStyle = '#020617';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const skin = skins[selectedSkin];
            
            // Rysowanie logo węża na podglądzie
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = skin.head;
            ctx.fillStyle = skin.head;
            
            // Mały, ładny rysunek wężowego węzła na środku planszy demonstracyjnej
            const mid = GRID_SIZE / 2;
            const demoSegments = [
                {x: mid, y: mid},
                {x: mid - 1, y: mid},
                {x: mid - 2, y: mid},
                {x: mid - 2, y: mid - 1},
                {x: mid - 1, y: mid - 1},
                {x: mid, y: mid - 1}
            ];

            demoSegments.forEach((segment, index) => {
                ctx.fillStyle = index === 0 ? skin.head : skin.body;
                ctx.shadowColor = index === 0 ? skin.head : skin.body;
                ctx.beginPath();
                ctx.roundRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE - 2, CELL_SIZE - 2, index === 0 ? 6 : 4);
                ctx.fill();
            });

            // Demo jedzenie
            ctx.fillStyle = skin.food;
            ctx.shadowColor = skin.food;
            ctx.beginPath();
            ctx.arc((mid + 2) * CELL_SIZE + CELL_SIZE/2, mid * CELL_SIZE + CELL_SIZE/2, CELL_SIZE/2 - 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            
            // Subtelny komunikat
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.font = '14px Orbitron';
            ctx.textAlign = 'center';
            ctx.fillText('Naciśnij przycisk startowy', canvas.width / 2, canvas.height - 40);
        }

        // Akcje menu i system pauzy
        function togglePause() {
            if (!isStarted || isGameOver) return;
            
            isPaused = !isPaused;
            const icon = document.getElementById('pause-icon');
            const pText = document.getElementById('pause-text');
            const overlay = document.getElementById('overlay-screen');

            if (isPaused) {
                icon.className = 'fa-solid fa-play text-sm text-yellow-500';
                pText.innerText = "Wznów (Space)";
                playSound('turn');
                
                // Pokaż nakładkę pauzy
                document.getElementById('overlay-title').innerText = "PAUZA";
                document.getElementById('overlay-title').className = "text-3xl font-black font-orbitron mb-2 text-yellow-500 neon-text-green";
                document.getElementById('overlay-msg').innerText = "Gra została wstrzymana.";
                document.getElementById('overlay-score').innerText = score;
                document.getElementById('overlay-high').innerText = highScore;
                overlay.classList.remove('hidden');
            } else {
                icon.className = 'fa-solid fa-pause text-sm';
                pText.innerText = "Pauza (Space)";
                playSound('turn');
                overlay.classList.add('hidden');
            }
        }

        function showMainMenu() {
            isStarted = false;
            isPaused = false;
            isGameOver = false;
            if (gameInterval) clearInterval(gameInterval);
            
            document.getElementById('start-screen').classList.remove('hidden');
            document.getElementById('overlay-screen').classList.add('hidden');
            
            // Zresetowanie ikony pauzy
            document.getElementById('pause-icon').className = 'fa-solid fa-pause text-sm';
            document.getElementById('pause-text').innerText = "Pauza (Space)";
            
            drawSetupPreview();
        }

        // Pierwsze uruchomienie tła demo po załadowaniu
        window.onload = function() {
            // Dostosowanie wyglądu obramowania canvas w zależności od wybranej skórki
            drawSetupPreview();
        };
