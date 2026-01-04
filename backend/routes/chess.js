const express = require('express');
const router = express.Router();

const pieces = {
    white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
    black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
};

function getPieceColor(piece) {
    if (Object.values(pieces.white).includes(piece)) return 'white';
    if (Object.values(pieces.black).includes(piece)) return 'black';
    return null;
}

function isOnBoard(r, c) {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
}

// --- Validation Helpers ---

function isPawnMoveValid(from, to, piece, board) {
    const color = getPieceColor(piece);
    const direction = color === 'white' ? -1 : 1;
    const startRow = color === 'white' ? 6 : 1;
    const targetPiece = board[to.row][to.col];

    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;

    if (colDiff === 0) {
        // Forward 1
        if (rowDiff === direction) return targetPiece === '';
        // Forward 2
        if (rowDiff === direction * 2) {
            if (from.row !== startRow) return false;
            const skippedRow = from.row + direction;
            return targetPiece === '' && board[skippedRow][from.col] === '';
        }
        return false;
    }
    // Diagonal Capture
    if (Math.abs(colDiff) === 1 && rowDiff === direction) {
        return targetPiece !== '' && getPieceColor(targetPiece) !== color;
    }
    return false;
}

function isSlidingMoveValid(from, to, piece, board) {
    const rowDiff = to.row - from.row;
    const colDiff = to.col - from.col;

    // Determine type (Straight vs Diagonal)
    const isStraight = (rowDiff === 0 || colDiff === 0);
    const isDiagonal = (Math.abs(rowDiff) === Math.abs(colDiff));

    if (['♖', '♜'].includes(piece) && !isStraight) return false;
    if (['♗', '♝'].includes(piece) && !isDiagonal) return false;
    if (['♕', '♛'].includes(piece) && !isStraight && !isDiagonal) return false;

    // Check Path
    const stepR = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);
    const stepC = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);

    let r = from.row + stepR;
    let c = from.col + stepC;

    while (r !== to.row || c !== to.col) {
        if (board[r][c] !== '') return false;
        r += stepR;
        c += stepC;
    }
    return true;
}

function isKnightMoveValid(from, to) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

function isKingMoveValid(from, to) {
    const rowDiff = Math.abs(to.row - from.row);
    const colDiff = Math.abs(to.col - from.col);
    return (rowDiff <= 1 && colDiff <= 1) && (rowDiff + colDiff > 0);
}

// Unified Geometric Validation (Pre-King Safety)
function isGeometricMoveValid(from, to, piece, board) {
    if (!isOnBoard(from.row, from.col) || !isOnBoard(to.row, to.col)) return false;

    // Check own-piece capture
    const target = board[to.row][to.col];
    if (target && getPieceColor(target) === getPieceColor(piece)) return false;

    if (['♙', '♟'].includes(piece)) return isPawnMoveValid(from, to, piece, board);
    if (['♖', '♜', '♗', '♝', '♕', '♛'].includes(piece)) return isSlidingMoveValid(from, to, piece, board);
    if (['♘', '♞'].includes(piece)) return isKnightMoveValid(from, to);
    if (['♔', '♚'].includes(piece)) return isKingMoveValid(from, to);
    return false;
}

// --- King Safety Helpers ---

function findKing(board, color) {
    const kingPiece = color === 'white' ? pieces.white.king : pieces.black.king;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (board[r][c] === kingPiece) return { row: r, col: c };
        }
    }
    return null;
}

function isKingInCheck(board, kingColor) {
    const kingPos = findKing(board, kingColor);
    if (!kingPos) return false;

    // Check if any opponent piece can move to King's square
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;
            if (getPieceColor(piece) === kingColor) continue; // Skip own pieces

            if (isGeometricMoveValid({ row: r, col: c }, kingPos, piece, board)) {
                return true;
            }
        }
    }
    return false;
}

// --- AI & Minimax Logic ---

function getAllLegalMoves(board, color) {
    const legalMoves = [];
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (!piece) continue;
            if (getPieceColor(piece) !== color) continue;

            const from = { row: r, col: c };

            // Optimization: Limit target squares based on piece type?
            // For simplicity, we check all 64 squares for validity (Geometry + King Safety)
            // This is slow but robust for Phase 1.
            for (let tr = 0; tr < 8; tr++) {
                for (let tc = 0; tc < 8; tc++) {
                    const to = { row: tr, col: tc };

                    if (isGeometricMoveValid(from, to, piece, board)) {
                        // Simulate
                        const simulatedBoard = board.map(row => row.slice());
                        simulatedBoard[to.row][to.col] = piece;
                        simulatedBoard[from.row][from.col] = '';

                        if (!isKingInCheck(simulatedBoard, color)) {
                            legalMoves.push({ from, to });
                        }
                    }
                }
            }
        }
    }
    return legalMoves;
}

const pieceValues = {
    '♙': 10, '♘': 30, '♗': 30, '♖': 50, '♕': 90, '♔': 900,
    '♟': -10, '♞': -30, '♝': -30, '♜': -50, '♛': -90, '♚': -900
};

function evaluateBoard(board) {
    let score = 0;
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) score += (pieceValues[piece] || 0);
        }
    }
    return score;
}

function minimax(board, depth, isMaximizing, turnColor) {
    if (depth === 0) return evaluateBoard(board);

    const moves = getAllLegalMoves(board, turnColor);

    // Checkmate / Stalemate Checks in recursion
    if (moves.length === 0) {
        if (isKingInCheck(board, turnColor)) {
            return isMaximizing ? -10000 : 10000; // Checkmate (Loss for current turn player)
            // Wait: value perspective depends on who is maximizing.
            // If it's White's turn (Maximizing) and they have no moves + check -> Black wins (-10000)
        }
        return 0; // Stalemate
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            const nextBoard = board.map(r => r.slice());
            nextBoard[move.to.row][move.to.col] = nextBoard[move.from.row][move.from.col];
            nextBoard[move.from.row][move.from.col] = '';

            const score = minimax(nextBoard, depth - 1, false, 'black');
            maxEval = Math.max(maxEval, score);
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            const nextBoard = board.map(r => r.slice());
            nextBoard[move.to.row][move.to.col] = nextBoard[move.from.row][move.from.col];
            nextBoard[move.from.row][move.from.col] = '';

            const score = minimax(nextBoard, depth - 1, true, 'white');
            minEval = Math.min(minEval, score);
        }
        return minEval;
    }
}

// --- Main Endpoints ---

router.post('/validate-move', (req, res) => {
    try {
        const { board, from, to, turn } = req.body;

        if (!board || !from || !to || !turn) {
            return res.status(400).json({ valid: false, reason: "Missing required fields" });
        }

        const piece = board[from.row][from.col];
        if (!piece) return res.json({ valid: false, reason: "No piece at starting position" });
        if (getPieceColor(piece) !== turn) return res.json({ valid: false, reason: "Not your turn" });

        // 1. Geometric Check
        if (!isGeometricMoveValid(from, to, piece, board)) {
            return res.json({ valid: false, reason: "Illegal move geometry" });
        }

        // 2. King Safety Check (Simulate)
        const newBoard = board.map(r => r.slice());
        newBoard[to.row][to.col] = piece;
        newBoard[from.row][from.col] = '';

        if (isKingInCheck(newBoard, turn)) {
            return res.json({ valid: false, reason: "King would be in check" });
        }

        // 3. Move Validated - Check Game Over for Opponent
        const nextTurn = turn === 'white' ? 'black' : 'white';
        let gameOver = false;
        let result = null;
        let winner = null;

        const legalMoves = getAllLegalMoves(newBoard, nextTurn);
        const canMove = legalMoves.length > 0;
        const isCheck = isKingInCheck(newBoard, nextTurn);

        if (isCheck && !canMove) {
            gameOver = true;
            result = 'checkmate';
            winner = turn;
        } else if (!isCheck && !canMove) {
            gameOver = true;
            result = 'stalemate';
            winner = null;
        }

        res.json({
            valid: true,
            board: newBoard,
            nextTurn: nextTurn,
            gameOver: gameOver,
            result: result,
            winner: winner
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ valid: false, reason: "Server Error" });
    }
});

router.post('/ai-move', (req, res) => {
    try {
        const { board, color, depth } = req.body;
        const searchDepth = depth || 2;

        const legalMoves = getAllLegalMoves(board, color);
        if (legalMoves.length === 0) {
            return res.json({ move: null, reason: "No legal moves" });
        }

        let bestMove = null;
        let bestValue = color === 'white' ? -Infinity : Infinity;
        const isMaximizing = color === 'white';

        for (const move of legalMoves) {
            const nextBoard = board.map(r => r.slice());
            nextBoard[move.to.row][move.to.col] = nextBoard[move.from.row][move.from.col];
            nextBoard[move.from.row][move.from.col] = '';

            const score = minimax(nextBoard, searchDepth - 1, !isMaximizing, color === 'white' ? 'black' : 'white');

            if (isMaximizing) {
                if (score > bestValue) {
                    bestValue = score;
                    bestMove = move;
                }
            } else {
                if (score < bestValue) {
                    bestValue = score;
                    bestMove = move;
                }
            }
        }

        if (!bestMove) {
            // Should not happen if legalMoves > 0, fallback to random
            bestMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        }

        // Apply
        const finalBoard = board.map(r => r.slice());
        finalBoard[bestMove.to.row][bestMove.to.col] = finalBoard[bestMove.from.row][bestMove.from.col];
        finalBoard[bestMove.from.row][bestMove.from.col] = '';

        res.json({
            from: bestMove.from,
            to: bestMove.to,
            board: finalBoard
        });

    } catch (e) {
        console.error("AI Error:", e);
        res.status(500).json({ error: "AI Calculation Failed" });
    }
});

module.exports = router;
