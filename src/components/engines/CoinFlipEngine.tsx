import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  theme?: GameTheme;
  sides?: [string, string];
}

const DEFAULT_THEME: GameTheme = { bgGradient: "from-yellow-950 to-amber-950", accentColor: "text-yellow-400", description: "Heads or Tails?", variant: "classic" };

const CoinFlipEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME, sides = ["👑", "🌟"] }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();

  const [state, setState] = useState<"idle" | "flipping" | "won" | "lost" | "cashed">("idle");
  const [streak, setStreak] = useState(0);
  const [coinResult, setCoinResult] = useState<0 | 1>(0);
  const [result, setResult] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const currentWin = () => Math.floor(pointCost * Math.pow(2, streak));

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setStreak(0);
    setState("won");
    setResult(null);
  };

  const flip = async (guess: 0 | 1) => {
    if (isFlipping) return;
    setIsFlipping(true);
    const outcome = Math.random() < 0.5 ? 0 : 1;
    setCoinResult(outcome);

    // Animate
    await new Promise(r => setTimeout(r, 1500));

    if (guess === outcome) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setResult(`${sides[outcome]} Correct! Streak: ${newStreak} (₦${Math.floor(pointCost * Math.pow(2, newStreak)).toLocaleString()})`);
      setState("won");
    } else {
      setState("lost");
      setResult(`${sides[outcome]} Wrong! You lost your ₦${currentWin().toLocaleString()} streak.`);
      await recordGameResult(gameId, pointCost, 0, { streak, guess, outcome });
    }
    setIsFlipping(false);
  };

  const cashOut = async () => {
    setState("cashed");
    let winnings = currentWin();
    winnings = adjustWinAmount(winnings);
    if (winnings > 0 && canFullyWin() && streak >= 3) recordFullWin();
    if (winnings > 0) await updateBalance(winnings);
    setResult(`✅ Cashed out! ${streak} streak → ₦${winnings.toLocaleString()}`);
    await recordGameResult(gameId, pointCost, winnings, { streak, cashedOut: true });
  };

  const getSideLabel = (i: number) => {
    switch (theme.variant) {
      case "coin": return i === 0 ? "Heads" : "Tails";
      case "double": return i === 0 ? "Yes" : "No";
      case "cash": return i === 0 ? "Win" : "Lose";
      default: return i === 0 ? "Heads" : "Tails";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-6`}>{theme.description}</p>

      <Card className={`p-8 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 text-center mb-4`}>
        {/* Coin */}
        <motion.div
          className="w-28 h-28 sm:w-36 sm:h-36 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-5xl sm:text-6xl shadow-lg border-4 border-yellow-300/50"
          animate={isFlipping ? { rotateY: [0, 360, 720, 1080], scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {state === "idle" ? "🪙" : sides[coinResult]}
        </motion.div>

        {(state === "won" || state === "lost") && streak > 0 && (
          <motion.div className="mt-4 flex justify-center gap-1" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
            {Array.from({ length: Math.min(streak, 8) }).map((_, i) => (
              <span key={i} className="text-yellow-400">🔥</span>
            ))}
          </motion.div>
        )}

        {state !== "idle" && (
          <div className="mt-4">
            <p className={`text-lg font-bold ${theme.accentColor}`}>
              {state === "won" || isFlipping ? `Streak: ${streak} | ₦${currentWin().toLocaleString()}` :
               state === "lost" ? "💔 Game Over" : `Cashed: ₦${currentWin().toLocaleString()}`}
            </p>
          </div>
        )}
      </Card>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={`text-lg font-bold text-center mb-4 ${state === "lost" ? "text-destructive" : theme.accentColor}`}>
          {result}
        </motion.div>
      )}

      {state === "won" && !isFlipping ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button className="py-6 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white" onClick={() => flip(0)}>
              {sides[0]} {getSideLabel(0)}
            </Button>
            <Button className="py-6 text-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white" onClick={() => flip(1)}>
              {sides[1]} {getSideLabel(1)}
            </Button>
          </div>
          {streak > 0 && (
            <Button className="w-full py-3 bg-green-600 hover:bg-green-700 text-white" onClick={cashOut}>
              💰 Cash Out (₦{currentWin().toLocaleString()})
            </Button>
          )}
        </div>
      ) : (state === "idle" || state === "lost" || state === "cashed") ? (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      ) : null}
    </motion.div>
  );
};

export default CoinFlipEngine;
