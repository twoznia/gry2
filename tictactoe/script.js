        const boardEl = document.getElementById('board');
        const sizeSelect = document.getElementById('board-size');
        const diffSelect = document.getElementById('difficulty');
        const resetBtn = document.getElementById('reset-btn');
        const turnIndicator = document.getElementById('turn-indicator');
        const messageOverlay = document.getElementById('message-overlay');
        const resultMessage = document.getElementById('result-message');
        const playAgainBtn = document.getElementById('play-again-btn');

        let size = 3;
        let winCondition = 3; // How many in a row to win
        let board = [];
        let currentPlayer = 'X'; // X is User, O is AI
        let gameActive = true;
        let aiThinking = false;

        const PLAYER = 'X';
        const AI = 'O';

        // Symbols for rendering
        const symbols = {
            'X': '<span style="font-family: sans-serif">X</span>',
            'O': '<span style="font-family: sans-serif">O</span>',
            '': ''
        };

        function initGame() {
            size = parseInt(sizeSelect.value);
            // Dynamic win condition based on board size
            winCondition = size === 3 ? 3 : (size === 4 ? 4 : 4); // 4 in a row for 4x4, 5x5, 6x6.
            if(size >= 5) winCondition = 4; // Standard gomoku-lite

            board = Array(size).fill(null).map(() => Array(size).fill(''));
            currentPlayer = PLAYER;
            gameActive = true;
            aiThinking = false;
            
            updateTurnIndicator();
            renderBoard();
            hideMessage();
        }

        function renderBoard() {
            boardEl.innerHTML = '';
            boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
            boardEl.style.gridTemplateRows = `repeat(${size}, 1fr)`;

            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.dataset.row = r;
                    cell.dataset.col = c;
                    
                    if (board[r][c] !== '') {
                        cell.classList.add('occupied', board[r][c].toLowerCase());
                        cell.innerHTML = symbols[board[r][c]];
                    }

                    cell.addEventListener('click', handleCellClick);
                    boardEl.appendChild(cell);
                }
            }
        }

        function handleCellClick(e) {
            if (!gameActive || aiThinking) return;

            const r = parseInt(e.target.dataset.row);
            const c = parseInt(e.target.dataset.col);

            if (board[r][c] !== '') return;

            makeMove(r, c, PLAYER);
            
            if (checkGameOver(PLAYER)) return;

            // AI Turn
            currentPlayer = AI;
            updateTurnIndicator();
            aiThinking = true;
            
            // Add a slight delay for realism
            setTimeout(() => {
                makeAIMove();
            }, 500);
        }

        function makeMove(r, c, player) {
            board[r][c] = player;
            renderBoard();
        }

        function updateTurnIndicator() {
            if (!gameActive) return;
            if (currentPlayer === PLAYER) {
                turnIndicator.innerHTML = `Twój ruch (<span class="text-[#ff4757]">X</span>)`;
                turnIndicator.style.color = 'white';
            } else {
                turnIndicator.innerHTML = `AI myśli... (<span class="text-[#2ed573]">O</span>)`;
                turnIndicator.style.color = '#a4b0be';
            }
        }

        function checkGameOver(lastPlayer) {
            const winData = checkWin(board, lastPlayer);
            if (winData) {
                gameActive = false;
                highlightWinningCells(winData);
                setTimeout(() => showMessage(lastPlayer === PLAYER ? "Wygrałeś! 🎉" : "AI Wygrało! 🤖"), 800);
                return true;
            }

            if (checkDraw(board)) {
                gameActive = false;
                turnIndicator.innerText = "Koniec gry";
                setTimeout(() => showMessage("Remis! 🤝"), 800);
                return true;
            }
            return false;
        }

        function checkWin(currentBoard, player) {
            // Check horizontal
            for (let r = 0; r < size; r++) {
                for (let c = 0; c <= size - winCondition; c++) {
                    let win = true;
                    let cells = [];
                    for (let i = 0; i < winCondition; i++) {
                        if (currentBoard[r][c + i] !== player) { win = false; break; }
                        cells.push({r, c: c + i});
                    }
                    if (win) return cells;
                }
            }

            // Check vertical
            for (let c = 0; c < size; c++) {
                for (let r = 0; r <= size - winCondition; r++) {
                    let win = true;
                    let cells = [];
                    for (let i = 0; i < winCondition; i++) {
                        if (currentBoard[r + i][c] !== player) { win = false; break; }
                        cells.push({r: r + i, c});
                    }
                    if (win) return cells;
                }
            }

            // Check diagonal (top-left to bottom-right)
            for (let r = 0; r <= size - winCondition; r++) {
                for (let c = 0; c <= size - winCondition; c++) {
                    let win = true;
                    let cells = [];
                    for (let i = 0; i < winCondition; i++) {
                        if (currentBoard[r + i][c + i] !== player) { win = false; break; }
                        cells.push({r: r + i, c: c + i});
                    }
                    if (win) return cells;
                }
            }

            // Check diagonal (bottom-left to top-right)
            for (let r = winCondition - 1; r < size; r++) {
                for (let c = 0; c <= size - winCondition; c++) {
                    let win = true;
                    let cells = [];
                    for (let i = 0; i < winCondition; i++) {
                        if (currentBoard[r - i][c + i] !== player) { win = false; break; }
                        cells.push({r: r - i, c: c + i});
                    }
                    if (win) return cells;
                }
            }

            return null;
        }

        function checkDraw(currentBoard) {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (currentBoard[r][c] === '') return false;
                }
            }
            return true;
        }

        function highlightWinningCells(cells) {
            cells.forEach(pos => {
                const cellEl = document.querySelector(`.cell[data-row="${pos.r}"][data-col="${pos.c}"]`);
                if (cellEl) cellEl.classList.add('winning-cell');
            });
        }

        function showMessage(msg) {
            resultMessage.innerText = msg;
            messageOverlay.classList.add('active');
        }

        function hideMessage() {
            messageOverlay.classList.remove('active');
        }

        // Returns a move where `player` wins immediately, or null
        function getImmediateMove(player) {
            const empty = getEmptyCells();
            for (const move of empty) {
                board[move.r][move.c] = player;
                const wins = checkWin(board, player);
                board[move.r][move.c] = '';
                if (wins) return move;
            }
            return null;
        }

        function makeAIMove() {
            if (!gameActive) return;

            const difficulty = diffSelect.value;
            let move;

            if (difficulty === 'easy') {
                move = getRandomMove();
            } else if (difficulty === 'medium') {
                // Always react to game-ending situations first
                move = getImmediateMove(AI) || getImmediateMove(PLAYER);
                if (!move) {
                    // 50% chance for random, 50% for smart move
                    if (Math.random() > 0.5) {
                        move = getSmartMove();
                    } else {
                        move = getRandomMove();
                    }
                }
            } else {
                // Hard: explicit win/block + minimax (minimax also covers these, but explicit is safer for depth-limited boards)
                move = getImmediateMove(AI) || getImmediateMove(PLAYER) || getSmartMove();
            }

            // Fallback if smart move fails
            if (!move) move = getRandomMove();

            if (move) {
                makeMove(move.r, move.c, AI);
                if (!checkGameOver(AI)) {
                    currentPlayer = PLAYER;
                    updateTurnIndicator();
                }
            }
            aiThinking = false;
        }

        function getEmptyCells(currentBoard = board) {
            let empty = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (currentBoard[r][c] === '') {
                        empty.push({r, c});
                    }
                }
            }
            return empty;
        }

        function getRandomMove() {
            const emptyCells = getEmptyCells();
            if (emptyCells.length === 0) return null;
            const randomIndex = Math.floor(Math.random() * emptyCells.length);
            return emptyCells[randomIndex];
        }

        function getSmartMove() {
            // For 3x3, full minimax is fast enough.
            // For larger boards, we need heuristics to avoid freezing the browser.
            const emptyCells = getEmptyCells();
            
            // If it's the first move on a large board, pick near the center
            if (emptyCells.length >= (size * size) - 1 && size > 3) {
                return getCenterMove();
            }

            let bestScore = -Infinity;
            let bestMove = null;
            let maxDepth = size === 3 ? Infinity : (size === 4 ? 6 : (size === 5 ? 4 : 3)); // Limit depth for large boards

            // Optimization for large boards: only consider cells adjacent to occupied ones
            let candidateCells = size > 3 ? getCandidateCells(board) : emptyCells;
            if (candidateCells.length === 0) candidateCells = emptyCells; // Fallback

            for (let i = 0; i < candidateCells.length; i++) {
                const move = candidateCells[i];
                board[move.r][move.c] = AI;
                let score = minimax(board, 0, false, -Infinity, Infinity, maxDepth);
                board[move.r][move.c] = ''; // undo

                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }

            return bestMove;
        }

        function getCenterMove() {
            const center = Math.floor(size / 2);
            if (board[center][center] === '') return {r: center, c: center};
            // Try offset
            if (board[center-1] && board[center-1][center] === '') return {r: center-1, c: center};
            return getRandomMove();
        }

        // Returns empty cells that are adjacent to at least one occupied cell
        function getCandidateCells(currentBoard) {
            let candidates = [];
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (currentBoard[r][c] === '') {
                        if (hasAdjacentOccupied(currentBoard, r, c)) {
                            candidates.push({r, c});
                        }
                    }
                }
            }
            return candidates;
        }

        function hasAdjacentOccupied(currentBoard, r, c) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue;
                    let nr = r + i, nc = c + j;
                    if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
                        if (currentBoard[nr][nc] !== '') return true;
                    }
                }
            }
            return false;
        }

        function minimax(currentBoard, depth, isMaximizing, alpha, beta, maxDepth) {
            let result = evaluateBoard(currentBoard);
            
            // Terminal states
            if (result === 'AI') return 100 - depth; // Prefer faster wins
            if (result === 'PLAYER') return -100 + depth;
            if (result === 'DRAW') return 0;
            if (depth >= maxDepth) return heuristicEvaluate(currentBoard); // Stop condition for large boards

            if (isMaximizing) {
                let bestScore = -Infinity;
                let candidates = size > 3 ? getCandidateCells(currentBoard) : getEmptyCells(currentBoard);
                if(candidates.length === 0) candidates = getEmptyCells(currentBoard);

                for (let i = 0; i < candidates.length; i++) {
                    const move = candidates[i];
                    currentBoard[move.r][move.c] = AI;
                    let score = minimax(currentBoard, depth + 1, false, alpha, beta, maxDepth);
                    currentBoard[move.r][move.c] = '';
                    bestScore = Math.max(score, bestScore);
                    alpha = Math.max(alpha, score);
                    if (beta <= alpha) break; // Alpha-Beta pruning
                }
                return bestScore;
            } else {
                let bestScore = Infinity;
                let candidates = size > 3 ? getCandidateCells(currentBoard) : getEmptyCells(currentBoard);
                if(candidates.length === 0) candidates = getEmptyCells(currentBoard);

                for (let i = 0; i < candidates.length; i++) {
                    const move = candidates[i];
                    currentBoard[move.r][move.c] = PLAYER;
                    let score = minimax(currentBoard, depth + 1, true, alpha, beta, maxDepth);
                    currentBoard[move.r][move.c] = '';
                    bestScore = Math.min(score, bestScore);
                    beta = Math.min(beta, score);
                    if (beta <= alpha) break; // Alpha-Beta pruning
                }
                return bestScore;
            }
        }

        // Returns 'AI', 'PLAYER', 'DRAW' or null
        function evaluateBoard(currentBoard) {
            if (checkWin(currentBoard, AI)) return 'AI';
            if (checkWin(currentBoard, PLAYER)) return 'PLAYER';
            if (checkDraw(currentBoard)) return 'DRAW';
            return null;
        }

        // Simple heuristic for depth-limited minimax
        function heuristicEvaluate(currentBoard) {
            let score = 0;
            // Very basic evaluation: count potential lines
            // (A full robust heuristic for n-in-a-row is complex, 
            // this is a simplified version just to give the AI *some* direction when depth is cut off)
            score += evaluateLines(currentBoard, AI) * 10;
            score -= evaluateLines(currentBoard, PLAYER) * 10;
            return score;
        }

        function evaluateLines(b, p) {
            let score = 0;
            // Horizontal
            for(let r=0; r<size; r++) {
                for(let c=0; c<=size-winCondition; c++) {
                    let count = 0;
                    let empty = 0;
                    for(let i=0; i<winCondition; i++) {
                        if(b[r][c+i] === p) count++;
                        else if(b[r][c+i] === '') empty++;
                    }
                    if(count > 0 && count + empty === winCondition) score += Math.pow(10, count);
                }
            }
            // Vertical
            for(let c=0; c<size; c++) {
                for(let r=0; r<=size-winCondition; r++) {
                    let count = 0;
                    let empty = 0;
                    for(let i=0; i<winCondition; i++) {
                        if(b[r+i][c] === p) count++;
                        else if(b[r+i][c] === '') empty++;
                    }
                    if(count > 0 && count + empty === winCondition) score += Math.pow(10, count);
                }
            }
            // Diagonal top-left to bottom-right
            for(let r=0; r<=size-winCondition; r++) {
                for(let c=0; c<=size-winCondition; c++) {
                    let count = 0;
                    let empty = 0;
                    for(let i=0; i<winCondition; i++) {
                        if(b[r+i][c+i] === p) count++;
                        else if(b[r+i][c+i] === '') empty++;
                    }
                    if(count > 0 && count + empty === winCondition) score += Math.pow(10, count);
                }
            }
            // Diagonal bottom-left to top-right
            for(let r=winCondition-1; r<size; r++) {
                for(let c=0; c<=size-winCondition; c++) {
                    let count = 0;
                    let empty = 0;
                    for(let i=0; i<winCondition; i++) {
                        if(b[r-i][c+i] === p) count++;
                        else if(b[r-i][c+i] === '') empty++;
                    }
                    if(count > 0 && count + empty === winCondition) score += Math.pow(10, count);
                }
            }
            return score;
        }

        resetBtn.addEventListener('click', initGame);
        playAgainBtn.addEventListener('click', initGame);
        sizeSelect.addEventListener('change', initGame);
        diffSelect.addEventListener('change', initGame);

        // Start the game
        initGame();
