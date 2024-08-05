import "./DragDropTouch.js";

const board = document.getElementById("board");
const winning = document.querySelector("h2");

const jsConfetti = new JSConfetti();

const boardSize = 8;
const squares = [];
let currentPlayer = "red";

const test = !window.location.href.includes("github") & false;

function upper(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function changeTurn(won = false, player = "") {
    winning.innerHTML = `<span class="txt ${player || currentPlayer}">${upper((won && player) || currentPlayer)}${won ? "" : "'s"}</span><span id = 'turn'> ${won ? "Won!" : "Turn"}</span>`;
}
changeTurn();

function makePiece(square, color) {
    const piece = document.createElement("div");
    piece.draggable = true;
    piece.classList.add("piece", color);
    square.appendChild(piece);

    if (color === currentPlayer) {
        piece.draggable = true;
    } else {
        piece.draggable = false;
    }
    
    return piece
}

function handleDrag() {
    document.querySelectorAll(".piece").forEach((piece) => {
        piece.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData(
                "text/plain",
                event.target.parentNode.dataset.row +
                    "," +
                    event.target.parentNode.dataset.col,
            );
            event.dataTransfer.effectAllowed = "move";
            selectPiece(event.target);
        });
    });

    document.querySelectorAll(".square").forEach((square) => {
        square.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        });

        square.addEventListener("drop", (event) => {
            event.preventDefault();
            const data = event.dataTransfer.getData("text/plain").split(",");
            const pieceRow = parseInt(data[0], 10);
            const pieceCol = parseInt(data[1], 10);
            const piece = getSquare(pieceRow, pieceCol).querySelector(".piece");
            const targetSquare = event.currentTarget;
movePiece(piece, targetSquare);
        });
    });
}

function initializeBoard() {
    // Initialize board
    for (let row = 0; row < boardSize; row++) {
        for (let col = 0; col < boardSize; col++) {
            const square = document.createElement("div");
            square.classList.add("square");
            square.classList.add((row + col) % 2 === 0 ? "white" : "black");
            square.dataset.row = row;
            square.dataset.col = col;

            if (row < 3 && (row + col) % 2 !== 0) {
                if (test && row === 0 && col === 1) makePiece(square, "black");

                if (!test) makePiece(square, "black");
            } else if (row > 4 && (row + col) % 2 !== 0)
                    makePiece(square, "red");
            square.addEventListener("click", onSquareClick);

            board.appendChild(square);
            squares.push(square);
        }
    }
    handleDrag();
}
initializeBoard();

function onSquareClick(event) {
    const square = event.currentTarget;
    const piece = square.querySelector(".piece");

    if (piece && piece.classList.contains(currentPlayer)) {
        selectPiece(piece);
    } else if (selectedPiece) {
        movePiece(selectedPiece, square);
    }
}

let selectedPiece = null;

function selectPiece(piece) {
    if (
        (selectedPiece && selectedPiece == piece) ||
        !piece ||
        !piece.classList.contains(currentPlayer)
    ) {
        return;
    }

    if (selectedPiece) {
        selectedPiece.classList.remove("selected");

        // Remove highlight from all squares
        clearHighlights();
    }

    selectedPiece = piece;

    highlight(selectedPiece);
    selectedPiece.classList.add("selected");
}

function movePiece(piece, targetSquare) {
    if (!piece || !piece.classList.contains(currentPlayer)
    ) {
        return;
    }
    
    const targetRow = parseInt(targetSquare.dataset.row, 10);
    const targetCol = parseInt(targetSquare.dataset.col, 10);
    const pieceRow = parseInt(piece.parentNode.dataset.row, 10);
    const pieceCol = parseInt(piece.parentNode.dataset.col, 10);

    const rowDiff = targetRow - pieceRow;
    const colDiff = targetCol - pieceCol;

    if (
        isValidMove(
            piece,
            pieceRow,
            pieceCol,
            targetRow,
            targetCol,
            rowDiff,
            colDiff,
        )
    ) {
        clearHighlights();

        targetSquare.appendChild(piece);
        const capturedPiece = removeCapturedPiece(
            pieceRow,
            pieceCol,
            targetRow,
            targetCol,
        );
        checkKing(piece, targetRow);
        if (
            capturedPiece &&
            canJumpAgain(piece, targetRow, targetCol) &&
            !checkWin()
        ) {
            highlight(piece)
            selectedPiece = piece;
            selectedPiece.classList.add("selected");
        } else {
            const winner = checkWin();

            if (!winner) {
                switchPlayer();
            } else {
                // Trigger confetti
                jsConfetti.addConfetti();
                // Display winner
                changeTurn(true, winner);
                // Disable further moves
                squares.forEach((square) =>
                    square.removeEventListener("click", onSquareClick),
                );
            }
        }
    }
}

function isValidMove(
    piece,
    pieceRow,
    pieceCol,
    targetRow,
    targetCol,
    rowDiff,
    colDiff,
) {
    const targetSquare = getSquare(targetRow, targetCol);
    if (targetSquare && targetSquare.querySelector(".piece")) {
        return false; // Target square is not empty
    }

    const isKing = piece.classList.contains("king");
    const direction = piece.classList.contains("red") ? -1 : 1;

    if (
        Math.abs(rowDiff) === 1 &&
        Math.abs(colDiff) === 1 &&
        (isKing || rowDiff === direction)
    ) {
        return true;
    } else if (
        Math.abs(rowDiff) === 2 &&
        Math.abs(colDiff) === 2 &&
        (isKing || rowDiff === 2 * direction)
    ) {
        const middleRow = (pieceRow + targetRow) / 2;
        const middleCol = (pieceCol + targetCol) / 2;
        const middleSquare = getSquare(middleRow, middleCol);
        const middlePiece = middleSquare.querySelector(".piece");
        return middlePiece && !middlePiece.classList.contains(currentPlayer);
    }
    return false;
}

function removeCapturedPiece(pieceRow, pieceCol, targetRow, targetCol) {
    if (Math.abs(targetRow - pieceRow) === 2) {
        const middleRow = (pieceRow + targetRow) / 2;
        const middleCol = (pieceCol + targetCol) / 2;
        const middleSquare = getSquare(middleRow, middleCol);
        const middlePiece = middleSquare.querySelector(".piece");
        if (middlePiece) {
            middleSquare.removeChild(middlePiece);
            return middlePiece;
        }
    }
    return null;
}

function checkKing(piece, row) {
    if (
        (piece.classList.contains("red") && row === 0) ||
        (piece.classList.contains("black") && row === boardSize - 1)
    ) {
        piece.classList.add("king");
    }
}

function canJumpAgain(piece, row, col) {
    const directions = [
        [2, 2],
        [2, -2],
        [-2, 2],
        [-2, -2],
    ];

    for (let [rowDiff, colDiff] of directions) {
        const targetRow = row + rowDiff;
        const targetCol = col + colDiff;
        const middleRow = row + rowDiff / 2;
        const middleCol = col + colDiff / 2;

        // Check if target position is within the board boundaries
        if (
            targetRow >= 0 &&
            targetRow < boardSize &&
            targetCol >= 0 &&
            targetCol < boardSize
        ) {
            const middleSquare = getSquare(middleRow, middleCol);
            const middlePiece = middleSquare?.querySelector(".piece");

            if (
                middlePiece &&
                !middlePiece.classList.contains(currentPlayer) &&
                isValidMove(
                    piece,
                    row,
                    col,
                    targetRow,
                    targetCol,
                    rowDiff,
                    colDiff,
                )
            ) {
                return true;
            }
        }
    }

    return false;
}

function highlight(piece) {
    const directions = [];
    const row = parseInt(piece.parentNode.dataset.row, 10);
    const col = parseInt(piece.parentNode.dataset.col, 10);
    const isKing = piece.classList.contains("king");
    const color = piece.classList.contains("red") ? "red" : "black";

    if (isKing || color === "red") {
        directions.push([-1, 1], [-1, -1]); // Upwards moves for red and kings
        directions.push([-2, 2], [-2, -2]); // Upwards jump moves for red and kings
    }

    if (isKing || color === "black") {
        directions.push([1, 1], [1, -1]); // Downwards moves for black and kings
        directions.push([2, 2], [2, -2]); // Downwards jump moves for black and kings
    }

    for (let [rowDiff, colDiff] of directions) {
        const targetRow = row + rowDiff;
        const targetCol = col + colDiff;
        const middleRow = row + Math.floor(rowDiff / 2);
        const middleCol = col + Math.floor(colDiff / 2);

        // Check if target position is within the board boundaries
        if (
            targetRow >= 0 &&
            targetRow < boardSize &&
            targetCol >= 0 &&
            targetCol < boardSize
        ) {
            const targetSquare = getSquare(targetRow, targetCol);
            const middleSquare = getSquare(middleRow, middleCol);

            // For jump moves, ensure there's an opponent piece in the middle square and target square is empty
            if (Math.abs(rowDiff) === 2 && middleSquare) {
                const middlePiece = middleSquare.querySelector(".piece");
                if (
                    middlePiece &&
                    !middlePiece.classList.contains(color) &&
                    targetSquare &&
                    !targetSquare.querySelector(".piece")
                ) {
                    targetSquare.classList.add("highlight");
                }
            } else if (Math.abs(rowDiff) === 1) {
                // For regular moves, just check if the target square is empty
                if (targetSquare && !targetSquare.querySelector(".piece")) {
                    targetSquare.classList.add("highlight");
                }
            }
        }
    }
}

function clearHighlights() {
    squares.forEach((square) => square.classList.remove("highlight"));
}

function opColor() {
    return currentPlayer === "red" ? "black" : "red";
}

function switchPlayer() {
    document.querySelectorAll(`.piece.${currentPlayer}`).forEach(piece => {piece.draggable = false})
    
    currentPlayer = opColor();
    document.querySelectorAll(`.piece.${currentPlayer}`).forEach(piece => {piece.draggable = true})
    
    if (selectedPiece) {
        selectedPiece.classList.remove("selected");
        selectedPiece = null;
    }
    
    changeTurn();
}

function getSquare(row, col) {
    return squares.find(
        (square) => square.dataset.row == row && square.dataset.col == col,
    );
}

function checkWin() {
    const pieces = document.querySelectorAll(".piece");
    let redPieces = 0;
    let blackPieces = 0;
    let redValidMoves = 0;
    let blackValidMoves = 0;

    pieces.forEach((piece) => {
        const isRed = piece.classList.contains("red");
        const isBlack = piece.classList.contains("black");
        const isKing = piece.classList.contains("king");
        const row = parseInt(piece.parentNode.dataset.row, 10);
        const col = parseInt(piece.parentNode.dataset.col, 10);

        if (isRed) {
            redPieces++;
            redValidMoves += countValidMoves(piece, row, col, isKing, "red");
        } else if (isBlack) {
            blackPieces++;
            blackValidMoves += countValidMoves(
                piece,
                row,
                col,
                isKing,
                "black",
            );
        }
    });

    if (redPieces === 0) {
        return "black";
    } else if (blackPieces === 0) {
        return "red";
    } else if (redValidMoves === 0) {
        return "black";
    } else if (blackValidMoves === 0) {
        return "red";
    }
    return null;
}

function countValidMoves(piece, row, col, isKing, color) {
    const directions = [];

    if (isKing || color === "red") {
        directions.push([-1, 1], [-1, -1]); // Upwards moves for red and kings
        directions.push([-2, 2], [-2, -2]); // Upwards jump moves for red and kings
    }

    if (isKing || color === "black") {
        directions.push([1, 1], [1, -1]); // Downwards moves for black and kings
        directions.push([2, 2], [2, -2]); // Downwards jump moves for black and kings
    }

    let validMoves = 0;

    for (let [rowDiff, colDiff] of directions) {
        const targetRow = row + rowDiff;
        const targetCol = col + colDiff;
        const middleRow = row + Math.floor(rowDiff / 2);
        const middleCol = col + Math.floor(colDiff / 2);

        // Check if target position is within the board boundaries
        if (
            targetRow >= 0 &&
            targetRow < boardSize &&
            targetCol >= 0 &&
            targetCol < boardSize
        ) {
            const targetSquare = getSquare(targetRow, targetCol);
            const middleSquare = getSquare(middleRow, middleCol);

            // For jump moves, ensure there's an opponent piece in the middle square
            if (Math.abs(rowDiff) === 2 && middleSquare) {
                const middlePiece = middleSquare.querySelector(".piece");
                if (
                    middlePiece &&
                    !middlePiece.classList.contains(color) &&
                    !targetSquare.querySelector(".piece")
                ) {
                    validMoves++;
                }
            } else if (Math.abs(rowDiff) === 1) {
                // For regular moves, just check if the target square is empty
                if (targetSquare && !targetSquare.querySelector(".piece")) {
                    validMoves++;
                }
            }
        }
    }

    return validMoves;
}
