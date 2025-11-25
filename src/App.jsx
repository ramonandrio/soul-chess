import React, { useState, useEffect } from 'react';
import Board from './components/Board';
import { generatePuzzle, getValidMoves, movePiece, checkGameState, COLORS } from './game/engine';

function App() {
  const [boardSize, setBoardSize] = useState(4); // Default to 4x4 for puzzles
  const [board, setBoard] = useState(null);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  const [selectedPos, setSelectedPos] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [targetMoves, setTargetMoves] = useState(0);
  const [solutionPath, setSolutionPath] = useState([]);
  const [initialBoard, setInitialBoard] = useState(null); // Store initial state for restart
  const [hintIndex, setHintIndex] = useState(0);
  const [showHint, setShowHint] = useState(null); // {r, c} to highlight
  const [level, setLevel] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('classic'); // 'neon' or 'classic'

  // Initialize game
  useEffect(() => {
    startNewGame();
  }, [boardSize]);

  const startNewGame = (nextLevel = false, restart = false) => {
    setLoading(true);

    if (restart && initialBoard) {
      // Restart current level
      setTimeout(() => {
        // Deep copy initial board to reset
        const resetBoard = initialBoard.map(row => row.map(p => p ? { ...p } : null));
        setBoard(resetBoard);
        setGameState('playing');
        setSelectedPos(null);
        setValidMoves([]);
        setScore(0);
        setMoves(0);
        setHintIndex(0);
        setShowHint(null);
        setFeedback('Level Restarted.');
        setLoading(false);
      }, 100);
      return;
    }

    if (nextLevel) setLevel(l => l + 1);

    // Use setTimeout to allow UI to render loading state
    setTimeout(() => {
      const currentLevel = nextLevel ? level + 1 : level;
      const { board: newBoard, minMoves, solutionPath: path } = generatePuzzle(boardSize, currentLevel);
      setBoard(newBoard);
      // Store deep copy of initial board
      setInitialBoard(newBoard.map(row => row.map(p => p ? { ...p } : null)));
      setTargetMoves(minMoves);
      setSolutionPath(path);
      setGameState('playing');
      setSelectedPos(null);
      setValidMoves([]);
      setScore(0);
      setMoves(0);
      setHintIndex(0);
      setShowHint(null);
      setFeedback(nextLevel ? `Level ${level + 1} Start!` : 'Find the optimal path...');
      setLoading(false);
    }, 100);
  };

  const handleHint = () => {
    if (hintIndex < solutionPath.length) {
      const nextMove = solutionPath[hintIndex];
      // The solution path contains the TARGET squares.
      // We want to show where to go.
      // But wait, the path in solver is a list of MOVES (target squares).
      // So solutionPath[0] is the first move's target.
      // We need to know which piece moves there? 
      // In this game, we only have ONE white piece. So it's always the white piece moving.
      // So highlighting the target square is enough.

      // Adjust for current progress?
      // If user made correct moves, we should show the NEXT one.
      // But if user made wrong moves, the path is invalid.
      // Simple version: Just show the next step in the INITIAL optimal path, 
      // assuming user is following it or resetting.
      // Better: Re-calculate? No, that's expensive.
      // Let's just show the next step based on 'moves' count if on track?
      // Or just show the step at 'moves' index?

      if (moves < solutionPath.length) {
        const target = solutionPath[moves];
        setShowHint(target);
        setFeedback("Hint: Move here.");

        // Clear hint after 2 seconds
        setTimeout(() => setShowHint(null), 2000);
      } else {
        setFeedback("No more hints available.");
      }
    }
  };

  const handleSquareClick = (r, c) => {
    if (gameState !== 'playing') return;

    const clickedPiece = board[r][c];
    const isWhite = clickedPiece?.color === COLORS.WHITE;

    // If clicking on our own piece (White), select it
    if (isWhite) {
      setSelectedPos({ r, c });
      const moves = getValidMoves(board, r, c);
      setValidMoves(moves);
      return;
    }

    // If clicking on a valid move target
    const move = validMoves.find(m => m.r === r && m.c === c);
    if (move && selectedPos) {
      // Execute move
      const oldPiece = board[selectedPos.r][selectedPos.c];
      const targetPiece = board[r][c];

      const newBoard = movePiece(board, selectedPos, { r, c });
      setBoard(newBoard);
      setMoves(m => m + 1);

      if (targetPiece) {
        setScore(s => s + 1);
        setFeedback(`Soul Switched: ${oldPiece.type.toUpperCase()} → ${targetPiece.type.toUpperCase()}`);
      } else {
        setFeedback('Moving...');
      }

      // Check game state
      const newState = checkGameState(newBoard);
      setGameState(newState);

      // Reset selection
      setSelectedPos(null);
      setValidMoves([]);
      setShowHint(null); // Clear hint on move
    } else {
      // Deselect if clicking empty space or invalid target
      setSelectedPos(null);
      setValidMoves([]);
    }
  };

  if (loading || !board) return (
    <div className="app-container">
      <div className="loading">Generating Level {level}...</div>
    </div>
  );

  return (
    <div className={`app-container ${theme === 'classic' ? 'classic-theme' : ''}`}>
      <header>
        <h1>Soul Chess</h1>
        <p>Level {level} • Puzzle Mode</p>
      </header>

      <div className="game-controls">
        <button onClick={() => startNewGame(false, true)}>Restart Puzzle</button>
        <button onClick={() => startNewGame(false, false)}>New Puzzle</button>
        <button onClick={handleHint} className="hint-btn">Hint</button>
      </div>

      <div style={{ marginBottom: '1rem', height: '1.5rem', color: 'var(--accent-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
        {feedback}
      </div>

      <div className="game-area">
        <Board
          board={board}
          validMoves={validMoves}
          onSquareClick={handleSquareClick}
          selectedPos={selectedPos}
          hintPos={showHint}
        />

        {gameState !== 'playing' && (
          <div className={`game-over-overlay ${gameState}`}>
            <div className="game-over-content">
              <h2>{gameState === 'won' ? 'Victory!' : 'Defeat'}</h2>
              <p>
                {gameState === 'won'
                  ? (moves <= targetMoves ? 'Perfect! Optimal path found.' : `Solved, but not optimal (${targetMoves} moves).`)
                  : 'You are stuck.'}
              </p>
              <div className="overlay-buttons">
                <button onClick={() => startNewGame(false, true)}>Replay Level</button>
                {gameState === 'won' && <button onClick={() => startNewGame(true, false)}>Next Level</button>}
                {gameState !== 'won' && <button onClick={() => startNewGame(false, false)}>New Puzzle</button>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="stats-panel">
        <div className="stat-item">
          <span className="stat-value">{moves} / {targetMoves}</span>
          <span className="stat-label">Moves</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{score}</span>
          <span className="stat-label">Souls</span>
        </div>
      </div>
    </div>
  );
}

export default App;
