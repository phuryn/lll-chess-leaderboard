import { Chess } from "chess.js";

interface ChessBoardProps {
  fen: string;
  lastMove?: { from: string; to: string } | null;
}

const pieceUnicode: Record<string, string> = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
const ranks = ["8", "7", "6", "5", "4", "3", "2", "1"];

export default function ChessBoard({ fen, lastMove }: ChessBoardProps) {
  let board: (string | null)[][] = [];
  
  try {
    const chess = new Chess(fen);
    board = chess.board().map((row) =>
      row.map((square) => (square ? (square.color === "w" ? square.type.toUpperCase() : square.type) : null))
    );
  } catch {
    // Invalid FEN, show empty board
    board = Array(8).fill(null).map(() => Array(8).fill(null));
  }

  const isHighlighted = (file: string, rank: string) => {
    if (!lastMove) return false;
    const square = file + rank;
    return square === lastMove.from || square === lastMove.to;
  };

  return (
    <div className="inline-block border-2 border-border rounded-lg overflow-hidden shadow-lg">
      {/* Board with coordinates */}
      <div className="flex">
        {/* Rank labels (left side) */}
        <div className="flex flex-col justify-around bg-muted px-1 py-1">
          {ranks.map((rank) => (
            <span key={rank} className="text-xs text-muted-foreground h-10 sm:h-12 md:h-14 flex items-center">
              {rank}
            </span>
          ))}
        </div>

        {/* Board */}
        <div>
          <div className="grid grid-cols-8">
            {ranks.map((rank, rankIndex) =>
              files.map((file, fileIndex) => {
                const isLight = (rankIndex + fileIndex) % 2 === 0;
                const piece = board[rankIndex]?.[fileIndex];
                const highlighted = isHighlighted(file, rank);

                return (
                  <div
                    key={`${file}${rank}`}
                    className={`
                      w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center
                      text-2xl sm:text-3xl md:text-4xl select-none
                      ${isLight ? "bg-amber-100" : "bg-amber-700"}
                      ${highlighted ? "ring-2 ring-inset ring-primary" : ""}
                    `}
                  >
                    {piece && (
                      <span className={
                        piece === piece.toUpperCase() 
                          ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]" 
                          : "text-slate-900 drop-shadow-[0_0_1px_rgba(255,255,255,0.3)]"
                      }>
                        {pieceUnicode[piece]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* File labels (bottom) */}
          <div className="flex bg-muted">
            {files.map((file) => (
              <span
                key={file}
                className="w-10 sm:w-12 md:w-14 text-center text-xs text-muted-foreground py-1"
              >
                {file}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
