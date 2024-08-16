import "./modules/DragDropTouch.js";

const board = document.getElementById("board");
const winning = document.querySelector("h2");

const redTakenContainer = document.getElementById("red-taken");
const blackTakenContainer = document.getElementById("black-taken");

const undo_img = document.getElementById("undo");
const redo_img = document.getElementById("redo");

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

function updateTakenPieces(takenPiece) {
    const takenContainer = takenPiece.classList.contains("red")
        ? redTakenContainer
        : blackTakenContainer;
    const takenPieceDisplay = document.createElement("div");
    takenPieceDisplay.classList.add("piece", takenPiece.classList[1]);
    if (takenPiece.classList.contains("king")) {
        takenPieceDisplay.classList.add("king");
    }
    takenContainer.appendChild(takenPieceDisplay);
}

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
    const pieces = document.querySelectorAll(".piece");
    const squares = document.querySelectorAll(".square");

    pieces.forEach(piece => {
        piece.addEventListener("dragstart", event => {
            const { row, col } = event.target.parentNode.dataset;
            event.dataTransfer.setData("text/plain", `${row},${col}`);
            event.dataTransfer.effectAllowed = "move";
            selectPiece(event.target);
        });
    });

    squares.forEach(square => {
        square.addEventListener("dragover", event => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
        });

        square.addEventListener("drop", event => {
            event.preventDefault();
            const [pieceRow, pieceCol] = event.dataTransfer.getData("text/plain").split(",").map(Number);
            const piece = getSquare(pieceRow, pieceCol).querySelector(".piece");
            movePiece(piece, event.currentTarget);
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

function resetSelected() {
        if (selectedPiece) {
            selectedPiece.classList.remove("selected");

            // Remove highlight from all squares
            clearHighlights();
        }
}

function selectPiece(piece) {
    if (
        (selectedPiece && selectedPiece == piece) ||
        !piece ||
        !piece.classList.contains(currentPlayer)
    ) {
        return;
    }

    resetSelected();

    selectedPiece = piece;

    highlight(selectedPiece);
    selectedPiece.classList.add("selected");
}

let history = [];
let redoStack = [];

function undo() {
    if (history.length === 0) return;
    resetSelected();
    selectedPiece = null;

    const lastMove = history.pop();
    redoStack.push(lastMove);

    const { piece, fromSquare, toSquare, capturedPiece, capturedPieceOriginalRow, capturedPieceOriginalCol, wasKing } = lastMove;

    // Move piece back to its original position
    fromSquare.appendChild(piece);

    // Restore captured piece if any
    if (capturedPiece) {
        // Remove the captured piece from the taken container
        const capturedContainer = capturedPiece.classList.contains("red") ? redTakenContainer : blackTakenContainer;
        capturedContainer.querySelector(`.${capturedPiece.classList[1]}`)?.remove();

        // Restore the captured piece to its original position
        const capturedSquare = getSquare(capturedPieceOriginalRow, capturedPieceOriginalCol);
        if (capturedSquare) {
            capturedSquare.appendChild(capturedPiece);
        }
    }

    // Revert king status if applicable
    if (wasKing && piece.classList.contains("king")) {
        piece.classList.remove("king");
    }

    // Clear target square
    toSquare.querySelector(".piece")?.remove();

    switchPlayer();
}

function redo() {
    if (redoStack.length === 0) return;
    resetSelected()
    selectedPiece = null;

    const lastUndone = redoStack.pop();
    history.push(lastUndone);

    const { piece, fromSquare, toSquare, capturedPiece, wasKing } = lastUndone;

    // Move piece back to its redone position
    toSquare.appendChild(piece);

    // Remove captured piece if any
    if (capturedPiece) {
        capturedPiece.remove();
    }

    // Reapply king status if applicable
    if (wasKing && !piece.classList.contains("king")) {
        piece.classList.add("king");
    }

    // Clear from square
    fromSquare.querySelector(".piece")?.remove();

    switchPlayer();
}

function movePiece(piece, targetSquare) {
    if (!piece || !piece.classList.contains(currentPlayer)) {
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

        const fromSquare = piece.parentNode;
        const captured = removeCapturedPiece(pieceRow, pieceCol, targetRow, targetCol);

        const wasKing = piece.classList.contains("king");
        targetSquare.appendChild(piece);

        // Save move to history for undo
        history.push({ 
            piece, 
            fromSquare, 
            toSquare: targetSquare, 
            capturedPiece: captured?.piece, 
            capturedPieceOriginalRow: captured?.originalRow, 
            capturedPieceOriginalCol: captured?.originalCol,
            wasKing 
        });
        redoStack = []; // Clear redo stack since new move invalidates it

        checkKing(piece, targetRow);
        if (
            captured?.piece &&
            canJumpAgain(piece, targetRow, targetCol) &&
            !checkWin()
        ) {
            highlight(piece);
            selectedPiece = piece;
            selectedPiece.classList.add("selected");
        } else {
            const winner = checkWin();

            if (!winner) {
                switchPlayer();
            } else {
                jsConfetti.addConfetti();
                changeTurn(true, winner);
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
            updateTakenPieces(middlePiece);
            middleSquare.removeChild(middlePiece);
            return { piece: middlePiece, originalRow: middleRow, originalCol: middleCol };
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

redo_img.addEventListener("click", redo)
undo_img.addEventListener("click", undo)
