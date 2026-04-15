import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import Footer from "@/components/Footer";
import { Trophy, Rocket, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";
import { supabase } from "@/integrations/supabase/client";

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

const LiveLeaderboardView = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.rpc("get_leaderboard", { limit_count: 20 });
      if (data) setLeaders(data);
      setLoading(false);
    };
    fetch();
  }, []);

  const rankEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-2">🏆 Leaderboard</h1>
      <p className="text-muted-foreground text-center mb-6">Top players by total winnings</p>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Loading rankings...</p>
        </div>
      ) : leaders.length === 0 ? (
        <Card className="p-8 text-center">
          <Medal className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">No rankings yet. Start playing to claim your spot!</p>
          <Link to="/games"><Button className="button-gradient mt-4">Play Now</Button></Link>
        </Card>
      ) : (
        <div className="space-y-2">
          {leaders.map((player) => (
            <Card
              key={player.rank}
              className={`p-4 flex items-center justify-between transition-all ${
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
      )}
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
