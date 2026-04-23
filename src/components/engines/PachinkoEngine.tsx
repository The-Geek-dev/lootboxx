import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const ROWS = 8;
const SLOTS = 7;
const SLOT_MULTIPLIERS = [10, 3, 1.5, 0.5, 1.5, 3, 10];

const DEFAULT_THEME: GameTheme = {
  bgGradient: "from-pink-950 to-purple-950",
  accentColor: "text-pink-400",
  description: "Drop the ball through the pegs into a prize bucket.",
  variant: "classic",
};

const PachinkoEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [dropping, setDropping] = useState(false);
  const [ballPath, setBallPath] = useState<{ row: number; col: number } | null>(null);
  const [finalSlot, setFinalSlot] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const drop = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    if (!(await consumeLife())) return;
    await spendPoints(pointCost);
    setDropping(true); setResult(null); setFinalSlot(null); play("spin");

    let col = SLOTS / 2;
    setBallPath({ row: 0, col });

    for (let row = 1; row <= ROWS; row++) {
      await new Promise((r) => setTimeout(r, 140));
      // Bounce left or right (random walk)
      col += Math.random() < 0.5 ? -0.5 : 0.5;
      col = Math.max(0, Math.min(SLOTS - 1, col));
      setBallPath({ row, col });
    }

    const slot = Math.round(col);
    setFinalSlot(slot);
    finish(slot);
  };

  const finish = async (slot: number) => {
    const mult = SLOT_MULTIPLIERS[slot];
    let payout = 0;
    if (mult > 0) {
      payout = Math.floor(pointCost * mult * PAYOUT_COEF.plinko);
      payout = adjustWinAmount(payout);
      if (payout > 0 && canFullyWin() && mult >= 5) recordFullWin();
      if (payout > 0) await updateBalance(payout);
    }
    if (payout > 0) {
      play("win");
      setResult(`🎯 Slot ×${mult} — +₦${payout.toLocaleString()}`);
    } else {
      play("lose");
      setResult(`Slot ×${mult} — better luck next drop`);
    }
    await recordGameResult(gameId, pointCost, payout, { slot, mult });
    setDropping(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="instant" overlay="medium" className="mb-4">
        <div className="p-4 sm:p-6 relative" style={{ height: 320 }}>
          {/* Pegs */}
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: SLOTS }).map((_, c) => (
              <div
                key={`${r}-${c}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-foreground/40"
                style={{
                  top: `${(r / ROWS) * 80 + 5}%`,
                  left: `${((c + (r % 2 ? 0.5 : 0)) / SLOTS) * 100}%`,
                  transform: "translate(-50%,-50%)",
                }}
              />
            ))
          )}
          {/* Ball */}
          {ballPath && (
            <motion.div
              className="absolute w-4 h-4 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50"
              animate={{
                top: `${(ballPath.row / ROWS) * 80 + 5}%`,
                left: `${(ballPath.col / SLOTS) * 100 + (100 / SLOTS) / 2}%`,
              }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              style={{ transform: "translate(-50%,-50%)" }}
            />
          )}
          {/* Slot buckets */}
          <div className="absolute bottom-0 left-0 right-0 flex">
            {SLOT_MULTIPLIERS.map((m, i) => (
              <div
                key={i}
                className={`flex-1 text-center text-xs font-bold py-1.5 border-t-2 ${
                  finalSlot === i ? "border-pink-400 bg-pink-400/20 text-pink-400" : "border-foreground/20 text-foreground/60"
                }`}
              >
                ×{m}
              </div>
            ))}
          </div>
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-lg font-bold text-center mb-4 text-foreground">{result}</motion.div>
        )}
      </AnimatePresence>

      <BetControls onPlay={drop} xpLives={xpLives} pointCost={pointCost} isPlaying={dropping} playLabel={`DROP BALL (${pointCost} pts)`} />
    </motion.div>
  );
};

export default PachinkoEngine;
