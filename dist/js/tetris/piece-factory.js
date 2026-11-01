// ==========================================
// 🎲 PIECE FACTORY - Patrón: Factory Method
// ==========================================
(function() {
    const MATRICES = {
        'I': [[0,1,0,0], [0,1,0,0], [0,1,0,0], [0,1,0,0]],
        'O': [[2,2], [2,2]],
        'T': [[0,3,0], [3,3,3], [0,0,0]],
        'S': [[0,4,4], [4,4,0], [0,0,0]],
        'Z': [[5,5,0], [0,5,5], [0,0,0]],
        'J': [[6,0,0], [6,6,6], [0,0,0]],
        'L': [[0,0,7], [7,7,7], [0,0,0]]
    };

    class PieceFactory {
        static create(type) {
            const template = MATRICES[type] || MATRICES['T'];
            return template.map(row => [...row]);
        }

        static getRandomPiece() {
            const types = window.TetrisConfig.PIECE_TYPES;
            const type = types[Math.floor(Math.random() * types.length)];
            return {
                type: type,
                matrix: PieceFactory.create(type)
            };
        }

        static rotateMatrix(matrix, dir = 1) {
            const clone = matrix.map(row => [...row]);
            for (let y = 0; y < clone.length; ++y) {
                for (let x = 0; x < y; ++x) {
                    [clone[x][y], clone[y][x]] = [clone[y][x], clone[x][y]];
                }
            }
            if (dir > 0) {
                clone.forEach(row => row.reverse());
            } else {
                clone.reverse();
            }
            return clone;
        }
    }

    window.PieceFactory = PieceFactory;
})();
