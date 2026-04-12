import { useState, useRef, useEffect, useCallback } from "react";
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

const CrashEngine = ({ gameId, name, emoji, pointCost }: Props) => {
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

  const start = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);

    // Random crash point between 1.1x and 10x (weighted lower)
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

  // Handle crash state
  useEffect(() => {
    if (state === "crashed") {
      setResult(`💥 Crashed at ${crashPoint.toFixed(2)}x! You lost.`);
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
    setResult(`✅ Cashed out at ${currentMult.toFixed(2)}x! Won ₦${winnings.toLocaleString()}`);
    await recordGameResult(gameId, pointCost, winnings, { crashPoint, cashedAt: currentMult });
  }, [state, multiplier, crashPoint]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const getColor = () => {
    if (state === "crashed") return "text-destructive";
    if (state === "cashed") return "text-green-400";
    if (multiplier > 3) return "text-yellow-400";
    if (multiplier > 2) return "text-primary";
    return "text-foreground";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center mb-6">Cash out before it crashes! • {pointCost} pts</p>

      <Card className="p-8 bg-card/80 backdrop-blur-sm border-primary/30 text-center mb-4">
        <motion.div
          className={`text-6xl sm:text-8xl font-mono font-bold ${getColor()}`}
          animate={state === "rising" ? { scale: [1, 1.02, 1] } : state === "crashed" ? { x: [-5, 5, -5, 0] } : {}}
          transition={{ repeat: state === "rising" ? Infinity : 0, duration: 0.3 }}
        >
          {multiplier.toFixed(2)}x
        </motion.div>
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${state === "crashed" ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${Math.min((multiplier / 10) * 100, 100)}%` }}
          />
        </div>
      </Card>

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-center mb-4">{result}</motion.div>}

      {state === "rising" ? (
        <Button className="w-full py-6 text-lg bg-green-600 hover:bg-green-700 text-white" onClick={cashOut}>
          💰 Cash Out (₦{Math.floor(pointCost * multiplier * 2).toLocaleString()})
        </Button>
      ) : (
        <Button className="button-gradient w-full py-3 text-lg" onClick={start} disabled={state === "rising" as boolean || xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Start (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default CrashEngine;
