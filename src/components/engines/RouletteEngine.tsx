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
import GameBackground from "./GameBackground";
import BetControls from "./BetControls";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  /** Visual style for the wheel center & accents */
  variant?: "european" | "vegas" | "midnight";
}

const DEFAULT_THEME: GameTheme = {
  bgGradient: "from-red-950 to-gray-900",
  accentColor: "text-red-400",
  description: "Place your bet — red, black, or a single number!",
  variant: "european",
};

// European-style 0-36 wheel order (single zero)
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
  10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];
const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

type BetType =
  | { kind: "color"; value: "red" | "black" }
  | { kind: "parity"; value: "odd" | "even" }
  | { kind: "dozen"; value: 1 | 2 | 3 } // 1-12, 13-24, 25-36
  | { kind: "number"; value: number };

const RouletteEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME, variant = "european" }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [bet, setBet] = useState<BetType | null>({ kind: "color", value: "red" });
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winningNumber, setWinningNumber] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const segCount = WHEEL_ORDER.length;
  const segAngle = 360 / segCount;

  const colorOf = (n: number) => (n === 0 ? "green" : RED_NUMBERS.has(n) ? "red" : "black");

  const payoutMultiplier = (b: BetType, n: number): number => {
    if (b.kind === "color") return colorOf(n) === b.value ? 2 : 0;
    if (b.kind === "parity") {
      if (n === 0) return 0;
      const isEven = n % 2 === 0;
      return (b.value === "even" && isEven) || (b.value === "odd" && !isEven) ? 2 : 0;
    }
    if (b.kind === "dozen") {
      if (n === 0) return 0;
      const d = Math.ceil(n / 12);
      return d === b.value ? 3 : 0;
    }
    if (b.kind === "number") return b.value === n ? 36 : 0;
    return 0;
  };

  const spin = async () => {
    if (isSpinning || !bet) return;
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);

    setIsSpinning(true);
    setResult(null);
    setWinningNumber(null);
    play("spin");

    const winIdx = Math.floor(Math.random() * segCount);
    const winNum = WHEEL_ORDER[winIdx];
    const targetAngle = 360 - (winIdx * segAngle + segAngle / 2);
    const spins = 5 + Math.random() * 3;
    const finalRot = rotation + spins * 360 + targetAngle;
    setRotation(finalRot);

    setTimeout(async () => {
      setWinningNumber(winNum);
      const mult = payoutMultiplier(bet, winNum);
      let winnings = Math.floor(pointCost * mult);
      winnings = adjustWinAmount(winnings);
      if (winnings > 0 && canFullyWin() && mult >= 3) recordFullWin();
      if (winnings > 0) await updateBalance(winnings);
      play(winnings > 0 ? (mult >= 10 ? "bigwin" : "win") : "lose");
      const colorEmoji = colorOf(winNum) === "red" ? "🔴" : colorOf(winNum) === "black" ? "⚫" : "🟢";
      setResult(
        winnings > 0
          ? `🎉 ${colorEmoji} ${winNum}! ${mult}x → ₦${winnings.toLocaleString()}`
          : `${colorEmoji} ${winNum} — No win this round`
      );
      await recordGameResult(gameId, pointCost, winnings, { number: winNum, bet });
      setIsSpinning(false);
    }, 4000);
  };

  const centerEmoji = variant === "vegas" ? "🎰" : variant === "midnight" ? "🌙" : emoji;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="roulette" overlay="dark" className="mb-4">
        <div className="p-5">
          <div className="relative flex justify-center">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
            </div>

            {/* Wheel */}
            <motion.div
              className="w-64 h-64 sm:w-72 sm:h-72 rounded-full relative overflow-hidden border-4 border-yellow-500/40 shadow-2xl"
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
              style={{ boxShadow: "0 0 50px rgba(234,179,8,0.25)" }}
            >
              {WHEEL_ORDER.map((num, i) => {
                const startDeg = i * segAngle;
                const c = colorOf(num);
                const fill = c === "red" ? "#B91C1C" : c === "black" ? "#171717" : "#15803D";
                return (
                  <div
                    key={i}
                    className="absolute inset-0"
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startDeg - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startDeg - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((startDeg + segAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startDeg + segAngle - 90) * Math.PI / 180)}%)`,
                      background: fill,
                    }}
                  >
                    <div
                      className="absolute text-[9px] font-bold text-white"
                      style={{
                        top: "16%", left: "50%",
                        transform: `rotate(${startDeg + segAngle / 2}deg) translateX(-50%)`,
                        transformOrigin: "50% 200%",
                      }}
                    >
                      {num}
                    </div>
                  </div>
                );
              })}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-black/85 border-2 border-yellow-400/60 flex items-center justify-center text-xl shadow-xl">
                  {centerEmoji}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bet selector */}
          <div className="mt-5 space-y-2.5">
            <div className="text-center text-xs uppercase tracking-wider text-white/60">Choose your bet</div>
            <div className="grid grid-cols-2 gap-1.5">
              <BetBtn label="🔴 Red (2x)" active={bet?.kind === "color" && bet.value === "red"} onClick={() => !isSpinning && setBet({ kind: "color", value: "red" })} />
              <BetBtn label="⚫ Black (2x)" active={bet?.kind === "color" && bet.value === "black"} onClick={() => !isSpinning && setBet({ kind: "color", value: "black" })} />
              <BetBtn label="Odd (2x)" active={bet?.kind === "parity" && bet.value === "odd"} onClick={() => !isSpinning && setBet({ kind: "parity", value: "odd" })} />
              <BetBtn label="Even (2x)" active={bet?.kind === "parity" && bet.value === "even"} onClick={() => !isSpinning && setBet({ kind: "parity", value: "even" })} />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <BetBtn label="1-12 (3x)" active={bet?.kind === "dozen" && bet.value === 1} onClick={() => !isSpinning && setBet({ kind: "dozen", value: 1 })} />
              <BetBtn label="13-24 (3x)" active={bet?.kind === "dozen" && bet.value === 2} onClick={() => !isSpinning && setBet({ kind: "dozen", value: 2 })} />
              <BetBtn label="25-36 (3x)" active={bet?.kind === "dozen" && bet.value === 3} onClick={() => !isSpinning && setBet({ kind: "dozen", value: 3 })} />
            </div>
          </div>

          {winningNumber !== null && (
            <div className="mt-4 text-center text-sm text-white/70">
              Last: <span className="font-bold text-yellow-300">{winningNumber}</span> ({colorOf(winningNumber)})
            </div>
          )}
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="text-lg font-bold text-center mb-4 text-yellow-400">
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      <BetControls onPlay={spin} xpLives={xpLives} pointCost={pointCost} isPlaying={isSpinning} playLabel={isSpinning ? "Spinning..." : `SPIN ${pointCost} pts`} />
    </motion.div>
  );
};

const BetBtn = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <Button
    variant="ghost"
    size="sm"
    onClick={onClick}
    className={`text-xs h-9 border ${
      active
        ? "bg-yellow-500/20 border-yellow-400/60 text-yellow-300 font-bold"
        : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
    }`}
  >
    {label}
  </Button>
);

export default RouletteEngine;
