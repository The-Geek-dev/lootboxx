import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { GameTheme } from "@/config/gameThemes";
import { useGameSounds } from "@/hooks/useGameSounds";
import { WHEEL } from "@/config/payouts";
import GameBackground from "./GameBackground";
import BetControls from "./BetControls";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  segments?: { label: string; value: number; emoji: string }[];
}

const DEFAULT_SEGMENTS = [
  { label: "₦5,000", value: 5000, emoji: "💎" },
  { label: "₦100", value: 100, emoji: "🌟" },
  { label: "₦1,000", value: 1000, emoji: "🔥" },
  { label: "₦50", value: 50, emoji: "⭐" },
  { label: "₦2,000", value: 2000, emoji: "👑" },
  { label: "₦0", value: 0, emoji: "💨" },
  { label: "₦200", value: 200, emoji: "💰" },
  { label: "₦500", value: 500, emoji: "✨" },
];

const DEFAULT_THEME: GameTheme = { bgGradient: "from-purple-900 to-black", accentColor: "text-purple-400", description: "Spin the wheel!", variant: "classic" };

const WheelEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME, segments = DEFAULT_SEGMENTS }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [winSegment, setWinSegment] = useState<number | null>(null);

  const segAngle = 360 / segments.length;

  const spin = async () => {
    if (isSpinning) return;
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setIsSpinning(true);
    setResult(null);
    setWinSegment(null);
    play("spin");

    const winIndex = Math.floor(Math.random() * segments.length);
    const targetAngle = 360 - (winIndex * segAngle + segAngle / 2);
    const spins = 5 + Math.random() * 3;
    const finalRotation = rotation + spins * 360 + targetAngle;
    setRotation(finalRotation);

    setTimeout(async () => {
      let prize = Math.floor(segments[winIndex].value * WHEEL.prizeMultiplier);
      setWinSegment(winIndex);
      if (prize > 0) {
        prize = adjustWinAmount(prize);
        if (canFullyWin() && segments[winIndex].value >= 1000) recordFullWin();
        await updateBalance(prize);
      }
      play(prize > 0 ? "bigwin" : "lose");
      setResult(prize > 0 ? `🎉 ${segments[winIndex].emoji} ${segments[winIndex].label}! Won ₦${prize.toLocaleString()}!` : "Better luck next time!");
      await recordGameResult(gameId, pointCost, prize, { segment: segments[winIndex].label, index: winIndex });
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="wheel" overlay="medium" className="mb-4">
        <div className="p-6 sm:p-8">
          <div className="relative flex justify-center">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
              <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[28px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
            </div>

            {/* Wheel */}
            <motion.div
              className="w-64 h-64 sm:w-72 sm:h-72 rounded-full relative overflow-hidden border-4 border-yellow-400/30 shadow-2xl"
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
              style={{ boxShadow: "0 0 40px rgba(234,179,8,0.2)" }}
            >
              {segments.map((seg, i) => {
                const startDeg = i * segAngle;
                return (
                  <div
                    key={i}
                    className="absolute inset-0"
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startDeg - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startDeg - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((startDeg + segAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startDeg + segAngle - 90) * Math.PI / 180)}%)`,
                      background: `linear-gradient(135deg, ${getSegColor(i)})`,
                    }}
                  >
                    <div
                      className="absolute text-xs font-bold text-white drop-shadow"
                      style={{
                        top: "22%", left: "50%",
                        transform: `rotate(${startDeg + segAngle / 2}deg) translateX(-50%)`,
                        transformOrigin: "50% 175%",
                      }}
                    >
                      {seg.emoji}
                    </div>
                  </div>
                );
              })}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-black/80 border-2 border-yellow-400/50 flex items-center justify-center text-lg shadow-xl">
                  {emoji}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Prize legend */}
          <div className="grid grid-cols-2 gap-1.5 mt-5">
            {segments.map((seg, i) => (
              <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded-lg text-xs ${
                winSegment === i ? "bg-yellow-400/20 text-yellow-300 font-bold border border-yellow-400/30" : "bg-white/5 text-white/50"
              }`}>
                <span>{seg.emoji}</span>
                <span>{seg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="text-xl font-bold text-center mb-4 text-yellow-400">
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      <BetControls onPlay={spin} xpLives={xpLives} pointCost={pointCost} isPlaying={isSpinning} playLabel={isSpinning ? "Spinning..." : `SPIN ${pointCost} pts`} />
    </motion.div>
  );
};

function getSegColor(i: number): string {
  const colors = [
    "#8B5CF6, #7C3AED", "#06B6D4, #0891B2", "#EC4899, #DB2777",
    "#10B981, #059669", "#F59E0B, #D97706", "#6B7280, #4B5563",
    "#3B82F6, #2563EB", "#EF4444, #DC2626",
  ];
  return colors[i % colors.length];
}

export default WheelEngine;
