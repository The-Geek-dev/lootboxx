import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
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
  bgGradient: "from-rose-950 to-blue-950",
  accentColor: "text-rose-400",
  description: "Guess the secret number — you get 3 tries with hot/cold hints",
  variant: "classic",
};

const MAX_TRIES = 3;

const HotColdEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [secret, setSecret] = useState<number | null>(null);
  const [guess, setGuess] = useState("");
  const [tries, setTries] = useState<{ value: number; hint: string }[]>([]);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);

  const start = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    if (!(await consumeLife())) return;
    await spendPoints(pointCost);
    setSecret(Math.floor(Math.random() * 100) + 1);
    setTries([]); setGuess(""); setResult(null); setState("playing");
  };

  const submitGuess = async () => {
    const g = parseInt(guess, 10);
    if (!secret || isNaN(g) || g < 1 || g > 100) {
      toast({ title: "Pick 1–100", variant: "destructive" }); return;
    }
    const diff = Math.abs(g - secret);
    let hint = "";
    if (diff === 0) hint = "🎯 EXACT!";
    else if (diff <= 3) hint = "🔥 BURNING";
    else if (diff <= 8) hint = "♨️ Hot";
    else if (diff <= 20) hint = "😐 Warm";
    else if (diff <= 40) hint = "❄️ Cold";
    else hint = "🧊 Freezing";

    const newTries = [...tries, { value: g, hint }];
    setTries(newTries);
    setGuess("");

    if (diff === 0 || newTries.length >= MAX_TRIES) {
      const closest = Math.min(...newTries.map(t => Math.abs(t.value - secret)));
      let payout = 0;
      if (closest === 0) payout = Math.floor(pointCost * 25 * PAYOUT_COEF.hotCold);
      else if (closest <= 3) payout = Math.floor(pointCost * 6 * PAYOUT_COEF.hotCold);
      else if (closest <= 8) payout = Math.floor(pointCost * 2.5 * PAYOUT_COEF.hotCold);

      payout = adjustWinAmount(payout);
      if (payout > 0 && canFullyWin() && closest <= 3) recordFullWin();
      if (payout > 0) { await updateBalance(payout); play("win"); }
      else play("lose");

      setResult(closest === 0
        ? `🎯 Bullseye! Secret was ${secret}. You win ₦${payout.toLocaleString()}!`
        : payout > 0
          ? `Closest: ${closest} off. Secret was ${secret}. ₦${payout.toLocaleString()}`
          : `💔 Secret was ${secret}. Closest: ${closest} off.`);
      await recordGameResult(gameId, pointCost, payout, { secret, tries: newTries });
      setState("done");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="instant" overlay="medium" className="mb-4">
        <div className="p-6 sm:p-10 flex flex-col items-center gap-3">
          <div className="text-7xl">{state === "done" ? "🎲" : "🤔"}</div>
          <p className="text-sm text-muted-foreground">Secret number is between 1 and 100</p>
          <div className="text-xs text-muted-foreground">Try {Math.min(tries.length + (state === "playing" ? 1 : 0), MAX_TRIES)}/{MAX_TRIES}</div>
        </div>
      </GameBackground>

      <div className="space-y-2 mb-4 min-h-[80px]">
        <AnimatePresence>
          {tries.map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="flex justify-between p-2 bg-card rounded-lg">
              <span className="font-bold text-foreground">#{i + 1}: {t.value}</span>
              <span className="text-sm">{t.hint}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {state === "playing" && (
        <div className="flex gap-2 mb-3">
          <Input type="number" min={1} max={100} value={guess} onChange={(e) => setGuess(e.target.value)}
            placeholder="Your guess (1–100)" className="flex-1" />
          <button onClick={submitGuess}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-bold">Guess</button>
        </div>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-base font-bold text-center mb-4 text-foreground">{result}</motion.div>
        )}
      </AnimatePresence>

      {state !== "playing" && (
        <BetControls onPlay={start} xpLives={xpLives} pointCost={pointCost}
          playLabel={state === "done" ? `PLAY AGAIN (${pointCost} pts)` : `START (${pointCost} pts)`} />
      )}
    </motion.div>
  );
};

export default HotColdEngine;
