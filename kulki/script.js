    const BOARD_SIZE = 9;
    let board = Array(BOARD_SIZE * BOARD_SIZE).fill(null);
    let selectedCell = null;
    let score = 0;
    let isAnimating = false;
    let difficulty = 'medium';
    let soundEnabled = false;
    let audioCtx = null;
    
    // Definicje poziomów trudności
    const configs = {
      easy: {
        colors: ['red', 'green', 'blue', 'yellow', 'magenta'],
        minLine: 5,
        spawnCount: 3,
        storageKey: 'lines_high_easy',
        hideNext: false,
        bonusPerMove: 0
      },
      medium: {
        colors: ['red', 'green', 'blue', 'yellow', 'magenta', 'orange'],
        minLine: 5,
        spawnCount: 3,
        storageKey: 'lines_high_medium',
        hideNext: false,
        bonusPerMove: 0
      },
      hard: {
        colors: ['red', 'green', 'blue', 'yellow', 'magenta', 'orange', 'brown'],
        minLine: 5,
        spawnCount: 3,
        storageKey: 'lines_high_hard',
        hideNext: false,
        bonusPerMove: 0
      },
      extreme: {
        colors: ['red', 'green', 'blue', 'yellow', 'magenta', 'orange', 'brown'],
        minLine: 5,
        spawnCount: 3,
        storageKey: 'lines_high_extreme',
        hideNext: true,
        bonusPerMove: 2
      }
    };

    let nextColors = [];

    // --- SYNTEZATOR DŹWIĘKÓW RETRO (Web Audio API) ---
    function playSound(type) {
      if (!soundEnabled) return;
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
          audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'select') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
        } else if (type === 'move') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(330, now);
          osc.frequency.setValueAtTime(220, now + 0.05);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
        } else if (type === 'error') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.setValueAtTime(120, now + 0.15);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
        } else if (type === 'clear') {
          const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
          freqs.forEach((f, i) => {
            const oscSeq = audioCtx.createOscillator();
            const gainSeq = audioCtx.createGain();
            oscSeq.connect(gainSeq);
            gainSeq.connect(audioCtx.destination);
            oscSeq.type = 'sine';
            oscSeq.frequency.setValueAtTime(f, now + i * 0.08);
            gainSeq.gain.setValueAtTime(0.08, now + i * 0.08);
            gainSeq.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.15);
            oscSeq.start(now + i * 0.08);
            oscSeq.stop(now + i * 0.08 + 0.15);
          });
        } else if (type === 'gameover') {
          const freqs = [392.00, 311.13, 261.63]; // G4, Eb4, C4 (smutny molowy akord)
          freqs.forEach((f, i) => {
            const oscSeq = audioCtx.createOscillator();
            const gainSeq = audioCtx.createGain();
            oscSeq.connect(gainSeq);
            gainSeq.connect(audioCtx.destination);
            oscSeq.type = 'triangle';
            oscSeq.frequency.setValueAtTime(f, now + i * 0.15);
            gainSeq.gain.setValueAtTime(0.08, now + i * 0.15);
            gainSeq.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
            oscSeq.start(now + i * 0.15);
            oscSeq.stop(now + i * 0.15 + 0.3);
          });
        }
      } catch (e) {
        console.warn("Audio Context failed to start:", e);
      }
    }

    // --- INICJALIZACJA SYSTEMOWA ---
    window.onload = function() {
      setupClock();
      loadHighScore();
      updateSoundUI();
      resetGame();

      // Zamykanie menu po kliknięciu poza obszar gry
      document.addEventListener('click', function(e) {
        if (!e.target.closest('.menu-item')) {
          closeAllMenus();
        }
      });
    };

    function setupClock() {
      const clockEl = document.getElementById('win-clock');
      function update() {
        const now = new Date();
        clockEl.innerText = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
      }
      update();
      setInterval(update, 1000);
    }

    function toggleMenu(id) {
      const el = document.getElementById(id);
      const isVisible = el.style.display === 'block';
      closeAllMenus();
      if (!isVisible) {
        el.style.display = 'block';
      }
    }

    function closeAllMenus() {
      document.querySelectorAll('.menu-dropdown').forEach(m => m.style.display = 'none');
    }

    function updateSoundUI() {
      const soundStatus = document.getElementById('sound-status');
      const hudSoundBtn = document.getElementById('hud-sound-btn');
      const icon = soundEnabled ? '🔊' : '🔇';
      const label = soundEnabled ? 'Dźwięk włączony' : 'Dźwięk wyłączony';

      if (soundStatus) soundStatus.innerText = soundEnabled ? 'Włączony' : 'Wyłączony';
      if (hudSoundBtn) {
        hudSoundBtn.innerText = icon;
        hudSoundBtn.title = label;
        hudSoundBtn.setAttribute('aria-label', label);
      }
    }

    function toggleSound() {
      soundEnabled = !soundEnabled;
      updateSoundUI();
      playSound('select');
    }

    function toggleAbout(show) {
      document.getElementById('about-overlay').style.display = show ? 'block' : 'none';
      document.getElementById('about-modal').style.display = show ? 'block' : 'none';
      if (show) playSound('select');
    }

    function closeGameOver() {
      document.getElementById('game-over-overlay').style.display = 'none';
      document.getElementById('game-over-modal').style.display = 'none';
    }

    function changeDifficulty(diff) {
      difficulty = diff;
      document.getElementById('difficulty-select').value = diff;
      loadHighScore();
      resetGame();
      closeAllMenus();
    }

    function handleDifficultySelect(val) {
      difficulty = val;
      loadHighScore();
      resetGame();
    }

    function loadHighScore() {
      const cfg = configs[difficulty];
      const saved = localStorage.getItem(cfg.storageKey);
      const high = saved ? parseInt(saved) : 0;
      document.getElementById('highscore-display').innerText = formatScore(high);
    }

    function saveHighScore() {
      const cfg = configs[difficulty];
      const saved = localStorage.getItem(cfg.storageKey);
      const currentHigh = saved ? parseInt(saved) : 0;
      if (score > currentHigh) {
        localStorage.setItem(cfg.storageKey, score);
        document.getElementById('highscore-display').innerText = formatScore(score);
      }
    }

    function formatScore(num) {
      return String(num).padStart(4, '0');
    }

    // --- LOGIKA I MECHANIKA GRY ---

    function resetGame() {
      board = Array(BOARD_SIZE * BOARD_SIZE).fill(null);
      selectedCell = null;
      score = 0;
      isAnimating = false;
      document.getElementById('score-display').innerText = formatScore(score);
      document.getElementById('status-bar').innerText = 'Zaczynamy nową grę!';
      
      loadHighScore();

      // Generowanie pierwszych 5 losowych kulek
      const initialIndices = getRandomEmptyIndices(5);
      const cfg = configs[difficulty];
      initialIndices.forEach(idx => {
        board[idx] = getRandomColor(cfg.colors);
      });

      // Przygotowanie paska Next
      generateNextColors();
      renderBoard();
      renderNextPreview();
    }

    function getRandomColor(colorsList) {
      return colorsList[Math.floor(Math.random() * colorsList.length)];
    }

    function generateNextColors() {
      const cfg = configs[difficulty];
      nextColors = [];
      for (let i = 0; i < cfg.spawnCount; i++) {
        nextColors.push(getRandomColor(cfg.colors));
      }
    }

    function getRandomEmptyIndices(count) {
      const empties = [];
      board.forEach((val, idx) => {
        if (val === null) empties.push(idx);
      });

      const result = [];
      for (let i = 0; i < count; i++) {
        if (empties.length === 0) break;
        const randIdx = Math.floor(Math.random() * empties.length);
        result.push(empties.splice(randIdx, 1)[0]);
      }
      return result;
    }

    function renderNextPreview() {
      const cfg = configs[difficulty];
      
      const next3 = document.getElementById('next-3');
      if (next3) next3.classList.add('hidden');

      for (let i = 0; i < 3; i++) {
        const previewEl = document.getElementById(`next-${i}`);
        if (!previewEl) continue;
        
        previewEl.className = 'next-preview-ball';
        previewEl.innerText = "";
        previewEl.style.display = "inline-flex";
        previewEl.style.alignItems = "center";
        previewEl.style.justifyContent = "center";
        previewEl.style.fontWeight = "bold";
        previewEl.style.color = "#404040";
        previewEl.style.fontSize = "12px";
        previewEl.style.backgroundColor = "";
        previewEl.style.border = "none";
        previewEl.style.boxShadow = "none";

        if (cfg.hideNext) {
          previewEl.classList.add('inset-border');
          previewEl.style.backgroundColor = '#b0b0b0';
          previewEl.innerText = "?";
        } else {
          if (i < nextColors.length) {
            previewEl.classList.add('ball', nextColors[i]);
          }
        }
      }
    }

    // Dodano obsługę parametru dynamicznej animacji pojawiania (spawn-fade)
    function renderBoard(newlySpawnedIndices = []) {
      const boardEl = document.getElementById('game-board');
      boardEl.innerHTML = '';

      for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.id = `cell-${i}`;
        cell.className = 'grid-cell inset-border';
        cell.setAttribute('onclick', `handleCellClick(${i})`);

        const color = board[i];
        if (color) {
          const ball = document.createElement('div');
          ball.className = `ball ${color}`;
          if (selectedCell === i) {
            ball.classList.add('bouncing');
          }
          if (newlySpawnedIndices.includes(i)) {
            ball.classList.add('spawn-fade');
          }
          cell.appendChild(ball);
        }

        boardEl.appendChild(cell);
      }
    }

    function handleCellClick(index) {
      if (isAnimating) return;

      const clickedColor = board[index];

      if (clickedColor) {
        selectedCell = index;
        playSound('select');
        renderBoard();
        document.getElementById('status-bar').innerText = `Zaznaczono kulkę w rzędzie ${Math.floor(index/9)+1}, kolumnie ${(index%9)+1}.`;
      } else {
        if (selectedCell !== null) {
          const path = findPath(selectedCell, index);
          if (path) {
            moveBall(selectedCell, index, path);
          } else {
            playSound('error');
            const cellEl = document.getElementById(`cell-${index}`);
            cellEl.classList.add('shake-anim');
            document.getElementById('status-bar').innerText = 'Brak przejścia! Droga jest zablokowana.';
            setTimeout(() => {
              cellEl.classList.remove('shake-anim');
            }, 300);
          }
        }
      }
    }

    // Pathfinding (BFS)
    function findPath(start, end) {
      if (start === end) return [start];
      
      const queue = [[start]];
      const visited = new Set();
      visited.add(start);

      while (queue.length > 0) {
        const path = queue.shift();
        const node = path[path.length - 1];

        if (node === end) {
          return path;
        }

        const row = Math.floor(node / BOARD_SIZE);
        const col = node % BOARD_SIZE;

        const neighbors = [];
        if (row > 0) neighbors.push(node - BOARD_SIZE);
        if (row < BOARD_SIZE - 1) neighbors.push(node + BOARD_SIZE);
        if (col > 0) neighbors.push(node - 1);
        if (col < BOARD_SIZE - 1) neighbors.push(node + 1);

        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && board[neighbor] === null) {
            visited.add(neighbor);
            queue.push([...path, neighbor]);
          }
        }
      }
      return null;
    }

    // Płynna animacja poruszania po ścieżce
    function moveBall(start, end, path) {
      isAnimating = true;
      const color = board[start];
      
      board[start] = null;
      selectedCell = null;
      renderBoard();

      const boardEl = document.getElementById('game-board');
      const animatingBall = document.getElementById('animating-ball');
      
      animatingBall.className = `ball ${color}`;
      animatingBall.style.display = 'block';
      animatingBall.style.transition = 'none';

      const boardRect = boardEl.getBoundingClientRect();
      const startCell = document.getElementById(`cell-${start}`);
      const startRect = startCell.getBoundingClientRect();
      const ballWidth = startRect.width * 0.8;
      const ballHeight = startRect.height * 0.8;
      
      animatingBall.style.width = `${ballWidth}px`;
      animatingBall.style.height = `${ballHeight}px`;

      const startX = startRect.left - boardRect.left + (startRect.width - ballWidth) / 2;
      const startY = startRect.top - boardRect.top + (startRect.height - ballHeight) / 2;
      animatingBall.style.left = `${startX}px`;
      animatingBall.style.top = `${startY}px`;

      // Reflow
      animatingBall.offsetHeight;

      const stepDuration = 70;
      animatingBall.style.transition = `left ${stepDuration}ms linear, top ${stepDuration}ms linear`;

      let pathStep = 1;

      function nextStep() {
        if (pathStep >= path.length) {
          setTimeout(() => {
            animatingBall.style.display = 'none';
            animatingBall.style.transition = 'none';
            board[end] = color;
            
            playSound('move');
            checkTurnOutcome(end);
          }, stepDuration);
          return;
        }

        const currentCellIndex = path[pathStep];
        const cellEl = document.getElementById(`cell-${currentCellIndex}`);
        if (!cellEl) return;
        const cellRect = cellEl.getBoundingClientRect();

        const x = cellRect.left - boardRect.left + (cellRect.width - ballWidth) / 2;
        const y = cellRect.top - boardRect.top + (cellRect.height - ballHeight) / 2;

        animatingBall.style.left = `${x}px`;
        animatingBall.style.top = `${y}px`;

        pathStep++;
        setTimeout(nextStep, stepDuration);
      }

      setTimeout(nextStep, 10);
    }

    function checkTurnOutcome(placedIndex) {
      const cfg = configs[difficulty];

      if (cfg.bonusPerMove > 0) {
        score += cfg.bonusPerMove;
        document.getElementById('score-display').innerText = formatScore(score);
        saveHighScore();
      }

      const linesToClear = scanAllLines(cfg.minLine);

      if (linesToClear.length > 0) {
        clearLinesWithAnimation(linesToClear);
      } else {
        spawnNextBalls();
      }
    }

    function scanAllLines(minRequired) {
      const matched = new Set();

      // Poziomo
      for (let r = 0; r < BOARD_SIZE; r++) {
        let c = 0;
        while (c < BOARD_SIZE) {
          const color = board[r * BOARD_SIZE + c];
          if (color) {
            let len = 1;
            while (c + len < BOARD_SIZE && board[r * BOARD_SIZE + (c + len)] === color) {
              len++;
            }
            if (len >= minRequired) {
              for (let i = 0; i < len; i++) matched.add(r * BOARD_SIZE + c + i);
            }
            c += len;
          } else {
            c++;
          }
        }
      }

      // Pionowo
      for (let c = 0; c < BOARD_SIZE; c++) {
        let r = 0;
        while (r < BOARD_SIZE) {
          const color = board[r * BOARD_SIZE + c];
          if (color) {
            let len = 1;
            while (r + len < BOARD_SIZE && board[(r + len) * BOARD_SIZE + c] === color) {
              len++;
            }
            if (len >= minRequired) {
              for (let i = 0; i < len; i++) matched.add((r + i) * BOARD_SIZE + c);
            }
            r += len;
          } else {
            r++;
          }
        }
      }

      // Skosy
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const color = board[r * BOARD_SIZE + c];
          if (color) {
            // Skos prawy dół (\)
            let len = 1;
            while (r + len < BOARD_SIZE && c + len < BOARD_SIZE && board[(r + len) * BOARD_SIZE + (c + len)] === color) {
              len++;
            }
            if (len >= minRequired) {
              for (let i = 0; i < len; i++) matched.add((r + i) * BOARD_SIZE + (c + i));
            }

            // Skos lewy dół (/)
            len = 1;
            while (r + len < BOARD_SIZE && c - len >= 0 && board[(r + len) * BOARD_SIZE + (c - len)] === color) {
              len++;
            }
            if (len >= minRequired) {
              for (let i = 0; i < len; i++) matched.add((r + i) * BOARD_SIZE + (c - i));
            }
          }
        }
      }

      return Array.from(matched);
    }

    function clearLinesWithAnimation(indices) {
      playSound('clear');
      
      indices.forEach(idx => {
        const cellEl = document.getElementById(`cell-${idx}`);
        if (cellEl && cellEl.firstChild) {
          cellEl.firstChild.classList.add('exploding');
        }
      });

      const cfg = configs[difficulty];
      const basePoints = 10;
      const extraPoints = 3 * (indices.length - cfg.minLine);
      const pointsScored = basePoints + Math.max(0, extraPoints);

      score += pointsScored;
      document.getElementById('score-display').innerText = formatScore(score);
      document.getElementById('status-bar').innerText = `Ułożono linię z ${indices.length} kulek! Zdobywasz ${pointsScored} pkt.`;

      saveHighScore();

      setTimeout(() => {
        indices.forEach(idx => {
          board[idx] = null;
        });
        isAnimating = false;
        renderBoard();
        checkGameOver();
      }, 300);
    }

    function spawnNextBalls() {
      const cfg = configs[difficulty];
      const spawnIndices = getRandomEmptyIndices(cfg.spawnCount);

      if (spawnIndices.length === 0) {
        triggerGameOver();
        return;
      }

      spawnIndices.forEach((idx, i) => {
        if (i < nextColors.length) {
          board[idx] = nextColors[i];
        }
      });

      const linesAfterSpawn = scanAllLines(cfg.minLine);

      // Renderowanie nowo pojawiających się kulek z płynnym efektem fade-in
      renderBoard(spawnIndices);

      if (linesAfterSpawn.length > 0) {
        // Opóźnienie usuwania, by dać użytkownikowi czas na zobaczenie pojawienia
        setTimeout(() => {
          clearLinesWithAnimation(linesAfterSpawn);
        }, 450);
      } else {
        isAnimating = false;
        checkGameOver();
      }

      generateNextColors();
      renderNextPreview();
    }

    function checkGameOver() {
      const hasEmpty = board.some(cell => cell === null);
      if (!hasEmpty) {
        const cfg = configs[difficulty];
        const lines = scanAllLines(cfg.minLine);
        if (lines.length > 0) {
          clearLinesWithAnimation(lines);
        } else {
          triggerGameOver();
        }
      }
    }

    function triggerGameOver() {
      playSound('gameover');
      document.getElementById('status-bar').innerText = 'Koniec Gry! Brak wolnych ruchów.';
      document.getElementById('modal-final-score').innerText = formatScore(score);
      document.getElementById('game-over-overlay').style.display = 'block';
      document.getElementById('game-over-modal').style.display = 'block';
    }
