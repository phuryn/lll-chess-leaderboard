-- Add test_type and test_desc columns to games table
-- These defaults will apply to existing games in the database
ALTER TABLE games 
ADD COLUMN test_type TEXT NOT NULL DEFAULT 'Can see the board (FEN)';

ALTER TABLE games 
ADD COLUMN test_desc TEXT NOT NULL DEFAULT 'Models receive the current board position as a FEN string (Forsyth-Edwards Notation), a standard text representation of chess positions. This tests whether models can interpret board state from text and produce valid moves.';