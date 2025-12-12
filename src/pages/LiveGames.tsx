import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import Footer from "@/components/Footer";
import { useLiveGameCount } from "@/hooks/useLiveGameCount";

interface Game {
  id: string;
  white_player: string | null;
  black_player: string | null;
  status: string;
  test_type: string;
  created_at: string;
  move_history: string[];
}

export default function LiveGames() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const { count: liveCount } = useLiveGameCount();

  useEffect(() => {
    fetchGames();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchGames = async () => {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from("games")
      .select("id, white_player, black_player, status, test_type, created_at, move_history")
      .eq("status", "continue")
      .gte("created_at", eightHoursAgo)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching live games:", error);
    } else {
      setGames(data || []);
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="min-h-screen bg-background p-8 flex flex-col">
        <div className="max-w-6xl mx-auto space-y-8 flex-1 w-full">
          {/* Navigation */}
          <nav className="flex gap-4 text-sm">
            <NavLink to="/" className="text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground font-medium">
              Leaderboard
            </NavLink>
            <NavLink to="/live" className="text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground font-medium">
              Live Games
              {liveCount > 0 && (
                <Badge className="ml-1.5 bg-cyan-500 text-white border-0 px-1.5 py-0 text-xs animate-pulse">
                  {liveCount}
                </Badge>
              )}
            </NavLink>
            <NavLink to="/games" className="text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground font-medium">
              Game Replays
            </NavLink>
          </nav>

          <div className="mb-4">
            <h1 className="text-3xl font-bold text-foreground">Live Games</h1>
            <p className="text-muted-foreground mt-1">Games currently in progress (started within the last 8 hours)</p>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground">Loading live games...</div>
          ) : games.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-lg">No live games at the moment</p>
              <p className="text-sm mt-2">Games in progress will appear here</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-muted-foreground">Game ID</TableHead>
                      <TableHead className="text-muted-foreground">White</TableHead>
                      <TableHead className="text-muted-foreground">Black</TableHead>
                      <TableHead className="text-muted-foreground text-center">#Moves</TableHead>
                      <TableHead className="text-muted-foreground">Test Type</TableHead>
                      <TableHead className="text-muted-foreground">Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {games.map((game) => (
                      <TableRow key={game.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <Link
                            to={`/games/${game.id}`}
                            className="text-cyan-400 hover:text-cyan-300 font-mono text-sm"
                          >
                            {game.id.substring(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          {game.white_player || "Unknown"}
                        </TableCell>
                        <TableCell className="text-foreground font-medium">
                          {game.black_player || "Unknown"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {game.move_history.length}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {game.test_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(game.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
