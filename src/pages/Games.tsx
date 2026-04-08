import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Ticket, Gift, Brain, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const games = [
  {
    name: "Spin the Wheel",
    description: "Try your luck! Spin the wheel and win instant rewards. Every spin is a chance to hit the jackpot.",
    icon: Gift,
    color: "from-purple-500 to-pink-500",
    path: "/games/spin-wheel",
  },
  {
    name: "Raffle Draw",
    description: "Buy raffle tickets and enter the draw. Winners are selected fairly and transparently.",
    icon: Ticket,
    color: "from-blue-500 to-cyan-500",
    path: "/games/raffle",
  },
  {
    name: "Trivia Quiz",
    description: "Test your knowledge across various topics. Answer correctly to win bonus rewards.",
    icon: Brain,
    color: "from-green-500 to-emerald-500",
    path: "/games/trivia",
  },
  {
    name: "Lucky Slots",
    description: "Classic slot machine action with modern rewards. Match symbols to win big prizes.",
    icon: Trophy,
    color: "from-yellow-500 to-orange-500",
    path: "/games/slots",
  },
];

const Games = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      } else {
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container px-4 pt-32 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-medium text-center mb-4">
            LootBox <span className="text-gradient">Games</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
            Choose your game and start winning amazing rewards
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
            {games.map((game, index) => (
              <motion.div
                key={game.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 sm:p-8 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center flex-shrink-0`}>
                      <game.icon className="w-6 h-6 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{game.name}</h3>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                          Live
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
                      <Button className="button-gradient w-full" asChild>
                        <Link to={game.path}>Play Now</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card className="p-6 bg-card/30">
              <h3 className="text-lg font-medium mb-2">🎮 Fun & Fair</h3>
              <p className="text-sm text-muted-foreground">
                All games use provably fair algorithms for transparent results
              </p>
            </Card>
            <Card className="p-6 bg-card/30">
              <h3 className="text-lg font-medium mb-2">💰 Real Rewards</h3>
              <p className="text-sm text-muted-foreground">
                Win real money and bonuses that you can withdraw anytime
              </p>
            </Card>
            <Card className="p-6 bg-card/30">
              <h3 className="text-lg font-medium mb-2">🏆 Leaderboard</h3>
              <p className="text-sm text-muted-foreground">
                Compete with other players and climb the rankings for extra prizes
              </p>
            </Card>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Games;
