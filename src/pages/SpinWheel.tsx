import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDepositGate } from "@/hooks/useDepositGate";

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

const SPIN_COST = 200;

const SpinWheel = () => {
  const navigate = useNavigate();
  const { isAuthorized, isChecking } = useDepositGate();
  const { balance, updateBalance, recordGameResult } = useWallet();
  const { toast } = useToast();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawWheel();
  }, []);

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

      // Text
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Inter";
      ctx.fillText(seg.label, radius - 20, 5);
      ctx.restore();
    });

    // Center circle
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
    if (balance < SPIN_COST) {
      toast({ title: "Insufficient balance", description: `You need ₦${SPIN_COST} to spin. Please deposit funds.`, variant: "destructive" });
      return;
    }

    setIsSpinning(true);
    setResult(null);

    const success = await updateBalance(-SPIN_COST);
    if (!success) {
      setIsSpinning(false);
      return;
    }

    const winIndex = Math.floor(Math.random() * SEGMENTS.length);
    const segAngle = 360 / SEGMENTS.length;
    const targetAngle = 360 - (winIndex * segAngle + segAngle / 2);
    const spins = 5 + Math.random() * 3;
    const finalRotation = rotation + spins * 360 + targetAngle;

    setRotation(finalRotation);

    setTimeout(async () => {
      const prize = SEGMENTS[winIndex];
      if (prize.value > 0) {
        await updateBalance(prize.value);
      }
      await recordGameResult("spin_wheel", SPIN_COST, prize.value, { segment: prize.label, index: winIndex });
      setResult(prize.value > 0 ? `🎉 You won ${prize.label}!` : "Better luck next time!");
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
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container px-4 pt-32 pb-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2">
            Spin the <span className="text-gradient">Wheel</span>
          </h1>
          <p className="text-muted-foreground text-center mb-8">Cost: ₦{SPIN_COST} per spin</p>

          <div className="flex flex-col items-center gap-6">
            <Card className="p-4 bg-card/50 backdrop-blur-sm">
              <p className="text-center text-sm text-muted-foreground mb-1">Your Balance</p>
              <p className="text-center text-2xl font-bold text-primary">₦{balance.toLocaleString()}</p>
            </Card>

            {/* Wheel */}
            <div className="relative">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[24px] border-l-transparent border-r-transparent border-t-primary" />
              </div>
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
              >
                <canvas ref={canvasRef} width={320} height={320} className="rounded-full" />
              </motion.div>
            </div>

            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-xl font-bold text-center"
              >
                {result}
              </motion.div>
            )}

            <Button
              className="button-gradient px-8 py-3 text-lg"
              onClick={spin}
              disabled={isSpinning}
            >
              {isSpinning ? "Spinning..." : `Spin (₦${SPIN_COST})`}
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default SpinWheel;
