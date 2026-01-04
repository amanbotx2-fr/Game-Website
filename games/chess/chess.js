// =====================
// Chess Game - Core Logic & AI
// =====================

const API_BASE_URL = "https://gamehub-backend-cze5.onrender.com";

// Game State
let gameState = {
    mode: null, // 'ai' or 'friend'
    difficulty: 'medium', // 'easy', 'medium', 'hard'
    currentTurn: 'white', // 'white' or 'black'
    selectedSquare: null,
    board: [],
    capturedByWhite: [],
    capturedByBlack: [],
    isGameOver: false,
    validMoves: [] // Cache for valid moves of selected piece
};

// Chess piece unicode symbols
const pieces = {
    white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
};

// Initial board setup
const initialBoard = [
    ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
    ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
    ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
];

// =====================
// Initialize Game
// =====================

document.addEventListener('DOMContentLoaded', function () {
    initializeModeSelection();
    initializeGameControls();
});

// =====================
// Mode Selection
// =====================

function initializeModeSelection() {
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    difficultyButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            difficultyButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            gameState.difficulty = this.getAttribute('data-difficulty');
        });
    });

    document.querySelector('.difficulty-btn[data-difficulty="medium"]').classList.add('active');

    const startButtons = document.querySelectorAll('.start-button');
    startButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            const mode = this.getAttribute('data-mode');
            startGame(mode);
        });
    });
}

function startGame(mode) {
    gameState.mode = mode;
    const modeLabel = document.getElementById('gameModeLabel');
    if (mode === 'ai') {
        modeLabel.textContent = `Playing vs AI (${gameState.difficulty.charAt(0).toUpperCase() + gameState.difficulty.slice(1)})`;
    } else {
        modeLabel.textContent = 'Playing with Friend (Local)';
    }

    document.getElementById('modeSelection').classList.add('hidden');
    document.getElementById('gameSection').classList.remove('hidden');

    initializeBoard();
    resetGameState();
    updateTurnIndicator();
}

function resetGameState() {
    gameState.currentTurn = 'white';
    gameState.selectedSquare = null;
    gameState.capturedByWhite = [];
    gameState.capturedByBlack = [];
    gameState.isGameOver = false;
    gameState.validMoves = [];
    gameState.board = initialBoard.map(row => row.slice());
    renderBoard();
}

// =====================
// Core Board Logic
// =====================

function initializeBoard() {
    const chessboard = document.getElementById('chessboard');
    chessboard.innerHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            if ((row + col) % 2 === 0) square.classList.add('light');
            else square.classList.add('dark');

            square.setAttribute('data-row', row);
            square.setAttribute('data-col', col);
            square.addEventListener('click', () => handleSquareClick(row, col));
            chessboard.appendChild(square);
        }
    }
}

function renderBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            updateSquare(row, col);
        }
    }
}

function updateSquare(row, col) {
    const square = getSquareElement(row, col);
    const piece = gameState.board[row][col];
    square.innerHTML = '';
    square.classList.remove('selected', 'valid-move', 'capture', 'check');

    if (piece) {
        const pieceElement = document.createElement('span');
        pieceElement.classList.add('piece');
        pieceElement.textContent = piece;
        square.appendChild(pieceElement);

        // Highlight King in Check
        if (isKing(piece) && isKingInCheck(piece)) {
            square.classList.add('check');
        }
    }
}

function handleSquareClick(row, col) {
    if (gameState.isGameOver) return;
    if (gameState.mode === 'ai' && gameState.currentTurn === 'black') return;

    const piece = gameState.board[row][col];
    const isOwnPiece = piece && isCurrentPlayerPiece(piece);

    // Select new piece
    if (isOwnPiece) {
        selectSquare(row, col);
        return;
    }

    // Move to valid square
    if (gameState.selectedSquare) {
        const move = gameState.validMoves.find(m => m.r === row && m.c === col);
        if (move) {
            executeMove(gameState.selectedSquare.row, gameState.selectedSquare.col, row, col);
        } else {
            deselectSquare();
        }
    }
}

function selectSquare(row, col) {
    // Deselect previous
    if (gameState.selectedSquare) {
        const prevSquare = getSquareElement(gameState.selectedSquare.row, gameState.selectedSquare.col);
        prevSquare.classList.remove('selected');
        clearValidMoveIndicators();
    }

    gameState.selectedSquare = { row, col };
    const square = getSquareElement(row, col);
    square.classList.add('selected');

    // Calculate and show valid moves
    const piece = gameState.board[row][col];
    gameState.validMoves = getValidMoves({ row, col }, piece, gameState.board);
    showValidMoves();
}

function deselectSquare() {
    if (gameState.selectedSquare) {
        const square = getSquareElement(gameState.selectedSquare.row, gameState.selectedSquare.col);
        square.classList.remove('selected');
        clearValidMoveIndicators();
    }
    gameState.selectedSquare = null;
    gameState.validMoves = [];
}

function showValidMoves() {
    gameState.validMoves.forEach(move => {
        const square = getSquareElement(move.r, move.c);
        square.classList.add('valid-move');
        if (gameState.board[move.r][move.c]) {
            square.classList.add('capture');
        }
    });
}

function clearValidMoveIndicators() {
    document.querySelectorAll('.square.valid-move').forEach(el => {
        el.classList.remove('valid-move', 'capture');
    });
}

// =====================
// Move Execution & Loop
// =====================

async function executeMove(fromRow, fromCol, toRow, toCol) {
    // 1. Prepare Backend Payload
    const payload = {
        board: gameState.board,
        from: { row: fromRow, col: fromCol },
        to: { row: toRow, col: toCol },
        turn: gameState.currentTurn
    };

    let useBackend = true;
    let backendData = null;

    try {
        const response = await fetch(`${API_BASE_URL}/chess/validate-move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Network error');
        backendData = await response.json();
    } catch (e) {
        console.warn('Offline mode: ', e);
        useBackend = false;
    }

    // 2. Handle Backend Result
    if (useBackend && backendData) {
        if (!backendData.valid) {
            alert(`Invalid Move: ${backendData.reason}`);
            return; // Block move
        }

        // Capture logic for UI (Backend doesn't return captured lists yet)
        const captured = gameState.board[toRow][toCol];
        if (captured) {
            if (gameState.currentTurn === 'white') gameState.capturedByWhite.push(captured);
            else gameState.capturedByBlack.push(captured);
            updateCapturedPieces();
        }

        // Apply Authoritative State
        gameState.board = backendData.board;
        gameState.currentTurn = backendData.nextTurn;

        // Update UI
        deselectSquare();
        renderBoard();
        checkGameOverConditions();

        // Trigger AI if needed
        if (gameState.mode === 'ai' && gameState.currentTurn === 'black' && !gameState.isGameOver) {
            setTimeout(makeAIMove, 600);
        }
        return;
    }

    // 3. Fallback: Local Logic (Original Code)
    // FUTURE: validate move via backend API (Fallback active)
    const piece = gameState.board[fromRow][fromCol];
    const captured = gameState.board[toRow][toCol];

    // Update internal board
    gameState.board[toRow][toCol] = piece;
    gameState.board[fromRow][fromCol] = '';

    // Handle captures
    if (captured) {
        if (gameState.currentTurn === 'white') gameState.capturedByWhite.push(captured);
        else gameState.capturedByBlack.push(captured);
        updateCapturedPieces();
    }

    // UI Update
    deselectSquare();
    renderBoard();

    // Check game logic
    checkGameOverConditions(); // Extracted for reuse

    // Switch Turn
    switchTurn();

    // Trigger AI
    if (gameState.mode === 'ai' && gameState.currentTurn === 'black' && !gameState.isGameOver) {
        setTimeout(makeAIMove, 600);
    }
}

function checkGameOverConditions() {
    const opponentColor = gameState.currentTurn === 'white' ? 'black' : 'white';
    if (isCheckmate(opponentColor)) {
        endGame(`${gameState.currentTurn.charAt(0).toUpperCase() + gameState.currentTurn.slice(1)} Wins by Checkmate!`);
        return true;
    }

    if (isStalemate(opponentColor)) {
        endGame("Draw by Stalemate!");
        return true;
    }
    return false;
}

function switchTurn() {
    gameState.currentTurn = gameState.currentTurn === 'white' ? 'black' : 'white';
    updateTurnIndicator();
}

// =====================
// Logic: Move Validation
// =====================

function getValidMoves(pos, piece, board) {
    let moves = [];
    const color = getPieceColor(piece);

    // 1. Generate pseudo-valid moves based on geometry
    if (['♙', '♟'].includes(piece)) moves = getPawnMoves(pos, color, board);
    else if (['♖', '♜'].includes(piece)) moves = getRookMoves(pos, color, board);
    else if (['♗', '♝'].includes(piece)) moves = getBishopMoves(pos, color, board);
    else if (['♕', '♛'].includes(piece)) moves = getQueenMoves(pos, color, board);
    else if (['♘', '♞'].includes(piece)) moves = getKnightMoves(pos, color, board);
    else if (['♔', '♚'].includes(piece)) moves = getKingMoves(pos, color, board);

    // 2. Filter out moves that leave King in check
    return moves.filter(m => !doesMoveExposeKing(pos, m, color, board));
}

function getPawnMoves(pos, color, board) {
    const moves = [];
    const piece = board[pos.row][pos.col];

    // Potential moves to check: Forward 1, Forward 2, Capture Left, Capture Right
    const direction = color === 'white' ? -1 : 1;

    // Candidates
    const candidates = [
        { r: pos.row + direction, c: pos.col },           // Forward 1
        { r: pos.row + direction * 2, c: pos.col },       // Forward 2
        { r: pos.row + direction, c: pos.col - 1 },       // Capture Left
        { r: pos.row + direction, c: pos.col + 1 }        // Capture Right
    ];

    candidates.forEach(target => {
        if (isPawnMoveValid(pos.row, pos.col, target.r, target.c, piece, board)) {
            moves.push(target);
        }
    });

    return moves;
}

function isPawnMoveValid(fromRow, fromCol, toRow, toCol, piece, board) {
    if (!isOnBoard(toRow, toCol)) return false;

    const color = getPieceColor(piece);
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    const targetPiece = board[toRow][toCol];

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // Direction check
    if (color === 'white' && rowDiff > 0) return false; // Cannot move backward
    if (color === 'black' && rowDiff < 0) return false;

    // Forward Move (No Capture)
    if (colDiff === 0) {
        // Forward 1
        if (rowDiff === direction) {
            return targetPiece === '';
        }
        // Forward 2
        if (rowDiff === direction * 2) {
            if (fromRow !== startRow) return false;
            // Path must be clear (check skipped square)
            const skippedRow = fromRow + direction;
            return targetPiece === '' && board[skippedRow][fromCol] === '';
        }
        return false;
    }

    // Diagonal Capture
    if (Math.abs(colDiff) === 1 && rowDiff === direction) {
        // Must capture opponent
        if (targetPiece !== '' && getPieceColor(targetPiece) !== color) {
            return true;
        }
        return false;
    }

    return false;
}

// ... (getPawnMoves and isPawnMoveValid are above)

function getRookMoves(pos, color, board) {
    const moves = [];
    const piece = board[pos.row][pos.col];

    // Horizontal and Vertical candidates
    for (let i = 0; i < 8; i++) {
        if (i !== pos.col) moves.push({ r: pos.row, c: i }); // Horizontal
        if (i !== pos.row) moves.push({ r: i, c: pos.col }); // Vertical
    }

    return moves.filter(m => isRookMoveValid(pos.row, pos.col, m.r, m.c, piece, board));
}

function isRookMoveValid(fromRow, fromCol, toRow, toCol, piece, board) {
    if (!isOnBoard(toRow, toCol)) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // Must be straight line
    if (rowDiff !== 0 && colDiff !== 0) return false;

    // Path Checking
    const stepR = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);
    const stepC = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);

    let r = fromRow + stepR;
    let c = fromCol + stepC;

    while (r !== toRow || c !== toCol) {
        if (board[r][c] !== '') return false; // Path blocked
        r += stepR;
        c += stepC;
    }

    // Target Check
    const target = board[toRow][toCol];
    if (target !== '') {
        // Can capture opponent
        return getPieceColor(target) !== getPieceColor(piece);
    }

    return true;
}

function getBishopMoves(pos, color, board) {
    const moves = [];
    const piece = board[pos.row][pos.col];
    const directions = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

    // Generate all diagonal candidates
    directions.forEach(dir => {
        let r = pos.row + dir[0];
        let c = pos.col + dir[1];
        while (isOnBoard(r, c)) {
            moves.push({ r, c });
            r += dir[0];
            c += dir[1];
        }
    });

    return moves.filter(m => isBishopMoveValid(pos.row, pos.col, m.r, m.c, piece, board));
}

function isBishopMoveValid(fromRow, fromCol, toRow, toCol, piece, board) {
    if (!isOnBoard(toRow, toCol)) return false;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    // Must be diagonal
    if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;

    // Path Checking
    const stepR = rowDiff > 0 ? 1 : -1;
    const stepC = colDiff > 0 ? 1 : -1;

    let r = fromRow + stepR;
    let c = fromCol + stepC;

    while (r !== toRow || c !== toCol) {
        if (board[r][c] !== '') return false; // Path blocked
        r += stepR;
        c += stepC;
    }

    // Target Check
    const target = board[toRow][toCol];
    if (target !== '') {
        // Can capture opponent
        return getPieceColor(target) !== getPieceColor(piece);
    }

    return true;
}

function getQueenMoves(pos, color, board) {
    const moves = [];
    const piece = board[pos.row][pos.col];

    // Combine Rook (Straight) and Bishop (Diagonal) candidates
    const directions = [
        [0, 1], [0, -1], [1, 0], [-1, 0],   // Straights
        [1, 1], [1, -1], [-1, 1], [-1, -1]  // Diagonals
    ];

    directions.forEach(dir => {
        let r = pos.row + dir[0];
        let c = pos.col + dir[1];
        while (isOnBoard(r, c)) {
            moves.push({ r, c });
            r += dir[0];
            c += dir[1];
        }
    });

    return moves.filter(m => isQueenMoveValid(pos.row, pos.col, m.r, m.c, piece, board));
}

function isQueenMoveValid(fromRow, fromCol, toRow, toCol, piece, board) {
    // Queen is Rook OR Bishop
    return isRookMoveValid(fromRow, fromCol, toRow, toCol, piece, board) ||
        isBishopMoveValid(fromRow, fromCol, toRow, toCol, piece, board);
}

function getSlidingMoves(pos, dirs, color, board) {
    const moves = [];
    dirs.forEach(d => {
        let r = pos.row + d[0];
        let c = pos.col + d[1];
        while (isOnBoard(r, c)) {
            const target = board[r][c];
            if (!target) {
                moves.push({ r, c });
            } else {
                if (getPieceColor(target) !== color) moves.push({ r, c });
                break;
            }
            r += d[0];
            c += d[1];
        }
    });
    return moves;
}

function getKnightMoves(pos, color, board) {
    const moves = [];
    const jumps = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
    const piece = board[pos.row][pos.col];

    jumps.forEach(j => {
        const r = pos.row + j[0];
        const c = pos.col + j[1];
        if (isKnightMoveValid(pos.row, pos.col, r, c, piece, board)) {
            moves.push({ r, c });
        }
    });
    return moves;
}

function isKnightMoveValid(fromRow, fromCol, toRow, toCol, piece, board) {
    if (!isOnBoard(toRow, toCol)) return false;

    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    // L-Shape Check
    if (!((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2))) {
        return false;
    }

    // Target Check
    const target = board[toRow][toCol];
    if (target !== '') {
        // Can capture opponent
        return getPieceColor(target) !== getPieceColor(piece);
    }

    return true;
}

function getKingMoves(pos, color, board) {
    const moves = [];
    const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    const piece = board[pos.row][pos.col];

    dirs.forEach(d => {
        const r = pos.row + d[0];
        const c = pos.col + d[1];
        if (isKingMoveValid(pos.row, pos.col, r, c, piece, board)) {
            moves.push({ r, c });
        }
    });
    return moves;
}

function isKingMoveValid(fromRow, fromCol, toRow, toCol, piece, board) {
    if (!isOnBoard(toRow, toCol)) return false;

    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);

    // Range Check (Max 1 step)
    if (rowDiff > 1 || colDiff > 1) return false;

    // Must move
    if (rowDiff === 0 && colDiff === 0) return false;

    // Target Check
    const target = board[toRow][toCol];
    if (target !== '') {
        // Can capture opponent
        return getPieceColor(target) !== getPieceColor(piece);
    }

    return true;
}

function doesMoveExposeKing(from, to, color, board) {
    // Simulate move
    const tempBoard = board.map(r => r.slice());
    tempBoard[to.r][to.c] = tempBoard[from.row][from.col];
    tempBoard[from.row][from.col] = '';

    return isKingInCheckRaw(color, tempBoard);
}

function isKingInCheck(kingPiece) {
    const color = getPieceColor(kingPiece);
    return isKingInCheckRaw(color, gameState.board);
}

function isKingInCheckRaw(color, board) {
    // Find King
    let kingPos = null;
    let kingSymbol = color === 'white' ? pieces.white.king : pieces.black.king;

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === kingSymbol) {
                kingPos = { r, c };
                break;
            }
        }
    }

    if (!kingPos) return false;

    // Check if any opponent piece attacks King
    const opponentColor = color === 'white' ? 'black' : 'white';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && getPieceColor(p) === opponentColor) {
                // Check if this piece can legally capture the King
                // Note: We use the specific validation functions directly
                // to avoid recursion loops and ensure strict rules.

                let canAttack = false;
                if (['♙', '♟'].includes(p)) {
                    canAttack = isPawnMoveValid(r, c, kingPos.r, kingPos.c, p, board);
                } else if (['♖', '♜'].includes(p)) {
                    canAttack = isRookMoveValid(r, c, kingPos.r, kingPos.c, p, board);
                } else if (['♘', '♞'].includes(p)) {
                    canAttack = isKnightMoveValid(r, c, kingPos.r, kingPos.c, p, board);
                } else if (['♗', '♝'].includes(p)) {
                    canAttack = isBishopMoveValid(r, c, kingPos.r, kingPos.c, p, board);
                } else if (['♕', '♛'].includes(p)) {
                    canAttack = isQueenMoveValid(r, c, kingPos.r, kingPos.c, p, board);
                } else if (['♔', '♚'].includes(p)) {
                    canAttack = isKingMoveValid(r, c, kingPos.r, kingPos.c, p, board);
                }

                if (canAttack) return true;
            }
        }
    }
    return false;
}

function isCheckmate(color) {
    if (!isKingInCheckRaw(color, gameState.board)) return false;
    return !hasLegalMoves(color);
}

function isStalemate(color) {
    if (isKingInCheckRaw(color, gameState.board)) return false;
    return !hasLegalMoves(color);
}

function hasLegalMoves(color) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = gameState.board[r][c];
            if (p && getPieceColor(p) === color) {
                if (getValidMoves({ row: r, col: c }, p, gameState.board).length > 0) return true;
            }
        }
    }
    return false;
}

// =====================
// AI Logic
// =====================

// =====================
// AI Logic
// =====================

function makeAIMove() {
    const aiColor = 'black';
    const allMoves = getAllLegalMoves(gameState.board, aiColor);

    if (allMoves.length === 0) return; // Should be handled by game over check

    // 1. Identify Check Moves
    const checkMoves = allMoves.filter(move => {
        // Simulate move
        const tempBoard = gameState.board.map(r => r.slice());
        tempBoard[move.to.r][move.to.c] = tempBoard[move.from.r][move.from.c];
        tempBoard[move.from.r][move.from.c] = '';

        // Check if opponent (White) is in check
        return isKingInCheckRaw('white', tempBoard);
    });

    // 2. Identify Capture Moves
    const captureMoves = allMoves.filter(m => gameState.board[m.to.r][m.to.c] !== '');

    let selectedMove = null;

    if (checkMoves.length > 0) {
        // Prioritize Check
        selectedMove = checkMoves[Math.floor(Math.random() * checkMoves.length)];
    } else if (captureMoves.length > 0) {
        // Then Capture
        selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
    } else {
        // Fallback to random move
        selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    // Execute
    executeMove(selectedMove.from.r, selectedMove.from.c, selectedMove.to.r, selectedMove.to.c);
}

function getAllLegalMoves(board, color) {
    const moves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && getPieceColor(p) === color) {
                const validMoves = getValidMoves({ row: r, col: c }, p, board);
                validMoves.forEach(m => {
                    moves.push({ from: { r, c }, to: m });
                });
            }
        }
    }
    return moves;
}

// =====================
// Helpers & Utilities
// =====================

function getSquareElement(row, col) {
    return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
}

function getPieceColor(piece) {
    if (Object.values(pieces.white).includes(piece)) return 'white';
    if (Object.values(pieces.black).includes(piece)) return 'black';
    return null;
}

function isCurrentPlayerPiece(piece) {
    return getPieceColor(piece) === gameState.currentTurn;
}

function isOnBoard(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function isKing(piece) {
    return piece === pieces.white.king || piece === pieces.black.king;
}

function endGame(message) {
    gameState.isGameOver = true;
    const turnText = document.querySelector('#turnIndicator .turn-text');
    turnText.textContent = message;
    turnText.style.color = '#ff6b6b';
}

function updateTurnIndicator() {
    const turnText = document.querySelector('#turnIndicator .turn-text');
    const colorName = gameState.currentTurn.charAt(0).toUpperCase() + gameState.currentTurn.slice(1);

    if (isKingInCheckRaw(gameState.currentTurn, gameState.board)) {
        turnText.textContent = `${colorName}'s Turn (CHECK!)`;
        turnText.style.color = '#ff4444';
    } else {
        turnText.textContent = `${colorName}'s Turn`;
        turnText.style.color = '#ffffff';
    }
}

function updateCapturedPieces() {
    const wContainer = document.getElementById('capturedWhite');
    const bContainer = document.getElementById('capturedBlack');
    wContainer.innerHTML = gameState.capturedByWhite.map(p => `<span class="captured-piece">${p}</span>`).join('');
    bContainer.innerHTML = gameState.capturedByBlack.map(p => `<span class="captured-piece">${p}</span>`).join('');
}

function initializeGameControls() {
    document.getElementById('restartButton').addEventListener('click', () => {
        resetGameState();
        renderBoard();
        gameState.currentTurn = 'white';
        updateTurnIndicator();
        gameState.isGameOver = false;

        // Re-enable/reset UI
        const turnText = document.querySelector('#turnIndicator .turn-text');
        turnText.style.color = '#ffffff';
    });

    document.getElementById('exitButton').addEventListener('click', exitToModeSelection);
}

function exitToModeSelection() {
    document.getElementById('gameSection').classList.add('hidden');
    document.getElementById('modeSelection').classList.remove('hidden');
    gameState.mode = null;
    gameState.isGameOver = false;
    gameState.selectedSquare = null;

    // Clear board state visually if desired, though resetGameState does it on start
}
