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

type Outcome = { icon: string; label: string };
const OUTCOMES: [Outcome, Outcome] = [
  { icon: "🏠", label: "Home" },
  { icon: "🏃", label: "Away" },
];

const SportsEngine = ({ gameId, name, emoji, pointCost }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [bet, setBet] = useState<0 | 1 | null>(null);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [scores, setScores] = useState([0, 0]);
  const [animating, setAnimating] = useState(false);

  const play = async () => {
    if (bet === null) { toast({ title: "Pick a team!", variant: "destructive" }); return; }
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setState("playing");
    setResult(null);
    setAnimating(true);

    // Simulate match with score updates
    let s1 = 0, s2 = 0;
    const rounds = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < rounds; i++) {
      await new Promise((r) => setTimeout(r, 400));
      if (Math.random() > 0.5) s1++;
      else s2++;
      setScores([s1, s2]);
    }

    setAnimating(false);
    const winner = s1 > s2 ? 0 : s2 > s1 ? 1 : -1; // -1 = draw
    const won = winner === bet;
    const isDraw = winner === -1;

    let winnings = 0;
    if (won) {
      winnings = Math.abs(s1 - s2) >= 3 ? 3000 : Math.abs(s1 - s2) >= 2 ? 1500 : 800;
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && winnings >= 1500) recordFullWin();
      await updateBalance(winnings);
    } else if (isDraw) {
      // Refund half
      winnings = Math.floor(pointCost * 5);
      winnings = adjustWinAmount(winnings);
      await updateBalance(winnings);
    }

    setResult(won ? `🎉 ${OUTCOMES[bet].label} wins! You won ₦${winnings.toLocaleString()}!` : isDraw ? `🤝 Draw! Partial refund ₦${winnings.toLocaleString()}` : `${OUTCOMES[winner as 0 | 1].label} wins. Better luck next time!`);
    await recordGameResult(gameId, pointCost, winnings, { scores: [s1, s2], bet, winner });
    setState("done");
  };

  const reset = () => {
    setBet(null);
    setState("idle");
    setResult(null);
    setScores([0, 0]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center mb-6">Pick the winner! • {pointCost} pts</p>

      <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/30 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <motion.div className="text-4xl mb-2" animate={animating ? { y: [0, -5, 0] } : {}} transition={{ repeat: animating ? Infinity : 0, duration: 0.3 }}>
              {OUTCOMES[0].icon}
            </motion.div>
            <p className="font-semibold text-sm">{OUTCOMES[0].label}</p>
            <p className="text-3xl font-mono font-bold text-primary mt-2">{scores[0]}</p>
          </div>
          <div className="text-2xl font-bold text-muted-foreground px-4">VS</div>
          <div className="text-center flex-1">
            <motion.div className="text-4xl mb-2" animate={animating ? { y: [0, -5, 0] } : {}} transition={{ repeat: animating ? Infinity : 0, duration: 0.3, delay: 0.15 }}>
              {OUTCOMES[1].icon}
            </motion.div>
            <p className="font-semibold text-sm">{OUTCOMES[1].label}</p>
            <p className="text-3xl font-mono font-bold text-primary mt-2">{scores[1]}</p>
          </div>
        </div>
      </Card>

      {state === "idle" && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {OUTCOMES.map((o, i) => (
            <Button key={i} variant={bet === i ? "default" : "outline"} className={`py-6 text-lg ${bet === i ? "ring-2 ring-primary" : ""}`}
              onClick={() => setBet(i as 0 | 1)}>
              {o.icon} {o.label}
            </Button>
          ))}
        </div>
      )}

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold text-center mb-4">{result}</motion.div>}

      {state === "idle" ? (
        <Button className="button-gradient w-full py-3 text-lg" onClick={play} disabled={bet === null || xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      ) : state === "done" ? (
        <Button className="button-gradient w-full py-3 text-lg" onClick={reset}>Play Again</Button>
      ) : null}
    </motion.div>
  );
};

export default SportsEngine;
