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

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

type BetKey = "small" | "big" | "triple" | "any-triple" | "even" | "odd";

const BETS: { key: BetKey; label: string; multiplier: number; check: (d: number[]) => boolean }[] = [
  { key: "small", label: "Small (4-10)", multiplier: 2, check: (d) => { const s = d.reduce((a, b) => a + b); return s >= 4 && s <= 10 && !isTriple(d); } },
  { key: "big", label: "Big (11-17)", multiplier: 2, check: (d) => { const s = d.reduce((a, b) => a + b); return s >= 11 && s <= 17 && !isTriple(d); } },
  { key: "even", label: "Even total", multiplier: 2, check: (d) => { const s = d.reduce((a, b) => a + b); return s % 2 === 0 && !isTriple(d); } },
  { key: "odd", label: "Odd total", multiplier: 2, check: (d) => { const s = d.reduce((a, b) => a + b); return s % 2 === 1 && !isTriple(d); } },
  { key: "any-triple", label: "Any triple", multiplier: 30, check: (d) => isTriple(d) },
  { key: "triple", label: "Triple 6 (specific)", multiplier: 180, check: (d) => isTriple(d) && d[0] === 6 },
];

function isTriple(d: number[]) { return d[0] === d[1] && d[1] === d[2]; }

const DEFAULT_THEME: GameTheme = { bgGradient: "from-red-950 to-orange-950", accentColor: "text-red-400", description: "Three dice. Pick your bet.", variant: "classic" };

const SicBoEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [bet, setBet] = useState<BetKey>("small");
  const [dice, setDice] = useState<number[]>([1, 1, 1]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const roll = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    if (!(await consumeLife())) return;
    await spendPoints(pointCost);
    setRolling(true); setResult(null); play("spin");

    let count = 0;
    const interval = setInterval(() => {
      setDice([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]);
      if (++count > 12) {
        clearInterval(interval);
        const finalDice = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)];
        setDice(finalDice);
        finishRoll(finalDice);
      }
    }, 80);
  };

  const finishRoll = async (d: number[]) => {
    const betDef = BETS.find((b) => b.key === bet)!;
    const won = betDef.check(d);
    let payout = 0;
    if (won) {
      payout = Math.floor(pointCost * betDef.multiplier * PAYOUT_COEF.sicbo);
      payout = adjustWinAmount(payout);
      if (payout > 0 && canFullyWin() && betDef.multiplier >= 30) recordFullWin();
      if (payout > 0) await updateBalance(payout);
      play("win");
      setResult(`🎲 [${d.join(", ")}] — ${betDef.label} hit! +₦${payout.toLocaleString()}`);
    } else {
      play("lose");
      setResult(`🎲 [${d.join(", ")}] — ${betDef.label} missed`);
    }
    await recordGameResult(gameId, pointCost, payout, { dice: d, bet });
    setRolling(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="dice" overlay="medium" className="mb-4">
        <div className="p-6 sm:p-10 flex justify-center gap-4">
          {dice.map((v, i) => (
            <motion.div
              key={i}
              animate={rolling ? { rotate: [0, 360, 720], scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-7xl sm:text-8xl text-foreground"
            >
              {DICE_FACES[v - 1]}
            </motion.div>
          ))}
        </div>
      </GameBackground>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {BETS.map((b) => (
          <Button
            key={b.key}
            variant={bet === b.key ? "default" : "outline"}
            disabled={rolling}
            onClick={() => setBet(b.key)}
            className="text-xs sm:text-sm py-3 flex flex-col h-auto"
          >
            <span>{b.label}</span>
            <span className="text-[10px] opacity-70">×{b.multiplier}</span>
          </Button>
        ))}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-lg font-bold text-center mb-4 text-foreground">{result}</motion.div>
        )}
      </AnimatePresence>

      <BetControls onPlay={roll} xpLives={xpLives} pointCost={pointCost} isPlaying={rolling} playLabel={`ROLL (${pointCost} pts)`} />
    </motion.div>
  );
};

export default SicBoEngine;
