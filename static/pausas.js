
// 1. GESTIÓN GLOBAL DEL CRONÓMETRO Y SESIÓN

let globalTimerInterval = null;
let globalStartTime = null;

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function startTimer() {
    stopTimer();
    globalStartTime = Date.now();
    const display = document.getElementById("tiempo");

    globalTimerInterval = setInterval(() => {
        if (!display) return;
        const elapsed = Math.floor((Date.now() - globalStartTime) / 1000);
        display.textContent = formatTime(elapsed);
    }, 1000);
}

function stopTimer() {
    if (globalTimerInterval) {
        clearInterval(globalTimerInterval);
        globalTimerInterval = null;
    }
}

function resetTimer() {
    stopTimer();
    const display = document.getElementById("tiempo");
    if (display) display.textContent = "00:00";
}


// 2. MÓDULO: SOPA DE LETRAS ERGONÓMICA

const WordSearchModule = (function () {
    const wordsToFind = [
        'BIENESTAR', 'POSTURA', 'MOVIMIENTO', 'ENERGIA',
        'DESCANSO', 'RESPIRAR', 'SALUD', 'ESTIRAR', 'ENFOQUE', 'EQUILIBRIO'
    ];
    const gridSize = 14;
    let grid = [];
    let foundWords = [];
    let selectedCells = [];
    let isSelecting = false;

    function initGrid() {
        grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
        foundWords = [];
        selectedCells = [];
    }

    function placeWord(word) {
        const directions = ['H', 'V'];
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 150) {
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const row = Math.floor(Math.random() * gridSize);
            const col = Math.floor(Math.random() * gridSize);
            let fits = true;

            if (dir === 'H' && col + word.length <= gridSize) {
                for (let i = 0; i < word.length; i++) {
                    if (grid[row][col + i] !== '' && grid[row][col + i] !== word[i]) {
                        fits = false;
                        break;
                    }
                }
                if (fits) {
                    for (let i = 0; i < word.length; i++) grid[row][col + i] = word[i];
                    placed = true;
                }
            } else if (dir === 'V' && row + word.length <= gridSize) {
                for (let i = 0; i < word.length; i++) {
                    if (grid[row + i][col] !== '' && grid[row + i][col] !== word[i]) {
                        fits = false;
                        break;
                    }
                }
                if (fits) {
                    for (let i = 0; i < word.length; i++) grid[row + i][col] = word[i];
                    placed = true;
                }
            }
            attempts++;
        }
    }

    function fillRandomLetters() {
        const letters = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c] === '') {
                    grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
    }

    function renderGrid(container) {
        container.innerHTML = '';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;

        grid.forEach((row, r) => {
            row.forEach((letter, c) => {
                const cell = document.createElement('div');
                cell.classList.add('letter-cell');
                cell.textContent = letter;
                cell.dataset.row = r;
                cell.dataset.col = c;

                cell.addEventListener('mousedown', () => startSelection(cell));
                cell.addEventListener('mouseenter', () => extendSelection(cell));
                cell.addEventListener('mouseup', () => endSelection());

                container.appendChild(cell);
            });
        });

        container.addEventListener('mouseleave', () => {
            if (isSelecting) endSelection();
        });
    }

    function startSelection(cell) {
        isSelecting = true;
        selectedCells = [cell];
        cell.classList.add('selected');
    }

    function extendSelection(cell) {
        if (!isSelecting || selectedCells.includes(cell)) return;
        selectedCells.push(cell);
        cell.classList.add('selected');
    }

    function endSelection() {
        if (!isSelecting) return;
        isSelecting = false;
        checkSelectedWord();
    }

    function checkSelectedWord() {
        const formedWord = selectedCells.map(c => c.textContent).join('');
        const reversedWord = formedWord.split('').reverse().join('');

        const targetWord = wordsToFind.find(w => w === formedWord || w === reversedWord);

        if (targetWord && !foundWords.includes(targetWord)) {
            foundWords.push(targetWord);
            selectedCells.forEach(cell => {
                cell.classList.remove('selected');
                cell.classList.add('found');
            });
            updateWordListUI(targetWord);
            checkVictory();
        } else {
            selectedCells.forEach(cell => cell.classList.remove('selected'));
        }
        selectedCells = [];
    }

    function updateWordListUI(word) {
        const item = document.querySelector(`#word-list li[data-word="${word}"]`);
        if (item) {
            item.style.textDecoration = 'line-through';
            item.classList.remove('badge-light', 'text-dark');
            item.classList.add('badge-success', 'text-white');
        }
    }

    function checkVictory() {
        if (foundWords.length === wordsToFind.length) {
            stopTimer();
            const elapsed = Math.floor((Date.now() - globalStartTime) / 1000);
            setTimeout(() => {
                alert(`¡Excelente agilidad! Has encontrado todas las palabras en ${formatTime(elapsed)}.`);
            }, 300);
        }
    }

    function init() {
        const container = document.getElementById('grid-container');
        if (!container) return;

        initGrid();
        wordsToFind.forEach(placeWord);
        fillRandomLetters();
        renderGrid(container);

        document.querySelectorAll('#word-list li').forEach(li => {
            li.style.textDecoration = 'none';
            li.className = 'badge badge-pill badge-light border text-dark p-2 m-1';
        });

        startTimer();

        const btnReset = document.getElementById('reset-button');
        if (btnReset) {
            btnReset.onclick = () => {
                resetTimer();
                init();
            };
        }
    }

    return { init };
})();



// 3. MÓDULO: ROMPECABEZAS

const PuzzleModule = (function () {
    let canvas, ctx;
    const rows = 3, cols = 3;
    let pieceWidth, pieceHeight;
    let pieces = [];
    let selectedPieceIndex = null;
    let imgObj = null;

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function initPieces() {
        pieces = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                pieces.push({
                    sx: c * pieceWidth,
                    sy: r * pieceHeight,
                    targetR: r,
                    targetC: c
                });
            }
        }
        shuffle(pieces);
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const scaleX = imgObj.naturalWidth / canvas.width;
        const scaleY = imgObj.naturalHeight / canvas.height;

        let i = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const piece = pieces[i];
                ctx.drawImage(
                    imgObj,
                    piece.sx * scaleX, piece.sy * scaleY, pieceWidth * scaleX, pieceHeight * scaleY,
                    c * pieceWidth, r * pieceHeight, pieceWidth, pieceHeight
                );

                ctx.strokeStyle = (selectedPieceIndex === i) ? '#e74c3c' : 'rgba(0,0,0,0.2)';
                ctx.lineWidth = (selectedPieceIndex === i) ? 3 : 1;
                ctx.strokeRect(c * pieceWidth, r * pieceHeight, pieceWidth, pieceHeight);
                i++;
            }
        }
    }

    function onCanvasClick(e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const c = Math.floor(x / pieceWidth);
        const r = Math.floor(y / pieceHeight);
        const clickedIndex = r * cols + c;

        if (selectedPieceIndex === null) {
            selectedPieceIndex = clickedIndex;
            render();
        } else {
            const temp = pieces[selectedPieceIndex];
            pieces[selectedPieceIndex] = pieces[clickedIndex];
            pieces[clickedIndex] = temp;
            selectedPieceIndex = null;
            render();

            if (checkSolved()) {
                stopTimer();
                const elapsed = Math.floor((Date.now() - globalStartTime) / 1000);
                setTimeout(() => {
                    alert(`¡Desafío completado! Has armado el rompecabezas en ${formatTime(elapsed)}.`);
                }, 300);
            }
        }
    }

    function checkSolved() {
        let i = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const piece = pieces[i];
                if (piece.sx !== c * pieceWidth || piece.sy !== r * pieceHeight) {
                    return false;
                }
                i++;
            }
        }
        return true;
    }

    function init() {
        canvas = document.getElementById('puzzleCanvas');
        if (!canvas) return;

        ctx = canvas.getContext('2d');
        pieceWidth = canvas.width / cols;
        pieceHeight = canvas.height / rows;

        imgObj = new Image();
        imgObj.src = (typeof imageUrl !== 'undefined') ? imageUrl : '/static/images/puzzle-sample.png';

        imgObj.onload = () => {
            initPieces();
            render();
            startTimer();
            canvas.onclick = onCanvasClick;
        };

        const btnReset = document.getElementById('reset-button');
        if (btnReset) {
            btnReset.onclick = () => {
                resetTimer();
                initPieces();
                render();
                startTimer();
            };
        }
    }

    return { init };
})();


// 4. MÓDULO: MEMORAMA 

const MemoramaModule = (function () {
    const icons = ["🍎", "🥑", "🍇", "🍉", "🍒", "🍍", "🥝", "🍋"];
    let deck = [];
    let flippedCards = [];
    let matchedCount = 0;

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function init() {
        const board = document.getElementById("memorama");
        if (!board) return;

        board.innerHTML = "";
        deck = [...icons, ...icons];
        shuffle(deck);
        flippedCards = [];
        matchedCount = 0;

        deck.forEach((symbol, index) => {
            const card = document.createElement("div");
            card.classList.add("card-memorama");
            card.dataset.symbol = symbol;
            card.dataset.index = index;
            card.innerHTML = `<span class="card-icon" style="display:none;">${symbol}</span>`;

            card.onclick = function () {
                if (flippedCards.length < 2 && !this.classList.contains("flipped")) {
                    this.classList.add("flipped");
                    this.querySelector(".card-icon").style.display = "block";
                    flippedCards.push(this);

                    if (flippedCards.length === 2) {
                        setTimeout(evaluateMatch, 600);
                    }
                }
            };
            board.appendChild(card);
        });

        startTimer();

        const btnReset = document.getElementById("reset-button");
        if (btnReset) {
            btnReset.onclick = () => {
                resetTimer();
                init();
            };
        }
    }

    function evaluateMatch() {
        const [c1, c2] = flippedCards;
        if (c1.dataset.symbol === c2.dataset.symbol) {
            c1.classList.add("matched");
            c2.classList.add("matched");
            c1.onclick = null;
            c2.onclick = null;
            matchedCount++;

            if (matchedCount === icons.length) {
                stopTimer();
                const elapsed = Math.floor((Date.now() - globalStartTime) / 1000);
                setTimeout(() => {
                    alert(`¡Memoria impecable! Has encontrado todas las parejas en ${formatTime(elapsed)}.`);
                }, 300);
            }
        } else {
            c1.classList.remove("flipped");
            c2.classList.remove("flipped");
            c1.querySelector(".card-icon").style.display = "none";
            c2.querySelector(".card-icon").style.display = "none";
        }
        flippedCards = [];
    }

    return { init };
})();


// 5. ENRUTADOR PRINCIPAL 

document.addEventListener('DOMContentLoaded', function () {

    if (document.getElementById('grid-container')) {
        WordSearchModule.init();
    } else if (document.getElementById('puzzleCanvas')) {
        PuzzleModule.init();
    } else if (document.getElementById('memorama')) {
        MemoramaModule.init();
    }
});