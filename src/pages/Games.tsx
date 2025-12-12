import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Footer from "@/components/Footer";
import { NavLink } from "@/components/NavLink";
import { useLiveGameCount } from "@/hooks/useLiveGameCount";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Game {
  id: string;
  white_player: string | null;
  black_player: string | null;
  winner: string | null;
  status: string;
  test_type: string;
  created_at: string;
  move_history: string[];
}

const GAMES_PER_PAGE = 25;

function GamesNav() {
  const { count: liveCount } = useLiveGameCount();
  
  return (
    <nav className="flex gap-4 text-sm">
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

// Multi-select filter component
function MultiSelectFilter({ 
  label, 
  options, 
  selected, 
  onChange 
}: { 
  label: string; 
  options: string[]; 
  selected: string[]; 
  onChange: (values: string[]) => void;
}) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full justify-between bg-slate-800 border-slate-600 text-slate-100 hover:bg-slate-700 hover:text-slate-100"
        >
          <span className="truncate">
            {selected.length === 0 ? "All players" : `${selected.length} selected`}
          </span>
          {selected.length > 0 && (
            <X 
              className="h-4 w-4 ml-2 shrink-0 opacity-50 hover:opacity-100" 
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 bg-slate-800 border-slate-600" align="start">
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {options.map((option) => (
            <div
              key={option}
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700 cursor-pointer"
              onClick={() => toggleOption(option)}
            >
              <Checkbox
                checked={selected.includes(option)}
                className="border-slate-500 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
              />
              <span className="text-sm text-slate-200 truncate">{option}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Games() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<string[]>([]);

  // Filters from URL (now arrays for multi-select)
  const winnerFilter = searchParams.get("winner")?.split(",").filter(Boolean) || [];
  const loserFilter = searchParams.get("loser")?.split(",").filter(Boolean) || [];
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
        .select("id, white_player, black_player, winner, status, test_type, created_at, move_history")
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
      // Winner filter (multi-select)
      if (winnerFilter.length > 0) {
        const winningPlayer = game.winner === "white" ? game.white_player : game.black_player;
        if (!winningPlayer || !winnerFilter.includes(winningPlayer)) return false;
      }

      // Loser filter (multi-select)
      if (loserFilter.length > 0) {
        const losingPlayer = game.winner === "white" ? game.black_player : game.white_player;
        if (!losingPlayer || !loserFilter.includes(losingPlayer)) return false;
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

  const updateFilter = (key: string, value: string | boolean | string[]) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "" || value === false || (Array.isArray(value) && value.length === 0)) {
      newParams.delete(key);
    } else if (Array.isArray(value)) {
      newParams.set(key, value.join(","));
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
          <GamesNav />

          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Game Replays</h1>
            <p className="text-muted-foreground">
              Browse all completed games with filtering options
            </p>
          </div>

          {/* Filters */}
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Winner</label>
                <MultiSelectFilter
                  label="Winner"
                  options={players}
                  selected={winnerFilter}
                  onChange={(values) => updateFilter("winner", values)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Loser</label>
                <MultiSelectFilter
                  label="Loser"
                  options={players}
                  selected={loserFilter}
                  onChange={(values) => updateFilter("loser", values)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 uppercase tracking-wider">Test Type</label>
                <Select value={testTypeFilter || "all"} onValueChange={(v) => updateFilter("testType", v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full bg-slate-800 border-slate-600 text-slate-100">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-600 text-slate-100">
                    <SelectItem value="all" className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">All types</SelectItem>
                    {testTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-slate-100 focus:bg-slate-700 focus:text-slate-100">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <div className="flex items-center gap-2 h-10">
                  <Checkbox
                    id="invalidMove"
                    checked={invalidMoveFilter}
                    onCheckedChange={(checked) => updateFilter("invalidMove", checked === true)}
                    className="border-slate-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                  />
                  <label htmlFor="invalidMove" className="text-sm text-slate-300 cursor-pointer">
                    Lost by invalid move
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Games Table */}
          {loading ? (
            <div className="text-center text-slate-400 py-8">Loading games...</div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center text-slate-400 py-8">No games match the filters</div>
          ) : (
            <>
              <div className="bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-transparent">
                        <TableHead className="text-slate-400 uppercase text-xs tracking-wider">Game</TableHead>
                        <TableHead className="text-slate-400 uppercase text-xs tracking-wider">White</TableHead>
                        <TableHead className="text-slate-400 uppercase text-xs tracking-wider">Black</TableHead>
                        <TableHead className="text-slate-400 uppercase text-xs tracking-wider">Winner</TableHead>
                        <TableHead className="text-slate-400 uppercase text-xs tracking-wider hidden md:table-cell">#Moves</TableHead>
                        <TableHead className="text-slate-400 uppercase text-xs tracking-wider hidden lg:table-cell">Test Type</TableHead>
                        <TableHead className="text-slate-400 uppercase text-xs tracking-wider hidden sm:table-cell">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedGames.map((game) => (
                        <TableRow
                          key={game.id}
                          className="cursor-pointer border-slate-700 hover:bg-slate-800/50 transition-colors"
                          onClick={() => window.location.href = `/games/${game.id}`}
                        >
                          <TableCell>
                            <Link
                              to={`/games/${game.id}`}
                              className="text-cyan-400 hover:text-cyan-300 hover:underline font-mono text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {game.id.slice(0, 8)}...
                            </Link>
                          </TableCell>
                          <TableCell className="font-medium text-slate-200">{game.white_player || "-"}</TableCell>
                          <TableCell className="font-medium text-slate-200">{game.black_player || "-"}</TableCell>
                          <TableCell>
                            <span className="text-green-400 font-medium" style={{ textShadow: "0 0 10px rgba(74, 222, 128, 0.5)" }}>
                              {getWinnerName(game)}
                            </span>
                          </TableCell>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  <span className="text-sm text-slate-400">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    className="bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-slate-100 disabled:opacity-50"
                  >
                    <span className="hidden sm:inline">Next</span>
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
