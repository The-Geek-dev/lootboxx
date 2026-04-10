import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useDepositGate } from "@/hooks/useDepositGate";
import { Coins, ArrowRightLeft, Zap, TrendingUp, Gift, Wallet } from "lucide-react";

const Points = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthorized, isChecking } = useDepositGate();
  const { points, loading, convertToCash, minConvertPoints, pointsToCashRate } = usePoints();
  const { xpLives: lives, maxLives, buyRefill } = useXpLives();
  const [converting, setConverting] = useState(false);
  const [buyingRefill, setBuyingRefill] = useState(false);

  const cashValue = Math.floor(points / minConvertPoints) * (minConvertPoints / pointsToCashRate);
  const batchesAvailable = Math.floor(points / minConvertPoints);

  const handleConvert = async () => {
    if (points < minConvertPoints) {
      toast({ title: "Not enough points", description: `You need at least ${minConvertPoints.toLocaleString()} points to convert.`, variant: "destructive" });
      return;
    }
    setConverting(true);
    const result = await convertToCash();
    if (result.success) {
      toast({ title: "Points converted! 🎉", description: `₦${result.cashAmount.toLocaleString()} has been added to your wallet.` });
    } else {
      toast({ title: "Conversion failed", description: "Please try again.", variant: "destructive" });
    }
    setConverting(false);
  };

  const handleBuyRefill = async () => {
    setBuyingRefill(true);
    const success = await buyRefill();
    if (success) {
      toast({ title: "XP Refilled! ⚡", description: "Your lives have been restored to 8." });
    } else {
      toast({ title: "Refill failed", description: "You need at least 500 points.", variant: "destructive" });
    }
    setBuyingRefill(false);
  };

  if (isChecking || loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="container px-4 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <Coins className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold">Points <span className="text-gradient">Center</span></h1>
              <p className="text-muted-foreground text-sm">Manage, convert, and spend your points</p>
            </div>
          </div>

          {/* Points Balance */}
          <Card className="glass p-6 mb-6 border-primary/30 bg-primary/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-muted-foreground mb-1">Your Points Balance</p>
                <p className="text-4xl sm:text-5xl font-bold text-primary">{points.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground mt-1">≈ ₦{cashValue.toLocaleString()} convertible</p>
              </div>
              <div className="flex gap-3">
                <Button className="button-gradient" asChild>
                  <Link to="/deposit"><Wallet className="w-4 h-4 mr-2" />Earn More</Link>
                </Button>
              </div>
            </div>
          </Card>

          {/* Actions Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Convert to Cash */}
            <Card className="glass p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Convert to Cash</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Rate</span>
                    <span className="text-sm font-medium">{minConvertPoints.toLocaleString()} pts = ₦{(minConvertPoints / pointsToCashRate).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Available batches</span>
                    <span className="text-sm font-medium">{batchesAvailable}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cash you'll get</span>
                    <span className="text-lg font-bold text-primary">₦{cashValue.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  className="button-gradient w-full"
                  disabled={converting || points < minConvertPoints}
                  onClick={handleConvert}
                >
                  {converting ? "Converting..." : points < minConvertPoints
                    ? `Need ${(minConvertPoints - points).toLocaleString()} more pts`
                    : `Convert ${(batchesAvailable * minConvertPoints).toLocaleString()} pts → ₦${cashValue.toLocaleString()}`}
                </Button>
              </div>
            </Card>

            {/* Buy XP Refill */}
            <Card className="glass p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Buy XP Refill</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-background/50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Current Lives</span>
                    <div className="flex gap-1">
                      {Array.from({ length: maxLives }).map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i < lives ? "bg-primary" : "bg-muted"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Refill Cost</span>
                    <span className="text-sm font-medium">500 points</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">After Refill</span>
                    <span className="text-sm font-medium">{maxLives} / {maxLives} lives</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full border-primary/30"
                  disabled={buyingRefill || points < 500 || lives === maxLives}
                  onClick={handleBuyRefill}
                >
                  {buyingRefill ? "Refilling..." : lives === maxLives
                    ? "Lives already full"
                    : points < 500
                    ? "Need 500 points"
                    : "Refill Lives — 500 pts"}
                </Button>
              </div>
            </Card>
          </div>

          {/* How to Earn Points */}
          <Card className="glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">How to Earn Points</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Activation Deposit", desc: "₦7,000 deposit", pts: "10,000 pts", icon: "💰" },
                { title: "Weekly Renewal", desc: "₦2,000 renewal", pts: "3,000 pts", icon: "📅" },
                { title: "Referrals", desc: "Per successful referral", pts: "200 pts", icon: "👥" },
                { title: "5 Referral Milestone", desc: "Every 5 referrals", pts: "3,000 pts", icon: "🏆" },
              ].map((item) => (
                <div key={item.title} className="bg-background/50 rounded-lg p-4 text-center">
                  <p className="text-2xl mb-2">{item.icon}</p>
                  <p className="font-semibold text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground mb-2">{item.desc}</p>
                  <Badge variant="secondary" className="text-primary">{item.pts}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Points;
