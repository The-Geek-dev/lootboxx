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
import { COINFLIP_BASE } from "@/config/payouts";
import GameBackground from "./GameBackground";
import BetControls from "./BetControls";

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
  const { play } = useGameSounds();

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
    await new Promise(r => setTimeout(r, 1500));

    if (guess === outcome) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setResult(`${sides[outcome]} Correct! Streak: ${newStreak} (₦${Math.floor(pointCost * Math.pow(2, newStreak)).toLocaleString()})`);
      setState("won");
    } else {
      setState("lost");
      play("lose");
      setResult(`${sides[outcome]} Wrong! You lost your ₦${currentWin().toLocaleString()} streak.`);
      await recordGameResult(gameId, pointCost, 0, { streak, guess, outcome });
    }
    setIsFlipping(false);
  };

  const cashOut = async () => {
    setState("cashed");
    play("cashout");
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
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="coinflip" overlay="medium" className="mb-4">
        <div className="p-8 sm:p-10 flex flex-col items-center">
          {/* Coin */}
          <motion.div
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center text-6xl sm:text-7xl shadow-2xl border-4 border-yellow-300/40"
            animate={isFlipping ? { rotateY: [0, 360, 720, 1080], scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ boxShadow: "0 0 60px rgba(234,179,8,0.3)" }}
          >
            {state === "idle" ? "🪙" : sides[coinResult]}
          </motion.div>

          {/* Streak fire */}
          {(state === "won" || state === "lost") && streak > 0 && (
            <motion.div className="mt-4 flex justify-center gap-1" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
              {Array.from({ length: Math.min(streak, 8) }).map((_, i) => (
                <span key={i} className="text-yellow-400 text-lg">🔥</span>
              ))}
            </motion.div>
          )}

          {state !== "idle" && (
            <div className="mt-4">
              <p className="text-xl font-black text-white" style={{ textShadow: "0 0 20px rgba(234,179,8,0.5)" }}>
                {state === "won" || isFlipping ? `Streak: ${streak} | ₦${currentWin().toLocaleString()}` :
                 state === "lost" ? "💔 Game Over" : `Cashed: ₦${currentWin().toLocaleString()}`}
              </p>
            </div>
          )}
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`text-lg font-bold text-center mb-4 ${state === "lost" ? "text-red-400" : "text-green-400"}`}>
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      {state === "won" && !isFlipping ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button className="py-6 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20" onClick={() => flip(0)}>
              {sides[0]} {getSideLabel(0)}
            </Button>
            <Button className="py-6 text-lg font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20" onClick={() => flip(1)}>
              {sides[1]} {getSideLabel(1)}
            </Button>
          </div>
          {streak > 0 && (
            <Button className="w-full py-4 font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" onClick={cashOut}>
              💰 Cash Out (₦{currentWin().toLocaleString()})
            </Button>
          )}
        </div>
      ) : (state === "idle" || state === "lost" || state === "cashed") ? (
        <BetControls onPlay={startGame} xpLives={xpLives} pointCost={pointCost} playLabel={`BET ${pointCost} pts`} />
      ) : null}
    </motion.div>
  );
};

export default CoinFlipEngine;
