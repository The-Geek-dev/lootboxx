import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { GameTheme } from "@/config/gameThemes";
import { useGameSounds } from "@/hooks/useGameSounds";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  symbols?: string[];
  duration?: number;
}

const DEFAULT_THEME: GameTheme = { bgGradient: "from-pink-950 to-black", accentColor: "text-pink-400", description: "Match 3 or more!", variant: "classic" };
const ROWS = 6;
const COLS = 6;

const MatchThreeEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME, symbols = ["🍎", "🍊", "🍇", "🍋", "🍒", "⭐"], duration = 30 }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [grid, setGrid] = useState<string[][]>([]);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [score, setScore] = useState(0);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(duration);
  const [result, setResult] = useState<string | null>(null);
  const [popCells, setPopCells] = useState<Set<string>>(new Set());
  const timerRef = useRef<number | null>(null);

  const randomSymbol = () => symbols[Math.floor(Math.random() * symbols.length)];

  const createGrid = (): string[][] => {
    const g: string[][] = [];
    for (let r = 0; r < ROWS; r++) {
      g[r] = [];
      for (let c = 0; c < COLS; c++) {
        let s: string;
        do {
          s = randomSymbol();
        } while (
          (c >= 2 && g[r][c - 1] === s && g[r][c - 2] === s) ||
          (r >= 2 && g[r - 1][c] === s && g[r - 2][c] === s)
        );
        g[r][c] = s;
      }
    }
    return g;
  };

  const findMatches = (g: string[][]): Set<string> => {
    const matched = new Set<string>();
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 2; c++) {
        if (g[r][c] && g[r][c] === g[r][c + 1] && g[r][c] === g[r][c + 2]) {
          matched.add(`${r},${c}`); matched.add(`${r},${c + 1}`); matched.add(`${r},${c + 2}`);
        }
      }
    }
    // Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 2; r++) {
        if (g[r][c] && g[r][c] === g[r + 1][c] && g[r][c] === g[r + 2][c]) {
          matched.add(`${r},${c}`); matched.add(`${r + 1},${c}`); matched.add(`${r + 2},${c}`);
        }
      }
    }
    return matched;
  };

  const clearAndFill = useCallback((g: string[][]): { newGrid: string[][]; cleared: number } => {
    const matched = findMatches(g);
    if (matched.size === 0) return { newGrid: g, cleared: 0 };

    let totalCleared = matched.size;
    const newG = g.map(row => [...row]);

    // Remove matched
    matched.forEach(key => {
      const [r, c] = key.split(",").map(Number);
      newG[r][c] = "";
    });

    // Gravity: drop down
    for (let c = 0; c < COLS; c++) {
      let writeRow = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (newG[r][c] !== "") {
          newG[writeRow][c] = newG[r][c];
          if (writeRow !== r) newG[r][c] = "";
          writeRow--;
        }
      }
      for (let r = writeRow; r >= 0; r--) {
        newG[r][c] = randomSymbol();
      }
    }

    // Check for cascading matches
    const cascade = clearAndFill(newG);
    return { newGrid: cascade.newGrid, cleared: totalCleared + cascade.cleared };
  }, [symbols]);

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setGrid(createGrid());
    setScore(0);
    setTimeLeft(duration);
    setState("playing");
    setResult(null);
    setSelected(null);
  };

  useEffect(() => {
    if (state !== "playing") return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => { if (t <= 1) return 0; return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  useEffect(() => {
    if (timeLeft === 0 && state === "playing") endGame();
  }, [timeLeft, state]);

  const isAdjacent = (a: [number, number], b: [number, number]) => {
    return (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])) === 1;
  };

  const handleCellClick = (r: number, c: number) => {
    if (state !== "playing") return;
    if (!selected) { setSelected([r, c]); return; }
    if (selected[0] === r && selected[1] === c) { setSelected(null); return; }
    if (!isAdjacent(selected, [r, c])) { setSelected([r, c]); return; }

    // Swap
    const newGrid = grid.map(row => [...row]);
    const [sr, sc] = selected;
    [newGrid[sr][sc], newGrid[r][c]] = [newGrid[r][c], newGrid[sr][sc]];

    const matches = findMatches(newGrid);
    if (matches.size > 0) {
      setPopCells(matches);
      setTimeout(() => {
        const { newGrid: filled, cleared } = clearAndFill(newGrid);
        setGrid(filled);
        setScore(s => s + cleared * 10);
        setPopCells(new Set());
      }, 300);
    } else {
      // Swap back - invalid move
      toast({ title: "No match!", description: "Try a different swap", variant: "destructive" });
    }
    setSelected(null);
  };

  const endGame = async () => {
    setState("done");
    if (timerRef.current) clearInterval(timerRef.current);
    let winnings = score >= 300 ? 3000 : score >= 200 ? 2000 : score >= 100 ? 1000 : score >= 50 ? 300 : 0;
    if (winnings > 0) {
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && score >= 200) recordFullWin();
      await updateBalance(winnings);
    }
    setResult(winnings > 0 ? `🎉 Score: ${score}! Won ₦${winnings.toLocaleString()}!` : `Score: ${score}. Keep practicing!`);
    await recordGameResult(gameId, pointCost, winnings, { score, duration });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-4`}>{theme.description}</p>

      {state === "playing" && (
        <div className="flex justify-between items-center mb-3">
          <span className={`font-bold ${theme.accentColor}`}>Score: {score}</span>
          <span className={`font-bold ${timeLeft <= 5 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>⏱ {timeLeft}s</span>
        </div>
      )}

      <Card className={`p-2 sm:p-3 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 mb-4`}>
        <div className="grid grid-cols-6 gap-1" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}>
          {grid.flat().map((symbol, idx) => {
            const r = Math.floor(idx / COLS);
            const c = idx % COLS;
            const isSelected = selected && selected[0] === r && selected[1] === c;
            const isPopping = popCells.has(`${r},${c}`);

            return (
              <motion.div
                key={`${r}-${c}`}
                className={`aspect-square rounded-lg flex items-center justify-center text-xl sm:text-2xl cursor-pointer border transition-all ${
                  isSelected ? "border-primary bg-primary/20 scale-110" :
                  isPopping ? "border-yellow-400 bg-yellow-400/20" :
                  "border-border/20 bg-card/30 hover:bg-card/50"
                }`}
                onClick={() => handleCellClick(r, c)}
                animate={isPopping ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] } : {}}
                transition={{ duration: 0.3 }}
                whileTap={{ scale: 0.9 }}
              >
                {symbol}
              </motion.div>
            );
          })}
        </div>
      </Card>

      {state === "idle" && (
        <p className="text-center text-xs text-muted-foreground mb-3">Swap adjacent items to match 3+ in a row!</p>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className={`text-lg font-bold text-center mb-4 ${theme.accentColor}`}>{result}</motion.div>
      )}

      {state !== "playing" && (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default MatchThreeEngine;
