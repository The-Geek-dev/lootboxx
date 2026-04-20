import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { useDepositGate } from "@/hooks/useDepositGate";
import GamePageLayout from "@/components/GamePageLayout";

const SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"];
const BET_COST = 20;

const PAYOUTS: Record<string, number> = {
  "💎💎💎": 15000,
  "7️⃣7️⃣7️⃣": 10000,
  "⭐⭐⭐": 6000,
  "🔔🔔🔔": 4000,
  "🍒🍒🍒": 2000,
  "🍋🍋🍋": 1200,
};

const LuckySlots = () => {
  const { isAuthorized, isChecking } = useDepositGate();
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
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
    if (points < BET_COST) {
      toast({ title: "Insufficient points", description: `You need ${BET_COST} points to play.`, variant: "destructive" });
      return;
    }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) { toast({ title: "Could not consume XP life", variant: "destructive" }); return; }
    setIsSpinning(true);
    setResult(null);
    await spendPoints(BET_COST);
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
        const smallWin = twoMatch ? 300 : 0;
        let totalWin = payout || smallWin;
        if (totalWin > 0) {
          totalWin = adjustWinAmount(totalWin);
          if (payout > 0 && canFullyWin()) recordFullWin();
        }
        if (totalWin > 0) { updateBalance(totalWin); setResult(`🎉 You won ₦${totalWin.toLocaleString()}!`); }
        else { setResult("No match. Try again!"); }
        recordGameResult("slots", BET_COST, totalWin, { reels: finalReels, combo });
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
    <GamePageLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
          Lucky <span className="text-gradient">Slots</span>
        </h1>
        <p className="text-muted-foreground text-center mb-6">Match symbols to win big!</p>

        <Card className="p-8 bg-card/80 backdrop-blur-sm border-primary/30">
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
              <span className="text-primary font-bold">₦300</span>
            </div>
          </div>
        </Card>

        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-xl font-bold text-center mt-4">
            {result}
          </motion.div>
        )}

        <Button className="button-gradient px-8 py-3 text-lg w-full mt-4" onClick={spin} disabled={isSpinning || xpLives <= 0}>
          {isSpinning ? "Spinning..." : xpLives <= 0 ? "No XP Lives" : `Spin (${BET_COST} pts)`}
        </Button>
      </motion.div>
    </GamePageLayout>
  );
};

export default LuckySlots;
