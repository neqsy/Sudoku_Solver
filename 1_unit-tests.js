const chai = require('chai');
const assert = chai.assert;

const Solver = require('../controllers/sudoku-solver.js');
const { puzzlesAndSolutions } = require('../controllers/puzzle-strings.js'); // Import test data
let solver;

// Define valid and invalid puzzle strings for tests
const validPuzzle = '1.5..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9.47...8..1..16....926914.37.';
const invalidCharPuzzle = '1.5..2.84..63.12.7.2..5..X..9..1....8.2.3674.3.7.2..9.47...8..1..16....926914.37.';
const invalidLengthPuzzle = '1.5..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9.47...8..1..16....9269.37.';
const unsolvablePuzzle = '115..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9.47...8..1..16....926914.37.'; // Duplicate 1 in first row


suite('Unit Tests', () => {
    solver = new Solver();

    // #1
    test('Logic handles a valid puzzle string of 81 characters', (done) => {
        assert.deepStrictEqual(solver.validate(validPuzzle), { valid: true });
        done();
    });

    // #2
    test('Logic handles a puzzle string with invalid characters (not 1-9 or .)', (done) => {
        assert.deepStrictEqual(solver.validate(invalidCharPuzzle), { error: 'Invalid characters in puzzle' });
        done();
    });

    // #3
    test('Logic handles a puzzle string that is not 81 characters in length', (done) => {
        assert.deepStrictEqual(solver.validate(invalidLengthPuzzle), { error: 'Expected puzzle to be 81 characters long' });
        done();
    });

    // #4
    test('Logic handles a valid row placement', (done) => {
        // Placing '3' in the second cell (A2) of the first row should be valid
        assert.isTrue(solver.checkRowPlacement(validPuzzle, 'A', '2', '3'));
        done();
    });

    // #5
    test('Logic handles an invalid row placement', (done) => {
        // Placing '5' in the second cell (A2) of the first row is invalid (5 exists at A3)
        assert.isFalse(solver.checkRowPlacement(validPuzzle, 'A', '2', '5'));
        done();
    });

    // #6
    test('Logic handles a valid column placement', (done) => {
         // Placing '7' in the second cell (B1) of the first column should be valid
        assert.isTrue(solver.checkColPlacement(validPuzzle, 'B', '1', '7'));
        done();
    });

    // #7
    test('Logic handles an invalid column placement', (done) => {
        // Placing '1' in the second cell (B1) of the first column is invalid (1 exists at A1)
        assert.isFalse(solver.checkColPlacement(validPuzzle, 'B', '1', '1'));
        done();
    });

    // #8
    test('Logic handles a valid region (3x3 grid) placement', (done) => {
        // Placing '9' in the second cell (A2) of the first region should be valid
        assert.isTrue(solver.checkRegionPlacement(validPuzzle, 'A', '2', '9'));
        done();
    });

    // #9
    test('Logic handles an invalid region (3x3 grid) placement', (done) => {
        // Placing '1' in the second cell (A2) of the first region is invalid (1 exists at A1)
        assert.isFalse(solver.checkRegionPlacement(validPuzzle, 'A', '2', '1'));
        done();
    });

    // #10
    test('Valid puzzle strings pass the solver', (done) => {
        const solution = puzzlesAndSolutions[0][1];
        assert.strictEqual(solver.solve(validPuzzle), solution);
        done();
    });

    // #11
    test('Invalid puzzle strings fail the solver', (done) => {
        assert.isFalse(solver.solve(unsolvablePuzzle));
        done();
    });

    // #12
    test('Solver returns the expected solution for an incomplete puzzle', (done) => {
        const puzzle = puzzlesAndSolutions[1][0];
        const solution = puzzlesAndSolutions[1][1];
        assert.strictEqual(solver.solve(puzzle), solution);
        done();
    });

});