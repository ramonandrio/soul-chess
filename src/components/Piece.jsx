import React from 'react';
import { motion } from 'framer-motion';
import { PIECE_TYPES, COLORS } from '../game/engine';

const SYMBOLS = {
    [PIECE_TYPES.KING]: '♚',
    [PIECE_TYPES.QUEEN]: '♛',
    [PIECE_TYPES.ROOK]: '♜',
    [PIECE_TYPES.BISHOP]: '♝',
    [PIECE_TYPES.KNIGHT]: '♞',
    [PIECE_TYPES.PAWN]: '♟',
};

const Piece = ({ type, color, id, isPlayer }) => {
    const isWhite = color === COLORS.WHITE;

    return (
        <motion.div
            layoutId={id}
            className={`piece ${isWhite ? 'piece-white' : 'piece-black'} ${isPlayer ? 'player-piece' : ''}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 25
            }}
        >
            {SYMBOLS[type]}
        </motion.div>
    );
};

export default Piece;
