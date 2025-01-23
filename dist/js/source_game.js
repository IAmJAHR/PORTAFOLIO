document.addEventListener('DOMContentLoaded', () => {
    const grid = document.querySelector('.grid');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const startButton = document.getElementById('start-button');
    const resetButton = document.getElementById('reset-button');

    const width = 10;
    let squares = [];
    let score = 0;
    let timerId;
    let timerInterval;
    let currentPosition = 4;
    let currentRotation = 0;
    let totalSeconds = 0;
    let isGameOver = false;

    // Tetrominos
    const lTetromino = [
        [1, width + 1, width * 2 + 1, 2],
        [width, width + 1, width + 2, width * 2 + 2],
        [1, width + 1, width * 2 + 1, width * 2],
        [width, width * 2, width * 2 + 1, width * 2 + 2],
    ];

    const zTetromino = [
        [0, width, width + 1, width * 2 + 1],
        [width + 1, width + 2, width * 2, width * 2 + 1],
        [0, width, width + 1, width * 2 + 1],
        [width + 1, width + 2, width * 2, width * 2 + 1],
    ];

    const tTetromino = [
        [1, width, width + 1, width + 2],
        [1, width + 1, width + 2, width * 2 + 1],
        [width, width + 1, width + 2, width * 2 + 1],
        [1, width, width + 1, width * 2 + 1],
    ];

    const oTetromino = [
        [0, 1, width, width + 1],
        [0, 1, width, width + 1],
        [0, 1, width, width + 1],
        [0, 1, width, width + 1],
    ];

    const iTetromino = [
        [1, width + 1, width * 2 + 1, width * 3 + 1],
        [width, width + 1, width + 2, width + 3],
        [1, width + 1, width * 2 + 1, width * 3 + 1],
        [width, width + 1, width + 2, width + 3],
    ];

    const theTetrominoes = [
        lTetromino,
        zTetromino,
        tTetromino,
        oTetromino,
        iTetromino,
    ];

    let random = Math.floor(Math.random() * theTetrominoes.length);
    let current = theTetrominoes[random][currentRotation];

    // Crear el grid
    function createGrid() {
        for (let i = 0; i < 200; i++) {
            const div = document.createElement('div');
            grid.appendChild(div);
            squares.push(div);
        }
        for (let i = 0; i < 10; i++) {
            const div = document.createElement('div');
            div.classList.add('taken');
            grid.appendChild(div);
            squares.push(div);
        }
    }

    createGrid();

    function draw() {
        current.forEach((index) => {
            squares[currentPosition + index]?.classList.add('piece');
        });
    }

    function undraw() {
        current.forEach((index) => {
            squares[currentPosition + index]?.classList.remove('piece');
        });
    }

    function moveLeft() {
        if (isGameOver) return;
        undraw();
        const isAtLeftEdge = current.some(
            (index) => (currentPosition + index) % width === 0
        );
        if (!isAtLeftEdge) currentPosition -= 1;
        if (
            current.some((index) =>
                squares[currentPosition + index]?.classList.contains('taken')
            )
        ) {
            currentPosition += 1;
        }
        draw();
    }

    function moveRight() {
        if (isGameOver) return;
        undraw();
        const isAtRightEdge = current.some(
            (index) => (currentPosition + index) % width === width - 1
        );
        if (!isAtRightEdge) currentPosition += 1;
        if (
            current.some((index) =>
                squares[currentPosition + index]?.classList.contains('taken')
            )
        ) {
            currentPosition -= 1;
        }
        draw();
    }

    function moveDown() {
        if (isGameOver) return;
        undraw();
        currentPosition += width;
        draw();
        freeze();
    }

    function freeze() {
        if (
            current.some((index) =>
                squares[currentPosition + index + width]?.classList.contains('taken')
            )
        ) {
            current.forEach((index) =>
                squares[currentPosition + index]?.classList.add('taken')
            );
            if (current.some((index) => currentPosition + index < width)) {
                gameOver();
                return;
            }
            random = Math.floor(Math.random() * theTetrominoes.length);
            current = theTetrominoes[random][currentRotation];
            currentPosition = 4;
            draw();
            addScore();
        }
    }

    function addScore() {
        for (let i = 0; i < 199; i += width) {
            const row = Array.from({ length: width }, (_, index) => i + index);
            if (row.every((index) => squares[index]?.classList.contains('taken'))) {
                score += 10;
                scoreDisplay.textContent = score;
                row.forEach((index) => {
                    squares[index]?.classList.remove('taken', 'piece');
                });
                const removedSquares = squares.splice(i, width);
                squares = removedSquares.concat(squares);
                squares.forEach((cell) => grid.appendChild(cell));
            }
        }
    }

    function gameOver() {
        clearInterval(timerId);
        clearInterval(timerInterval);
        isGameOver = true;
        document.querySelector('.info-container').innerHTML += `
            <p style="color: red; font-size: 1.5em; margin-top: 10px;">
                Game Over. ¡Has perdido!
            </p>`;
    }

    startButton.addEventListener('click', () => {
        if (!timerId) {
            timerId = setInterval(moveDown, 800);
            timerInterval = setInterval(() => {
                if (!isGameOver && timerId > 200) {
                    clearInterval(timerId);
                    timerId = setInterval(moveDown, timerId - 50);
                }
            }, 10000);
        }
    });

    resetButton.addEventListener('click', () => {
        window.location.reload();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') moveLeft();
        else if (e.key === 'ArrowRight') moveRight();
        else if (e.key === 'ArrowDown') moveDown();
    });

    draw();
});
