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
  const { count: liveCount, refetch: refetchCount } = useLiveGameCount();

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
    
    // Also refresh the count when games refresh
    refetchCount();
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
      <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col">
        <div className="max-w-6xl mx-auto space-y-6 flex-1 w-full">
          {/* Navigation */}
          <nav className="flex gap-4 text-sm">
            <NavLink to="/" className="text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground font-medium">
              Leaderboard
            </NavLink>
            <NavLink to="/live" className="text-muted-foreground hover:text-foreground transition-colors flex items-center" activeClassName="text-foreground font-medium">
              Live Games
              <Badge className={`ml-1.5 border-0 px-1.5 py-0 text-xs ${liveCount > 0 ? 'bg-slate-700 text-cyan-400' : 'bg-slate-800 text-slate-600'}`}>
                {liveCount}
              </Badge>
            </NavLink>
            <NavLink to="/games" className="text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground font-medium">
              Game Replays
            </NavLink>
          </nav>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Live Games</h1>
            <p className="text-muted-foreground">
              Games currently in progress
            </p>
          </div>

          {/* Games Table */}
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading live games...</div>
          ) : games.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <p className="text-lg">No live games at the moment</p>
              <p className="text-sm mt-2">Games in progress will appear here</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400 uppercase text-xs tracking-wider">Game</TableHead>
                      <TableHead className="text-slate-400 uppercase text-xs tracking-wider">White</TableHead>
                      <TableHead className="text-slate-400 uppercase text-xs tracking-wider">Black</TableHead>
                      <TableHead className="text-slate-400 uppercase text-xs tracking-wider hidden md:table-cell">#Moves</TableHead>
                      <TableHead className="text-slate-400 uppercase text-xs tracking-wider hidden lg:table-cell">Test Type</TableHead>
                      <TableHead className="text-slate-400 uppercase text-xs tracking-wider hidden sm:table-cell">Started</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {games.map((game) => (
                      <TableRow
                        key={game.id}
                        className="cursor-pointer border-slate-700 hover:bg-slate-800/50 transition-colors"
                        onClick={() => window.location.href = `/games/${game.id}?from=live`}
                      >
                        <TableCell>
                          <Link
                            to={`/games/${game.id}?from=live`}
                            className="text-cyan-400 hover:text-cyan-300 hover:underline font-mono text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {game.id.slice(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium text-slate-200">{game.white_player || "-"}</TableCell>
                        <TableCell className="font-medium text-slate-200">{game.black_player || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell text-slate-300 font-mono">
                          {game.move_history?.length || 0}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                            {game.test_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-sm hidden sm:table-cell">
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
