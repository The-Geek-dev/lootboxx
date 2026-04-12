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

const PRIZES = [
  { label: "₦5,000", value: 5000, weight: 2 },
  { label: "₦2,000", value: 2000, weight: 5 },
  { label: "₦1,000", value: 1000, weight: 10 },
  { label: "₦500", value: 500, weight: 15 },
  { label: "₦200", value: 200, weight: 20 },
  { label: "₦100", value: 100, weight: 25 },
  { label: "₦0", value: 0, weight: 23 },
];

const InstantEngine = ({ gameId, name, emoji, pointCost }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [boxes, setBoxes] = useState<(string | null)[]>([null, null, null, null, null, null]);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false, false, false, false]);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [revealCount, setRevealCount] = useState(0);

  const weightedRandom = () => {
    const total = PRIZES.reduce((s, p) => s + p.weight, 0);
    let r = Math.random() * total;
    for (const p of PRIZES) { r -= p.weight; if (r <= 0) return p; }
    return PRIZES[PRIZES.length - 1];
  };

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);

    const generated = Array.from({ length: 6 }, () => weightedRandom());
    setBoxes(generated.map((p) => p.label));
    setRevealed([false, false, false, false, false, false]);
    setRevealCount(0);
    setState("playing");
    setResult(null);
  };

  const reveal = async (index: number) => {
    if (state !== "playing" || revealed[index]) return;
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);
    const newCount = revealCount + 1;
    setRevealCount(newCount);

    if (newCount >= 3) {
      // Game over after 3 reveals - sum the revealed prizes
      setState("done");
      const revealedPrizes = boxes.filter((_, i) => newRevealed[i]).map((b) => {
        const prize = PRIZES.find((p) => p.label === b);
        return prize?.value || 0;
      });
      let total = revealedPrizes.reduce((s, v) => s + v, 0);
      if (total > 0) {
        total = adjustWinAmount(total);
        if (canFullyWin() && total >= 1000) recordFullWin();
        await updateBalance(total);
      }
      setResult(total > 0 ? `🎉 You won ₦${total.toLocaleString()}!` : "No luck this time!");
      await recordGameResult(gameId, pointCost, total, { revealed: revealedPrizes });

      // Reveal all remaining
      setTimeout(() => setRevealed([true, true, true, true, true, true]), 500);
    }
  };

  const EMOJIS = ["📦", "🎁", "💎", "🔮", "⭐", "🎪"];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center mb-6">Pick 3 boxes to reveal prizes! • {pointCost} pts</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {boxes.map((box, i) => (
          <motion.div key={i} whileHover={state === "playing" && !revealed[i] ? { scale: 1.05 } : {}} whileTap={state === "playing" && !revealed[i] ? { scale: 0.95 } : {}}>
            <Card className={`p-4 sm:p-6 text-center cursor-pointer transition-all ${revealed[i] ? "bg-primary/10 border-primary/30" : "bg-card/80 hover:border-primary/50"}`}
              onClick={() => reveal(i)}>
              {revealed[i] ? (
                <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }}>
                  <p className="text-2xl font-bold text-primary">{box}</p>
                </motion.div>
              ) : (
                <p className="text-3xl">{EMOJIS[i]}</p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {state === "playing" && <p className="text-center text-sm text-muted-foreground mb-4">Pick {3 - revealCount} more box{3 - revealCount !== 1 ? "es" : ""}</p>}

      {result && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-xl font-bold text-center mb-4">{result}</motion.div>}

      {state !== "playing" && (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default InstantEngine;
