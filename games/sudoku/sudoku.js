// =====================
// Sudoku - Game Logic
// =====================

// Game State
let gameState = {
    difficulty: 'easy',
    currentGrid: [],
    solutionGrid: [],
    originalGrid: []
};

// Sample Sudoku puzzles (Easy difficulty)
const easyPuzzle = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
];

const easySolution = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

const mediumPuzzle = [
    [0, 0, 0, 6, 0, 0, 4, 0, 0],
    [7, 0, 0, 0, 0, 3, 6, 0, 0],
    [0, 0, 0, 0, 9, 1, 0, 8, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 0, 1, 8, 0, 0, 0, 3],
    [0, 0, 0, 3, 0, 6, 0, 4, 5],
    [0, 4, 0, 2, 0, 0, 0, 6, 0],
    [9, 0, 3, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 1, 0, 0]
];

const mediumSolution = [
    [5, 8, 1, 6, 7, 2, 4, 3, 9],
    [7, 9, 2, 8, 4, 3, 6, 5, 1],
    [3, 6, 4, 5, 9, 1, 7, 8, 2],
    [4, 3, 8, 9, 5, 7, 2, 1, 6],
    [2, 5, 6, 1, 8, 4, 9, 7, 3],
    [1, 7, 9, 3, 2, 6, 8, 4, 5],
    [8, 4, 5, 2, 1, 9, 3, 6, 7],
    [9, 1, 3, 7, 6, 8, 5, 2, 4],
    [6, 2, 7, 4, 3, 5, 1, 9, 8]
];

const hardPuzzle = [
    [0, 0, 0, 0, 0, 0, 0, 1, 2],
    [0, 0, 0, 0, 3, 5, 0, 0, 0],
    [0, 0, 0, 6, 0, 0, 0, 7, 0],
    [7, 0, 0, 0, 0, 0, 3, 0, 0],
    [0, 0, 0, 4, 0, 0, 8, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 0, 0, 0, 0],
    [0, 8, 0, 0, 0, 0, 0, 4, 0],
    [0, 5, 0, 0, 0, 0, 6, 0, 0]
];

const hardSolution = [
    [6, 7, 3, 8, 9, 4, 5, 1, 2],
    [9, 1, 2, 7, 3, 5, 4, 8, 6],
    [8, 4, 5, 6, 1, 2, 9, 7, 3],
    [7, 9, 8, 2, 6, 1, 3, 5, 4],
    [5, 2, 6, 4, 7, 3, 8, 9, 1],
    [1, 3, 4, 5, 8, 9, 2, 6, 7],
    [4, 6, 9, 1, 2, 8, 7, 3, 5],
    [2, 8, 7, 3, 5, 6, 1, 4, 9],
    [3, 5, 1, 9, 4, 7, 6, 2, 8]
];

// Puzzle sets
const puzzles = {
    easy: { puzzle: easyPuzzle, solution: easySolution },
    medium: { puzzle: mediumPuzzle, solution: mediumSolution },
    hard: { puzzle: hardPuzzle, solution: hardSolution }
};

// DOM Elements
let sudokuGrid;
let checkBtn;
let resetBtn;
let exitBtn;
let gameInfo;
let difficultyButtons;

// =====================
// Initialize Game
// =====================

document.addEventListener('DOMContentLoaded', function () {
    // Get DOM elements
    sudokuGrid = document.getElementById('sudokuGrid');
    checkBtn = document.getElementById('checkBtn');
    resetBtn = document.getElementById('resetBtn');
    exitBtn = document.getElementById('exitBtn');
    gameInfo = document.querySelector('.info-message');
    difficultyButtons = document.querySelectorAll('.difficulty-btn');

    // Add event listeners
    difficultyButtons.forEach(function (btn) {
        btn.addEventListener('click', handleDifficultyChange);
    });

    checkBtn.addEventListener('click', checkSolution);
    resetBtn.addEventListener('click', resetGrid);

    exitBtn.addEventListener('click', function () {
        window.location.href = '../index.html';
    });

    // Initialize game
    loadPuzzle('easy');
});

// =====================
// Handle Difficulty Change
// =====================

function handleDifficultyChange(e) {
    const difficulty = e.target.getAttribute('data-difficulty');

    // Update button states
    difficultyButtons.forEach(function (btn) {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');

    // Load new puzzle
    loadPuzzle(difficulty);
}

// =====================
// Load Puzzle
// =====================

function loadPuzzle(difficulty) {
    gameState.difficulty = difficulty;

    // Get puzzle and solution
    const puzzleData = puzzles[difficulty];
    gameState.currentGrid = puzzleData.puzzle.map(function (row) {
        return row.slice();
    });
    gameState.solutionGrid = puzzleData.solution.map(function (row) {
        return row.slice();
    });
    gameState.originalGrid = puzzleData.puzzle.map(function (row) {
        return row.slice();
    });

    // Render grid
    renderGrid();

    // Reset info message
    gameInfo.textContent = 'Fill in the empty cells with numbers 1-9';
    gameInfo.classList.remove('success', 'error');
}

// =====================
// Render Grid
// =====================

function renderGrid() {
    sudokuGrid.innerHTML = '';

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.classList.add('sudoku-cell');

            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.setAttribute('data-row', row);
            input.setAttribute('data-col', col);

            const value = gameState.currentGrid[row][col];

            if (value !== 0) {
                input.value = value;
                input.disabled = true;
                cell.classList.add('prefilled');
            } else {
                input.addEventListener('input', handleInput);
                input.addEventListener('keydown', handleKeydown);
            }

            cell.appendChild(input);
            sudokuGrid.appendChild(cell);
        }
    }
}

// =====================
// Handle Input
// =====================

function handleInput(e) {
    const input = e.target;
    const value = input.value;

    // Only allow numbers 1-9
    if (value && (value < '1' || value > '9')) {
        input.value = '';
        return;
    }

    // Update grid
    const row = parseInt(input.getAttribute('data-row'));
    const col = parseInt(input.getAttribute('data-col'));
    gameState.currentGrid[row][col] = value ? parseInt(value) : 0;

    // Clear any previous validation styles
    input.parentElement.classList.remove('error', 'correct');
}

// =====================
// Handle Keydown
// =====================

function handleKeydown(e) {
    const input = e.target;
    const row = parseInt(input.getAttribute('data-row'));
    const col = parseInt(input.getAttribute('data-col'));

    // Arrow key navigation
    let newRow = row;
    let newCol = col;

    if (e.key === 'ArrowUp' && row > 0) newRow--;
    else if (e.key === 'ArrowDown' && row < 8) newRow++;
    else if (e.key === 'ArrowLeft' && col > 0) newCol--;
    else if (e.key === 'ArrowRight' && col < 8) newCol++;
    else return;

    e.preventDefault();
    const nextInput = document.querySelector('[data-row="' + newRow + '"][data-col="' + newCol + '"]');
    if (nextInput && !nextInput.disabled) {
        nextInput.focus();
    }
}

// =====================
// Check Solution
// =====================

function checkSolution() {
    let isValid = true;
    let errorCount = 0;

    // Clear previous styles
    const cells = document.querySelectorAll('.sudoku-cell');
    cells.forEach(function (cell) {
        cell.classList.remove('error', 'correct');
    });

    // Check each cell
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const currentValue = gameState.currentGrid[row][col];
            const solutionValue = gameState.solutionGrid[row][col];

            if (currentValue === 0) {
                isValid = false;
                continue;
            }

            const cell = document.querySelector('[data-row="' + row + '"][data-col="' + col + '"]').parentElement;

            if (currentValue !== solutionValue) {
                cell.classList.add('error');
                isValid = false;
                errorCount++;
            } else if (gameState.originalGrid[row][col] === 0) {
                cell.classList.add('correct');
            }
        }
    }

    // Update info message
    if (isValid && errorCount === 0) {
        gameInfo.textContent = '🎉 Congratulations! You solved the puzzle!';
        gameInfo.classList.add('success');
        gameInfo.classList.remove('error');
    } else if (errorCount > 0) {
        gameInfo.textContent = 'Some cells are incorrect. Try again!';
        gameInfo.classList.add('error');
        gameInfo.classList.remove('success');
    } else {
        gameInfo.textContent = 'Keep going! Fill in all cells to check your solution.';
        gameInfo.classList.remove('success', 'error');
    }
}

// =====================
// Reset Grid
// =====================

function resetGrid() {
    loadPuzzle(gameState.difficulty);
}

// =====================
// Console Messages
// =====================

console.log('%cSudoku Loaded! 🔢', 'font-size: 20px; font-weight: bold; color: #ffffff;');
console.log('%cTrain your brain with number puzzles', 'font-size: 14px; color: #888888;');