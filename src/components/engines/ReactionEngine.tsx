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
  targets?: string[];
  duration?: number;
  gridCols?: number;
  gridSize?: number;
}

const DEFAULT_THEME: GameTheme = { bgGradient: "from-green-950 to-black", accentColor: "text-green-400", description: "Tap fast!", variant: "classic" };

const ReactionEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME, targets, duration = 20, gridCols = 4, gridSize = 16 }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const defaultTargets = ["👾", "🎯", "⭐", "💎", "🔥"];
  const tgtIcons = targets || defaultTargets;

  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [activeTargets, setActiveTargets] = useState<{ pos: number; icon: string; id: number }[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [tapEffects, setTapEffects] = useState<{ pos: number; id: number }[]>([]);
  const timerRef = useRef<number | null>(null);
  const spawnRef = useRef<number | null>(null);
  const idCounter = useRef(0);

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setScore(0);
    setTimeLeft(duration);
    setActiveTargets([]);
    setResult(null);
    setState("playing");
    idCounter.current = 0;
  };

  // Timer
  useEffect(() => {
    if (state !== "playing") return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) return 0;
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  // End game when time runs out
  useEffect(() => {
    if (timeLeft === 0 && state === "playing") endGame();
  }, [timeLeft, state]);

  // Spawn targets
  useEffect(() => {
    if (state !== "playing") return;
    const spawnTarget = () => {
      const pos = Math.floor(Math.random() * gridSize);
      const icon = tgtIcons[Math.floor(Math.random() * tgtIcons.length)];
      const id = ++idCounter.current;
      setActiveTargets(prev => [...prev.slice(-4), { pos, icon, id }]);

      // Auto-remove after 1.5s
      setTimeout(() => {
        setActiveTargets(prev => prev.filter(t => t.id !== id));
      }, 1500);
    };

    spawnTarget();
    spawnRef.current = window.setInterval(spawnTarget, 800);
    return () => { if (spawnRef.current) clearInterval(spawnRef.current); };
  }, [state]);

  const hitTarget = useCallback((targetId: number, pos: number) => {
    setActiveTargets(prev => prev.filter(t => t.id !== targetId));
    setScore(s => s + 10);
    setTapEffects(prev => [...prev, { pos, id: targetId }]);
    setTimeout(() => setTapEffects(prev => prev.filter(e => e.id !== targetId)), 400);
  }, []);

  const endGame = async () => {
    setState("done");
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
    setActiveTargets([]);

    let winnings = getTierPayout(score, REACTION_TIERS);
    if (winnings > 0) {
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && score >= 150) recordFullWin();
      await updateBalance(winnings);
    }
    if (winnings > 0) play("win"); else play("lose");
    setResult(winnings > 0 ? `🎉 Score: ${score}! Won ₦${winnings.toLocaleString()}!` : `Score: ${score}. Need 20+ to win!`);
    await recordGameResult(gameId, pointCost, winnings, { score, duration });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-4`}>{theme.description}</p>

      {state === "playing" && (
        <div className="flex justify-between items-center mb-3">
          <span className={`font-bold ${theme.accentColor}`}>Score: {score}</span>
          <span className={`font-bold ${timeLeft <= 5 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>
            ⏱ {timeLeft}s
          </span>
        </div>
      )}

      <Card className={`p-3 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 mb-4`}>
        <div className={`grid grid-cols-${gridCols} gap-1.5`} style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
          {Array.from({ length: gridSize }).map((_, i) => {
            const target = activeTargets.find(t => t.pos === i);
            const tapEffect = tapEffects.find(e => e.pos === i);

            return (
              <motion.div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-2xl sm:text-3xl transition-all border ${
                  target ? "bg-primary/20 border-primary/50 cursor-pointer" :
                  tapEffect ? "bg-green-500/20 border-green-500/30" :
                  "bg-card/30 border-border/20"
                }`}
                onClick={() => target && hitTarget(target.id, i)}
                whileTap={target ? { scale: 0.8 } : {}}
              >
                <AnimatePresence>
                  {target && (
                    <motion.span
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {target.icon}
                    </motion.span>
                  )}
                  {tapEffect && (
                    <motion.span
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      className={`text-sm font-bold ${theme.accentColor}`}
                    >
                      +10
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className={`text-lg font-bold text-center mb-4 ${theme.accentColor}`}>
          {result}
        </motion.div>
      )}

      {state !== "playing" && (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default ReactionEngine;
