import { useState, useEffect } from "react";
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
  symbols?: string[]; // distinct symbols (will be doubled into pairs)
  pairs?: number;     // number of pairs (default = symbols.length)
  timeLimit?: number; // seconds
  maxMistakes?: number; // game over after this many wrong attempts
}

const DEFAULT_THEME: GameTheme = {
  bgGradient: "from-purple-950 to-pink-950",
  accentColor: "text-purple-400",
  description: "Flip cards, find pairs — fewer mistakes, bigger payouts!",
};

const DEFAULT_SYMBOLS = ["💎", "🔥", "⭐", "🌟", "👑", "💰", "🎯", "✨"];

interface Card {
  id: number;
  symbol: string;
  flipped: boolean;
  matched: boolean;
}

const MemoryMatchEngine = ({
  gameId, name, emoji, pointCost, theme = DEFAULT_THEME,
  symbols = DEFAULT_SYMBOLS, pairs, timeLimit = 45, maxMistakes = 6,
}: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const pairCount = pairs ?? symbols.length;
  const usedSymbols = symbols.slice(0, pairCount);

  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [matches, setMatches] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  // Timer
  useEffect(() => {
    if (!isPlaying) return;
    if (timeLeft <= 0) { endGame(false); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [isPlaying, timeLeft]);

  // Win check
  useEffect(() => {
    if (isPlaying && matches === pairCount) endGame(true);
  }, [matches, isPlaying]);

  const startGame = async () => {
    if (isPlaying) return;
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);

    const deck: Card[] = [];
    usedSymbols.forEach((s, i) => {
      deck.push({ id: i * 2, symbol: s, flipped: false, matched: false });
      deck.push({ id: i * 2 + 1, symbol: s, flipped: false, matched: false });
    });
    // shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    setCards(deck);
    setFlippedIds([]);
    setMistakes(0);
    setMatches(0);
    setTimeLeft(timeLimit);
    setResult(null);
    setIsPlaying(true);
    play("spin");
  };

  const flipCard = (id: number) => {
    if (locked || !isPlaying) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.flipped || card.matched) return;
    const newCards = cards.map((c) => (c.id === id ? { ...c, flipped: true } : c));
    setCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setLocked(true);
      const [a, b] = newFlipped.map((fid) => newCards.find((c) => c.id === fid)!);
      if (a.symbol === b.symbol) {
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a.id || c.id === b.id ? { ...c, matched: true } : c)));
          setMatches((m) => m + 1);
          setFlippedIds([]);
          setLocked(false);
          play("win");
        }, 450);
      } else {
        setTimeout(() => {
          setCards((cs) => cs.map((c) => (c.id === a.id || c.id === b.id ? { ...c, flipped: false } : c)));
          setFlippedIds([]);
          setMistakes((m) => {
            const next = m + 1;
            if (next >= maxMistakes) endGame(false);
            return next;
          });
          setLocked(false);
          play("lose");
        }, 700);
      }
    }
  };

  const endGame = async (won: boolean) => {
    if (!isPlaying) return;
    setIsPlaying(false);
    setLocked(false);

    let mult = 0;
    if (won) {
      // Reward = base 2x + bonus for fewer mistakes & remaining time
      const accuracyBonus = Math.max(0, (maxMistakes - mistakes) / maxMistakes) * 2; // 0..2
      const speedBonus = (timeLeft / timeLimit) * 1.5; // 0..1.5
      mult = parseFloat((2 + accuracyBonus + speedBonus).toFixed(2));
    } else {
      // partial credit: matches / pairs * 1
      mult = parseFloat(((matches / pairCount) * 1).toFixed(2));
    }
    let winnings = Math.floor(pointCost * mult * PAYOUT_COEF.memoryMatch);
    winnings = adjustWinAmount(winnings);
    if (winnings > 0 && canFullyWin() && mult >= 3) recordFullWin();
    if (winnings > 0) await updateBalance(winnings);

    play(winnings > 0 ? (mult >= 4 ? "bigwin" : "cashout") : "lose");
    setResult(
      won
        ? `🏆 Cleared! ${matches} pairs, ${mistakes} misses → ${mult}x = ₦${winnings.toLocaleString()}`
        : winnings > 0
          ? `${matches}/${pairCount} pairs — ${mult}x → ₦${winnings.toLocaleString()}`
          : `${matches}/${pairCount} pairs — Better luck next time!`
    );
    await recordGameResult(gameId, pointCost, winnings, { matches, mistakes, won, timeLeft });
  };

  const cols = pairCount <= 6 ? 4 : pairCount <= 8 ? 4 : 5;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      {isPlaying && (
        <div className="flex justify-around items-center mb-3 px-2">
          <Stat label="Time" value={`${timeLeft}s`} highlight={timeLeft <= 10} />
          <Stat label="Matches" value={`${matches}/${pairCount}`} />
          <Stat label="Misses" value={`${mistakes}/${maxMistakes}`} highlight={mistakes >= maxMistakes - 1} />
        </div>
      )}

      <GameBackground type="memory" overlay="dark" className="mb-4">
        <div className="p-4">
          {cards.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-5xl mb-2">{emoji}</div>
              <p className="text-white/70 text-sm">Press play to start matching!</p>
            </div>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
              {cards.map((c) => (
                <motion.button
                  key={c.id}
                  onClick={() => flipCard(c.id)}
                  disabled={!isPlaying || c.matched}
                  whileTap={{ scale: 0.95 }}
                  className="aspect-square rounded-xl relative overflow-hidden"
                  style={{ perspective: 600 }}
                >
                  <motion.div
                    className="w-full h-full relative"
                    animate={{ rotateY: c.flipped || c.matched ? 180 : 0 }}
                    transition={{ duration: 0.35 }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Back */}
                    <div
                      className="absolute inset-0 flex items-center justify-center text-2xl font-bold rounded-xl bg-gradient-to-br from-purple-600/40 to-pink-600/40 border border-white/20 text-white/80"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      ?
                    </div>
                    {/* Front */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center text-3xl rounded-xl border-2 ${
                        c.matched
                          ? "bg-green-500/30 border-green-400/60 shadow-lg shadow-green-500/20"
                          : "bg-yellow-500/20 border-yellow-400/50"
                      }`}
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      {c.symbol}
                    </div>
                  </motion.div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="text-base sm:text-lg font-bold text-center mb-4 text-yellow-400">
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      {!isPlaying && (
        <BetControls onPlay={startGame} xpLives={xpLives} pointCost={pointCost} playLabel={`PLAY ${pointCost} pts`} />
      )}
    </motion.div>
  );
};

const Stat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="text-center">
    <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
    <div className={`text-base font-bold ${highlight ? "text-red-400 animate-pulse" : "text-white"}`}>{value}</div>
  </div>
);

export default MemoryMatchEngine;
