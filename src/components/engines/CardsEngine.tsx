import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
}

const CARDS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
const SUITS = ["♠️", "♥️", "♦️", "♣️"];

const randomCard = () => ({
  value: Math.floor(Math.random() * 13),
  suit: SUITS[Math.floor(Math.random() * 4)],
});

const CardsEngine = ({ gameId, name, emoji, pointCost }: Props) => {
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

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
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
      setResult(adjusted > 0 ? `You reached ${streak} streak! Won ₦${adjusted.toLocaleString()}` : `Wrong! The card was ${CARDS[next.value]}${next.suit}`);
      await recordGameResult(gameId, pointCost, adjusted, { streak, lastCard: next });
    }
  };

  const cashOut = async () => {
    const winnings = streak * 100;
    let adjusted = adjustWinAmount(winnings);
    if (adjusted > 0 && canFullyWin() && streak >= 5) recordFullWin();
    if (adjusted > 0) await updateBalance(adjusted);
    setResult(`Cashed out at ${streak} streak! Won ₦${adjusted.toLocaleString()}`);
    await recordGameResult(gameId, pointCost, adjusted, { streak, cashedOut: true });
    setState("idle");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center mb-6">Higher or Lower? • {pointCost} pts</p>

      <Card className="p-8 bg-card/80 backdrop-blur-sm border-primary/30 text-center mb-4">
        <div className="flex gap-6 justify-center items-center">
          <div className="w-24 h-36 rounded-xl bg-background border-2 border-primary/30 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold">{CARDS[currentCard.value]}</span>
            <span className="text-xl">{currentCard.suit}</span>
          </div>
          {nextCard && (
            <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} className="w-24 h-36 rounded-xl bg-background border-2 border-primary/30 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{CARDS[nextCard.value]}</span>
              <span className="text-xl">{nextCard.suit}</span>
            </motion.div>
          )}
        </div>
        {state === "playing" && <p className="text-primary font-bold mt-4">Streak: {streak} (₦{(streak * 100).toLocaleString()})</p>}
      </Card>

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-center mb-4">{result}</motion.div>}

      {state === "playing" ? (
        <div className="grid grid-cols-2 gap-3">
          <Button className="py-6 text-lg bg-green-600 hover:bg-green-700 text-white" onClick={() => guess("hi")} disabled={!!nextCard}>⬆️ Higher</Button>
          <Button className="py-6 text-lg bg-red-600 hover:bg-red-700 text-white" onClick={() => guess("lo")} disabled={!!nextCard}>⬇️ Lower</Button>
          {streak > 0 && <Button variant="outline" className="col-span-2" onClick={cashOut}>💰 Cash Out (₦{(streak * 100).toLocaleString()})</Button>}
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
