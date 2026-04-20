import { useState, useEffect, useRef } from "react";
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
}

const getGridConfig = (variant?: string): { size: number; icons: string[]; time: number; cols: string } => {
  switch (variant) {
    case "space": return { size: 16, icons: ["\u{1F47E}", "\u{1F6F8}", "\u2B50", "\u{1F4A5}", "\u{1F52B}", "\u{1F30D}", "\u{1F680}", "\u{1F31F}"], time: 40, cols: "grid-cols-4" };
    case "ninja": return { size: 12, icons: ["\u{1F977}", "\u2694\uFE0F", "\u{1F319}", "\u{1F4A8}", "\u2B50", "\u{1F525}"], time: 25, cols: "grid-cols-4" };
    case "zombie": return { size: 12, icons: ["\u{1F9DF}", "\u{1F52B}", "\u{1F480}", "\u{1F9E0}", "\u{1F489}", "\u{1F525}"], time: 30, cols: "grid-cols-4" };
    case "fish": return { size: 12, icons: ["\u{1F41F}", "\u{1F420}", "\u{1F988}", "\u{1F419}", "\u{1F980}", "\u{1F48E}"], time: 35, cols: "grid-cols-4" };
    case "gems": return { size: 16, icons: ["\u{1F48E}", "\u{1F4A0}", "\u{1F52E}", "\u2728", "\u2B50", "\u{1F451}", "\u{1F525}", "\u{1F31F}"], time: 45, cols: "grid-cols-4" };
    case "bubble": return { size: 12, icons: ["\u{1FAE7}", "\u{1F535}", "\u{1F7E2}", "\u{1F534}", "\u{1F7E1}", "\u{1F7E3}"], time: 30, cols: "grid-cols-4" };
    case "pac": return { size: 12, icons: ["\u{1F7E1}", "\u{1F47B}", "\u{1F4B0}", "\u{1F352}", "\u2B50", "\u{1F48E}"], time: 30, cols: "grid-cols-4" };
    case "tetris": return { size: 12, icons: ["\u{1F9F1}", "\u{1F7E6}", "\u{1F7E7}", "\u{1F7E9}", "\u{1F7E5}", "\u{1F7E8}"], time: 30, cols: "grid-cols-4" };
    case "snake": return { size: 12, icons: ["\u{1F40D}", "\u{1FA9C}", "\u{1F3B2}", "\u2B50", "\u{1F4B0}", "\u{1F3C6}"], time: 30, cols: "grid-cols-4" };
    case "memory": return { size: 16, icons: ["\u{1F9E9}", "\u{1F48E}", "\u{1F31F}", "\u{1F525}", "\u{1F4B0}", "\u{1F451}", "\u2B50", "\u{1F3AF}"], time: 40, cols: "grid-cols-4" };
    case "word": return { size: 12, icons: ["\u{1F4DD}", "\u{1F4D6}", "\u{1F4A1}", "\u2B50", "\u{1F4B0}", "\u{1F3C6}"], time: 35, cols: "grid-cols-4" };
    case "math": return { size: 12, icons: ["\u2795", "\u2796", "\u2716\uFE0F", "\u2797", "\u{1F4AF}", "\u{1F9EE}"], time: 30, cols: "grid-cols-4" };
    case "treasure": return { size: 16, icons: ["\u{1F5FA}\uFE0F", "\u{1F4B0}", "\u{1F3F4}\u200D\u2620\uFE0F", "\u{1F48E}", "\u2693", "\u{1F531}"], time: 40, cols: "grid-cols-4" };
    case "candy": return { size: 12, icons: ["\u{1F36C}", "\u{1F36D}", "\u{1F36B}", "\u{1F382}", "\u{1F369}", "\u{1F36A}"], time: 30, cols: "grid-cols-4" };
    default: return { size: 12, icons: ["\u{1F34E}", "\u{1F34A}", "\u{1F347}", "\u{1F31F}", "\u{1F48E}", "\u{1F525}"], time: 30, cols: "grid-cols-4" };
  }
};

const ArcadeEngine = ({ gameId, name, emoji, pointCost, theme = { bgGradient: 'from-purple-900 to-black', accentColor: 'text-purple-400', description: '', variant: 'classic' } }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();
  const config = getGridConfig(theme.variant);
  const [grid, setGrid] = useState<string[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.time);
  const timerRef = useRef<number | null>(null);

  const generateGrid = () => {
    const pairs = config.size / 2;
    const selected = config.icons.slice(0, pairs);
    const cards = [...selected, ...selected].sort(() => Math.random() - 0.5);
    return cards;
  };

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! \u26A1", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setGrid(generateGrid());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setTimeLeft(config.time);
    setState("playing");
    setResult(null);

    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (timeLeft === 0 && state === "playing") endGame(matched.length);
  }, [timeLeft]);

  useEffect(() => {
    if (state === "playing" && matched.length === config.size) {
      if (timerRef.current) clearInterval(timerRef.current);
      endGame(matched.length);
    }
  }, [matched]);

  const endGame = async (matchCount: number) => {
    setState("done");
    if (timerRef.current) clearInterval(timerRef.current);
    const ratio = matchCount / config.size;
    let winnings = ratio >= 1 ? 5000 : ratio >= 0.5 ? 1500 : ratio > 0 ? 500 : 0;
    if (config.size === 16 && ratio >= 1) winnings = 8000;
    if (winnings > 0) {
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && ratio >= 1) recordFullWin();
      await updateBalance(winnings);
    }
    if (winnings > 0) play("win"); else play("lose");
    setResult(winnings > 0 ? `\u{1F389} Matched ${matchCount / 2} pairs! Won \u20A6${winnings.toLocaleString()}!` : "Time's up! Try again!");
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

  const getHiddenIcon = () => {
    switch (theme.variant) {
      case "ninja": return "\u{1F319}";
      case "zombie": return "\u{1F480}";
      case "fish": return "\u{1F30A}";
      case "space": return "\u{1F31F}";
      case "gems": return "\u2728";
      case "treasure": return "\u{1F5FA}\uFE0F";
      default: return "\u2753";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-6`}>{theme.description}</p>

      {state === "playing" && (
        <div className="flex justify-between items-center mb-4 text-sm">
          <span className="text-muted-foreground">Moves: {moves}</span>
          <span className={`font-bold ${timeLeft <= 10 ? "text-destructive animate-pulse" : theme.accentColor}`}>\u23F1 {timeLeft}s</span>
          <span className="text-muted-foreground">{matched.length / 2}/{config.size / 2} pairs</span>
        </div>
      )}

      {state !== "idle" && (
        <div className={`grid ${config.cols} gap-2 mb-4`}>
          {grid.map((icon, i) => {
            const isFlipped = flipped.includes(i) || matched.includes(i);
            return (
              <motion.div key={i} whileTap={{ scale: 0.95 }}>
                <Card
                  className={`h-14 sm:h-18 flex items-center justify-center cursor-pointer transition-all text-xl sm:text-2xl ${
                    isFlipped
                      ? `bg-gradient-to-br ${theme.bgGradient} border-primary/30`
                      : "bg-card/80 hover:bg-card"
                  } ${matched.includes(i) ? "opacity-70" : ""}`}
                  onClick={() => flipCard(i)}
                >
                  {isFlipped ? (
                    <motion.span initial={{ rotateY: 90 }} animate={{ rotateY: 0 }}>{icon}</motion.span>
                  ) : (
                    getHiddenIcon()
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-lg font-bold text-center mb-4 ${theme.accentColor}`}>{result}</motion.div>}

      {state !== "playing" && (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default ArcadeEngine;
