// Sistema de Puntajes conectado con PostgreSQL en Dokploy (<65 líneas)
(function() {
    window.saveScoreToFirebase = async function(nombre, score, game = 'tetris') {
        try {
            const res = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario: nombre, puntaje: score, game: game })
            });
            if (!res.ok) throw new Error('Error en el servidor');
            return await res.json();
        } catch (error) {
            console.error('Error al guardar puntaje:', error);
            throw error;
        }
    };

    window.mostrarPuntajes = async function(game = 'tetris') {
        const tbody = document.querySelector("#leaderboard-table tbody");
        if (!tbody) return;
        tbody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>Cargando récords...</td></tr>";

        try {
            const res = await fetch(`/api/scores?game=${game}&_t=${Date.now()}`);
            if (!res.ok) throw new Error('Error HTTP');
            const data = await res.json();
            const scores = data.scores || [];

            tbody.innerHTML = "";
            if (scores.length === 0) {
                tbody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>Sé el primero en guardar un récord.</td></tr>";
                return;
            }

            scores.forEach((rec, idx) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${idx + 1}</td>
                    <td>${rec.usuario || 'Anónimo'}</td>
                    <td>${rec.puntaje || 0}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error("❌ Error al mostrar puntajes:", error);
            tbody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>Error al cargar récords</td></tr>";
        }
    };

    // Ejecución inmediata y confiable sin depender exclusivamente de DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.mostrarPuntajes('tetris'));
    } else {
        window.mostrarPuntajes('tetris');
    }
})();
