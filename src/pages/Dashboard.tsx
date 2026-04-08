import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wallet, Trophy, Gift, Users, Settings, Gamepad2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  
  const stats = [
    { icon: Wallet, label: "Balance", value: "₦0.00", change: "Deposit" },
    { icon: Trophy, label: "Total Wins", value: "0", change: "Play now" },
    { icon: Gift, label: "Bonuses Earned", value: "₦0.00", change: "0" },
    { icon: Users, label: "Referrals", value: "0", change: "Invite" },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", session.user.id)
          .single();
        
        if (profile) {
          setUserName(profile.full_name);
        }
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground">
      <Navigation />
      
      <div className="container px-4 pt-32 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold mb-2">
                Welcome, {userName || "Player"}!
              </h1>
              <p className="text-sm sm:text-base text-gray-400">Your LootBox gaming dashboard</p>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button className="button-gradient text-xs sm:text-sm" asChild>
                <Link to="/games">
                  <Gamepad2 className="w-4 h-4 mr-1 sm:mr-2" />
                  Play Games
                </Link>
              </Button>
              <Button variant="outline" className="text-xs sm:text-sm" asChild>
                <Link to="/settings">
                  <Settings className="w-4 h-4 mr-1 sm:mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="glass glass-hover p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className="w-8 h-8 text-primary" />
                    <span className="text-sm text-green-500">{stat.change}</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="glass p-6">
              <h3 className="text-xl font-semibold mb-4">Recent Games</h3>
              <div className="flex items-center justify-center h-48 text-gray-500">
                No games played yet. Start playing to see your history!
              </div>
            </Card>

            <Card className="glass p-6">
              <h3 className="text-xl font-semibold mb-4">Available Games</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">🎰 Spin the Wheel</span>
                  <span className="text-primary">Play Now →</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">🎟️ Raffle Draw</span>
                  <span className="text-primary">Enter Now →</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">🧠 Trivia Quiz</span>
                  <span className="text-primary">Play Now →</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">👥 Referral Bonus</span>
                  <span className="text-primary">Invite →</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-4">Deposit & Balance</h3>
            <div className="h-64 flex flex-col items-center justify-center text-gray-500 gap-4">
              <p>Deposit funds to start playing games and winning rewards</p>
              <Button className="button-gradient">
                <Wallet className="w-4 h-4 mr-2" />
                Deposit Now
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
