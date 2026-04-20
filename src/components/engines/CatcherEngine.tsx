import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
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
  items?: { emoji: string; points: number }[];
  badItems?: string[];
  duration?: number;
}

const DEFAULT_THEME: GameTheme = { bgGradient: "from-indigo-950 to-black", accentColor: "text-indigo-400", description: "Catch the falling items!", variant: "classic" };

interface FallingItem {
  id: number;
  col: number;
  row: number;
  emoji: string;
  points: number;
  isBad: boolean;
}

const COLS = 5;
const ROWS = 8;

const CatcherEngine = ({
  gameId, name, emoji, pointCost, theme = DEFAULT_THEME,
  items = [{ emoji: "💎", points: 30 }, { emoji: "⭐", points: 20 }, { emoji: "🪙", points: 10 }],
  badItems = ["💣", "☠️"],
  duration = 25
}: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [catcherPos, setCatcherPos] = useState(2);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(duration);
  const [result, setResult] = useState<string | null>(null);
  const [catchEffect, setCatchEffect] = useState<string | null>(null);
  const idRef = useRef(0);
  const gameRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setCatcherPos(2);
    setFallingItems([]);
    setScore(0);
    setLives(3);
    scoreRef.current = 0;
    livesRef.current = 3;
    setTimeLeft(duration);
    setState("playing");
    setResult(null);
    idRef.current = 0;
  };

  // Timer
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

  // Spawn items
  useEffect(() => {
    if (state !== "playing") return;
    spawnRef.current = window.setInterval(() => {
      const isBad = Math.random() < 0.2;
      const item = isBad
        ? { emoji: badItems[Math.floor(Math.random() * badItems.length)], points: 0 }
        : items[Math.floor(Math.random() * items.length)];
      const newItem: FallingItem = {
        id: ++idRef.current,
        col: Math.floor(Math.random() * COLS),
        row: 0,
        emoji: item.emoji,
        points: item.points,
        isBad
      };
      setFallingItems(prev => [...prev, newItem]);
    }, 800);
    return () => { if (spawnRef.current) clearInterval(spawnRef.current); };
  }, [state]);

  // Move items down
  useEffect(() => {
    if (state !== "playing") return;
    gameRef.current = window.setInterval(() => {
      setFallingItems(prev => {
        const updated: FallingItem[] = [];
        prev.forEach(item => {
          const newRow = item.row + 1;
          if (newRow >= ROWS - 1) {
            // Check if catcher catches it
            if (item.col === catcherPos || item.col === catcherPos - 1 || item.col === catcherPos + 1) {
              if (item.isBad) {
                livesRef.current -= 1;
                setLives(livesRef.current);
                setCatchEffect("💥");
                if (livesRef.current <= 0) endGame();
              } else {
                scoreRef.current += item.points;
                setScore(scoreRef.current);
                setCatchEffect(`+${item.points}`);
              }
              setTimeout(() => setCatchEffect(null), 400);
            }
            // Item is gone either way
          } else {
            updated.push({ ...item, row: newRow });
          }
        });
        return updated;
      });
    }, 400);
    return () => { if (gameRef.current) clearInterval(gameRef.current); };
  }, [state, catcherPos]);

  const endGame = async () => {
    setState("done");
    [timerRef, spawnRef, gameRef].forEach(ref => { if (ref.current) clearInterval(ref.current); });
    setFallingItems([]);
    const finalScore = scoreRef.current;
    let winnings = getTierPayout(finalScore, SCORE_4_TIERS);
    if (winnings > 0) {
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && finalScore >= 200) recordFullWin();
      await updateBalance(winnings);
    }
    if (winnings > 0) play("win"); else play("lose");
    setResult(winnings > 0 ? `🎉 Score: ${finalScore}! Won ₦${winnings.toLocaleString()}!` : `Score: ${finalScore}. Keep trying!`);
    await recordGameResult(gameId, pointCost, winnings, { score: finalScore, duration });
  };

  // Keyboard controls
  useEffect(() => {
    if (state !== "playing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCatcherPos(p => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setCatcherPos(p => Math.min(COLS - 1, p + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-4`}>{theme.description}</p>

      {state === "playing" && (
        <div className="flex justify-between items-center mb-3">
          <span className={`font-bold ${theme.accentColor}`}>Score: {score}</span>
          <span className="text-muted-foreground">{"❤️".repeat(lives)}{"🖤".repeat(3 - lives)}</span>
          <span className={`font-bold ${timeLeft <= 5 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>⏱ {timeLeft}s</span>
        </div>
      )}

      <Card className={`p-2 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 mb-4 relative overflow-hidden`}>
        <div className="relative" style={{ height: `${ROWS * 40}px` }}>
          {/* Falling items */}
          {fallingItems.map(item => (
            <motion.div key={item.id}
              className="absolute text-2xl"
              style={{
                left: `${(item.col / COLS) * 100}%`,
                top: `${(item.row / ROWS) * 100}%`,
                width: `${100 / COLS}%`,
                textAlign: "center"
              }}
              animate={{ opacity: 1 }}
            >
              {item.emoji}
            </motion.div>
          ))}

          {/* Catcher */}
          {state === "playing" && (
            <motion.div
              className="absolute bottom-0 text-2xl text-center"
              style={{
                left: `${(catcherPos / COLS) * 100}%`,
                width: `${100 / COLS}%`
              }}
              animate={{ x: 0 }}
            >
              🧺
              {catchEffect && (
                <motion.span
                  className={`absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-bold ${catchEffect === "💥" ? "text-red-400" : "text-green-400"}`}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -20 }}
                >
                  {catchEffect}
                </motion.span>
              )}
            </motion.div>
          )}
        </div>
      </Card>

      {/* Touch controls */}
      {state === "playing" && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button variant="outline" className="py-4 text-xl"
            onPointerDown={() => setCatcherPos(p => Math.max(0, p - 1))}>← Left</Button>
          <Button variant="outline" className="py-4 text-xl"
            onPointerDown={() => setCatcherPos(p => Math.min(COLS - 1, p + 1))}>Right →</Button>
        </div>
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

export default CatcherEngine;
