import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, CheckCircle, XCircle } from "lucide-react";
import { useDepositGate } from "@/hooks/useDepositGate";

const QUESTIONS = [
  { q: "What is the capital of Nigeria?", options: ["Lagos", "Abuja", "Kano", "Port Harcourt"], answer: 1 },
  { q: "Which planet is known as the Red Planet?", options: ["Venus", "Jupiter", "Mars", "Saturn"], answer: 2 },
  { q: "What year did Nigeria gain independence?", options: ["1957", "1960", "1963", "1955"], answer: 1 },
  { q: "How many continents are there?", options: ["5", "6", "7", "8"], answer: 2 },
  { q: "What is the largest ocean?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3 },
  { q: "Who painted the Mona Lisa?", options: ["Picasso", "Da Vinci", "Van Gogh", "Michelangelo"], answer: 1 },
  { q: "What is H2O commonly known as?", options: ["Oxygen", "Hydrogen", "Water", "Carbon"], answer: 2 },
  { q: "How many states are in Nigeria?", options: ["30", "33", "36", "39"], answer: 2 },
  { q: "Which element has the symbol 'Au'?", options: ["Silver", "Gold", "Aluminum", "Argon"], answer: 1 },
  { q: "What is the fastest land animal?", options: ["Lion", "Cheetah", "Horse", "Leopard"], answer: 1 },
];

const ENTRY_FEE = 150;
const REWARD_PER_CORRECT = 50;
const BONUS_ALL_CORRECT = 500;

const TriviaQuiz = () => {
  const navigate = useNavigate();
  const { isAuthorized } = useDepositGate();
  const { balance, updateBalance, recordGameResult } = useWallet();
  const { toast } = useToast();
  const [gameState, setGameState] = useState<"idle" | "playing" | "finished">("idle");
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState(QUESTIONS);


  const startGame = async () => {
    if (balance < ENTRY_FEE) {
      toast({ title: "Insufficient balance", description: `You need ₦${ENTRY_FEE} to play.`, variant: "destructive" });
      return;
    }
    await updateBalance(-ENTRY_FEE);
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 5);
    setShuffledQuestions(shuffled);
    setGameState("playing");
    setCurrentQ(0);
    setScore(0);
    setSelected(null);
    setShowAnswer(false);
  };

  const selectAnswer = (index: number) => {
    if (showAnswer) return;
    setSelected(index);
    setShowAnswer(true);
    if (index === shuffledQuestions[currentQ].answer) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = async () => {
    if (currentQ < shuffledQuestions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setShowAnswer(false);
    } else {
      // Game over
      const correctCount = score + (selected === shuffledQuestions[currentQ].answer ? 1 : 0);
      // Recalculate since state might not have updated
      const finalScore = selected === shuffledQuestions[currentQ].answer ? score + 1 : score;
      const reward = finalScore * REWARD_PER_CORRECT + (finalScore === shuffledQuestions.length ? BONUS_ALL_CORRECT : 0);
      if (reward > 0) {
        await updateBalance(reward);
      }
      await recordGameResult("trivia", ENTRY_FEE, reward, { score: finalScore, total: shuffledQuestions.length });
      setGameState("finished");
      setScore(finalScore);
    }
  };

  if (!isAuthorized) return null;

  const question = shuffledQuestions[currentQ];
  const totalReward = score * REWARD_PER_CORRECT + (score === shuffledQuestions.length ? BONUS_ALL_CORRECT : 0);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container px-4 pt-32 pb-16 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
            Trivia <span className="text-gradient">Quiz</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8">Answer correctly to win rewards!</p>

          <Card className="p-4 bg-card/50 backdrop-blur-sm mb-6">
            <p className="text-center text-sm text-muted-foreground mb-1">Your Balance</p>
            <p className="text-center text-2xl font-bold text-primary">₦{balance.toLocaleString()}</p>
          </Card>

          {gameState === "idle" && (
            <Card className="p-8 text-center bg-card/50">
              <Brain className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Ready to test your knowledge?</h2>
              <p className="text-muted-foreground mb-2">5 questions • ₦{REWARD_PER_CORRECT} per correct answer</p>
              <p className="text-muted-foreground mb-6">Get all 5 correct for a ₦{BONUS_ALL_CORRECT} bonus!</p>
              <Button className="button-gradient" onClick={startGame}>
                Start Quiz (₦{ENTRY_FEE})
              </Button>
            </Card>
          )}

          {gameState === "playing" && (
            <Card className="p-6 bg-card/50">
              <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                <span>Question {currentQ + 1}/{shuffledQuestions.length}</span>
                <span>Score: {score}</span>
              </div>
              <h2 className="text-lg font-semibold mb-6">{question.q}</h2>
              <div className="space-y-3">
                {question.options.map((opt, i) => {
                  let borderClass = "border-border";
                  if (showAnswer) {
                    if (i === question.answer) borderClass = "border-green-500 bg-green-500/10";
                    else if (i === selected) borderClass = "border-red-500 bg-red-500/10";
                  } else if (i === selected) {
                    borderClass = "border-primary";
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => selectAnswer(i)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${borderClass} ${!showAnswer ? "hover:border-primary/50" : ""}`}
                      disabled={showAnswer}
                    >
                      <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                      {showAnswer && i === question.answer && <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />}
                      {showAnswer && i === selected && i !== question.answer && <XCircle className="w-5 h-5 text-red-500 ml-auto" />}
                    </button>
                  );
                })}
              </div>
              {showAnswer && (
                <Button className="button-gradient w-full mt-6" onClick={nextQuestion}>
                  {currentQ < shuffledQuestions.length - 1 ? "Next Question" : "See Results"}
                </Button>
              )}
            </Card>
          )}

          {gameState === "finished" && (
            <Card className="p-8 text-center bg-card/50">
              <h2 className="text-2xl font-bold mb-2">Quiz Complete!</h2>
              <p className="text-4xl font-bold text-primary my-4">{score}/{shuffledQuestions.length}</p>
              {totalReward > 0 ? (
                <p className="text-lg text-green-400 mb-6">🎉 You earned ₦{totalReward.toLocaleString()}!</p>
              ) : (
                <p className="text-lg text-muted-foreground mb-6">Better luck next time!</p>
              )}
              <Button className="button-gradient" onClick={() => setGameState("idle")}>
                Play Again
              </Button>
            </Card>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default TriviaQuiz;
