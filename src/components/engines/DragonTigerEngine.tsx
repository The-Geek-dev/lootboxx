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

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
}

const DEFAULT_THEME: GameTheme = {
  bgGradient: "from-red-950 to-orange-950",
  accentColor: "text-red-400",
  description: "Two cards drawn — bet Dragon, Tiger, or Tie",
  variant: "classic",
};

type Bet = "dragon" | "tiger" | "tie";

const drawCard = () => Math.floor(Math.random() * 13) + 1; // 1..13
const cardLabel = (n: number) => ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"][n - 1];

const DragonTigerEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [bet, setBet] = useState<Bet | null>(null);
  const [dragon, setDragon] = useState<number | null>(null);
  const [tiger, setTiger] = useState<number | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const placeBet = async (choice: Bet) => {
    if (drawing) return;
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    if (!(await consumeLife())) return;
    await spendPoints(pointCost);

    setBet(choice);
    setDragon(null); setTiger(null); setResult(null);
    setDrawing(true);
    play("spin");

    await new Promise(r => setTimeout(r, 600));
    const d = drawCard(); setDragon(d);
    await new Promise(r => setTimeout(r, 700));
    const t = drawCard(); setTiger(t);

    let outcome: Bet = "tie";
    if (d > t) outcome = "dragon";
    else if (t > d) outcome = "tiger";

    let payout = 0;
    if (outcome === choice) {
      const mult = choice === "tie" ? 8 : 1.95;
      payout = Math.floor(pointCost * mult * PAYOUT_COEF.dragonTiger);
      payout = adjustWinAmount(payout);
      if (payout > 0 && canFullyWin() && choice === "tie") recordFullWin();
      if (payout > 0) await updateBalance(payout);
      play("win");
      setResult(`${outcome === "tie" ? "🤝" : outcome === "dragon" ? "🐉" : "🐯"} ${outcome.toUpperCase()} wins! +₦${payout.toLocaleString()}`);
    } else {
      play("lose");
      setResult(`${outcome === "dragon" ? "🐉" : outcome === "tiger" ? "🐯" : "🤝"} ${outcome.toUpperCase()} wins. You bet ${choice}.`);
    }
    await recordGameResult(gameId, pointCost, payout, { bet: choice, dragon: d, tiger: t, outcome });
    setDrawing(false);
  };

  const Card = ({ value, label }: { value: number | null; label: string }) => (
    <div className="flex-1 flex flex-col items-center">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <motion.div
        key={value ?? -1}
        initial={{ rotateY: 90, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        className="w-20 h-28 sm:w-24 sm:h-36 bg-card border-2 border-primary/50 rounded-lg flex items-center justify-center text-3xl sm:text-4xl font-bold text-foreground shadow-lg"
      >
        {value !== null ? cardLabel(value) : "?"}
      </motion.div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="cards" overlay="medium" className="mb-4">
        <div className="p-4 sm:p-8 flex justify-around items-center gap-4">
          <Card value={dragon} label="🐉 Dragon" />
          <div className="text-2xl">VS</div>
          <Card value={tiger} label="🐯 Tiger" />
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-lg font-bold text-center mb-4 text-foreground">{result}</motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-3 gap-2">
        <Button onClick={() => placeBet("dragon")} disabled={drawing || xpLives <= 0 || points < pointCost}
          className="py-6 bg-red-600 hover:bg-red-700 text-white font-bold">🐉 Dragon (1.95×)</Button>
        <Button onClick={() => placeBet("tie")} disabled={drawing || xpLives <= 0 || points < pointCost}
          className="py-6 bg-amber-600 hover:bg-amber-700 text-white font-bold">🤝 Tie (8×)</Button>
        <Button onClick={() => placeBet("tiger")} disabled={drawing || xpLives <= 0 || points < pointCost}
          className="py-6 bg-orange-600 hover:bg-orange-700 text-white font-bold">🐯 Tiger (1.95×)</Button>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">Cost per round: {pointCost} pts • XP: {xpLives}</p>
    </motion.div>
  );
};

export default DragonTigerEngine;
