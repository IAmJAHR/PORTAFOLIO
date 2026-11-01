// ==========================================
// 🚀 TETRIS BOOTSTRAPPER - Patrón: Entry Point (<60 líneas)
// ==========================================
(function() {
    document.addEventListener('DOMContentLoaded', () => {
        window.gameFacade = new window.GameFacade();

        // Acciones globales
        window.iniciar_juego = () => window.gameFacade.start();
        window.togglePause = () => window.gameFacade.togglePause();
        window.restartGame = () => window.gameFacade.start();
        window.forzarGameOverArcade = () => window.gameFacade.gameOver();

        // Guardado de puntaje en PostgreSQL con CyberToast (Cero Alert, Cero Swal)
        const saveBtn = document.getElementById('btn-save-arcade');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const input = document.getElementById('arcade-nombre');
                const nombre = input ? input.value.trim() : '';
                if (!nombre) {
                    window.CyberToast.warning('Ingresa tu alias o nombre de jugador.');
                    return;
                }

                saveBtn.disabled = true;
                saveBtn.innerText = 'GUARDANDO...';

                try {
                    const finalScore = parseInt(document.getElementById('arcade-score')?.innerText) || (window.gameFacade ? window.gameFacade.state.score : 0);
                    if (typeof window.saveScoreToFirebase === 'function') {
                        await window.saveScoreToFirebase(nombre, finalScore, 'tetris');
                    }
                    document.getElementById('arcade-game-over').classList.add('hidden');
                    window.CyberToast.success(`¡Récord de ${finalScore} pts guardado, ${nombre}!`);

                    if (typeof window.mostrarPuntajes === 'function') {
                        window.mostrarPuntajes('tetris');
                    }
                    if (input) input.value = '';
                } catch (err) {
                    console.error('Error al guardar:', err);
                    window.CyberToast.error('Error al sincronizar con la base de datos.');
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.innerText = '💾 GUARDAR PUNTAJE';
                }
            });
        }
    });
})();
