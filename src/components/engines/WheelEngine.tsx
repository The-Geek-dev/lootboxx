import { useState } from "react";
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

const SEGMENT_COLORS = [
  "from-purple-600 to-purple-700", "from-cyan-600 to-cyan-700", "from-pink-600 to-pink-700",
  "from-emerald-600 to-emerald-700", "from-amber-600 to-amber-700", "from-gray-600 to-gray-700",
  "from-blue-600 to-blue-700", "from-red-600 to-red-700",
];

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

    const winIndex = Math.floor(Math.random() * segments.length);
    const targetAngle = 360 - (winIndex * segAngle + segAngle / 2);
    const spins = 5 + Math.random() * 3;
    const finalRotation = rotation + spins * 360 + targetAngle;
    setRotation(finalRotation);

    setTimeout(async () => {
      let prize = segments[winIndex].value;
      setWinSegment(winIndex);
      if (prize > 0) {
        prize = adjustWinAmount(prize);
        if (canFullyWin() && segments[winIndex].value >= 1000) recordFullWin();
        await updateBalance(prize);
      }
      setResult(prize > 0 ? `🎉 ${segments[winIndex].emoji} ${segments[winIndex].label}! Won ₦${prize.toLocaleString()}!` : "Better luck next time!");
      await recordGameResult(gameId, pointCost, prize, { segment: segments[winIndex].label, index: winIndex });
      setIsSpinning(false);
    }, 4000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-6`}>{theme.description}</p>

      <Card className={`p-6 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 mb-4`}>
        <div className="relative flex justify-center">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-primary" />
          </div>

          {/* Wheel */}
          <motion.div
            className="w-64 h-64 sm:w-72 sm:h-72 rounded-full relative overflow-hidden border-4 border-primary/30"
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
          >
            {segments.map((seg, i) => {
              const startDeg = i * segAngle;
              return (
                <div
                  key={i}
                  className={`absolute inset-0`}
                  style={{
                    clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((startDeg - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startDeg - 90) * Math.PI / 180)}%, ${50 + 50 * Math.cos((startDeg + segAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((startDeg + segAngle - 90) * Math.PI / 180)}%)`,
                    background: `linear-gradient(135deg, ${getSegColor(i)})`,
                  }}
                >
                  <div
                    className="absolute text-xs font-bold text-white"
                    style={{
                      top: "22%",
                      left: "50%",
                      transform: `rotate(${startDeg + segAngle / 2}deg) translateX(-50%)`,
                      transformOrigin: "50% 175%",
                    }}
                  >
                    {seg.emoji}
                  </div>
                </div>
              );
            })}
            {/* Center circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center text-lg">
                {emoji}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Prize legend */}
        <div className="grid grid-cols-2 gap-1.5 mt-4">
          {segments.map((seg, i) => (
            <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${winSegment === i ? `bg-primary/20 ${theme.accentColor} font-bold` : "bg-background/30 text-muted-foreground"}`}>
              <span>{seg.emoji}</span>
              <span>{seg.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className={`text-xl font-bold text-center mb-4 ${theme.accentColor}`}>
          {result}
        </motion.div>
      )}

      <Button className="button-gradient px-8 py-3 text-lg w-full" onClick={spin} disabled={isSpinning || xpLives <= 0}>
        {isSpinning ? "Spinning..." : xpLives <= 0 ? "No XP Lives" : `Spin (${pointCost} pts)`}
      </Button>
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
