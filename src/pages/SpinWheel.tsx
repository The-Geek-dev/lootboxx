import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDepositGate } from "@/hooks/useDepositGate";
import ActivationGate from "@/components/ActivationGate";
import GamePageLayout from "@/components/GamePageLayout";

const SEGMENTS = [
  { label: "₦500", value: 500, color: "#8B5CF6" },
  { label: "₦100", value: 100, color: "#06B6D4" },
  { label: "₦1,000", value: 1000, color: "#EC4899" },
  { label: "₦50", value: 50, color: "#10B981" },
  { label: "₦2,000", value: 2000, color: "#F59E0B" },
  { label: "₦0", value: 0, color: "#6B7280" },
  { label: "₦200", value: 200, color: "#3B82F6" },
  { label: "₦5,000", value: 5000, color: "#EF4444" },
];

const SPIN_COST = 20;

const SpinWheel = () => {
  const { isAuthorized, isChecking, needsActivation, activationReason } = useDepositGate();
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { drawWheel(); }, []);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 10;
    const segAngle = (2 * Math.PI) / SEGMENTS.length;
    ctx.clearRect(0, 0, size, size);
    SEGMENTS.forEach((seg, i) => {
      const startAngle = i * segAngle;
      const endAngle = startAngle + segAngle;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.fillStyle = seg.color;
      ctx.fill();
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Inter";
      ctx.fillText(seg.label, radius - 20, 5);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, 2 * Math.PI);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();
    ctx.strokeStyle = "#5ee7df";
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  const spin = async () => {
    if (isSpinning) return;
    if (xpLives <= 0) {
      toast({ title: "No XP lives left! ⚡", description: "Wait for refill or buy with points.", variant: "destructive" });
      return;
    }
    if (points < SPIN_COST) {
      toast({ title: "Insufficient points", description: `You need ${SPIN_COST} points to spin.`, variant: "destructive" });
      return;
    }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    setIsSpinning(true);
    setResult(null);
    await spendPoints(SPIN_COST);
    const winIndex = Math.floor(Math.random() * SEGMENTS.length);
    const segAngle = 360 / SEGMENTS.length;
    const targetAngle = 360 - (winIndex * segAngle + segAngle / 2);
    const spins = 5 + Math.random() * 3;
    const finalRotation = rotation + spins * 360 + targetAngle;
    setRotation(finalRotation);
    setTimeout(async () => {
      let prize = SEGMENTS[winIndex].value;
      if (prize > 0) {
        prize = adjustWinAmount(prize);
        if (canFullyWin() && SEGMENTS[winIndex].value >= 1000) recordFullWin();
      }
      if (prize > 0) await updateBalance(prize);
      await recordGameResult("spin_wheel", SPIN_COST, prize, { segment: SEGMENTS[winIndex].label, index: winIndex });
      setResult(prize > 0 ? `🎉 You won ₦${prize.toLocaleString()}!` : "Better luck next time!");
      setIsSpinning(false);
    }, 4000);
  };

  if (!isAuthorized || isChecking) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    </div>
  );

  return (
    <GamePageLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
          Spin the <span className="text-gradient">Wheel</span>
        </h1>
        <p className="text-muted-foreground text-center mb-6">Cost: {SPIN_COST} points per spin</p>

        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-primary" />
            </div>
            <motion.div animate={{ rotate: rotation }} transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}>
              <canvas ref={canvasRef} width={300} height={300} className="rounded-full" />
            </motion.div>
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-xl font-bold text-center">
              {result}
            </motion.div>
          )}

          <Button className="button-gradient px-8 py-3 text-lg w-full max-w-md" onClick={spin} disabled={isSpinning || xpLives <= 0}>
            {isSpinning ? "Spinning..." : xpLives <= 0 ? "No XP Lives" : `Spin (${SPIN_COST} pts)`}
          </Button>
        </div>
      </motion.div>
    </GamePageLayout>
  );
};

export default SpinWheel;
