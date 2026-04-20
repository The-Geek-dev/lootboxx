import { useState, useEffect, useRef } from "react";
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
  racers?: { emoji: string; name: string }[];
}

const DEFAULT_THEME: GameTheme = { bgGradient: "from-green-950 to-emerald-950", accentColor: "text-green-400", description: "Pick your racer and watch them go!", variant: "classic" };

const DEFAULT_RACERS = [
  { emoji: "🏎️", name: "Red Fury" },
  { emoji: "🏍️", name: "Blue Bolt" },
  { emoji: "🚀", name: "Gold Rush" },
  { emoji: "⚡", name: "Thunder" },
];

const RaceEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME, racers = DEFAULT_RACERS }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [state, setState] = useState<"idle" | "picking" | "racing" | "finished">("idle");
  const [picked, setPicked] = useState<number | null>(null);
  const [positions, setPositions] = useState<number[]>(racers.map(() => 0));
  const [winner, setWinner] = useState<number | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const FINISH = 100;

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setPositions(racers.map(() => 0));
    setWinner(null);
    setResult(null);
    setPicked(null);
    setState("picking");
  };

  const pickRacer = (idx: number) => {
    if (state !== "picking") return;
    setPicked(idx);
    setState("racing");
    const speeds = racers.map(() => 0.5 + Math.random() * 1.5);
    const pos = racers.map(() => 0);

    intervalRef.current = setInterval(() => {
      let anyFinished = false;
      for (let i = 0; i < racers.length; i++) {
        pos[i] += speeds[i] * (0.5 + Math.random() * 1.5);
        if (pos[i] >= FINISH) { pos[i] = FINISH; anyFinished = true; }
      }
      setPositions([...pos]);
      if (anyFinished) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const winnerIdx = pos.indexOf(FINISH);
        setWinner(winnerIdx);
        setState("finished");
        resolveResult(winnerIdx, idx);
      }
    }, 80);
  };

  const resolveResult = async (winnerIdx: number, pickedIdx: number) => {
    const won = winnerIdx === pickedIdx;
    let winnings = 0;
    if (won) {
      winnings = Math.floor(pointCost * racers.length * PAYOUT_COEF.race);
      winnings = adjustWinAmount(winnings);
      if (winnings > 0 && canFullyWin()) recordFullWin();
      if (winnings > 0) await updateBalance(winnings);
      play("bigwin");
      setResult(`🏆 ${racers[winnerIdx].name} wins! You earned ₦${winnings.toLocaleString()}!`);
    } else {
      play("lose");
      setResult(`${racers[winnerIdx].emoji} ${racers[winnerIdx].name} wins! Better luck next time.`);
    }
    await recordGameResult(gameId, pointCost, winnings, { picked: pickedIdx, winner: winnerIdx });
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      {state === "picking" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
          <p className="text-center text-foreground font-bold mb-3 text-lg">Pick your racer!</p>
          <div className="grid grid-cols-2 gap-3">
            {racers.map((r, i) => (
              <motion.button key={i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => pickRacer(i)}
                className="p-4 rounded-xl border-2 border-white/10 bg-card/60 hover:border-primary/60 transition-all text-center shadow-lg hover:shadow-primary/10">
                <span className="text-4xl block mb-2">{r.emoji}</span>
                <span className="text-sm font-bold text-foreground">{r.name}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {(state === "racing" || state === "finished") && (
        <GameBackground type="race" overlay="dark" className="mb-4">
          <div className="p-4 sm:p-5">
            <div className="space-y-2">
              {racers.map((r, i) => {
                const isWinner = winner === i;
                const isPicked = picked === i;
                return (
                  <div key={i} className={`relative rounded-xl overflow-hidden h-12 ${isPicked ? "ring-2 ring-primary/60" : ""}`}>
                    <div className="absolute inset-0 bg-white/5" />
                    {/* Progress bar */}
                    <motion.div
                      className={`absolute inset-y-0 left-0 ${isWinner ? "bg-green-500/20" : isPicked ? "bg-primary/10" : "bg-white/5"}`}
                      animate={{ width: `${positions[i]}%` }}
                      transition={{ duration: 0.08 }}
                    />
                    {/* Finish line */}
                    <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/20" />
                    {/* Racer */}
                    <motion.div
                      className="absolute top-0 bottom-0 flex items-center"
                      animate={{ left: `${Math.min(positions[i], 92)}%` }}
                      transition={{ duration: 0.08 }}
                    >
                      <span className={`text-2xl ${isWinner ? "animate-bounce" : ""}`}>{r.emoji}</span>
                    </motion.div>
                    {/* Label */}
                    <div className="absolute left-2 top-0 bottom-0 flex items-center">
                      <span className="text-[10px] text-white/60 bg-black/40 px-1.5 py-0.5 rounded font-mono">
                        {r.name} {isPicked ? "⭐" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {state === "racing" && (
              <motion.div
                className="flex items-center justify-center gap-2 mt-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <span className="text-sm text-white/60 uppercase tracking-widest font-bold">🔴 LIVE Racing...</span>
              </motion.div>
            )}
          </div>
        </GameBackground>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className={`text-lg font-bold text-center mb-4 ${result.includes("earned") ? "text-green-400" : "text-muted-foreground"}`}>
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      {(state === "idle" || state === "finished") && (
        <BetControls onPlay={startGame} xpLives={xpLives} pointCost={pointCost} playLabel={`${state === "idle" ? "BET" : "BET AGAIN"} ${pointCost} pts`} />
      )}
    </motion.div>
  );
};

export default RaceEngine;
