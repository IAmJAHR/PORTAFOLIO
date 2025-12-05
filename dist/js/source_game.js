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
    if (!matrix || !offset) return; // Añade esta línea para evitar errores si matrix o offset no están definidos

    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = determineColor(value); // Asigna un color basado en el tipo de pieza
                context.fillRect((x + offset.x) * scale, (y + offset.y) * scale, scale, scale);
            }
        });
    });
}
function determineColor(value) {
    const colors = [
        null, 'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'
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
    let linesCleared = 0;

    for (let y = arena.length - 1; y >= 0; --y) {
        // console.log(`Revisando línea ${y}: ${arena[y].join(",")}`);
        // Verifica si toda la fila está llena (sin ceros)
        if (arena[y].every(cell => cell !== 0)) {
            // console.log(`Línea ${y} está completa. Será eliminada.`);
            arena.splice(y, 1); // Elimina la línea completa
            arena.unshift(new Array(arena[0].length).fill(0)); // Añade una fila vacía arriba
            linesCleared++;
            y++; // Reajusta el índice
        } else {
            // console.log(`Línea ${y} no está completa.`);
        }
    }
    //    console.log(linesCleared +"  = lineas" );

    // console.log(linesCleared > 0 ? "Líneas eliminadas:" : "No se eliminaron líneas.");

    if (linesCleared > 0) {
        // console.log(`${linesCleared} línea(s) eliminada(s).`);
        updateScore(linesCleared);

    } else {
        // console.log("No se eliminaron líneas en esta jugada.");
    }

    // console.log("Estado del arena después de procesar:", JSON.stringify(arena));
}
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
function iniciar_juego() {
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


function togglePause() {
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
    if (isPaused) return; // No actualices si el juego está en pausa

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
        dropCounter = 0;
    }

    draw(); // Redibuja el estado actual del juego
    requestAnimationFrame(update); // Continua el ciclo de actualización
}
function increaseLevel() {
    level++;
    dropInterval *= 0.9; // Hace que las piezas caigan más rápido
    document.getElementById('level').innerText = "LEVEL: " + level;
}


const piecesTypes = 'ILJOTSZ';  // Representa los tipos de piezas disponibles

function randomPiece() {
    const randomIndex = Math.floor(Math.random() * piecesTypes.length);
    const type = piecesTypes[randomIndex];
    const matrix = createPiece(type);
    return { matrix, type }; // ✅ Devuelve objeto con .matrix
}


function playerReset() {
    // ✅ Toma la primera pieza de la cola
    const piece = nextPieces.shift();
    player.matrix = piece.matrix;
    player.type = piece.type;

    // ✅ Mete una nueva pieza al final de la cola
    nextPieces.push(randomPiece());

    // ✅ Posiciona la nueva pieza arriba y centrada
    player.pos.y = 0;
    player.pos.x = (width / 2 | 0) - (player.matrix[0].length / 2 | 0);

    // ✅ Actualiza el display
    updateNextDisplay();

    // 🛑 Verifica si ya hay colisión
    if (collide(arena, player)) {
        // alert("¡Juego terminado! Presiona reiniciar para jugar de nuevo.");
        isPaused = true;
        clearInterval(timerInterval);
        clearInterval(levelInterval);

        const score = parseInt(document.getElementById("score").innerText);
        mostrarGameOverArcade(score);

        return true;
    }

    return false;
}

// document.addEventListener('DOMContentLoaded', function () {
//     update(); // Asegura que update se llama después de que el DOM esté completamente cargado
// });
function drawGrid() {
    context.strokeStyle = '#ddd'; // Cambia el color de la cuadrícula a un gris claro
    context.lineWidth = 0.03; // Asegúrate de que las líneas sean suficientemente sutiles

    // Dibujar líneas verticales
    for (let x = 0; x <= width; x++) {
        context.beginPath();
        context.moveTo(x * scale, 0);
        context.lineTo(x * scale, canvas.height);
        context.stroke();
    }

    // Dibujar líneas horizontales
    for (let y = 0; y <= height; y++) {
        context.beginPath();
        context.moveTo(0, y * scale);
        context.lineTo(canvas.width, y * scale);
        context.stroke();
    }
}

// Variables para almacenar las próximas piezas
const nextPieces = [];

function initNextPieces() {
    // Inicializa con dos piezas aleatorias
    nextPieces.push(randomPiece());
    nextPieces.push(randomPiece());
    updateNextDisplay();
    // console.log("Siguiente pieza:", nextPieces[0]);
}

function updateNextDisplay() {
    const nextPieceDisplay = document.getElementById('next-display');
    nextPieceDisplay.innerHTML = ''; // Limpia el contenido anterior

    if (nextPieces.length > 0) {
        const nextPiece = nextPieces[0].matrix; // ✅ Aquí accedemos a la matriz
        const blockSize = 20;

        nextPiece.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const block = document.createElement('div');
                    block.style.position = 'absolute';
                    block.style.width = `${blockSize}px`;
                    block.style.height = `${blockSize}px`;
                    block.style.left = `${x * blockSize}px`;
                    block.style.top = `${y * blockSize}px`;
                    block.style.backgroundColor = determineColor(value);
                    block.style.border = '1px solid #000';
                    nextPieceDisplay.appendChild(block);
                }
            });
        });
    } else {
        console.warn("No hay piezas en la cola.");
    }
}


function determineColor(value) {
    const colors = ['#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];
    return colors[value - 1]; // Asumiendo que 'value' empieza en 1
}

// let startTime = Date.now();
// let timerInterval = setInterval(updateTime, 1000);

function updateTime() {
    let elapsedTime = Date.now() - startTime;
    let seconds = Math.floor((elapsedTime / 1000) % 60);
    let minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
    document.getElementById('time').innerText = `TIME: ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}


function update(time = 0) {
    if (isPaused) return; // Detiene la ejecución si está en pausa

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
        dropCounter = 0;
    }

    draw(); // Redibuja el estado actual del juego
    requestAnimationFrame(update); // Continúa el bucle de juego
}

function restartGame() {
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
function mostrarGameOverArcade(score) {
    document.getElementById('arcade-score').innerText = score;
    document.getElementById('arcade-game-over').classList.remove('hidden');


}
function forzarGameOverArcade() {
    const score = parseInt(document.getElementById("score").innerText);
    mostrarGameOverArcade(score);
    togglePause();
}
