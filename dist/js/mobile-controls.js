// Controles táctiles para móviles

// Detectar si es dispositivo móvil
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

// Mostrar controles solo en móvil
if (isMobileDevice()) {
    document.querySelector('.mobile-controls').style.display = 'grid';
}

// Event listeners para los botones
document.getElementById('btn-left').addEventListener('touchstart', (e) => {
    e.preventDefault();
    playerMove(-1);
});

document.getElementById('btn-right').addEventListener('touchstart', (e) => {
    e.preventDefault();
    playerMove(1);
});

document.getElementById('btn-rotate').addEventListener('touchstart', (e) => {
    e.preventDefault();
    playerRotate(1);
});

document.getElementById('btn-down').addEventListener('touchstart', (e) => {
    e.preventDefault();
    playerDrop();
});

// También agregar soporte para click (para testing en desktop)
document.getElementById('btn-left').addEventListener('click', () => playerMove(-1));
document.getElementById('btn-right').addEventListener('click', () => playerMove(1));
document.getElementById('btn-rotate').addEventListener('click', () => playerRotate(1));
document.getElementById('btn-down').addEventListener('click', () => playerDrop());

console.log('📱 Controles móviles inicializados');
