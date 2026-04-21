import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
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

const HOUSE_EDGE = 0.97;

const DEFAULT_THEME: GameTheme = { bgGradient: "from-indigo-950 to-violet-950", accentColor: "text-indigo-400", description: "Pick a target — beat it to win", variant: "classic" };

const LimboEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [target, setTarget] = useState(2);
  const [rolling, setRolling] = useState(false);
  const [roll, setRoll] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const winChance = (HOUSE_EDGE / target) * 100;

  const play_ = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    if (!(await consumeLife())) return;
    await spendPoints(pointCost);
    setRolling(true); setRoll(null); setResult(null);
    play("spin");

    // Animate count-up
    const finalRoll = HOUSE_EDGE / Math.random();
    const steps = 25;
    for (let i = 0; i < steps; i++) {
      await new Promise(r => setTimeout(r, 40));
      setRoll(1 + Math.random() * Math.min(finalRoll * 1.5, 50));
    }
    setRoll(finalRoll);

    const won = finalRoll >= target;
    let payout = 0;
    if (won) {
      payout = Math.floor(pointCost * target * PAYOUT_COEF.limbo);
      payout = adjustWinAmount(payout);
      if (payout > 0 && canFullyWin() && target >= 5) recordFullWin();
      if (payout > 0) await updateBalance(payout);
      play("win");
      setResult(`🎯 ${finalRoll.toFixed(2)}× — You win ₦${payout.toLocaleString()}!`);
    } else {
      play("lose");
      setResult(`💔 ${finalRoll.toFixed(2)}× — Below ${target.toFixed(2)}×`);
    }
    await recordGameResult(gameId, pointCost, payout, { target, roll: finalRoll });
    setRolling(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="crash" overlay="medium" className="mb-4">
        <div className="p-8 sm:p-12 flex flex-col items-center">
          <div className="text-6xl sm:text-7xl font-black text-foreground" style={{ textShadow: "0 0 30px hsl(var(--primary) / 0.5)" }}>
            {roll !== null ? `${roll.toFixed(2)}×` : "—"}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Target: <span className="font-bold text-primary">{target.toFixed(2)}×</span></p>
        </div>
      </GameBackground>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Target multiplier</span>
          <span className="font-bold text-foreground">{target.toFixed(2)}× • {winChance.toFixed(1)}% chance</span>
        </div>
        <Slider
          value={[target]}
          min={1.1}
          max={20}
          step={0.1}
          onValueChange={(v) => !rolling && setTarget(v[0])}
          disabled={rolling}
        />
        <p className="text-xs text-muted-foreground text-center">
          Win pays <span className="font-bold text-primary">₦{Math.floor(pointCost * target * PAYOUT_COEF.limbo).toLocaleString()}</span>
        </p>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-lg font-bold text-center mb-4 text-foreground">{result}</motion.div>
        )}
      </AnimatePresence>

      <BetControls onPlay={play_} xpLives={xpLives} pointCost={pointCost} isPlaying={rolling} playLabel={`ROLL (${pointCost} pts)`} />
    </motion.div>
  );
};

export default LimboEngine;
