// ==========================================
// ⚙️ TETRIS ENGINE - Patrón: Command / Core Engine
// ==========================================
(function() {
    class GameEngine {
        constructor(board, state, renderer, config) {
            this.board = board;
            this.state = state;
            this.renderer = renderer;
            this.config = config;
            this.player = { pos: { x: 0, y: 0 }, matrix: null, type: null };
            this.onPieceLock = null;
        }

        setPiece(piece) {
            this.player.matrix = piece.matrix;
            this.player.type = piece.type;
            this.player.pos = {
                y: 0,
                x: Math.floor((this.config.COLS - piece.matrix[0].length) / 2)
            };
            return !this.board.hasCollision(this.player.matrix, this.player.pos);
        }

        move(dir) {
            if (!this.state.gameStarted || this.state.isPaused || this.state.isGameOver) return;
            this.player.pos.x += dir;
            if (this.board.hasCollision(this.player.matrix, this.player.pos)) {
                this.player.pos.x -= dir;
            }
            this.render();
        }

        rotate(dir = 1) {
            if (!this.state.gameStarted || this.state.isPaused || this.state.isGameOver) return;
            const prev = this.player.matrix;
            this.player.matrix = window.PieceFactory.rotateMatrix(this.player.matrix, dir);
            let offset = 1;
            while (this.board.hasCollision(this.player.matrix, this.player.pos)) {
                this.player.pos.x += offset;
                offset = -(offset + (offset > 0 ? 1 : -1));
                if (offset > this.player.matrix[0].length) {
                    this.player.matrix = prev;
                    return;
                }
            }
            this.render();
        }

        drop() {
            if (!this.state.gameStarted || this.state.isPaused || this.state.isGameOver) return;
            this.player.pos.y++;
            if (this.board.hasCollision(this.player.matrix, this.player.pos)) {
                this.player.pos.y--;
                this.lockPiece();
                return;
            }
            this.render();
        }

        hardDrop() {
            if (!this.state.gameStarted || this.state.isPaused || this.state.isGameOver) return;
            while (!this.board.hasCollision(this.player.matrix, this.player.pos)) {
                this.player.pos.y++;
            }
            this.player.pos.y--;
            this.lockPiece();
        }

        lockPiece() {
            this.board.merge(this.player.matrix, this.player.pos);
            const lines = this.board.getCompletedLines();
            if (lines.length > 0) {
                this.board.removeLines(lines);
                this.state.addScore(lines.length);
            }
            if (this.onPieceLock) this.onPieceLock();
        }

        render() {
            this.renderer.render(this.board.grid, this.player.matrix, this.player.pos);
        }
    }

    window.GameEngine = GameEngine;
})();
