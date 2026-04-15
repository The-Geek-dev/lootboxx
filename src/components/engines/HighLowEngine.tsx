import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import GameBackground from "./GameBackground";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { GameTheme } from "@/config/gameThemes";
import { useGameSounds } from "@/hooks/useGameSounds";
import { ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  cardSet?: { value: number; display: string; suit: string }[];
}

const DEFAULT_THEME: GameTheme = { bgGradient: "from-green-950 to-black", accentColor: "text-green-400", description: "Higher or Lower?", variant: "classic" };

const STANDARD_DECK = [
  { value: 1, display: "A", suit: "♠" }, { value: 2, display: "2", suit: "♥" },
  { value: 3, display: "3", suit: "♦" }, { value: 4, display: "4", suit: "♣" },
  { value: 5, display: "5", suit: "♠" }, { value: 6, display: "6", suit: "♥" },
  { value: 7, display: "7", suit: "♦" }, { value: 8, display: "8", suit: "♣" },
  { value: 9, display: "9", suit: "♠" }, { value: 10, display: "10", suit: "♥" },
  { value: 11, display: "J", suit: "♦" }, { value: 12, display: "Q", suit: "♣" },
  { value: 13, display: "K", suit: "♠" },
];

const HighLowEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [currentCard, setCurrentCard] = useState(STANDARD_DECK[0]);
  const [nextCard, setNextCard] = useState<typeof STANDARD_DECK[0] | null>(null);
  const [streak, setStreak] = useState(0);
  const [state, setState] = useState<"idle" | "playing" | "reveal" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [history, setHistory] = useState<typeof STANDARD_DECK>([]);

  const randomCard = () => STANDARD_DECK[Math.floor(Math.random() * STANDARD_DECK.length)];

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    const first = randomCard();
    setCurrentCard(first);
    setNextCard(null);
    setStreak(0);
    setState("playing");
    setResult(null);
    setIsCorrect(null);
    setHistory([first]);
  };

  const guess = (higher: boolean) => {
    const next = randomCard();
    setNextCard(next);
    const correct = higher ? next.value >= currentCard.value : next.value <= currentCard.value;
    setIsCorrect(correct);
    setState("reveal");
    play(correct ? "win" : "lose");

    setTimeout(() => {
      if (correct) {
        setStreak(s => s + 1);
        setHistory(h => [...h, next]);
        setCurrentCard(next);
        setNextCard(null);
        setIsCorrect(null);
        setState("playing");
      } else {
        endGame(streak);
      }
    }, 1200);
  };

  const cashOut = () => { play("cashout"); endGame(streak); };

  const endGame = async (finalStreak: number) => {
    setState("done");
    let winnings = 0;
    if (finalStreak >= 10) winnings = 5000;
    else if (finalStreak >= 7) winnings = 3000;
    else if (finalStreak >= 5) winnings = 1500;
    else if (finalStreak >= 3) winnings = 500;
    else if (finalStreak >= 1) winnings = 100;

    if (winnings > 0) {
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && finalStreak >= 7) recordFullWin();
      await updateBalance(winnings);
    }
    setResult(winnings > 0
      ? `🎉 ${finalStreak} correct! Won ₦${winnings.toLocaleString()}!`
      : `${finalStreak} correct. Try again!`);
    await recordGameResult(gameId, pointCost, winnings, { streak: finalStreak });
  };

  const getSuitColor = (suit: string) => {
    return suit === "♥" || suit === "♦" ? "text-red-500" : "text-foreground";
  };

  const renderCard = (card: typeof STANDARD_DECK[0], size: "lg" | "sm" = "lg", faceDown = false) => (
    <motion.div
      className={`${size === "lg" ? "w-28 h-40 sm:w-36 sm:h-48 text-3xl sm:text-4xl" : "w-10 h-14 text-sm"} 
        rounded-xl border-2 flex flex-col items-center justify-center font-bold
        ${faceDown ? "bg-primary/20 border-primary/40" : "bg-card border-border"}`}
      initial={{ rotateY: faceDown ? 0 : 90 }}
      animate={{ rotateY: 0 }}
      transition={{ duration: 0.4 }}
    >
      {faceDown ? (
        <span className="text-2xl">🂠</span>
      ) : (
        <>
          <span className={getSuitColor(card.suit)}>{card.display}</span>
          <span className={`${size === "lg" ? "text-lg" : "text-xs"} ${getSuitColor(card.suit)}`}>{card.suit}</span>
        </>
      )}
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-4`}>{theme.description}</p>

      {state !== "idle" && (
        <div className="flex justify-between items-center mb-4">
          <span className={`font-bold ${theme.accentColor}`}>Streak: {streak} 🔥</span>
          {streak >= 1 && state === "playing" && (
            <Button variant="outline" size="sm" onClick={cashOut}>Cash Out</Button>
          )}
        </div>
      )}

      {/* Card history */}
      {history.length > 1 && (
        <div className="flex justify-center gap-1 mb-3 flex-wrap">
          {history.slice(-6).map((c, i) => (
            <div key={i}>{renderCard(c, "sm")}</div>
          ))}
        </div>
      )}

      {/* Main card area */}
      <GameBackground type="highlow" overlay="medium" className="mb-4">
        <div className="p-6">
        <div className="flex items-center justify-center gap-6">
          {renderCard(currentCard)}
          {state === "reveal" && nextCard && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
              <div className={`rounded-xl p-1 ${isCorrect ? "ring-2 ring-green-400" : "ring-2 ring-red-400"}`}>
                {renderCard(nextCard)}
              </div>
            </motion.div>
          )}
          {state === "playing" && (
            <div className="w-28 h-40 sm:w-36 sm:h-48 rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center">
              <span className="text-3xl">❓</span>
            </div>
          )}
        </div>

        {state === "reveal" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className={`text-center mt-3 font-bold text-lg ${isCorrect ? "text-green-400" : "text-red-400"}`}>
            {isCorrect ? "✅ Correct!" : "❌ Wrong!"}
          </motion.p>
        )}
        </div>
      </GameBackground>

      {state === "playing" && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button className="py-6 text-lg bg-green-600 hover:bg-green-700" onClick={() => guess(true)}>
            <ArrowUp className="mr-2 h-5 w-5" /> Higher
          </Button>
          <Button className="py-6 text-lg bg-red-600 hover:bg-red-700" onClick={() => guess(false)}>
            <ArrowDown className="mr-2 h-5 w-5" /> Lower
          </Button>
        </div>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className={`text-lg font-bold text-center mb-4 ${theme.accentColor}`}>{result}</motion.div>
      )}

      {(state === "idle" || state === "done") && (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default HighLowEngine;
