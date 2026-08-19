import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import GameBackground from "./GameBackground";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useToast } from "@/hooks/use-toast";
import { useGameSounds } from "@/hooks/useGameSounds";
import { GameTheme } from "@/config/gameThemes";
import { SLOT_CONFIGS, SlotConfig } from "@/config/engineConfig";
import { useJackpot } from "@/hooks/useJackpot";
import JackpotCounter from "@/components/JackpotCounter";
import { SLOTS_PAYOUT_TIERS } from "@/config/payouts";

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

interface SlotsOutcome {
  reels: string[];
  effective: string[];
  wilds: number[];
  payout: number;
  is_jackpot: boolean;
  points: number;
  balance: number;
}

const SlotsEngine = ({ gameId, name, emoji, pointCost, symbols = DEFAULT_SYMBOLS, theme = DEFAULT_THEME }: Props) => {
  const { fetchBalance } = useWallet();
  const { points, fetchPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { toast } = useToast();
  const { play } = useGameSounds();
  const { contribute: contributeToJackpot } = useJackpot();

  const config: SlotConfig = SLOT_CONFIGS[gameId] || { reelCount: 3, hasWild: false, hasBonus: false, spinStyle: "classic" };
  const reelCount = config.reelCount;

  const [reels, setReels] = useState(symbols.slice(0, reelCount));
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [lastWin, setLastWin] = useState(false);
  const [bonusFlash, setBonusFlash] = useState(false);
  const [wildPositions, setWildPositions] = useState<number[]>([]);
  const [showPaytable, setShowPaytable] = useState(false);

  const doSpin = useCallback(async () => {
    if (isSpinning) return;

    if (xpLives <= 0) { toast({ title: "No XP lives left! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", description: `Need ${pointCost} pts`, variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;

    setIsSpinning(true);
    setResult(null);
    setLastWin(false);
    setWildPositions([]);
    setBonusFlash(false);
    play("spin");

    let count = 0;
    const tickInterval = config.spinStyle === "cascade" ? 60 : config.spinStyle === "avalanche" ? 70 : 80;
    const maxTicks = config.spinStyle === "cascade" ? 25 : 20;

    // Cosmetic mid-spin ticks only — the real result comes from the server below.
    const interval = setInterval(() => {
      const randomReels = Array.from({ length: reelCount }, () => {
        if (config.hasWild && Math.random() < 0.08) return "🃏";
        return symbols[Math.floor(Math.random() * symbols.length)];
      });
      setReels(randomReels);
      if (count % 4 === 0) play("tick");
      count++;

      if (count > maxTicks) {
        clearInterval(interval);
        void resolveOnServer();
      }
    }, tickInterval);
  }, [isSpinning, xpLives, points, pointCost, consumeLife, play, config, reelCount, symbols]);

  const resolveOnServer = async () => {
    const { data, error } = await supabase.rpc("resolve_slots_round", {
      p_game_type: gameId,
      p_point_cost: pointCost,
    });

    if (error || !data) {
      console.error("resolve_slots_round failed:", error);
      toast({ title: "Spin failed", description: error?.message ?? "Please try again", variant: "destructive" });
      await fetchPoints();
      await fetchBalance();
      setIsSpinning(false);
      return;
    }

    const outcome = data as unknown as SlotsOutcome;
    setReels(outcome.reels);
    setWildPositions(outcome.wilds ?? []);
    await fetchPoints();
    await fetchBalance();

    const payout = Number(outcome.payout) || 0;

    if (payout > 0) {
      if (outcome.is_jackpot) {
        play("bigwin");
        setResult(`🎰 JACKPOT! ₦${payout.toLocaleString()}!`);
      } else {
        play("win");
        setResult(`🎉 You won ₦${payout.toLocaleString()}!`);
      }
      setLastWin(true);
    } else {
      play("lose");
      setResult("No match. Try again!");
    }

    // Cosmetic-only: the ⭐ bonus symbols still show the celebratory banner,
    // but no free (p_point_cost: 0) real spins are granted — that needs its
    // own server-side session design before it can pay out for real.
    if (config.hasBonus) {
      const bonusSymbol = "⭐";
      const bonusCount = outcome.reels.filter((s) => s === bonusSymbol).length;
      if (bonusCount >= 3) {
        play("bonus");
        setBonusFlash(true);
        toast({ title: "🎰 Bonus symbols!", description: "Bonus rounds are coming soon — this spin paid out at normal odds." });
      }
    }

    // Progressive jackpot contribution — separate, already server-authoritative, untouched.
    contributeToJackpot(pointCost).then((jp) => {
      if (jp.won) {
        play("bigwin");
        toast({ title: "🏆 PROGRESSIVE JACKPOT!", description: `You won ₦${jp.winAmount.toLocaleString()}!` });
      }
    });

    setIsSpinning(false);
  };

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
      <JackpotCounter />
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-2`}>{theme.description}</p>

      {/* Bonus symbol flash (cosmetic only — no free spins granted yet) */}
      <AnimatePresence>
        {bonusFlash && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-2 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-center"
          >
            <span className="text-yellow-400 font-bold text-sm">
              🎰 Bonus symbols landed! Full bonus rounds coming soon.
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
          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-300">⭐ Bonus Symbols</span>
        )}
        {reelCount > 3 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300">{reelCount} Reels</span>
        )}
        {config.spinStyle !== "classic" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 capitalize">{config.spinStyle} Mode</span>
        )}
      </div>

      <GameBackground type="slots" overlay="dark">
        <div className="p-6 sm:p-8 relative">
          <div className={`grid ${getGridCols()} gap-2 sm:gap-3 justify-center mb-4 relative`}>
            {reels.map((symbol, i) => (
              <motion.div
                key={i}
                className={`aspect-square max-w-20 sm:max-w-24 w-full mx-auto bg-black/50 rounded-xl flex items-center justify-center text-3xl sm:text-5xl border-2 relative ${getReelStyle()} ${wildPositions.includes(i) ? "ring-2 ring-purple-400 ring-offset-1 ring-offset-background" : ""}`}
                animate={isSpinning ? getSpinAnimation() : lastWin ? { scale: [1, 1.15, 1] } : {}}
                transition={{
                  repeat: isSpinning ? Infinity : lastWin ? 2 : 0,
                  duration: isSpinning ? (config.spinStyle === "cascade" ? 0.2 : 0.15) : 0.3,
                  delay: isSpinning ? i * (config.spinStyle === "cascade" ? 0.1 : 0.05) : 0,
                }}
              >
                {symbol}
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

          {!isSpinning && reels.length >= 3 && (
            <div className="flex justify-center gap-1 mt-2">
              {reels.map((_, i) => (
                <div key={i} className={`h-1 flex-1 max-w-12 sm:max-w-16 rounded-full transition-colors duration-300 ${lastWin ? "bg-green-400" : "bg-white/10"}`} />
              ))}
            </div>
          )}
        </div>
      </GameBackground>

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
                  <span className="text-primary font-bold">₦{(SLOTS_PAYOUT_TIERS[i] || 300).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between px-2 py-1 bg-background/40 rounded border border-primary/10 col-span-2 sm:col-span-1">
                <span>Any 2 match</span>
                <span className="text-primary font-bold">₦300</span>
              </div>
              {config.hasWild && (
                <div className="flex justify-between px-2 py-1 bg-purple-500/10 rounded border border-purple-500/20 col-span-2 sm:col-span-3">
                  <span>🃏 Wild = substitutes any symbol (+50% per wild)</span>
                </div>
              )}
              {config.hasBonus && (
                <div className="flex justify-between px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/20 col-span-2 sm:col-span-3">
                  <span>⭐⭐⭐ = Bonus symbols (full bonus rounds coming soon)</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        className="button-gradient px-8 py-3 text-lg w-full mt-4"
        onClick={() => doSpin()}
        disabled={isSpinning || xpLives <= 0}
      >
        {isSpinning ? "Spinning..." : xpLives <= 0 ? "No XP Lives" : `Spin (${pointCost} pts)`}
      </Button>
    </motion.div>
  );
};

export default SlotsEngine;