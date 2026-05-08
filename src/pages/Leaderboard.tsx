import { useState } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Trophy, Rocket, TrendingUp, Flame, Award, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";
import { useFakeLeaderboard, FakePlayer, getPlayerRecentGames } from "@/hooks/useFakeLeaderboard";

const ComingSoonView = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto">
    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
      <Trophy className="w-10 h-10 text-primary" />
    </div>
    <h1 className="text-3xl font-bold mb-3">Leader<span className="text-gradient">board</span></h1>
    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
      <Rocket className="w-8 h-8 text-accent animate-bounce" />
    </div>
    <p className="text-muted-foreground mb-6">
      The leaderboard will go live once LootBoxx launches in your region. Sign up now to compete for the top spot!
    </p>
    <div className="flex gap-3 justify-center">
      <Link to="/signup"><Button className="button-gradient">Sign Up Now</Button></Link>
      <Link to="/"><Button variant="outline">Back to Home</Button></Link>
    </div>
  </motion.div>
);

type TimeFilter = "daily" | "weekly" | "monthly" | "all-time";

const PlayerProfileDialog = ({ player, onClose }: { player: FakePlayer | null; onClose: () => void }) => {
  if (!player) return null;
  const games = getPlayerRecentGames(player.seed, player.win_rate, 8);
  const winRatePct = Math.round(player.win_rate * 100);
  const monthlyGrowth = player.daily_growth * 30;

  return (
    <Dialog open={!!player} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            {player.player_name}
            <Badge variant="secondary" className="ml-auto">Rank #{player.rank}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Award className="w-3 h-3" /> Base winnings
              </div>
              <p className="font-bold text-foreground">₦{player.base_winnings.toLocaleString()}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <TrendingUp className="w-3 h-3" /> Daily growth
              </div>
              <p className="font-bold text-emerald-500">+₦{player.daily_growth.toLocaleString()}/day</p>
              <p className="text-[10px] text-muted-foreground">~₦{monthlyGrowth.toLocaleString()}/mo</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Flame className="w-3 h-3" /> Current streak
              </div>
              <p className="font-bold text-orange-500">{player.current_streak} 🔥</p>
              <p className="text-[10px] text-muted-foreground">Best: {player.longest_streak}</p>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Gamepad2 className="w-3 h-3" /> Win rate
              </div>
              <p className="font-bold text-foreground">{winRatePct}%</p>
              <p className="text-[10px] text-muted-foreground">{player.wins}/{player.games_played} games</p>
            </Card>
          </div>

          <Card className="p-3 bg-primary/5 border-primary/20">
            <p className="text-xs text-muted-foreground">Total winnings</p>
            <p className="text-2xl font-bold text-primary">₦{player.total_winnings.toLocaleString()}</p>
          </Card>

          <div>
            <h4 className="text-sm font-semibold mb-2">Recent games</h4>
            <div className="space-y-1.5">
              {games.map((g, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2 px-3 rounded-md bg-muted/40">
                  <div>
                    <p className="font-medium">{g.game}</p>
                    <p className="text-[10px] text-muted-foreground">{g.timeAgo}</p>
                  </div>
                  <p className={`font-bold ${g.result === "win" ? "text-emerald-500" : "text-muted-foreground"}`}>
                    {g.result === "win" ? "+" : "-"}₦{g.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LiveLeaderboardView = () => {
  const { leaders: allLeaders } = useFakeLeaderboard(50);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all-time");
  const [selected, setSelected] = useState<FakePlayer | null>(null);

  // Simulate different data per time filter by slicing/scaling
  const getFilteredLeaders = (): FakePlayer[] => {
    switch (timeFilter) {
      case "daily":
        return allLeaders.slice(0, 10).map((p, i) => ({
          ...p,
          rank: i + 1,
          total_winnings: Math.floor(p.total_winnings * 0.05),
          games_played: Math.max(1, Math.floor(p.games_played * 0.05)),
          wins: Math.max(0, Math.floor(p.wins * 0.05)),
        }));
      case "weekly":
        return allLeaders.slice(0, 15).map((p, i) => ({
          ...p,
          rank: i + 1,
          total_winnings: Math.floor(p.total_winnings * 0.25),
          games_played: Math.max(1, Math.floor(p.games_played * 0.25)),
          wins: Math.max(0, Math.floor(p.wins * 0.25)),
        }));
      case "monthly":
        return allLeaders.slice(0, 20).map((p, i) => ({
          ...p,
          rank: i + 1,
          total_winnings: Math.floor(p.total_winnings * 0.6),
          games_played: Math.max(1, Math.floor(p.games_played * 0.6)),
          wins: Math.max(0, Math.floor(p.wins * 0.6)),
        }));
      default:
        return allLeaders.slice(0, 20);
    }
  };

  const leaders = getFilteredLeaders();

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const filterLabels: Record<TimeFilter, string> = {
    "daily": "Today",
    "weekly": "This Week",
    "monthly": "This Month",
    "all-time": "All Time",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-center mb-2">🏆 Leaderboard</h1>
      <p className="text-muted-foreground text-center mb-4">Top players by total winnings</p>

      <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)} className="mb-6">
        <TabsList className="w-full grid grid-cols-4">
          {(Object.keys(filterLabels) as TimeFilter[]).map((key) => (
            <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">
              {filterLabels[key]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center mb-4">Tap a player to view their profile</p>

      <div className="space-y-2">
        {leaders.map((player) => (
          <Card
            key={`${timeFilter}-${player.rank}`}
            onClick={() => setSelected(player)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelected(player)}
            className={`p-4 flex items-center justify-between transition-all cursor-pointer hover:bg-muted/50 hover:scale-[1.01] active:scale-[0.99] ${
              player.rank <= 3 ? "border-primary/30 bg-primary/5" : ""
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold w-10 text-center">{rankEmoji(player.rank)}</span>
              <div>
                <p className="font-semibold text-foreground">{player.player_name}</p>
                <p className="text-xs text-muted-foreground">{player.games_played} games • {player.wins} wins</p>
              </div>
            </div>
            <p className="font-bold text-primary">₦{Number(player.total_winnings).toLocaleString()}</p>
          </Card>
        ))}
      </div>

      <PlayerProfileDialog player={selected} onClose={() => setSelected(null)} />
    </motion.div>
  );
};

const Leaderboard = () => {
  const { isLaunched } = useLaunchStatus();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <AppSidebar />
      <div className="md:pl-16 min-h-screen flex flex-col">
        <main className="container px-4 pt-32 pb-24 flex-1 flex items-center justify-center">
          {isLaunched ? <LiveLeaderboardView /> : <ComingSoonView />}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Leaderboard;
