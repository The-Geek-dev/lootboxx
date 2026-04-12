import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
const DEFAULT_THEME: GameTheme = { bgGradient: 'from-purple-900 to-black', accentColor: 'text-purple-400', description: '', variant: 'classic' };
import { GameTheme } from "@/config/gameThemes";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  visuals?: { icon: string; trailEmoji: string; crashEmoji: string };
}

const CrashEngine = ({ gameId, name, emoji, pointCost, theme, visuals }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [state, setState] = useState<"idle" | "rising" | "crashed" | "cashed">("idle");
  const [result, setResult] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const v = visuals || { icon: "\u2708\uFE0F", trailEmoji: "\u2601\uFE0F", crashEmoji: "\u{1F4A5}" };

  const start = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! \u26A1", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    const cp = 1 + Math.random() * Math.random() * 9;
    setCrashPoint(cp);
    setMultiplier(1.0);
    setState("rising");
    setResult(null);

    intervalRef.current = window.setInterval(() => {
      setMultiplier((m) => {
        const next = m + 0.02 + Math.random() * 0.03;
        if (next >= cp) {
          clearInterval(intervalRef.current!);
          setState("crashed");
          return cp;
        }
        return next;
      });
    }, 50);
  };

  useEffect(() => {
    if (state === "crashed") {
      setResult(`${v.crashEmoji} Crashed at ${crashPoint.toFixed(2)}x! You lost.`);
      recordGameResult(gameId, pointCost, 0, { crashPoint, cashedAt: null });
    }
  }, [state, crashPoint]);

  const cashOut = useCallback(async () => {
    if (state !== "rising") return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState("cashed");
    const currentMult = multiplier;
    let winnings = Math.floor(pointCost * currentMult * 2);
    winnings = adjustWinAmount(winnings);
    if (winnings > 0 && canFullyWin() && currentMult >= 3) recordFullWin();
    if (winnings > 0) await updateBalance(winnings);
    setResult(`\u2705 Cashed out at ${currentMult.toFixed(2)}x! Won \u20A6${winnings.toLocaleString()}`);
    await recordGameResult(gameId, pointCost, winnings, { crashPoint, cashedAt: currentMult });
  }, [state, multiplier, crashPoint]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const getColor = () => {
    if (state === "crashed") return "text-destructive";
    if (state === "cashed") return "text-green-400";
    if (multiplier > 3) return theme.accentColor;
    if (multiplier > 2) return "text-primary";
    return "text-foreground";
  };

  // Generate trail dots based on multiplier
  const trailCount = Math.min(Math.floor(multiplier * 2), 10);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-6`}>{theme.description}</p>

      <Card className={`p-8 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 text-center mb-4 relative overflow-hidden`}>
        {/* Animated atmosphere text */}
        {state === "rising" && theme.atmosphere && (
          <motion.p
            className={`absolute top-3 left-0 right-0 text-xs ${theme.accentColor} opacity-60`}
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {theme.atmosphere}
          </motion.p>
        )}

        {/* Animated icon */}
        <motion.div
          className="text-3xl mb-2"
          animate={state === "rising" ? { 
            y: [-20, -40 - multiplier * 5],
            x: [0, Math.sin(multiplier) * 10],
          } : state === "crashed" ? { y: [0, 20], rotate: [0, 45], opacity: [1, 0.5] } : {}}
          transition={{ duration: 0.5 }}
        >
          {state === "crashed" ? v.crashEmoji : v.icon}
        </motion.div>

        {/* Trail elements */}
        {state === "rising" && (
          <div className="flex justify-center gap-1 mb-2">
            {Array.from({ length: trailCount }).map((_, i) => (
              <motion.span
                key={i}
                className="text-sm opacity-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
              >
                {v.trailEmoji}
              </motion.span>
            ))}
          </div>
        )}

        <motion.div
          className={`text-6xl sm:text-8xl font-mono font-bold ${getColor()}`}
          animate={state === "rising" ? { scale: [1, 1.02, 1] } : state === "crashed" ? { x: [-5, 5, -5, 0] } : {}}
          transition={{ repeat: state === "rising" ? Infinity : 0, duration: 0.3 }}
        >
          {multiplier.toFixed(2)}x
        </motion.div>

        <div className="mt-4 h-3 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${state === "crashed" ? "bg-destructive" : `bg-gradient-to-r ${theme.bgGradient.replace("/80", "").replace("/80", "")}`}`}
            style={{ width: `${Math.min((multiplier / 10) * 100, 100)}%` }}
          />
        </div>
      </Card>

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-center mb-4">{result}</motion.div>}

      {state === "rising" ? (
        <Button className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 text-white" onClick={cashOut}>
          {"💰"} Cash Out ({"₦"}{Math.floor(pointCost * multiplier * 2).toLocaleString()})
        </Button>
      ) : (
        <Button className="button-gradient w-full py-3 text-lg" onClick={start} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Start (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default CrashEngine;
