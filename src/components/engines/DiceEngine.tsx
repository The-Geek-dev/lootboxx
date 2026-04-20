import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { GameTheme } from "@/config/gameThemes";
import { useGameSounds } from "@/hooks/useGameSounds";
import { DICE_PAYOUTS } from "@/config/payouts";
import GameBackground from "./GameBackground";
import RoundHistory from "./RoundHistory";
import BetControls from "./BetControls";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  diceCount?: number;
  targetRange?: number[];
}

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const DiceEngine = ({ gameId, name, emoji, pointCost, theme = { bgGradient: 'from-purple-900 to-black', accentColor: 'text-purple-400', description: '', variant: 'classic' }, diceCount = 2, targetRange = [5, 6, 7, 8, 9] }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();
  const [dice, setDice] = useState(Array(diceCount).fill(1));
  const [target, setTarget] = useState(targetRange[Math.floor(targetRange.length / 2)]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastWon, setLastWon] = useState(false);
  const [history, setHistory] = useState<{ value: number; won: boolean }[]>([]);

  const roll = async (betType: "over" | "under") => {
    if (rolling) return;
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setRolling(true);
    setResult(null);
    setLastWon(false);
    play("spin");

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
          winnings = diff >= 4 ? DICE_PAYOUTS.bigDiff : diff >= 2 ? DICE_PAYOUTS.midDiff : DICE_PAYOUTS.smallDiff;
          if (diceCount === 3) winnings = Math.floor(winnings * DICE_PAYOUTS.threeDiceBonus);
          winnings = adjustWinAmount(winnings);
          if (canFullyWin() && winnings >= 1000) recordFullWin();
          if (winnings > 0) updateBalance(winnings);
          setLastWon(true);
        }

        if (won) play("win"); else play("lose");
        setResult(won ? `🎉 ${total}! You won ₦${winnings.toLocaleString()}!` : `${total}. Not this time!`);
        setHistory(prev => [...prev, { value: total, won }]);
        recordGameResult(gameId, pointCost, winnings, { dice: finalDice, total, bet: betType, target });
        setRolling(false);
      }
    }, 80);
  };

  const sum = dice.reduce((s, d) => s + d, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <RoundHistory results={history} formatValue={(v) => `${v}`} />

      <GameBackground type="dice" overlay="medium" className="mb-4">
        <div className="p-6 sm:p-8 text-center">
          <div className="flex gap-4 sm:gap-6 justify-center mb-6">
            {dice.map((d, i) => (
              <motion.div
                key={i}
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-5xl sm:text-7xl bg-black/30 border border-white/10 shadow-2xl"
                animate={rolling ? { rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.1, 0.9, 1] } : lastWon ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: rolling ? Infinity : lastWon ? 2 : 0, duration: rolling ? 0.2 : 0.4, delay: i * 0.05 }}
              >
                {DICE_FACES[d - 1]}
              </motion.div>
            ))}
          </div>

          <motion.p
            className={`text-3xl sm:text-4xl font-black ${lastWon ? "text-green-400" : "text-white"}`}
            animate={lastWon ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: lastWon ? 3 : 0, duration: 0.3 }}
            style={{ textShadow: "0 0 20px currentColor" }}
          >
            {sum}
          </motion.p>

          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-5 flex-wrap">
            <span className="text-sm text-white/60">Target:</span>
            {targetRange.map((t) => (
              <button
                key={t}
                onClick={() => !rolling && setTarget(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                  target === t
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`text-lg font-bold text-center mb-4 ${lastWon ? "text-green-400" : "text-muted-foreground"}`}>
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3">
        <Button className="py-6 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" onClick={() => roll("over")} disabled={rolling || xpLives <= 0}>
          ⬆️ Over {target}
        </Button>
        <Button className="py-6 text-lg font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20" onClick={() => roll("under")} disabled={rolling || xpLives <= 0}>
          ⬇️ Under {target}
        </Button>
      </div>
    </motion.div>
  );
};

export default DiceEngine;
