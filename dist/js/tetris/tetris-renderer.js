// ==========================================
// 🎨 TETRIS RENDERER - Patrón: View / Renderer
// ==========================================
(function() {
    class TetrisRenderer {
        constructor(canvas, config) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.config = config;
            this.canvas.width = config.COLS * config.BLOCK_SIZE;
            this.canvas.height = config.ROWS * config.BLOCK_SIZE;
        }

        drawGrid() {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
            this.ctx.lineWidth = 1;
            for (let x = 0; x <= this.config.COLS; x++) {
                this.ctx.beginPath();
                this.ctx.moveTo(x * this.config.BLOCK_SIZE, 0);
                this.ctx.lineTo(x * this.config.BLOCK_SIZE, this.canvas.height);
                this.ctx.stroke();
            }
            for (let y = 0; y <= this.config.ROWS; y++) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, y * this.config.BLOCK_SIZE);
                this.ctx.lineTo(this.canvas.width, y * this.config.BLOCK_SIZE);
                this.ctx.stroke();
            }
        }

        drawMatrix(matrix, offset, alpha = 1.0) {
            if (!matrix) return;
            const sz = this.config.BLOCK_SIZE;
            this.ctx.globalAlpha = alpha;

            matrix.forEach((row, y) => {
                row.forEach((val, x) => {
                    if (val !== 0) {
                        const px = (x + offset.x) * sz;
                        const py = (y + offset.y) * sz;
                        this.ctx.fillStyle = this.config.COLORS[val] || '#00D4FF';
                        this.ctx.fillRect(px + 1, py + 1, sz - 2, sz - 2);

                        // Brillo superior
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                        this.ctx.fillRect(px + 1, py + 1, sz - 2, 2);
                        this.ctx.fillRect(px + 1, py + 1, 2, sz - 2);

                        // Sombra inferior
                        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
                        this.ctx.fillRect(px + 1, py + sz - 3, sz - 2, 2);
                        this.ctx.fillRect(px + sz - 3, py + 1, 2, sz - 2);
                    }
                });
            });
            this.ctx.globalAlpha = 1.0;
        }

        render(boardGrid, activePiece, playerPos, clearingLines = [], fadeAlpha = 1.0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawGrid();
            this.drawMatrix(boardGrid, { x: 0, y: 0 });

            if (clearingLines.length > 0) {
                this.ctx.fillStyle = `rgba(255, 255, 255, ${fadeAlpha})`;
                clearingLines.forEach(y => {
                    this.ctx.fillRect(0, y * this.config.BLOCK_SIZE, this.canvas.width, this.config.BLOCK_SIZE);
                });
            }

            if (activePiece) {
                this.drawMatrix(activePiece, playerPos);
            }
        }

        drawWelcome() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawGrid();
            this.ctx.fillStyle = '#00FF87';
            this.ctx.font = '12px "Press Start 2P", monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('TETRIS', this.canvas.width / 2, 160);
            this.ctx.fillStyle = '#00D4FF';
            this.ctx.font = '8px "Press Start 2P", monospace';
            this.ctx.fillText('ARCADE', this.canvas.width / 2, 185);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '7px "Press Start 2P", monospace';
            this.ctx.fillText('CLIC EN INICIAR', this.canvas.width / 2, 230);
        }
    }

    window.TetrisRenderer = TetrisRenderer;
})();
