class SudokuSolver {

  // --- Validation ---
  validate(puzzleString) {
    if (!puzzleString) {
        return { error: 'Required field missing' };
    }
    if (puzzleString.length !== 81) {
      return { error: 'Expected puzzle to be 81 characters long' };
    }
    if (/[^1-9.]/g.test(puzzleString)) {
      return { error: 'Invalid characters in puzzle' };
    }
    return { valid: true }; // Return object for consistency
  }

  // --- Placement Checks ---

  // Helper to convert row letter ('A'-'I') to 0-8 index
  _rowToIndex(rowLetter) {
    // Powinno konwertować 'A'->0, 'B'->1, ..., 'I'->8
    const index = rowLetter.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0);
    console.log(`_rowToIndex('${rowLetter}') -> ${index}`); // DEBUG
    return index;
}

_colToIndex(colNumber) {
    // Powinno konwertować '1'->0, '2'->1, ..., '9'->8
    const index = parseInt(colNumber, 10) - 1;
    console.log(`_colToIndex('${colNumber}') -> ${index}`); // DEBUG
    return index;
}

  // controllers/sudoku-solver.js (Poprawione metody check*)

  checkRowPlacement(puzzleString, row, column, value) {
    console.log("checkRowPlacement received puzzleString:", puzzleString.substring(0, 10) + "...");
    const rowIndex = this._rowToIndex(row);
    const colIndex = this._colToIndex(column); // Kolumna docelowa
    const grid = this.stringToGrid(puzzleString); // Zawsze twórz świeżą siatkę
    const numValue = value.toString();

    // console.log(`--- checkRowPlacement(R${rowIndex}C${colIndex}, Val${numValue}) ---`);
    for (let c = 0; c < 9; c++) {
        if (c !== colIndex) { // Sprawdzaj tylko inne kolumny
            // console.log(`   Checking R${rowIndex}C${c}: '${grid[rowIndex][c]}' === '${numValue}'?`);
            if (grid[rowIndex][c] === numValue) {
                // console.log(`   Conflict found.`);
                return false; // Konflikt w innej komórce
            }
        }
    }
    // console.log(`   No row conflict.`);
    return true; // Brak konfliktu w innych komórkach
}

checkColPlacement(puzzleString, row, column, value) {
  console.log("checkColPlacement received puzzleString:", puzzleString.substring(0, 10) + "...");
  const rowIndex = this._rowToIndex(row);
  const colIndex = this._colToIndex(column);
  const grid = this.stringToGrid(puzzleString);
  const numValue = value.toString();

  console.log(`--- checkColPlacement Grid Check ---`);
  console.log(`Target: [${rowIndex}, ${colIndex}], Value: ${numValue}`);
  for (let r = 0; r < 9; r++) {
      const cellValue = grid[r][colIndex];
      const matchesValue = (cellValue === numValue);
      console.log(`Row ${r}: Cell[${r},${colIndex}]='${cellValue}'. MatchesValue=${matchesValue}.`);
      if (matchesValue) {
          console.log(`   !!! CONFLICT DETECTED at Row ${r} !!!`);
          return false;
      }
  }
  console.log(`   --- NO CONFLICT DETECTED in checkColPlacement ---`);
  return true;
}

checkRegionPlacement(puzzleString, row, column, value) {
  // ... (logowanie, pobieranie indeksów, grid, value, startRow/Col) ...
  console.log("checkRegionPlacement received puzzleString:", puzzleString.substring(0, 10) + "...");
  const rowIndex = this._rowToIndex(row);
  const colIndex = this._colToIndex(column);
  const grid = this.stringToGrid(puzzleString); // Upewnij się, że grid jest poprawny!
  const numValue = value.toString();
  const startRow = Math.floor(rowIndex / 3) * 3;
  const startCol = Math.floor(colIndex / 3) * 3;

  console.log(`--- checkRegionPlacement Grid Check ---`);
  console.log(`Target: [${rowIndex}, ${colIndex}], Value: ${numValue}, Region: [${startRow}-${startRow+2}, ${startCol}-${startCol+2}]`);

  for (let r = startRow; r < startRow + 3; r++) {
      for (let c = startCol; c < startCol + 3; c++) {
           const cellValue = grid[r]?.[c]; // Bezpieczny dostęp, na wszelki wypadek
           if (cellValue === undefined) {
               console.error(`!!! ERROR checkRegionPlacement: grid[${r}][${c}] is undefined!`);
               continue; // Pomiń, jeśli siatka jest zła
           }

           const isTargetCell = (r === rowIndex && c === colIndex);
           const matchesValue = (cellValue === numValue);
           // console.log(`Cell [${r},${c}]='${cellValue}'. IsTarget=${isTargetCell}. MatchesValue=${matchesValue}.`);

           // Warunek konfliktu: komórka NIE jest docelowa ORAZ jej wartość zgadza się z podaną
           const isConflict = !isTargetCell && matchesValue;

           if (isConflict) {
               console.log(`   !!! CONFLICT DETECTED at [${r}, ${c}] (Not Target: ${!isTargetCell}, Matches Value: ${matchesValue}) !!!`);
               return false;
           }
      }
  }
  console.log(`   --- NO CONFLICT DETECTED in checkRegionPlacement ---`);
  return true;
}
  // --- Solver ---

  // Helper: Convert 81-char string to 9x9 grid
  stringToGrid(puzzleString) {
    // console.log(`--- stringToGrid called with string starting: ${puzzleString.substring(0,10)}...`);
    if (typeof puzzleString !== 'string' || puzzleString.length !== 81) {
         console.error(`!!! ERROR stringToGrid: Invalid input string! Length: ${puzzleString?.length}`);
         return Array(9).fill(null).map(() => Array(9).fill('.'));
    }
    const grid = [];
    let puzzleIndex = 0; // Użyj innej nazwy niż 'index' dla uniknięcia konfliktów
    for (let i = 0; i < 9; i++) { // i = wiersz
        grid[i] = [];
        for (let j = 0; j < 9; j++) { // j = kolumna
            grid[i][j] = puzzleString[puzzleIndex];
            // Loguj co kilka elementów, aby zobaczyć, czy indeksowanie jest ok
            // if (puzzleIndex % 10 === 0) console.log(`   stringToGrid: index=${puzzleIndex}, char='${puzzleString[puzzleIndex]}' -> grid[${i}][${j}]`);
            puzzleIndex++;
        }
    }
    // Sprawdź kluczową komórkę E2 (grid[4][1])
    // console.log(`   stringToGrid: Final check grid[4][1] = '${grid[4]?.[1]}' (expected '1')`);
    return grid;
}
  // Helper: Convert 9x9 grid back to 81-char string
  gridToString(grid) {
    return grid.map(row => row.join('')).join('');
  }

  // Helper: Find the next empty cell [row, col] or null if solved
  findEmpty(grid) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === '.') {
          return [r, c];
        }
      }
    }
    return null; // No empty cells found
  }

  // Helper: Check if placing 'num' at grid[row][col] is valid
  isValidPlacement(grid, row, col, num) {
     const numStr = num.toString();
     // Check Row
     for (let c = 0; c < 9; c++) {
         if (grid[row][c] === numStr && c !== col) {
             return false;
         }
     }
     // Check Column
     for (let r = 0; r < 9; r++) {
         if (grid[r][col] === numStr && r !== row) {
             return false;
         }
     }
     // Check Region
     const startRow = Math.floor(row / 3) * 3;
     const startCol = Math.floor(col / 3) * 3;
     for (let r = startRow; r < startRow + 3; r++) {
         for (let c = startCol; c < startCol + 3; c++) {
             if (grid[r][c] === numStr && (r !== row || c !== col)) {
                 return false;
             }
         }
     }
     return true;
  }

  // Recursive solver function
  solveRecursive(grid) {
    const emptyPos = this.findEmpty(grid);

    if (!emptyPos) {
      return grid; // Puzzle solved
    }

    const [row, col] = emptyPos;

    for (let num = 1; num <= 9; num++) {
       const numStr = num.toString();
       // Check if placing num here is initially valid according to Sudoku rules
       if (this.isValidPlacement(grid, row, col, numStr)) {
         grid[row][col] = numStr; // Place the number

         // Recursively try to solve the rest
         const result = this.solveRecursive(grid);
         if (result) {
           return result; // Solution found down this path
         }

         // Backtrack: If the recursive call didn't find a solution, undo the placement
         grid[row][col] = '.';
       }
    }

    return false; // No number from 1-9 worked for this cell, trigger backtracking
  }

  // Main solve method
  solve(puzzleString) {
    // Basic validation (length, characters) handled by the route handler
    // Convert to grid
    const grid = this.stringToGrid(puzzleString);

    // Check initial puzzle validity (duplicates in rows/cols/regions)
    for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
            if (grid[r][c] !== '.') {
                const val = grid[r][c];
                grid[r][c] = '.'; // Temporarily remove to check against others
                if (!this.isValidPlacement(grid, r, c, val)) {
                    grid[r][c] = val; // Put it back
                    return false; // Initial puzzle is invalid
                }
                grid[r][c] = val; // Put it back
            }
        }
    }


    const solvedGrid = this.solveRecursive(grid);

    if (!solvedGrid) {
      return false; // Could not be solved
    }

    return this.gridToString(solvedGrid);
  }
}

module.exports = SudokuSolver;