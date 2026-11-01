// ==========================================
// 🕹️ TETRIS ARCADE ENGINE - JUAN ABEL (JABEL DEV)
// Conectado con PostgreSQL Leaderboard en Dokploy
// ==========================================

(function() {
    // Canvas & Context
    const canvas = document.getElementById('tetris-canvas');
    if (!canvas) return;
    const context = canvas.getContext('2d');

    const scale = 20; // 20px por bloque
    const width = 10; // 10 columnas
    const height = 20; // 20 filas
    canvas.width = width * scale;   // 200px
    canvas.height = height * scale; // 400px

    // Paleta Cyberpunk
    const colors = [
        null,
        '#00D4FF', // 1: Cyan (I)
        '#FFD93D', // 2: Amarillo (O)
        '#FF007F', // 3: Rosa Neón (T)
        '#00FF87', // 4: Verde Neón (S)
        '#FF0055', // 5: Rojo Carmín (Z)
        '#7F00FF', // 6: Morado (J)
        '#FF8E0D'  // 7: Naranja (L)
    ];

    function determineColor(value) {
        return colors[value] || '#00D4FF';
    }

    // Piezas estándar
    function createPiece(type) {
        switch (type) {
            case 'I':
                return [
                    [0, 1, 0, 0],
                    [0, 1, 0, 0],
                    [0, 1, 0, 0],
                    [0, 1, 0, 0],
                ];
            case 'O':
                return [
                    [2, 2],
                    [2, 2],
                ];
            case 'T':
                return [
                    [0, 3, 0],
                    [3, 3, 3],
                    [0, 0, 0],
                ];
            case 'S':
                return [
                    [0, 4, 4],
                    [4, 4, 0],
                    [0, 0, 0],
                ];
            case 'Z':
                return [
                    [5, 5, 0],
                    [0, 5, 5],
                    [0, 0, 0],
                ];
            case 'J':
                return [
                    [6, 0, 0],
                    [6, 6, 6],
                    [0, 0, 0],
                ];
            case 'L':
                return [
                    [0, 0, 7],
                    [7, 7, 7],
                    [0, 0, 0],
                ];
            default:
                return [
                    [0, 3, 0],
                    [3, 3, 3],
                    [0, 0, 0],
                ];
        }
    }

    const piecesTypes = 'IOTSZJL';
    function randomPiece() {
        const type = piecesTypes[Math.floor(Math.random() * piecesTypes.length)];
        return { matrix: createPiece(type), type: type };
    }

    // Tablero (Arena)
    function createMatrix(w, h) {
        const matrix = [];
        while (h--) {
            matrix.push(new Array(w).fill(0));
        }
        return matrix;
    }

    let arena = createMatrix(width, height);

    // Estado del Jugador
    const player = {
        pos: { x: 0, y: 0 },
        matrix: null,
        type: null,
        score: 0,
        lines: 0,
        level: 1
    };

    let score = 0;
    let level = 1;
    let dropInterval = 650;
    let dropCounter = 0;
    let lastTime = 0;
    let isPaused = false;
    let gameStarted = false;
    let isGameOver = false;

    // Próximas piezas
    const nextPieces = [];

    // Temporizador
    let timerInterval = null;
    let startTime = 0;
    let elapsedTime = 0;

    // Animación de líneas
    let isClearing = false;
    let linesToClear = [];
    let fadeAlpha = 1.0;

    // --- RENDERIZADO ---
    function drawGrid() {
        context.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        context.lineWidth = 1;

        for (let x = 0; x <= width; x++) {
            context.beginPath();
            context.moveTo(x * scale, 0);
            context.lineTo(x * scale, canvas.height);
            context.stroke();
        }

        for (let y = 0; y <= height; y++) {
            context.beginPath();
            context.moveTo(0, y * scale);
            context.lineTo(canvas.width, y * scale);
            context.stroke();
        }
    }

    function drawMatrix(matrix, offset) {
        if (!matrix || !offset) return;

        matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const px = (x + offset.x) * scale;
                    const py = (y + offset.y) * scale;
                    const color = determineColor(value);

                    let currentAlpha = 1.0;
                    if (matrix === arena && linesToClear.includes(y + offset.y)) {
                        currentAlpha = fadeAlpha;
                        context.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
                        context.fillRect(px, py, scale, scale);
                    }

                    context.globalAlpha = currentAlpha;
                    context.fillStyle = color;
                    context.fillRect(px + 1, py + 1, scale - 2, scale - 2);

                    // Brillo cyberpunk (borde superior e izquierdo)
                    context.fillStyle = 'rgba(255, 255, 255, 0.35)';
                    context.fillRect(px + 1, py + 1, scale - 2, 2);
                    context.fillRect(px + 1, py + 1, 2, scale - 2);

                    // Sombra inferior y derecha
                    context.fillStyle = 'rgba(0, 0, 0, 0.45)';
                    context.fillRect(px + 1, py + scale - 3, scale - 2, 2);
                    context.fillRect(px + scale - 3, py + 1, 2, scale - 2);

                    context.globalAlpha = 1.0;
                }
            });
        });
    }

    function drawWelcomeScreen() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();

        context.fillStyle = '#00FF87';
        context.font = '12px "Press Start 2P", monospace';
        context.textAlign = 'center';
        context.fillText('TETRIS', canvas.width / 2, 160);

        context.fillStyle = '#00D4FF';
        context.font = '8px "Press Start 2P", monospace';
        context.fillText('ARCADE', canvas.width / 2, 185);

        context.fillStyle = 'rgba(255, 255, 255, 0.7)';
        context.font = '7px "Press Start 2P", monospace';
        context.fillText('CLIC EN INICIAR', canvas.width / 2, 230);
    }

    function draw() {
        context.clearRect(0, 0, canvas.width, canvas.height);
        drawGrid();
        drawMatrix(arena, { x: 0, y: 0 });
        if (player.matrix) {
            drawMatrix(player.matrix, player.pos);
        }
    }

    function updateNextDisplay() {
        const nextDisplay = document.getElementById('next-display');
        if (!nextDisplay) return;
        nextDisplay.innerHTML = '';

        if (nextPieces.length > 0) {
            const next = nextPieces[0].matrix;
            const blockSize = 16;
            const offsetX = Math.max(0, Math.floor((80 - next[0].length * blockSize) / 2));
            const offsetY = Math.max(0, Math.floor((80 - next.length * blockSize) / 2));

            next.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        const block = document.createElement('div');
                        block.className = 'block';
                        block.style.position = 'absolute';
                        block.style.width = `${blockSize}px`;
                        block.style.height = `${blockSize}px`;
                        block.style.left = `${offsetX + x * blockSize}px`;
                        block.style.top = `${offsetY + y * blockSize}px`;
                        block.style.backgroundColor = determineColor(value);
                        block.style.borderRadius = '3px';
                        block.style.boxShadow = `0 0 6px ${determineColor(value)}`;
                        nextDisplay.appendChild(block);
                    }
                });
            });
        }
    }

    // --- MECÁNICAS DE JUEGO ---
    function collide(targetArena, targetPlayer) {
        const [m, o] = [targetPlayer.matrix, targetPlayer.pos];
        for (let y = 0; y < m.length; ++y) {
            for (let x = 0; x < m[y].length; ++x) {
                if (m[y][x] !== 0 &&
                    (targetArena[y + o.y] && targetArena[y + o.y][x + o.x]) !== 0) {
                    return true;
                }
            }
        }
        return false;
    }

    function merge(targetArena, targetPlayer) {
        targetPlayer.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    targetArena[y + targetPlayer.pos.y][x + targetPlayer.pos.x] = value;
                }
            });
        });
    }

    function rotate(matrix, dir) {
        for (let y = 0; y < matrix.length; ++y) {
            for (let x = 0; x < y; ++x) {
                [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
            }
        }
        if (dir > 0) {
            matrix.forEach(row => row.reverse());
        } else {
            matrix.reverse();
        }
    }

    function playerRotate(dir = 1) {
        if (!gameStarted || isPaused || isGameOver || !player.matrix) return;
        const pos = player.pos.x;
        let offset = 1;
        rotate(player.matrix, dir);
        while (collide(arena, player)) {
            player.pos.x += offset;
            offset = -(offset + (offset > 0 ? 1 : -1));
            if (offset > player.matrix[0].length) {
                rotate(player.matrix, -dir);
                player.pos.x = pos;
                return;
            }
        }
    }

    function playerMove(dir) {
        if (!gameStarted || isPaused || isGameOver || !player.matrix) return;
        player.pos.x += dir;
        if (collide(arena, player)) {
            player.pos.x -= dir;
        }
    }

    function playerDrop() {
        if (!gameStarted || isPaused || isGameOver || !player.matrix) return;
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            if (playerReset()) {
                return;
            }
            clearLines();
        }
        dropCounter = 0;
        draw();
    }

    function playerHardDrop() {
        if (!gameStarted || isPaused || isGameOver || !player.matrix) return;
        while (!collide(arena, player)) {
            player.pos.y++;
        }
        player.pos.y--;
        merge(arena, player);
        if (playerReset()) {
            return;
        }
        clearLines();
        dropCounter = 0;
        draw();
    }

    function clearLines() {
        linesToClear = [];
        for (let y = arena.length - 1; y >= 0; --y) {
            if (arena[y].every(cell => cell !== 0)) {
                linesToClear.push(y);
            }
        }

        if (linesToClear.length > 0) {
            isClearing = true;
            fadeAlpha = 1.0;
            animateClearLines();
        }
    }

    function animateClearLines() {
        fadeAlpha -= 0.15;
        if (fadeAlpha <= 0) {
            let linesCleared = 0;
            for (let y = arena.length - 1; y >= 0; --y) {
                if (arena[y].every(cell => cell !== 0)) {
                    arena.splice(y, 1);
                    arena.unshift(new Array(width).fill(0));
                    linesCleared++;
                    y++;
                }
            }
            updateScore(linesCleared);
            isClearing = false;
            linesToClear = [];
            draw();
        } else {
            draw();
            setTimeout(animateClearLines, 35);
        }
    }

    function updateScore(linesCleared) {
        if (linesCleared === 0) return;
        const linePoints = [0, 100, 300, 500, 800];
        const pts = (linePoints[linesCleared] || (linesCleared * 200)) * level;
        score += pts;
        player.lines += linesCleared;

        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = score;

        // Subir de nivel cada 10 líneas
        const newLevel = Math.floor(player.lines / 10) + 1;
        if (newLevel > level) {
            level = newLevel;
            const levelEl = document.getElementById('level');
            if (levelEl) levelEl.textContent = level;
            dropInterval = Math.max(120, 650 - (level * 45));
        }
    }

    function playerReset() {
        if (nextPieces.length < 2) {
            nextPieces.push(randomPiece(), randomPiece());
        }

        const next = nextPieces.shift();
        player.matrix = next.matrix;
        player.type = next.type;

        player.pos.y = 0;
        player.pos.x = Math.floor((width - player.matrix[0].length) / 2);

        nextPieces.push(randomPiece());
        updateNextDisplay();

        // Game Over si colisiona de inmediato
        if (collide(arena, player)) {
            triggerGameOver();
            return true;
        }
        return false;
    }

    function updateTime() {
        if (!gameStarted || isPaused || isGameOver) return;
        const totalElapsed = Date.now() - startTime + elapsedTime;
        const seconds = Math.floor((totalElapsed / 1000) % 60);
        const minutes = Math.floor((totalElapsed / (1000 * 60)) % 60);
        const timeEl = document.getElementById('time');
        if (timeEl) {
            timeEl.innerText = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        }
    }

    function update(time = 0) {
        if (!gameStarted || isPaused || isGameOver) return;

        const deltaTime = time - lastTime;
        lastTime = time;

        if (!isClearing) {
            dropCounter += deltaTime;
            if (dropCounter > dropInterval) {
                playerDrop();
            }
        }

        draw();
        requestAnimationFrame(update);
    }

    // Exponer controles para mobile-controls.js
    window.playerMove = playerMove;
    window.playerRotate = playerRotate;
    window.playerDrop = playerDrop;
    window.playerHardDrop = playerHardDrop;

    // --- ACCIONES Y BOTONES DE JUEGO ---
    window.iniciar_juego = function() {
        if (gameStarted && !isGameOver) return;

        arena = createMatrix(width, height);
        score = 0;
        level = 1;
        elapsedTime = 0;
        dropInterval = 650;
        isGameOver = false;
        isPaused = false;
        gameStarted = true;

        const scoreEl = document.getElementById('score');
        const levelEl = document.getElementById('level');
        const timeEl = document.getElementById('time');
        if (scoreEl) scoreEl.textContent = '0';
        if (levelEl) levelEl.textContent = '1';
        if (timeEl) timeEl.textContent = '00:00';

        $('#start-button').hide();
        $('#pause-button').show().text('PAUSA').prop('disabled', false);
        $('#restart-button').show().prop('disabled', false);
        $('#guardar-score-button').show().prop('disabled', false);

        startTime = Date.now();
        clearInterval(timerInterval);
        timerInterval = setInterval(updateTime, 1000);

        nextPieces.length = 0;
        nextPieces.push(randomPiece(), randomPiece());
        playerReset();

        lastTime = performance.now();
        requestAnimationFrame(update);
    };

    window.togglePause = function() {
        if (!gameStarted || isGameOver) return;
        isPaused = !isPaused;
        const pauseBtn = document.getElementById('pause-button');

        if (isPaused) {
            if (pauseBtn) pauseBtn.innerHTML = '<span class="btn-icon">▶</span> REANUDAR';
            clearInterval(timerInterval);
            elapsedTime += Date.now() - startTime;
        } else {
            if (pauseBtn) pauseBtn.innerHTML = '<span class="btn-icon">⏸</span> PAUSA';
            startTime = Date.now();
            timerInterval = setInterval(updateTime, 1000);
            lastTime = performance.now();
            requestAnimationFrame(update);
        }
    };

    window.restartGame = function() {
        clearInterval(timerInterval);
        gameStarted = false;
        isPaused = false;
        isGameOver = false;
        window.iniciar_juego();
    };

    function triggerGameOver() {
        isGameOver = true;
        gameStarted = false;
        clearInterval(timerInterval);

        $('#pause-button').hide();
        $('#start-button').show();

        mostrarGameOverArcade(score);
    }

    function mostrarGameOverArcade(finalScore) {
        const scoreDisplay = document.getElementById('arcade-score');
        const modal = document.getElementById('arcade-game-over');
        if (scoreDisplay) scoreDisplay.innerText = finalScore;
        if (modal) modal.classList.remove('hidden');
    }

    window.forzarGameOverArcade = function() {
        triggerGameOver();
    };

    // Guardado de récord en PostgreSQL
    const saveBtn = document.getElementById('btn-save-arcade');
    if (saveBtn) {
        saveBtn.addEventListener('click', async function() {
            const input = document.getElementById('arcade-nombre');
            const nombre = input ? input.value.trim() : '';
            if (!nombre) {
                alert('😅 Por favor ingresa tu nombre para el salón de la fama.');
                return;
            }

            saveBtn.disabled = true;
            saveBtn.innerText = 'GUARDANDO...';

            try {
                if (typeof window.saveScoreToFirebase === 'function') {
                    await window.saveScoreToFirebase(nombre, score, 'tetris');
                }
                const modal = document.getElementById('arcade-game-over');
                if (modal) modal.classList.add('hidden');
                alert(`🔥 ¡Excelente partida ${nombre}! Tu récord de ${score} pts fue guardado.`);

                if (typeof window.mostrarPuntajes === 'function') {
                    window.mostrarPuntajes('tetris');
                }
                if (input) input.value = '';
            } catch (err) {
                console.error('Error al guardar puntaje:', err);
                alert('⚠️ No se pudo guardar el récord en el servidor. Intenta de nuevo.');
            } finally {
                saveBtn.disabled = false;
                saveBtn.innerText = '💾 GUARDAR PUNTAJE';
            }
        });
    }

    // --- CONTROLES DE TECLADO (F12 COMPLETAMENTE PERMITIDO) ---
    document.addEventListener('keydown', event => {
        // NO BLOQUEAR F12 NI DEVTOOLS
        if (event.key === 'F12' || (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'i' || event.key === 'J' || event.key === 'j'))) {
            return; // Permite abrir herramientas de desarrollador libremente
        }

        if (!gameStarted && (event.key === 'Enter' || event.key === ' ')) {
            window.iniciar_juego();
            return;
        }

        switch (event.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                playerMove(-1);
                draw();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                playerMove(1);
                draw();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                playerDrop();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                playerRotate(1);
                draw();
                break;
            case ' ':
                playerHardDrop();
                break;
            case 'p':
            case 'P':
                window.togglePause();
                break;
        }
    });

    // --- CONTROLES MÓVILES EN PANTALLA ---
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnRotate = document.getElementById('btn-rotate');
    const btnDown = document.getElementById('btn-down');

    if (btnLeft) btnLeft.addEventListener('click', () => { playerMove(-1); draw(); });
    if (btnRight) btnRight.addEventListener('click', () => { playerMove(1); draw(); });
    if (btnRotate) btnRotate.addEventListener('click', () => { playerRotate(1); draw(); });
    if (btnDown) btnDown.addEventListener('click', () => { playerDrop(); });

    // Clic en el canvas inicia el juego si está detenido
    canvas.addEventListener('click', () => {
        if (!gameStarted) {
            window.iniciar_juego();
        }
    });

    // Dibujar pantalla inicial al cargar
    drawWelcomeScreen();
})();
