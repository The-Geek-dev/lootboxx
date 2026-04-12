import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { GameTheme } from "@/config/gameThemes";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  diceCount?: number;
  targetRange?: number[];
}

const DICE_FACES = ["\u2680", "\u2681", "\u2682", "\u2683", "\u2684", "\u2685"];

const DiceEngine = ({ gameId, name, emoji, pointCost, theme, diceCount = 2, targetRange = [5, 6, 7, 8, 9] }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [dice, setDice] = useState(Array(diceCount).fill(1));
  const [target, setTarget] = useState(targetRange[Math.floor(targetRange.length / 2)]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastWon, setLastWon] = useState(false);

  const getDiceStyle = () => {
    switch (theme.variant) {
      case "golden": return "border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.2)] bg-yellow-950/30";
      case "dragon": return "border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)] bg-red-950/30";
      case "duel": return "border-red-500/40 bg-red-950/20";
      case "sicbo": return "border-amber-500/40 bg-amber-950/20";
      case "master": return "border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.15)] bg-green-950/20";
      default: return "border-primary/20 bg-background";
    }
  };

  const roll = async (betType: "over" | "under") => {
    if (rolling) return;
    if (xpLives <= 0) { toast({ title: "No XP lives! \u26A1", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setRolling(true);
    setResult(null);
    setLastWon(false);

    let count = 0;
    const interval = setInterval(() => {
      setDice(Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1));
      count++;
      if (count > 15) {
        clearInterval(interval);
        const finalDice = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
        setDice(finalDice);
        const total = finalDice.reduce((s, d) => s + d, 0);
        const won = betType === "over" ? total > target : total < target;

        let winnings = 0;
        if (won) {
          const diff = Math.abs(total - target);
          winnings = diff >= 4 ? 2000 : diff >= 2 ? 1000 : 500;
          if (diceCount === 3) winnings = Math.floor(winnings * 1.3);
          winnings = adjustWinAmount(winnings);
          if (canFullyWin() && winnings >= 1000) recordFullWin();
          if (winnings > 0) updateBalance(winnings);
          setLastWon(true);
        }

        setResult(won ? `\u{1F389} ${total}! You won \u20A6${winnings.toLocaleString()}!` : `${total}. Not this time!`);
        recordGameResult(gameId, pointCost, winnings, { dice: finalDice, total, bet: betType, target });
        setRolling(false);
      }
    }, 80);
  };

  const sum = dice.reduce((s, d) => s + d, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-6`}>{theme.description}</p>

      <Card className={`p-8 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 text-center mb-4 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-5 text-9xl flex items-center justify-center pointer-events-none">{emoji}</div>

        <div className={`flex gap-4 sm:gap-6 justify-center mb-4 relative`}>
          {dice.map((d, i) => (
            <motion.div
              key={i}
              className={`w-16 h-16 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center text-4xl sm:text-5xl border-2 ${getDiceStyle()}`}
              animate={rolling ? { rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.1, 0.9, 1] } : lastWon ? { scale: [1, 1.15, 1] } : {}}
              transition={{ repeat: rolling ? Infinity : lastWon ? 2 : 0, duration: rolling ? 0.2 : 0.4, delay: i * 0.05 }}
            >
              {DICE_FACES[d - 1]}
            </motion.div>
          ))}
        </div>

        <motion.p
          className={`text-2xl font-bold ${lastWon ? theme.accentColor : "text-primary"}`}
          animate={lastWon ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: lastWon ? 3 : 0, duration: 0.3 }}
        >
          Total: {sum}
        </motion.p>

        <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4 flex-wrap">
          <span className="text-sm text-muted-foreground">Target:</span>
          {targetRange.map((t) => (
            <Button key={t} variant={target === t ? "default" : "outline"} size="sm"
              className={target === t ? `bg-gradient-to-r ${theme.bgGradient.replace("/80", "").replace("/80", "")}` : ""}
              onClick={() => !rolling && setTarget(t)}>{t}</Button>
          ))}
        </div>
      </Card>

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-lg font-bold text-center mb-4 ${lastWon ? theme.accentColor : ""}`}>{result}</motion.div>}

      <div className="grid grid-cols-2 gap-3">
        <Button className="py-6 text-lg bg-green-600 hover:bg-green-700 text-white" onClick={() => roll("over")} disabled={rolling || xpLives <= 0}>
          \u2B06\uFE0F Over {target}
        </Button>
        <Button className="py-6 text-lg bg-red-600 hover:bg-red-700 text-white" onClick={() => roll("under")} disabled={rolling || xpLives <= 0}>
          \u2B07\uFE0F Under {target}
        </Button>
      </div>
    </motion.div>
  );
};

export default DiceEngine;
