import { useState, useEffect, useRef } from "react";
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

const GRID_SIZE = 12;
const ICONS = ["🍎", "🍊", "🍇", "🌟", "💎", "🔥"];

const ArcadeEngine = ({ gameId, name, emoji, pointCost }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [grid, setGrid] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<number | null>(null);

  const generateGrid = () => {
    const pairs = GRID_SIZE / 2;
    const selected = ICONS.slice(0, pairs);
    const cards = [...selected, ...selected].sort(() => Math.random() - 0.5);
    return cards;
  };

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setGrid(generateGrid());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTimeLeft(30);
    setState("playing");
    setResult(null);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  // Handle time up
  useEffect(() => {
    if (timeLeft === 0 && state === "playing") {
      endGame(matched.length);
    }
  }, [timeLeft]);

  // Check all matched
  useEffect(() => {
    if (state === "playing" && matched.length === GRID_SIZE) {
      if (timerRef.current) clearInterval(timerRef.current);
      endGame(matched.length);
    }
  }, [matched]);

  const endGame = async (matchCount: number) => {
    setState("done");
    if (timerRef.current) clearInterval(timerRef.current);
    const ratio = matchCount / GRID_SIZE;
    let winnings = ratio >= 1 ? 2000 : ratio >= 0.5 ? 500 : ratio > 0 ? 100 : 0;
    if (winnings > 0) {
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && ratio >= 1) recordFullWin();
      await updateBalance(winnings);
    }
    setResult(winnings > 0 ? `🎉 Matched ${matchCount / 2} pairs! Won ₦${winnings.toLocaleString()}!` : "Time's up! No matches.");
    await recordGameResult(gameId, pointCost, winnings, { matchCount, moves, timeLeft });
  };

  const flipCard = (index: number) => {
    if (state !== "playing" || flipped.length >= 2 || flipped.includes(index) || matched.includes(index)) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);
    setMoves((m) => m + 1);

    if (newFlipped.length === 2) {
      const [a, b] = newFlipped;
      if (grid[a] === grid[b]) {
        setMatched((m) => [...m, a, b]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 600);
      }
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center mb-6">Match all pairs before time runs out! • {pointCost} pts</p>

      {state === "playing" && (
        <div className="flex justify-between items-center mb-4 text-sm">
          <span className="text-muted-foreground">Moves: {moves}</span>
          <span className={`font-bold ${timeLeft <= 10 ? "text-destructive" : "text-primary"}`}>⏱ {timeLeft}s</span>
          <span className="text-muted-foreground">{matched.length / 2}/{GRID_SIZE / 2} pairs</span>
        </div>
      )}

      {state !== "idle" && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          {grid.map((icon, i) => {
            const isFlipped = flipped.includes(i) || matched.includes(i);
            return (
              <motion.div key={i} whileTap={{ scale: 0.95 }}>
                <Card className={`h-16 sm:h-20 flex items-center justify-center cursor-pointer transition-all text-2xl ${isFlipped ? "bg-primary/10 border-primary/30" : "bg-card/80"}`}
                  onClick={() => flipCard(i)}>
                  {isFlipped ? icon : "❓"}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-center mb-4">{result}</motion.div>}

      {state !== "playing" && (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default ArcadeEngine;
