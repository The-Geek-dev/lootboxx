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
  /** Override the 3 move emojis: [rock, paper, scissors] */
  moves?: [string, string, string];
}

const DEFAULT_THEME: GameTheme = {
  bgGradient: "from-gray-900 to-red-950",
  accentColor: "text-red-400",
  description: "Best of 3 vs CPU — chain wins for streak multipliers!",
};

type Move = 0 | 1 | 2; // 0=rock, 1=paper, 2=scissors
type Outcome = "win" | "lose" | "draw";

const MOVE_NAMES = ["Rock", "Paper", "Scissors"];

const decide = (player: Move, cpu: Move): Outcome => {
  if (player === cpu) return "draw";
  if ((player + 1) % 3 === cpu) return "lose"; // cpu beats player
  return "win";
};

const RockPaperScissorsEngine = ({
  gameId, name, emoji, pointCost, theme = DEFAULT_THEME,
  moves = ["✊", "✋", "✌️"],
}: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [state, setState] = useState<"idle" | "playing" | "ended">("idle");
  const [round, setRound] = useState(1);
  const [playerWins, setPlayerWins] = useState(0);
  const [cpuWins, setCpuWins] = useState(0);
  const [streak, setStreak] = useState(0); // consecutive round wins
  const [bestStreak, setBestStreak] = useState(0);
  const [history, setHistory] = useState<{ p: Move; c: Move; o: Outcome }[]>([]);
  const [lastP, setLastP] = useState<Move | null>(null);
  const [lastC, setLastC] = useState<Move | null>(null);
  const [lastOutcome, setLastOutcome] = useState<Outcome | null>(null);
  const [animating, setAnimating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const startMatch = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);

    setState("playing");
    setRound(1);
    setPlayerWins(0);
    setCpuWins(0);
    setStreak(0);
    setBestStreak(0);
    setHistory([]);
    setLastP(null);
    setLastC(null);
    setLastOutcome(null);
    setResult(null);
  };

  const playMove = async (player: Move) => {
    if (state !== "playing" || animating) return;
    setAnimating(true);
    setLastP(player);
    setLastC(null);
    setLastOutcome(null);

    // brief shake/animation delay
    await new Promise((r) => setTimeout(r, 600));

    const cpu = Math.floor(Math.random() * 3) as Move;
    const outcome = decide(player, cpu);
    setLastC(cpu);
    setLastOutcome(outcome);
    play(outcome === "win" ? "win" : outcome === "lose" ? "lose" : "spin");

    const nextHistory = [...history, { p: player, c: cpu, o: outcome }];
    setHistory(nextHistory);

    let nextPW = playerWins;
    let nextCW = cpuWins;
    let nextStreak = streak;
    let nextBest = bestStreak;

    if (outcome === "win") {
      nextPW++;
      nextStreak++;
      nextBest = Math.max(nextBest, nextStreak);
    } else if (outcome === "lose") {
      nextCW++;
      nextStreak = 0;
    }

    setPlayerWins(nextPW);
    setCpuWins(nextCW);
    setStreak(nextStreak);
    setBestStreak(nextBest);

    // Check match end (best of 3 -> first to 2)
    const matchOver = nextPW >= 2 || nextCW >= 2;
    if (matchOver) {
      await new Promise((r) => setTimeout(r, 500));
      await endMatch(nextPW, nextCW, nextBest, nextHistory);
    } else {
      // draws don't advance round; replay the round
      if (outcome !== "draw") setRound((r) => r + 1);
      setAnimating(false);
    }
  };

  const endMatch = async (
    pWins: number,
    cWins: number,
    best: number,
    finalHistory: { p: Move; c: Move; o: Outcome }[],
  ) => {
    const won = pWins > cWins;
    // Multiplier table:
    //  - lose: 0x
    //  - win 2-1 with no streak: 1.5x
    //  - win 2-0 (sweep, streak 2): 3x
    //  - extra +0.5x per streak round above 2 (rare in best of 3 but supports draws)
    let mult = 0;
    if (won) {
      mult = best >= 2 ? 3 : 1.5;
      if (best > 2) mult += (best - 2) * 0.5;
    }
    let winnings = Math.floor(pointCost * mult * PAYOUT_COEF.rps);
    winnings = adjustWinAmount(winnings);
    if (winnings > 0 && canFullyWin() && mult >= 3) recordFullWin();
    if (winnings > 0) await updateBalance(winnings);

    play(winnings > 0 ? (mult >= 3 ? "bigwin" : "cashout") : "lose");
    setState("ended");
    setAnimating(false);
    setResult(
      won
        ? `🏆 ${pWins}-${cWins} — best streak ${best} → ${mult}x = ₦${winnings.toLocaleString()}`
        : `😤 ${pWins}-${cWins} — CPU wins this match`
    );
    await recordGameResult(gameId, pointCost, winnings, {
      playerWins: pWins, cpuWins: cWins, bestStreak: best, history: finalHistory,
    });
  };

  const outcomeColor =
    lastOutcome === "win" ? "text-green-400" :
    lastOutcome === "lose" ? "text-red-400" :
    lastOutcome === "draw" ? "text-yellow-400" : "text-white/70";

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      {/* Scoreboard */}
      {state !== "idle" && (
        <div className="flex justify-around items-center mb-3 px-2">
          <Stat label="You" value={String(playerWins)} highlight={playerWins >= 2} color="text-green-400" />
          <div className="text-xs uppercase tracking-wider text-white/50">Round {Math.min(round, 3)}</div>
          <Stat label="CPU" value={String(cpuWins)} highlight={cpuWins >= 2} color="text-red-400" />
        </div>
      )}

      <GameBackground type="rps" overlay="dark" className="mb-4">
        <div className="p-5">
          {/* Streak indicator */}
          {state === "playing" && (
            <div className="flex justify-center mb-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                streak >= 2 ? "bg-yellow-500/20 border-yellow-400/60 text-yellow-300 animate-pulse" :
                streak === 1 ? "bg-green-500/15 border-green-400/40 text-green-300" :
                "bg-white/5 border-white/10 text-white/60"
              }`}>
                {streak >= 2 ? "🔥" : streak === 1 ? "⚡" : "·"} Streak: {streak}
              </div>
            </div>
          )}

          {/* Battle area */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-5 min-h-[110px]">
            {/* Player */}
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">You</div>
              <motion.div
                key={`p-${history.length}-${lastP}`}
                animate={animating && lastC === null ? { rotate: [0, -20, 20, -20, 20, 0], y: [0, -8, 0, -8, 0] } : {}}
                transition={{ duration: 0.6 }}
                className="text-5xl sm:text-6xl"
              >
                {lastP !== null ? moves[lastP] : "❓"}
              </motion.div>
            </div>

            <div className={`text-2xl font-black ${outcomeColor}`}>
              {lastOutcome === "win" ? "✓" : lastOutcome === "lose" ? "✗" : lastOutcome === "draw" ? "=" : "VS"}
            </div>

            {/* CPU */}
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">CPU</div>
              <motion.div
                key={`c-${history.length}-${lastC}`}
                initial={lastC !== null ? { scale: 0.5, opacity: 0 } : {}}
                animate={lastC !== null ? { scale: 1, opacity: 1 } : (animating ? { rotate: [0, -20, 20, -20, 20, 0], y: [0, -8, 0, -8, 0] } : {})}
                transition={{ duration: 0.4 }}
                className="text-5xl sm:text-6xl"
              >
                {lastC !== null ? moves[lastC] : "❓"}
              </motion.div>
            </div>
          </div>

          {/* Move buttons */}
          {state === "playing" && (
            <div className="grid grid-cols-3 gap-2">
              {([0, 1, 2] as Move[]).map((m) => (
                <motion.button
                  key={m}
                  onClick={() => playMove(m)}
                  disabled={animating}
                  whileTap={{ scale: 0.92 }}
                  whileHover={{ y: -2 }}
                  className="py-3 rounded-xl border-2 border-white/15 bg-white/5 hover:bg-white/10 hover:border-yellow-400/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center"
                >
                  <span className="text-3xl">{moves[m]}</span>
                  <span className="text-[10px] mt-1 text-white/60 uppercase tracking-wide">{MOVE_NAMES[m]}</span>
                </motion.button>
              ))}
            </div>
          )}

          {/* History strip */}
          {history.length > 0 && (
            <div className="mt-4 flex justify-center gap-1.5">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold border ${
                    h.o === "win" ? "bg-green-500/20 border-green-400/40 text-green-300" :
                    h.o === "lose" ? "bg-red-500/20 border-red-400/40 text-red-300" :
                    "bg-yellow-500/20 border-yellow-400/40 text-yellow-300"
                  }`}
                  title={`R${i + 1}: You ${MOVE_NAMES[h.p]} vs CPU ${MOVE_NAMES[h.c]}`}
                >
                  {h.o === "win" ? "W" : h.o === "lose" ? "L" : "D"}
                </div>
              ))}
            </div>
          )}

          {state === "idle" && (
            <div className="text-center text-white/60 text-xs mt-2">
              Best of 3 rounds. Sweep CPU 2-0 for a 3x payout!
            </div>
          )}
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className={`text-base sm:text-lg font-bold text-center mb-4 ${playerWins > cpuWins ? "text-yellow-400" : "text-red-400"}`}>
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      {state !== "playing" && (
        <BetControls
          onPlay={startMatch}
          xpLives={xpLives}
          pointCost={pointCost}
          playLabel={state === "ended" ? `PLAY AGAIN ${pointCost} pts` : `BET ${pointCost} pts`}
        />
      )}
    </motion.div>
  );
};

const Stat = ({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) => (
  <div className="text-center">
    <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
    <div className={`text-2xl font-black ${color || "text-white"} ${highlight ? "animate-pulse" : ""}`}>{value}</div>
  </div>
);

export default RockPaperScissorsEngine;
