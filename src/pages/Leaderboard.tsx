import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import Footer from "@/components/Footer";
import { NavLink } from "@/components/NavLink";
import siliconGambitHero from "@/assets/silicon-gambit-hero.png";
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
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const getProviderFromModel = (modelName: string): {
  provider: string;
  logo: React.ReactNode;
} => {
  const name = modelName.toLowerCase();

  // OpenAI models
  if (name.includes('gpt') || name.includes('openai') || name.includes('o1') || name.includes('o3')) {
    return {
      provider: 'OpenAI',
      logo: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364l2.0201-1.1638a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
        </svg>
    };
  }

  // Anthropic models (Claude)
  if (name.includes('claude') || name.includes('anthropic')) {
    return {
      provider: 'Anthropic',
      logo: <svg viewBox="0 0 96 96" className="w-4 h-4" fill="currentColor">
          <path d="m55.1553 15.728 25.733 64.5443h14.1116L69.2669 15.728H55.1553Z" />
          <path d="m25.3015 54.7311 8.805 -22.6826 8.8051 22.6826H25.3015ZM26.729 15.728 1 80.2723h14.3861l5.262 -13.5544h26.9177l5.2611 13.5544h14.3862L41.484 15.728H26.729Z" />
        </svg>
    };
  }

  // Google models
  if (name.includes('gemini') || name.includes('google') || name.includes('palm')) {
    return {
      provider: 'Google',
      logo: <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    };
  }

  // Moonshot/Kimi models (crescent moon logo)
  if (name.includes('kimi') || name.includes('moonshot')) {
    return {
      provider: 'Kimi',
      logo: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" />
        </svg>
    };
  }

  // Meta/Llama models
  if (name.includes('llama') || name.includes('meta')) {
    return {
      provider: 'Meta',
      logo: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.19 2.24.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 0 0 8.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
        </svg>
    };
  }

  // DeepSeek models
  if (name.includes('deepseek')) {
    return {
      provider: 'DeepSeek',
      logo: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M12 6v6l4 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    };
  }

  // Mistral models
  if (name.includes('mistral') || name.includes('mixtral')) {
    return {
      provider: 'Mistral',
      logo: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <rect x="2" y="4" width="4" height="4" />
          <rect x="10" y="4" width="4" height="4" />
          <rect x="18" y="4" width="4" height="4" />
          <rect x="6" y="10" width="4" height="4" />
          <rect x="14" y="10" width="4" height="4" />
          <rect x="2" y="16" width="4" height="4" />
          <rect x="10" y="16" width="4" height="4" />
          <rect x="18" y="16" width="4" height="4" />
        </svg>
    };
  }

  // xAI/Grok models
  if (name.includes('grok') || name.includes('xai')) {
    return {
      provider: 'xAI',
      logo: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    };
  }

  // Default/Unknown
  return {
    provider: 'Unknown',
    logo: <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z" />
      </svg>
  };
};
export default function Leaderboard() {
  const [leaderboards, setLeaderboards] = useState<TestTypeLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchLeaderboard();
  }, []);
  const fetchLeaderboard = async () => {
    try {
      const {
        data: games,
        error
      } = await supabase.from('games').select('*').neq('status', 'continue').order('created_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching games:', error);
        return;
      }
      if (!games || games.length === 0) {
        setLeaderboards([]);
        return;
      }

      // Group games by test_type
      const testTypeGroups = new Map<string, {
        games: typeof games;
        testDesc: string;
      }>();
      games.forEach(game => {
        const testType = game.test_type || 'Unknown';
        if (!testTypeGroups.has(testType)) {
          testTypeGroups.set(testType, {
            games: [],
            testDesc: game.test_desc || 'Unknown'
          });
        }
        testTypeGroups.get(testType)!.games.push(game);
      });

      // Calculate stats for each test type
      const leaderboardsByType: TestTypeLeaderboard[] = [];
      testTypeGroups.forEach((groupData, testType) => {
        const playerStatsMap = new Map<string, PlayerStats>();
        groupData.games.forEach(game => {
          const whitePlayer = game.white_player;
          const blackPlayer = game.black_player;

          // Initialize players if they don't exist
          if (whitePlayer && !playerStatsMap.has(whitePlayer)) {
            playerStatsMap.set(whitePlayer, {
              player: whitePlayer,
              wins: 0,
              losses: 0,
              draws: 0,
              points: 0,
              invalidMoveLosses: 0,
              invalidMoveRounds: [],
              maxValidMoves: 0
            });
          }
          if (blackPlayer && !playerStatsMap.has(blackPlayer)) {
            playerStatsMap.set(blackPlayer, {
              player: blackPlayer,
              wins: 0,
              losses: 0,
              draws: 0,
              points: 0,
              invalidMoveLosses: 0,
              invalidMoveRounds: [],
              maxValidMoves: 0
            });
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
          const whiteAdjusted = game.status === "invalid_move" && game.winner === "black" ? whiteValidMoves - 1 : whiteValidMoves;
          const blackAdjusted = game.status === "invalid_move" && game.winner === "white" ? blackValidMoves - 1 : blackValidMoves;

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
          players: sortedPlayers
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
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.5)]">
          <Trophy className="w-5 h-5 text-yellow-900" />
        </div>;
    }
    if (rank === 2) {
      return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-[0_0_10px_rgba(148,163,184,0.4)]">
          <Trophy className="w-5 h-5 text-slate-700" />
        </div>;
    }
    if (rank === 3) {
      return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-[0_0_10px_rgba(180,83,9,0.4)]">
          <Trophy className="w-5 h-5 text-amber-200" />
        </div>;
    }
    return <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
        <span className="text-sm font-bold text-slate-400">#{rank}</span>
      </div>;
  };
  const getComplianceBar = (invalidMoves: number, totalGames: number) => {
    const maxInvalid = 25;
    const percentage = Math.min(invalidMoves / maxInvalid * 100, 100);
    const isCritical = invalidMoves >= 15;
    const isWarning = invalidMoves >= 5 && invalidMoves < 15;
    return <div className="flex items-center gap-2">
        <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isCritical ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : isWarning ? 'bg-amber-500' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'}`} style={{
          width: `${percentage}%`
        }} />
        </div>
        <span className={`text-sm font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
          {invalidMoves}
        </span>
        {isCritical && <span className="text-xs text-red-400">💀</span>}
      </div>;
  };
  return <>
    <div className="min-h-screen bg-background p-8 flex flex-col overflow-x-hidden">
      <div className="max-w-6xl mx-auto space-y-8 flex-1 w-full">
        {/* Navigation */}
        <nav className="flex gap-4 text-sm">
          <NavLink to="/" className="text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground font-medium">
            Leaderboard
          </NavLink>
          <NavLink to="/games" className="text-muted-foreground hover:text-foreground transition-colors" activeClassName="text-foreground font-medium">
            Game Replays
          </NavLink>
        </nav>

        <div className="text-center space-y-3 max-w-full overflow-hidden">
          <img src={siliconGambitHero} alt="The Silicon Gambit - High-Stakes LLM Chess Benchmark" className="w-full rounded-lg shadow-lg" />
          <div className="text-muted-foreground text-base mt-4 text-left space-y-4">
            <p className="text-lg font-semibold text-foreground">The "Blindfold Paradox": Why hiding the board improved reasoning.</p>
            <p>We tested the top LLMs in a brutally simple way: one invalid move = game over.
            </p>
            <p>The strange part? Models play better blindfolded — when they can't see the board.</p>
            <p>This highlights a critical distinction for AI Engineers and PMs: the difference between the brittle pattern matching of static inputs and the deep sequential reasoning required for reliable, state-aware AI agents.</p>
          </div>
        </div>

        {loading ? <div className="text-center text-muted-foreground">Loading leaderboard...</div> : leaderboards.length === 0 ? <div className="text-center text-muted-foreground">No completed games yet</div> : <div className="space-y-12">
            {leaderboards.map((testLeaderboard, testIndex) => <div key={testLeaderboard.testType} className="max-w-full">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-2">🧪 Experiment {testIndex + 1}: {testLeaderboard.testType}</h2>
                  <div className="text-sm text-muted-foreground space-y-2 break-words">
                    {testLeaderboard.testDesc.split(/<br\s*\/?>/).map((segment, segIndex) => <p key={segIndex}>
                        {segment.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                      </p>)}
                  </div>
                </div>


                <Card className="overflow-hidden bg-slate-900 border-slate-700 min-w-0">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-transparent">
                        <TableHead className="w-20 text-slate-400 uppercase text-xs tracking-wider">Rank</TableHead>
                        <TableHead className="text-slate-400 uppercase text-xs tracking-wider">Model</TableHead>
                        <TableHead className="text-center text-slate-400 uppercase text-xs tracking-wider">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span className="md:hidden">W</span>
                            <span className="hidden md:inline">Won</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-center text-slate-400 uppercase text-xs tracking-wider">
                          <div className="flex items-center justify-center gap-1">
                            <TrendingDown className="w-3 h-3" />
                            <span className="md:hidden">L</span>
                            <span className="hidden md:inline">Lost</span>
                          </div>
                        </TableHead>
                        <TableHead className="text-slate-400 uppercase text-xs tracking-wider">Invalid Moves</TableHead>
                        <TableHead className="hidden lg:table-cell text-center text-slate-400 uppercase text-xs tracking-wider">Avg Fail</TableHead>
                        <TableHead className="hidden lg:table-cell text-center text-slate-400 uppercase text-xs tracking-wider">Med Fail</TableHead>
                        <TableHead className="text-center text-slate-400 uppercase text-xs tracking-wider">Max Moves</TableHead>
                        <TableHead className="hidden lg:table-cell text-center text-slate-400 uppercase text-xs tracking-wider">Draws</TableHead>
                        <TableHead className="text-center text-slate-400 uppercase text-xs tracking-wider">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testLeaderboard.players.map((player, index) => <TableRow key={player.player} className={`border-slate-700/50 transition-colors hover:bg-slate-800 ${index < 3 ? 'bg-slate-800/30' : ''}`}>
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center">
                              {getRankBadge(index + 1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                                {getProviderFromModel(player.player).logo}
                              </div>
                              <span className="font-semibold text-slate-100 text-base">{player.player}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Link to={`/games?winner=${encodeURIComponent(player.player)}&testType=${encodeURIComponent(testLeaderboard.testType)}`} className="text-emerald-400 font-bold hover:text-emerald-300 hover:underline transition-colors">
                              {player.wins}
                            </Link>
                          </TableCell>
                          <TableCell className="text-center">
                            <Link to={`/games?loser=${encodeURIComponent(player.player)}&testType=${encodeURIComponent(testLeaderboard.testType)}`} className="text-red-400 font-bold hover:text-red-300 hover:underline transition-colors">
                              {player.losses}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link to={`/games?loser=${encodeURIComponent(player.player)}&invalidMove=true&testType=${encodeURIComponent(testLeaderboard.testType)}`} className="hover:opacity-80 hover:underline decoration-white transition-opacity">
                              {getComplianceBar(player.invalidMoveLosses, player.wins + player.losses)}
                            </Link>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-center text-slate-400 text-sm">
                            {player.invalidMoveRounds.length > 0 ? (player.invalidMoveRounds.reduce((a, b) => a + b, 0) / player.invalidMoveRounds.length).toFixed(1) : '-'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-center text-slate-400 text-sm">
                            {player.invalidMoveRounds.length > 0 ? calculateMedian(player.invalidMoveRounds)?.toFixed(1) : '-'}
                          </TableCell>
                          <TableCell className="text-center text-slate-400 text-sm">
                            {player.maxValidMoves > 0 ? player.maxValidMoves : '-'}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-center text-slate-400 text-sm">
                            {player.draws}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`text-xl font-black ${player.points > 0 ? "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" : player.points < 0 ? "text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]" : "text-slate-400"}`}>
                              {player.points > 0 ? "+" : ""}{player.points}
                            </span>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                    </Table>
                  </div>
                </Card>
              </div>)}
          </div>}

        {/* Divider between leaderboards and info cards */}
        <div className="mt-8 mb-8 border-t border-slate-700/50" />

        {/* Discussion & Analysis Section */}
        <h2 className="text-2xl font-bold mb-6">Discussion & Analysis</h2>

        {/* Best LLMs for AI Agents Card */}
        <Card className="mb-6 p-6 border-l-4 border-l-emerald-400 bg-slate-800 shadow-lg shadow-emerald-500/10">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-white">
            <span>🤖</span> Best LLMs for AI Agents
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              Chess obviously depends on training data, but two parts of this test map directly to real agent behavior: <strong className="text-white">output discipline</strong> and <strong className="text-white">state consistency</strong>.
            </p>
            
            <div className="space-y-3 pl-4 border-l-2 border-emerald-400/40">
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-emerald-400 font-semibold">Output discipline:</strong> GPT-5.1 and Gemini-3 Pro were the only models that consistently produced long games (32+ moves) without breaking the strict SAN format. In production this is the same skill as returning clean JSON, tool calls, or structured outputs without drifting into extra text.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                <strong className="text-emerald-400 font-semibold">State consistency:</strong> Blindfold chess forces the model to track world-state purely from the running conversation (models always see the full history: every prompt, every move they made.) A model that can keep a coherent narrative over many steps is exactly what you need for reliable multi-step agents.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-sm text-slate-400 mb-2">I've written about this in:</p>
              <ul className="space-y-1">
                <li>
                  <a href="https://www.productcompass.pm/p/ai-agents-101" target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
                    How to Build an Autonomous AI Agent →
                  </a>
                </li>
                <li>
                  <a href="https://www.productcompass.pm/p/building-ai-agents-best-practices" target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline transition-colors">
                    1/4 Principles of Building AI Agents & Best LLMs →
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Kimi-k2 Reality Check Card */}
        <Card className="mb-6 p-6 border-l-4 border-l-amber-400 bg-slate-800 shadow-lg shadow-amber-500/10">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2 text-white">
            <span>⚠️</span> The Kimi-k2 Reality Check
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              Kimi-K2 lost often because it violated simple constraints: apologizing mid-game, inventing board states, or mixing reasoning with output.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              This isn't about conversational polish.
            </p>
            <div className="rounded-lg p-4 border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.15)]">
              <p className="text-sm text-white font-medium leading-relaxed">
                A model that can't follow a basic negative rule (<span className="text-amber-400">"don't add anything else"</span>) can't be trusted with write-access in production workflows.
              </p>
            </div>
          </div>
        </Card>

        {/* The Blindfold Paradox - Flagship Card */}
        <Card className="mb-8 p-6 border-l-4 border-l-cyan-400 bg-slate-800 shadow-lg shadow-cyan-500/20">
          <h2 className="text-xl font-semibold mb-1 flex items-center gap-2 text-white">
            <span>🦄</span> The Blindfold Paradox
          </h2>
          <p className="text-base text-slate-400 italic mb-5">Why hiding the board improved reasoning performance.</p>
          
          <div className="space-y-5">
            {/* The Discovery */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-cyan-400 mb-2">The Discovery</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Contrary to expectation, top models perform significantly better in <strong className="text-white font-semibold">Blind Mode</strong> (conversation history only) than when given the exact board state (FEN).
              </p>
            </div>
            
            {/* The Hypothesis */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-cyan-400 mb-3">The Hypothesis</h3>
              <div className="space-y-3 pl-4 border-l-2 border-cyan-400/40">
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-cyan-400 font-semibold">Sequential Derivation {">"} Static Decoding:</strong> LLMs are autoregressive models trained on sequences (PGN), not static snapshots. When playing from history, the model derives the current state incrementally, effectively using the context window as a working memory.
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  <strong className="text-cyan-400 font-semibold">The "Decompression" Penalty:</strong> FEN strings are a compressed format (e.g., <code className="text-emerald-400 font-mono text-xs">8/8/4P3</code>). To understand the board, the model must perform spatial arithmetic—a known weakness of Transformer architecture. Giving the model a FEN forces it to decode a compressed state (math), whereas history allows it to track state changes (narrative).
                </p>
              </div>
            </div>
            
            {/* The Verdict */}
            <div className="rounded-lg p-4 border border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-cyan-400 mb-2">The Verdict</h3>
              <p className="text-sm text-white font-medium leading-relaxed">
                Asking the AI to "imagine" the board aligns with its architecture; asking it to "see" the compressed board fights against it.
              </p>
            </div>
          </div>
        </Card>

        {/* Definitions & Standards - Terminal Style */}
        <Card className="mt-8 mb-20 p-6 md:p-8 bg-slate-900 border-slate-700">
          <h2 className="text-xl font-bold mb-6 text-cyan-400">
            Standards and Definitions
          </h2>
          <div className="space-y-0">
            {/* FEN Definition */}
            <div className="py-6">
              <h3 className="text-lg font-semibold mb-1 text-cyan-400">
                FEN (Forsyth-Edwards Notation)
              </h3>
              <p className="text-sm text-slate-200 mb-3">
                The Compression Challenge
              </p>
              <p className="text-sm text-slate-400 mb-4">
                A text string that uses Run-Length Encoding (RLE) to represent a static board state.
              </p>
              <div className="bg-slate-800/80 rounded-md p-3 mb-4 border border-slate-600 overflow-x-auto">
                <code className="text-[14px] font-mono text-emerald-400 whitespace-nowrap">
                  rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
                </code>
              </div>
              <div className="mt-4 border-l-2 border-amber-500 pl-4 py-3 bg-slate-800/50 rounded-r-md">
                <p className="text-sm text-slate-300">
                  <strong className="text-amber-400">The Bottleneck:</strong> The number <code className="text-emerald-400 font-mono text-[14px]">8</code> represents eight empty squares. To "see" the board, the model must perform spatial decompression (arithmetic) rather than pattern matching—a task that exploits a known weakness in Transformer architecture.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* SAN Definition */}
            <div className="py-6">
              <h3 className="text-lg font-semibold mb-1 text-cyan-400">
                SAN (Standard Algebraic Notation)
              </h3>
              <p className="text-sm text-slate-200 mb-3">
                The Output Protocol
              </p>
              <p className="text-sm text-slate-400 mb-4">
                The strict syntax required for all moves.
              </p>
              <div className="bg-slate-800/80 rounded-md p-3 mb-4 border border-slate-600 flex flex-wrap gap-3 items-center">
                <code className="text-[14px] font-mono text-emerald-400">e4</code>
                <code className="text-[14px] font-mono text-emerald-400">Nf3</code>
                <code className="text-[14px] font-mono text-emerald-400">O-O</code>
                <span className="text-xs text-slate-400">(Castle)</span>
                <code className="text-[14px] font-mono text-emerald-400">Qh5+</code>
                <span className="text-xs text-slate-400">(Check)</span>
              </div>
              <div className="mt-4 border-l-2 border-red-500 pl-4 py-3 bg-slate-800/50 rounded-r-md">
                <p className="text-sm text-slate-300">
                  <strong className="text-red-400">Strict Compliance:</strong> This serves as the API contract. Any output containing conversational filler (<em className="text-slate-400">"Here is my move..."</em>), markdown blocks, or invalid syntax results in an <strong className="text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]">Automatic Loss</strong>. This tests the model's ability to respect negative constraints under pressure.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* PGN Definition */}
            <div className="py-6">
              <h3 className="text-lg font-semibold mb-1 text-cyan-400">
                PGN (Portable Game Notation)
              </h3>
              <p className="text-sm text-slate-200 mb-3">
                The Sequential Context
              </p>
              <p className="text-sm text-slate-400 mb-4">
                The file standard for recording move history.
              </p>
              <div className="bg-slate-800/80 rounded-md p-3 mb-4 border border-slate-600 overflow-x-auto">
                <code className="text-[14px] font-mono text-emerald-400 whitespace-nowrap">
                  1. e4 e5 2. Nf3 Nc6
                </code>
              </div>
              <div className="mt-4 border-l-2 border-cyan-500 pl-4 py-3 bg-slate-800/50 rounded-r-md">
                <p className="text-sm text-slate-300">
                  <strong className="text-cyan-400">Alignment:</strong> This is the native "language" of LLM training data. Unlike FEN, PGN represents state as a narrative sequence, allowing the model to use autoregressive prediction to track the game state naturally.
                </p>
              </div>
            </div>
          </div>
        </Card>

      </div>
    </div>
    <Footer />
    </>;
}