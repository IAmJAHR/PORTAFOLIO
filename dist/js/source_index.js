// Define los textos principales
let mainText = "😎 Bienvenido 👾 🎮 💻 ";
let awayText = "No te vayas 😢💔 "; // Mensaje cuando el usuario deja la pestaña
let position = 0; // Posición inicial para el desplazamiento
let currentText = mainText; // Texto que se está desplazando actualmente
let intervalId; // ID del intervalo para pausar/reiniciar el scroll

// Función para desplazar el texto dinámico
function scrollTitle() {
    // Actualiza el título desplazándolo de derecha a izquierda
    document.title = currentText.substring(position) + currentText.substring(0, position);
    position = (position + 1) % currentText.length;

    // Llama nuevamente a esta función después de 200ms
    intervalId = setTimeout(scrollTitle, 200);
}

// Detecta si el usuario deja o vuelve a la pestaña
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        // Si la pestaña está oculta, cambia al mensaje de "No te vayas"
        currentText = awayText;
        position = 0; // Reinicia la posición del desplazamiento
    } else {
        // Si el usuario regresa, vuelve al mensaje principal
        currentText = mainText;
        position = 0; // Reinicia la posición del desplazamiento
    }
});
