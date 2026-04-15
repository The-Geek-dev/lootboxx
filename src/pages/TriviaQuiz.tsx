import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { Brain, CheckCircle, XCircle, Clock } from "lucide-react";
import { useDepositGate } from "@/hooks/useDepositGate";
import GamePageLayout from "@/components/GamePageLayout";
import { pickUniqueQuestions, markSeen, TriviaQuestion } from "@/config/triviaQuestions";

const ENTRY_FEE = 20;
const REWARD_PER_CORRECT = 50;
const BONUS_ALL_CORRECT = 500;
const QUESTION_COUNT = 5;
const TIME_PER_QUESTION = 6;

const TriviaQuiz = () => {
  const { isAuthorized, isChecking } = useDepositGate();
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [finalReward, setFinalReward] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startTimer = () => {
    clearTimer();
    setTimeLeft(TIME_PER_QUESTION);
    timerRef.current = window.setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) return 0;
        return t - 1;
      });
    }, 1000);
  };

  // Handle time running out
  useEffect(() => {
    if (timeLeft === 0 && gameState === "playing" && !showAnswer) {
      // Time's up — treat as wrong answer
      clearTimer();
      setShowAnswer(true);
    }
  }, [timeLeft, gameState, showAnswer]);

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives left! ⚡", description: "Wait for refill or buy with points.", variant: "destructive" }); return; }
    if (points < ENTRY_FEE) { toast({ title: "Insufficient points", description: `You need ${ENTRY_FEE} points to play.`, variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(ENTRY_FEE);
    const picked = pickUniqueQuestions(QUESTION_COUNT);
    setQuestions(picked);
    setGameState("playing");
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
    startTimer();
  };

  const selectAnswer = (index: number) => {
    if (showAnswer) return;
    clearTimer();
    setSelected(index);
    setShowAnswer(true);
    if (index === questions[currentQ].answer) setScore(s => s + 1);
  };

  const nextQuestion = async () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelected(null);
      setShowAnswer(false);
      startTimer();
    } else {
      clearTimer();
      const correctOnCurrent = selected === questions[currentQ].answer ? 1 : 0;
      const finalScore = score + (showAnswer && selected === null ? 0 : 0); // score already updated in selectAnswer
      // Mark questions as seen
      markSeen(questions.map(q => q.id));
      let reward = score * REWARD_PER_CORRECT + (score === questions.length ? BONUS_ALL_CORRECT : 0);
      reward = adjustWinAmount(reward);
      if (reward > 0 && canFullyWin() && score === questions.length) recordFullWin();
      if (reward > 0) await updateBalance(reward);
      await recordGameResult("trivia", ENTRY_FEE, reward, { score, total: questions.length });
      setFinalReward(reward);
      setGameState("finished");
    }
  };

  if (!isAuthorized || isChecking) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    </div>
  );

  const question = questions[currentQ];
  const timerPct = (timeLeft / TIME_PER_QUESTION) * 100;

  return (
    <GamePageLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
          Trivia <span className="text-gradient">Quiz</span>
        </h1>
        <p className="text-muted-foreground text-center mb-6">Answer correctly to win rewards!</p>

        {gameState === "idle" && (
          <Card className="p-8 text-center bg-card/50">
            <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Ready to test your knowledge?</h2>
            <p className="text-muted-foreground mb-1">{QUESTION_COUNT} questions • {TIME_PER_QUESTION}s per question</p>
            <p className="text-muted-foreground mb-2">₦{REWARD_PER_CORRECT} per correct answer</p>
            <p className="text-muted-foreground mb-6">Get all {QUESTION_COUNT} correct for a ₦{BONUS_ALL_CORRECT} bonus!</p>
            <Button className="button-gradient" onClick={startGame} disabled={xpLives <= 0}>
              {xpLives <= 0 ? "No XP Lives" : `Start Quiz (${ENTRY_FEE} pts)`}
            </Button>
          </Card>
        )}

        {gameState === "playing" && question && (
          <Card className="p-6 bg-card/50">
            {/* Timer bar */}
            <div className="relative w-full h-2 rounded-full bg-muted mb-4 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${timeLeft <= 2 ? "bg-destructive" : timeLeft <= 4 ? "bg-yellow-500" : "bg-green-500"}`}
                initial={false}
                animate={{ width: `${timerPct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
              <span>Q {currentQ + 1}/{questions.length}</span>
              <span className="flex items-center gap-1">
                <Clock className={`w-4 h-4 ${timeLeft <= 2 ? "text-destructive animate-pulse" : ""}`} />
                <span className={`font-bold ${timeLeft <= 2 ? "text-destructive" : ""}`}>{timeLeft}s</span>
              </span>
              <span>Score: {score}</span>
            </div>

            <h2 className="text-lg font-semibold mb-6">{question.q}</h2>

            <div className="space-y-3">
              {question.options.map((opt, i) => {
                let borderClass = "border-border";
                if (showAnswer) {
                  if (i === question.answer) borderClass = "border-green-500 bg-green-500/10";
                  else if (i === selected) borderClass = "border-destructive bg-destructive/10";
                } else if (i === selected) { borderClass = "border-primary"; }
                return (
                  <button key={i} onClick={() => selectAnswer(i)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${borderClass} ${!showAnswer ? "hover:border-primary/50" : ""}`}
                    disabled={showAnswer}>
                    <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">{String.fromCharCode(65 + i)}</span>
                    <span>{opt}</span>
                    {showAnswer && i === question.answer && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
                    {showAnswer && i === selected && i !== question.answer && <XCircle className="w-5 h-5 text-destructive ml-auto" />}
                  </button>
                );
              })}
            </div>

            {showAnswer && selected === null && (
              <p className="text-destructive text-center mt-3 font-semibold">⏱ Time's up!</p>
            )}

            {showAnswer && (
              <Button className="button-gradient w-full mt-6" onClick={nextQuestion}>
                {currentQ < questions.length - 1 ? "Next Question" : "See Results"}
              </Button>
            )}
          </Card>
        )}

        {gameState === "finished" && (
          <Card className="p-8 text-center bg-card/50">
            <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
            <p className="text-4xl font-bold text-primary my-4">{score}/{questions.length}</p>
            {finalReward > 0 ? (
              <p className="text-lg text-green-400 mb-6">🎉 You earned ₦{finalReward.toLocaleString()}!</p>
            ) : (
              <p className="text-lg text-muted-foreground mb-6">Better luck next time!</p>
            )}
            <Button className="button-gradient" onClick={() => setGameState("idle")}>Play Again</Button>
          </Card>
        )}
      </motion.div>
    </GamePageLayout>
  );
};

export default TriviaQuiz;
