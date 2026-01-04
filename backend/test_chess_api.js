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

async function testMove(desc, payload) {
    try {
        const res = await fetch('http://localhost:3000/chess/validate-move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log(`${data.valid ? '✅' : '❌'} ${desc}: ${data.valid ? 'Valid' : data.reason}`);
    } catch (e) {
        console.error(`⚠️ Error testing ${desc}:`, e.message);
    }
}

async function runTests() {
    // 1. Valid Pawn Move
    await testMove('White Pawn Forward 1', {
        board: initialBoard,
        from: { row: 6, col: 4 }, // White Pawn at E2
        to: { row: 5, col: 4 },   // To E3
        turn: 'white'
    });

    // 2. Invalid Pawn Move (Backward)
    await testMove('White Pawn Backward (Should Fail)', {
        board: initialBoard,
        from: { row: 6, col: 4 },
        to: { row: 7, col: 4 },
        turn: 'white'
    });

    // 3. Valid Knight Move
    await testMove('White Knight Jump', {
        board: initialBoard,
        from: { row: 7, col: 1 }, // White Knight at B1
        to: { row: 5, col: 2 },   // To C3
        turn: 'white'
    });

    // 4. Invalid Turn
    await testMove('Black Move on White Turn (Should Fail)', {
        board: initialBoard,
        from: { row: 1, col: 0 },
        to: { row: 2, col: 0 },
        turn: 'white' // Should be black
    });
}

runTests();
