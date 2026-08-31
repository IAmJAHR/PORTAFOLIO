(function() {
document.addEventListener("contextmenu", function (e) {
    e.preventDefault();
});
document.addEventListener("keydown", function (e) {
    if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
        e.preventDefault();
        alert("🚫 Asi te queria agarrar Puerco.");
    }
});

const canvas = document.getElementById('tetris-canvas');
const context = canvas.getContext('2d');

// Ajustamos el tamaño del canvas de acuerdo al escalamiento

context.scale(1, 1); // Restablece la escala a 1, 1 si estás dibujando con 'scale' en mente ya
const scale = 20; // Tamaño de cada bloque
const width = 10; // Ancho del juego en bloques
const height = 20; // Alto del juego en bloques
canvas.width = width * scale; // Configura el ancho del canvas
canvas.height = height * scale; // Configura el alto del canvas
let level = 1;
let dropInterval = 500; // 1000 ms o 1 segundo por defecto
let lastTime = 0;
let dropCounter = 0;


function updateScore(linesCleared) {
    player.score += linesCleared * 100;
    document.getElementById('score').innerText = player.score;
}

function updateLinesCount(linesCleared) {
    player.lines += linesCleared;
    document.getElementById('lines').innerText = player.lines;
}


function checkLevelUpdate() {
    // Aumenta el nivel cada 10 líneas, por ejemplo
    let newLevel = Math.floor(player.lines / 10);
    if (newLevel > player.level) {
        player.level = newLevel;
        document.getElementById('level').textContent = player.level;
        dropInterval = Math.max(500 - (player.level * 50), 50); // Ajusta la velocidad de caída
    }
}

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

const arena = Array.from({ length: 20 }, () => Array(10).fill(0));

function drawMatrix(matrix, offset) {
    if (!matrix || !offset) return;

    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const px = (x + offset.x) * scale;
                const py = (y + offset.y) * scale;
                const color = determineColor(value);
                
                let currentAlpha = 1.0;
                if (matrix === arena && typeof linesToClear !== 'undefined' && linesToClear.includes(y + offset.y)) {
                    currentAlpha = typeof fadeAlpha !== 'undefined' ? fadeAlpha : 1.0;
                    context.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
                    context.fillRect(px, py, scale, scale);
                }
                
                context.globalAlpha = currentAlpha;
                
                context.fillStyle = color;
                context.fillRect(px, py, scale, scale);
                
                context.fillStyle = 'rgba(255, 255, 255, 0.3)';
                context.fillRect(px, py, scale, 3);
                context.fillRect(px, py, 3, scale);
                
                context.fillStyle = 'rgba(0, 0, 0, 0.4)';
                context.fillRect(px, py + scale - 3, scale, 3);
                context.fillRect(px + scale - 3, py, 3, scale);
                
                context.globalAlpha = 1.0;
            }
        });
    });
}
function determineColor(value) {
    const colors = [
        null, '#00D4FF', '#00FF87', '#FF00FF', '#FF007F', '#7F00FF', '#FFD93D', '#60EFFF'
    ];
    return colors[value];
}

// Aquí puede agregar las definiciones para otras piezas...
function createPiece(type) {
    switch (type) {
        case 'T':
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ];
        case 'O':
            return [
                [2, 2],
                [2, 2],
            ];
        case 'L':
            return [
                [0, 3, 0],
                [0, 3, 0],
                [0, 3, 3],
            ];

        case 'J':
            return [
                [0, 4, 0],
                [0, 4, 0],
                [4, 4, 0],
            ];
        case 'I':
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
            ];
        case 'S':
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        case 'Z':
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ];

        default:
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ]; // Retorna una pieza T por defecto si el tipo es desconocido
    }
}
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
        playerMove(-1); // Mover a la izquierda
    } else if (event.key === 'ArrowRight') {
        playerMove(1); // Mover a la derecha
    } else if (event.key === 'ArrowDown') {
        playerDrop(); // Mover hacia abajo más rápido
    } else if (event.key === 'ArrowUp') {
        playerRotate(1); // Rotar la pieza
    }
});

function playerMove(dir) {
    player.pos.x += dir; // Intenta mover el jugador hacia la izquierda (-1) o derecha (1)

    // Verifica si la pieza está dentro de los límites después de moverse
    if (!isInsideArena(player.pos, player.matrix)) {
        player.pos.x -= dir; // Si no está dentro, revierte el movimiento
    }
}

function isInsideArena(pos, matrix) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < matrix[y].length; ++x) {
            if (matrix[y][x] !== 0) {
                let newX = x + pos.x;
                // Comprueba si la nueva posición X está fuera de los límites
                if (newX < 0 || newX >= width) {
                    return false;
                }
            }
        }
    }
    return true;
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (checkCollision(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function checkCollision(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

const player = {
    pos: { x: 5, y: 0 }, // Inicia en la parte superior del canvas
    matrix: createPiece('T'),
};

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);

        if (playerReset()) {
            return; // Sale del flujo si el juego terminó
        }

        clearLines(); // Elimina líneas completas
    }
    draw(); // Actualiza la pantalla
}

function clearLines() {
    linesToClear = [];
    
    for (let y = arena.length - 1; y >= 0; --y) {
        if (arena[y].every(cell => cell !== 0)) {
            linesToClear.push(y);
        }
    }

    if (linesToClear.length > 0) {
        isClearing = true;
        fadeAlpha = 1.0;
        animateClearLines();
    }
}

function animateClearLines() {
    fadeAlpha -= 0.1; 
    
    if (fadeAlpha <= 0) {
        let linesCleared = 0;
        for (let y = arena.length - 1; y >= 0; --y) {
            if (arena[y].every(cell => cell !== 0)) {
                arena.splice(y, 1);
                arena.unshift(new Array(arena[0].length).fill(0));
                linesCleared++;
                y++; 
            }
        }
        
        updateScore(linesCleared);
        isClearing = false;
        linesToClear = [];
    } else {
        setTimeout(animateClearLines, 30); 
    }
}

let isClearing = false;
let linesToClear = [];
let fadeAlpha = 1.0;

let score = 0; // Inicializa el puntaje global

function updateScore(linesCleared) {
    const scoreElement = document.getElementById('score');

    // Calcula el puntaje basado en las líneas eliminadas
    // Por ejemplo, 1 línea = 100 puntos, 2 líneas = 300 puntos, etc.
    const scoreIncrement = linesCleared === 1 ? 100 :
        linesCleared === 2 ? 300 :
            linesCleared === 3 ? 500 :
                linesCleared === 4 ? 800 : 0;

    score += scoreIncrement; // Suma el incremento al puntaje total
    scoreElement.textContent = score; // Actualiza el DOM
    // console.log(`Puntaje actualizado: ${score} (+${scoreIncrement})`);
}

function playerReset() {
    // Asegúrate de que siempre haya al menos una pieza en la cola
    if (nextPieces.length < 2) {
        nextPieces.push(randomPiece());
    }

    // console.log("Cola antes del shift:", nextPieces);

    // Toma la pieza de la cola y establece como actual
    player.matrix = nextPieces.shift();
    // console.log("Pieza actual después del shift:", player.matrix);

    // Posiciona la pieza actual al inicio
    player.pos.y = 0;
    player.pos.x = (width / 2 | 0) - (player.matrix[0].length / 2 | 0);

    // Agrega una nueva pieza a la cola
    nextPieces.push(randomPiece());
    // console.log("Cola después del push:", nextPieces);

    // Actualiza la visualización de la próxima pieza
    updateNextDisplay();

    // Si la nueva pieza colisiona al ser colocada, termina el juego
    if (collide(arena, player)) {
        // console.log("¡Colisión detectada al reiniciar el jugador! Juego terminado.");
        gameOver();
    }
}

function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
    // console.log("Arena después del merge:", JSON.stringify(arena));
}



function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height); // Limpia el canvas
    drawGrid(); // Dibuja la cuadrícula primero
    drawMatrix(arena, { x: 0, y: 0 }); // Luego dibuja el estado actual del juego
    drawMatrix(player.matrix, player.pos); // Y la pieza que está cayendo
}


// document.addEventListener('DOMContentLoaded', () => {
//     const startButton = document.getElementById('start-button');
//     const pauseButton = document.getElementById('pause-button');
//     const restartButton = document.getElementById('restart-button');
//     let gameStarted = false; // Controla si el juego ya inició

//     // Inicialmente, desactiva los botones de pausa y reinicio
//     pauseButton.disabled = true;
//     restartButton.disabled = true;

//     startButton.addEventListener('click', () => {
//         if (!gameStarted) {
//             gameStarted = true; // Marca que el juego ya inició
//             startButton.style.display = 'none'; // Oculta el botón de iniciar
//             pauseButton.disabled = false; // Habilita el botón de pausa
//             restartButton.disabled = false; // Habilita el botón de reinicio
//             startGame(); // Llama a la función para iniciar el juego
//         }
//     });
// });
let timerInterval;
let levelInterval;
let startTime;
let elapsedTime = 0;
window.iniciar_juego = function() {
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const restartButton = document.getElementById('restart-button');
    pauseButton.disabled = true;
    restartButton.disabled = true;
    gameStarted = true;
    startButton.style.display = 'none';
    pauseButton.disabled = false;
    restartButton.disabled = false;
    startTime = Date.now(); // ⏱️ Empieza el cronómetro
    timerInterval = setInterval(updateTime, 1000); // ↻ Actualiza cada segundo
    levelInterval = setInterval(increaseLevel, 10000);
    $("#pause-button").show();
    $("#restart-button").show();
    $("#guardar-score-button").show();
    startGame(); // <- aquí llama a tu lógica principal del juego
}
let isPaused = false; // Variable global para el estado de pausa

const pauseButton = document.getElementById('pause-button');


window.togglePause = function() {
    isPaused = !isPaused;
    $("#start-button").hide();

    if (isPaused) {
        // console.log("Juego en pausa");
        pauseButton.textContent = "Reanudar";

        // ⏸ Detener intervalos
        clearInterval(timerInterval);
        clearInterval(levelInterval);

        // ⏱️ Guardar tiempo transcurrido para continuar después
        elapsedTime += Date.now() - startTime;
    } else {
        // console.log("Juego reanudado");
        pauseButton.textContent = "Pausa";
        lastTime = performance.now();
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(updateTime, 1000);
        levelInterval = setInterval(increaseLevel, 10000);

        lastTime = performance.now(); // Necesario para `update()`
        update();
    }
}


function startGame() {
    // nextPieces.length = 0; // Limpia la cola de próximas piezas
    nextPieces.push(randomPiece(), randomPiece()); // Inicializa con dos piezas
    updateNextDisplay();
    playerReset();
    update();
}


function update(time = 0) {
    if (isPaused) return; 

    const deltaTime = time - lastTime;
    lastTime = time;

    if (!isClearing) {
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            playerDrop();
            dropCounter = 0;
        }
    }

    draw(); 
    requestAnimationFrame(update); 
}

window.restartGame = function() {
    const scoreElement = document.getElementById('score');
    const levelElement = document.getElementById('level');
    const timeElement = document.getElementById('time');
    const nextDisplay = document.getElementById('next-display');

    if (!scoreElement || !levelElement || !timeElement || !nextDisplay) {
        console.error("Uno o más elementos del DOM no se encontraron.");
        return;
    }

    // Reiniciar variables del juego
    arena.forEach(row => row.fill(0)); // Limpia la arena
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    dropInterval = 1000;
    score = 0; // Reiniciar SCORE INTERNO

    // Reiniciar el DOM
    scoreElement.textContent = "0";
    levelElement.textContent = "LEVEL: 1";
    timeElement.textContent = "TIME: 00:00";
    nextDisplay.innerHTML = ""; // Limpia el display de las siguientes piezas

    // Reiniciar lógica del juego
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTime, 1000);
    playerReset();
    draw();
    // console.log("Juego reiniciado");
}





// function guardarPuntaje() {
//     jugador = "bbcito";
//     score = 1000;
//     db.collection("puntajes").add({
//         jugador: jugador,
//         score: score
//     })
//         .then(() => {
//             console.log("✅ Puntaje guardado");
//             mostrarPuntajes();
//         })
//         .catch(error => {
//             console.error("❌ Error al guardar puntaje:", error);
//         });
// }
// guardarPuntajeArcade() ahora está en supabase-functions.js

// mostrarPuntajes() ahora está en supabase-functions.js

// Lógica segura de guardado
document.getElementById('btn-save-arcade').addEventListener('click', function() {
    const nombre = document.getElementById("arcade-nombre").value.trim();
    if (!nombre) {
        alert("😅 Escribe tu nombre primero.");
        return;
    }

    if (typeof window.saveScoreToFirebase === 'function') {
        window.saveScoreToFirebase(nombre, score)
            .then(() => {
                document.getElementById('arcade-game-over').classList.add('hidden');
                alert("✅ Puntaje guardado con estilo arcade.");
                if(typeof window.mostrarPuntajes === 'function') {
                    window.mostrarPuntajes();
                }
                document.getElementById("arcade-nombre").value = "";
                window.restartGame(); 
            })
            .catch((error) => {
                console.error("❌ Error al guardar puntaje:", error);
                alert("❌ Error al guardar el puntaje. Intenta de nuevo.");
            });
    }
});

function mostrarGameOverArcade(score) {
    document.getElementById('arcade-score').innerText = score;
    document.getElementById('arcade-game-over').classList.remove('hidden');


}
window.forzarGameOverArcade = function() {
    const score = parseInt(document.getElementById("score").innerText);
    mostrarGameOverArcade(score);
    togglePause();
}

})();
