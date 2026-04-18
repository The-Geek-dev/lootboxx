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
import GameBackground from "./GameBackground";
import BetControls from "./BetControls";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  maxNumber?: number;   // pool size
  pickCount?: number;   // how many user picks
  drawCount?: number;   // how many drawn
  /** Payout multiplier per number of hits, length pickCount + 1 */
  payouts?: number[];
}

const DEFAULT_THEME: GameTheme = {
  bgGradient: "from-purple-950 to-pink-950",
  accentColor: "text-purple-400",
  description: "Pick your numbers, watch the draw — more hits, bigger wins!",
};

// Default for 8 picks / 20 drawn / pool 80 — payouts indexed by hits
const DEFAULT_PAYOUTS_8 = [0, 0, 0, 1, 3, 10, 25, 100, 500];

const KenoEngine = ({
  gameId, name, emoji, pointCost, theme = DEFAULT_THEME,
  maxNumber = 80, pickCount = 8, drawCount = 20, payouts,
}: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [picks, setPicks] = useState<Set<number>>(new Set());
  const [drawn, setDrawn] = useState<number[]>([]);
  const [revealCount, setRevealCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const payTable = payouts && payouts.length === pickCount + 1
    ? payouts
    : buildPayoutTable(pickCount);

  const togglePick = (n: number) => {
    if (isPlaying) return;
    const next = new Set(picks);
    if (next.has(n)) next.delete(n);
    else if (next.size < pickCount) next.add(n);
    setPicks(next);
  };

  const quickPick = () => {
    if (isPlaying) return;
    const next = new Set<number>();
    while (next.size < pickCount) next.add(1 + Math.floor(Math.random() * maxNumber));
    setPicks(next);
  };

  const play_ = async () => {
    if (isPlaying) return;
    if (picks.size !== pickCount) {
      toast({ title: `Pick exactly ${pickCount} numbers`, variant: "destructive" });
      return;
    }
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);

    setIsPlaying(true);
    setResult(null);
    setRevealCount(0);

    // Draw numbers
    const pool = Array.from({ length: maxNumber }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const newDraw = pool.slice(0, drawCount).sort((a, b) => a - b);
    setDrawn(newDraw);
    play("spin");

    // Reveal one-by-one
    for (let i = 0; i < drawCount; i++) {
      await new Promise((r) => setTimeout(r, 140));
      setRevealCount(i + 1);
    }

    const drawnSet = new Set(newDraw);
    let hits = 0;
    picks.forEach((p) => { if (drawnSet.has(p)) hits++; });
    const mult = payTable[hits] ?? 0;
    let winnings = Math.floor(pointCost * mult);
    winnings = adjustWinAmount(winnings);
    if (winnings > 0 && canFullyWin() && mult >= 10) recordFullWin();
    if (winnings > 0) await updateBalance(winnings);

    play(winnings > 0 ? (mult >= 25 ? "bigwin" : "win") : "lose");
    setResult(
      winnings > 0
        ? `🎉 ${hits}/${pickCount} hits — ${mult}x → ₦${winnings.toLocaleString()}!`
        : `${hits}/${pickCount} hits — No prize this round`
    );
    await recordGameResult(gameId, pointCost, winnings, { picks: Array.from(picks), drawn: newDraw, hits });
    setIsPlaying(false);
  };

  const reset = () => {
    if (isPlaying) return;
    setPicks(new Set());
    setDrawn([]);
    setRevealCount(0);
    setResult(null);
  };

  const drawnVisible = new Set(drawn.slice(0, revealCount));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="keno" overlay="dark" className="mb-4">
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs text-white/70">
              Picks: <span className="text-yellow-300 font-bold">{picks.size}/{pickCount}</span>
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={quickPick} disabled={isPlaying} className="h-7 text-xs bg-white/5 border border-white/10">
                🎲 Quick Pick
              </Button>
              <Button size="sm" variant="ghost" onClick={reset} disabled={isPlaying} className="h-7 text-xs bg-white/5 border border-white/10">
                Clear
              </Button>
            </div>
          </div>

          {/* Number grid */}
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(10, maxNumber)}, minmax(0,1fr))` }}>
            {Array.from({ length: maxNumber }).map((_, i) => {
              const n = i + 1;
              const isPicked = picks.has(n);
              const isHit = drawnVisible.has(n) && isPicked;
              const isDrawnOnly = drawnVisible.has(n) && !isPicked;
              return (
                <motion.button
                  key={n}
                  onClick={() => togglePick(n)}
                  disabled={isPlaying}
                  whileTap={{ scale: 0.9 }}
                  animate={isHit ? { scale: [1, 1.3, 1] } : isDrawnOnly && drawnVisible.size === revealCount ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`aspect-square text-[10px] sm:text-xs font-bold rounded-md border transition-all ${
                    isHit ? "bg-yellow-400 text-black border-yellow-300 shadow-lg shadow-yellow-400/40" :
                    isPicked ? "bg-purple-500/40 border-purple-400/70 text-purple-100" :
                    isDrawnOnly ? "bg-blue-500/30 border-blue-400/50 text-blue-200" :
                    "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  {n}
                </motion.button>
              );
            })}
          </div>

          {/* Pay table */}
          <div className="mt-3 grid grid-cols-5 gap-1 text-[10px]">
            {payTable.map((m, i) => (
              <div key={i} className={`text-center py-1 rounded ${m > 0 ? "bg-white/5 text-yellow-300" : "bg-white/3 text-white/30"}`}>
                {i} hit: <span className="font-bold">{m}x</span>
              </div>
            ))}
          </div>
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="text-lg font-bold text-center mb-4 text-yellow-400">
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      <BetControls onPlay={play_} xpLives={xpLives} pointCost={pointCost} isPlaying={isPlaying}
        playLabel={isPlaying ? "Drawing..." : `PLAY ${pointCost} pts`} />
    </motion.div>
  );
};

function buildPayoutTable(picks: number): number[] {
  // Generic scaling table — small wins for half hits, big for top hits.
  const arr: number[] = [];
  for (let i = 0; i <= picks; i++) {
    if (i < Math.ceil(picks / 2)) arr.push(0);
    else if (i === picks) arr.push(picks * picks * 8);
    else arr.push(Math.round(Math.pow(2.2, i - Math.floor(picks / 2))));
  }
  return arr;
}

export default KenoEngine;
