import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  maxNumber?: number;
  pickCount?: number;
  drawCount?: number;
}

const DEFAULT_THEME: GameTheme = { bgGradient: "from-blue-950 to-black", accentColor: "text-blue-400", description: "Pick your lucky numbers!", variant: "classic" };

const NumberPickEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME, maxNumber = 49, pickCount = 6, drawCount = 6 }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();

  const [selected, setSelected] = useState<number[]>([]);
  const [drawn, setDrawn] = useState<number[]>([]);
  const [state, setState] = useState<"idle" | "picking" | "drawing" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [currentDraw, setCurrentDraw] = useState(0);

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setSelected([]);
    setDrawn([]);
    setResult(null);
    setCurrentDraw(0);
    setState("picking");
  };

  const toggleNumber = (n: number) => {
    if (state !== "picking") return;
    if (selected.includes(n)) {
      setSelected(selected.filter(x => x !== n));
    } else if (selected.length < pickCount) {
      setSelected([...selected, n]);
    }
  };

  const confirmPicks = () => {
    if (selected.length !== pickCount) {
      toast({ title: `Pick exactly ${pickCount} numbers`, variant: "destructive" });
      return;
    }
    setState("drawing");
    // Generate random draw
    const drawNums: number[] = [];
    while (drawNums.length < drawCount) {
      const n = Math.floor(Math.random() * maxNumber) + 1;
      if (!drawNums.includes(n)) drawNums.push(n);
    }

    // Animate draw one by one
    let i = 0;
    const interval = setInterval(() => {
      setDrawn(prev => [...prev, drawNums[i]]);
      setCurrentDraw(i + 1);
      i++;
      if (i >= drawCount) {
        clearInterval(interval);
        setTimeout(() => finishGame(drawNums), 800);
      }
    }, 600);
  };

  const finishGame = async (drawNums: number[]) => {
    setState("done");
    const matches = selected.filter(n => drawNums.includes(n)).length;
    let winnings = 0;
    if (matches >= pickCount) winnings = 5000;
    else if (matches >= pickCount - 1) winnings = 2000;
    else if (matches >= pickCount - 2) winnings = 500;
    else if (matches >= 2) winnings = 100;

    if (winnings > 0) {
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && matches >= pickCount - 1) recordFullWin();
      await updateBalance(winnings);
    }
    setResult(winnings > 0
      ? `🎉 ${matches}/${pickCount} matched! Won ₦${winnings.toLocaleString()}!`
      : `${matches}/${pickCount} matched. Better luck next time!`);
    await recordGameResult(gameId, pointCost, winnings, { selected, drawn: drawNums, matches });
  };

  const isDrawnMatch = (n: number) => selected.includes(n) && drawn.includes(n);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-4`}>{theme.description}</p>

      {state === "picking" && (
        <p className="text-center text-sm text-muted-foreground mb-3">
          Pick {pickCount - selected.length} more number{pickCount - selected.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Selected numbers display */}
      {(state === "picking" || state === "drawing" || state === "done") && (
        <div className="flex justify-center gap-2 mb-4 flex-wrap">
          {selected.map(n => (
            <motion.div key={n}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                drawn.includes(n) ? "bg-green-500/30 border-green-400 text-green-300" : "bg-primary/20 border-primary/50 text-primary"
              }`}
              animate={drawn.includes(n) ? { scale: [1, 1.3, 1] } : {}}
            >
              {n}
            </motion.div>
          ))}
        </div>
      )}

      {/* Drawn numbers */}
      {(state === "drawing" || state === "done") && drawn.length > 0 && (
        <div className="mb-4">
          <p className="text-center text-xs text-muted-foreground mb-2">Drawn Numbers:</p>
          <div className="flex justify-center gap-2 flex-wrap">
            <AnimatePresence>
              {drawn.map((n, i) => (
                <motion.div key={n}
                  initial={{ scale: 0, rotateY: 180 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold border-2 ${
                    selected.includes(n) ? "bg-green-500 border-green-300 text-white" : "bg-card border-border text-foreground"
                  }`}
                >
                  {n}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Number grid for picking */}
      {state === "picking" && (
        <Card className={`p-3 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 mb-4`}>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(maxNumber, 10)}, 1fr)` }}>
            {Array.from({ length: maxNumber }, (_, i) => i + 1).map(n => (
              <motion.button key={n}
                className={`aspect-square rounded-md flex items-center justify-center text-xs sm:text-sm font-bold transition-all border ${
                  selected.includes(n)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card/30 border-border/20 hover:bg-card/60 text-foreground"
                }`}
                onClick={() => toggleNumber(n)}
                whileTap={{ scale: 0.9 }}
              >
                {n}
              </motion.button>
            ))}
          </div>
        </Card>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className={`text-lg font-bold text-center mb-4 ${theme.accentColor}`}>{result}</motion.div>
      )}

      {state === "picking" && (
        <Button className="button-gradient w-full py-3 text-lg" onClick={confirmPicks}
          disabled={selected.length !== pickCount}>
          Draw Numbers 🎱
        </Button>
      )}

      {(state === "idle" || state === "done") && (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default NumberPickEngine;
