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
}

const getLotteryConfig = (gameId: string): { maxPicks: number; totalNumbers: number; drawnCount: number } => {
  switch (gameId) {
    case "lotto-6": return { maxPicks: 6, totalNumbers: 49, drawnCount: 6 };
    case "mega-millions": return { maxPicks: 5, totalNumbers: 40, drawnCount: 8 };
    case "pick-3": return { maxPicks: 3, totalNumbers: 10, drawnCount: 5 };
    case "power-ball": return { maxPicks: 5, totalNumbers: 35, drawnCount: 7 };
    case "daily-draw": return { maxPicks: 3, totalNumbers: 15, drawnCount: 5 };
    case "bingo-blast": return { maxPicks: 5, totalNumbers: 25, drawnCount: 8 };
    case "number-game": return { maxPicks: 4, totalNumbers: 20, drawnCount: 6 };
    default: return { maxPicks: 4, totalNumbers: 20, drawnCount: 6 };
  }
};

const getGridCols = (total: number): string => {
  if (total <= 10) return "grid-cols-5";
  if (total <= 15) return "grid-cols-5";
  if (total <= 25) return "grid-cols-5";
  if (total <= 35) return "grid-cols-7";
  return "grid-cols-7";
};

const LotteryEngine = ({ gameId, name, emoji, pointCost, theme }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const config = getLotteryConfig(gameId);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [state, setState] = useState<"idle" | "drawing" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);

  const toggleNumber = (n: number) => {
    if (state !== "idle") return;
    if (selectedNumbers.includes(n)) {
      setSelectedNumbers(selectedNumbers.filter((x) => x !== n));
    } else if (selectedNumbers.length < config.maxPicks) {
      setSelectedNumbers([...selectedNumbers, n]);
    }
  };

  const play = async () => {
    if (selectedNumbers.length !== config.maxPicks) { toast({ title: `Pick ${config.maxPicks} numbers`, variant: "destructive" }); return; }
    if (xpLives <= 0) { toast({ title: "No XP lives! \u26A1", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setState("drawing");
    setResult(null);
    setDrawnNumbers([]);

    const drawn: number[] = [];
    const available = Array.from({ length: config.totalNumbers }, (_, i) => i + 1);
    for (let i = 0; i < config.drawnCount; i++) {
      const idx = Math.floor(Math.random() * available.length);
      drawn.push(available.splice(idx, 1)[0]);
    }

    for (let i = 0; i < drawn.length; i++) {
      await new Promise((r) => setTimeout(r, 500));
      setDrawnNumbers((prev) => [...prev, drawn[i]]);
    }

    const matches = selectedNumbers.filter((n) => drawn.includes(n)).length;
    const payouts: Record<number, number> = {};
    for (let i = 0; i <= config.maxPicks; i++) {
      payouts[i] = i === 0 ? 0 : i === 1 ? 50 : i === 2 ? 500 : i === 3 ? 3000 : i === 4 ? 10000 : i === 5 ? 25000 : 50000;
    }
    let winnings = payouts[matches] || 0;
    if (winnings > 0) {
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && matches >= 3) recordFullWin();
      await updateBalance(winnings);
    }

    setResult(matches > 0 ? `\u{1F389} ${matches} match${matches > 1 ? "es" : ""}! Won \u20A6${winnings.toLocaleString()}!` : "No matches. Try again!");
    await recordGameResult(gameId, pointCost, winnings, { selected: selectedNumbers, drawn, matches });
    setState("done");
  };

  const reset = () => {
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setState("idle");
    setResult(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-6`}>{theme.description}</p>

      <Card className={`p-4 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 mb-4 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-5 text-9xl flex items-center justify-center pointer-events-none">{emoji}</div>
        <p className="text-sm text-muted-foreground mb-3 text-center relative">
          Select {config.maxPicks} numbers ({selectedNumbers.length}/{config.maxPicks})
        </p>
        <div className={`grid ${getGridCols(config.totalNumbers)} gap-1.5 sm:gap-2 relative`}>
          {Array.from({ length: config.totalNumbers }, (_, i) => i + 1).map((n) => {
            const isSelected = selectedNumbers.includes(n);
            const isDrawn = drawnNumbers.includes(n);
            const isMatch = isSelected && isDrawn;
            return (
              <motion.button key={n} onClick={() => toggleNumber(n)}
                className={`h-9 sm:h-11 rounded-lg font-bold text-xs sm:text-sm transition-all border-2 ${
                  isMatch ? "bg-green-500/30 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]" :
                  isDrawn ? `bg-yellow-500/20 border-yellow-500/50 text-yellow-400` :
                  isSelected ? `bg-primary/20 border-primary text-primary` :
                  "bg-background/50 border-border/50 hover:border-primary/50"
                }`}
                whileTap={{ scale: 0.9 }}
                animate={isMatch ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: isMatch ? 2 : 0, duration: 0.3 }}
              >
                {n}
              </motion.button>
            );
          })}
        </div>
      </Card>

      {drawnNumbers.length > 0 && (
        <Card className={`p-4 bg-gradient-to-r ${theme.bgGradient} mb-4`}>
          <p className="text-sm text-muted-foreground text-center mb-2">Drawn Numbers</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {drawnNumbers.map((n, i) => (
              <motion.div key={i} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  selectedNumbers.includes(n)
                    ? "bg-green-500 text-white shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                }`}>
                {n}
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-lg font-bold text-center mb-4 ${theme.accentColor}`}>{result}</motion.div>}

      {state === "idle" ? (
        <Button className="button-gradient w-full py-3 text-lg" onClick={play} disabled={selectedNumbers.length !== config.maxPicks || xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Draw (${pointCost} pts)`}
        </Button>
      ) : state === "done" ? (
        <Button className="button-gradient w-full py-3 text-lg" onClick={reset}>Play Again</Button>
      ) : null}
    </motion.div>
  );
};

export default LotteryEngine;
