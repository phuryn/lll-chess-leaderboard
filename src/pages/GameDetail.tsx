import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chess } from "chess.js";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ChessBoard from "@/components/ChessBoard";
import PlaybackControls from "@/components/PlaybackControls";
import Footer from "@/components/Footer";

interface Game {
  id: string;
  fen: string;
  white_player: string | null;
  black_player: string | null;
  winner: string | null;
  status: string;
  reason: string | null;
  test_type: string;
  move_history: string[];
  created_at: string;
}

// Clean move from move_history (remove tool usage brackets)
const cleanMove = (move: string): string => {
  // Remove [Used tools: ...] or [Internal thought: ...] prefixes
  const cleaned = move.replace(/^\[.*?\]\s*/s, "").trim();
  // Also extract just the move if there's extra text
  const sanMatch = cleaned.match(/^([a-hKQRBNO][a-h1-8x+#=QRBN\-O]*)/);
  return sanMatch ? sanMatch[1] : cleaned;
};

export default function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [positions, setPositions] = useState<{ fen: string; lastMove: { from: string; to: string } | null }[]>([]);

  useEffect(() => {
    if (gameId) fetchGame();
  }, [gameId]);

  const fetchGame = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching game:", error);
        return;
      }

      if (data) {
        setGame(data);
        computePositions(data.move_history);
      }
    } finally {
      setLoading(false);
    }
  };

  const computePositions = (moveHistory: string[]) => {
    const chess = new Chess();
    const posArr: { fen: string; lastMove: { from: string; to: string } | null }[] = [
      { fen: chess.fen(), lastMove: null },
    ];

    for (const rawMove of moveHistory) {
      const move = cleanMove(rawMove);
      try {
        const result = chess.move(move);
        if (result) {
          posArr.push({
            fen: chess.fen(),
            lastMove: { from: result.from, to: result.to },
          });
        } else {
          // Invalid move - stop here
          break;
        }
      } catch {
        // Invalid move - stop here
        break;
      }
    }

    setPositions(posArr);
  };

  // Playback controls
  const goToMove = useCallback((index: number) => {
    setCurrentMoveIndex(Math.max(0, Math.min(index, positions.length - 1)));
  }, [positions.length]);

  const goNext = useCallback(() => {
    setCurrentMoveIndex((prev) => Math.min(prev + 1, positions.length - 1));
  }, [positions.length]);

  const goPrevious = useCallback(() => {
    setCurrentMoveIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStart = useCallback(() => {
    setCurrentMoveIndex(0);
    setIsPlaying(false);
  }, []);

  const goToEnd = useCallback(() => {
    setCurrentMoveIndex(positions.length - 1);
    setIsPlaying(false);
  }, [positions.length]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setCurrentMoveIndex((prev) => {
        if (prev >= positions.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speed * 1000);

    return () => clearInterval(timer);
  }, [isPlaying, speed, positions.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground">Game not found</div>
        <Link to="/games">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Games
          </Button>
        </Link>
      </div>
    );
  }

  const currentPosition = positions[currentMoveIndex] || positions[0];
  const winnerName = game.winner === "white" ? game.white_player : game.black_player;
  const loserName = game.winner === "white" ? game.black_player : game.white_player;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = () => {
    switch (game.status) {
      case "mate":
        return <Badge className="bg-green-600">Checkmate</Badge>;
      case "invalid_move":
        return <Badge className="bg-amber-600">Invalid Move</Badge>;
      case "stalemate":
        return <Badge variant="secondary">Stalemate</Badge>;
      case "draw":
        return <Badge variant="secondary">Draw</Badge>;
      default:
        return <Badge variant="outline">{game.status}</Badge>;
    }
  };

  // Format move history for display
  const formatMoveHistory = () => {
    const moves: { moveNum: number; white: string; black: string | null; whiteIndex: number; blackIndex: number | null }[] = [];
    
    for (let i = 0; i < game.move_history.length; i += 2) {
      moves.push({
        moveNum: Math.floor(i / 2) + 1,
        white: cleanMove(game.move_history[i]),
        black: game.move_history[i + 1] ? cleanMove(game.move_history[i + 1]) : null,
        whiteIndex: i + 1,
        blackIndex: game.move_history[i + 1] ? i + 2 : null,
      });
    }
    
    return moves;
  };

  const moveHistory = formatMoveHistory();
  const invalidMoveIndex = game.status === "invalid_move" ? game.move_history.length : -1;

  return (
    <>
      <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col">
        <div className="max-w-5xl mx-auto space-y-6 flex-1 w-full">
          {/* Back button */}
          <Link to="/games">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Games
            </Button>
          </Link>

          {/* Game Header */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {game.white_player} vs {game.black_player}
                </h1>
                <div className="flex flex-wrap gap-2 items-center">
                  {getStatusBadge()}
                  <Badge variant="outline">{game.test_type}</Badge>
                  <span className="text-sm text-muted-foreground">{formatDate(game.created_at)}</span>
                </div>
              </div>
              <div className="text-right">
                {winnerName && (
                  <div>
                    <span className="text-sm text-muted-foreground">Winner: </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">{winnerName}</span>
                  </div>
                )}
                {game.reason && (
                  <div className="text-sm text-muted-foreground">
                    Reason: {game.reason}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Board and Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chess Board */}
            <div className="flex flex-col items-center gap-4">
              <ChessBoard fen={currentPosition.fen} lastMove={currentPosition.lastMove} />
              <PlaybackControls
                currentMove={currentMoveIndex}
                totalMoves={positions.length - 1}
                isPlaying={isPlaying}
                speed={speed}
                onPrevious={goPrevious}
                onNext={goNext}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onReset={goToStart}
                onEnd={goToEnd}
                onSpeedChange={setSpeed}
              />
            </div>

            {/* Move History */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Move History</h3>
              <div className="max-h-80 overflow-y-auto">
                <div className="grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-1 text-sm">
                  <div className="font-medium text-muted-foreground">#</div>
                  <div className="font-medium text-muted-foreground">White</div>
                  <div className="font-medium text-muted-foreground">Black</div>
                  
                  {moveHistory.map((move) => (
                    <>
                      <div key={`num-${move.moveNum}`} className="text-muted-foreground">
                        {move.moveNum}.
                      </div>
                      <div
                        key={`white-${move.moveNum}`}
                        className={`cursor-pointer px-1 rounded ${
                          currentMoveIndex === move.whiteIndex
                            ? "bg-primary text-primary-foreground"
                            : move.whiteIndex === invalidMoveIndex
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => goToMove(move.whiteIndex)}
                      >
                        {move.white}
                        {move.whiteIndex === invalidMoveIndex && " ??"}
                      </div>
                      <div
                        key={`black-${move.moveNum}`}
                        className={`cursor-pointer px-1 rounded ${
                          move.blackIndex === null
                            ? ""
                            : currentMoveIndex === move.blackIndex
                            ? "bg-primary text-primary-foreground"
                            : move.blackIndex === invalidMoveIndex
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => move.blackIndex && goToMove(move.blackIndex)}
                      >
                        {move.black || ""}
                        {move.blackIndex === invalidMoveIndex && " ??"}
                      </div>
                    </>
                  ))}
                </div>
              </div>

              {game.status === "invalid_move" && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    <strong>{loserName}</strong> made an invalid move and lost the game.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
