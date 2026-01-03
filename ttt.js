// =====================
// Tic Tac Toe - Game Logic
// =====================

// Game State
let gameState = {
    board: ['', '', '', '', '', '', '', '', ''],
    currentPlayer: 'X',
    isGameActive: true,
    scores: { X: 0, O: 0, draws: 0 }
};

// Winning combinations
const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

// DOM Elements
let cells;
let gameStatus;
let restartBtn;
let exitBtn;
let playerXIndicator;
let playerOIndicator;

// =====================
// Initialize Game
// =====================

document.addEventListener('DOMContentLoaded', function () {
    // Get DOM elements
    cells = document.querySelectorAll('.cell');
    gameStatus = document.getElementById('gameStatus');
    restartBtn = document.getElementById('restartBtn');
    exitBtn = document.getElementById('exitBtn');
    playerXIndicator = document.getElementById('playerX');
    playerOIndicator = document.getElementById('playerO');

    // Add event listeners
    cells.forEach(function (cell) {
        cell.addEventListener('click', handleCellClick);
    });

    restartBtn.addEventListener('click', restartGame);

    exitBtn.addEventListener('click', function () {
        window.location.href = '../index.html';
    });

    updateDisplay();
});

// =====================
// Handle Cell Click
// =====================

function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    // Check if game is active and cell is empty
    if (!gameState.isGameActive || gameState.board[index] !== '') {
        return;
    }

    // Make move
    makeMove(index, cell);
}

// =====================
// Make Move
// =====================

function makeMove(index, cell) {
    // Update game state
    gameState.board[index] = gameState.currentPlayer;

    // Update cell display
    cell.textContent = gameState.currentPlayer;
    cell.classList.add('taken');

    // Add animation
    cell.style.animation = 'none';
    setTimeout(function () {
        cell.style.animation = 'pulse 0.3s ease-in-out';
    }, 10);

    // Check for win or draw
    checkResult();
}

// =====================
// Check Result
// =====================

function checkResult() {
    let roundWon = false;
    let winningCombination = null;

    // Check all winning conditions
    for (let i = 0; i < winningConditions.length; i++) {
        const condition = winningConditions[i];
        const a = gameState.board[condition[0]];
        const b = gameState.board[condition[1]];
        const c = gameState.board[condition[2]];

        if (a === '' || b === '' || c === '') {
            continue;
        }

        if (a === b && b === c) {
            roundWon = true;
            winningCombination = condition;
            break;
        }
    }

    if (roundWon) {
        handleWin(winningCombination);
        return;
    }

    // Check for draw
    const isDraw = !gameState.board.includes('');
    if (isDraw) {
        handleDraw();
        return;
    }

    // Continue game - switch player
    switchPlayer();
}

// =====================
// Handle Win
// =====================

function handleWin(combination) {
    gameState.isGameActive = false;
    gameStatus.textContent = 'Player ' + gameState.currentPlayer + ' Wins!';
    gameStatus.classList.add('winner');

    // Highlight winning cells
    combination.forEach(function (index) {
        cells[index].classList.add('winning');
    });

    // Update scores
    gameState.scores[gameState.currentPlayer]++;
}

// =====================
// Handle Draw
// =====================

function handleDraw() {
    gameState.isGameActive = false;
    gameStatus.textContent = "It's a Draw!";
    gameStatus.classList.add('draw');
    gameState.scores.draws++;
}

// =====================
// Switch Player
// =====================

function switchPlayer() {
    gameState.currentPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X';
    updateDisplay();
}

// =====================
// Update Display
// =====================

function updateDisplay() {
    if (gameState.isGameActive) {
        gameStatus.textContent = 'Player ' + gameState.currentPlayer + "'s Turn";
        gameStatus.classList.remove('winner', 'draw');
    }

    // Update player indicators
    if (gameState.currentPlayer === 'X') {
        playerXIndicator.classList.add('active');
        playerOIndicator.classList.remove('active');
    } else {
        playerXIndicator.classList.remove('active');
        playerOIndicator.classList.add('active');
    }
}

// =====================
// Restart Game
// =====================

function restartGame() {
    // Reset game state
    gameState.board = ['', '', '', '', '', '', '', '', ''];
    gameState.currentPlayer = 'X';
    gameState.isGameActive = true;

    // Reset cells
    cells.forEach(function (cell) {
        cell.textContent = '';
        cell.classList.remove('taken', 'winning');
        cell.style.animation = 'none';
    });

    // Reset display
    updateDisplay();
}

// =====================
// Console Messages
// =====================

console.log('%cTic Tac Toe Loaded! ⭕❌', 'font-size: 20px; font-weight: bold; color: #ffffff;');
console.log('%cLocal multiplayer mode active', 'font-size: 14px; color: #888888;');