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

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .in("status", ["mate", "stalemate", "invalid_move"]);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
      return;
    }

    // Calculate stats for each player
    const playerStatsMap = new Map<string, PlayerStats>();

    data.forEach((game) => {
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
      if (game.status === "stalemate") {
        // Stalemate is a draw - no points
        if (whitePlayer) playerStatsMap.get(whitePlayer)!.draws++;
        if (blackPlayer) playerStatsMap.get(blackPlayer)!.draws++;
      } else {
        // Someone won (mate or invalid_move)
        const winnerColor = game.winner; // "white" or "black"
        const winnerName = winnerColor === "white" ? whitePlayer : blackPlayer;
        const loserName = winnerColor === "white" ? blackPlayer : whitePlayer;

        if (winnerName && playerStatsMap.has(winnerName)) {
          playerStatsMap.get(winnerName)!.wins++;
          playerStatsMap.get(winnerName)!.points++;
        }
        if (loserName && playerStatsMap.has(loserName)) {
          playerStatsMap.get(loserName)!.losses++;
          playerStatsMap.get(loserName)!.points--;
          
          // Track invalid move losses separately
          if (game.status === "invalid_move") {
            playerStatsMap.get(loserName)!.invalidMoveLosses++;
            const round = Math.ceil(game.move_history.length / 2);
            playerStatsMap.get(loserName)!.totalInvalidMoveRounds += round;
          }
        }
      }
    });

    // Convert to array and sort by points (descending)
    const sortedLeaderboard = Array.from(playerStatsMap.values())
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        // Tiebreaker: more wins
        if (b.wins !== a.wins) return b.wins - a.wins;
        // Tiebreaker: fewer losses
        return a.losses - b.losses;
      });

    setLeaderboard(sortedLeaderboard);
    setLoading(false);
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
          <h1 className="text-5xl font-bold tracking-tight">Global Leaderboard</h1>
          <p className="text-muted-foreground text-lg">
            Rankings based on wins (+1 point) and losses (-1 point)
          </p>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">Loading leaderboard...</div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No completed games yet</div>
          ) : (
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
                {leaderboard.map((player, index) => (
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
          )}
        </Card>
      </div>
    </div>
  );
}
