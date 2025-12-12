import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Chess } from "chess.js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ChessBoard from "@/components/ChessBoard";
import PlaybackControls from "@/components/PlaybackControls";
import Footer from "@/components/Footer";
import { NavLink } from "@/components/NavLink";
import { useLiveGameCount } from "@/hooks/useLiveGameCount";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

// Clean move from move_history - extract only the SAN move
const cleanMove = (move: string): string => {
  const trimmed = move.trim();
  
  // If it's already a clean move (short string matching SAN pattern), return as-is
  if (trimmed.length <= 10 && /^[a-hKQRBNO][a-h1-8x+#=QRBN\-O]*$/.test(trimmed)) {
    return trimmed;
  }
  
  // Remove [Used tools: ...] or [Internal thought: ...] prefixes
  let cleaned = trimmed.replace(/^\[.*?\]\s*/s, "").trim();
  
  // Look for "Candidate Move:" pattern (common in LLM outputs)
  const candidateMatch = cleaned.match(/\*?\*?Candidate Move[:\s]*\*?\*?\s*([A-Za-z][a-h1-8x+#=QRBN\-O]*)/i);
  if (candidateMatch) return candidateMatch[1];
  
  // Look for "My move:" or "Move:" pattern
  const moveMatch = cleaned.match(/(?:My move|Move|I play|I'll play)[:\s]+([A-Za-z][a-h1-8x+#=QRBN\-O]*)/i);
  if (moveMatch) return moveMatch[1];
  
  // Try to extract any valid SAN move from the beginning
  const sanMatch = cleaned.match(/^([a-hKQRBNO][a-h1-8x+#=QRBN\-O]*)/);
  if (sanMatch) return sanMatch[1];
  
  // Last resort: find any SAN-like pattern in the string
  const anyMoveMatch = cleaned.match(/\b([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|O-O(?:-O)?)\b/);
  if (anyMoveMatch) return anyMoveMatch[1];
  
  // If nothing matches, return truncated
  return cleaned.substring(0, 15) + (cleaned.length > 15 ? "…" : "");
};

function GameDetailNav() {
  const { count: liveCount } = useLiveGameCount();
  
  return (
    <nav className="flex gap-4 text-sm mb-4">
      <NavLink to="/" className="text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground font-medium">
        Leaderboard
      </NavLink>
      <NavLink to="/live" className="text-muted-foreground hover:text-foreground transition-colors flex items-center" activeClassName="text-foreground font-medium">
        Live Games
        <Badge className={`ml-1.5 border-0 px-1.5 py-0 text-xs ${liveCount > 0 ? 'bg-slate-700 text-cyan-400' : 'bg-slate-200 hover:bg-slate-200 text-[hsl(215.4,16.3%,46.9%)] hover:text-foreground'}`}>
          {liveCount}
        </Badge>
      </NavLink>
      <NavLink to="/games" className="text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground font-medium">
        Game Replays
      </NavLink>
    </nav>
  );
}

export default function GameDetail() {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromLive = searchParams.get("from") === "live";
  
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
        <div className="text-slate-400">Loading game...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="text-slate-400">Game not found</div>
        <Link to={fromLive ? "/live" : "/games"}>
          <Button variant="outline" className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {fromLive ? "Back to Live Games" : "Back to Replays"}
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
        return <Badge className="bg-green-600 text-white border-0" style={{ boxShadow: "0 0 10px rgba(34, 197, 94, 0.5)" }}>Checkmate</Badge>;
      case "invalid_move":
        return <Badge className="bg-amber-600 text-white border-0" style={{ boxShadow: "0 0 10px rgba(245, 158, 11, 0.5)" }}>Invalid Move</Badge>;
      case "stalemate":
        return <Badge className="bg-slate-600 text-slate-200 border-0">Stalemate</Badge>;
      case "draw":
        return <Badge className="bg-slate-600 text-slate-200 border-0">Draw</Badge>;
      default:
        return <Badge variant="outline" className="border-slate-600 text-slate-300">{game.status}</Badge>;
    }
  };

  // Format move history for display
  const formatMoveHistory = () => {
    const moves: { 
      moveNum: number; 
      white: string; 
      black: string | null; 
      whiteIndex: number; 
      blackIndex: number | null;
      whiteRaw: string;
      blackRaw: string | null;
    }[] = [];
    
    for (let i = 0; i < game.move_history.length; i += 2) {
      moves.push({
        moveNum: Math.floor(i / 2) + 1,
        white: cleanMove(game.move_history[i]),
        black: game.move_history[i + 1] ? cleanMove(game.move_history[i + 1]) : null,
        whiteIndex: i + 1,
        blackIndex: game.move_history[i + 1] ? i + 2 : null,
        whiteRaw: game.move_history[i],
        blackRaw: game.move_history[i + 1] || null,
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
          {/* Navigation */}
          <GameDetailNav />
          
          {/* Back button */}
          <Link to={fromLive ? "/live" : "/games"}>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-300 hover:bg-slate-800/50">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {fromLive ? "Back to Live Games" : "Back to Replays"}
            </Button>
          </Link>

          {/* Game Header */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 md:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-100 mb-2">
                  <span className="text-slate-100">{game.white_player}</span>
                  <span className="text-slate-500 font-normal text-base md:text-lg"> (W)</span>
                  <span className="text-slate-500 mx-2">vs</span>
                  <span className="text-slate-100">{game.black_player}</span>
                  <span className="text-slate-500 font-normal text-base md:text-lg"> (B)</span>
                </h1>
                <div className="flex flex-wrap gap-2 items-center">
                  {getStatusBadge()}
                  <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">{game.test_type}</Badge>
                  <span className="text-sm text-slate-400">{formatDate(game.created_at)}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <span className="text-sm text-slate-400">Winner:</span>
                {game.status === "continue" ? (
                  <span className="text-slate-500">-</span>
                ) : winnerName ? (
                  <>
                    <span className="font-semibold text-green-400" style={{ textShadow: "0 0 10px rgba(74, 222, 128, 0.5)" }}>
                      {winnerName}
                    </span>
                    {game.reason && (
                      <span className="text-sm text-slate-500">({game.reason})</span>
                    )}
                  </>
                ) : (
                  <span className="text-slate-500">-</span>
                )}
              </div>
            </div>
          </div>

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
            <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-slate-100">Move History</h3>
              <TooltipProvider>
                <div className="max-h-60 md:max-h-80 overflow-y-auto">
                  <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 md:gap-x-4 gap-y-1 text-sm">
                    <div className="font-medium text-slate-500 text-xs uppercase tracking-wider">#</div>
                    <div className="font-medium text-slate-300 text-xs uppercase tracking-wider truncate">
                      {game.white_player} <span className="text-slate-500">(W)</span>
                    </div>
                    <div className="font-medium text-slate-300 text-xs uppercase tracking-wider truncate">
                      {game.black_player} <span className="text-slate-500">(B)</span>
                    </div>
                    
                    {moveHistory.map((move) => (
                      <>
                        <div key={`num-${move.moveNum}`} className="text-slate-500">
                          {move.moveNum}.
                        </div>
                        {move.whiteIndex === invalidMoveIndex ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                key={`white-${move.moveNum}`}
                                className="px-1 rounded text-red-400 font-medium cursor-help"
                              >
                                Invalid
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-md max-h-60 overflow-auto bg-slate-800 border-slate-600">
                              <pre className="font-mono text-xs whitespace-pre-wrap break-all text-slate-200">{move.whiteRaw}</pre>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div
                            key={`white-${move.moveNum}`}
                            className={`cursor-pointer px-1 rounded transition-colors ${
                              currentMoveIndex === move.whiteIndex
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "text-slate-200 hover:bg-slate-800"
                            }`}
                            onClick={() => goToMove(move.whiteIndex)}
                          >
                            {move.white}
                          </div>
                        )}
                        {move.blackIndex === invalidMoveIndex ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                key={`black-${move.moveNum}`}
                                className="px-1 rounded text-red-400 font-medium cursor-help"
                              >
                                Invalid
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-md max-h-60 overflow-auto bg-slate-800 border-slate-600">
                              <pre className="font-mono text-xs whitespace-pre-wrap break-all text-slate-200">{move.blackRaw}</pre>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <div
                            key={`black-${move.moveNum}`}
                            className={`cursor-pointer px-1 rounded transition-colors ${
                              move.blackIndex === null
                                ? ""
                                : currentMoveIndex === move.blackIndex
                                ? "bg-cyan-500/20 text-cyan-400"
                                : "text-slate-200 hover:bg-slate-800"
                            }`}
                            onClick={() => move.blackIndex && goToMove(move.blackIndex)}
                          >
                            {move.black || ""}
                          </div>
                        )}
                      </>
                    ))}
                  </div>
                </div>
              </TooltipProvider>

              {game.status === "invalid_move" && (
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-400">
                    <strong>{loserName}</strong> made an invalid move and lost the game.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
