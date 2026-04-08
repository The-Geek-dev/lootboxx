import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wallet, Trophy, Gift, Users, Settings, Gamepad2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const { balance } = useWallet();
  const [totalWins, setTotalWins] = useState(0);
  const [totalBonuses, setTotalBonuses] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [recentGames, setRecentGames] = useState<any[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const userId = session.user.id;

      const [profileRes, gamesRes, referralsRes, walletRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", userId).single(),
        supabase.from("game_results").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
        supabase.from("referrals").select("*").eq("referrer_id", userId),
        supabase.from("user_wallets").select("total_won, total_referral_bonus").eq("user_id", userId).single(),
      ]);

      if (profileRes.data) setUserName(profileRes.data.full_name);
      if (gamesRes.data) {
        setRecentGames(gamesRes.data);
        setTotalWins(gamesRes.data.filter((g: any) => g.win_amount > 0).length);
      }
      if (referralsRes.data) setReferralCount(referralsRes.data.filter((r: any) => r.referred_id).length);
      if (walletRes.data) {
        setTotalBonuses(Number(walletRes.data.total_referral_bonus));
      }

      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { icon: Wallet, label: "Balance", value: `₦${balance.toLocaleString()}`, change: "Deposit", link: "/deposit" },
    { icon: Trophy, label: "Total Wins", value: String(totalWins), change: "Play now", link: "/games" },
    { icon: Gift, label: "Bonuses", value: `₦${totalBonuses.toLocaleString()}`, change: "Earn more", link: "/referrals" },
    { icon: Users, label: "Referrals", value: String(referralCount), change: "Invite", link: "/referrals" },
  ];

  const gameTypeLabels: Record<string, string> = {
    spin_wheel: "🎰 Spin the Wheel",
    slots: "🎰 Lucky Slots",
    trivia: "🧠 Trivia Quiz",
    raffle: "🎟️ Raffle Draw",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <div className="container px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2">Welcome, {userName || "Player"}!</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Your LootBox gaming dashboard</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button className="button-gradient text-xs sm:text-sm" asChild>
                <Link to="/games"><Gamepad2 className="w-4 h-4 mr-1 sm:mr-2" />Play Games</Link>
              </Button>
              <Button variant="outline" className="text-xs sm:text-sm" asChild>
                <Link to="/settings"><Settings className="w-4 h-4 mr-1 sm:mr-2" />Settings</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Link to={stat.link}>
                  <Card className="glass glass-hover p-6">
                    <div className="flex items-center justify-between mb-4">
                      <stat.icon className="w-8 h-8 text-primary" />
                      <span className="text-sm text-primary">{stat.change}</span>
                    </div>
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="glass p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Games</h3>
              {recentGames.length > 0 ? (
                <div className="space-y-3">
                  {recentGames.map((game: any) => (
                    <div key={game.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                      <span className="text-muted-foreground">{gameTypeLabels[game.game_type] || game.game_type}</span>
                      <span className={Number(game.win_amount) > 0 ? "text-primary font-bold" : "text-muted-foreground"}>
                        {Number(game.win_amount) > 0 ? `+₦${Number(game.win_amount).toLocaleString()}` : `-₦${Number(game.bet_amount).toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">
                  No games played yet. Start playing to see your history!
                </div>
              )}
            </Card>

            <Card className="glass p-6">
              <h3 className="text-xl font-semibold mb-4">Quick Play</h3>
              <div className="space-y-4">
                {[
                  { label: "🎰 Spin the Wheel", path: "/games/spin-wheel" },
                  { label: "🎟️ Raffle Draw", path: "/games/raffle" },
                  { label: "🧠 Trivia Quiz", path: "/games/trivia" },
                  { label: "🎰 Lucky Slots", path: "/games/slots" },
                ].map((item) => (
                  <Link key={item.path} to={item.path} className="flex justify-between items-center hover:text-primary transition-colors">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-primary">Play Now →</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-4">Deposit & Balance</h3>
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <p>Deposit funds to start playing games and winning rewards</p>
              <Button className="button-gradient" asChild>
                <Link to="/deposit">
                  <Wallet className="w-4 h-4 mr-2" />
                  Deposit Now
                </Link>
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
