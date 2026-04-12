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

const LotteryEngine = ({ gameId, name, emoji, pointCost }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [state, setState] = useState<"idle" | "drawing" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);
  const MAX_PICKS = 4;
  const TOTAL_NUMBERS = 20;

  const toggleNumber = (n: number) => {
    if (state !== "idle") return;
    if (selectedNumbers.includes(n)) {
      setSelectedNumbers(selectedNumbers.filter((x) => x !== n));
    } else if (selectedNumbers.length < MAX_PICKS) {
      setSelectedNumbers([...selectedNumbers, n]);
    }
  };

  const play = async () => {
    if (selectedNumbers.length !== MAX_PICKS) { toast({ title: `Pick ${MAX_PICKS} numbers`, variant: "destructive" }); return; }
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setState("drawing");
    setResult(null);
    setDrawnNumbers([]);

    // Draw numbers one by one
    const drawn: number[] = [];
    const available = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    for (let i = 0; i < 6; i++) {
      const idx = Math.floor(Math.random() * available.length);
      drawn.push(available.splice(idx, 1)[0]);
    }

    for (let i = 0; i < drawn.length; i++) {
      await new Promise((r) => setTimeout(r, 500));
      setDrawnNumbers((prev) => [...prev, drawn[i]]);
    }

    const matches = selectedNumbers.filter((n) => drawn.includes(n)).length;
    const payoutMap: Record<number, number> = { 0: 0, 1: 50, 2: 500, 3: 3000, 4: 25000 };
    let winnings = payoutMap[matches] || 0;
    if (winnings > 0) {
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && matches >= 3) recordFullWin();
      await updateBalance(winnings);
    }

    setResult(matches > 0 ? `🎉 ${matches} match${matches > 1 ? "es" : ""}! Won ₦${winnings.toLocaleString()}!` : "No matches. Try again!");
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
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center mb-6">Pick {MAX_PICKS} numbers! • {pointCost} pts</p>

      <Card className="p-4 bg-card/80 backdrop-blur-sm border-primary/30 mb-4">
        <p className="text-sm text-muted-foreground mb-3 text-center">Select {MAX_PICKS} numbers ({selectedNumbers.length}/{MAX_PICKS})</p>
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map((n) => {
            const isSelected = selectedNumbers.includes(n);
            const isDrawn = drawnNumbers.includes(n);
            const isMatch = isSelected && isDrawn;
            return (
              <motion.button key={n} onClick={() => toggleNumber(n)}
                className={`h-10 sm:h-12 rounded-lg font-bold text-sm transition-all border-2 ${
                  isMatch ? "bg-green-500/30 border-green-500 text-green-400" :
                  isDrawn ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" :
                  isSelected ? "bg-primary/20 border-primary text-primary" :
                  "bg-background border-border hover:border-primary/50"
                }`}
                whileTap={{ scale: 0.9 }}>
                {n}
              </motion.button>
            );
          })}
        </div>
      </Card>

      {drawnNumbers.length > 0 && (
        <Card className="p-4 bg-card/50 mb-4">
          <p className="text-sm text-muted-foreground text-center mb-2">Drawn Numbers</p>
          <div className="flex gap-2 justify-center">
            {drawnNumbers.map((n, i) => (
              <motion.div key={i} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  selectedNumbers.includes(n) ? "bg-green-500 text-white" : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                }`}>
                {n}
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-center mb-4">{result}</motion.div>}

      {state === "idle" ? (
        <Button className="button-gradient w-full py-3 text-lg" onClick={play} disabled={selectedNumbers.length !== MAX_PICKS || xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Draw (${pointCost} pts)`}
        </Button>
      ) : state === "done" ? (
        <Button className="button-gradient w-full py-3 text-lg" onClick={reset}>Play Again</Button>
      ) : null}
    </motion.div>
  );
};

export default LotteryEngine;
