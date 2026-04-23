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
}

type BetKey = "player" | "banker" | "tie";

const BETS: { key: BetKey; label: string; multiplier: number }[] = [
  { key: "player", label: "Player", multiplier: 2 },
  { key: "banker", label: "Banker", multiplier: 1.95 },
  { key: "tie", label: "Tie", multiplier: 8 },
];

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

const cardValue = (rank: string) => {
  if (rank === "A") return 1;
  if (["10", "J", "Q", "K"].includes(rank)) return 0;
  return parseInt(rank, 10);
};

const drawCard = () => {
  const r = RANKS[Math.floor(Math.random() * RANKS.length)];
  const s = SUITS[Math.floor(Math.random() * SUITS.length)];
  return { rank: r, suit: s, value: cardValue(r) };
};

const handTotal = (cards: { value: number }[]) =>
  cards.reduce((a, c) => a + c.value, 0) % 10;

const DEFAULT_THEME: GameTheme = {
  bgGradient: "from-blue-950 to-indigo-950",
  accentColor: "text-blue-400",
  description: "Bet on Player, Banker, or Tie. Closest to 9 wins.",
  variant: "classic",
};

const BaccaratEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [bet, setBet] = useState<BetKey>("player");
  const [playerCards, setPlayerCards] = useState<{ rank: string; suit: string; value: number }[]>([]);
  const [bankerCards, setBankerCards] = useState<{ rank: string; suit: string; value: number }[]>([]);
  const [dealing, setDealing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const deal = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    if (!(await consumeLife())) return;
    await spendPoints(pointCost);
    setDealing(true); setResult(null); play("spin");

    const pHand = [drawCard(), drawCard()];
    const bHand = [drawCard(), drawCard()];
    setPlayerCards(pHand);
    setBankerCards(bHand);

    setTimeout(() => {
      // Third-card rule (simplified)
      const pTotal = handTotal(pHand);
      const bTotal = handTotal(bHand);
      if (pTotal <= 5) pHand.push(drawCard());
      if (bTotal <= 5) bHand.push(drawCard());
      setPlayerCards([...pHand]);
      setBankerCards([...bHand]);
      setTimeout(() => finish(pHand, bHand), 600);
    }, 800);
  };

  const finish = async (pHand: any[], bHand: any[]) => {
    const pTotal = handTotal(pHand);
    const bTotal = handTotal(bHand);
    let winner: BetKey = "tie";
    if (pTotal > bTotal) winner = "player";
    else if (bTotal > pTotal) winner = "banker";

    const won = winner === bet;
    let payout = 0;
    if (won) {
      const betDef = BETS.find((b) => b.key === bet)!;
      payout = Math.floor(pointCost * betDef.multiplier * PAYOUT_COEF.blackjack);
      payout = adjustWinAmount(payout);
      if (payout > 0 && canFullyWin() && bet === "tie") recordFullWin();
      if (payout > 0) await updateBalance(payout);
      play("win");
      setResult(`🎉 ${winner.toUpperCase()} wins (P:${pTotal} vs B:${bTotal}) — +₦${payout.toLocaleString()}`);
    } else {
      play("lose");
      setResult(`😔 ${winner.toUpperCase()} won (P:${pTotal} vs B:${bTotal}). You bet ${bet}.`);
    }
    await recordGameResult(gameId, pointCost, payout, { player: pTotal, banker: bTotal, bet, winner });
    setDealing(false);
  };

  const renderCards = (cards: { rank: string; suit: string }[], label: string, total: number) => (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label} ({total})</div>
      <div className="flex gap-1.5">
        {cards.length === 0 && <div className="w-12 h-16 rounded border border-border/40 bg-card/30" />}
        {cards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ rotateY: 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ delay: i * 0.15 }}
            className={`w-12 h-16 sm:w-14 sm:h-20 rounded border-2 border-foreground/20 bg-card flex flex-col items-center justify-center font-bold ${
              c.suit === "♥" || c.suit === "♦" ? "text-red-500" : "text-foreground"
            }`}
          >
            <span className="text-lg">{c.rank}</span>
            <span className="text-base">{c.suit}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="cards" overlay="medium" className="mb-4">
        <div className="p-4 sm:p-6 flex justify-around items-center gap-4">
          {renderCards(playerCards, "Player", handTotal(playerCards))}
          <div className="text-2xl font-bold text-foreground/40">VS</div>
          {renderCards(bankerCards, "Banker", handTotal(bankerCards))}
        </div>
      </GameBackground>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {BETS.map((b) => (
          <Button
            key={b.key}
            variant={bet === b.key ? "default" : "outline"}
            disabled={dealing}
            onClick={() => setBet(b.key)}
            className="text-xs sm:text-sm py-3 flex flex-col h-auto"
          >
            <span>{b.label}</span>
            <span className="text-[10px] opacity-70">×{b.multiplier}</span>
          </Button>
        ))}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-base font-bold text-center mb-4 text-foreground">{result}</motion.div>
        )}
      </AnimatePresence>

      <BetControls onPlay={deal} xpLives={xpLives} pointCost={pointCost} isPlaying={dealing} playLabel={`DEAL (${pointCost} pts)`} />
    </motion.div>
  );
};

export default BaccaratEngine;
