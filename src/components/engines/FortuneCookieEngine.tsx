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

const DEFAULT_THEME: GameTheme = {
  bgGradient: "from-yellow-950 to-red-950",
  accentColor: "text-yellow-400",
  description: "Crack a fortune cookie — your fortune awaits inside",
  variant: "classic",
};

// Weighted multiplier pool (sums roughly to a sub-1 EV before global tuning)
const POOL: { mult: number; weight: number; label: string }[] = [
  { mult: 0,    weight: 35, label: "💨 Empty" },
  { mult: 0.5,  weight: 20, label: "🥠 Tiny" },
  { mult: 1,    weight: 15, label: "🍀 Lucky" },
  { mult: 2,    weight: 12, label: "✨ Bright" },
  { mult: 4,    weight: 9,  label: "💎 Brilliant" },
  { mult: 10,   weight: 6,  label: "🌟 Stellar" },
  { mult: 25,   weight: 2,  label: "👑 Royal" },
  { mult: 100,  weight: 1,  label: "🐉 LEGENDARY" },
];

const drawFortune = () => {
  const total = POOL.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of POOL) { r -= p.weight; if (r <= 0) return p; }
  return POOL[0];
};

const FortuneCookieEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [picked, setPicked] = useState<number | null>(null);
  const [cracking, setCracking] = useState(false);
  const [fortune, setFortune] = useState<typeof POOL[number] | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const crack = async (idx: number) => {
    if (cracking || picked !== null) return;
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    if (!(await consumeLife())) return;
    await spendPoints(pointCost);

    setPicked(idx);
    setCracking(true);
    setFortune(null); setResult(null);
    play("spin");

    await new Promise(r => setTimeout(r, 1100));
    const f = drawFortune();
    setFortune(f);

    let payout = Math.floor(pointCost * f.mult * PAYOUT_COEF.fortuneCookie);
    payout = adjustWinAmount(payout);
    if (payout > 0 && canFullyWin() && f.mult >= 10) recordFullWin();
    if (payout > 0) { await updateBalance(payout); play("win"); }
    else play("lose");

    setResult(payout > 0
      ? `${f.label} • ${f.mult}× — +₦${payout.toLocaleString()}!`
      : `${f.label} — Better luck next time.`);
    await recordGameResult(gameId, pointCost, payout, { idx, fortune: f.label, mult: f.mult });
    setCracking(false);
  };

  const reset = () => { setPicked(null); setFortune(null); setResult(null); };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="lottery" overlay="medium" className="mb-4">
        <div className="p-4 sm:p-6 grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const isPicked = picked === i;
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: picked === null ? 1.05 : 1 }}
                onClick={() => crack(i)}
                disabled={picked !== null}
                className="aspect-square rounded-xl text-4xl sm:text-5xl flex items-center justify-center bg-card border-2 border-yellow-700/50 disabled:opacity-60"
              >
                <motion.div
                  animate={isPicked && cracking ? { rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1 }}
                >
                  {isPicked && fortune ? "✨" : "🥠"}
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-lg font-bold text-center mb-4 text-foreground">{result}</motion.div>
        )}
      </AnimatePresence>

      {picked !== null && !cracking && (
        <BetControls onPlay={reset} xpLives={xpLives} pointCost={pointCost}
          playLabel={`PLAY AGAIN (${pointCost} pts)`} />
      )}
      {picked === null && (
        <p className="text-xs text-muted-foreground text-center">Tap a cookie to crack it • {pointCost} pts</p>
      )}
    </motion.div>
  );
};

export default FortuneCookieEngine;
