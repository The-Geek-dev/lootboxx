import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { useGameSounds } from "@/hooks/useGameSounds";
import { GameTheme } from "@/config/gameThemes";
import { SLOT_CONFIGS, SlotConfig } from "@/config/engineConfig";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  symbols?: string[];
  theme?: GameTheme;
}

const DEFAULT_SYMBOLS = ["🍒", "🍋", "🔔", "⭐", "💎", "7️⃣"];
const DEFAULT_THEME: GameTheme = { bgGradient: 'from-purple-900 to-black', accentColor: 'purple', description: 'Spin to win!', variant: 'classic' };

const SlotsEngine = ({ gameId, name, emoji, pointCost, symbols = DEFAULT_SYMBOLS, theme = DEFAULT_THEME }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const config: SlotConfig = SLOT_CONFIGS[gameId] || { reelCount: 3, hasWild: false, hasBonus: false, spinStyle: "classic" };
  const reelCount = config.reelCount;

  const [reels, setReels] = useState(symbols.slice(0, reelCount));
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastWin, setLastWin] = useState(false);
  const [bonusActive, setBonusActive] = useState(false);
  const [bonusSpinsLeft, setBonusSpinsLeft] = useState(0);
  const [bonusWinnings, setBonusWinnings] = useState(0);
  const [wildPositions, setWildPositions] = useState<number[]>([]);
  const [multiplier, setMultiplier] = useState(1);
  const [showPaytable, setShowPaytable] = useState(false);

  const payoutMultipliers = [5000, 3000, 1500, 1000, 500, 300];

  const resolveReels = useCallback((finalReels: string[]): { payout: number; isJackpot: boolean; wilds: number[] } => {
    const wilds: number[] = [];
    const wildSymbol = "🃏";
    
    // Check for wilds
    if (config.hasWild) {
      finalReels.forEach((s, i) => { if (s === wildSymbol) wilds.push(i); });
    }

    // Replace wilds with most common non-wild symbol for matching
    const nonWild = finalReels.filter(s => s !== wildSymbol);
    const freq: Record<string, number> = {};
    nonWild.forEach(s => { freq[s] = (freq[s] || 0) + 1; });
    const bestSymbol = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || finalReels[0];
    const effective = finalReels.map(s => s === wildSymbol ? bestSymbol : s);

    const allMatch = effective.every(r => r === effective[0]);
    const pairs = reelCount >= 3 ? (
      (effective[0] === effective[1] ? 1 : 0) +
      (effective[1] === effective[2] ? 1 : 0) +
      (effective[0] === effective[2] ? 1 : 0)
    ) : 0;

    let payout = 0;
    let isJackpot = false;

    if (allMatch) {
      const idx = symbols.indexOf(effective[0]);
      payout = payoutMultipliers[idx % payoutMultipliers.length] || 500;
      if (reelCount >= 4) payout = Math.floor(payout * 1.5);
      if (reelCount >= 5) payout = Math.floor(payout * 2);
      if (wilds.length > 0) payout = Math.floor(payout * (1 + wilds.length * 0.5));
      if (effective[0] === symbols[0] || effective[0] === "7️⃣") isJackpot = true;
    } else if (pairs > 0) {
      payout = pairs === 1 ? 50 : 150; // 2 pairs = bigger win
    }

    return { payout, isJackpot, wilds };
  }, [config, reelCount, symbols, payoutMultipliers]);

  const doSpin = useCallback(async (isBonusSpin = false) => {
    if (isSpinning) return;
    
    if (!isBonusSpin) {
      if (xpLives <= 0) { toast({ title: "No XP lives left! ⚡", variant: "destructive" }); return; }
      if (points < pointCost) { toast({ title: "Insufficient points", description: `Need ${pointCost} pts`, variant: "destructive" }); return; }
      const lifeConsumed = await consumeLife();
      if (!lifeConsumed) return;
      await spendPoints(pointCost);
    }

    setIsSpinning(true);
    setResult(null);
    setLastWin(false);
    setWildPositions([]);
    play("spin");

    let count = 0;
    const tickInterval = config.spinStyle === "cascade" ? 60 : config.spinStyle === "avalanche" ? 70 : 80;
    const maxTicks = config.spinStyle === "cascade" ? 25 : 20;

    const interval = setInterval(() => {
      const randomReels = Array.from({ length: reelCount }, () => {
        // Occasionally inject wild symbol
        if (config.hasWild && Math.random() < 0.08) return "🃏";
        return symbols[Math.floor(Math.random() * symbols.length)];
      });
      setReels(randomReels);
      if (count % 4 === 0) play("tick");
      count++;

      if (count > maxTicks) {
        clearInterval(interval);
        const finalReels = Array.from({ length: reelCount }, () => {
          if (config.hasWild && Math.random() < 0.06) return "🃏";
          return symbols[Math.floor(Math.random() * symbols.length)];
        });
        setReels(finalReels);

        const { payout: rawPayout, isJackpot, wilds } = resolveReels(finalReels);
        setWildPositions(wilds);

        let payout = Math.floor(rawPayout * multiplier);

        // Check for bonus trigger (3+ bonus symbols)
        if (config.hasBonus && !bonusActive) {
          const bonusSymbol = "⭐";
          const bonusCount = finalReels.filter(s => s === bonusSymbol).length;
          if (bonusCount >= 3) {
            play("bonus");
            setBonusActive(true);
            setBonusSpinsLeft(bonusCount + 2);
            setBonusWinnings(0);
            setMultiplier(2);
            toast({ title: "🎰 BONUS ROUND!", description: `${bonusCount + 2} free spins with 2x multiplier!` });
          }
        }

        if (payout > 0) {
          payout = adjustWinAmount(payout);
          if (rawPayout >= 1000 && canFullyWin()) recordFullWin();
        }

        if (payout > 0) {
          updateBalance(payout);
          if (isJackpot) {
            play("bigwin");
            setResult(`🎰 JACKPOT! ₦${payout.toLocaleString()}!`);
          } else {
            play("win");
            setResult(`🎉 You won ₦${payout.toLocaleString()}!`);
          }
          setLastWin(true);
          if (bonusActive) setBonusWinnings(prev => prev + payout);
        } else {
          play("lose");
          setResult(bonusActive ? "No match - keep spinning!" : "No match. Try again!");
        }

        recordGameResult(gameId, isBonusSpin ? 0 : pointCost, payout, { reels: finalReels, bonus: bonusActive });
        setIsSpinning(false);

        // Handle bonus spins countdown
        if (bonusActive) {
          setBonusSpinsLeft(prev => {
            const next = prev - 1;
            if (next <= 0) {
              setTimeout(() => {
                setBonusActive(false);
                setMultiplier(1);
                toast({ title: "Bonus Complete!", description: `Total bonus winnings: ₦${bonusWinnings.toLocaleString()}` });
              }, 1000);
            }
            return next;
          });
        }
      }
    }, tickInterval);
  }, [isSpinning, xpLives, points, pointCost, consumeLife, spendPoints, play, config, reelCount, symbols, resolveReels, multiplier, bonusActive, bonusWinnings, adjustWinAmount, canFullyWin, recordFullWin, updateBalance, recordGameResult, gameId, toast]);

  // Spin style animations
  const getSpinAnimation = () => {
    switch (config.spinStyle) {
      case "cascade":
        return { y: [0, -20, 5, 0], opacity: [1, 0.5, 0.8, 1] };
      case "avalanche":
        return { y: [-30, 0], scale: [0.8, 1], opacity: [0, 1] };
      case "tumble":
        return { rotate: [0, 180, 360], scale: [1, 0.8, 1] };
      default:
        return { y: [0, -10, 0], rotateX: [0, 180, 360] };
    }
  };

  const getReelStyle = () => {
    switch (theme.variant) {
      case "neon": return "border-fuchsia-500/40 shadow-[0_0_15px_rgba(217,70,239,0.3)]";
      case "crystal": case "ice": return "border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]";
      case "fire": return "border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.3)]";
      case "dragon": return "border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
      case "magic": case "mystic": return "border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]";
      case "ocean": return "border-blue-400/40 shadow-[0_0_15px_rgba(96,165,250,0.2)]";
      case "jungle": case "safari": return "border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
      case "candy": return "border-pink-400/40 shadow-[0_0_15px_rgba(244,114,182,0.3)]";
      case "western": return "border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
      case "egypt": return "border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.3)]";
      case "viking": return "border-blue-300/40 shadow-[0_0_15px_rgba(147,197,253,0.2)]";
      case "pirate": return "border-red-400/40 shadow-[0_0_15px_rgba(248,113,113,0.2)]";
      case "cosmic": return "border-yellow-400/40 shadow-[0_0_15px_rgba(250,204,21,0.2)]";
      case "explosive": return "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]";
      default: return "border-primary/20";
    }
  };

  const getGridCols = () => {
    if (reelCount === 5) return "grid-cols-5";
    if (reelCount === 4) return "grid-cols-4";
    return "grid-cols-3";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-2`}>{theme.description}</p>

      {/* Bonus / Multiplier bar */}
      <AnimatePresence>
        {bonusActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-center"
          >
            <span className="text-yellow-400 font-bold text-sm">
              🎰 BONUS ROUND • {bonusSpinsLeft} spins left • {multiplier}x multiplier • Won: ₦{bonusWinnings.toLocaleString()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature badges */}
      <div className="flex gap-2 justify-center mb-3 flex-wrap">
        {config.hasWild && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300">🃏 Wilds</span>
        )}
        {config.hasBonus && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300">⭐ Bonus Rounds</span>
        )}
        {reelCount > 3 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">{reelCount} Reels</span>
        )}
        {config.spinStyle !== "classic" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 capitalize">{config.spinStyle} Mode</span>
        )}
      </div>

      <Card className={`p-6 sm:p-8 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 relative overflow-hidden`}>
        {/* Decorative background */}
        <div className="absolute inset-0 opacity-5 text-9xl flex items-center justify-center pointer-events-none select-none">
          {emoji}
        </div>

        {/* Animated background particles for special variants */}
        {(theme.variant === "neon" || theme.variant === "cosmic") && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-1 h-1 rounded-full ${theme.variant === "neon" ? "bg-fuchsia-400" : "bg-yellow-400"}`}
                animate={{ y: ["100%", "-10%"], x: [Math.random() * 100 + "%", Math.random() * 100 + "%"], opacity: [0, 1, 0] }}
                transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: i * 0.5 }}
              />
            ))}
          </div>
        )}

        {/* Fire effect for fire variants */}
        {theme.variant === "fire" && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-orange-500/10 to-transparent pointer-events-none" />
        )}

        <div className={`grid ${getGridCols()} gap-2 sm:gap-3 justify-center mb-4 relative`}>
          {reels.map((symbol, i) => (
            <motion.div
              key={i}
              className={`aspect-square max-w-20 sm:max-w-24 w-full mx-auto bg-background/80 rounded-xl flex items-center justify-center text-3xl sm:text-5xl border-2 relative ${getReelStyle()} ${wildPositions.includes(i) ? "ring-2 ring-purple-400 ring-offset-1 ring-offset-background" : ""}`}
              animate={isSpinning ? getSpinAnimation() : lastWin ? { scale: [1, 1.15, 1] } : {}}
              transition={{
                repeat: isSpinning ? Infinity : lastWin ? 2 : 0,
                duration: isSpinning ? (config.spinStyle === "cascade" ? 0.2 : 0.15) : 0.3,
                delay: isSpinning ? i * (config.spinStyle === "cascade" ? 0.1 : 0.05) : 0,
              }}
            >
              {symbol}
              {/* Wild glow */}
              {symbol === "🃏" && !isSpinning && (
                <motion.div
                  className="absolute inset-0 rounded-xl bg-purple-500/20"
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Win line indicator */}
        {!isSpinning && reels.length >= 3 && (
          <div className="flex justify-center gap-1 mt-2">
            {reels.map((_, i) => (
              <div key={i} className={`h-1 flex-1 max-w-12 sm:max-w-16 rounded-full transition-colors duration-300 ${lastWin ? "bg-green-400" : "bg-muted/30"}`} />
            ))}
          </div>
        )}
      </Card>

      {/* Result display */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`text-lg sm:text-xl font-bold text-center mt-4 ${lastWin ? (result.includes("JACKPOT") ? "text-yellow-400" : theme.accentColor) : "text-muted-foreground"}`}
          >
            {result}
            {lastWin && multiplier > 1 && <span className="block text-sm text-yellow-400/70">{multiplier}x multiplier applied!</span>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Paytable toggle */}
      <button
        onClick={() => setShowPaytable(!showPaytable)}
        className="text-xs text-muted-foreground underline mx-auto block mt-3 hover:text-foreground transition-colors"
      >
        {showPaytable ? "Hide" : "Show"} Paytable
      </button>

      <AnimatePresence>
        {showPaytable && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mt-2 text-xs">
              {symbols.slice(0, 6).map((sym, i) => (
                <div key={i} className="flex justify-between px-2 py-1 bg-background/40 rounded border border-primary/10">
                  <span>{sym}{sym}{sym}</span>
                  <span className="text-primary font-bold">₦{(payoutMultipliers[i] || 300).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between px-2 py-1 bg-background/40 rounded border border-primary/10 col-span-2 sm:col-span-1">
                <span>Any 2 match</span>
                <span className="text-primary font-bold">₦50</span>
              </div>
              {config.hasWild && (
                <div className="flex justify-between px-2 py-1 bg-purple-500/10 rounded border border-purple-500/20 col-span-2 sm:col-span-3">
                  <span>🃏 Wild = substitutes any symbol (+50% per wild)</span>
                </div>
              )}
              {config.hasBonus && (
                <div className="flex justify-between px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/20 col-span-2 sm:col-span-3">
                  <span>⭐⭐⭐ = Bonus Round (free spins + 2x multiplier)</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        className="button-gradient px-8 py-3 text-lg w-full mt-4"
        onClick={() => doSpin(bonusActive)}
        disabled={isSpinning || (!bonusActive && xpLives <= 0)}
      >
        {isSpinning ? "Spinning..." : bonusActive ? `Free Spin (${bonusSpinsLeft} left)` : xpLives <= 0 ? "No XP Lives" : `Spin (${pointCost} pts)`}
      </Button>
    </motion.div>
  );
};

export default SlotsEngine;
