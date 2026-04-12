import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { GameTheme } from "@/config/gameThemes";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme: GameTheme;
}

const CARDS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUITS = ["\u2660\uFE0F", "\u2665\uFE0F", "\u2666\uFE0F", "\u2663\uFE0F"];

const randomCard = () => ({
  value: Math.floor(Math.random() * 13),
  suit: SUITS[Math.floor(Math.random() * 4)],
});

// Different visual styles per variant
const getCardStyle = (variant?: string) => {
  switch (variant) {
    case "royal": return "bg-gradient-to-b from-yellow-900/30 to-purple-900/30 border-yellow-500/40";
    case "blackjack": return "bg-gradient-to-b from-green-900/30 to-green-800/30 border-emerald-500/40";
    case "poker": return "bg-gradient-to-b from-red-900/30 to-gray-900/30 border-red-500/40";
    case "roulette": return "bg-gradient-to-b from-red-900/30 to-black border-red-500/40";
    case "baccarat": return "bg-gradient-to-b from-blue-900/30 to-blue-800/30 border-blue-500/40";
    case "war": return "bg-gradient-to-b from-gray-800/30 to-red-900/30 border-gray-500/40";
    case "color-guess": return "bg-gradient-to-b from-red-900/30 to-gray-900/30 border-red-500/40";
    default: return "bg-background border-primary/30";
  }
};

const getActionLabels = (variant?: string): [string, string] => {
  switch (variant) {
    case "color-guess": return ["\u{1F534} Red", "\u26AB Black"];
    case "blackjack": return ["\u{1F4B0} Hit", "\u270B Stand"];
    case "roulette": return ["\u{1F534} Red", "\u26AB Black"];
    case "war": return ["\u2694\uFE0F Attack", "\u{1F6E1}\uFE0F Defend"];
    case "baccarat": return ["\u{1F451} Player", "\u{1F3E6} Banker"];
    default: return ["\u2B06\uFE0F Higher", "\u2B07\uFE0F Lower"];
  }
};

const CardsEngine = ({ gameId, name, emoji, pointCost, theme }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [currentCard, setCurrentCard] = useState(randomCard());
  const [streak, setStreak] = useState(0);
  const [state, setState] = useState<"idle" | "playing" | "lost">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [lastGuess, setLastGuess] = useState<"hi" | "lo" | null>(null);
  const [nextCard, setNextCard] = useState<{ value: number; suit: string } | null>(null);

  const cardStyle = getCardStyle(theme.variant);
  const [label1, label2] = getActionLabels(theme.variant);

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! \u26A1", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setCurrentCard(randomCard());
    setStreak(0);
    setState("playing");
    setResult(null);
    setNextCard(null);
    setLastGuess(null);
  };

  const guess = async (direction: "hi" | "lo") => {
    if (state !== "playing") return;
    const next = randomCard();
    setNextCard(next);
    setLastGuess(direction);

    const correct = direction === "hi" ? next.value >= currentCard.value : next.value <= currentCard.value;

    if (correct) {
      setStreak((s) => s + 1);
      setTimeout(() => {
        setCurrentCard(next);
        setNextCard(null);
        setLastGuess(null);
      }, 1000);
    } else {
      setState("lost");
      const winnings = streak > 0 ? streak * 100 : 0;
      let adjusted = winnings > 0 ? adjustWinAmount(winnings) : 0;
      if (adjusted > 0 && canFullyWin() && streak >= 5) recordFullWin();
      if (adjusted > 0) await updateBalance(adjusted);
      setResult(adjusted > 0 ? `You reached ${streak} streak! Won \u20A6${adjusted.toLocaleString()}` : `Wrong! The card was ${CARDS[next.value]}${next.suit}`);
      await recordGameResult(gameId, pointCost, adjusted, { streak, lastCard: next });
    }
  };

  const cashOut = async () => {
    const winnings = streak * 100;
    let adjusted = adjustWinAmount(winnings);
    if (adjusted > 0 && canFullyWin() && streak >= 5) recordFullWin();
    if (adjusted > 0) await updateBalance(adjusted);
    setResult(`Cashed out at ${streak} streak! Won \u20A6${adjusted.toLocaleString()}`);
    await recordGameResult(gameId, pointCost, adjusted, { streak, cashedOut: true });
    setState("idle");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-6`}>{theme.description}</p>

      <Card className={`p-8 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 text-center mb-4 relative overflow-hidden`}>
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5 text-9xl flex items-center justify-center pointer-events-none">{emoji}</div>

        <div className="flex gap-6 justify-center items-center relative">
          <motion.div
            className={`w-24 h-36 rounded-xl ${cardStyle} flex flex-col items-center justify-center border-2`}
            animate={state === "playing" ? { boxShadow: ["0 0 0px transparent", `0 0 15px rgba(255,255,255,0.1)`, "0 0 0px transparent"] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="text-3xl font-bold">{CARDS[currentCard.value]}</span>
            <span className="text-xl">{currentCard.suit}</span>
          </motion.div>

          {state === "playing" && !nextCard && (
            <motion.div
              className="w-24 h-36 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <span className="text-2xl">?</span>
            </motion.div>
          )}

          {nextCard && (
            <motion.div initial={{ rotateY: 90, scale: 0.8 }} animate={{ rotateY: 0, scale: 1 }}
              className={`w-24 h-36 rounded-xl ${cardStyle} flex flex-col items-center justify-center border-2`}>
              <span className="text-3xl font-bold">{CARDS[nextCard.value]}</span>
              <span className="text-xl">{nextCard.suit}</span>
            </motion.div>
          )}
        </div>

        {state === "playing" && (
          <motion.p
            className={`${theme.accentColor} font-bold mt-4`}
            animate={streak > 0 ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            Streak: {streak} (\u20A6{(streak * 100).toLocaleString()})
          </motion.p>
        )}
      </Card>

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-center mb-4">{result}</motion.div>}

      {state === "playing" ? (
        <div className="grid grid-cols-2 gap-3">
          <Button className="py-6 text-lg bg-green-600 hover:bg-green-700 text-white" onClick={() => guess("hi")} disabled={!!nextCard}>{label1}</Button>
          <Button className="py-6 text-lg bg-red-600 hover:bg-red-700 text-white" onClick={() => guess("lo")} disabled={!!nextCard}>{label2}</Button>
          {streak > 0 && <Button variant="outline" className="col-span-2" onClick={cashOut}>{"💰"} Cash Out ({"₦"}{(streak * 100).toLocaleString()})</Button>}
        </div>
      ) : (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default CardsEngine;
