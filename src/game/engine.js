
export const PIECE_TYPES = {
  KING: 'king',
  QUEEN: 'queen',
  ROOK: 'rook',
  BISHOP: 'bishop',
  KNIGHT: 'knight',
  PAWN: 'pawn',
  BLOCKED: 'blocked', // New type for walls
};

export const COLORS = {
  WHITE: 'white',
  BLACK: 'black',
  NEUTRAL: 'neutral', // For walls
};

// Helper to create a piece
const createPiece = (type, color) => ({
  id: Math.random().toString(36).substr(2, 9),
  type,
  color,
});

// Deep copy board
const cloneBoard = (board) => board.map(row => row.map(p => p ? { ...p } : null));

// Check if a position is on board
const isValidPos = (r, c, board) => {
  return r >= 0 && r < board.length && c >= 0 && c < board[0].length;
};

// Get valid moves for a piece (Pure function for solver)
export const getValidMoves = (board, r, c) => {
  const piece = board[r][c];
  if (!piece || piece.type === PIECE_TYPES.BLOCKED) return [];

  const moves = [];

  const addMove = (tr, tc) => {
    if (isValidPos(tr, tc, board)) {
      const target = board[tr][tc];
      if (!target) {
        moves.push({ r: tr, c: tc, isCapture: false });
        return true; // Continue sliding
      } else if (target.type === PIECE_TYPES.BLOCKED) {
        return false; // Blocked by wall
      } else if (target.color !== piece.color) {
        moves.push({ r: tr, c: tc, isCapture: true });
        return false; // Stop sliding (capture)
      } else {
        return false; // Blocked by friend
      }
    }
    return false; // Off board
  };

  const directions = {
    [PIECE_TYPES.ROOK]: [[0, 1], [0, -1], [1, 0], [-1, 0]],
    [PIECE_TYPES.BISHOP]: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
    [PIECE_TYPES.QUEEN]: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
    [PIECE_TYPES.KNIGHT]: [[2, 1], [2, -1], [-2, 1], [-2, -1], [1, 2], [1, -2], [-1, 2], [-1, -2]],
    [PIECE_TYPES.KING]: [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]],
    [PIECE_TYPES.PAWN]: []
  };

  if ([PIECE_TYPES.ROOK, PIECE_TYPES.BISHOP, PIECE_TYPES.QUEEN].includes(piece.type)) {
    directions[piece.type].forEach(([dr, dc]) => {
      let nr = r + dr;
      let nc = c + dc;
      while (addMove(nr, nc)) {
        nr += dr;
        nc += dc;
      }
    });
  } else if (piece.type === PIECE_TYPES.KNIGHT || piece.type === PIECE_TYPES.KING) {
    directions[piece.type].forEach(([dr, dc]) => {
      addMove(r + dr, c + dc);
    });
  } else if (piece.type === PIECE_TYPES.PAWN) {
    // White pawns move UP (r decreases)
    // For puzzle consistency, let's say Pawns move "forward" relative to board "up"
    const forward = -1;

    // Move forward 1
    if (isValidPos(r + forward, c, board)) {
      const target = board[r + forward][c];
      if (!target) {
        moves.push({ r: r + forward, c: c, isCapture: false });
      }
    }

    // Captures
    [[forward, 1], [forward, -1]].forEach(([dr, dc]) => {
      const tr = r + dr;
      const tc = c + dc;
      if (isValidPos(tr, tc, board)) {
        const target = board[tr][tc];
        if (target && target.type !== PIECE_TYPES.BLOCKED && target.color !== piece.color) {
          moves.push({ r: tr, c: tc, isCapture: true });
        }
      }
    });
  }

  return moves;
};

// Execute move
export const movePiece = (board, from, to) => {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from.r][from.c];
  const target = newBoard[to.r][to.c];

  // Soul Switching
  if (target && target.color !== piece.color) {
    piece.type = target.type;
  }

  newBoard[to.r][to.c] = piece;
  newBoard[from.r][from.c] = null;

  return newBoard;
};

export const checkGameState = (board) => {
  let whiteExists = false;
  let blackCount = 0;
  let whitePos = null;

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const p = board[r][c];
      if (p) {
        if (p.color === COLORS.WHITE) {
          whiteExists = true;
          whitePos = { r, c };
        }
        if (p.color === COLORS.BLACK) blackCount++;
      }
    }
  }

  if (!whiteExists) return 'lost';
  if (blackCount === 0) return 'won';

  if (whitePos) {
    const moves = getValidMoves(board, whitePos.r, whitePos.c);
    if (moves.length === 0) return 'lost';
  }

  return 'playing';
};

// --- PUZZLE SOLVER ---

const getBoardSignature = (r, c, type, board) => {
  // We only need to track the presence of black pieces
  // A simple way is to list the IDs of remaining black pieces
  // But IDs are random. Let's use positions.
  const blackPieces = [];
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      const p = board[i][j];
      if (p && p.color === COLORS.BLACK) {
        blackPieces.push(`${i},${j}`); // Position is enough as they don't move
      }
    }
  }
  return `${r},${c}|${type}|${blackPieces.join(';')}`;
};

export const solvePuzzle = (initialBoard) => {
  // Find white piece
  let startNode = null;
  for (let r = 0; r < initialBoard.length; r++) {
    for (let c = 0; c < initialBoard[0].length; c++) {
      if (initialBoard[r][c]?.color === COLORS.WHITE) {
        startNode = {
          r, c,
          board: initialBoard,
          path: [],
          type: initialBoard[r][c].type
        };
      }
    }
  }

  if (!startNode) return null;

  const queue = [startNode];
  const visited = new Set();
  visited.add(getBoardSignature(startNode.r, startNode.c, startNode.type, startNode.board));

  let solutions = [];
  let minMoves = Infinity;

  while (queue.length > 0) {
    const { r, c, board, path, type } = queue.shift();

    // Optimization: If we found a solution and this path is longer, skip
    if (path.length > minMoves) continue;

    // Check win
    const gameState = checkGameState(board);
    if (gameState === 'won') {
      if (path.length < minMoves) {
        minMoves = path.length;
        solutions = [path];
      } else if (path.length === minMoves) {
        solutions.push(path);
      }
      continue;
    }
    if (gameState === 'lost') continue;

    // Get moves
    const moves = getValidMoves(board, r, c);

    for (const move of moves) {
      const newBoard = movePiece(board, { r, c }, move);
      const newPiece = newBoard[move.r][move.c];
      const sig = getBoardSignature(move.r, move.c, newPiece.type, newBoard);

      if (!visited.has(sig)) {
        visited.add(sig);
        queue.push({
          r: move.r,
          c: move.c,
          board: newBoard,
          path: [...path, move],
          type: newPiece.type
        });
      }
    }
  }

  return {
    minMoves: minMoves === Infinity ? 0 : minMoves,
    solutions: solutions
  };
};

// --- PROCEDURAL GENERATOR ---

// Calculate difficulty parameters based on level
export const getDifficultyParams = (level = 1) => {
  // Board size grows every 5 levels: 4x4 -> 5x5 -> 6x6 -> 7x7
  const boardSize = Math.min(4 + Math.floor((level - 1) / 5), 7);

  // Wall density increases gradually (15-25% initially, up to 15-45%)
  const wallDensityMin = 0.15;
  const wallDensityMax = Math.min(0.25 + ((level - 1) * 0.02), 0.45);

  // Minimum moves required increases with level
  const minMovesThreshold = Math.min(2 + Math.floor((level - 1) / 3), 6);

  // Enemy multiplier increases (1.5N initially, up to 2.5N)
  const enemyMultiplier = Math.min(1.5 + ((level - 1) * 0.1), 2.5);

  return { boardSize, wallDensityMin, wallDensityMax, minMovesThreshold, enemyMultiplier };
};

export const generatePuzzle = (size = 4, level = 1) => {
  let attempts = 0;
  const maxAttempts = 200; // Reduced from 2000 to prevent browser freeze

  // Get difficulty parameters based on level
  const difficultyParams = getDifficultyParams(level);

  // Use level-based size if size parameter is default
  const boardSize = size === 4 ? difficultyParams.boardSize : size;

  // Difficulty settings based on level
  const minMovesThreshold = difficultyParams.minMovesThreshold;

  let bestResult = null;

  while (attempts < maxAttempts) {
    attempts++;
    const board = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));

    // 1. Place Walls (dynamic based on level)
    const wallDensityRange = difficultyParams.wallDensityMax - difficultyParams.wallDensityMin;
    const wallDensity = difficultyParams.wallDensityMin + Math.random() * wallDensityRange;
    const numWalls = Math.floor(boardSize * boardSize * wallDensity);
    for (let i = 0; i < numWalls; i++) {
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      board[r][c] = createPiece(PIECE_TYPES.BLOCKED, COLORS.NEUTRAL);
    }

    // 2. Place White Piece
    let wr, wc;
    let safety = 0;
    do {
      wr = Math.floor(Math.random() * size);
      wc = Math.floor(Math.random() * size);
      safety++;
    } while (board[wr][wc] && safety < 100);

    if (safety >= 100) continue; // Retry if can't place white

    // Select any piece type except BLOCKED for starting piece
    const availableTypes = [
      PIECE_TYPES.KING,
      PIECE_TYPES.QUEEN,
      PIECE_TYPES.ROOK,
      PIECE_TYPES.BISHOP,
      PIECE_TYPES.KNIGHT,
      PIECE_TYPES.PAWN
    ];
    const startType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    board[wr][wc] = createPiece(startType, COLORS.WHITE);

    // 3. Place Black Pieces (dynamic based on level)
    const minEnemies = boardSize;
    const maxEnemies = Math.floor(boardSize * difficultyParams.enemyMultiplier);
    const numEnemies = Math.floor(Math.random() * (maxEnemies - minEnemies + 1)) + minEnemies;

    let placed = 0;
    safety = 0;
    while (placed < numEnemies && safety < 100) {
      safety++;
      const r = Math.floor(Math.random() * size);
      const c = Math.floor(Math.random() * size);
      if (!board[r][c]) {
        const type = Object.values(PIECE_TYPES)[Math.floor(Math.random() * (Object.values(PIECE_TYPES).length - 1))];
        if (type !== PIECE_TYPES.BLOCKED) {
          board[r][c] = createPiece(type, COLORS.BLACK);
          placed++;
        }
      }
    }

    // 4. Solve
    const result = solvePuzzle(board);

    // 5. Validate
    if (result && result.minMoves >= minMovesThreshold && result.solutions.length === 1) {
      console.log(`Puzzle generated in ${attempts} attempts`);
      return { board, minMoves: result.minMoves, solutionPath: result.solutions[0] };
    }

    // Keep track of a "decent" puzzle just in case
    if (result && result.minMoves >= 2 && !bestResult) {
      bestResult = { board, minMoves: result.minMoves, solutionPath: result.solutions[0] || [] };
    }
  }

  console.warn(`Failed to generate perfect puzzle after ${maxAttempts} attempts.`);

  if (bestResult) {
    console.log("Returning best fallback puzzle.");
    return bestResult;
  }

  return { board: generateBoard(size, size), minMoves: 0, solutionPath: [] };
};

// Legacy generator for fallback (simplified)
export const generateBoard = (rows, cols) => {
  const board = Array(rows).fill(null).map(() => Array(cols).fill(null));
  // ... simplified logic ...
  return board;
}
