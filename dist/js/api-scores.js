// Sistema de Puntajes conectado con PostgreSQL en Dokploy
(function() {
    window.saveScoreToFirebase = async function(nombre, score, game = 'tetris') {
        try {
            const response = await fetch('/api/scores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    usuario: nombre,
                    puntaje: score,
                    game: game
                })
            });

            if (!response.ok) throw new Error('Error en el servidor');
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al guardar puntaje:', error);
            throw error;
        }
    };

    window.mostrarPuntajes = async function(game = 'tetris') {
        const tbody = document.querySelector("#leaderboard-table tbody");
        if (!tbody) return;
        tbody.innerHTML = "<tr><td colspan='3'>Cargando puntajes...</td></tr>";

        try {
            const response = await fetch(`/api/scores?game=${game}`);
            if (!response.ok) throw new Error('Error al consultar puntajes');
            const data = await response.json();
            const scores = data.scores || [];

            tbody.innerHTML = "";
            if (scores.length === 0) {
                tbody.innerHTML = "<tr><td colspan='3'>Sé el primero en guardar un récord.</td></tr>";
                return;
            }

            scores.forEach((record, index) => {
                const fila = document.createElement("tr");
                fila.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${record.usuario || 'Anónimo'}</td>
                    <td>${record.puntaje || 0}</td>
                `;
                tbody.appendChild(fila);
            });
        } catch (error) {
            console.error("❌ Error al mostrar puntajes:", error);
            tbody.innerHTML = "<tr><td colspan='3'>Error al cargar récords</td></tr>";
        }
    };

    document.addEventListener("DOMContentLoaded", () => {
        mostrarPuntajes();
    });
})();
