// Funciones para interactuar con Supabase

async function guardarPuntajeArcade() {
    const nombre = document.getElementById("arcade-nombre").value.trim();
    const comentario = document.getElementById("arcade-comentario").value.trim();
    const score = parseInt(document.getElementById("arcade-score").innerText);

    if (!nombre) {
        alert("😅 Escribe tu nombre primero.");
        return;
    }

    try {
        const { data, error } = await supabase
            .from('comentarios')
            .insert([
                {
                    usuario: nombre,
                    puntaje: score,
                    comentario: comentario || null
                }
            ]);

        if (error) throw error;

        document.getElementById('arcade-game-over').classList.add('hidden');
        alert("✅ Puntaje guardado con estilo arcade.");
        mostrarPuntajes(); // Actualizar la tabla

        // Limpiar campos
        document.getElementById("arcade-nombre").value = "";
        document.getElementById("arcade-comentario").value = "";
    } catch (error) {
        console.error("❌ Error al guardar puntaje:", error);
        alert("❌ Error al guardar el puntaje. Intenta de nuevo.");
    }
}

async function mostrarPuntajes() {
    const tbody = document.querySelector("#leaderboard-table tbody");
    tbody.innerHTML = ""; // Limpiar antes de cargar

    try {
        const { data, error } = await supabase
            .from('comentarios')
            .select('*')
            .order('puntaje', { ascending: false })
            .limit(10);

        if (error) throw error;

        data.forEach((record, index) => {
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${index + 1}</td>
                <td>${record.usuario}</td>
                <td>${record.puntaje}</td>
            `;
            // Agregar título con el comentario si existe
            if (record.comentario) {
                fila.title = `Comentario: ${record.comentario}`;
                fila.style.cursor = 'help';
            }
            tbody.appendChild(fila);
        });
    } catch (error) {
        console.error("❌ Error al mostrar puntajes:", error);
    }
}
