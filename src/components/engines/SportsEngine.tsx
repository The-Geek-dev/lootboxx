import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
const DEFAULT_THEME: GameTheme = { bgGradient: 'from-purple-900 to-black', accentColor: 'text-purple-400', description: '', variant: 'classic' };
import { GameTheme } from "@/config/gameThemes";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  teams?: [{ icon: string; label: string }, { icon: string; label: string }];
}

const SportsEngine = ({ gameId, name, emoji, pointCost, theme, teams }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const OUTCOMES = teams || [{ icon: "\u{1F3E0}", label: "Home" }, { icon: "\u{1F3C3}", label: "Away" }];
  const [bet, setBet] = useState<0 | 1 | null>(null);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [result, setResult] = useState<string | null>(null);
  const [scores, setScores] = useState([0, 0]);
  const [animating, setAnimating] = useState(false);

  const getScoreLabel = () => {
    switch (theme.variant) {
      case "boxing": return "Rounds";
      case "racing": return "Laps";
      case "swimming": return "Lengths";
      case "archery": return "Points";
      default: return "Score";
    }
  };

  const play = async () => {
    if (bet === null) { toast({ title: "Pick a side!", variant: "destructive" }); return; }
    if (xpLives <= 0) { toast({ title: "No XP lives! \u26A1", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setState("playing");
    setResult(null);
    setAnimating(true);

    let s1 = 0, s2 = 0;
    const rounds = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < rounds; i++) {
      await new Promise((r) => setTimeout(r, 400));
      if (Math.random() > 0.5) s1++;
      else s2++;
      setScores([s1, s2]);
    }

    setAnimating(false);
    const winner = s1 > s2 ? 0 : s2 > s1 ? 1 : -1;
    const won = winner === bet;
    const isDraw = winner === -1;

    let winnings = 0;
    if (won) {
      winnings = Math.abs(s1 - s2) >= 3 ? 3000 : Math.abs(s1 - s2) >= 2 ? 1500 : 800;
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && winnings >= 1500) recordFullWin();
      await updateBalance(winnings);
    } else if (isDraw) {
      winnings = Math.floor(pointCost * 5);
      winnings = adjustWinAmount(winnings);
      await updateBalance(winnings);
    }

    setResult(won ? `\u{1F389} ${OUTCOMES[bet].label} wins! You won \u20A6${winnings.toLocaleString()}!` : isDraw ? `\u{1F91D} Draw! Partial refund \u20A6${winnings.toLocaleString()}` : `${OUTCOMES[winner as 0 | 1].label} wins. Better luck next time!`);
    await recordGameResult(gameId, pointCost, winnings, { scores: [s1, s2], bet, winner });
    setState("done");
  };

  const reset = () => {
    setBet(null);
    setState("idle");
    setResult(null);
    setScores([0, 0]);
  };

  const getTeamGradient = (index: number) => {
    if (index === 0) return "from-blue-500/20 to-blue-600/10";
    return "from-red-500/20 to-red-600/10";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-6`}>{theme.description}</p>

      <Card className={`p-6 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 mb-4 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-5 text-9xl flex items-center justify-center pointer-events-none">{emoji}</div>

        {state === "playing" && (
          <motion.p
            className={`text-center text-xs ${theme.accentColor} mb-4`}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            {getScoreLabel()} updating...
          </motion.p>
        )}

        <div className="flex items-center justify-between relative">
          <div className={`text-center flex-1 p-3 rounded-lg bg-gradient-to-b ${getTeamGradient(0)}`}>
            <motion.div className="text-4xl mb-2"
              animate={animating ? { y: [0, -8, 0], rotate: [0, -5, 5, 0] } : {}}
              transition={{ repeat: animating ? Infinity : 0, duration: 0.4 }}>
              {OUTCOMES[0].icon}
            </motion.div>
            <p className="font-semibold text-sm">{OUTCOMES[0].label}</p>
            <motion.p
              className={`text-3xl font-mono font-bold mt-2 ${theme.accentColor}`}
              animate={animating ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: animating ? Infinity : 0, duration: 0.3 }}
            >
              {scores[0]}
            </motion.p>
          </div>

          <div className="px-4 flex flex-col items-center">
            <span className="text-2xl font-bold text-muted-foreground">VS</span>
            {state === "playing" && (
              <motion.span
                className="text-xs text-muted-foreground mt-1"
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                LIVE
              </motion.span>
            )}
          </div>

          <div className={`text-center flex-1 p-3 rounded-lg bg-gradient-to-b ${getTeamGradient(1)}`}>
            <motion.div className="text-4xl mb-2"
              animate={animating ? { y: [0, -8, 0], rotate: [0, 5, -5, 0] } : {}}
              transition={{ repeat: animating ? Infinity : 0, duration: 0.4, delay: 0.15 }}>
              {OUTCOMES[1].icon}
            </motion.div>
            <p className="font-semibold text-sm">{OUTCOMES[1].label}</p>
            <motion.p
              className={`text-3xl font-mono font-bold mt-2 ${theme.accentColor}`}
              animate={animating ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: animating ? Infinity : 0, duration: 0.3, delay: 0.1 }}
            >
              {scores[1]}
            </motion.p>
          </div>
        </div>
      </Card>

      {state === "idle" && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {OUTCOMES.map((o, i) => (
            <Button key={i} variant={bet === i ? "default" : "outline"}
              className={`py-6 text-lg ${bet === i ? `ring-2 ring-primary bg-gradient-to-r ${getTeamGradient(i)}` : ""}`}
              onClick={() => setBet(i as 0 | 1)}>
              {o.icon} {o.label}
            </Button>
          ))}
        </div>
      )}

      {result && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`text-lg font-bold text-center mb-4 ${theme.accentColor}`}>{result}</motion.div>}

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
