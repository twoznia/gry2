const LAYOUT_MAP = [
          { z: 0, tiles: [[0,4], [0,6], [0,8], [0,10], [0,12], [0,14], [0,16], [0,18], [0,20], [0,22], [0,24], [0,26], [2,8], [2,10], [2,12], [2,14], [2,16], [2,18], [2,20], [2,22], [4,6], [4,8], [4,10], [4,12], [4,14], [4,16], [4,18], [4,20], [4,22], [4,24], [6,4], [6,6], [6,8], [6,10], [6,12], [6,14], [6,16], [6,18], [6,20], [6,22], [6,24], [6,26], [7,2], [7,28], [7,30], [8,4], [8,6], [8,8], [8,10], [8,12], [8,14], [8,16], [8,18], [8,20], [8,22], [8,24], [8,26], [10,6], [10,8], [10,10], [10,12], [10,14], [10,16], [10,18], [10,20], [10,22], [10,24], [12,8], [12,10], [12,12], [12,14], [12,16], [12,18], [12,20], [12,22], [14,4], [14,6], [14,8], [14,10], [14,12], [14,14], [14,16], [14,18], [14,20], [14,22], [14,24], [14,26]] },
          { z: 1, tiles: [[2,10], [2,12], [2,14], [2,16], [2,18], [2,20], [4,10], [4,12], [4,14], [4,16], [4,18], [4,20], [6,10], [6,12], [6,14], [6,16], [6,18], [6,20], [8,10], [8,12], [8,14], [8,16], [8,18], [8,20], [10,10], [10,12], [10,14], [10,16], [10,18], [10,20], [12,10], [12,12], [12,14], [12,16], [12,18], [12,20]] },
          { z: 2, tiles: [[4,12], [4,14], [4,16], [4,18], [6,12], [6,14], [6,16], [6,18], [8,12], [8,14], [8,16], [8,18], [10,12], [10,14], [10,16], [10,18]] },
          { z: 3, tiles: [[6,14], [6,16], [8,14], [8,16]] },
          { z: 4, tiles: [[7,15]] }
        ];
        const LAYOUT_TILE_COUNT = LAYOUT_MAP.reduce((sum, layer) => sum + layer.tiles.length, 0);
        const STYLE_MANIFEST = window.MAHJONG_STYLE_MANIFEST || { styles: [] };
        const STYLE_STORAGE_KEY = 'mahjong_selected_style';
        const ZOOM_STORAGE_KEY = 'mahjong_zoom_level';
        const LEADERBOARD_STORAGE_KEY_PREFIX = 'mahjong_leaderboard_v2_';
        const DEFAULT_ZOOM_LEVEL = 1.2;
        const MOBILE_DEFAULT_ZOOM_LEVEL = 0.7;
        const MIN_ZOOM_LEVEL = 0.5;
        const MAX_ZOOM_LEVEL = 1.8;
        const ZOOM_STEP = 0.1;
        const TILE_WALL_DEPTH = 8;
        const VISUAL_LAYER_SHIFT_X = TILE_WALL_DEPTH;
        const VISUAL_LAYER_SHIFT_Y = TILE_WALL_DEPTH;
        const BOARD_VISUAL_PADDING_X = 8;
        const TIME_SCORE_PER_SECOND = 1;
        const SHOW_MOVE_PENALTY = 5;
        const UNDO_PENALTY = 5;
        const SHUFFLE_PENALTY = 30;
        const HINTS_FIRST_USE_PENALTY = 15;
        const PENALTY_CATEGORIES = ['hints', 'showMove', 'undo', 'shuffle'];
        const MAX_SHUFFLE_ATTEMPTS = 200;
        const MAX_LAYER_Z = LAYOUT_MAP.reduce((max, layer) => Math.max(max, layer.z), 0);
        const BOARD_CONTENT_BOUNDS = (() => {
            let minTop = Number.POSITIVE_INFINITY;
            let maxBottom = Number.NEGATIVE_INFINITY;

            LAYOUT_MAP.forEach((layer) => {
                layer.tiles.forEach(([tileY]) => {
                    const visualTop = (tileY * 30) + ((MAX_LAYER_Z * VISUAL_LAYER_SHIFT_Y) - (layer.z * VISUAL_LAYER_SHIFT_Y));
                    const visualBottom = visualTop + 60 + TILE_WALL_DEPTH;
                    minTop = Math.min(minTop, visualTop);
                    maxBottom = Math.max(maxBottom, visualBottom);
                });
            });

            return {
                topInset: Number.isFinite(minTop) ? minTop : 0,
                bottomInset: Number.isFinite(maxBottom) ? Math.max(0, 568 - maxBottom) : 0
            };
        })();

        let tilesOnBoard = [];
        let selectedTileRef = null;
        let deckBase = [];
        let selectedStyleId = null;
        let hintsEnabled = false;
        let zoomLevel = DEFAULT_ZOOM_LEVEL;
        let hintedTiles = [];
        let timerIntervalId = null;
        let elapsedSeconds = 0;
        let currentScore = 0;
        let penaltyScore = 0;
        let powerupsUsed = false;
        let penaltyBreakdown = createEmptyPenaltyBreakdown();
        let hintsPenaltyApplied = false;
        let gameCompleted = false;
        let pendingLeaderboardEntry = null;
        let highlightedLeaderboardEntryId = null;
        let undoState = null;

        const boardEl = document.getElementById('board');
        const countEl = document.getElementById('tiles-count');
        const scoreDisplayEl = document.getElementById('score-display');
        const timerDisplayEl = document.getElementById('timer-display');
        const modal = document.getElementById('message-modal');
        const modalContent = document.getElementById('modal-content');
        const leaderboardModalEl = document.getElementById('leaderboard-modal');
        const leaderboardTitleEl = document.getElementById('leaderboard-title');
        const leaderboardMessageEl = document.getElementById('leaderboard-message');
        const leaderboardListEl = document.getElementById('leaderboard-list');
        const leaderboardEmptyEl = document.getElementById('leaderboard-empty');
        const leaderboardCloseBtnEl = document.getElementById('leaderboard-close-btn');
        const leaderboardRestartBtnEl = document.getElementById('leaderboard-restart-btn');
        const leaderboardResetBtnEl = document.getElementById('leaderboard-reset-btn');
        const nameEntryModalEl = document.getElementById('name-entry-modal');
        const nameEntryMessageEl = document.getElementById('name-entry-message');
        const nameEntryInputEl = document.getElementById('name-entry-input');
        const nameEntrySkipBtnEl = document.getElementById('name-entry-skip-btn');
        const nameEntrySaveBtnEl = document.getElementById('name-entry-save-btn');
        const styleSelectEl = document.getElementById('style-select');
        const styleTitleEl = document.getElementById('style-title');
        const hintToggleEl = document.getElementById('hint-toggle');
        const showMoveBtnEl = document.getElementById('show-move-btn');
        const undoBtnEl = document.getElementById('undo-btn');
        const showScoresBtnEl = document.getElementById('show-scores-btn');
        const zoomOutEl = document.getElementById('zoom-out');
        const zoomInEl = document.getElementById('zoom-in');
        const zoomResetEl = document.getElementById('zoom-reset');

        function applyHintState() {
            document.body.classList.toggle('hints-disabled', !hintsEnabled);
            hintToggleEl.classList.toggle('is-active', hintsEnabled);
            hintToggleEl.setAttribute('aria-pressed', hintsEnabled ? 'true' : 'false');
        }

        function toggleHints() {
            if (!hintsEnabled && !hintsPenaltyApplied) {
                hintsPenaltyApplied = true;
                powerupsUsed = true;
                addPenalty(HINTS_FIRST_USE_PENALTY, 'hints');
            }
            hintsEnabled = !hintsEnabled;
            applyHintState();
        }

        function clampZoom(level) {
            return Math.min(MAX_ZOOM_LEVEL, Math.max(MIN_ZOOM_LEVEL, level));
        }

        function getDefaultZoomLevel() {
            return window.matchMedia('(max-width: 768px)').matches ? MOBILE_DEFAULT_ZOOM_LEVEL : DEFAULT_ZOOM_LEVEL;
        }

        function saveZoomLevel() {
            localStorage.setItem(ZOOM_STORAGE_KEY, String(zoomLevel));
        }

        function updateZoomUI() {
            zoomResetEl.textContent = `${Math.round(zoomLevel * 100)}%`;
        }

        function setZoomLevel(nextLevel) {
            zoomLevel = clampZoom(Number(nextLevel) || getDefaultZoomLevel());
            saveZoomLevel();
            updateZoomUI();
            adjustBoardScale();
        }

        function loadZoomLevel() {
            const stored = Number(localStorage.getItem(ZOOM_STORAGE_KEY));
            zoomLevel = Number.isFinite(stored) && stored > 0 ? clampZoom(stored) : getDefaultZoomLevel();
            updateZoomUI();
        }

        function formatElapsedTime(totalSeconds) {
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            if (hours > 0) {
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        function recalculateScore() {
            currentScore = penaltyScore + (elapsedSeconds * TIME_SCORE_PER_SECOND);
        }

        function updateScoreDisplay() {
            recalculateScore();
            if (scoreDisplayEl) {
                scoreDisplayEl.textContent = String(currentScore);
            }
        }

        function createEmptyPenaltyBreakdown() {
            return {
                hints: 0,
                showMove: 0,
                undo: 0,
                shuffle: 0
            };
        }

        function normalizePenaltyBreakdown(value) {
            const normalized = createEmptyPenaltyBreakdown();
            if (!value || typeof value !== 'object') return normalized;

            PENALTY_CATEGORIES.forEach((category) => {
                normalized[category] = Number.isFinite(value[category]) ? value[category] : 0;
            });

            return normalized;
        }

        function formatPenaltyBreakdown(penalties) {
            const normalized = normalizePenaltyBreakdown(penalties);
            return `Kary: podsw. ${normalized.hints}, ruch ${normalized.showMove}, cofnij ${normalized.undo}, tasuj ${normalized.shuffle}`;
        }

        function addPenalty(points, category = null) {
            penaltyScore += points;
            if (category && Object.prototype.hasOwnProperty.call(penaltyBreakdown, category)) {
                penaltyBreakdown[category] += points;
            }
            updateScoreDisplay();
        }

        function getCurrentDateString() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        function updateUndoButton() {
            undoBtnEl.disabled = !undoState;
        }

        function updateTimerDisplay() {
            timerDisplayEl.textContent = formatElapsedTime(elapsedSeconds);
        }

        function stopTimer() {
            if (timerIntervalId) {
                clearInterval(timerIntervalId);
                timerIntervalId = null;
            }
        }

        function startTimer() {
            stopTimer();
            timerIntervalId = setInterval(() => {
                elapsedSeconds += 1;
                updateTimerDisplay();
                updateScoreDisplay();
            }, 1000);
        }

        function resetTimer() {
            elapsedSeconds = 0;
            updateTimerDisplay();
        }

        function isAnyOverlayOpen() {
            return !modal.classList.contains('hidden') || !leaderboardModalEl.classList.contains('hidden') || !nameEntryModalEl.classList.contains('hidden');
        }

        function isGameActive() {
            return !gameCompleted && tilesOnBoard.some(tile => !tile.removed);
        }

        function getLeaderboardStorageKey(styleId) {
            return LEADERBOARD_STORAGE_KEY_PREFIX + (styleId || 'default');
        }

        function loadLeaderboard(styleId) {
            const key = getLeaderboardStorageKey(styleId !== undefined ? styleId : selectedStyleId);
            try {
                const raw = localStorage.getItem(key);
                const parsed = raw ? JSON.parse(raw) : [];
                if (!Array.isArray(parsed)) return [];

                return parsed.map((entry) => ({
                    name: (entry?.name || '').trim() || 'Gracz',
                    score: Number.isFinite(entry?.score) ? entry.score : Number.MAX_SAFE_INTEGER,
                    elapsedSeconds: Number.isFinite(entry?.elapsedSeconds) ? entry.elapsedSeconds : Number.MAX_SAFE_INTEGER,
                    date: typeof entry?.date === 'string' ? entry.date : '',
                    powerupsUsed: typeof entry?.powerupsUsed === 'boolean' ? entry.powerupsUsed : true,
                    penalties: normalizePenaltyBreakdown(entry?.penalties)
                }));
            } catch {
                return [];
            }
        }

        function saveLeaderboard(entries, styleId) {
            const key = getLeaderboardStorageKey(styleId !== undefined ? styleId : selectedStyleId);
            localStorage.setItem(key, JSON.stringify(entries.slice(0, 100)));
        }

        function getSortedLeaderboard(entries) {
            return [...entries]
                .sort((left, right) => {
                    if (left.score !== right.score) return left.score - right.score;
                    if (left.elapsedSeconds !== right.elapsedSeconds) return left.elapsedSeconds - right.elapsedSeconds;
                    return left.name.localeCompare(right.name, 'pl');
                })
                .slice(0, 100);
        }

        function createCurrentResultEntry(name, snapshot = null) {
            const result = snapshot || {
                score: currentScore,
                elapsedSeconds,
                powerupsUsed,
                penalties: normalizePenaltyBreakdown(penaltyBreakdown)
            };
            return {
                id: `mahjong-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                name: (name || '').trim() || 'Gracz',
                score: result.score,
                elapsedSeconds: result.elapsedSeconds,
                date: getCurrentDateString(),
                powerupsUsed: result.powerupsUsed,
                penalties: normalizePenaltyBreakdown(result.penalties)
            };
        }

        function doesEntryQualifyForLeaderboard(entry, leaderboard = loadLeaderboard()) {
            const rankedEntries = getSortedLeaderboard([...leaderboard, entry]);
            return rankedEntries.some((candidate) => candidate.id === entry.id);
        }

        function saveCurrentResult(name, snapshot = null) {
            const entry = createCurrentResultEntry(name, snapshot);
            const leaderboard = getSortedLeaderboard([...loadLeaderboard(), entry]);
            saveLeaderboard(leaderboard);
            return { leaderboard, entry };
        }

        function renderLeaderboard(entries, highlightedEntryId = null, worstEntryId = null) {
            leaderboardListEl.innerHTML = '';
            leaderboardEmptyEl.classList.toggle('hidden', entries.length > 0);

            entries.forEach((entry, index) => {
                const row = document.createElement('div');
                const isHighlighted = highlightedEntryId && entry.id === highlightedEntryId;
                const isWorst = worstEntryId && entry.id === worstEntryId;
                if (isWorst) {
                    const sep = document.createElement('hr');
                    sep.className = 'results-separator';
                    leaderboardListEl.appendChild(sep);
                }
                row.className = `results-row${entry.powerupsUsed ? '' : ' results-row-clean'}${isHighlighted ? ' results-row-highlight' : ''}${isWorst ? ' results-row-worst' : ''}`;
                row.innerHTML = `
                    <div class="results-rank">${index + 1}</div>
                    <div class="results-player">
                        <strong>${entry.name}</strong>
                        <span class="results-penalties">${formatPenaltyBreakdown(entry.penalties)}</span>
                    </div>
                    <span>${entry.score} pkt</span>
                    <span>${formatElapsedTime(entry.elapsedSeconds)}</span>
                    <span class="results-date">${entry.date || '---- -- --'}</span>
                `;
                leaderboardListEl.appendChild(row);
            });
        }

        function showLeaderboardModal(title, message, entries, highlightedEntryId = null, worstEntryId = null) {
            const style = getSelectedStyle();
            const styleName = style ? style.name : '';
            const defaultTitle = styleName ? `Najlepsze wyniki – ${styleName}` : 'Najlepsze wyniki';
            const defaultMessage = 'Top 100 wyników, mniej punktów = lepiej.';
            stopTimer();
            leaderboardTitleEl.textContent = title !== undefined ? title : defaultTitle;
            leaderboardMessageEl.textContent = message !== undefined ? message : defaultMessage;
            const sorted = getSortedLeaderboard(entries !== undefined ? entries : getSortedLeaderboard(loadLeaderboard()));
            renderLeaderboard(sorted, highlightedEntryId, worstEntryId);
            highlightedLeaderboardEntryId = null;
            leaderboardModalEl.classList.remove('hidden', 'opacity-0');
        }

        function captureUndoState(kind) {
            undoState = {
                kind,
                score: currentScore,
                penaltyScore,
                elapsedSeconds,
                hintsPenaltyApplied,
                tiles: tilesOnBoard.map(tile => ({
                    id: tile.id,
                    styleId: tile.styleId,
                    type: tile.type,
                    value: tile.value,
                    group: tile.group,
                    usageCount: tile.usageCount,
                    matchKey: tile.matchKey,
                    imageSrc: tile.imageSrc,
                    label: tile.label,
                    removed: tile.removed,
                    isSelected: false,
                    isHinted: false,
                    blockedLeftVisual: tile.blockedLeftVisual,
                    hasBottomNeighborVisual: tile.hasBottomNeighborVisual
                }))
            };
            updateUndoButton();
        }

        function restoreUndoState() {
            if (!undoState) return;

            clearHintedTiles();
            deselectCurrent();

            const snapshotById = new Map(undoState.tiles.map(tile => [tile.id, tile]));
            tilesOnBoard.forEach(tile => {
                const snapshot = snapshotById.get(tile.id);
                if (!snapshot) return;

                tile.styleId = snapshot.styleId;
                tile.type = snapshot.type;
                tile.value = snapshot.value;
                tile.group = snapshot.group;
                tile.usageCount = snapshot.usageCount;
                tile.matchKey = snapshot.matchKey;
                tile.imageSrc = snapshot.imageSrc;
                tile.label = snapshot.label;
                tile.removed = snapshot.removed;
                tile.isSelected = false;
                tile.isHinted = false;
                tile.blockedLeftVisual = snapshot.blockedLeftVisual;
                tile.hasBottomNeighborVisual = snapshot.hasBottomNeighborVisual;
                renderTileContent(tile, tile.element);
                attachTileHitboxListener(tile);
            });

            currentScore = undoState.score;
            penaltyScore = undoState.penaltyScore;
            elapsedSeconds = undoState.elapsedSeconds;
            hintsPenaltyApplied = undoState.hintsPenaltyApplied;
            powerupsUsed = true;
            addPenalty(UNDO_PENALTY, 'undo');
            updateScoreDisplay();
            updateTimerDisplay();
            selectedTileRef = null;
            undoState = null;
            updateUndoButton();
            updateBoardState();
        }

        function closeLeaderboardModal() {
            leaderboardModalEl.classList.add('opacity-0');
            setTimeout(() => {
                leaderboardModalEl.classList.add('hidden');
                if (isGameActive() && !isAnyOverlayOpen()) startTimer();
            }, 300);
        }

        function showNameEntryModal() {
            stopTimer();
            const scoreToSave = pendingLeaderboardEntry?.score ?? currentScore;
            const timeToSave = pendingLeaderboardEntry?.elapsedSeconds ?? elapsedSeconds;
            nameEntryMessageEl.textContent = `Twój wynik: ${scoreToSave} pkt, ${formatElapsedTime(timeToSave)}. Podaj imię do rankingu.`;
            nameEntryInputEl.value = '';
            nameEntryModalEl.classList.remove('hidden', 'opacity-0');
            setTimeout(() => nameEntryInputEl.focus(), 0);
        }

        function closeNameEntryModal() {
            nameEntryModalEl.classList.add('opacity-0');
            setTimeout(() => {
                nameEntryModalEl.classList.add('hidden');
                if (isGameActive() && !isAnyOverlayOpen()) startTimer();
            }, 300);
        }

        function submitLeaderboardEntry() {
            const snapshot = pendingLeaderboardEntry
                ? { ...pendingLeaderboardEntry }
                : null;
            const { leaderboard, entry } = saveCurrentResult(nameEntryInputEl.value, snapshot);
            const savedScore = snapshot?.score ?? currentScore;
            const savedTime = snapshot?.elapsedSeconds ?? elapsedSeconds;
            pendingLeaderboardEntry = null;
            closeNameEntryModal();
            highlightedLeaderboardEntryId = entry.id;
            showLeaderboardModal('Zwycięstwo!', `Twój wynik: ${savedScore} pkt, ${formatElapsedTime(savedTime)}. Mniej punktów = lepiej.`, leaderboard, highlightedLeaderboardEntryId);
        }

        function handleVictory() {
            gameCompleted = true;
            stopTimer();
            // Rekordy jak w soltaire: auto-zapis (imię = zalogowany gracz) i wspólny panel.
            const playerName = (window.GryAuth && GryAuth.displayName && GryAuth.displayName()) || 'Gracz';
            const { entry } = saveCurrentResult(playerName); // zapis lokalny -> Supabase (submitMahjong)
            pendingLeaderboardEntry = null;
            highlightedLeaderboardEntryId = entry.id;
            openMahjongRecords();
        }

        // Wspólny panel „Rekordy" (Wszyscy/Ja, kary w meta) — jak w soltaire.
        function openMahjongRecords() {
            if (window.GryScores && GryScores.showRecords) {
                GryScores.showRecords('mahjong');
            } else {
                showLeaderboardModal(undefined, undefined, getSortedLeaderboard(loadLeaderboard()), highlightedLeaderboardEntryId);
            }
        }

        function getStyleCatalog() {
            return (STYLE_MANIFEST.styles || []).slice();
        }

        function getSelectedStyle() {
            return getStyleCatalog().find(style => style.id === selectedStyleId) || null;
        }

        function saveSelectedStyleId() {
            if (!selectedStyleId) return;
            try {
                localStorage.setItem(STYLE_STORAGE_KEY, selectedStyleId);
            } catch {
                // Ignore localStorage write failures.
            }
        }

        function loadSelectedStyleId() {
            try {
                const storedStyleId = localStorage.getItem(STYLE_STORAGE_KEY);
                selectedStyleId = storedStyleId || null;
            } catch {
                selectedStyleId = null;
            }
        }

        function updateStyleTitle() {
            const style = getSelectedStyle();
            const title = style ? `Mahjong ${style.name}` : 'Mahjong';
            document.title = `${title} - obrazki`;
            styleTitleEl.textContent = title;
        }

        function populateStyleSelector() {
            const styles = getStyleCatalog();
            styleSelectEl.innerHTML = '';

            styles.forEach(style => {
                const option = document.createElement('option');
                option.value = style.id;
                option.textContent = style.layoutCompatible ? `${style.name} (${style.tileCount})` : `${style.name} (${style.tileCount}, niezgodny)`;
                option.disabled = !style.layoutCompatible;
                styleSelectEl.appendChild(option);
            });

            const preferred = styles.find(style => style.id === selectedStyleId && style.layoutCompatible)
                || styles.find(style => style.id === 'medieval' && style.layoutCompatible)
                || styles.find(style => style.layoutCompatible)
                || styles[0]
                || null;

            selectedStyleId = preferred ? preferred.id : null;
            if (preferred) styleSelectEl.value = preferred.id;
            saveSelectedStyleId();
            updateStyleTitle();
        }

        function generateBaseDeck() {
            const style = getSelectedStyle();
            if (!style) return [];

            let deck = [];
            let idCounter = 0;
            style.items.forEach(item => {
                for (let i = 0; i < item.usageCount; i++) {
                    deck.push({
                        id: idCounter++,
                        styleId: style.id,
                        type: item.type,
                        value: item.name,
                        group: String(item.usageCount),
                        usageCount: item.usageCount,
                        matchKey: item.matchKey,
                        imageSrc: item.src,
                        label: item.label,
                        x: 0,
                        y: 0,
                        z: 0,
                        isFree: false,
                        isSelected: false,
                        isHinted: false,
                        blockedLeftVisual: false,
                        hasBottomNeighborVisual: false,
                        removed: false,
                        element: null
                    });
                }
            });
            return deck;
        }

        function syncTileClassName(tile, blockedLeft = tile.blockedLeftVisual, hasBottomNeighbor = tile.hasBottomNeighborVisual) {
            if (!tile.element) return;

            const classNames = ['mahjong-tile', tile.isFree ? 'free' : 'blocked'];
            if (tile.trimBottomWallLeft) classNames.push('trim-bottom-wall-left');
            if (blockedLeft) classNames.push('hide-left-wall');
            if (hasBottomNeighbor) classNames.push('hide-bottom-wall');
            if ((tile.isSelected || tile.isHinted) && !tile.removed) classNames.push('selected');
            if (tile.removed) classNames.push('removed');

            tile.element.className = classNames.join(' ');
        }

        function findTopClickableTileAtPoint(preferredTile, clientX, clientY) {
            const stack = document.elementsFromPoint(clientX, clientY);
            let topFreeTile = null;

            for (const element of stack) {
                const tileElement = element.classList?.contains('mahjong-tile')
                    ? element
                    : element.closest?.('.mahjong-tile');
                if (!tileElement) continue;

                const tile = tilesOnBoard.find(candidate => String(candidate.id) === tileElement.dataset.id);
                if (!tile || tile.removed || !tile.isFree) continue;
                if (tile === preferredTile) return topFreeTile || preferredTile;
                if (!topFreeTile) topFreeTile = tile;
            }

            return topFreeTile || preferredTile || null;
        }

        function clearHintedTiles() {
            hintedTiles.forEach(tile => {
                tile.isHinted = false;
                syncTileClassName(tile);
            });
            hintedTiles = [];
        }

        function findAvailableMove() {
            const freeTiles = tilesOnBoard.filter(tile => !tile.removed && tile.isFree);
            for (let i = 0; i < freeTiles.length; i++) {
                for (let j = i + 1; j < freeTiles.length; j++) {
                    if (tilesMatch(freeTiles[i], freeTiles[j])) {
                        return [freeTiles[i], freeTiles[j]];
                    }
                }
            }
            return null;
        }

        function showAvailableMove() {
            clearHintedTiles();
            deselectCurrent();
            const move = findAvailableMove();
            if (!move) return;

            powerupsUsed = true;
            addPenalty(SHOW_MOVE_PENALTY, 'showMove');

            hintedTiles = move;
            hintedTiles.forEach(tile => {
                tile.isHinted = true;
                syncTileClassName(tile);
            });
        }

        function init() {
            loadSelectedStyleId();
            populateStyleSelector();
            loadZoomLevel();
            styleSelectEl.addEventListener('change', (event) => {
                selectedStyleId = event.target.value;
                saveSelectedStyleId();
                updateStyleTitle();
                startGame();
            });
            deckBase = generateBaseDeck();
            adjustBoardScale();
            window.addEventListener('resize', adjustBoardScale);
            startGame();
        }

        function adjustBoardScale() {
            const wrapper = document.getElementById('board-wrapper');
            const board = document.getElementById('board');
            const boardWidth = board.offsetWidth || 828;
            const boardHeight = board.offsetHeight || 568;
            const wrapperRect = wrapper.getBoundingClientRect();
            const wrapperStyle = window.getComputedStyle(wrapper);
            const paddingX = parseFloat(wrapperStyle.paddingLeft) + parseFloat(wrapperStyle.paddingRight);
            const paddingY = parseFloat(wrapperStyle.paddingTop) + parseFloat(wrapperStyle.paddingBottom);
            const paddingTop = parseFloat(wrapperStyle.paddingTop);
            const availableWidth = Math.max(240, wrapper.clientWidth - paddingX);
            const availableHeight = Math.max(240, window.innerHeight - wrapperRect.top - 16 - paddingY);
            const fitScale = Math.min(1, availableWidth / boardWidth);
            const scale = fitScale * zoomLevel;

            const scaledWidth = boardWidth * scale;
            const scaledHeight = boardHeight * scale;
            const overflowBottom = Math.max(0, scaledHeight - availableHeight);
            const upwardHeadroom = Math.max(0, (BOARD_CONTENT_BOUNDS.topInset * scale) + paddingTop - 4);
            const upwardShift = Math.min(overflowBottom, upwardHeadroom);
            const effectiveScaledHeight = scaledHeight - upwardShift;
            const fitsViewportWidth = scaledWidth <= availableWidth + 1;
            const requiredWrapperHeight = Math.max(availableHeight + paddingY, effectiveScaledHeight + paddingY);

            board.style.marginTop = `${-upwardShift}px`;
            board.style.transform = `scale(${scale}) rotateX(-7deg) rotateY(5deg)`;

            wrapper.style.minHeight = `${Math.max(240, requiredWrapperHeight)}px`;
            wrapper.style.maxHeight = 'none';
            wrapper.style.overflowX = fitsViewportWidth ? 'hidden' : 'auto';
            wrapper.style.overflowY = 'visible';
        }

        function startGame() {
            boardEl.innerHTML = '';
            selectedTileRef = null;
            clearHintedTiles();
            closeModal();
            closeLeaderboardModal();
            closeNameEntryModal();
            updateStyleTitle();
            deckBase = generateBaseDeck();
            gameCompleted = false;
            currentScore = 0;
            penaltyScore = 0;
            powerupsUsed = false;
            penaltyBreakdown = createEmptyPenaltyBreakdown();
            hintsPenaltyApplied = false;
            hintsEnabled = false;
            applyHintState();
            pendingLeaderboardEntry = null;
            undoState = null;
            updateScoreDisplay();
            updateUndoButton();
            resetTimer();
            startTimer();

            if (deckBase.length !== LAYOUT_TILE_COUNT) {
                countEl.innerText = deckBase.length;
                stopTimer();
                showModal('Styl niezgodny', `Styl wymaga ${LAYOUT_TILE_COUNT} tiles, ale znaleziono ${deckBase.length}.`, false);
                return;
            }

            let playDeck = [...deckBase].map(t => ({...t}));
            shuffleArray(playDeck);
            tilesOnBoard = [];
            let tileIndex = 0;
            
            LAYOUT_MAP.forEach(layer => {
                layer.tiles.forEach(coords => {
                    if (tileIndex < playDeck.length) {
                        let tile = playDeck[tileIndex];
                        tile.y = coords[0]; tile.x = coords[1]; tile.z = layer.z;
                        tile.trimBottomWallLeft = tile.z === 0 && tile.x === 28 && tile.y === 7;
                        tilesOnBoard.push(tile);
                        tileIndex++;
                    }
                });
            });

            tilesOnBoard.forEach(tile => {
                const el = document.createElement('div');
                el.className = 'mahjong-tile';
                el.dataset.id = tile.id;
                const pxX = tile.x * 22; const pxY = tile.y * 30;
                const offsetZ_X = (tile.z * VISUAL_LAYER_SHIFT_X) + BOARD_VISUAL_PADDING_X;
                const offsetZ_Y = (MAX_LAYER_Z * VISUAL_LAYER_SHIFT_Y) - (tile.z * VISUAL_LAYER_SHIFT_Y);
                const tileZIndex = (tile.z * 100) + tile.x + tile.y;
                el.style.left = `${pxX + offsetZ_X}px`;
                el.style.top = `${pxY + offsetZ_Y}px`;
                el.style.setProperty('--tile-z-index', tileZIndex);
                el.style.zIndex = tileZIndex;
                renderTileContent(tile, el);
                tile.element = el;
                attachTileHitboxListener(tile);
                boardEl.appendChild(el);
            });
            updateBoardState();
        }

        function renderTileContent(tile, element) {
            element.innerHTML = `
                <button class="tile-hitbox" type="button" aria-label="Wybierz klocek ${tile.label}"></button>
                <div class="tile-image-frame">
                    <img class="tile-image" src="${tile.imageSrc}" alt="${tile.label}" loading="eager">
                </div>
            `;
        }

        function attachTileHitboxListener(tile) {
            const hitbox = tile.element?.querySelector('.tile-hitbox');
            if (!hitbox) return;

            hitbox.addEventListener('click', (event) => {
                event.stopPropagation();
                const resolvedTile = findTopClickableTileAtPoint(tile, event.clientX, event.clientY) || tile;
                handleTileClick(resolvedTile);
            });
        }

        function updateBoardState(suppressNoMovesModal = false) {
            let activeCount = 0;
            tilesOnBoard.forEach(tile => {
                if (tile.removed) return;
                activeCount++;
                const isCovered = tilesOnBoard.some(other => !other.removed && other.z === tile.z + 1 && Math.abs(other.x - tile.x) < 2 && Math.abs(other.y - tile.y) < 2);
                let blockedLeft = false, blockedRight = false, hasBottomNeighbor = false;
                for (let other of tilesOnBoard) {
                    if (other.removed || other === tile || other.z !== tile.z) continue;
                    if (Math.abs(other.y - tile.y) < 2) {
                        if (other.x === tile.x - 2) blockedLeft = true;
                        if (other.x === tile.x + 2) blockedRight = true;
                    }
                    if (other.y === tile.y + 2 && Math.abs(other.x - tile.x) < 2) hasBottomNeighbor = true;
                }
                tile.isFree = !isCovered && (!blockedLeft || !blockedRight);
                tile.blockedLeftVisual = blockedLeft;
                tile.hasBottomNeighborVisual = hasBottomNeighbor;
                if (!tile.isFree && tile.isSelected) {
                    tile.isSelected = false;
                    if (selectedTileRef === tile) selectedTileRef = null;
                }
                syncTileClassName(tile, blockedLeft, hasBottomNeighbor);
            });
            countEl.innerText = activeCount;
            if (activeCount === 0) handleVictory();
            else checkAvailableMoves(suppressNoMovesModal);
        }

        function handleTileClick(tile) {
            if (tile.removed || !tile.isFree) return;
            clearHintedTiles();
            if (selectedTileRef === tile) { deselectCurrent(); return; }
            if (selectedTileRef && (!selectedTileRef.isSelected || !selectedTileRef.element || selectedTileRef.removed || !selectedTileRef.isFree)) {
                selectedTileRef.isSelected = false;
                syncTileClassName(selectedTileRef);
                selectedTileRef = null;
            }
            if (selectedTileRef) {
                if (tilesMatch(selectedTileRef, tile)) removePair(selectedTileRef, tile);
                else { deselectCurrent(); selectTile(tile); }
            } else selectTile(tile);
        }

        function selectTile(tile) {
            tile.isSelected = true;
            selectedTileRef = tile;
            syncTileClassName(tile);
        }

        function deselectCurrent() {
            if (selectedTileRef) {
                selectedTileRef.isSelected = false;
                syncTileClassName(selectedTileRef);
            }
            selectedTileRef = null;
        }
        function tilesMatch(t1, t2) { return t1.matchKey === t2.matchKey; }
        function removePair(t1, t2) {
            clearHintedTiles();
            captureUndoState('pair');
            t1.isSelected = false;
            t2.isSelected = false;
            t1.removed = true; t2.removed = true;
            updateScoreDisplay();
            syncTileClassName(t1);
            syncTileClassName(t2);
            selectedTileRef = null;
            updateBoardState();
        }

        function checkAvailableMoves(suppressModal = false) {
            const freeTiles = tilesOnBoard.filter(t => !t.removed && t.isFree);
            let hasMove = false;
            for (let i = 0; i < freeTiles.length; i++) {
                for (let j = i + 1; j < freeTiles.length; j++) {
                    if (tilesMatch(freeTiles[i], freeTiles[j])) { hasMove = true; break; }
                }
            }
            if (!hasMove && freeTiles.length > 0 && !suppressModal) showModal("Brak ruchów", "Nie ma już żadnych pasujących, wolnych par.", true);
        }

        function applyIdentitiesToTiles(targetTiles, identities) {
            targetTiles.forEach((tile, index) => {
                tile.styleId = identities[index].styleId;
                tile.type = identities[index].type;
                tile.value = identities[index].value;
                tile.group = identities[index].group;
                tile.usageCount = identities[index].usageCount;
                tile.matchKey = identities[index].matchKey;
                tile.imageSrc = identities[index].imageSrc;
                tile.label = identities[index].label;
                renderTileContent(tile, tile.element);
                attachTileHitboxListener(tile);
            });
        }

        function shuffleRemaining() {
            clearHintedTiles();
            deselectCurrent();
            captureUndoState('shuffle');
            powerupsUsed = true;
            addPenalty(SHUFFLE_PENALTY, 'shuffle');
            const remaining = tilesOnBoard.filter(t => !t.removed);
            let activeIdentities = remaining.map(t => ({
                styleId: t.styleId,
                type: t.type,
                value: t.value,
                group: t.group,
                usageCount: t.usageCount,
                matchKey: t.matchKey,
                imageSrc: t.imageSrc,
                label: t.label
            }));

            if (remaining.length < 2) {
                updateBoardState();
                return;
            }

            let attemptsLeft = MAX_SHUFFLE_ATTEMPTS;
            do {
                shuffleArray(activeIdentities);
                applyIdentitiesToTiles(remaining, activeIdentities);
                updateBoardState(true);
                attemptsLeft -= 1;
            } while (!findAvailableMove() && attemptsLeft > 0);

            updateBoardState();
        }

        function shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
        }

        function showModal(title, message, showShuffle) {
            stopTimer();
            document.getElementById('modal-title').innerText = title;
            document.getElementById('modal-message').innerText = message;
            document.getElementById('modal-btn-shuffle').classList.toggle('hidden', !showShuffle);
            modal.classList.remove('hidden', 'opacity-0');
        }

        function closeModal() {
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                if (isGameActive() && !isAnyOverlayOpen()) startTimer();
            }, 300);
        }

        hintToggleEl.addEventListener('click', toggleHints);
        showMoveBtnEl.addEventListener('click', showAvailableMove);
        undoBtnEl.addEventListener('click', restoreUndoState);
        showScoresBtnEl.addEventListener('click', () => openMahjongRecords());
        leaderboardCloseBtnEl.addEventListener('click', closeLeaderboardModal);
        leaderboardRestartBtnEl.addEventListener('click', () => {
            closeLeaderboardModal();
            startGame();
        });
        leaderboardResetBtnEl.addEventListener('click', () => {
            if (!confirm('Wyczyścić wszystkie wyniki dla tego stylu?')) return;
            const key = getLeaderboardStorageKey(selectedStyleId);
            localStorage.removeItem(key);
            renderLeaderboard([]);
            leaderboardMessageEl.textContent = 'Wyniki zostały wyczyszczone.';
        });
        nameEntrySaveBtnEl.addEventListener('click', submitLeaderboardEntry);
        nameEntrySkipBtnEl.addEventListener('click', () => {
            nameEntryInputEl.value = 'Gracz';
            submitLeaderboardEntry();
        });
        nameEntryInputEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') submitLeaderboardEntry();
        });
        zoomOutEl.addEventListener('click', () => setZoomLevel(zoomLevel - ZOOM_STEP));
        zoomInEl.addEventListener('click', () => setZoomLevel(zoomLevel + ZOOM_STEP));
        zoomResetEl.addEventListener('click', () => setZoomLevel(getDefaultZoomLevel()));
        updateScoreDisplay();
        updateUndoButton();
        applyHintState();
        window.onload = init;
