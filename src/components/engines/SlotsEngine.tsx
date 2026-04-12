import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  symbols?: string[];
}

const DEFAULT_SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"];

const SlotsEngine = ({ gameId, name, emoji, pointCost, symbols = DEFAULT_SYMBOLS }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [reels, setReels] = useState(symbols.slice(0, 3));
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const payoutMultipliers = [5000, 3000, 1500, 1000, 500, 300];

  const spin = async () => {
    if (isSpinning) return;
    if (xpLives <= 0) { toast({ title: "No XP lives left! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", description: `Need ${pointCost} pts`, variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    setIsSpinning(true);
    setResult(null);
    await spendPoints(pointCost);

    let count = 0;
    const interval = setInterval(() => {
      setReels(symbols.slice(0, 3).map(() => symbols[Math.floor(Math.random() * symbols.length)]));
      count++;
      if (count > 20) {
        clearInterval(interval);
        const finalReels = Array.from({ length: 3 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
        setReels(finalReels);

        const allMatch = finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2];
        const twoMatch = finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2];
        
        let payout = 0;
        if (allMatch) {
          const idx = symbols.indexOf(finalReels[0]);
          payout = payoutMultipliers[idx % payoutMultipliers.length] || 500;
        } else if (twoMatch) {
          payout = 50;
        }

        if (payout > 0) {
          payout = adjustWinAmount(payout);
          if (allMatch && canFullyWin()) recordFullWin();
        }
        if (payout > 0) { updateBalance(payout); setResult(`🎉 You won ₦${payout.toLocaleString()}!`); }
        else { setResult("No match. Try again!"); }
        recordGameResult(gameId, pointCost, payout, { reels: finalReels });
        setIsSpinning(false);
      }
    }, 80);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
        {emoji} {name}
      </h1>
      <p className="text-muted-foreground text-center mb-6">Match symbols to win! • {pointCost} pts per spin</p>
      <Card className="p-8 bg-card/80 backdrop-blur-sm border-primary/30">
        <div className="flex gap-4 justify-center mb-6">
          {reels.map((symbol, i) => (
            <motion.div key={i} className="w-20 h-20 sm:w-24 sm:h-24 bg-background rounded-xl flex items-center justify-center text-4xl sm:text-5xl border-2 border-primary/20"
              animate={isSpinning ? { y: [0, -10, 0] } : {}} transition={{ repeat: isSpinning ? Infinity : 0, duration: 0.15, delay: i * 0.05 }}>
              {symbol}
            </motion.div>
          ))}
        </div>
      </Card>
      {result && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-xl font-bold text-center mt-4">{result}</motion.div>}
      <Button className="button-gradient px-8 py-3 text-lg w-full mt-4" onClick={spin} disabled={isSpinning || xpLives <= 0}>
        {isSpinning ? "Spinning..." : xpLives <= 0 ? "No XP Lives" : `Spin (${pointCost} pts)`}
      </Button>
    </motion.div>
  );
};

export default SlotsEngine;
