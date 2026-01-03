// =====================
// Chess Game - Core Logic & AI
// =====================

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

function executeMove(fromRow, fromCol, toRow, toCol) {
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
    const opponentColor = gameState.currentTurn === 'white' ? 'black' : 'white';
    if (isCheckmate(opponentColor)) {
        endGame(`${gameState.currentTurn.charAt(0).toUpperCase() + gameState.currentTurn.slice(1)} Wins by Checkmate!`);
        return;
    }

    if (isStalemate(opponentColor)) {
        endGame("Draw by Stalemate!");
        return;
    }

    // Switch Turn
    switchTurn();

    // Trigger AI
    if (gameState.mode === 'ai' && gameState.currentTurn === 'black' && !gameState.isGameOver) {
        setTimeout(makeAIMove, 600);
    }
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
    else if (['♖', '♜'].includes(piece)) moves = getSlidingMoves(pos, [[0, 1], [0, -1], [1, 0], [-1, 0]], color, board);
    else if (['♗', '♝'].includes(piece)) moves = getSlidingMoves(pos, [[1, 1], [1, -1], [-1, 1], [-1, -1]], color, board);
    else if (['♕', '♛'].includes(piece)) moves = getSlidingMoves(pos, [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]], color, board);
    else if (['♘', '♞'].includes(piece)) moves = getKnightMoves(pos, color, board);
    else if (['♔', '♚'].includes(piece)) moves = getKingMoves(pos, color, board);

    // 2. Filter out moves that leave King in check
    return moves.filter(m => !doesMoveExposeKing(pos, m, color, board));
}

function getPawnMoves(pos, color, board) {
    const moves = [];
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;

    // Move forward 1
    if (!board[pos.row + direction][pos.col]) {
        moves.push({ r: pos.row + direction, c: pos.col });
        // Move forward 2
        if (pos.row === startRow && !board[pos.row + direction * 2][pos.col]) {
            moves.push({ r: pos.row + direction * 2, c: pos.col });
        }
    }

    // Capture diagonals
    [[direction, -1], [direction, 1]].forEach(offset => {
        const r = pos.row + offset[0];
        const c = pos.col + offset[1];
        if (isOnBoard(r, c)) {
            const target = board[r][c];
            if (target && getPieceColor(target) !== color) {
                moves.push({ r, c });
            }
        }
    });

    return moves;
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
    jumps.forEach(j => {
        const r = pos.row + j[0];
        const c = pos.col + j[1];
        if (isOnBoard(r, c)) {
            const target = board[r][c];
            if (!target || getPieceColor(target) !== color) {
                moves.push({ r, c });
            }
        }
    });
    return moves;
}

function getKingMoves(pos, color, board) {
    const moves = [];
    const dirs = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
    dirs.forEach(d => {
        const r = pos.row + d[0];
        const c = pos.col + d[1];
        if (isOnBoard(r, c)) {
            const target = board[r][c];
            if (!target || getPieceColor(target) !== color) {
                moves.push({ r, c });
            }
        }
    });
    return moves;
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

    if (!kingPos) return false; // Should not happen

    // Check if any opponent piece attacks King
    const opponentColor = color === 'white' ? 'black' : 'white';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = board[r][c];
            if (p && getPieceColor(p) === opponentColor) {
                // Get strictly attacking moves (simplified)
                // We re-use getValidMoves but disable recursion check to prevent infinite loop
                // Or simply check primitive attack patterns
                if (canPieceAttack(p, { row: r, col: c }, kingPos, board)) return true;
            }
        }
    }
    return false;
}

// Simplified attack check for 'isKingInCheck' to avoid infinite recursion
function canPieceAttack(piece, from, to, board) {
    const color = getPieceColor(piece);
    if (['♙', '♟'].includes(piece)) {
        const dir = color === 'white' ? -1 : 1;
        return (from.row + dir === to.r) && (Math.abs(from.col - to.c) === 1);
    } else if (['♘', '♞'].includes(piece)) {
        const dr = Math.abs(from.row - to.r);
        const dc = Math.abs(from.col - to.c);
        return (dr === 2 && dc === 1) || (dr === 1 && dc === 2);
    } else if (['♚', '♔'].includes(piece)) {
        return Math.abs(from.row - to.r) <= 1 && Math.abs(from.col - to.c) <= 1;
    } else {
        // Sliders
        const dr = to.r - from.row;
        const dc = to.c - from.col;
        const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
        const stepC = dc === 0 ? 0 : dc / Math.abs(dc);

        // Valid direction check
        if (['♖', '♜'].includes(piece) && (dr !== 0 && dc !== 0)) return false;
        if (['♗', '♝'].includes(piece) && Math.abs(dr) !== Math.abs(dc)) return false;
        if (['♕', '♛'].includes(piece) && (dr !== 0 && dc !== 0) && Math.abs(dr) !== Math.abs(dc)) return false;

        let r = from.row + stepR;
        let c = from.col + stepC;
        while (r !== to.r || c !== to.c) {
            if (board[r][c] !== '') return false; // Blocked
            r += stepR;
            c += stepC;
        }
        return true;
    }
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

function makeAIMove() {
    const aiColor = 'black';
    let allMoves = [];

    // 1. Gather all legal moves
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const p = gameState.board[r][c];
            if (p && getPieceColor(p) === aiColor) {
                const moves = getValidMoves({ row: r, col: c }, p, gameState.board);
                moves.forEach(m => allMoves.push({ from: { r, c }, to: m }));
            }
        }
    }

    if (allMoves.length === 0) return; // Should be handled by game over check

    let selectedMove = null;

    // 2. Select move based on difficulty
    if (gameState.difficulty === 'easy') {
        selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    } else {
        // Medium/Hard: Prioritize captures
        const captureMoves = allMoves.filter(m => gameState.board[m.to.r][m.to.c] !== '');

        if (captureMoves.length > 0) {
            // Pick random capture
            if (gameState.difficulty === 'medium' && Math.random() > 0.3) {
                selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
            } else {
                // Hard: Pick best capture (simplified by piece value?? Not strictly required but nice)
                // For now, just pick a capture
                selectedMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
            }
        }

        if (!selectedMove) {
            selectedMove = allMoves[Math.floor(Math.random() * allMoves.length)];
        }
    }

    // 3. Execute
    executeMove(selectedMove.from.r, selectedMove.from.c, selectedMove.to.r, selectedMove.to.c);
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
