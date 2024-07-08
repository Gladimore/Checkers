const board = document.getElementById('board');
const winning = document.querySelector('h2');

const jsConfetti = new JSConfetti();

const boardSize = 8;
const squares = [];
let currentPlayer = 'red';

function upper(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function changeTurn(){
winning.innerHTML = `<span class = "txt ${currentPlayer}">${upper(currentPlayer)}'s</span> Turn`
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
                piece.classList.add('piece', 'black')
                square.appendChild(piece);
        } else if (row > 4 && (row + col) % 2 !== 0) {
            const piece = document.createElement('div');
            piece.classList.add('piece', 'red');
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
        const capturedPiece = removeCapturedPiece(pieceRow, pieceCol, targetRow, targetCol);
        checkKing(piece, targetRow);
        if (capturedPiece && canJumpAgain(piece, targetRow, targetCol) && !checkWin()) {
            selectedPiece = piece;
        } else {
            if (!checkWin()) {
                switchPlayer()
            } else {
                // Trigger confetti
                jsConfetti.addConfetti();
                // Display winner
                winning.innerText = upper(`${currentPlayer} Wins!`)
                // Disable further moves
                squares.forEach(square => square.removeEventListener('click', onSquareClick));
            }
        }
    }
}

function isValidMove(piece, pieceRow, pieceCol, targetRow, targetCol, rowDiff, colDiff) {
    const targetSquare = getSquare(targetRow, targetCol);
    if (targetSquare && targetSquare.querySelector('.piece')) {
        return false; // Target square is not empty
    }

    const isKing = piece.classList.contains('king');
    const direction = piece.classList.contains('red') ? -1 : 1;

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
            return middlePiece;
        }
    }
    return null;
}

function checkKing(piece, row) {
    if ((piece.classList.contains('red') && row === 0) ||
        (piece.classList.contains('black') && row === boardSize - 1)) {
        piece.classList.add('king');
    }
}

function canJumpAgain(piece, row, col) {
    const directions = [
        [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];

    for (let i = 0; i < 2; i++){
        for (let [rowDiff, colDiff] of directions) {
            rowDiff *= i;
            colDiff *= i;
            const targetRow = row + rowDiff;
            const targetCol = col + colDiff;
            if (isValidMove(piece, row, col, targetRow, targetCol, rowDiff, colDiff)) {
                return true;
            }
        }
    }

    return false;
}

function opColor() {
    return currentPlayer === 'red' ? 'black' : 'red';
}

function switchPlayer() {
    currentPlayer = opColor();
    if (selectedPiece) {
        selectedPiece.classList.remove('selected');
        selectedPiece = null;
    }
    changeTurn();
}

function getSquare(row, col) {
    return squares.find(square => square.dataset.row == row && square.dataset.col == col);
}

function checkWin() {
    const pieces = document.querySelectorAll('.piece');
    let redPieces = 0;
    let blackPieces = 0;

    pieces.forEach(piece => {
        if (piece.classList.contains('red')) {
            redPieces++;
        } else if (piece.classList.contains('black')) {
            blackPieces++;
        }
    });
    return redPieces === 0 || blackPieces === 0;
}
