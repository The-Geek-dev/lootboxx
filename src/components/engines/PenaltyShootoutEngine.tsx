import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { GameTheme } from "@/config/gameThemes";
import { useGameSounds } from "@/hooks/useGameSounds";
import { PAYOUT_COEF } from "@/config/payouts";
import GameBackground from "./GameBackground";
import BetControls from "./BetControls";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
}

type Corner = "TL" | "TC" | "TR" | "BL" | "BC" | "BR";
const CORNERS: { key: Corner; label: string; emoji: string }[] = [
  { key: "TL", label: "Top Left", emoji: "↖️" },
  { key: "TC", label: "Top Center", emoji: "⬆️" },
  { key: "TR", label: "Top Right", emoji: "↗️" },
  { key: "BL", label: "Bot Left", emoji: "↙️" },
  { key: "BC", label: "Bot Center", emoji: "⬇️" },
  { key: "BR", label: "Bot Right", emoji: "↘️" },
];

const STREAK_MULTIPLIERS = [0, 1.5, 2.5, 5, 10, 20];

const DEFAULT_THEME: GameTheme = {
  bgGradient: "from-green-950 to-emerald-950",
  accentColor: "text-green-400",
  description: "Pick a corner. Score past the keeper. Build a streak.",
  variant: "soccer",
};

const PenaltyShootoutEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [pickedCorner, setPickedCorner] = useState<Corner | null>(null);
  const [keeperDive, setKeeperDive] = useState<Corner | null>(null);
  const [shooting, setShooting] = useState(false);
  const [streak, setStreak] = useState(0);
  const [pendingWin, setPendingWin] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const shoot = async (corner: Corner) => {
    if (shooting) return;
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (streak === 0) {
      // First shot of round costs points + XP
      if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
      if (!(await consumeLife())) return;
      await spendPoints(pointCost);
    } else {
      // Continuation only consumes XP
      if (!(await consumeLife())) return;
    }
    setShooting(true);
    setPickedCorner(corner);
    setResult(null);
    play("spin");

    // Keeper dives randomly; chance to save scales with streak
    const keeperChoice = CORNERS[Math.floor(Math.random() * CORNERS.length)].key;
    setKeeperDive(keeperChoice);

    setTimeout(() => {
      const saved = corner === keeperChoice;
      if (saved) {
        play("lose");
        setResult(`🧤 SAVED! Streak broken at ${streak}.`);
        recordGameResult(gameId, pointCost, 0, { streak, corner, keeper: keeperChoice });
        setStreak(0);
        setPendingWin(0);
      } else {
        const newStreak = Math.min(streak + 1, 5);
        const mult = STREAK_MULTIPLIERS[newStreak];
        const raw = Math.floor(pointCost * mult * PAYOUT_COEF.rps);
        const win = adjustWinAmount(raw);
        setStreak(newStreak);
        setPendingWin(win);
        play("win");
        setResult(`⚽ GOAL! Streak ${newStreak} — bank ₦${win.toLocaleString()} or shoot again!`);
      }
      setShooting(false);
    }, 900);
  };

  const cashOut = async () => {
    if (pendingWin <= 0) return;
    if (canFullyWin() && streak >= 4) recordFullWin();
    await updateBalance(pendingWin);
    play("win");
    setResult(`💰 Cashed out ₦${pendingWin.toLocaleString()} after ${streak} goals!`);
    await recordGameResult(gameId, pointCost, pendingWin, { streak, cashedOut: true });
    setStreak(0);
    setPendingWin(0);
    setPickedCorner(null);
    setKeeperDive(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="sports" overlay="medium" className="mb-4">
        <div className="p-4 sm:p-6">
          {/* Goal */}
          <div className="relative mx-auto max-w-sm aspect-[2/1] border-4 border-foreground/30 rounded-lg bg-gradient-to-b from-green-900/40 to-green-950/60 mb-4">
            {/* Keeper */}
            <motion.div
              className="absolute text-4xl"
              animate={
                keeperDive
                  ? {
                      left: keeperDive.endsWith("L") ? "10%" : keeperDive.endsWith("R") ? "75%" : "42%",
                      top: keeperDive.startsWith("T") ? "10%" : "55%",
                    }
                  : { left: "42%", top: "35%" }
              }
              transition={{ duration: 0.3 }}
            >
              🧤
            </motion.div>
            {/* Ball */}
            {pickedCorner && (
              <motion.div
                className="absolute text-3xl"
                initial={{ left: "45%", top: "85%", opacity: 0 }}
                animate={{
                  left: pickedCorner.endsWith("L") ? "10%" : pickedCorner.endsWith("R") ? "75%" : "42%",
                  top: pickedCorner.startsWith("T") ? "10%" : "55%",
                  opacity: 1,
                }}
                transition={{ duration: 0.6 }}
              >
                ⚽
              </motion.div>
            )}
          </div>

          {/* Corner buttons */}
          <div className="grid grid-cols-3 gap-2">
            {CORNERS.map((c) => (
              <Button
                key={c.key}
                variant="outline"
                disabled={shooting}
                onClick={() => shoot(c.key)}
                className="text-xs py-3 flex flex-col h-auto"
              >
                <span className="text-lg">{c.emoji}</span>
                <span className="text-[10px] opacity-70">{c.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </GameBackground>

      <div className="flex justify-between items-center mb-3 px-2 text-sm">
        <span className="text-muted-foreground">Streak: <span className="font-bold text-foreground">{streak}</span> / 5</span>
        <span className="text-muted-foreground">Pending: <span className="font-bold text-green-400">₦{pendingWin.toLocaleString()}</span></span>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-base font-bold text-center mb-4 text-foreground">{result}</motion.div>
        )}
      </AnimatePresence>

      <BetControls
        onPlay={() => {}}
        onCashOut={cashOut}
        showCashOut={pendingWin > 0 && !shooting}
        cashOutLabel={`Cash Out ₦${pendingWin.toLocaleString()}`}
        xpLives={xpLives}
        pointCost={pointCost}
        isPlaying={shooting}
        playLabel={`Pick a corner above (${pointCost} pts)`}
      />
    </motion.div>
  );
};

export default PenaltyShootoutEngine;
