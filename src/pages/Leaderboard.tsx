import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Crown, Gamepad2, TrendingUp } from "lucide-react";

type LeaderboardEntry = {
  rank: number;
  player_name: string;
  total_winnings: number;
  games_played: number;
  wins: number;
};

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{rank}</span>;
};

const rankBg = (rank: number) => {
  if (rank === 1) return "bg-yellow-500/10 border-yellow-500/30";
  if (rank === 2) return "bg-gray-400/10 border-gray-400/30";
  if (rank === 3) return "bg-amber-600/10 border-amber-600/30";
  return "bg-card/50";
};

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", { limit_count: 20 });
      if (!error && data) {
        setEntries(data as LeaderboardEntry[]);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <AppSidebar />
      <main className="md:pl-16 container px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8 justify-center">
            <Trophy className="w-8 h-8 text-primary" />
            <div className="text-center">
              <h1 className="text-2xl sm:text-4xl font-bold">
                Leader<span className="text-gradient">board</span>
              </h1>
              <p className="text-muted-foreground text-sm">Top winners on LootBoxx</p>
            </div>
          </div>

          {/* Top 3 podium */}
          {!loading && entries.length >= 3 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 max-w-xl mx-auto">
              {[entries[1], entries[0], entries[2]].map((e, i) => {
                const order = [2, 1, 3];
                const heights = ["h-28", "h-36", "h-24"];
                return (
                  <motion.div
                    key={e.rank}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex flex-col items-center"
                  >
                    <div className="mb-2 text-center">
                      {rankIcon(order[i])}
                      <p className="text-xs sm:text-sm font-semibold mt-1 truncate max-w-[90px]">
                        {e.player_name}
                      </p>
                      <p className="text-primary font-bold text-sm sm:text-base">
                        ₦{e.total_winnings.toLocaleString()}
                      </p>
                    </div>
                    <div
                      className={`w-full ${heights[i]} rounded-t-lg ${
                        order[i] === 1
                          ? "bg-gradient-to-t from-yellow-500/30 to-yellow-500/10 border border-yellow-500/40"
                          : order[i] === 2
                          ? "bg-gradient-to-t from-gray-400/20 to-gray-400/5 border border-gray-400/30"
                          : "bg-gradient-to-t from-amber-600/20 to-amber-600/5 border border-amber-600/30"
                      }`}
                    />
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Full list */}
          <div className="max-w-2xl mx-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              </div>
            ) : entries.length === 0 ? (
              <Card className="p-8 text-center">
                <Gamepad2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No winners yet. Be the first!</p>
              </Card>
            ) : (
              entries.map((entry, i) => (
                <motion.div
                  key={entry.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={`p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border ${rankBg(entry.rank)}`}
                  >
                    <div className="shrink-0 w-8 flex justify-center">
                      {rankIcon(entry.rank)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">
                        {entry.player_name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Gamepad2 className="w-3 h-3" />
                          {entry.games_played} played
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {entry.wins} wins
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-primary text-sm sm:text-lg">
                        ₦{entry.total_winnings.toLocaleString()}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {((entry.wins / entry.games_played) * 100).toFixed(0)}% win rate
                      </Badge>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Leaderboard;
