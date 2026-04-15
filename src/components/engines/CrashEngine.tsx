import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { GameTheme } from "@/config/gameThemes";
import { useGameSounds } from "@/hooks/useGameSounds";
import GameBackground from "./GameBackground";
import RoundHistory from "./RoundHistory";
import BetControls from "./BetControls";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  visuals?: { icon: string; trailEmoji: string; crashEmoji: string };
}

const CrashEngine = ({ gameId, name, emoji, pointCost, theme = { bgGradient: 'from-purple-900 to-black', accentColor: 'text-purple-400', description: '', variant: 'classic' }, visuals }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [state, setState] = useState<"idle" | "rising" | "crashed" | "cashed">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<{ value: number; won: boolean }[]>([]);
  const intervalRef = useRef<number | null>(null);
  const v = visuals || { icon: "✈️", trailEmoji: "☁️", crashEmoji: "💥" };

  const start = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    const cp = 1 + Math.random() * Math.random() * 9;
    setCrashPoint(cp);
    setMultiplier(1.0);
    setState("rising");
    setResult(null);
    play("spin");

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
      play("lose");
      setResult(`${v.crashEmoji} Crashed at ${crashPoint.toFixed(2)}x!`);
      setHistory(prev => [...prev, { value: crashPoint, won: false }]);
      recordGameResult(gameId, pointCost, 0, { crashPoint, cashedAt: null });
    }
  }, [state, crashPoint]);

  const cashOut = useCallback(async () => {
    if (state !== "rising") return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    play("cashout");
    setState("cashed");
    const currentMult = multiplier;
    let winnings = Math.floor(pointCost * currentMult * 2);
    winnings = adjustWinAmount(winnings);
    if (winnings > 0 && canFullyWin() && currentMult >= 3) recordFullWin();
    if (winnings > 0) await updateBalance(winnings);
    setResult(`✅ Cashed out at ${currentMult.toFixed(2)}x! Won ₦${winnings.toLocaleString()}`);
    setHistory(prev => [...prev, { value: currentMult, won: true }]);
    await recordGameResult(gameId, pointCost, winnings, { crashPoint, cashedAt: currentMult });
  }, [state, multiplier, crashPoint]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const getColor = () => {
    if (state === "crashed") return "text-red-500";
    if (state === "cashed") return "text-green-400";
    if (multiplier > 5) return "text-yellow-400";
    if (multiplier > 3) return "text-orange-400";
    if (multiplier > 2) return "text-primary";
    return "text-white";
  };

  // Calculate position for the flying icon
  const flyProgress = state === "rising" ? Math.min((multiplier - 1) / 8, 1) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <RoundHistory results={history} />

      <GameBackground type="crash" overlay="medium" className="mb-4">
        <div className="p-6 sm:p-10 min-h-[280px] sm:min-h-[320px] flex flex-col items-center justify-center relative">
          {/* Animated flying icon */}
          <motion.div
            className="absolute text-4xl sm:text-5xl"
            animate={
              state === "rising"
                ? {
                    x: flyProgress * 120 - 60,
                    y: -flyProgress * 140 + 40,
                    rotate: -30 - flyProgress * 15,
                  }
                : state === "crashed"
                ? { y: [0, 80], rotate: [0, 90], opacity: [1, 0] }
                : { x: 0, y: 40, rotate: 0 }
            }
            transition={{ duration: state === "crashed" ? 0.8 : 0.3, ease: "easeOut" }}
          >
            {state === "crashed" ? v.crashEmoji : v.icon}
          </motion.div>

          {/* Trail particles when rising */}
          <AnimatePresence>
            {state === "rising" && (
              <>
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-orange-400/60"
                    initial={{ opacity: 0 }}
                    animate={{
                      x: flyProgress * 120 - 60 - (i * 15) - Math.random() * 10,
                      y: -flyProgress * 140 + 40 + (i * 18) + Math.random() * 10,
                      opacity: [0, 0.8, 0],
                      scale: [0.5, 1.2, 0],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {/* Big multiplier display */}
          <motion.div
            className={`text-7xl sm:text-9xl font-black tabular-nums tracking-tight ${getColor()} drop-shadow-2xl`}
            animate={
              state === "rising"
                ? { scale: [1, 1.02, 1] }
                : state === "crashed"
                ? { scale: [1, 1.3, 1], x: [-8, 8, -4, 4, 0] }
                : {}
            }
            transition={{
              repeat: state === "rising" ? Infinity : 0,
              duration: state === "rising" ? 0.4 : 0.5,
            }}
            style={{ textShadow: "0 0 40px currentColor" }}
          >
            {multiplier.toFixed(2)}x
          </motion.div>

          {/* Progress bar */}
          <div className="w-full max-w-xs mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${
                state === "crashed"
                  ? "bg-red-500"
                  : "bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
              }`}
              style={{ width: `${Math.min((multiplier / 10) * 100, 100)}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Status label */}
          <div className="mt-3">
            {state === "rising" && (
              <motion.span
                className="text-xs text-white/60 uppercase tracking-widest"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                🔴 LIVE — Multiplier Rising
              </motion.span>
            )}
            {state === "crashed" && (
              <span className="text-xs text-red-400 uppercase tracking-widest font-bold">
                CRASHED
              </span>
            )}
            {state === "cashed" && (
              <span className="text-xs text-green-400 uppercase tracking-widest font-bold">
                CASHED OUT ✓
              </span>
            )}
          </div>
        </div>
      </GameBackground>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`text-lg font-bold text-center mb-4 ${
              result.includes("Won") ? "text-green-400" : "text-red-400"
            }`}
          >
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      <BetControls
        onPlay={start}
        xpLives={xpLives}
        pointCost={pointCost}
        showCashOut={state === "rising"}
        onCashOut={cashOut}
        cashOutLabel={`Cash Out (₦${Math.floor(pointCost * multiplier * 2).toLocaleString()})`}
        playLabel={`BET ${pointCost} pts`}
      />
    </motion.div>
  );
};

export default CrashEngine;
