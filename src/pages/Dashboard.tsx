import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TrendingUp, DollarSign, Activity, Percent, Settings } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  
  const stats = [
    { icon: DollarSign, label: "Total Profit", value: "$0.00", change: "0%" },
    { icon: TrendingUp, label: "Active Trades", value: "0", change: "Ready" },
    { icon: Activity, label: "Win Rate", value: "0%", change: "0%" },
    { icon: Percent, label: "Monthly ROI", value: "0%", change: "0%" },
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      } else {
        // Fetch user profile
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Welcome, {userName || "Trader"}!
              </h1>
              <p className="text-gray-400">Monitor your SQUANCH bot performance</p>
            </div>
            <div className="flex gap-3">
              <Button className="button-gradient" asChild>
                <a href="https://t.me/SQUANCHTradeBot" target="_blank" rel="noopener noreferrer">
                  Configure Bot
                </a>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
              <h3 className="text-xl font-semibold mb-4">Recent Trades</h3>
              <div className="flex items-center justify-center h-48 text-gray-500">
                No trades yet. Start your bot to begin trading!
              </div>
            </Card>

            <Card className="glass p-6">
              <h3 className="text-xl font-semibold mb-4">Bot Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Status</span>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Strategy</span>
                  <span>Aggressive Growth</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Risk Level</span>
                  <span className="text-yellow-500">Medium</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Running Since</span>
                  <span>24 days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Trades Today</span>
                  <span>0</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="glass p-6">
            <h3 className="text-xl font-semibold mb-4">Performance Chart</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              Chart visualization coming soon
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
