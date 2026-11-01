// Funciones para interactuar con Supabase (<70 líneas)

async function guardarPuntajeArcade() {
    const nombre = document.getElementById("arcade-nombre").value.trim();
    const comentario = document.getElementById("arcade-comentario").value.trim();
    const score = parseInt(document.getElementById("arcade-score").innerText);
    const toast = window.CyberToast || {
        warning: console.warn,
        success: console.log,
        error: console.error
    };

    if (!nombre) {
        toast.warning("😅 Escribe tu nombre primero.");
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
        toast.success("✅ Puntaje guardado con estilo arcade.");
        mostrarPuntajes(); // Actualizar la tabla

        // Limpiar campos
        document.getElementById("arcade-nombre").value = "";
        document.getElementById("arcade-comentario").value = "";
    } catch (error) {
        console.error("❌ Error al guardar puntaje:", error);
        toast.error("❌ Error al guardar el puntaje. Intenta de nuevo.");
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

        data.forEach((fila, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${fila.usuario}</td>
                <td>${fila.puntaje}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("❌ Error al obtener puntajes:", error);
    }
}
