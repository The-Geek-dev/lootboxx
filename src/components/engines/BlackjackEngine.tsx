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

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
type Card = { rank: string; suit: string };

const draw = (): Card => ({
  rank: RANKS[Math.floor(Math.random() * RANKS.length)],
  suit: SUITS[Math.floor(Math.random() * SUITS.length)],
});

const handValue = (hand: Card[]): number => {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.rank === "A") { total += 11; aces++; }
    else if (["J", "Q", "K"].includes(c.rank)) total += 10;
    else total += parseInt(c.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
};

const DEFAULT_THEME: GameTheme = { bgGradient: "from-green-900 to-emerald-950", accentColor: "text-green-400", description: "Beat the dealer to 21", variant: "classic" };

const BlackjackEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [player, setPlayer] = useState<Card[]>([]);
  const [dealer, setDealer] = useState<Card[]>([]);
  const [state, setState] = useState<"idle" | "playing" | "dealer" | "done">("idle");
  const [doubled, setDoubled] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const start = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    if (!(await consumeLife())) return;
    await spendPoints(pointCost);
    play("spin");
    const p = [draw(), draw()];
    const d = [draw(), draw()];
    setPlayer(p); setDealer(d); setDoubled(false); setResult(null);
    if (handValue(p) === 21) { await finish(p, d, false); return; }
    setState("playing");
  };

  const hit = async () => {
    const next = [...player, draw()];
    setPlayer(next);
    if (handValue(next) >= 21) await finish(next, dealer, doubled);
  };

  const stand = async () => { await finish(player, dealer, doubled); };

  const doubleDown = async () => {
    if (points < pointCost) { toast({ title: "Insufficient points to double", variant: "destructive" }); return; }
    await spendPoints(pointCost);
    setDoubled(true);
    const next = [...player, draw()];
    setPlayer(next);
    await finish(next, dealer, true);
  };

  const finish = async (p: Card[], d: Card[], dbl: boolean) => {
    setState("dealer");
    let dh = [...d];
    while (handValue(dh) < 17) dh.push(draw());
    setDealer(dh);
    const pv = handValue(p), dv = handValue(dh);
    const stake = pointCost * (dbl ? 2 : 1);
    let payout = 0, msg = "";
    if (pv > 21) { msg = `💥 Bust! ${pv} — You lose`; play("lose"); }
    else if (dv > 21) { payout = Math.floor(stake * PAYOUT_COEF.blackjack); msg = `🎉 Dealer busts ${dv} — You win!`; play("win"); }
    else if (pv === 21 && p.length === 2) { payout = Math.floor(stake * PAYOUT_COEF.blackjack * 1.5); msg = `🃏 Blackjack! 21 — You win!`; play("win"); }
    else if (pv > dv) { payout = Math.floor(stake * PAYOUT_COEF.blackjack); msg = `🎉 ${pv} vs ${dv} — You win!`; play("win"); }
    else if (pv === dv) { payout = stake; msg = `🤝 Push ${pv} — Bet returned`; }
    else { msg = `❌ ${pv} vs ${dv} — Dealer wins`; play("lose"); }

    let final = adjustWinAmount(payout);
    if (final > 0 && canFullyWin() && pv === 21) recordFullWin();
    if (final > 0) await updateBalance(final);
    setResult(`${msg} ${final > 0 ? `(₦${final.toLocaleString()})` : ""}`);
    await recordGameResult(gameId, stake, final, { player: pv, dealer: dv, doubled: dbl });
    setState("done");
  };

  const renderCard = (c: Card, hidden = false) => (
    <div className={`w-14 h-20 sm:w-16 sm:h-24 rounded-lg border-2 flex flex-col items-center justify-center shadow-lg ${hidden ? "bg-blue-900 border-blue-700" : "bg-white border-gray-300"}`}>
      {hidden ? <span className="text-3xl">🂠</span> : (
        <>
          <span className={`text-xl font-bold ${["♥", "♦"].includes(c.suit) ? "text-red-600" : "text-black"}`}>{c.rank}</span>
          <span className={`text-2xl ${["♥", "♦"].includes(c.suit) ? "text-red-600" : "text-black"}`}>{c.suit}</span>
        </>
      )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      <GameBackground type="cards" overlay="medium" className="mb-4">
        <div className="p-4 sm:p-6 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Dealer {state !== "playing" && dealer.length ? `(${handValue(dealer)})` : ""}</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {dealer.map((c, i) => renderCard(c, i === 1 && state === "playing"))}
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">You {player.length ? `(${handValue(player)})` : ""}</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {player.map((c) => renderCard(c))}
            </div>
          </div>
        </div>
      </GameBackground>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-lg font-bold text-center mb-4 text-foreground">{result}</motion.div>
        )}
      </AnimatePresence>

      {state === "playing" ? (
        <div className="grid grid-cols-3 gap-2">
          <Button onClick={hit} className="py-5 font-bold">Hit</Button>
          <Button onClick={stand} className="py-5 font-bold" variant="secondary">Stand</Button>
          <Button onClick={doubleDown} disabled={player.length !== 2 || points < pointCost} className="py-5 font-bold" variant="outline">Double</Button>
        </div>
      ) : (
        <BetControls onPlay={start} xpLives={xpLives} pointCost={pointCost} playLabel={`DEAL (${pointCost} pts)`} />
      )}
    </motion.div>
  );
};

export default BlackjackEngine;
