import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import Footer from "@/components/Footer";

interface PlayerStats {
  player: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  invalidMoveLosses: number;
  invalidMoveRounds: number[];
  maxValidMoves: number;
}

interface TestTypeLeaderboard {
  testType: string;
  testDesc: string;
  players: PlayerStats[];
}

const calculateMedian = (values: number[]): number | null => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 
    ? sorted[mid] 
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

export default function Leaderboard() {
  const [leaderboards, setLeaderboards] = useState<TestTypeLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: games, error } = await supabase
        .from('games')
        .select('*')
        .neq('status', 'continue')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching games:', error);
        return;
      }

      if (!games || games.length === 0) {
        setLeaderboards([]);
        return;
      }

      // Group games by test_type
      const testTypeGroups = new Map<string, { games: typeof games; testDesc: string }>();

      games.forEach((game) => {
        const testType = game.test_type || 'Unknown';
        if (!testTypeGroups.has(testType)) {
          testTypeGroups.set(testType, {
            games: [],
            testDesc: game.test_desc || 'Unknown',
          });
        }
        testTypeGroups.get(testType)!.games.push(game);
      });

      // Calculate stats for each test type
      const leaderboardsByType: TestTypeLeaderboard[] = [];

      testTypeGroups.forEach((groupData, testType) => {
        const playerStatsMap = new Map<string, PlayerStats>();

        groupData.games.forEach((game) => {
          const whitePlayer = game.white_player;
          const blackPlayer = game.black_player;

          // Initialize players if they don't exist
          if (whitePlayer && !playerStatsMap.has(whitePlayer)) {
            playerStatsMap.set(whitePlayer, { player: whitePlayer, wins: 0, losses: 0, draws: 0, points: 0, invalidMoveLosses: 0, invalidMoveRounds: [], maxValidMoves: 0 });
          }
          if (blackPlayer && !playerStatsMap.has(blackPlayer)) {
            playerStatsMap.set(blackPlayer, { player: blackPlayer, wins: 0, losses: 0, draws: 0, points: 0, invalidMoveLosses: 0, invalidMoveRounds: [], maxValidMoves: 0 });
          }

          // Update stats based on game outcome
          if (game.status === "mate" || game.status === "invalid_move") {
            // Map winner side ("white" or "black") to actual player name
            const winningPlayer = game.winner === 'white' ? whitePlayer : blackPlayer;
            const losingPlayer = game.winner === 'white' ? blackPlayer : whitePlayer;

            if (winningPlayer && playerStatsMap.has(winningPlayer)) {
              playerStatsMap.get(winningPlayer)!.wins++;
              playerStatsMap.get(winningPlayer)!.points++;
            }

            if (losingPlayer && playerStatsMap.has(losingPlayer)) {
              playerStatsMap.get(losingPlayer)!.losses++;
              playerStatsMap.get(losingPlayer)!.points--;

              // Track invalid move losses separately
              if (game.status === "invalid_move") {
                playerStatsMap.get(losingPlayer)!.invalidMoveLosses++;
                const round = Math.ceil(game.move_history.length / 2);
                playerStatsMap.get(losingPlayer)!.invalidMoveRounds.push(round);
              }
            }
          } else if (game.status === "draw" || game.status === "stalemate") {
            if (whitePlayer && playerStatsMap.has(whitePlayer)) {
              playerStatsMap.get(whitePlayer)!.draws++;
            }
            if (blackPlayer && playerStatsMap.has(blackPlayer)) {
              playerStatsMap.get(blackPlayer)!.draws++;
            }
          }

          // Calculate valid moves for each player in this game
          const whiteValidMoves = Math.ceil(game.move_history.length / 2);
          const blackValidMoves = Math.floor(game.move_history.length / 2);
          
          // If player lost due to invalid move, subtract 1 (their last move was invalid)
          const whiteAdjusted = (game.status === "invalid_move" && game.winner === "black") 
            ? whiteValidMoves - 1 
            : whiteValidMoves;
          const blackAdjusted = (game.status === "invalid_move" && game.winner === "white") 
            ? blackValidMoves - 1 
            : blackValidMoves;
          
          // Update max for each player
          if (whitePlayer && playerStatsMap.has(whitePlayer)) {
            const stats = playerStatsMap.get(whitePlayer)!;
            stats.maxValidMoves = Math.max(stats.maxValidMoves, whiteAdjusted);
          }
          if (blackPlayer && playerStatsMap.has(blackPlayer)) {
            const stats = playerStatsMap.get(blackPlayer)!;
            stats.maxValidMoves = Math.max(stats.maxValidMoves, blackAdjusted);
          }
        });

        // Convert to array and sort by points
        const sortedPlayers = Array.from(playerStatsMap.values()).sort((a, b) => b.points - a.points);

        leaderboardsByType.push({
          testType,
          testDesc: groupData.testDesc,
          players: sortedPlayers,
        });
      });

      // Sort test types in reverse alphabetical order
      leaderboardsByType.sort((a, b) => b.testType.localeCompare(a.testType));

      setLeaderboards(leaderboardsByType);
    } catch (error) {
      console.error('Error in fetchLeaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-medium text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col">
      <div className="max-w-6xl mx-auto space-y-8 flex-1">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">LLM Chess Leaderboard</h1>
          <p className="text-muted-foreground text-lg">
            Benchmark results based on wins (+1 point) and losses (-1 point). Invalid moves result in an automatic loss.
          </p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground">Loading leaderboard...</div>
        ) : leaderboards.length === 0 ? (
          <div className="text-center text-muted-foreground">No completed games yet</div>
        ) : (
          <div className="space-y-12">
            {leaderboards.map((testLeaderboard) => (
              <div key={testLeaderboard.testType}>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2">🧪 {testLeaderboard.testType}</h2>
                  <p className="text-sm text-muted-foreground">{testLeaderboard.testDesc}</p>
                </div>

                <Card className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Rank</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Wins
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <TrendingDown className="w-4 h-4" />
                            Losses
                          </div>
                        </TableHead>
                        <TableHead className="text-center">Invalid Moves</TableHead>
                        <TableHead className="text-center">Avg Invalid Round</TableHead>
                        <TableHead className="text-center">Median Invalid Round</TableHead>
                        <TableHead className="text-center">Max Valid Moves</TableHead>
                        <TableHead className="text-center">Draws</TableHead>
                        <TableHead className="text-center font-bold">Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testLeaderboard.players.map((player, index) => (
                        <TableRow key={player.player} className={index < 3 ? "bg-muted/50" : ""}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {getRankIcon(index + 1)}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{player.player}</TableCell>
                          <TableCell className="text-center text-green-600 dark:text-green-400 font-semibold">
                            {player.wins}
                          </TableCell>
                          <TableCell className="text-center text-red-600 dark:text-red-400 font-semibold">
                            {player.losses}
                          </TableCell>
                          <TableCell className="text-center text-amber-600 dark:text-amber-400 font-semibold">
                            {player.invalidMoveLosses}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {player.invalidMoveRounds.length > 0 
                              ? (player.invalidMoveRounds.reduce((a, b) => a + b, 0) / player.invalidMoveRounds.length).toFixed(1) 
                              : '-'}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {player.invalidMoveRounds.length > 0 
                              ? calculateMedian(player.invalidMoveRounds)?.toFixed(1) 
                              : '-'}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {player.maxValidMoves > 0 ? player.maxValidMoves : '-'}
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {player.draws}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`text-lg font-bold ${
                              player.points > 0 ? "text-green-600 dark:text-green-400" : 
                              player.points < 0 ? "text-red-600 dark:text-red-400" : 
                              "text-muted-foreground"
                            }`}>
                              {player.points > 0 ? "+" : ""}{player.points}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Educational Footer */}
        <Card className="mt-12 p-6 border-border">
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold mb-4">About the Benchmark</h2>
              <p className="text-sm text-muted-foreground">
                LLM agents play chess by outputting moves in SAN (Standard Algebraic Notation). Depending on the test type:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 ml-4 space-y-1 list-disc">
                <li><strong>FEN mode:</strong> Models receive the exact board position as a FEN string before each move</li>
                <li><strong>Blind mode:</strong> Models only see their conversation history (all previous prompts they received and moves they output) — they must mentally reconstruct the board state</li>
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <h3 className="text-base font-medium mb-2 flex items-center gap-2">
                <span>🔬</span> Key Finding: Blind Mode Outperforms FEN
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Models perform better in blind mode than with FEN because LLMs are trained extensively on natural-language chess notation, PGN move sequences, and commentary — but very little on strict FEN decoding.
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Reconstructing the position from move history triggers multi-step reasoning and forces the model to simulate board state explicitly in a scratchpad, which reduces illegal moves. When models see a FEN string, they rely more on surface-level pattern matching instead of internal board computation, leading to more errors.
              </p>
              <p className="text-sm text-muted-foreground font-medium">
                As a result, blind mode is ironically closer to the model's strengths than giving the exact board position.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-2">What is FEN?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                FEN (Forsyth-Edwards Notation) is a standard text format for describing chess positions. It represents the board state in a compact string.
              </p>
              <code className="text-sm font-mono text-primary">
                rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
              </code>
              <p className="text-sm text-muted-foreground mt-1">
                This FEN string represents the starting position of a chess game.
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium mb-2">What is SAN?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                SAN (Standard Algebraic Notation) is the standard for recording chess moves. LLMs must output moves in this format.
              </p>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div><code className="font-mono text-primary">e4</code> — Pawn to e4</div>
                <div><code className="font-mono text-primary">Nf3</code> — Knight to f3</div>
                <div><code className="font-mono text-primary">Bxc6</code> — Bishop captures c6</div>
                <div><code className="font-mono text-primary">O-O</code> — Kingside castle</div>
                <div><code className="font-mono text-primary">O-O-O</code> — Queenside castle</div>
                <div><code className="font-mono text-primary">Qh5+</code> — Queen to h5 (check)</div>
                <div><code className="font-mono text-primary">e8=Q</code> — Pawn promotes to Queen</div>
                <div><code className="font-mono text-primary">Rd1#</code> — Rook to d1 (checkmate)</div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-medium mb-2">What is PGN?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                PGN (Portable Game Notation) is the standard file format for recording entire chess games. 
                While SAN describes individual moves, PGN wraps a sequence of SAN moves along with game metadata.
              </p>
              <code className="text-sm font-mono text-primary block mb-2">
                1. e4 e5 2. Nf3 Nc6 3. Bb5 a6
              </code>
              <p className="text-sm text-muted-foreground">
                LLMs are trained on millions of PGN files from chess databases, which is why they understand 
                move sequences better than static FEN positions.
              </p>
            </div>
          </div>
        </Card>

      </div>
      <Footer />
    </div>
  );
}
