import Piece from './Piece';
import { COLORS } from '../game/engine';
import { AnimatePresence } from 'framer-motion';

const Board = ({ board, validMoves, onSquareClick, selectedPos, hintPos }) => {
    return (
        <div
            className="board"
            style={{
                gridTemplateColumns: `repeat(${board[0].length}, 1fr)`,
                gridTemplateRows: `repeat(${board.length}, 1fr)`
            }}
        >
            {board.map((row, r) => (
                row.map((piece, c) => {
                    const isSelected = selectedPos && selectedPos.r === r && selectedPos.c === c;
                    const move = validMoves.find(m => m.r === r && m.c === c);
                    const isValidMove = !!move;
                    const isCapture = move?.isCapture;
                    const isBlocked = piece?.type === 'blocked';
                    const isHint = hintPos && hintPos.r === r && hintPos.c === c;
                    const isDark = (r + c) % 2 === 1;

                    return (
                        <div
                            key={`${r}-${c}`}
                            className={`square ${isDark ? 'square-dark' : 'square-light'} ${isSelected ? 'selected' : ''} ${isValidMove ? 'valid-move' : ''} ${isCapture ? 'capture-move' : ''} ${isBlocked ? 'square-blocked' : ''} ${isHint ? 'hint-move' : ''}`}
                            onClick={() => !isBlocked && onSquareClick(r, c)}
                        >
                            <AnimatePresence mode='popLayout'>
                                {piece && !isBlocked && (
                                    <Piece
                                        key={piece.id} // Key is crucial for AnimatePresence
                                        id={piece.id}
                                        type={piece.type}
                                        color={piece.color}
                                        isPlayer={piece.color === COLORS.WHITE}
                                    />
                                )}
                            </AnimatePresence>
                            {isValidMove && !isCapture && <div className="move-indicator" />}
                            {isValidMove && isCapture && <div className="capture-indicator" />}
                            {isHint && <div className="hint-indicator" />}
                        </div>
                    );
                })
            ))}
        </div>
    );
};

export default Board;
