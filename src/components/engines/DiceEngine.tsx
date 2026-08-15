import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useToast } from "@/hooks/use-toast";
import { GameTheme } from "@/config/gameThemes";
import { useGameSounds } from "@/hooks/useGameSounds";
import GameBackground from "./GameBackground";
import RoundHistory from "./RoundHistory";


interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  diceCount?: number;
  targetRange?: number[];
}

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

const DiceEngine = ({ gameId, name, emoji, pointCost, theme = { bgGradient: 'from-purple-900 to-black', accentColor: 'text-purple-400', description: '', variant: 'classic' }, diceCount = 2, targetRange = [5, 6, 7, 8, 9] }: Props) => {
  const { fetchBalance } = useWallet();
  const { points, fetchPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();

  const { toast } = useToast();
  const { play } = useGameSounds();
  const [dice, setDice] = useState(Array(diceCount).fill(1));
  const [target, setTarget] = useState(targetRange[Math.floor(targetRange.length / 2)]);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastWon, setLastWon] = useState(false);
  const [history, setHistory] = useState<{ value: number; won: boolean }[]>([]);

  const roll = async (betType: "over" | "under") => {
    if (rolling) return;
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    setRolling(true);
    setResult(null);
    setLastWon(false);
    play("spin");

    // Cosmetic shuffle while the server resolves the round
    const interval = setInterval(() => {
      setDice(Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1));
    }, 80);

    const started = Date.now();
    const { data, error } = await supabase.rpc("resolve_dice_round", {
      p_game_type: gameId,
      p_point_cost: pointCost,
      p_bet_type: betType,
      p_target: target,
      p_dice_count: diceCount,
    });

    // Keep the animation running for at least ~1.2s
    const elapsed = Date.now() - started;
    if (elapsed < 1200) await new Promise((r) => setTimeout(r, 1200 - elapsed));
    clearInterval(interval);

    if (error || !data) {
      console.error("resolve_dice_round failed:", error);
      toast({ title: "Round failed", description: error?.message ?? "Please try again", variant: "destructive" });
      await fetchBalance();
      await fetchPoints();
      setRolling(false);
      return;
    }

    const outcome = data as { dice: number[]; total: number; won: boolean; win_amount: number; points: number; balance: number };
    setDice(outcome.dice);
    await fetchPoints();
    await fetchBalance();

    setLastWon(outcome.won && outcome.win_amount > 0);

    if (outcome.won) play("win"); else play("lose");
    setResult(
      outcome.won
        ? `🎉 ${outcome.total}! You won ₦${Number(outcome.win_amount).toLocaleString()}!`
        : `${outcome.total}. Not this time!`
    );
    setHistory(prev => [...prev, { value: outcome.total, won: outcome.won }]);
    setRolling(false);
  };


  const sum = dice.reduce((s, d) => s + d, 0);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <RoundHistory results={history} formatValue={(v) => `${v}`} />

      <GameBackground type="dice" overlay="medium" className="mb-4">
        <div className="p-6 sm:p-8 text-center">
          <div className="flex gap-4 sm:gap-6 justify-center mb-6">
            {dice.map((d, i) => (
              <motion.div
                key={i}
                className="w-20 h-20 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center text-5xl sm:text-7xl bg-black/30 border border-white/10 shadow-2xl"
                animate={rolling ? { rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.1, 0.9, 1] } : lastWon ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: rolling ? Infinity : lastWon ? 2 : 0, duration: rolling ? 0.2 : 0.4, delay: i * 0.05 }}
              >
                {DICE_FACES[d - 1]}
              </motion.div>
            ))}
          </div>

          <motion.p
            className={`text-3xl sm:text-4xl font-black ${lastWon ? "text-green-400" : "text-white"}`}
            animate={lastWon ? { scale: [1, 1.2, 1] } : {}}
            transition={{ repeat: lastWon ? 3 : 0, duration: 0.3 }}
            style={{ textShadow: "0 0 20px currentColor" }}
          >
            {sum}
          </motion.p>

          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-5 flex-wrap">
            <span className="text-sm text-white/60">Target:</span>
            {targetRange.map((t) => (
              <button
                key={t}
                onClick={() => !rolling && setTarget(t)}
                className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${
                  target === t
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`text-lg font-bold text-center mb-4 ${lastWon ? "text-green-400" : "text-muted-foreground"}`}>
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3">
        <Button className="py-6 text-lg font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" onClick={() => roll("over")} disabled={rolling || xpLives <= 0}>
          ⬆️ Over {target}
        </Button>
        <Button className="py-6 text-lg font-bold bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20" onClick={() => roll("under")} disabled={rolling || xpLives <= 0}>
          ⬇️ Under {target}
        </Button>
      </div>
    </motion.div>
  );
};

export default DiceEngine;
