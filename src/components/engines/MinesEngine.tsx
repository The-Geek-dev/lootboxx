import { useState, useCallback } from "react";
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
  gridSize?: number;
  mineCount?: number;
}

const DEFAULT_THEME: GameTheme = { bgGradient: "from-gray-900 to-gray-800", accentColor: "text-cyan-400", description: "Avoid the mines!", variant: "classic" };

const MinesEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME, gridSize = 25, mineCount = 5 }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [mines, setMines] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [state, setState] = useState<"idle" | "playing" | "exploded" | "cashed">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(1);

  const safeCount = gridSize - mineCount;

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    const mineSet = new Set<number>();
    while (mineSet.size < mineCount) { mineSet.add(Math.floor(Math.random() * gridSize)); }
    setMines(mineSet);
    setRevealed(new Set());
    setMultiplier(1);
    setState("playing");
    setResult(null);
  };

  const getMultiplier = (safePicks: number) => {
    if (safePicks === 0) return 1;
    return parseFloat((1 + safePicks * (mineCount / (safeCount - safePicks + 1)) * 0.5).toFixed(2));
  };

  const revealTile = useCallback((index: number) => {
    if (state !== "playing" || revealed.has(index)) return;
    if (mines.has(index)) {
      play("lose");
      setState("exploded");
      setRevealed(new Set([...revealed, ...mines]));
      setResult("💥 BOOM! You hit a mine!");
      recordGameResult(gameId, pointCost, 0, { revealed: revealed.size, mines: [...mines] });
    } else {
      play("tick");
      const newRevealed = new Set([...revealed, index]);
      setRevealed(newRevealed);
      const newMult = getMultiplier(newRevealed.size);
      setMultiplier(newMult);
      if (newRevealed.size >= safeCount) cashOutInternal(newRevealed.size, newMult);
    }
  }, [state, revealed, mines]);

  const cashOutInternal = async (picks: number, mult: number) => {
    play("cashout");
    setState("cashed");
    let winnings = Math.floor(pointCost * mult * 2);
    winnings = adjustWinAmount(winnings);
    if (winnings > 0 && canFullyWin() && mult >= 3) recordFullWin();
    if (winnings > 0) await updateBalance(winnings);
    setResult(`✅ Cashed out at ${mult}x! Won ₦${winnings.toLocaleString()}`);
    await recordGameResult(gameId, pointCost, winnings, { revealed: picks, multiplier: mult });
  };

  const cashOut = () => {
    if (state !== "playing" || revealed.size === 0) return;
    cashOutInternal(revealed.size, multiplier);
  };

  const getCols = () => {
    if (gridSize <= 9) return "grid-cols-3";
    if (gridSize <= 16) return "grid-cols-4";
    return "grid-cols-5";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      {state === "playing" && (
        <div className="flex justify-between items-center mb-3 px-1">
          <span className="text-xs text-muted-foreground">💣 {mineCount} mines</span>
          <motion.span
            className="font-black text-xl text-primary"
            animate={multiplier > 1 ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
            style={{ textShadow: "0 0 15px hsl(var(--primary) / 0.5)" }}
          >
            {multiplier}x
          </motion.span>
          <span className="text-xs text-muted-foreground">{revealed.size}/{safeCount} safe</span>
        </div>
      )}

      <GameBackground type="mines" overlay="dark" className="mb-4">
        <div className="p-3 sm:p-4">
          <div className={`grid ${getCols()} gap-1.5 sm:gap-2`}>
            {Array.from({ length: gridSize }).map((_, i) => {
              const isRevealed = revealed.has(i);
              const isMine = mines.has(i);
              const showMine = isRevealed && isMine;
              const showSafe = isRevealed && !isMine;

              return (
                <motion.button
                  key={i}
                  onClick={() => revealTile(i)}
                  disabled={state !== "playing" || isRevealed}
                  className={`aspect-square rounded-xl flex items-center justify-center text-lg sm:text-2xl font-bold border-2 transition-all ${
                    showMine ? "bg-red-500/30 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]" :
                    showSafe ? "bg-green-500/20 border-green-500/40 shadow-[0_0_10px_rgba(34,197,94,0.2)]" :
                    state === "playing" ? "bg-white/5 border-white/10 hover:border-cyan-400/50 hover:bg-cyan-400/10 cursor-pointer" :
                    "bg-white/3 border-white/5"
                  }`}
                  whileHover={state === "playing" && !isRevealed ? { scale: 1.08 } : {}}
                  whileTap={state === "playing" && !isRevealed ? { scale: 0.92 } : {}}
                  animate={showMine ? { rotate: [0, 10, -10, 0] } : showSafe ? { scale: [0.8, 1.1, 1] } : {}}
                >
                  {showMine ? "💣" : showSafe ? "💎" : state !== "idle" ? "?" : ""}
                </motion.button>
              );
            })}
          </div>
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className={`text-lg font-bold text-center mb-4 ${state === "cashed" ? "text-green-400" : "text-red-400"}`}>
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      {state === "playing" ? (
        <Button className="w-full py-5 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" onClick={cashOut} disabled={revealed.size === 0}>
          💰 Cash Out (₦{Math.floor(pointCost * multiplier * 2).toLocaleString()})
        </Button>
      ) : (
        <BetControls onPlay={startGame} xpLives={xpLives} pointCost={pointCost} playLabel={`BET ${pointCost} pts`} />
      )}
    </motion.div>
  );
};

export default MinesEngine;
