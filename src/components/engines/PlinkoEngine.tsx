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
  rows?: number;
  ballEmoji?: string;
  pegEmoji?: string;
  multipliers?: number[]; // length should be rows + 1
}

const DEFAULT_THEME: GameTheme = {
  bgGradient: "from-cyan-950 to-blue-950",
  accentColor: "text-cyan-400",
  description: "Drop the ball — let physics decide your fate!",
  variant: "classic",
};

const DEFAULT_MULTIPLIERS_8 = [10, 3, 1.5, 0.5, 0.2, 0.5, 1.5, 3, 10];

const PlinkoEngine = ({
  gameId,
  name,
  emoji,
  pointCost,
  theme = DEFAULT_THEME,
  rows = 8,
  ballEmoji = "🔵",
  pegEmoji = "•",
  multipliers,
}: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [isDropping, setIsDropping] = useState(false);
  const [ballPath, setBallPath] = useState<number[]>([]);
  const [landedSlot, setLandedSlot] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const slots = (multipliers && multipliers.length === rows + 1)
    ? multipliers
    : buildSymmetricMultipliers(rows + 1);

  const drop = async () => {
    if (isDropping) return;
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);

    setIsDropping(true);
    setResult(null);
    setLandedSlot(null);
    play("spin");

    // Generate path: at each row, ball drifts left (-0.5) or right (+0.5).
    // Final slot index = number of right moves (0..rows).
    const moves: number[] = [];
    let slotIndex = 0;
    for (let i = 0; i < rows; i++) {
      const right = Math.random() < 0.5 ? 0 : 1;
      moves.push(right);
      slotIndex += right;
    }
    setBallPath(moves);

    // Animate row-by-row
    const stepMs = 220;
    for (let i = 0; i < rows; i++) {
      await new Promise((r) => setTimeout(r, stepMs));
    }

    setLandedSlot(slotIndex);
    const mult = slots[slotIndex];
    let winnings = Math.floor(pointCost * mult * PAYOUT_COEF.plinko);
    winnings = adjustWinAmount(winnings);
    if (winnings > 0 && canFullyWin() && mult >= 3) recordFullWin();
    if (winnings > 0) await updateBalance(winnings);

    play(winnings > 0 ? (mult >= 3 ? "bigwin" : "win") : "lose");
    setResult(
      winnings > 0
        ? `🎉 ${mult}x → ₦${winnings.toLocaleString()}!`
        : `${mult}x — Better luck next drop!`
    );
    await recordGameResult(gameId, pointCost, winnings, { slot: slotIndex, multiplier: mult });
    setIsDropping(false);
  };

  // For visual: progressive horizontal offset of the ball over time
  const ballRow = ballPath.length;

  const getMultColor = (m: number) => {
    if (m >= 5) return "bg-yellow-500/30 border-yellow-400/60 text-yellow-300";
    if (m >= 2) return "bg-green-500/25 border-green-400/50 text-green-300";
    if (m >= 1) return "bg-blue-500/20 border-blue-400/40 text-blue-300";
    return "bg-red-500/15 border-red-400/30 text-red-300/80";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="plinko" overlay="dark" className="mb-4">
        <div className="p-4 sm:p-6">
          {/* Pegs grid */}
          <div className="relative mx-auto" style={{ maxWidth: 380 }}>
            <div className="flex flex-col items-center gap-2.5">
              {Array.from({ length: rows }).map((_, rowIdx) => {
                const pegCount = rowIdx + 2;
                const isActiveRow = isDropping && rowIdx <= ballRow;
                return (
                  <div key={rowIdx} className="flex items-center justify-center gap-2.5 sm:gap-3.5">
                    {Array.from({ length: pegCount }).map((__, pegIdx) => (
                      <motion.span
                        key={pegIdx}
                        className={`text-base leading-none transition-colors ${
                          isActiveRow ? "text-yellow-300" : "text-white/40"
                        }`}
                        animate={isActiveRow ? { scale: [1, 1.4, 1] } : {}}
                        transition={{ duration: 0.3 }}
                      >
                        {pegEmoji}
                      </motion.span>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Animated ball */}
            <AnimatePresence>
              {isDropping && (
                <motion.div
                  className="absolute left-1/2 top-0 text-2xl pointer-events-none"
                  initial={{ y: -10, x: -12, opacity: 0 }}
                  animate={{
                    y: rows * 24 + 20,
                    x: ballPath.reduce((acc, m) => acc + (m === 1 ? 8 : -8), -12),
                    opacity: 1,
                    rotate: 360,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: rows * 0.22, ease: "easeIn" }}
                >
                  {ballEmoji}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Slots */}
          <div className="grid mt-5 gap-1" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0,1fr))` }}>
            {slots.map((m, i) => (
              <motion.div
                key={i}
                className={`text-center text-xs sm:text-sm font-bold py-2 rounded-md border transition-all ${getMultColor(m)} ${
                  landedSlot === i ? "scale-110 ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30" : ""
                }`}
                animate={landedSlot === i ? { y: [0, -4, 0] } : {}}
              >
                {m}x
              </motion.div>
            ))}
          </div>
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`text-xl font-bold text-center mb-4 ${landedSlot !== null && slots[landedSlot] >= 1 ? "text-yellow-400" : "text-red-400"}`}
          >
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      <BetControls
        onPlay={drop}
        xpLives={xpLives}
        pointCost={pointCost}
        isPlaying={isDropping}
        playLabel={isDropping ? "Dropping..." : `DROP ${pointCost} pts`}
      />
    </motion.div>
  );
};

function buildSymmetricMultipliers(count: number): number[] {
  // Symmetric, edges high, middle low. Count = rows + 1.
  const half = Math.floor(count / 2);
  const arr: number[] = [];
  for (let i = 0; i < count; i++) {
    const dist = Math.abs(i - half);
    const ratio = dist / half;
    let m = 0.2 + Math.pow(ratio, 2.2) * 9.8;
    m = Math.round(m * 10) / 10;
    arr.push(m);
  }
  return arr;
}

export default PlinkoEngine;
