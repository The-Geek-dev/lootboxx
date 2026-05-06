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

const DEFAULT_THEME: GameTheme = {
  bgGradient: "from-stone-950 to-red-950",
  accentColor: "text-red-400",
  description: "Cut wires to defuse — avoid the bomb. Cash out anytime.",
  variant: "classic",
};

const WIRES = 9;
const BOMBS = 2;

const BombSquadEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [state, setState] = useState<"idle" | "playing" | "boom" | "cashed">("idle");
  const [bombs, setBombs] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<string | null>(null);

  const safeCount = revealed.size;
  const multiplier = Math.pow(1.4, safeCount) * PAYOUT_COEF.bombSquad;
  const currentWin = Math.floor(pointCost * multiplier);

  const start = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    if (!(await consumeLife())) return;
    await spendPoints(pointCost);

    const positions = new Set<number>();
    while (positions.size < BOMBS) positions.add(Math.floor(Math.random() * WIRES));
    setBombs(positions);
    setRevealed(new Set());
    setResult(null);
    setState("playing");
  };

  const cutWire = async (i: number) => {
    if (state !== "playing" || revealed.has(i)) return;
    play("spin");
    if (bombs.has(i)) {
      setRevealed(new Set([...revealed, i]));
      setState("boom");
      play("lose");
      setResult(`💥 BOOM! You hit the bomb at position ${i + 1}.`);
      await recordGameResult(gameId, pointCost, 0, { hit: i, bombs: [...bombs] });
      return;
    }
    const newRevealed = new Set([...revealed, i]);
    setRevealed(newRevealed);
    if (newRevealed.size === WIRES - BOMBS) {
      // perfect clear
      let payout = Math.floor(pointCost * Math.pow(1.4, newRevealed.size) * PAYOUT_COEF.bombSquad);
      payout = adjustWinAmount(payout);
      if (payout > 0 && canFullyWin()) recordFullWin();
      if (payout > 0) await updateBalance(payout);
      play("win");
      setResult(`🏆 PERFECT! All wires cut. +₦${payout.toLocaleString()}`);
      await recordGameResult(gameId, pointCost, payout, { perfect: true });
      setState("cashed");
    }
  };

  const cashOut = async () => {
    if (state !== "playing" || safeCount === 0) return;
    let payout = adjustWinAmount(currentWin);
    if (payout > 0 && canFullyWin() && safeCount >= 4) recordFullWin();
    if (payout > 0) await updateBalance(payout);
    play("cashout");
    setResult(`💰 Defused! +₦${payout.toLocaleString()}`);
    await recordGameResult(gameId, pointCost, payout, { safeCount });
    setState("cashed");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="instant" overlay="medium" className="mb-4">
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {Array.from({ length: WIRES }).map((_, i) => {
              const isRevealed = revealed.has(i);
              const isBomb = bombs.has(i);
              const showBomb = (state === "boom" || state === "cashed") && isBomb;
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => cutWire(i)}
                  disabled={state !== "playing" || isRevealed}
                  className={`aspect-square rounded-lg text-3xl sm:text-4xl font-bold flex items-center justify-center border-2 transition-all
                    ${isRevealed && !isBomb ? "bg-green-600/40 border-green-500" :
                      showBomb ? "bg-red-600/60 border-red-500" :
                      "bg-card border-border hover:border-primary"}`}
                >
                  {isRevealed ? (isBomb ? "💣" : "✂️") : showBomb ? "💣" : "?"}
                </motion.button>
              );
            })}
          </div>
        </div>
      </GameBackground>

      <div className="flex justify-between text-sm mb-3">
        <span className="text-muted-foreground">Wires cut: <span className="font-bold text-foreground">{safeCount}</span></span>
        <span className="text-muted-foreground">Current win: <span className="font-bold text-primary">₦{currentWin.toLocaleString()}</span></span>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-lg font-bold text-center mb-4 text-foreground">{result}</motion.div>
        )}
      </AnimatePresence>

      {state === "playing" && safeCount > 0 ? (
        <Button onClick={cashOut} className="w-full py-6 text-lg font-bold bg-green-600 hover:bg-green-700 text-white">
          💰 Cash Out ₦{currentWin.toLocaleString()}
        </Button>
      ) : state !== "playing" && (
        <BetControls onPlay={start} xpLives={xpLives} pointCost={pointCost}
          playLabel={state === "idle" ? `START (${pointCost} pts)` : `PLAY AGAIN (${pointCost} pts)`} />
      )}
    </motion.div>
  );
};

export default BombSquadEngine;
