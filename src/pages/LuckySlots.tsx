import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDepositGate } from "@/hooks/useDepositGate";
import XpLifeBar from "@/components/XpLifeBar";

const SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"];
const BET_AMOUNT = 100;

const PAYOUTS: Record<string, number> = {
  "💎💎💎": 5000,
  "7️⃣7️⃣7️⃣": 3000,
  "⭐⭐⭐": 1500,
  "🔔🔔🔔": 1000,
  "🍒🍒🍒": 500,
  "🍋🍋🍋": 300,
};

const LuckySlots = () => {
  const navigate = useNavigate();
  const { isAuthorized, isChecking } = useDepositGate();
  const { balance, updateBalance, recordGameResult } = useWallet();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [reels, setReels] = useState(["🍒", "🍋", "🔔"]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const spin = async () => {
    if (isSpinning) return;
    if (xpLives <= 0) {
      toast({ title: "No XP lives left! ⚡", description: "Wait for refill or buy with points.", variant: "destructive" });
      return;
    }
    if (balance < BET_AMOUNT) {
      toast({ title: "Insufficient balance", description: `You need ₦${BET_AMOUNT} to play.`, variant: "destructive" });
      return;
    }

    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) {
      toast({ title: "Could not consume XP life", variant: "destructive" });
      return;
    }

    setIsSpinning(true);
    setResult(null);
    await updateBalance(-BET_AMOUNT);

    let count = 0;
    const interval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
      count++;
      if (count > 20) {
        clearInterval(interval);
        const finalReels = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        ];
        setReels(finalReels);

        const combo = finalReels.join("");
        let payout = PAYOUTS[combo] || 0;
        const twoMatch = finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2];
        const smallWin = twoMatch ? 50 : 0;
        let totalWin = payout || smallWin;

        // Apply win restrictions
        if (totalWin > 0) {
          totalWin = adjustWinAmount(totalWin);
          if (payout > 0 && canFullyWin()) {
            recordFullWin();
          }
        }

        if (totalWin > 0) {
          updateBalance(totalWin);
          setResult(`🎉 You won ₦${totalWin.toLocaleString()}!`);
        } else {
          setResult("No match. Try again!");
        }

        recordGameResult("slots", BET_AMOUNT, totalWin, { reels: finalReels, combo });
        setIsSpinning(false);
      }
    }, 80);
  };

  if (!isAuthorized || isChecking) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container px-4 pt-32 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
            Lucky <span className="text-gradient">Slots</span>
          </h1>
          <p className="text-muted-foreground text-center mb-6">Match symbols to win big!</p>

          <div className="max-w-md mx-auto flex flex-col items-center gap-4">
            <div className="w-full">
              <XpLifeBar />
            </div>

            <Card className="p-4 bg-card/50 backdrop-blur-sm w-full">
              <p className="text-center text-sm text-muted-foreground mb-1">Your Balance</p>
              <p className="text-center text-2xl font-bold text-primary">₦{balance.toLocaleString()}</p>
            </Card>

            <Card className="p-8 bg-card/80 backdrop-blur-sm border-primary/30 w-full">
              <div className="flex gap-4 justify-center mb-6">
                {reels.map((symbol, i) => (
                  <motion.div
                    key={i}
                    className="w-20 h-20 sm:w-24 sm:h-24 bg-background rounded-xl flex items-center justify-center text-4xl sm:text-5xl border-2 border-primary/20"
                    animate={isSpinning ? { y: [0, -10, 0] } : {}}
                    transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.15, delay: i * 0.05 }}
                  >
                    {symbol}
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
                {Object.entries(PAYOUTS).map(([combo, payout]) => (
                  <div key={combo} className="flex justify-between px-3 py-1 bg-background/50 rounded">
                    <span>{combo}</span>
                    <span className="text-primary font-bold">₦{payout.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between px-3 py-1 bg-background/50 rounded col-span-2">
                  <span>Any 2 match</span>
                  <span className="text-primary font-bold">₦50</span>
                </div>
              </div>
            </Card>

            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-xl font-bold">
                {result}
              </motion.div>
            )}

            <Button className="button-gradient px-8 py-3 text-lg w-full" onClick={spin} disabled={isSpinning || xpLives <= 0}>
              {isSpinning ? "Spinning..." : xpLives <= 0 ? "No XP Lives" : `Spin (₦${BET_AMOUNT})`}
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default LuckySlots;
