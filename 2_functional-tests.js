const chai = require("chai");
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server'); // Your server file

const { puzzlesAndSolutions } = require('../controllers/puzzle-strings.js'); // Import test data

chai.use(chaiHttp);

// Define test puzzle strings directly or use imported ones
const validPuzzle = puzzlesAndSolutions[0][0];
const solution = puzzlesAndSolutions[0][1];
const invalidCharPuzzle = '1.5..2.84..63.12.7.2..5..X..9..1....8.2.3674.3.7.2..9.47...8..1..16....926914.37.';
const invalidLengthPuzzle = '1.5..2.84..63.12.7.2..5..';
const unsolvablePuzzle = '115..2.84..63.12.7.2..5.....9..1....8.2.3674.3.7.2..9.47...8..1..16....926914.37.';


suite('Functional Tests', () => {

    suite('POST /api/solve', () => {
        // #1
        test('Solve a puzzle with valid puzzle string', (done) => {
            chai.request(server)
                .post('/api/solve')
                .send({ puzzle: validPuzzle })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'solution');
                    assert.equal(res.body.solution, solution);
                    done();
                });
        });

        // #2
        test('Solve a puzzle with missing puzzle string', (done) => {
            chai.request(server)
                .post('/api/solve')
                .send({}) // Send empty object
                .end((err, res) => {
                    assert.equal(res.status, 200); // API returns 200 even for errors as JSON
                    assert.isObject(res.body);
                    assert.property(res.body, 'error');
                    assert.equal(res.body.error, 'Required field missing');
                    done();
                });
        });

        // #3
        test('Solve a puzzle with invalid characters', (done) => {
            chai.request(server)
                .post('/api/solve')
                .send({ puzzle: invalidCharPuzzle })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'error');
                    assert.equal(res.body.error, 'Invalid characters in puzzle');
                    done();
                });
        });

        // #4
        test('Solve a puzzle with incorrect length', (done) => {
             chai.request(server)
                .post('/api/solve')
                .send({ puzzle: invalidLengthPuzzle })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'error');
                    assert.equal(res.body.error, 'Expected puzzle to be 81 characters long');
                    done();
                });
        });

        // #5
        test('Solve a puzzle that cannot be solved', (done) => {
            chai.request(server)
                .post('/api/solve')
                .send({ puzzle: unsolvablePuzzle })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'error');
                    assert.equal(res.body.error, 'Puzzle cannot be solved');
                    done();
                });
        });
    });

    suite('POST /api/check', () => {
        // #6
        test('Check a puzzle placement with all fields', (done) => {
            chai.request(server)
                .post('/api/check')
                .send({ puzzle: validPuzzle, coordinate: 'A2', value: '3' })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'valid');
                    assert.isTrue(res.body.valid);
                    done();
                });
        });

        // #7
        test('Check a puzzle placement with single placement conflict', (done) => {
             // Value 5 conflicts with row A (A3 already has 5)
            chai.request(server)
                .post('/api/check')
                .send({ puzzle: validPuzzle, coordinate: 'A2', value: '4' })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'valid');
                    assert.isFalse(res.body.valid);
                    assert.property(res.body, 'conflict');
                    assert.isArray(res.body.conflict);
                    assert.deepStrictEqual(res.body.conflict, ['row']);
                    done();
                });
        });

        // #8
        test('Check a puzzle placement with multiple placement conflicts', (done) => {
            // Value 1 conflicts with row A (A1) and region 1 (A1)
            chai.request(server)
                .post('/api/check')
                .send({ puzzle: validPuzzle, coordinate: 'A2', value: '1' })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'valid');
                    assert.isFalse(res.body.valid);
                    assert.property(res.body, 'conflict');
                    assert.isArray(res.body.conflict);
                    assert.includeMembers(res.body.conflict, ['row', 'region']); // Order doesn't matter
                    assert.lengthOf(res.body.conflict, 2);
                    done();
                });
        });

        // #9
        test('Check a puzzle placement with all placement conflicts', (done) => {
             // Value 2 conflicts with row C (C9), col 2 (I2), and region 1 (C2)
             const validPuzzle = puzzlesAndSolutions[0][0];
            chai.request(server)
                .post('/api/check')
                .send({ puzzle: validPuzzle, coordinate: 'A1', value: '2' })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'valid');
                    assert.isFalse(res.body.valid);
                    assert.property(res.body, 'conflict');
                    assert.isArray(res.body.conflict);
                    assert.deepEqual(res.body.conflict, ['row', 'column', 'region']);
                    // Sprawdź, czy długość tablicy to 3
                    assert.lengthOf(res.body.conflict, 3);
                    done();
                });
        });

        // #10
        test('Check a puzzle placement with missing required fields', (done) => {
             chai.request(server)
                .post('/api/check')
                .send({ puzzle: validPuzzle, value: '3' }) // Missing coordinate
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'error');
                    assert.equal(res.body.error, 'Required field(s) missing');
                    done();
                });
        });

        // #11
        test('Check a puzzle placement with invalid characters', (done) => {
            chai.request(server)
                .post('/api/check')
                .send({ puzzle: invalidCharPuzzle, coordinate: 'A2', value: '3' })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'error');
                    assert.equal(res.body.error, 'Invalid characters in puzzle');
                    done();
                });
        });

        // #12
        test('Check a puzzle placement with incorrect length', (done) => {
            chai.request(server)
                .post('/api/check')
                .send({ puzzle: invalidLengthPuzzle, coordinate: 'A2', value: '3' })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'error');
                    assert.equal(res.body.error, 'Expected puzzle to be 81 characters long');
                    done();
                });
        });

        // #13
        test('Check a puzzle placement with invalid placement coordinate', (done) => {
            chai.request(server)
                .post('/api/check')
                .send({ puzzle: validPuzzle, coordinate: 'Z10', value: '3' })
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'error');
                    assert.equal(res.body.error, 'Invalid coordinate');
                    done();
                });
        });

        // #14
        test('Check a puzzle placement with invalid placement value', (done) => {
            chai.request(server)
                .post('/api/check')
                .send({ puzzle: validPuzzle, coordinate: 'A2', value: '10' }) // Invalid value
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isObject(res.body);
                    assert.property(res.body, 'error');
                    assert.equal(res.body.error, 'Invalid value');
                    done();
                });
        });

    });

});