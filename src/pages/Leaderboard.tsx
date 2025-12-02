import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";

interface PlayerStats {
  player: string;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  invalidMoveLosses: number;
  totalInvalidMoveRounds: number;
}

interface TestTypeLeaderboard {
  testType: string;
  testDesc: string;
  players: PlayerStats[];
}

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
            playerStatsMap.set(whitePlayer, { player: whitePlayer, wins: 0, losses: 0, draws: 0, points: 0, invalidMoveLosses: 0, totalInvalidMoveRounds: 0 });
          }
          if (blackPlayer && !playerStatsMap.has(blackPlayer)) {
            playerStatsMap.set(blackPlayer, { player: blackPlayer, wins: 0, losses: 0, draws: 0, points: 0, invalidMoveLosses: 0, totalInvalidMoveRounds: 0 });
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
                playerStatsMap.get(losingPlayer)!.totalInvalidMoveRounds += round;
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
        });

        // Convert to array and sort by points
        const sortedPlayers = Array.from(playerStatsMap.values()).sort((a, b) => b.points - a.points);

        leaderboardsByType.push({
          testType,
          testDesc: groupData.testDesc,
          players: sortedPlayers,
        });
      });

      // Sort test types alphabetically
      leaderboardsByType.sort((a, b) => a.testType.localeCompare(b.testType));

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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">LLM Chess Leaderboard</h1>
          <p className="text-muted-foreground text-lg">
            Rankings based on wins (+1 point) and losses (-1 point). Invalid moves result in an automatic loss.
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
                            {player.invalidMoveLosses > 0 
                              ? (player.totalInvalidMoveRounds / player.invalidMoveLosses).toFixed(1) 
                              : '-'}
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
        <Card className="mt-12 p-6 bg-muted/30">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">What is FEN?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>FEN (Forsyth-Edwards Notation)</strong> is a standard text format for describing chess positions. It represents the board state in a compact string.
              </p>
              <code className="text-xs bg-background px-2 py-1 rounded block overflow-x-auto">
                rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
              </code>
              <p className="text-xs text-muted-foreground mt-1">
                This FEN string represents the starting position of a chess game.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">What is SAN?</h3>
              <p className="text-sm text-muted-foreground mb-2">
                <strong>SAN (Standard Algebraic Notation)</strong> is the standard for recording chess moves. LLMs must output moves in this format.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <code className="bg-background px-2 py-1 rounded text-xs block">e4</code>
                  <span className="text-xs text-muted-foreground">Pawn to e4</span>
                </div>
                <div>
                  <code className="bg-background px-2 py-1 rounded text-xs block">Nf3</code>
                  <span className="text-xs text-muted-foreground">Knight to f3</span>
                </div>
                <div>
                  <code className="bg-background px-2 py-1 rounded text-xs block">Bxc6</code>
                  <span className="text-xs text-muted-foreground">Bishop captures c6</span>
                </div>
                <div>
                  <code className="bg-background px-2 py-1 rounded text-xs block">O-O</code>
                  <span className="text-xs text-muted-foreground">Kingside castle</span>
                </div>
                <div>
                  <code className="bg-background px-2 py-1 rounded text-xs block">O-O-O</code>
                  <span className="text-xs text-muted-foreground">Queenside castle</span>
                </div>
                <div>
                  <code className="bg-background px-2 py-1 rounded text-xs block">Qh5+</code>
                  <span className="text-xs text-muted-foreground">Queen to h5 (check)</span>
                </div>
                <div>
                  <code className="bg-background px-2 py-1 rounded text-xs block">e8=Q</code>
                  <span className="text-xs text-muted-foreground">Pawn promotes to Queen</span>
                </div>
                <div>
                  <code className="bg-background px-2 py-1 rounded text-xs block">Rd1#</code>
                  <span className="text-xs text-muted-foreground">Rook to d1 (checkmate)</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
