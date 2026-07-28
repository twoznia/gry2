        const SUITS = {
            'S': { name: 'Pik', symbol: '♠', isRed: false, defId: '#suit-spade' },
            'H': { name: 'Kier', symbol: '♥', isRed: true, defId: '#suit-heart' },
            'D': { name: 'Karo', symbol: '♦', isRed: true, defId: '#suit-diamond' },
            'C': { name: 'Trefl', symbol: '♣', isRed: false, defId: '#suit-club' }
        };
        const RANKS = {
            1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
            11: 'J', 12: 'Q', 13: 'K'
        };

        // Główne zmienne stanu gry
        let deck = [];
        let stock = [];
        let waste = [];
        let foundations = [[], [], [], []]; 
        let tableau = [[], [], [], [], [], [], []]; 

        let drawCount = 3; 
        let movesCount = 0;
        let timerInterval = null;
        let timeElapsed = 0;
        let gameActive = false;
        let gameHistory = []; 
        let autoSolving = false;

        // Zmienne do Drag & Drop
        let dragSource = null;
        let dragCards = [];
        let dragOffset = { x: 0, y: 0 };
        let dragElements = [];
        let mousePos = { x: 0, y: 0 };

        class GameAudio {
            constructor() {
                this.ctx = null;
                this.isMuted = true; // Domyślnie wyłączony
            }
            init() {
                if (this.isMuted) return;
                if (!this.ctx) {
                    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
                }
            }
            toggleMute() {
                this.isMuted = !this.isMuted;
                if (!this.isMuted) {
                    this.init();
                }
                return this.isMuted;
            }
            playFlip() {
                if (this.isMuted) return;
                this.init();
                if (!this.ctx) return;
                let osc = this.ctx.createOscillator();
                let gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(140, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + 0.08);
                gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.08);
            }
            playSlide() {
                if (this.isMuted) return;
                this.init();
                if (!this.ctx) return;
                let osc = this.ctx.createOscillator();
                let gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.12);
            }
            playShuffle() {
                if (this.isMuted) return;
                this.init();
                if (!this.ctx) return;
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        let osc = this.ctx.createOscillator();
                        let gain = this.ctx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(90 + Math.random() * 110, this.ctx.currentTime);
                        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.005, this.ctx.currentTime + 0.06);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start();
                        osc.stop(this.ctx.currentTime + 0.06);
                    }, i * 50);
                }
            }
            playWin() {
                if (this.isMuted) return;
                this.init();
                if (!this.ctx) return;
                let notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C, E, G, C, E
                notes.forEach((freq, idx) => {
                    setTimeout(() => {
                        let osc = this.ctx.createOscillator();
                        let gain = this.ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start();
                        osc.stop(this.ctx.currentTime + 0.35);
                    }, idx * 110);
                });
            }
        }
        const audio = new GameAudio();

        function createCardSVG(card) {
            // REWERS PIATNIK (Geometryczna czerwono-złota koszulka)
            if (!card.faceUp) {
                return `
                    <div class="w-full h-full rounded-lg relative overflow-hidden flex items-center justify-center p-1" style="background: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22><rect width=%2216%22 height=%2216%22 fill=%22%23a81a1a%22/><path d=%22M0 8h16M8 0v16%22 stroke=%22%23bd2323%22 stroke-width=%221%22/><path d=%22M0 0l16 16M16 0L0 16%22 stroke=%22%23ffd700%22 stroke-width=%220.5%22 opacity=%220.3%22/><circle cx=%228%22 cy=%228%22 r=%223%22 fill=%22none%22 stroke=%22%23ffd700%22 stroke-width=%220.6%22 opacity=%220.5%22/></svg>'); border: 3px solid white; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.15)">
                        <div class="w-full h-full border border-amber-400/35 rounded flex items-center justify-center">
                            <svg class="w-8 h-8 opacity-45 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13H5.5L12 6.5z"/>
                            </svg>
                        </div>
                    </div>
                `;
            }

            const suitInfo = SUITS[card.suit];
            const isRed = suitInfo.isRed;
            const rankStr = RANKS[card.rank];
            const colorClass = isRed ? 'text-red-600' : 'text-slate-900';

            // ŚRODEK KARTY (Środkowe 76% wysokości)
            let centerContent = '';
            if (card.rank >= 11) {
                let figId = '';
                if (card.rank === 11) figId = '#figure-j';
                else if (card.rank === 12) figId = '#figure-q';
                else figId = '#figure-k';

                centerContent = `
                    <div class="absolute overflow-hidden rounded border border-slate-200 bg-[#fefdfa]" style="left: var(--card-face-inset-x); right: var(--card-face-inset-x); top: var(--card-corner-band); bottom: var(--card-corner-band);">
                        <svg viewBox="10 10 80 130" class="w-full h-full">
                            <use href="${figId}" />
                            <svg x="14" y="14" width="18" height="18" viewBox="0 0 100 100" style="width: var(--card-figure-corner-suit-size); height: var(--card-figure-corner-suit-size);">
                                <use href="${suitInfo.defId}" />
                            </svg>
                            <svg x="68" y="98" width="18" height="18" viewBox="0 0 100 100" transform="rotate(180 9 9)" style="width: var(--card-figure-corner-suit-size); height: var(--card-figure-corner-suit-size);">
                                <use href="${suitInfo.defId}" />
                            </svg>
                        </svg>
                    </div>
                `;
            } else {
                // Tradycyjne ułożenie punktów na kartach numerycznych (Środkowe 76% wysokości)
                centerContent = `<div class="absolute grid grid-cols-3 justify-items-center items-center opacity-95" style="left: var(--card-face-inset-x); right: var(--card-face-inset-x); top: calc(var(--card-corner-band) + var(--card-height) * 0.03); bottom: calc(var(--card-corner-band) + var(--card-height) * 0.03);">`;
                const spots = getSuitSpots(card.rank);
                for (let i = 0; i < 9; i++) {
                    if (spots[i]) {
                        centerContent += `
                            <svg viewBox="0 0 100 100" style="width: var(--card-pip-size); height: var(--card-pip-size);">
                                <use href="${suitInfo.defId}" />
                            </svg>
                        `;
                    } else {
                        centerContent += `<div></div>`;
                    }
                }
                centerContent += `</div>`;
            }

            // GWARANTOWANE PROPORCJE 12% DLA NAROŻNIKÓW I NAZWY KARTY (Zgodnie z wytyczną górnych i dolnych 12%)
            return `
                <div class="w-full h-full rounded-lg bg-white relative border border-slate-300 ${colorClass}">
                    <!-- Górne 12% - Nagłówek -->
                    <div class="absolute top-0 left-0 right-0 flex items-center justify-between border-b border-slate-100/30" style="height: var(--card-corner-band); padding: var(--card-corner-pad-y) var(--card-corner-pad-x) 0;">
                        <span class="font-black leading-none" style="font-size: var(--card-corner-rank-size); letter-spacing: calc(var(--card-width) * -0.02); line-height: 0.8;">${rankStr}</span>
                        <svg viewBox="0 0 100 100" style="width: var(--card-corner-suit-size); height: var(--card-corner-suit-size); flex: 0 0 auto;">
                            <use href="${suitInfo.defId}" />
                        </svg>
                    </div>

                    <!-- Środkowe 76% - Ilustracja / Figury -->
                    ${centerContent}

                    <!-- Dolne 12% - Odwrócona Stopka -->
                    <div class="absolute bottom-0 left-0 right-0 flex items-center justify-between transform rotate-180 border-b border-slate-100/30" style="height: var(--card-corner-band); padding: var(--card-corner-pad-y) var(--card-corner-pad-x) 0;">
                        <span class="font-black leading-none" style="font-size: var(--card-corner-rank-size); letter-spacing: calc(var(--card-width) * -0.02); line-height: 0.8;">${rankStr}</span>
                        <svg viewBox="0 0 100 100" style="width: var(--card-corner-suit-size); height: var(--card-corner-suit-size); flex: 0 0 auto;">
                            <use href="${suitInfo.defId}" />
                        </svg>
                    </div>
                </div>
            `;
        }

        // Pomocnicza matryca punktów na kartach numerycznych
        function getSuitSpots(rank) {
            const matrix = Array(9).fill(false);
            if (rank === 1) matrix[4] = true; 
            else if (rank === 2) { matrix[1] = true; matrix[7] = true; }
            else if (rank === 3) { matrix[1] = true; matrix[4] = true; matrix[7] = true; }
            else if (rank === 4) { matrix[0] = true; matrix[2] = true; matrix[6] = true; matrix[8] = true; }
            else if (rank === 5) { matrix[0] = true; matrix[2] = true; matrix[4] = true; matrix[6] = true; matrix[8] = true; }
            else if (rank === 6) { matrix[0] = true; matrix[2] = true; matrix[3] = true; matrix[5] = true; matrix[6] = true; matrix[8] = true; }
            else if (rank === 7) { matrix[0] = true; matrix[2] = true; matrix[3] = true; matrix[4] = true; matrix[5] = true; matrix[6] = true; matrix[8] = true; }
            else if (rank === 8) { matrix[0] = true; matrix[2] = true; matrix[3] = true; matrix[5] = true; matrix[6] = true; matrix[8] = true; matrix[1] = true; matrix[7] = true; }
            else if (rank === 9 || rank === 10) {
                return [true, false, true, true, rank === 9, true, true, false, true];
            }
            return matrix;
        }

        function initDeck() {
            deck = [];
            const suits = ['S', 'H', 'D', 'C'];
            for (let suit of suits) {
                for (let rank = 1; rank <= 13; rank++) {
                    deck.push({
                        id: `${suit}-${rank}`,
                        suit: suit,
                        rank: rank,
                        faceUp: false
                    });
                }
            }
        }

        function shuffle(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }

        function dealGame() {
            initDeck();
            shuffle(deck);
            audio.playShuffle();

            foundations = [[], [], [], []];
            tableau = [[], [], [], [], [], [], []];
            waste = [];
            stock = [];
            autoSolving = false;

            // Układ według reguły użytkownika:
            // 7 kolumn: od 1 karty po lewej (tableau-0) do 7 kart po prawej (tableau-6).
            // Pierwsza rozdawana karta leży na samym dole (index 0). Kolejne są na niej układane.
            let deckIndex = 0;
            for (let colIdx = 0; colIdx < 7; colIdx++) {
                const count = colIdx + 1; 
                for (let i = 0; i < count; i++) {
                    const card = deck[deckIndex++];
                    if (i === count - 1) {
                        card.faceUp = true;
                    }
                    tableau[colIdx].push(card);
                }
            }

            while (deckIndex < deck.length) {
                stock.push(deck[deckIndex++]);
            }

            movesCount = 0;
            timeElapsed = 0;
            gameActive = false;
            gameHistory = [];
            stopTimer();
            updateStats();
            document.getElementById('autosolve-btn').classList.add('hidden');

            renderAll();
            saveState(); 
        }

        function saveState() {
            const state = {
                stock: JSON.parse(JSON.stringify(stock)),
                waste: JSON.parse(JSON.stringify(waste)),
                foundations: JSON.parse(JSON.stringify(foundations)),
                tableau: JSON.parse(JSON.stringify(tableau)),
                movesCount: movesCount
            };
            gameHistory.push(state);
            if (gameHistory.length > 51) {
                gameHistory.shift();
            }
            updateUndoButton();
        }

        function undo() {
            if (gameHistory.length <= 1) return;
            
            gameHistory.pop(); 
            const prevState = gameHistory[gameHistory.length - 1];
            
            stock = JSON.parse(JSON.stringify(prevState.stock));
            waste = JSON.parse(JSON.stringify(prevState.waste));
            foundations = JSON.parse(JSON.stringify(prevState.foundations));
            tableau = JSON.parse(JSON.stringify(prevState.tableau));
            movesCount = prevState.movesCount;

            audio.playFlip();
            updateStats();
            updateUndoButton();
            renderAll();
            checkAutoSolveAvailability();
            checkNoMoves();
        }

        function updateUndoButton() {
            document.getElementById('undo-btn').disabled = gameHistory.length <= 1;
        }

        function formatTime(seconds) {
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            return `${m}:${s}`;
        }

        function updateStats() {
            document.getElementById('moves-display').textContent = movesCount;
            document.getElementById('timer-display').textContent = formatTime(timeElapsed);
            
            const bestTime = localStorage.getItem('solitaire_piatnik_best');
            if (bestTime) {
                document.getElementById('best-time-display').textContent = formatTime(parseInt(bestTime));
            } else {
                document.getElementById('best-time-display').textContent = '--:--';
            }
        }

        function startTimer() {
            if (gameActive) return;
            gameActive = true;
            timerInterval = setInterval(() => {
                timeElapsed++;
                document.getElementById('timer-display').textContent = formatTime(timeElapsed);
            }, 1000);
        }

        function stopTimer() {
            clearInterval(timerInterval);
            timerInterval = null;
            gameActive = false;
        }

        function renderAll() {
            renderStock();
            renderWaste();
            renderFoundations();
            renderTableau();
        }

        function renderStock() {
            const stockPile = document.getElementById('stock-pile');
            const reloadIcon = stockPile.querySelector('div');
            stockPile.innerHTML = '';
            stockPile.appendChild(reloadIcon);

            if (stock.length > 0) {
                const cardEl = document.createElement('div');
                cardEl.className = 'card back w-full h-full';
                cardEl.innerHTML = createCardSVG({ faceUp: false });
                stockPile.appendChild(cardEl);
            }
        }

        function renderWaste() {
            const wastePile = document.getElementById('waste-pile');
            wastePile.innerHTML = '';

            const showCount = Math.min(waste.length, drawCount);
            const startIndex = waste.length - showCount;

            for (let i = startIndex; i < waste.length; i++) {
                const card = waste[i];
                const cardEl = document.createElement('div');
                cardEl.className = 'card';
                cardEl.id = card.id;
                cardEl.innerHTML = createCardSVG(card);

                const offsetIdx = i - startIndex;
                cardEl.style.left = `${offsetIdx * 16}px`;
                cardEl.style.top = '0px';

                if (i === waste.length - 1) {
                    setupDragAndDrop(cardEl, 'waste');
                    cardEl.addEventListener('dblclick', () => autoPlayCard(card, 'waste'));
                } else {
                    cardEl.style.pointerEvents = 'none';
                }

                wastePile.appendChild(cardEl);
            }
        }

        function renderFoundations() {
            for (let i = 0; i < 4; i++) {
                const foundPile = document.getElementById(`foundation-${i}`);
                const existingCards = foundPile.querySelectorAll('.card');
                existingCards.forEach(c => c.remove());

                const pile = foundations[i];
                if (pile.length > 0) {
                    const card = pile[pile.length - 1];
                    const cardEl = document.createElement('div');
                    cardEl.className = 'card';
                    cardEl.id = card.id;
                    cardEl.innerHTML = createCardSVG(card);
                    cardEl.style.left = '0px';
                    cardEl.style.top = '0px';

                    setupDragAndDrop(cardEl, `foundation-${i}`);
                    cardEl.addEventListener('dblclick', () => autoPlayFromFoundation(card, `foundation-${i}`));
                    foundPile.appendChild(cardEl);
                }
            }
        }

        function renderTableau() {
            for (let colIdx = 0; colIdx < 7; colIdx++) {
                const colEl = document.getElementById(`tableau-${colIdx}`);
                colEl.innerHTML = '';

                const colCards = tableau[colIdx];
                colCards.forEach((card, cardIdx) => {
                    const cardEl = document.createElement('div');
                    cardEl.className = `card ${!card.faceUp ? 'back' : ''}`;
                    cardEl.id = card.id;
                    cardEl.innerHTML = createCardSVG(card);

                    // PRECYZYJNA KASKADA W DÓŁ (ZAKRYWAJĄCA DOKŁADNIE 88% poprzedniej karty)
                    cardEl.style.top = 'calc(' + cardIdx + ' * var(--tableau-offset-y))';
                    cardEl.style.left = '0px';
                    cardEl.style.zIndex = cardIdx;

                    if (card.faceUp) {
                        setupDragAndDrop(cardEl, `tableau-${colIdx}`, cardIdx);
                        if (cardIdx === colCards.length - 1) {
                            cardEl.addEventListener('dblclick', () => autoPlayCard(card, `tableau-${colIdx}`));
                        }
                    }

                    colEl.appendChild(cardEl);
                });
            }
        }

        function setupDragAndDrop(element, source, cardIndex = -1) {
            function startDrag(clientX, clientY) {
                if (autoSolving) return false;
                startTimer();

                dragSource = source;
                let cardsToDrag = [];

                if (source.startsWith('tableau-')) {
                    const colIdx = parseInt(source.split('-')[1]);
                    cardsToDrag = tableau[colIdx].slice(cardIndex);
                } else if (source === 'waste') {
                    cardsToDrag = [waste[waste.length - 1]];
                } else if (source.startsWith('foundation-')) {
                    const foundIdx = parseInt(source.split('-')[1]);
                    cardsToDrag = [foundations[foundIdx][foundations[foundIdx].length - 1]];
                }

                if (cardsToDrag.length === 0) return false;
                dragCards = cardsToDrag;

                const clickedRect = element.getBoundingClientRect();
                dragOffset.x = clientX - clickedRect.left;
                dragOffset.y = clientY - clickedRect.top;

                dragElements = [];
                dragCards.forEach((card, idx) => {
                    const origEl = document.getElementById(card.id);
                    const origRect = origEl.getBoundingClientRect();

                    const clone = document.createElement('div');
                    clone.className = 'card dragging';
                    clone.innerHTML = createCardSVG(card);
                    clone.style.position = 'fixed';
                    clone.style.pointerEvents = 'none';
                    clone.style.zIndex = (1000 + idx).toString();

                    const relLeft = origRect.left - clickedRect.left;
                    const relTop = origRect.top - clickedRect.top;

                    clone.style.left = `${clickedRect.left + relLeft}px`;
                    clone.style.top = `${clickedRect.top + relTop}px`;

                    document.body.appendChild(clone);
                    dragElements.push({ el: clone, relLeft, relTop });
                });

                toggleOriginalCardsVisibility(false);
                return true;
            }

            element.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                if (startDrag(e.clientX, e.clientY)) {
                    window.addEventListener('mousemove', onMouseMove);
                    window.addEventListener('mouseup', onMouseUp);
                }
            });

            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const t = e.touches[0];
                if (startDrag(t.clientX, t.clientY)) {
                    window.addEventListener('touchmove', onTouchMove, { passive: false });
                    window.addEventListener('touchend', onTouchEnd);
                }
            }, { passive: false });
        }

        function toggleOriginalCardsVisibility(visible) {
            dragCards.forEach(card => {
                const el = document.getElementById(card.id);
                if (el) el.style.opacity = visible ? '1' : '0';
            });
        }

        function moveDragClones(clientX, clientY) {
            mousePos.x = clientX;
            mousePos.y = clientY;
            dragElements.forEach(item => {
                item.el.style.left = `${clientX - dragOffset.x + item.relLeft}px`;
                item.el.style.top  = `${clientY - dragOffset.y + item.relTop}px`;
            });
        }

        function finishDrop(clientX, clientY) {
            dragElements.forEach(item => item.el.remove());
            const dropTarget = findDropTarget(clientX, clientY);
            if (dropTarget && isValidMove(dragCards[0], dropTarget)) {
                audio.playSlide();
                executeMove(dragCards, dragSource, dropTarget);
            } else {
                toggleOriginalCardsVisibility(true);
            }
            dragSource = null;
            dragCards = [];
            dragElements = [];
        }

        function onMouseMove(e) { moveDragClones(e.clientX, e.clientY); }

        function onMouseUp(e) {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            finishDrop(e.clientX, e.clientY);
        }

        function onTouchMove(e) {
            e.preventDefault();
            const t = e.touches[0];
            moveDragClones(t.clientX, t.clientY);
        }

        function onTouchEnd(e) {
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
            const t = e.changedTouches[0];
            finishDrop(t.clientX, t.clientY);
        }

        function isValidMove(card, target) {
            if (target.type === 'tableau') {
                const colIdx = target.index;
                const colCards = tableau[colIdx];

                if (colCards.length === 0) {
                    return card.rank === 13; 
                } else {
                    const topCard = colCards[colCards.length - 1];
                    const isAltColor = SUITS[card.suit].isRed !== SUITS[topCard.suit].isRed;
                    const isOneLess = topCard.rank === card.rank + 1;
                    return isAltColor && isOneLess;
                }
            }

            if (target.type === 'foundation') {
                if (dragCards.length > 1) return false;

                const foundIdx = target.index;
                const foundCards = foundations[foundIdx];

                if (foundCards.length === 0) {
                    return card.rank === 1; 
                } else {
                    const topCard = foundCards[foundCards.length - 1];
                    const sameSuit = card.suit === topCard.suit;
                    const isOneMore = card.rank === topCard.rank + 1;
                    return sameSuit && isOneMore;
                }
            }

            return false;
        }

        function findDropTarget(x, y) {
            // Kolumny Tableau
            for (let i = 0; i < 7; i++) {
                const el = document.getElementById(`tableau-${i}`);
                const rect = el.getBoundingClientRect();
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom + 350) {
                    return { type: 'tableau', index: i };
                }
            }

            // Fundamenty
            for (let i = 0; i < 4; i++) {
                const el = document.getElementById(`foundation-${i}`);
                const rect = el.getBoundingClientRect();
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    return { type: 'foundation', index: i };
                }
            }

            return null;
        }

        function executeMove(cards, source, target) {
            saveState();

            if (source.startsWith('tableau-')) {
                const srcColIdx = parseInt(source.split('-')[1]);
                tableau[srcColIdx].splice(tableau[srcColIdx].length - cards.length);
                
                if (tableau[srcColIdx].length > 0 && !tableau[srcColIdx][tableau[srcColIdx].length - 1].faceUp) {
                    tableau[srcColIdx][tableau[srcColIdx].length - 1].faceUp = true;
                    setTimeout(() => audio.playFlip(), 100);
                }
            } else if (source === 'waste') {
                waste.pop();
            } else if (source.startsWith('foundation-')) {
                const srcFoundIdx = parseInt(source.split('-')[1]);
                foundations[srcFoundIdx].pop();
            }

            if (target.type === 'tableau') {
                tableau[target.index].push(...cards);
            } else if (target.type === 'foundation') {
                foundations[target.index].push(cards[0]);
            }

            movesCount++;
            updateStats();
            renderAll();

            checkWinCondition();
            checkAutoSolveAvailability();
            checkNoMoves();
        }

        function autoPlayCard(card, source) {
            startTimer();
            // Próba na fundamenty
            for (let i = 0; i < 4; i++) {
                const target = { type: 'foundation', index: i };
                if (isValidMove(card, target)) {
                    audio.playSlide();
                    executeMove([card], source, target);
                    return;
                }
            }

            // Próba na kolumny robocze
            for (let i = 0; i < 7; i++) {
                const target = { type: 'tableau', index: i };
                if (isValidMove(card, target)) {
                    audio.playSlide();
                    executeMove([card], source, target);
                    return;
                }
            }
        }

        function autoPlayFromFoundation(card, source) {
            startTimer();
            for (let i = 0; i < 7; i++) {
                const target = { type: 'tableau', index: i };
                if (isValidMove(card, target)) {
                    audio.playSlide();
                    executeMove([card], source, target);
                    return;
                }
            }
        }

        document.getElementById('stock-pile').addEventListener('click', () => {
            if (autoSolving) return;
            startTimer();
            saveState();

            if (stock.length > 0) {
                const countToDraw = Math.min(stock.length, drawCount);
                for (let i = 0; i < countToDraw; i++) {
                    const card = stock.pop();
                    card.faceUp = true;
                    waste.push(card);
                }
                audio.playFlip();
            } else {
                if (waste.length === 0) return;
                
                while (waste.length > 0) {
                    const card = waste.pop();
                    card.faceUp = false;
                    stock.push(card);
                }
                stock.reverse();
                audio.playShuffle();
            }

            movesCount++;
            updateStats();
            renderAll();
            checkNoMoves();
        });

        function getHint() {
            if (waste.length > 0) {
                const topWaste = waste[waste.length - 1];
                for (let i = 0; i < 4; i++) {
                    if (isValidMove(topWaste, { type: 'foundation', index: i })) {
                        return { cardId: topWaste.id, targetId: `foundation-${i}` };
                    }
                }
            }
            for (let i = 0; i < 7; i++) {
                const col = tableau[i];
                if (col.length > 0) {
                    const topCard = col[col.length - 1];
                    for (let fIdx = 0; fIdx < 4; fIdx++) {
                        if (isValidMove(topCard, { type: 'foundation', index: fIdx })) {
                            return { cardId: topCard.id, targetId: `foundation-${fIdx}` };
                        }
                    }
                }
            }
            if (waste.length > 0) {
                const topWaste = waste[waste.length - 1];
                for (let i = 0; i < 7; i++) {
                    if (isValidMove(topWaste, { type: 'tableau', index: i })) {
                        return { cardId: topWaste.id, targetId: `tableau-${i}` };
                    }
                }
            }
            for (let srcIdx = 0; srcIdx < 7; srcIdx++) {
                const col = tableau[srcIdx];
                if (col.length === 0) continue;
                const firstFaceUp = col.findIndex(c => c.faceUp);
                if (firstFaceUp === -1) continue;

                for (let cardIdx = firstFaceUp; cardIdx < col.length; cardIdx++) {
                    const card = col[cardIdx];
                    for (let destIdx = 0; destIdx < 7; destIdx++) {
                        if (srcIdx === destIdx) continue;
                        if (isValidMove(card, { type: 'tableau', index: destIdx })) {
                            if (cardIdx === 0 && card.rank === 13 && tableau[destIdx].length === 0) continue;
                            return { cardId: card.id, targetId: `tableau-${destIdx}` };
                        }
                    }
                }
            }
            return null;
        }

        function triggerHint() {
            if (autoSolving) return;
            const hint = getHint();
            if (!hint) {
                if (stock.length > 0 || waste.length > 0) {
                    pulseElement(document.getElementById('stock-pile'));
                }
                return;
            }

            const cardEl = document.getElementById(hint.cardId);
            const targetEl = document.getElementById(hint.targetId);

            if (cardEl) pulseElement(cardEl);
            if (targetEl) pulseElement(targetEl);
        }

        function pulseElement(el) {
            el.classList.add('hint-pulse');
            setTimeout(() => {
                el.classList.remove('hint-pulse');
            }, 1400);
        }

        function checkAutoSolveAvailability() {
            const btn = document.getElementById('autosolve-btn');
            if (canAutoSolve()) {
                btn.classList.remove('hidden');
            } else {
                btn.classList.add('hidden');
            }
        }

        function canAutoSolve() {
            if (stock.length > 0 || waste.length > 0) return false;
            for (let col of tableau) {
                if (col.some(c => !c.faceUp)) return false;
            }
            const totalOnTable = tableau.reduce((acc, col) => acc + col.length, 0);
            return totalOnTable > 0;
        }

        function startAutoSolve() {
            if (autoSolving) return;
            autoSolving = true;
            document.getElementById('autosolve-btn').classList.add('hidden');

            function step() {
                if (!autoSolving || !canAutoSolve()) {
                    autoSolving = false;
                    checkWinCondition();
                    return;
                }

                let moved = false;
                for (let colIdx = 0; colIdx < 7; colIdx++) {
                    const col = tableau[colIdx];
                    if (col.length === 0) continue;
                    const topCard = col[col.length - 1];

                    for (let fIdx = 0; fIdx < 4; fIdx++) {
                        if (isValidMove(topCard, { type: 'foundation', index: fIdx })) {
                            audio.playSlide();
                            executeMove([topCard], `tableau-${colIdx}`, { type: 'foundation', index: fIdx });
                            moved = true;
                            break;
                        }
                    }
                    if (moved) break;
                }

                if (moved) {
                    setTimeout(step, 120);
                } else {
                    autoSolving = false;
                }
            }
            step();
        }

        function hasPossibleMoves() {
            if (stock.length > 0) return true;

            if (waste.length > 0) {
                const topWaste = waste[waste.length - 1];
                for (let i = 0; i < 4; i++) {
                    if (isValidMove(topWaste, { type: 'foundation', index: i })) return true;
                }
                for (let i = 0; i < 7; i++) {
                    if (isValidMove(topWaste, { type: 'tableau', index: i })) return true;
                }
            }

            for (let srcIdx = 0; srcIdx < 7; srcIdx++) {
                const col = tableau[srcIdx];
                if (col.length === 0) continue;

                const firstFaceUpIdx = col.findIndex(c => c.faceUp);
                if (firstFaceUpIdx === -1) continue;

                for (let cardIdx = firstFaceUpIdx; cardIdx < col.length; cardIdx++) {
                    const card = col[cardIdx];

                    for (let destIdx = 0; destIdx < 7; destIdx++) {
                        if (srcIdx === destIdx) continue;
                        if (isValidMove(card, { type: 'tableau', index: destIdx })) {
                            if (cardIdx === 0 && card.rank === 13 && tableau[destIdx].length === 0) continue;
                            return true;
                        }
                    }

                    if (cardIdx === col.length - 1) {
                        for (let fIdx = 0; fIdx < 4; fIdx++) {
                            if (isValidMove(card, { type: 'foundation', index: fIdx })) return true;
                        }
                    }
                }
            }

            for (let fIdx = 0; fIdx < 4; fIdx++) {
                const fPile = foundations[fIdx];
                if (fPile.length === 0) continue;
                const topFoundCard = fPile[fPile.length - 1];

                for (let tIdx = 0; tIdx < 7; tIdx++) {
                    if (isValidMove(topFoundCard, { type: 'tableau', index: tIdx })) return true;
                }
            }

            return false;
        }

        function checkNoMoves() {
            let totalFoundationCards = foundations.reduce((acc, pile) => acc + pile.length, 0);
            if (totalFoundationCards === 52 || canAutoSolve()) return;

            if (!hasPossibleMoves()) {
                setTimeout(() => {
                    const modal = document.getElementById('no-moves-modal');
                    modal.classList.remove('hidden');
                    setTimeout(() => {
                        modal.classList.add('opacity-100');
                        modal.querySelector('div').classList.remove('scale-90');
                    }, 50);
                }, 1200);
            }
        }

        function hideModal(modalId) {
            const modal = document.getElementById(modalId);
            modal.classList.add('opacity-100');
            modal.querySelector('div').classList.add('scale-90');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }

        let animationFrameId = null;
        let bouncers = [];

        class CardBouncer {
            constructor(card, startX, startY) {
                this.card = card;
                this.x = startX;
                this.y = startY;
                this.vx = (Math.random() * 4.5 + 2) * (Math.random() < 0.5 ? 1 : -1);
                this.vy = Math.random() * -5 - 3;
                this.gravity = 0.28;
                this.bounce = 0.82;
                this.canvasWidth = window.innerWidth;
                this.canvasHeight = window.innerHeight;
                this.finished = false;

                this.offscreenCanvas = document.createElement('canvas');
                this.offscreenCanvas.width = 100;
                this.offscreenCanvas.height = 145;
                const ctx = this.offscreenCanvas.getContext('2d');
                
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.roundRect(0, 0, 100, 145, 8);
                ctx.fill();
                ctx.strokeStyle = '#cccccc';
                ctx.stroke();

                const sInfo = SUITS[card.suit];
                ctx.fillStyle = sInfo.isRed ? '#d32f2f' : '#1b1c1e';
                ctx.font = 'bold 20px Inter, sans-serif';
                ctx.fillText(RANKS[card.rank], 8, 25);
                ctx.font = '24px Inter, sans-serif';
                ctx.fillText(sInfo.symbol, 8, 50);

                ctx.save();
                ctx.translate(100, 145);
                ctx.rotate(Math.PI);
                ctx.font = 'bold 20px Inter, sans-serif';
                ctx.fillText(RANKS[card.rank], 8, 25);
                ctx.font = '24px Inter, sans-serif';
                ctx.fillText(sInfo.symbol, 8, 50);
                ctx.restore();
            }

            update() {
                this.x += this.vx;
                this.vy += this.gravity;
                this.y += this.vy;

                if (this.y + 145 >= this.canvasHeight) {
                    this.y = this.canvasHeight - 145;
                    this.vy = -this.vy * this.bounce;
                    if (Math.abs(this.vy) < 1.6) {
                        this.vy = 0;
                    }
                }

                if (this.x < -120 || this.x > this.canvasWidth + 20) {
                    this.finished = true;
                }
            }

            draw(ctx) {
                ctx.drawImage(this.offscreenCanvas, this.x, this.y);
            }
        }

        function triggerVictoryAnimation() {
            stopTimer();
            audio.playWin();
            
            // Zapis najlepszego czasu
            const bestTime = localStorage.getItem('solitaire_piatnik_best');
            if (!bestTime || timeElapsed < parseInt(bestTime)) {
                localStorage.setItem('solitaire_piatnik_best', timeElapsed);
            }

            document.getElementById('victory-time').textContent = formatTime(timeElapsed);
            document.getElementById('victory-moves').textContent = movesCount;

            const canvas = document.getElementById('victory-canvas');
            canvas.style.display = 'block';
            canvas.style.pointerEvents = 'auto';
            canvas.style.cursor = 'pointer';
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            bouncers = [];
            let cardQueue = [];
            // Przygotowanie kolejki (od Królów do Asów na każdym stosie bazowym)
            for (let r = 13; r >= 1; r--) {
                for (let fIdx = 0; fIdx < 4; fIdx++) {
                    const card = foundations[fIdx].find(c => c.rank === r);
                    if (card) {
                        const pileEl = document.getElementById(`foundation-${fIdx}`);
                        const rect = pileEl.getBoundingClientRect();
                        cardQueue.push({ card, x: rect.left, y: rect.top });
                    }
                }
            }

            let queueIdx = 0;
            function spawnNext() {
                if (queueIdx < cardQueue.length) {
                    const info = cardQueue[queueIdx++];
                    bouncers.push(new CardBouncer(info.card, info.x, info.y));
                    setTimeout(spawnNext, 120);
                }
            }
            spawnNext();

            function loop() {
                // Pozostawianie nostalgicznej smugi ruchu kart (Hall of Mirrors)
                ctx.fillStyle = 'rgba(6, 31, 16, 0.12)';
                
                bouncers.forEach(bouncer => {
                    bouncer.update();
                    bouncer.draw(ctx);
                });

                bouncers = bouncers.filter(b => !b.finished);

                if (bouncers.length > 0 || queueIdx < cardQueue.length) {
                    animationFrameId = requestAnimationFrame(loop);
                } else {
                    const canvasEl = document.getElementById('victory-canvas');
                    canvasEl.style.pointerEvents = 'none';
                    canvasEl.style.cursor = 'default';

                    const modal = document.getElementById('victory-modal');
                    modal.classList.remove('hidden');
                    setTimeout(() => {
                        modal.classList.add('opacity-100');
                        modal.querySelector('div').classList.remove('scale-90');
                    }, 50);
                }
            }
            loop();
        }

        function stopVictoryAnimation() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            const canvas = document.getElementById('victory-canvas');
            canvas.style.display = 'none';
            canvas.style.pointerEvents = 'none';
            canvas.style.cursor = 'default';
        }

        function checkWinCondition() {
            let totalFoundationCards = foundations.reduce((acc, pile) => acc + pile.length, 0);
            if (totalFoundationCards === 52) {
                triggerVictoryAnimation();
            }
        }

        document.getElementById('draw-1-btn').addEventListener('click', () => {
            if (drawCount === 1) return;
            drawCount = 1;
            document.getElementById('draw-1-btn').classList.add('bg-amber-500', 'text-slate-950', 'shadow-md');
            document.getElementById('draw-3-btn').classList.remove('bg-amber-500', 'text-slate-950', 'shadow-md');
            dealGame();
        });

        document.getElementById('draw-3-btn').addEventListener('click', () => {
            if (drawCount === 3) return;
            drawCount = 3;
            document.getElementById('draw-3-btn').classList.add('bg-amber-500', 'text-slate-950', 'shadow-md');
            document.getElementById('draw-1-btn').classList.remove('bg-amber-500', 'text-slate-950', 'shadow-md');
            dealGame();
        });

        document.getElementById('undo-btn').addEventListener('click', undo);
        document.getElementById('hint-btn').addEventListener('click', triggerHint);
        document.getElementById('autosolve-btn').addEventListener('click', startAutoSolve);

        // Obsługa wyciszania dźwięku
        const audioBtn = document.getElementById('audio-toggle-btn');
        const audioBtnIcon = document.getElementById('audio-btn-icon');
        const audioBtnText = document.getElementById('audio-btn-text');

        audioBtn.addEventListener('click', () => {
            const muted = audio.toggleMute();
            if (muted) {
                audioBtnIcon.textContent = '🔇';
                audioBtnText.textContent = 'Dźwięk: Wył.';
                audioBtn.classList.remove('bg-amber-500/10', 'border-amber-500/30', 'text-amber-300');
                audioBtn.classList.add('bg-slate-800', 'text-white');
            } else {
                audioBtnIcon.textContent = '🔊';
                audioBtnText.textContent = 'Dźwięk: Wł.';
                audioBtn.classList.remove('bg-slate-800', 'text-white');
                audioBtn.classList.add('bg-amber-500/10', 'border-amber-500/30', 'text-amber-300');
                audio.playFlip(); // Delikatny dźwięk testowy przy włączeniu
            }
        });

        document.getElementById('restart-btn').addEventListener('click', () => {
            stopVictoryAnimation();
            dealGame();
        });

        document.getElementById('modal-undo-btn').addEventListener('click', () => {
            hideModal('no-moves-modal');
            undo();
        });

        document.getElementById('modal-restart-btn').addEventListener('click', () => {
            hideModal('no-moves-modal');
            dealGame();
        });

        document.getElementById('modal-close-btn').addEventListener('click', () => {
            hideModal('no-moves-modal');
        });

        document.getElementById('victory-restart-btn').addEventListener('click', () => {
            hideModal('victory-modal');
            stopVictoryAnimation();
            dealGame();
        });

        document.getElementById('victory-canvas').addEventListener('click', () => {
            if (animationFrameId) {
                stopVictoryAnimation();
                hideModal('victory-modal');
                dealGame();
            }
        });

        window.addEventListener('resize', () => {
            if (animationFrameId) {
                const canvas = document.getElementById('victory-canvas');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        });

        // Zoom kart
        const CARD_SCALE_MIN = 0.8;
        const CARD_SCALE_MAX = 1.6;
        const CARD_SCALE_STEP = 0.1;
        const CARD_SCALE_DEFAULT = 1.2;
        const CARD_SCALE_STORAGE_KEY = 'soltaire_card_scale';

        function applyCardScale(scale) {
            scale = Math.round(scale * 10) / 10;
            scale = Math.min(CARD_SCALE_MAX, Math.max(CARD_SCALE_MIN, scale));
            document.documentElement.style.setProperty('--card-scale', scale);
            localStorage.setItem(CARD_SCALE_STORAGE_KEY, scale);
            document.getElementById('zoom-in-btn').disabled = scale >= CARD_SCALE_MAX;
            document.getElementById('zoom-out-btn').disabled = scale <= CARD_SCALE_MIN;
        }

        function getCurrentCardScale() {
            return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--card-scale')) || CARD_SCALE_DEFAULT;
        }

        document.getElementById('zoom-in-btn').addEventListener('click', () => {
            applyCardScale(getCurrentCardScale() + CARD_SCALE_STEP);
        });

        document.getElementById('zoom-out-btn').addEventListener('click', () => {
            applyCardScale(getCurrentCardScale() - CARD_SCALE_STEP);
        });

        // Automatyczny start przy załadowaniu okna
        window.onload = function() {
            const savedScale = parseFloat(localStorage.getItem(CARD_SCALE_STORAGE_KEY));
            applyCardScale(isNaN(savedScale) ? CARD_SCALE_DEFAULT : savedScale);
            dealGame();
        };
