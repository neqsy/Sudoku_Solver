// routes/api.js
'use strict';

const SudokuSolver = require('../controllers/sudoku-solver.js');

module.exports = function (app) {

  let solver = new SudokuSolver();

  app.route('/api/check')
    .post((req, res) => {
      const { puzzle, coordinate, value } = req.body;

      console.log('\n--- Request /api/check ---'); // Log separator
      console.log('Received Body:', req.body); // Log the raw body

      // 1. Check for missing fields
      if (!puzzle || !coordinate || !value) {
        console.log('Error: Missing required field(s)');
        return res.json({ error: 'Required field(s) missing' });
      }

       // 3. Validate coordinate format BEFORE puzzle validation (as per test order)
       // Use case-insensitive flag 'i' just in case
      if (!/^[A-I][1-9]$/i.test(coordinate)) {
          console.log(`Error: Invalid coordinate: ${coordinate}`);
          return res.json({ error: 'Invalid coordinate'});
      }

      // 4. Validate value (1-9) BEFORE puzzle validation
      if (!/^[1-9]$/.test(value)) {
          console.log(`Error: Invalid value: ${value}`);
          return res.json({ error: 'Invalid value' });
      }

      // 2. Validate puzzle string (length, characters) using solver's validate
      // Important: Do this AFTER coordinate/value validation for correct error reporting order
      const validationResult = solver.validate(puzzle);
      if (validationResult.error) {
          console.log(`Error: Puzzle validation failed: ${validationResult.error}`);
          // Map specific errors expected by tests for /check endpoint
          if (validationResult.error === 'Expected puzzle to be 81 characters long') {
              return res.json({ error: 'Expected puzzle to be 81 characters long' });
          }
          if (validationResult.error === 'Invalid characters in puzzle') {
              return res.json({ error: 'Invalid characters in puzzle' });
          }
          // It seems tests for /check don't expect 'Required field missing' from validate(),
          // but handle it just in case.
          if (validationResult.error === 'Required field missing') {
              return res.json({ error: 'Required field(s) missing' });
          }
          // Fallback for any other unexpected validation error
          return res.json({ error: validationResult.error });
      }


      // --- If validation passes, proceed ---
      console.log('Input validation passed.');

      const rowLetter = coordinate.charAt(0).toUpperCase(); // Ensure uppercase for consistency
      const colNumber = coordinate.charAt(1);
      const numValue = value.toString(); // Ensure value is a string for checks

      // === DODANY BLOK DLA WYMAGANIA 9 ===
      try {
          const grid = solver.stringToGrid(puzzle); // Get grid
          const rowIndex = solver._rowToIndex(rowLetter); // Get 0-8 index for row
          const colIndex = solver._colToIndex(colNumber); // Get 0-8 index for col

          // Check if coordinate is valid within the grid structure
          if (grid[rowIndex] !== undefined && grid[rowIndex][colIndex] !== undefined) {
              // If the submitted value is the same as the value already in the cell
              if (grid[rowIndex][colIndex] === numValue) {
                  console.log('Requirement 9 check: Value is already placed at coordinate. Returning valid: true.');
                  return res.json({ valid: true }); // Return immediately
              }
          } else {
               // This case should ideally not happen if coordinate validation passed,
               // but good to log if it does.
               console.error(`Error: Calculated indices [${rowIndex}, ${colIndex}] are out of grid bounds for coordinate ${coordinate}.`);
               // Consider returning an error or letting subsequent checks handle it
          }
      } catch (e) {
          console.error("Error during Requirement 9 check or grid conversion:", e);
          // Handle potential errors from _rowToIndex, _colToIndex, or stringToGrid
          // Depending on the error, you might return a server error or a specific puzzle error
          // For now, let's allow it to potentially proceed to standard checks or fail there.
      }
      // === KONIEC DODANEGO BLOKU ===


      // --- Normal placement checks (only run if Requirement 9 didn't return early) ---
      console.log(`Checking placement: Row=${rowLetter}, Col=${colNumber}, Value=${numValue}`);

      const conflicts = []; // Start with empty array
      const isRowValid = solver.checkRowPlacement(puzzle, rowLetter, colNumber, numValue);
      const isColValid = solver.checkColPlacement(puzzle, rowLetter, colNumber, numValue);
      const isRegionValid = solver.checkRegionPlacement(puzzle, rowLetter, colNumber, numValue);

      console.log(`Check Results -> Row Valid: ${isRowValid}, Col Valid: ${isColValid}, Region Valid: ${isRegionValid}`);

      if (!isRowValid) {
          conflicts.push("row");
          console.log('Added conflict: row');
      }
      if (!isColValid) {
          conflicts.push("column");
          console.log('Added conflict: column');
      }
      if (!isRegionValid) {
          conflicts.push("region");
          console.log('Added conflict: region');
      }

      // Return the result of normal checks
      if (conflicts.length === 0) {
          console.log('Final Result (normal check): { valid: true }');
          res.json({ valid: true });
      } else {
          console.log(`Final Result (normal check): { valid: false, conflict: ${JSON.stringify(conflicts)} }`);
          res.json({ valid: false, conflict: conflicts }); // Send the array
      }
    });

  app.route('/api/solve')
    .post((req, res) => {
       // ... (kod dla /api/solve bez zmian) ...
       const { puzzle } = req.body;

       // Validate puzzle first
       const validationResult = solver.validate(puzzle);
       if (validationResult.error) {
           // Map specific errors for /solve endpoint
           if (validationResult.error === 'Required field missing') {
               return res.json({ error: 'Required field missing' });
           }
           if (validationResult.error === 'Expected puzzle to be 81 characters long') {
               return res.json({ error: 'Expected puzzle to be 81 characters long' });
           }
           if (validationResult.error === 'Invalid characters in puzzle') {
               return res.json({ error: 'Invalid characters in puzzle' });
           }
           // Fallback
           return res.json({ error: validationResult.error });
       }

       // Attempt to solve
       const solution = solver.solve(puzzle);

       // Check if the original puzzle was invalid according to solver rules
       if (solution === false && solver.solve(puzzle) === false) { // Check if solve itself detected invalid puzzle
           // Although validate passes basic format, solve checks placement rules
           // Check if the original puzzle was inherently invalid (needed for specific test)
            let initialPuzzleInvalid = false;
            const grid = solver.stringToGrid(puzzle);
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (grid[r][c] !== '.') {
                        const val = grid[r][c];
                        grid[r][c] = '.'; // Temporarily remove to check
                        if (!solver.isValidPlacement(grid, r, c, val)) {
                           initialPuzzleInvalid = true;
                           break; // Found initial conflict
                        }
                         grid[r][c] = val; // Put back
                    }
                }
                if (initialPuzzleInvalid) break;
            }
             // If the puzzle couldn't be solved AND the initial state was invalid
             // This condition might need refinement based on exact test expectations
            if (initialPuzzleInvalid) {
                 console.log("Solve Error: Initial puzzle state has conflicts.");
                 // This error message might need adjustment depending on the specific FCC test case failing
                 // Sometimes it expects 'Puzzle cannot be solved' even for invalid initial states.
                 // Let's stick to the standard one for now.
                 return res.json({ error: 'Puzzle cannot be solved' });
            }
       }


       // If solving failed (but puzzle wasn't necessarily invalid initially)
       if (!solution) {
           console.log("Solve Error: Puzzle cannot be solved (no solution found).");
           return res.json({ error: 'Puzzle cannot be solved' });
       }
       // If solving succeeded
       else {
           console.log("Solve Success:", solution);
           return res.json({ solution: solution });
       }
    });
};