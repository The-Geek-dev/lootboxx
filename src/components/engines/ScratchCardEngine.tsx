import { useState, useRef, useEffect, useCallback } from "react";
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
  prizes?: string[];
}

const DEFAULT_THEME: GameTheme = { bgGradient: "from-yellow-950 to-amber-950", accentColor: "text-yellow-400", description: "Scratch to reveal your prize!", variant: "classic" };

const DEFAULT_PRIZES = ["💎x5", "⭐x3", "🍒x2", "💰x10", "🎯x4", "🔥x2", "👑x8", "💫x1", "🌟x3"];

const ScratchCardEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME, prizes = DEFAULT_PRIZES }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"idle" | "scratching" | "revealed">("idle");
  const [grid, setGrid] = useState<string[]>([]);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const scratchedPixels = useRef(new Set<string>());

  const COLS = 3;
  const ROWS = 3;
  const CELL_W = 90;
  const CELL_H = 70;
  const W = COLS * CELL_W;
  const H = ROWS * CELL_H;

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;

    // Draw scratch overlay
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, "#6b7280");
    gradient.addColorStop(0.5, "#9ca3af");
    gradient.addColorStop(1, "#6b7280");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    // Add texture
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    for (let i = 0; i < 200; i++) {
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }

    // Text
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH HERE ✨", W / 2, H / 2);

    scratchedPixels.current = new Set();
    setScratchPercent(0);
  }, [W, H]);

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const radius = 20;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Track scratched area
    const key = `${Math.floor(x / 10)},${Math.floor(y / 10)}`;
    scratchedPixels.current.add(key);
    const totalCells = Math.ceil(W / 10) * Math.ceil(H / 10);
    const pct = Math.min(100, (scratchedPixels.current.size / totalCells) * 100);
    setScratchPercent(pct);

    if (pct >= 60 && state === "scratching") {
      revealAll();
    }
  }, [W, H, state]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => { setIsDrawing(true); const p = getPos(e); scratch(p.x, p.y); };
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => { if (!isDrawing) return; e.preventDefault(); const p = getPos(e); scratch(p.x, p.y); };
  const handleEnd = () => setIsDrawing(false);

  const revealAll = async () => {
    setState("revealed");
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) { ctx.clearRect(0, 0, W, H); }
    }

    // Check matches
    const counts: Record<string, number> = {};
    grid.forEach(p => { counts[p] = (counts[p] || 0) + 1; });
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const matchCount = best[1];
    const symbol = best[0];

    let winnings = 0;
    if (matchCount >= 3) {
      const multiplier = matchCount === 3 ? 3 : matchCount === 4 ? 5 : 10;
      winnings = Math.floor(pointCost * multiplier * 2);
      winnings = adjustWinAmount(winnings);
      if (winnings > 0 && canFullyWin() && multiplier >= 5) recordFullWin();
      if (winnings > 0) await updateBalance(winnings);
      setResult(`🎉 ${matchCount}x ${symbol}! Won ₦${winnings.toLocaleString()}`);
    } else {
      setResult("No match this time! Try again 🍀");
    }
    await recordGameResult(gameId, pointCost, winnings, { grid, matchCount, symbol: best[0] });
  };

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);

    // Generate grid with chance of matches
    const newGrid: string[] = [];
    const guaranteeSymbol = prizes[Math.floor(Math.random() * prizes.length)];
    for (let i = 0; i < ROWS * COLS; i++) {
      if (Math.random() < 0.35) {
        newGrid.push(guaranteeSymbol);
      } else {
        newGrid.push(prizes[Math.floor(Math.random() * prizes.length)]);
      }
    }
    setGrid(newGrid);
    setState("scratching");
    setResult(null);

    setTimeout(() => initCanvas(), 50);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-4`}>{theme.description}</p>

      {state !== "idle" && (
        <Card className={`p-4 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 mb-4`}>
          <div className="relative mx-auto" style={{ width: W, maxWidth: "100%" }}>
            {/* Prize grid underneath */}
            <div className="grid grid-cols-3 gap-0" style={{ width: W, height: H }}>
              {grid.map((prize, i) => (
                <div key={i} className="flex items-center justify-center text-lg font-bold border border-border/20 bg-card/40" style={{ width: CELL_W, height: CELL_H }}>
                  {prize}
                </div>
              ))}
            </div>

            {/* Scratch overlay canvas */}
            {state === "scratching" && (
              <canvas
                ref={canvasRef}
                className="absolute inset-0 cursor-pointer touch-none"
                style={{ width: W, height: H }}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
              />
            )}
          </div>

          {state === "scratching" && (
            <div className="mt-3">
              <div className="h-1.5 bg-card/30 rounded-full overflow-hidden">
                <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${scratchPercent}%` }} />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-1">Scratch 60% to reveal • {Math.round(scratchPercent)}%</p>
            </div>
          )}
        </Card>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className={`text-lg font-bold text-center mb-4 ${result.includes("Won") ? theme.accentColor : "text-muted-foreground"}`}>
          {result}
        </motion.div>
      )}

      {state !== "scratching" && (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `${state === "idle" ? "Play" : "Play Again"} (${pointCost} pts)`}
        </Button>
      )}
    </motion.div>
  );
};

export default ScratchCardEngine;
