// ==========================================
// 🎮 INPUT CONTROLLER - Patrón: Controller / Command
// ==========================================
(function() {
    class InputController {
        constructor(engine) {
            this.engine = engine;
            this.bindKeyboard();
            this.bindTouchControls();
        }

        bindKeyboard() {
            document.addEventListener('keydown', (e) => {
                // Permitir F12 e inspeccionar consola libremente
                if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j'].includes(e.key))) {
                    return;
                }

                if (!this.engine.state.gameStarted && (e.key === 'Enter' || e.key === ' ')) {
                    this.engine.start();
                    return;
                }

                switch (e.key) {
                    case 'ArrowLeft': case 'a': case 'A':
                        this.engine.move(-1);
                        break;
                    case 'ArrowRight': case 'd': case 'D':
                        this.engine.move(1);
                        break;
                    case 'ArrowDown': case 's': case 'S':
                        this.engine.drop();
                        break;
                    case 'ArrowUp': case 'w': case 'W':
                        this.engine.rotate(1);
                        break;
                    case ' ':
                        this.engine.hardDrop();
                        break;
                    case 'p': case 'P':
                        this.engine.togglePause();
                        break;
                }
            });
        }

        bindTouchControls() {
            const bind = (id, action) => {
                const el = document.getElementById(id);
                if (!el) return;
                const execute = (e) => {
                    e.preventDefault();
                    action();
                };
                el.addEventListener('touchstart', execute, { passive: false });
                el.addEventListener('click', execute);
            };

            bind('btn-left', () => this.engine.move(-1));
            bind('btn-right', () => this.engine.move(1));
            bind('btn-rotate', () => this.engine.rotate(1));
            bind('btn-down', () => this.engine.drop());
        }
    }

    window.InputController = InputController;
})();
