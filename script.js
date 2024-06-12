const board = document.getElementById('board');

const boardSize = 8;
const squares = [];
let currentPlayer = 'red';

const colors = ['red', 'black']
for (const i in colors){
    const color = colors[i]
    colors[i] = color.charAt(0).toUpperCase() + color.slice(1);
}

function changeTurn(){
    document.querySelector('h2').innerText = `Current Turn: ${currentPlayer}`;
}
changeTurn();

// Initialize board
for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
        const square = document.createElement('div');
        square.classList.add('square');
        square.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
        square.dataset.row = row;
        square.dataset.col = col;

        if (row < 3 && (row + col) % 2 !== 0) {
            const piece = document.createElement('div');
            piece.classList.add('piece', colors[1]);
            piece.style.backgroundImage = "url('black-pawn.png')";
            square.appendChild(piece);
        } else if (row > 4 && (row + col) % 2 !== 0) {
            const piece = document.createElement('div');
            piece.classList.add('piece', colors[0]);
            piece.style.backgroundImage = "url('red-pawn.png')";
            square.appendChild(piece);
        }

        square.addEventListener('click', onSquareClick);

        board.appendChild(square);
        squares.push(square);
    }
}

function onSquareClick(event) {
    const square = event.currentTarget;
    const piece = square.querySelector('.piece');

    if (piece && piece.classList.contains(currentPlayer)) {
        selectPiece(piece);
    } else if (selectedPiece) {
        movePiece(selectedPiece, square);
    }
}

let selectedPiece = null;

function selectPiece(piece) {
    if (selectedPiece) {
        selectedPiece.classList.remove('selected');
    }
    selectedPiece = piece;
    selectedPiece.classList.add('selected');
}

function movePiece(piece, targetSquare) {
    const targetRow = parseInt(targetSquare.dataset.row, 10);
    const targetCol = parseInt(targetSquare.dataset.col, 10);
    const pieceRow = parseInt(piece.parentNode.dataset.row, 10);
    const pieceCol = parseInt(piece.parentNode.dataset.col, 10);

    const rowDiff = targetRow - pieceRow;
    const colDiff = targetCol - pieceCol;

    if (isValidMove(piece, pieceRow, pieceCol, targetRow, targetCol, rowDiff, colDiff)) {
        targetSquare.appendChild(piece);
        removeCapturedPiece(pieceRow, pieceCol, targetRow, targetCol);
        checkKing(piece, targetRow);
        switchPlayer();
    }
}

function isValidMove(piece, pieceRow, pieceCol, targetRow, targetCol, rowDiff, colDiff) {
    const targetSquare = getSquare(targetRow, targetCol);
    if (targetSquare.querySelector('.piece')) {
        return false; // Target square is not empty
    }

    const isKing = piece.classList.contains('king');
    const direction = piece.classList.contains(colors[0]) ? -1 : 1;

    if (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1 && (isKing || rowDiff === direction)) {
        return true;
    } else if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2 && (isKing || rowDiff === 2 * direction)) {
        const middleRow = (pieceRow + targetRow) / 2;
        const middleCol = (pieceCol + targetCol) / 2;
        const middleSquare = getSquare(middleRow, middleCol);
        const middlePiece = middleSquare.querySelector('.piece');
        return middlePiece && !middlePiece.classList.contains(currentPlayer);
    }
    return false;
}

function removeCapturedPiece(pieceRow, pieceCol, targetRow, targetCol) {
    if (Math.abs(targetRow - pieceRow) === 2) {
        const middleRow = (pieceRow + targetRow) / 2;
        const middleCol = (pieceCol + targetCol) / 2;
        const middleSquare = getSquare(middleRow, middleCol);
        const middlePiece = middleSquare.querySelector('.piece');
        if (middlePiece) {
            middleSquare.removeChild(middlePiece);
        }
    }
}

function checkKing(piece, row) {
    if ((piece.classList.contains(colors[0]) && row === 0) ||
        (piece.classList.contains(colors[1]) && row === boardSize - 1)) {
        piece.classList.add('king');
        piece.style.backgroundImage = piece.classList.contains(colors[0]) ? "url('red-king.png')" : "url('black-king.png')";
    }
}

function switchPlayer() {
    currentPlayer = currentPlayer === colors[0] ? colors[1] : colors[0];
    if (selectedPiece) {
        selectedPiece.classList.remove('selected');
        selectedPiece = null;
    }
    changeTurn();
}

function getSquare(row, col) {
    return squares.find(square => square.dataset.row == row && square.dataset.col == col);
}