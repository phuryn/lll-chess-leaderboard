import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Footer from "@/components/Footer";
import { NavLink } from "@/components/NavLink";

interface Game {
  id: string;
  white_player: string | null;
  black_player: string | null;
  winner: string | null;
  status: string;
  test_type: string;
  created_at: string;
}

const GAMES_PER_PAGE = 25;

export default function Games() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<string[]>([]);

  // Filters from URL
  const winnerFilter = searchParams.get("winner") || "";
  const loserFilter = searchParams.get("loser") || "";
  const invalidMoveFilter = searchParams.get("invalidMove") === "true";
  const testTypeFilter = searchParams.get("testType") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("id, white_player, black_player, winner, status, test_type, created_at")
        .neq("status", "continue")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching games:", error);
        return;
      }

      setGames(data || []);

      // Extract unique players
      const allPlayers = new Set<string>();
      data?.forEach((game) => {
        if (game.white_player) allPlayers.add(game.white_player);
        if (game.black_player) allPlayers.add(game.black_player);
      });
      setPlayers(Array.from(allPlayers).sort());
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      // Winner filter
      if (winnerFilter) {
        const winningPlayer = game.winner === "white" ? game.white_player : game.black_player;
        if (winningPlayer !== winnerFilter) return false;
      }

      // Loser filter
      if (loserFilter) {
        const losingPlayer = game.winner === "white" ? game.black_player : game.white_player;
        if (losingPlayer !== loserFilter) return false;
      }

      // Invalid move filter
      if (invalidMoveFilter && game.status !== "invalid_move") return false;

      // Test type filter
      if (testTypeFilter && game.test_type !== testTypeFilter) return false;

      return true;
    });
  }, [games, winnerFilter, loserFilter, invalidMoveFilter, testTypeFilter]);

  const totalPages = Math.ceil(filteredGames.length / GAMES_PER_PAGE);
  const paginatedGames = filteredGames.slice((page - 1) * GAMES_PER_PAGE, page * GAMES_PER_PAGE);

  const testTypes = useMemo(() => {
    return Array.from(new Set(games.map((g) => g.test_type))).sort();
  }, [games]);

  const updateFilter = (key: string, value: string | boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "" || value === false) {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value));
    }
    newParams.set("page", "1"); // Reset to first page on filter change
    setSearchParams(newParams);
  };

  const goToPage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
  };

  const getWinnerName = (game: Game) => {
    if (!game.winner) return "-";
    return game.winner === "white" ? game.white_player : game.black_player;
  };

  const getInvalidMovePlayer = (game: Game) => {
    if (game.status !== "invalid_move") return "-";
    // The loser made the invalid move
    return game.winner === "white" ? game.black_player : game.white_player;
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
            <NavLink
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground font-medium"
            >
              Leaderboard
            </NavLink>
            <NavLink
              to="/games"
              className="text-muted-foreground hover:text-foreground transition-colors"
              activeClassName="text-foreground font-medium"
            >
              Game Browser
            </NavLink>
          </nav>

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Game Browser</h1>
            <p className="text-muted-foreground">
              Browse all completed games with filtering options
            </p>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Winner:</span>
                <Select value={winnerFilter || "all"} onValueChange={(v) => updateFilter("winner", v === "all" ? "" : v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All players" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All players</SelectItem>
                    {players.map((player) => (
                      <SelectItem key={player} value={player}>
                        {player}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Loser:</span>
                <Select value={loserFilter || "all"} onValueChange={(v) => updateFilter("loser", v === "all" ? "" : v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All players" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All players</SelectItem>
                    {players.map((player) => (
                      <SelectItem key={player} value={player}>
                        {player}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Test Type:</span>
                <Select value={testTypeFilter || "all"} onValueChange={(v) => updateFilter("testType", v === "all" ? "" : v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {testTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="invalidMove"
                  checked={invalidMoveFilter}
                  onCheckedChange={(checked) => updateFilter("invalidMove", checked === true)}
                />
                <label htmlFor="invalidMove" className="text-sm text-muted-foreground cursor-pointer">
                  Lost by invalid move
                </label>
              </div>
            </div>
          </Card>

          {/* Games Table */}
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading games...</div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No games match the filters</div>
          ) : (
            <>
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Game</TableHead>
                      <TableHead>White Player</TableHead>
                      <TableHead>Black Player</TableHead>
                      <TableHead>Winner</TableHead>
                      <TableHead>Invalid Move</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedGames.map((game) => (
                      <TableRow
                        key={game.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => window.location.href = `/games/${game.id}`}
                      >
                        <TableCell>
                          <Link
                            to={`/games/${game.id}`}
                            className="text-primary hover:underline font-mono text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {game.id.slice(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{game.white_player || "-"}</TableCell>
                        <TableCell className="font-medium">{game.black_player || "-"}</TableCell>
                        <TableCell>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {getWinnerName(game)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={game.status === "invalid_move" ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground"}>
                            {getInvalidMovePlayer(game)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
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
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
