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
}

const DiceEngine = ({ gameId, name, emoji, pointCost }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [dice, setDice] = useState([1, 1]);
  const [target, setTarget] = useState(7);
  const [bet, setBet] = useState<"over" | "under" | null>(null);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  const roll = async (betType: "over" | "under") => {
    if (rolling) return;
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setBet(betType);
    setRolling(true);
    setResult(null);

    let count = 0;
    const interval = setInterval(() => {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        setDice([d1, d2]);
        const total = d1 + d2;
        const won = betType === "over" ? total > target : total < target;

        let winnings = 0;
        if (won) {
          // Payout based on difficulty
          const diff = Math.abs(total - target);
          winnings = diff >= 4 ? 2000 : diff >= 2 ? 1000 : 500;
          winnings = adjustWinAmount(winnings);
          if (canFullyWin() && winnings >= 1000) recordFullWin();
          if (winnings > 0) updateBalance(winnings);
        }

        setResult(won ? `🎉 ${total}! You won ₦${winnings.toLocaleString()}!` : `${total}. Not this time!`);
        recordGameResult(gameId, pointCost, winnings, { dice: [d1, d2], total, bet: betType, target });
        setRolling(false);
        setBet(null);
      }
    }, 80);
  };

  const sum = dice[0] + dice[1];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center mb-6">Over or Under {target}? • {pointCost} pts</p>

      <Card className="p-8 bg-card/80 backdrop-blur-sm border-primary/30 text-center mb-4">
        <div className="flex gap-6 justify-center mb-4">
          {dice.map((d, i) => (
            <motion.div key={i} className="w-20 h-20 sm:w-24 sm:h-24 bg-background rounded-xl flex items-center justify-center text-5xl border-2 border-primary/20"
              animate={rolling ? { rotate: [0, 15, -15, 0] } : {}} transition={{ repeat: rolling ? Infinity : 0, duration: 0.2 }}>
              {DICE_FACES[d - 1]}
            </motion.div>
          ))}
        </div>
        <p className="text-2xl font-bold text-primary">Total: {sum}</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <span className="text-sm text-muted-foreground">Target:</span>
          {[5, 6, 7, 8, 9].map((t) => (
            <Button key={t} variant={target === t ? "default" : "outline"} size="sm" onClick={() => !rolling && setTarget(t)}>{t}</Button>
          ))}
        </div>
      </Card>

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-center mb-4">{result}</motion.div>}

      <div className="grid grid-cols-2 gap-3">
        <Button className="py-6 text-lg bg-green-600 hover:bg-green-700 text-white" onClick={() => roll("over")} disabled={rolling || xpLives <= 0}>
          ⬆️ Over {target}
        </Button>
        <Button className="py-6 text-lg bg-red-600 hover:bg-red-700 text-white" onClick={() => roll("under")} disabled={rolling || xpLives <= 0}>
          ⬇️ Under {target}
        </Button>
      </div>
    </motion.div>
  );
};

export default DiceEngine;
