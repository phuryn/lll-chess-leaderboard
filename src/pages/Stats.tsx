import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Swords, Handshake, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";

interface PlayerStats {
  player: string;
  wins: {
    mate: number;
    invalid_move: number;
    stalemate: number;
  };
  total: number;
}

export default function Stats() {
  const [players, setPlayers] = useState<string[]>([]);
  const [player1, setPlayer1] = useState<string>("");
  const [player2, setPlayer2] = useState<string>("");
  const [stats, setStats] = useState<{ player1: PlayerStats; player2: PlayerStats } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from("games")
      .select("white_player, black_player");

    if (error) {
      console.error("Error fetching players:", error);
      return;
    }

    const uniquePlayers = new Set<string>();
    data.forEach((game) => {
      if (game.white_player) uniquePlayers.add(game.white_player);
      if (game.black_player) uniquePlayers.add(game.black_player);
    });

    setPlayers(Array.from(uniquePlayers).sort());
  };

  const fetchStats = async () => {
    if (!player1 || !player2) return;

    setLoading(true);
    
    // Use two separate queries to avoid issues with special characters in player names
    const [query1, query2] = await Promise.all([
      supabase
        .from("games")
        .select("*")
        .eq("white_player", player1)
        .eq("black_player", player2)
        .in("status", ["mate", "stalemate", "invalid_move"]),
      supabase
        .from("games")
        .select("*")
        .eq("white_player", player2)
        .eq("black_player", player1)
        .in("status", ["mate", "stalemate", "invalid_move"])
    ]);

    if (query1.error || query2.error) {
      console.error("Error fetching stats:", query1.error || query2.error);
      setLoading(false);
      return;
    }

    const data = [...(query1.data || []), ...(query2.data || [])];

    const p1Stats: PlayerStats = {
      player: player1,
      wins: { mate: 0, invalid_move: 0, stalemate: 0 },
      total: 0,
    };

    const p2Stats: PlayerStats = {
      player: player2,
      wins: { mate: 0, invalid_move: 0, stalemate: 0 },
      total: 0,
    };

    data.forEach((game) => {
      // Map winner color to actual player name
      const winnerName = game.winner === "white" ? game.white_player : 
                        game.winner === "black" ? game.black_player : null;
      
      if (winnerName === player1) {
        p1Stats.total++;
        if (game.status === "mate") p1Stats.wins.mate++;
        else if (game.status === "invalid_move") p1Stats.wins.invalid_move++;
      } else if (winnerName === player2) {
        p2Stats.total++;
        if (game.status === "mate") p2Stats.wins.mate++;
        else if (game.status === "invalid_move") p2Stats.wins.invalid_move++;
      } else if (game.status === "stalemate") {
        p1Stats.wins.stalemate++;
        p2Stats.wins.stalemate++;
      }
    });

    setStats({ player1: p1Stats, player2: p2Stats });
    setLoading(false);
  };

  const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: number; icon: any; color: string }) => (
    <div className={`flex items-center gap-3 p-4 rounded-lg border ${color}`}>
      <Icon className="w-6 h-6" />
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-8 flex flex-col">
      <div className="max-w-6xl mx-auto space-y-8 flex-1 w-full">
        <PageHeader />
        <div className="min-h-[600px] md:min-h-[600px]">
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">Battle Statistics</h1>
          <p className="text-muted-foreground text-lg">Compare player performance across finished games</p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Player 1</label>
              <Select value={player1} onValueChange={setPlayer1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select first player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem key={p} value={p} disabled={p === player2}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Player 2</label>
              <Select value={player2} onValueChange={setPlayer2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select second player" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem key={p} value={p} disabled={p === player1}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={fetchStats} disabled={!player1 || !player2 || loading} className="w-full" size="lg">
            <Swords className="w-4 h-4 mr-2" />
            {loading ? "Loading..." : "Compare Players"}
          </Button>
        </Card>

        {stats && (
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-6 space-y-6 border-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  <h2 className="text-3xl font-bold">{stats.player1.player}</h2>
                </div>
                <p className="text-muted-foreground">Total Wins: {stats.player1.total}</p>
              </div>

              <div className="space-y-3">
                <StatCard
                  label="Checkmate Wins"
                  value={stats.player1.wins.mate}
                  icon={Trophy}
                  color="border-primary"
                />
                <StatCard
                  label="Opponent Invalid Move"
                  value={stats.player1.wins.invalid_move}
                  icon={AlertTriangle}
                  color="border-destructive"
                />
                <StatCard
                  label="Stalemate Draws"
                  value={stats.player1.wins.stalemate}
                  icon={Handshake}
                  color="border-muted"
                />
              </div>
            </Card>

            <Card className="p-6 space-y-6 border-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  <h2 className="text-3xl font-bold">{stats.player2.player}</h2>
                </div>
                <p className="text-muted-foreground">Total Wins: {stats.player2.total}</p>
              </div>

              <div className="space-y-3">
                <StatCard
                  label="Checkmate Wins"
                  value={stats.player2.wins.mate}
                  icon={Trophy}
                  color="border-primary"
                />
                <StatCard
                  label="Opponent Invalid Move"
                  value={stats.player2.wins.invalid_move}
                  icon={AlertTriangle}
                  color="border-destructive"
                />
                <StatCard
                  label="Stalemate Draws"
                  value={stats.player2.wins.stalemate}
                  icon={Handshake}
                  color="border-muted"
                />
              </div>
            </Card>
          </div>
        )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
