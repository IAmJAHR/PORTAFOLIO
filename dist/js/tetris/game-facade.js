// ==========================================
// 🕹️ GAME FACADE - Patrón: Facade / Coordinator (<100 líneas)
// ==========================================
(function() {
    class GameFacade {
        constructor() {
            this.config = window.TetrisConfig;
            this.board = new window.BoardModel(this.config.COLS, this.config.ROWS);
            this.state = new window.GameState(this.config);
            this.canvas = document.getElementById('tetris-canvas');
            this.renderer = new window.TetrisRenderer(this.canvas, this.config);
            this.engine = new window.GameEngine(this.board, this.state, this.renderer, this.config);
            this.nextPieces = []; this.dropCounter = 0; this.lastTime = 0; this.timerInterval = null;
            this.engine.onPieceLock = () => this.spawnNext();
            this.state.subscribe(() => {
                const s = document.getElementById('score'), l = document.getElementById('level');
                if (s) s.textContent = this.state.score; if (l) l.textContent = this.state.level;
            });
            this.input = new window.InputController(this.engine);
            this.canvas.addEventListener('click', () => { if (!this.state.gameStarted) this.start(); });
            this.renderer.drawWelcome();
        }

        start() {
            if (this.state.gameStarted && !this.state.isGameOver) return;
            this.board.reset(); this.state.reset();
            this.state.gameStarted = true; this.state.startTime = Date.now();
            this.nextPieces = [window.PieceFactory.getRandomPiece(), window.PieceFactory.getRandomPiece()];
            this.spawnNext();
            clearInterval(this.timerInterval);
            this.timerInterval = setInterval(() => {
                const el = document.getElementById('time');
                if (el) el.innerText = this.state.getFormattedTime();
            }, 1000);
            $('#start-button').hide(); $('#pause-button').show().text('PAUSA');
            $('#restart-button, #guardar-score-button').show();
            this.lastTime = performance.now();
            requestAnimationFrame((t) => this.loop(t));
        }

        spawnNext() {
            const next = this.nextPieces.shift();
            this.nextPieces.push(window.PieceFactory.getRandomPiece());
            this.renderPreview();
            if (!this.engine.setPiece(next)) { this.gameOver(); return; }
            this.engine.render();
        }

        renderPreview() {
            const p = document.getElementById('next-display');
            if (!p || !this.nextPieces[0]) return;
            p.innerHTML = '';
            const m = this.nextPieces[0].matrix; const sz = this.config.PREVIEW_BLOCK_SIZE;
            const ox = Math.max(0, Math.floor((80 - m[0].length * sz) / 2));
            const oy = Math.max(0, Math.floor((80 - m.length * sz) / 2));
            m.forEach((row, y) => row.forEach((val, x) => {
                if (val !== 0) {
                    const b = document.createElement('div');
                    b.className = 'block';
                    b.style.cssText = `position:absolute;width:${sz}px;height:${sz}px;left:${ox + x * sz}px;top:${oy + y * sz}px;background:${this.config.COLORS[val]};border-radius:3px;box-shadow:0 0 6px ${this.config.COLORS[val]};`;
                    p.appendChild(b);
                }
            }));
        }

        togglePause() {
            if (!this.state.gameStarted || this.state.isGameOver) return;
            this.state.isPaused = !this.state.isPaused;
            const btn = document.getElementById('pause-button');
            if (this.state.isPaused) {
                if (btn) btn.innerHTML = '<span class="btn-icon">▶</span> REANUDAR';
                this.state.elapsedTime += Date.now() - this.state.startTime;
            } else {
                if (btn) btn.innerHTML = '<span class="btn-icon">⏸</span> PAUSA';
                this.state.startTime = Date.now(); this.lastTime = performance.now();
                requestAnimationFrame((t) => this.loop(t));
            }
        }

        gameOver() {
            this.state.isGameOver = true; this.state.gameStarted = false;
            clearInterval(this.timerInterval);
            $('#pause-button').hide(); $('#start-button').show();
            document.getElementById('arcade-score').innerText = this.state.score;
            document.getElementById('arcade-game-over').classList.remove('hidden');
        }
        loop(time = 0) {
            if (!this.state.gameStarted || this.state.isPaused || this.state.isGameOver) return;
            const delta = time - this.lastTime; this.lastTime = time;
            this.dropCounter += delta;
            if (this.dropCounter > this.state.dropInterval) { this.engine.drop(); this.dropCounter = 0; }
            this.engine.render();
            requestAnimationFrame((t) => this.loop(t));
        }
    }
    window.GameFacade = GameFacade;
})();
