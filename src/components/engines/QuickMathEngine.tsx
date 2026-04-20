import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { GameTheme } from "@/config/gameThemes";
import { useGameSounds } from "@/hooks/useGameSounds";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  mode?: "math" | "word" | "color" | "sequence";
  duration?: number;
}

const DEFAULT_THEME: GameTheme = { bgGradient: "from-blue-950 to-black", accentColor: "text-blue-400", description: "Think fast!", variant: "classic" };

const COLORS = [
  { name: "Red", hex: "bg-red-500" },
  { name: "Blue", hex: "bg-blue-500" },
  { name: "Green", hex: "bg-green-500" },
  { name: "Yellow", hex: "bg-yellow-500" },
  { name: "Purple", hex: "bg-purple-500" },
  { name: "Orange", hex: "bg-orange-500" },
];

const WORDS = ["PLAY", "GAME", "LUCK", "CASH", "GOLD", "STAR", "SPIN", "DICE", "CARD", "COIN", "FIRE", "KING"];

interface Question {
  prompt: string;
  answer: string;
  options: string[];
  displayClass?: string;
}

const generateMathQ = (): Question => {
  const ops = ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, ans: number;
  switch (op) {
    case "+": a = Math.floor(Math.random() * 50) + 1; b = Math.floor(Math.random() * 50) + 1; ans = a + b; break;
    case "-": a = Math.floor(Math.random() * 50) + 10; b = Math.floor(Math.random() * a); ans = a - b; break;
    default: a = Math.floor(Math.random() * 12) + 1; b = Math.floor(Math.random() * 12) + 1; ans = a * b; break;
  }
  const options = generateOptions(ans);
  return { prompt: `${a} ${op} ${b} = ?`, answer: String(ans), options };
};

const generateWordQ = (): Question => {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const scrambled = word.split("").sort(() => Math.random() - 0.5).join("");
  const options = [word, ...WORDS.filter(w => w !== word).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
  return { prompt: `Unscramble: ${scrambled}`, answer: word, options };
};

const generateColorQ = (): Question => {
  const actual = COLORS[Math.floor(Math.random() * COLORS.length)];
  const display = COLORS[Math.floor(Math.random() * COLORS.length)];
  const options = COLORS.map(c => c.name).sort(() => Math.random() - 0.5);
  return { prompt: `What COLOR is shown?`, answer: actual.name, options, displayClass: actual.hex };
};

const generateOptions = (correct: number): string[] => {
  const opts = new Set<string>([String(correct)]);
  while (opts.size < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    if (offset !== 0) opts.add(String(correct + offset));
  }
  return Array.from(opts).sort(() => Math.random() - 0.5);
};

const QuickMathEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME, mode = "math", duration = 30 }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [question, setQuestion] = useState<Question | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [state, setState] = useState<"idle" | "playing" | "done">("idle");
  const [timeLeft, setTimeLeft] = useState(duration);
  const [result, setResult] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const timerRef = useRef<number | null>(null);
  const scoreRef = useRef(0);

  const nextQuestion = () => {
    switch (mode) {
      case "word": return generateWordQ();
      case "color": return generateColorQ();
      default: return generateMathQ();
    }
  };

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    setScore(0);
    scoreRef.current = 0;
    setStreak(0);
    setTimeLeft(duration);
    setQuestionsAnswered(0);
    setQuestion(nextQuestion());
    setState("playing");
    setResult(null);
    setFeedback(null);
  };

  useEffect(() => {
    if (state !== "playing") return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => { if (t <= 1) return 0; return t - 1; });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state]);

  useEffect(() => {
    if (timeLeft === 0 && state === "playing") endGame();
  }, [timeLeft, state]);

  const answer = (opt: string) => {
    if (state !== "playing" || !question) return;
    const correct = opt === question.answer;
    setFeedback(correct ? "correct" : "wrong");
    setQuestionsAnswered(q => q + 1);

    if (correct) {
      const bonus = streak >= 5 ? 20 : streak >= 3 ? 15 : 10;
      scoreRef.current += bonus;
      setScore(scoreRef.current);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setTimeout(() => {
      setFeedback(null);
      setQuestion(nextQuestion());
    }, 400);
  };

  const endGame = async () => {
    setState("done");
    if (timerRef.current) clearInterval(timerRef.current);
    const finalScore = scoreRef.current;
    let winnings = getTierPayout(finalScore, QUICK_MATH_TIERS);
    if (winnings > 0) {
      winnings = adjustWinAmount(winnings);
      if (canFullyWin() && finalScore >= 150) recordFullWin();
      await updateBalance(winnings);
    }
    if (winnings > 0) play("win"); else play("lose");
    setResult(winnings > 0 ? `🎉 Score: ${finalScore}! Won ₦${winnings.toLocaleString()}!` : `Score: ${finalScore}. Keep practicing!`);
    await recordGameResult(gameId, pointCost, winnings, { score: finalScore, questionsAnswered, mode });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-4`}>{theme.description}</p>

      {state === "playing" && (
        <div className="flex justify-between items-center mb-3">
          <span className={`font-bold ${theme.accentColor}`}>Score: {score}</span>
          <span className="text-muted-foreground">🔥 x{streak}</span>
          <span className={`font-bold ${timeLeft <= 5 ? "text-destructive animate-pulse" : "text-muted-foreground"}`}>⏱ {timeLeft}s</span>
        </div>
      )}

      {state === "playing" && question && (
        <Card className={`p-6 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 mb-4 ${
          feedback === "correct" ? "ring-2 ring-green-400" : feedback === "wrong" ? "ring-2 ring-red-400" : ""
        }`}>
          {question.displayClass && (
            <div className={`w-20 h-20 mx-auto rounded-xl mb-4 ${question.displayClass}`} />
          )}
          <p className="text-2xl sm:text-3xl font-bold text-center mb-6 text-foreground">{question.prompt}</p>
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((opt, i) => (
              <motion.div key={`${opt}-${i}`} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="w-full py-4 text-lg font-bold hover:bg-primary/20"
                  onClick={() => answer(opt)}
                >
                  {opt}
                </Button>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {state === "idle" && (
        <Card className={`p-8 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 mb-4 text-center`}>
          <p className="text-6xl mb-4">{emoji}</p>
          <p className="text-muted-foreground">
            {mode === "math" ? "Solve math problems as fast as you can!" :
             mode === "word" ? "Unscramble words before time runs out!" :
             mode === "color" ? "Identify colors quickly!" : "Answer questions fast!"}
          </p>
        </Card>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className={`text-lg font-bold text-center mb-4 ${theme.accentColor}`}>{result}</motion.div>
      )}

      {state !== "playing" && (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default QuickMathEngine;
