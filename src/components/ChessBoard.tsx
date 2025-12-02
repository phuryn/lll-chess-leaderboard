import { Chess } from "chess.js";
import blackPawn from "@/assets/black-pawn.svg";

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

  const renderPiece = (piece: string) => {
    // Black pawn uses SVG
    if (piece === "p") {
      return (
        <img 
          src={blackPawn} 
          alt="Black pawn" 
          className="h-[30px] w-auto drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
        />
      );
    }
    
    // All other pieces use unicode
    const isWhite = piece === piece.toUpperCase();
    return (
      <span className={
        isWhite 
          ? "text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
          : "text-slate-950 drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]"
      }>
        {pieceUnicode[piece]}
      </span>
    );
  };

  return (
    <div className="inline-block rounded-lg overflow-hidden border border-slate-600 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
      {/* Board with coordinates */}
      <div className="flex">
        {/* Rank labels (left side) */}
        <div className="flex flex-col justify-around bg-slate-900 px-2 py-1">
          {ranks.map((rank) => (
            <span key={rank} className="text-xs text-slate-500 font-mono h-10 sm:h-12 md:h-14 flex items-center justify-center">
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
                      text-2xl sm:text-3xl md:text-4xl select-none transition-all duration-200
                      ${isLight ? "bg-slate-600" : "bg-slate-800"}
                      ${highlighted ? "ring-2 ring-inset ring-cyan-400 shadow-[inset_0_0_12px_rgba(34,211,238,0.4)]" : ""}
                    `}
                  >
                    {piece && renderPiece(piece)}
                  </div>
                );
              })
            )}
          </div>

          {/* File labels (bottom) */}
          <div className="flex bg-slate-900">
            {files.map((file) => (
              <span
                key={file}
                className="w-10 sm:w-12 md:w-14 text-center text-xs text-slate-500 font-mono py-1"
              >
                {file}
              </span>
            ))}
          </div>
        </div>

        {/* Right side spacer for symmetry */}
        <div className="bg-slate-900 px-2" />
      </div>
    </div>
  );
}
