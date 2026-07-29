        const boardEl = document.getElementById('board');
        const difficultySelect = document.getElementById('difficulty-select');
        const newGameBtn = document.getElementById('new-game-btn');
        const faceBtn = document.getElementById('face-btn');
        const minesCountDisplay = document.getElementById('mines-count');
        const timerDisplay = document.getElementById('timer');

        // Game Configuration
        const config = {
            easy: { rows: 9, cols: 9, mines: 10, cssVar: '--cell-size-easy' },
            medium: { rows: 16, cols: 16, mines: 40, cssVar: '--cell-size-med' },
            hard: { rows: 16, cols: 30, mines: 99, cssVar: '--cell-size-hard' }
        };

        let currentConfig = config.easy;
        let board = []; // 2D array storing cell data
        let gameActive = false;
        let firstClick = true;
        let minesLeft = 0;
        let cellsRevealed = 0;
        
        // Timer variables
        let timerInterval;
        let secondsElapsed = 0;

        // Long press handling for mobile flags
        let longPressTimer;
        const LONG_PRESS_DURATION = 400; // ms

        function initGame() {
            clearInterval(timerInterval);
            secondsElapsed = 0;
            updateTimerDisplay();
            updateBestDisplay();

            const difficulty = difficultySelect.value;
            currentConfig = config[difficulty];
            
            minesLeft = currentConfig.mines;
            updateMinesDisplay();
            
            gameActive = true;
            firstClick = true;
            cellsRevealed = 0;
            faceBtn.innerText = '🙂';
            board = [];
            
            renderEmptyBoard();
        }

        function renderEmptyBoard() {
            boardEl.innerHTML = '';
            boardEl.style.gridTemplateColumns = `repeat(${currentConfig.cols}, 1fr)`;
            boardEl.style.gridTemplateRows = `repeat(${currentConfig.rows}, 1fr)`;
            
            // Set CSS variable for cell size based on difficulty to fit screen
            document.documentElement.style.setProperty('--cell-size', `var(${currentConfig.cssVar})`);

            for (let r = 0; r < currentConfig.rows; r++) {
                let row = [];
                for (let c = 0; c < currentConfig.cols; c++) {
                    const cellData = {
                        r: r,
                        c: c,
                        isMine: false,
                        isRevealed: false,
                        isFlagged: false,
                        neighborMines: 0,
                        element: null
                    };
                    
                    const cellEl = document.createElement('div');
                    cellEl.classList.add('cell');
                    cellEl.style.width = 'var(--cell-size)';
                    cellEl.style.height = 'var(--cell-size)';
                    cellEl.dataset.r = r;
                    cellEl.dataset.c = c;
                    
                    // Event Listeners
                    setupCellEvents(cellEl, r, c);

                    cellData.element = cellEl;
                    boardEl.appendChild(cellEl);
                    row.push(cellData);
                }
                board.push(row);
            }
        }

        function setupCellEvents(cellEl, r, c) {
            // Left click
            cellEl.addEventListener('mousedown', (e) => {
                if (e.button !== 0 || !gameActive) return;
                faceBtn.innerText = '😮'; // Surprise face while clicking
            });

            cellEl.addEventListener('mouseup', (e) => {
                if (e.button !== 0 || !gameActive) return;
                faceBtn.innerText = '🙂';
                handleReveal(r, c);
            });

            // Right click (Flag)
            cellEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (!gameActive) return;
                handleFlag(r, c);
            });

            // Touch events for mobile (Long press to flag)
            cellEl.addEventListener('touchstart', (e) => {
                if (!gameActive) return;
                faceBtn.innerText = '😮';
                longPressTimer = setTimeout(() => {
                    handleFlag(r, c);
                    longPressTimer = null; // Prevent reveal if flagged via long press
                    // Visual feedback for mobile
                    navigator.vibrate && navigator.vibrate(50);
                }, LONG_PRESS_DURATION);
            }, {passive: true});

            cellEl.addEventListener('touchend', (e) => {
                if (!gameActive) return;
                faceBtn.innerText = '🙂';
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    // It was a short tap, so reveal
                    // Small delay to ensure it wasn't a swipe
                    setTimeout(() => handleReveal(r, c), 10);
                }
                // Prevent default mouse events triggering after touch
                e.preventDefault(); 
            });
            
            cellEl.addEventListener('touchmove', () => {
                // Cancel long press if user is scrolling
                if (longPressTimer) clearTimeout(longPressTimer);
            }, {passive: true});
        }

        function placeMines(safeR, safeC) {
            let minesPlaced = 0;
            while (minesPlaced < currentConfig.mines) {
                let r = Math.floor(Math.random() * currentConfig.rows);
                let c = Math.floor(Math.random() * currentConfig.cols);

                // Conditions to NOT place a mine:
                // 1. Already a mine
                // 2. It's the exact cell clicked (safeR, safeC)
                // 3. It's an immediate neighbor of the clicked cell (ensure 0 start)
                if (!board[r][c].isMine && !isNeighborOrSelf(r, c, safeR, safeC)) {
                    board[r][c].isMine = true;
                    minesPlaced++;
                }
            }
            calculateNeighbors();
        }

        function isNeighborOrSelf(r1, c1, r2, c2) {
            return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1;
        }

        function calculateNeighbors() {
            for (let r = 0; r < currentConfig.rows; r++) {
                for (let c = 0; c < currentConfig.cols; c++) {
                    if (!board[r][c].isMine) {
                        let count = 0;
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                let nr = r + dr;
                                let nc = c + dc;
                                if (isValid(nr, nc) && board[nr][nc].isMine) {
                                    count++;
                                }
                            }
                        }
                        board[r][c].neighborMines = count;
                    }
                }
            }
        }

        function isValid(r, c) {
            return r >= 0 && r < currentConfig.rows && c >= 0 && c < currentConfig.cols;
        }

        function handleReveal(r, c) {
            const cell = board[r][c];
            
            if (cell.isRevealed || cell.isFlagged) return;

            if (firstClick) {
                placeMines(r, c);
                firstClick = false;
                startTimer();
            }

            if (cell.isMine) {
                gameOver(false, cell);
                return;
            }

            revealCell(r, c);
            checkWin();
        }

        function handleFlag(r, c) {
            const cell = board[r][c];
            if (cell.isRevealed) return;

            if (!cell.isFlagged && minesLeft > 0) {
                cell.isFlagged = true;
                cell.element.classList.add('flagged');
                minesLeft--;
            } else if (cell.isFlagged) {
                cell.isFlagged = false;
                cell.element.classList.remove('flagged');
                minesLeft++;
            }
            updateMinesDisplay();
        }

        function revealCell(r, c) {
            const cell = board[r][c];
            if (cell.isRevealed || cell.isFlagged) return;

            cell.isRevealed = true;
            cell.element.classList.add('revealed');
            cellsRevealed++;

            if (cell.neighborMines > 0) {
                cell.element.dataset.value = cell.neighborMines;
                cell.element.innerText = cell.neighborMines;
            } else {
                // Flood fill for empty cells (0 mines around)
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        let nr = r + dr;
                        let nc = c + dc;
                        if (isValid(nr, nc)) {
                            revealCell(nr, nc); // Recursive call
                        }
                    }
                }
            }
        }

        function checkWin() {
            const totalSafeCells = (currentConfig.rows * currentConfig.cols) - currentConfig.mines;
            if (cellsRevealed === totalSafeCells) {
                gameOver(true);
            }
        }

        function gameOver(isWin, deathCell = null) {
            gameActive = false;
            clearInterval(timerInterval);

            if (isWin) {
                faceBtn.innerText = '😎';
                saveBestTime();
                minesLeft = 0; // Flag remaining implicitly
                updateMinesDisplay();
                // Flag all remaining mines visually
                for (let r = 0; r < currentConfig.rows; r++) {
                    for (let c = 0; c < currentConfig.cols; c++) {
                        let cell = board[r][c];
                        if (cell.isMine && !cell.isFlagged) {
                            cell.element.classList.add('flagged');
                        }
                    }
                }
            } else {
                faceBtn.innerText = '😵';
                // Reveal all mines and show mistakes
                for (let r = 0; r < currentConfig.rows; r++) {
                    for (let c = 0; c < currentConfig.cols; c++) {
                        let cell = board[r][c];
                        if (cell.isMine && !cell.isFlagged) {
                            cell.element.classList.add('revealed', 'mine-revealed');
                        } else if (!cell.isMine && cell.isFlagged) {
                            // Wrong flag placed
                            cell.element.classList.add('revealed', 'wrong-flag');
                            cell.element.classList.remove('flagged');
                        }
                    }
                }
                // Highlight the mine that killed the player
                if (deathCell) {
                    deathCell.element.classList.add('mine'); 
                }
            }
        }

        // Rekord: najlepszy (najniższy) czas per poziom trudności. Klucz obserwuje
        // shared/auth.js -> zapis/odczyt w Supabase dla zalogowanych.
        function bestKey() { return 'saper_best_' + difficultySelect.value; }
        function saveBestTime() {
            const key = bestKey();
            const prev = parseInt(localStorage.getItem(key) || '0', 10);
            if (!prev || secondsElapsed < prev) {
                localStorage.setItem(key, String(secondsElapsed));
            }
            updateBestDisplay();
        }
        function updateBestDisplay() {
            const el = document.getElementById('best-display');
            if (!el) return;
            const v = parseInt(localStorage.getItem(bestKey()) || '0', 10);
            el.textContent = '🏆 Najlepszy czas: ' + (v ? v + ' s' : '—');
        }

        function startTimer() {
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                if (secondsElapsed < 999) {
                    secondsElapsed++;
                    updateTimerDisplay();
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            timerDisplay.innerText = secondsElapsed.toString().padStart(3, '0');
        }

        function updateMinesDisplay() {
            // Handle negative display if user places too many flags
            const sign = minesLeft < 0 ? "-" : "";
            const absVal = Math.abs(minesLeft);
            minesCountDisplay.innerText = sign + absVal.toString().padStart(minesLeft < 0 ? 2 : 3, '0');
        }

        // Event Listeners for UI
        newGameBtn.addEventListener('click', initGame);
        faceBtn.addEventListener('click', initGame);
        difficultySelect.addEventListener('change', initGame);

        // Start initial game
        initGame();
