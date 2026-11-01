// ==========================================
// 🧱 BOARD MODEL - Patrón: Model / Encapsulation
// ==========================================
(function() {
    class BoardModel {
        constructor(cols, rows) {
            this.cols = cols;
            this.rows = rows;
            this.reset();
        }

        reset() {
            this.grid = Array.from({ length: this.rows }, () => new Array(this.cols).fill(0));
        }

        hasCollision(pieceMatrix, offset) {
            for (let y = 0; y < pieceMatrix.length; ++y) {
                for (let x = 0; x < pieceMatrix[y].length; ++x) {
                    if (pieceMatrix[y][x] !== 0) {
                        const targetY = y + offset.y;
                        const targetX = x + offset.x;
                        if (targetX < 0 || targetX >= this.cols || targetY >= this.rows) {
                            return true;
                        }
                        if (targetY >= 0 && this.grid[targetY][targetX] !== 0) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }

        merge(pieceMatrix, offset) {
            pieceMatrix.forEach((row, y) => {
                row.forEach((value, x) => {
                    if (value !== 0) {
                        const targetY = y + offset.y;
                        const targetX = x + offset.x;
                        if (targetY >= 0 && targetY < this.rows && targetX >= 0 && targetX < this.cols) {
                            this.grid[targetY][targetX] = value;
                        }
                    }
                });
            });
        }

        getCompletedLines() {
            const completed = [];
            for (let y = this.rows - 1; y >= 0; --y) {
                if (this.grid[y].every(cell => cell !== 0)) {
                    completed.push(y);
                }
            }
            return completed;
        }

        removeLines(lineIndices) {
            lineIndices.sort((a, b) => a - b).forEach(y => {
                this.grid.splice(y, 1);
                this.grid.unshift(new Array(this.cols).fill(0));
            });
        }
    }

    window.BoardModel = BoardModel;
})();
