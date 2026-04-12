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
  theme?: GameTheme;
}

const PRIZES = [
  { label: "\u20A65,000", value: 5000, weight: 2 },
  { label: "\u20A62,000", value: 2000, weight: 5 },
  { label: "\u20A61,000", value: 1000, weight: 10 },
  { label: "\u20A6500", value: 500, weight: 15 },
  { label: "\u20A6200", value: 200, weight: 20 },
  { label: "\u20A6100", value: 100, weight: 25 },
  { label: "\u20A60", value: 0, weight: 23 },
];

const getBoxIcons = (variant?: string): string[] => {
  switch (variant) {
    case "coin": return ["\u{1FA99}", "\u{1FA99}", "\u{1FA99}", "\u{1FA99}", "\u{1FA99}", "\u{1FA99}"];
    case "mines": return ["\u{1F4A3}", "\u{1F4A3}", "\u{1F4A3}", "\u{1F4A3}", "\u{1F4A3}", "\u{1F4A3}"];
    case "balloon": return ["\u{1F388}", "\u{1F388}", "\u{1F388}", "\u{1F388}", "\u{1F388}", "\u{1F388}"];
    case "mystery": return ["\u{1F4E6}", "\u{1F381}", "\u{1F4E6}", "\u{1F381}", "\u{1F4E6}", "\u{1F381}"];
    case "scratch": return ["\u{1F0CF}", "\u{1F0CF}", "\u{1F0CF}", "\u{1F0CF}", "\u{1F0CF}", "\u{1F0CF}"];
    case "clover": return ["\u{1F340}", "\u{1F340}", "\u{1F340}", "\u{1F340}", "\u{1F340}", "\u{1F340}"];
    case "gold": return ["\u{1F947}", "\u{1F4B0}", "\u{1F947}", "\u{1F4B0}", "\u{1F947}", "\u{1F4B0}"];
    case "thunder": return ["\u26A1", "\u{1F329}\uFE0F", "\u26A1", "\u{1F329}\uFE0F", "\u26A1", "\u{1F329}\uFE0F"];
    case "cat": return ["\u{1F431}", "\u{1F3EE}", "\u{1F431}", "\u{1F3EE}", "\u{1F431}", "\u{1F3EE}"];
    case "charm": return ["\u{1F9FF}", "\u2728", "\u{1F9FF}", "\u2728", "\u{1F9FF}", "\u2728"];
    case "cash": return ["\u{1F4B5}", "\u{1F4B0}", "\u{1F4B5}", "\u{1F4B0}", "\u{1F4B5}", "\u{1F4B0}"];
    case "double": return ["\u2705", "\u274C", "\u2705", "\u274C", "\u2705", "\u274C"];
    case "mine": return ["\u26CF\uFE0F", "\u{1F48E}", "\u26CF\uFE0F", "\u{1F48E}", "\u26CF\uFE0F", "\u{1F48E}"];
    case "tower": return ["1\uFE0F\u20E3", "2\uFE0F\u20E3", "3\uFE0F\u20E3", "4\uFE0F\u20E3", "5\uFE0F\u20E3", "6\uFE0F\u20E3"];
    case "plinko": return ["\u{1F535}", "\u{1F534}", "\u{1F7E2}", "\u{1F7E1}", "\u{1F7E3}", "\u{1F7E0}"];
    case "wheel": case "fortune": return ["\u{1F3AF}", "\u{1F4B0}", "\u{1F451}", "\u{1F48E}", "\u2B50", "\u{1F525}"];
    case "colors": return ["\u{1F534}", "\u{1F535}", "\u{1F7E2}", "\u{1F7E1}", "\u{1F7E3}", "\u{1F7E0}"];
    default: return ["\u{1F4E6}", "\u{1F381}", "\u{1F48E}", "\u{1F52E}", "\u2B50", "\u{1F3AA}"];
  }
};

const getBoxCount = (variant?: string): number => {
  switch (variant) {
    case "coin": case "double": return 2;
    case "colors": case "plinko": return 9;
    case "tower": return 8;
    default: return 6;
  }
};

const getPickCount = (variant?: string): number => {
  switch (variant) {
    case "coin": case "double": return 1;
    case "colors": case "plinko": return 3;
    case "tower": return 4;
    default: return 3;
  }
};

const getGridCols = (count: number): string => {
  if (count <= 2) return "grid-cols-2";
  if (count <= 4) return "grid-cols-2 sm:grid-cols-4";
  if (count <= 6) return "grid-cols-3";
  return "grid-cols-3 sm:grid-cols-3";
};

const InstantEngine = ({ gameId, name, emoji, pointCost, theme = { bgGradient: 'from-purple-900 to-black', accentColor: 'text-purple-400', description: '', variant: 'classic' } }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const boxCount = getBoxCount(theme.variant);
  const pickCount = getPickCount(theme.variant);
  const boxIcons = getBoxIcons(theme.variant);
  const [boxes, setBoxes] = useState<(string | null)[]>(Array(boxCount).fill(null));
  const [revealed, setRevealed] = useState<boolean[]>(Array(boxCount).fill(false));
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
    if (xpLives <= 0) { toast({ title: "No XP lives! \u26A1", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    const generated = Array.from({ length: boxCount }, () => weightedRandom());
    setBoxes(generated.map((p) => p.label));
    setRevealed(Array(boxCount).fill(false));
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

    if (newCount >= pickCount) {
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
      setResult(total > 0 ? `\u{1F389} You won \u20A6${total.toLocaleString()}!` : "No luck this time!");
      await recordGameResult(gameId, pointCost, total, { revealed: revealedPrizes });
      setTimeout(() => setRevealed(Array(boxCount).fill(true)), 500);
    }
  };

  const getBoxStyle = (isRevealed: boolean) => {
    if (isRevealed) return `bg-gradient-to-br ${theme.bgGradient} border-primary/30`;
    switch (theme.variant) {
      case "mines": return "bg-gray-800/80 hover:bg-gray-700/80 border-gray-600/50";
      case "balloon": return "bg-pink-950/50 hover:bg-pink-900/50 border-pink-500/30";
      case "gold": return "bg-yellow-950/50 hover:bg-yellow-900/50 border-yellow-500/30";
      case "thunder": return "bg-blue-950/50 hover:bg-blue-900/50 border-yellow-500/30";
      case "colors": return "bg-gradient-to-br from-red-950/30 to-blue-950/30 hover:from-red-900/40 hover:to-blue-900/40 border-muted-foreground/30";
      default: return "bg-card/80 hover:border-primary/50";
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-6`}>{theme.description}</p>

      <div className={`grid ${getGridCols(boxCount)} gap-3 mb-4`}>
        {boxes.map((box, i) => (
          <motion.div key={i} whileHover={state === "playing" && !revealed[i] ? { scale: 1.05 } : {}} whileTap={state === "playing" && !revealed[i] ? { scale: 0.95 } : {}}>
            <Card className={`p-4 sm:p-6 text-center cursor-pointer transition-all ${getBoxStyle(revealed[i])}`}
              onClick={() => reveal(i)}>
              {revealed[i] ? (
                <motion.div initial={{ rotateY: 90, scale: 0 }} animate={{ rotateY: 0, scale: 1 }}>
                  <p className={`text-2xl font-bold ${theme.accentColor}`}>{box}</p>
                </motion.div>
              ) : (
                <motion.p
                  className="text-3xl"
                  animate={state === "playing" ? { rotate: [0, 5, -5, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                >
                  {boxIcons[i % boxIcons.length]}
                </motion.p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {state === "playing" && (
        <p className="text-center text-sm text-muted-foreground mb-4">
          Pick {pickCount - revealCount} more {pickCount - revealCount !== 1 ? "items" : "item"}
        </p>
      )}

      {result && <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className={`text-xl font-bold text-center mb-4 ${theme.accentColor}`}>{result}</motion.div>}

      {state !== "playing" && (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default InstantEngine;
