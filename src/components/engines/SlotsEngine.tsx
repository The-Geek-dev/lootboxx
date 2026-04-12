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

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  symbols?: string[];
  theme?: GameTheme;
}

const DEFAULT_SYMBOLS = ["\u{1F352}", "\u{1F34B}", "\u{1F514}", "\u2B50", "\u{1F48E}", "7\uFE0F\u20E3"];

const DEFAULT_THEME: GameTheme = { bgGradient: 'from-purple-900 to-black', accentColor: 'purple', description: 'Spin to win!', variant: 'classic' };

const SlotsEngine = ({ gameId, name, emoji, pointCost, symbols = DEFAULT_SYMBOLS, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();

  const reelCount = theme.variant === "classic" || theme.variant === "fruit" ? 3 : (theme.variant === "city" || theme.variant === "dragon" ? 4 : 3);
  const [reels, setReels] = useState(symbols.slice(0, reelCount));
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastWin, setLastWin] = useState(false);

  const payoutMultipliers = [5000, 3000, 1500, 1000, 500, 300];

  const spin = async () => {
    if (isSpinning) return;
    if (xpLives <= 0) { toast({ title: "No XP lives left! \u26A1", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", description: `Need ${pointCost} pts`, variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    setIsSpinning(true);
    setResult(null);
    setLastWin(false);
    await spendPoints(pointCost);

    let count = 0;
    const interval = setInterval(() => {
      setReels(Array.from({ length: reelCount }, () => symbols[Math.floor(Math.random() * symbols.length)]));
      count++;
      if (count > 20) {
        clearInterval(interval);
        const finalReels = Array.from({ length: reelCount }, () => symbols[Math.floor(Math.random() * symbols.length)]);
        setReels(finalReels);

        const allMatch = finalReels.every((r) => r === finalReels[0]);
        const twoMatch = reelCount >= 3 && (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]);

        let payout = 0;
        if (allMatch) {
          const idx = symbols.indexOf(finalReels[0]);
          payout = payoutMultipliers[idx % payoutMultipliers.length] || 500;
          if (reelCount === 4) payout = Math.floor(payout * 1.5);
        } else if (twoMatch) {
          payout = 50;
        }

        if (payout > 0) {
          payout = adjustWinAmount(payout);
          if (allMatch && canFullyWin()) recordFullWin();
        }
        if (payout > 0) { updateBalance(payout); setResult(`\u{1F389} You won \u20A6${payout.toLocaleString()}!`); setLastWin(true); }
        else { setResult("No match. Try again!"); }
        recordGameResult(gameId, pointCost, payout, { reels: finalReels });
        setIsSpinning(false);
      }
    }, 80);
  };

  // Visual variants
  const getReelStyle = () => {
    switch (theme.variant) {
      case "neon": return "border-fuchsia-500/40 shadow-[0_0_15px_rgba(217,70,239,0.2)]";
      case "crystal": case "ice": return "border-cyan-400/40 shadow-[0_0_10px_rgba(34,211,238,0.15)]";
      case "fire": return "border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.2)]";
      case "dragon": return "border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
      case "magic": case "mystic": return "border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]";
      case "ocean": return "border-blue-400/40 shadow-[0_0_10px_rgba(96,165,250,0.15)]";
      case "jungle": case "safari": return "border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.15)]";
      case "candy": return "border-pink-400/40 shadow-[0_0_10px_rgba(244,114,182,0.2)]";
      case "western": return "border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
      default: return "border-primary/20";
    }
  };

  const getLayout = () => {
    if (theme.variant === "city" || theme.variant === "dragon") return "grid-cols-4";
    return "grid-cols-3";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-6`}>{theme.description}</p>

      <Card className={`p-6 sm:p-8 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 relative overflow-hidden`}>
        {/* Decorative background element */}
        <div className={`absolute inset-0 opacity-5 text-9xl flex items-center justify-center pointer-events-none select-none`}>
          {emoji}
        </div>

        <div className={`grid ${getLayout()} gap-3 sm:gap-4 justify-center mb-4 relative`}>
          {reels.map((symbol, i) => (
            <motion.div
              key={i}
              className={`aspect-square max-w-24 w-full mx-auto bg-background/80 rounded-xl flex items-center justify-center text-4xl sm:text-5xl border-2 ${getReelStyle()}`}
              animate={isSpinning ? { y: [0, -10, 0], rotateX: [0, 180, 360] } : lastWin ? { scale: [1, 1.1, 1] } : {}}
              transition={{
                repeat: isSpinning ? Infinity : lastWin ? 2 : 0,
                duration: isSpinning ? 0.15 : 0.3,
                delay: i * 0.05,
              }}
            >
              {symbol}
            </motion.div>
          ))}
        </div>

        {/* Win line indicator */}
        {!isSpinning && reels.length >= 3 && (
          <div className="flex justify-center gap-1 mt-2">
            {reels.map((_, i) => (
              <div key={i} className={`h-1 flex-1 max-w-16 rounded-full ${lastWin ? "bg-green-400" : "bg-muted/30"}`} />
            ))}
          </div>
        )}
      </Card>

      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-xl font-bold text-center mt-4 ${lastWin ? theme.accentColor : "text-muted-foreground"}`}
        >
          {result}
        </motion.div>
      )}

      <Button className="button-gradient px-8 py-3 text-lg w-full mt-4" onClick={spin} disabled={isSpinning || xpLives <= 0}>
        {isSpinning ? "Spinning..." : xpLives <= 0 ? "No XP Lives" : `Spin (${pointCost} pts)`}
      </Button>
    </motion.div>
  );
};

export default SlotsEngine;
