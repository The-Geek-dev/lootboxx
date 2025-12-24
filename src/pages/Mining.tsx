import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Play, Pause, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import btcLogo from "@/assets/crypto/btc-logo.png";
import solLogo from "@/assets/crypto/sol-logo.png";
import bnbLogo from "@/assets/crypto/bnb-logo.png";
import ethLogo from "@/assets/crypto/eth-logo.png";

const cryptoCoins = [
  { name: "SQUANCH", symbol: "SQNCH", logo: "⭐", reward: 0.5 },
  { name: "Bitcoin", symbol: "BTC", logo: btcLogo, reward: 0.00001 },
  { name: "Solana", symbol: "SOL", logo: solLogo, reward: 0.001 },
  { name: "BNB", symbol: "BNB", logo: bnbLogo, reward: 0.0005 },
  { name: "Ethereum", symbol: "ETH", logo: ethLogo, reward: 0.00005 },
];

const Mining = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState(cryptoCoins[0]);
  const [isMining, setIsMining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [earned, setEarned] = useState(0);
  const [hashRate, setHashRate] = useState(0);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isMining) {
      setHashRate(Math.random() * 100 + 50);
      
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setEarned((e) => e + selectedCoin.reward);
            return 0;
          }
          return prev + 1;
        });
        setHashRate(Math.random() * 100 + 50);
      }, 100);
    } else {
      setHashRate(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMining, selectedCoin]);

  const toggleMining = () => {
    setIsMining(!isMining);
    if (!isMining) {
      setProgress(0);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
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
          <h1 className="text-4xl md:text-5xl font-medium text-center mb-4">
            Crypto <span className="text-gradient">Mining</span>
          </h1>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Mine your favorite cryptocurrencies with our AI-powered mining platform
          </p>

          {/* Coin Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-medium mb-4">Select Coin</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {cryptoCoins.map((coin) => (
                <Card
                  key={coin.symbol}
                  className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
                    selectedCoin.symbol === coin.symbol
                      ? "border-primary bg-primary/10"
                      : ""
                  }`}
                  onClick={() => setSelectedCoin(coin)}
                >
                  <div className="flex flex-col items-center gap-2">
                    {typeof coin.logo === "string" && coin.logo.startsWith("/") ? (
                      <img
                        src={coin.logo}
                        alt={coin.name}
                        className="w-12 h-12 object-contain"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center text-3xl">
                        {coin.logo}
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-medium text-sm">{coin.name}</p>
                      <p className="text-xs text-gray-400">{coin.symbol}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Mining Dashboard */}
          <Card className="p-8 bg-card/50 backdrop-blur-sm">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* Hash Rate */}
              <div className="text-center">
                <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-sm text-gray-400 mb-1">Hash Rate</p>
                <p className="text-2xl font-bold">
                  {hashRate.toFixed(2)} <span className="text-sm text-gray-400">H/s</span>
                </p>
              </div>

              {/* Total Earned */}
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 text-2xl">💰</div>
                <p className="text-sm text-gray-400 mb-1">Total Earned</p>
                <p className="text-2xl font-bold">
                  {earned.toFixed(6)} <span className="text-sm text-gray-400">{selectedCoin.symbol}</span>
                </p>
              </div>

              {/* Mining Progress */}
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-2 text-2xl">⚡</div>
                <p className="text-sm text-gray-400 mb-1">Progress</p>
                <p className="text-2xl font-bold">{progress}%</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <Progress value={progress} className="h-3" />
            </div>

            {/* Mining Control */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={toggleMining}
                className={`w-full md:w-auto px-12 ${
                  isMining ? "bg-destructive hover:bg-destructive/90" : ""
                }`}
              >
                {isMining ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Stop Mining
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start Mining
                  </>
                )}
              </Button>
            </div>

            {isMining && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-center"
              >
                <p className="text-sm text-gray-400">
                  Mining {selectedCoin.name}... Reward: {selectedCoin.reward} {selectedCoin.symbol} per cycle
                </p>
              </motion.div>
            )}
          </Card>

          {/* Mining Info */}
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <Card className="p-6 bg-card/30">
              <h3 className="text-lg font-medium mb-2">🚀 Fast Mining</h3>
              <p className="text-sm text-gray-400">
                Our AI-optimized mining algorithms ensure maximum efficiency
              </p>
            </Card>
            <Card className="p-6 bg-card/30">
              <h3 className="text-lg font-medium mb-2">🔒 Secure</h3>
              <p className="text-sm text-gray-400">
                Your earnings are securely stored and protected with advanced encryption
              </p>
            </Card>
            <Card className="p-6 bg-card/30">
              <h3 className="text-lg font-medium mb-2">💎 Multi-Coin</h3>
              <p className="text-sm text-gray-400">
                Mine multiple cryptocurrencies including our exclusive SQUANCH coin
              </p>
            </Card>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Mining;
