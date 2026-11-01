// ==========================================
// 🧩 TETRIS CONFIGURATION - Config & Constants
// Patrón: Configuration Object / Immutable State
// ==========================================
(function() {
    window.TetrisConfig = Object.freeze({
        COLS: 10,
        ROWS: 20,
        BLOCK_SIZE: 20,
        PREVIEW_BLOCK_SIZE: 16,
        INITIAL_DROP_INTERVAL: 650,
        MIN_DROP_INTERVAL: 120,
        LEVEL_SPEED_STEP: 45,
        SCORE_POINTS: [0, 100, 300, 500, 800],
        PIECE_TYPES: 'IOTSZJL',
        COLORS: [
            null,
            '#00D4FF', // 1: Cyan (I)
            '#FFD93D', // 2: Amarillo (O)
            '#FF007F', // 3: Rosa Neón (T)
            '#00FF87', // 4: Verde Neón (S)
            '#FF0055', // 5: Rojo Carmín (Z)
            '#7F00FF', // 6: Morado (J)
            '#FF8E0D'  // 7: Naranja (L)
        ]
    });
})();
