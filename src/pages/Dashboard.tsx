import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wallet, Trophy, Gift, Users, Settings, Gamepad2, Clock, History, Coins, Bell, Zap, TrendingUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import AppSidebar from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { useDepositGate } from "@/hooks/useDepositGate";
import { useNotifications } from "@/hooks/useNotifications";
import XpLifeBar from "@/components/XpLifeBar";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthorized, isChecking } = useDepositGate();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const { balance } = useWallet();
  const { notifications, unreadCount, markAllAsRead } = useNotifications();
  const [totalWins, setTotalWins] = useState(0);
  const [totalBonuses, setTotalBonuses] = useState(0);
  const [referralCount, setReferralCount] = useState(0);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [lastBonusAt, setLastBonusAt] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const nextBonusInfo = useMemo(() => {
    const now = new Date();
    const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
    const next = new Date(now);
    next.setUTCDate(now.getUTCDate() + daysUntilMonday);
    next.setUTCHours(1, 0, 0, 0);
    if (next <= now) next.setUTCDate(next.getUTCDate() + 7);
    const diffMs = next.getTime() - now.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { days, hours, date: next };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }

      const userId = session.user.id;

      // Create sign-in notification
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Welcome back! 👋",
        message: `You signed in at ${new Date().toLocaleTimeString("en-NG")}`,
        type: "info",
      });

      const [profileRes, gamesRes, referralsRes, walletRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", userId).single(),
        supabase.from("game_results").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
        supabase.from("referrals").select("*").eq("referrer_id", userId),
        supabase.from("user_wallets").select("total_won, total_referral_bonus, last_weekly_bonus_at, points").eq("user_id", userId).single(),
      ]);

      if (profileRes.data) setUserName(profileRes.data.full_name);
      if (gamesRes.data) {
        setRecentGames(gamesRes.data);
        setTotalWins(gamesRes.data.filter((g: any) => g.win_amount > 0).length);
      }
      if (referralsRes.data) setReferralCount(referralsRes.data.filter((r: any) => r.referred_id).length);
      if (walletRes.data) {
        setTotalBonuses(Number(walletRes.data.total_referral_bonus));
        setLastBonusAt(walletRes.data.last_weekly_bonus_at as string | null);
        setPoints(Number(walletRes.data.points));
      }

      setIsLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/login");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!isAuthorized || isChecking || isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );

  const stats = [
    { icon: Wallet, label: "Balance", value: `₦${balance.toLocaleString()}`, change: "Deposit", link: "/deposit" },
    { icon: Coins, label: "Points", value: points.toLocaleString(), change: "Manage", link: "/points" },
    { icon: Trophy, label: "Total Wins", value: String(totalWins), change: "Play now", link: "/games" },
    { icon: Users, label: "Referrals", value: String(referralCount), change: "Invite", link: "/referrals" },
  ];

  const gameTypeLabels: Record<string, string> = {
    spin_wheel: "🎡 Spin the Wheel",
    slots: "🎰 Lucky Slots",
    trivia: "🧠 Trivia Quiz",
    raffle: "🎟️ Raffle Draw",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <AppSidebar />
      
      <div className="md:pl-16 container px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2">Welcome, {userName || "Player"}!</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Your LootBox gaming dashboard</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button variant="outline" size="sm" className="relative" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              <Button className="button-gradient text-xs sm:text-sm" asChild>
                <Link to="/games"><Gamepad2 className="w-4 h-4 mr-1" />Play</Link>
              </Button>
              <Button variant="outline" className="text-xs sm:text-sm" asChild>
                <Link to="/settings"><Settings className="w-4 h-4" /></Link>
              </Button>
            </div>
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-4 mb-6 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs" onClick={markAllAsRead}>Mark all read</Button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No notifications yet</p>
                ) : (
                  <div className="space-y-2">
                    {notifications.slice(0, 10).map((n: any) => (
                      <div key={n.id} className={`p-2 rounded-lg text-xs ${n.is_read ? "bg-background" : "bg-primary/5 border border-primary/20"}`}>
                        <p className="font-semibold">{n.title}</p>
                        <p className="text-muted-foreground">{n.message}</p>
                        <p className="text-muted-foreground/50 mt-1">{new Date(n.created_at).toLocaleString("en-NG")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* XP Life Bar */}
          <div className="mb-6">
            <XpLifeBar />
          </div>

          {/* Weekly Bonus Banner */}
          <Card className="glass p-4 mb-6 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-3 flex-wrap">
              <Clock className="w-6 h-6 text-primary shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">Next Weekly Bonus: <span className="text-primary">₦2,000</span></p>
                <p className="text-xs text-muted-foreground">
                  In {nextBonusInfo.days}d {nextBonusInfo.hours}h
                  {lastBonusAt && ` • Last: ${new Date(lastBonusAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}`}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to="/transactions"><History className="w-4 h-4 mr-1" />History</Link>
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {stats.map((stat, index) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Link to={stat.link}>
                  <Card className="glass glass-hover p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <stat.icon className="w-6 h-6 text-primary" />
                      <span className="text-xs text-primary">{stat.change}</span>
                    </div>
                    <div className="text-xl font-bold mb-1">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="glass p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Games</h3>
              {recentGames.length > 0 ? (
                <div className="space-y-3">
                  {recentGames.map((game: any) => (
                    <div key={game.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{gameTypeLabels[game.game_type] || game.game_type}</span>
                      <span className={`text-sm ${Number(game.win_amount) > 0 ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {Number(game.win_amount) > 0 ? `+₦${Number(game.win_amount).toLocaleString()}` : `-₦${Number(game.bet_amount).toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                  No games played yet.
                </div>
              )}
            </Card>

            <Card className="glass p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Play</h3>
              <div className="space-y-3">
                {[
                  { label: "🎡 Spin the Wheel", path: "/games/spin-wheel" },
                  { label: "🎟️ Raffle Draw", path: "/games/raffle" },
                  { label: "🧠 Trivia Quiz", path: "/games/trivia" },
                  { label: "🎰 Lucky Slots", path: "/games/slots" },
                ].map((item) => (
                  <Link key={item.path} to={item.path} className="flex justify-between items-center hover:text-primary transition-colors text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-primary text-xs">Play →</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <Card className="glass p-6">
            <h3 className="text-lg font-semibold mb-4">Deposit & Earn Points</h3>
            <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-4">
              <p className="text-sm text-center">Deposit funds to earn points, play games, and win rewards</p>
              <div className="flex gap-3">
                <Button className="button-gradient" asChild>
                  <Link to="/deposit"><Wallet className="w-4 h-4 mr-2" />Deposit</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/withdraw"><TrendingUp className="w-4 h-4 mr-2" />Withdraw</Link>
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
