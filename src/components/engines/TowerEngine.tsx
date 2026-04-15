import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { usePoints } from "@/hooks/usePoints";
import { useXpLives } from "@/hooks/useXpLives";
import { useWinRestrictions } from "@/hooks/useWinRestrictions";
import { useToast } from "@/hooks/use-toast";
import { GameTheme } from "@/config/gameThemes";
import { useGameSounds } from "@/hooks/useGameSounds";
import GameBackground from "./GameBackground";
import BetControls from "./BetControls";

interface Props {
  gameId: string;
  name: string;
  emoji: string;
  pointCost: number;
  theme?: GameTheme;
  floors?: number;
  doorsPerFloor?: number;
}

const DEFAULT_THEME: GameTheme = { bgGradient: "from-blue-950 to-indigo-950", accentColor: "text-blue-400", description: "Climb higher for bigger rewards!", variant: "classic" };

const TowerEngine = ({ gameId, name, emoji, pointCost, theme = DEFAULT_THEME, floors = 8, doorsPerFloor = 3 }: Props) => {
  const { updateBalance, recordGameResult } = useWallet();
  const { points, spendPoints } = usePoints();
  const { xpLives, consumeLife } = useXpLives();
  const { adjustWinAmount, recordFullWin, canFullyWin } = useWinRestrictions();
  const { toast } = useToast();
  const { play } = useGameSounds();

  const [trapDoors, setTrapDoors] = useState<number[]>([]);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [chosenDoors, setChosenDoors] = useState<{ floor: number; door: number; safe: boolean }[]>([]);
  const [state, setState] = useState<"idle" | "playing" | "fell" | "cashed">("idle");
  const [result, setResult] = useState<string | null>(null);

  const getMultiplier = (floor: number) => parseFloat((1 + floor * 0.5).toFixed(1));

  const startGame = async () => {
    if (xpLives <= 0) { toast({ title: "No XP lives! ⚡", variant: "destructive" }); return; }
    if (points < pointCost) { toast({ title: "Insufficient points", variant: "destructive" }); return; }
    const lifeConsumed = await consumeLife();
    if (!lifeConsumed) return;
    await spendPoints(pointCost);
    const traps = Array.from({ length: floors }, () => Math.floor(Math.random() * doorsPerFloor));
    setTrapDoors(traps);
    setCurrentFloor(0);
    setChosenDoors([]);
    setState("playing");
    setResult(null);
  };

  const pickDoor = async (doorIndex: number) => {
    if (state !== "playing") return;
    const isTrap = trapDoors[currentFloor] === doorIndex;
    const newChoices = [...chosenDoors, { floor: currentFloor, door: doorIndex, safe: !isTrap }];
    setChosenDoors(newChoices);

    if (isTrap) {
      setState("fell");
      play("lose");
      setResult(`💥 Trap on floor ${currentFloor + 1}! You fell!`);
      await recordGameResult(gameId, pointCost, 0, { floor: currentFloor, choices: newChoices });
    } else {
      const nextFloor = currentFloor + 1;
      if (nextFloor >= floors) {
        await cashOutInternal(nextFloor);
      } else {
        setCurrentFloor(nextFloor);
      }
    }
  };

  const cashOutInternal = async (floor: number) => {
    play("cashout");
    setState("cashed");
    const mult = getMultiplier(floor);
    let winnings = Math.floor(pointCost * mult * 2);
    winnings = adjustWinAmount(winnings);
    if (winnings > 0 && canFullyWin() && mult >= 3) recordFullWin();
    if (winnings > 0) await updateBalance(winnings);
    setResult(`🏆 Floor ${floor}! ${mult}x → ₦${winnings.toLocaleString()}`);
    await recordGameResult(gameId, pointCost, winnings, { floor, multiplier: mult });
  };

  const cashOut = () => {
    if (state !== "playing" || currentFloor === 0) return;
    cashOutInternal(currentFloor);
  };

  const floorEmojis = ["🏠", "🏢", "🏗️", "🌥️", "☁️", "✈️", "🚀", "🌟", "👑", "💎"];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1 text-foreground">{emoji} {name}</h1>
      <p className="text-muted-foreground text-center text-sm mb-3">{theme.description}</p>

      {state !== "idle" && (
        <GameBackground type="tower" overlay="dark" className="mb-4">
          <div className="p-4">
            <div className="flex flex-col-reverse gap-1.5">
              {Array.from({ length: floors }).map((_, floorIdx) => {
                const chosen = chosenDoors.find(c => c.floor === floorIdx);
                const isCurrentFloor = floorIdx === currentFloor && state === "playing";
                const isPast = floorIdx < currentFloor || chosen;
                const mult = getMultiplier(floorIdx + 1);

                return (
                  <motion.div
                    key={floorIdx}
                    className={`flex items-center gap-2 p-2 rounded-xl transition-all ${
                      isCurrentFloor ? "bg-primary/20 ring-2 ring-primary/50 shadow-lg shadow-primary/10" :
                      isPast && chosen?.safe ? "bg-green-500/10 border border-green-500/20" :
                      isPast && chosen && !chosen.safe ? "bg-red-500/10 border border-red-500/20" :
                      "bg-white/5"
                    }`}
                    animate={isCurrentFloor ? { scale: [1, 1.01, 1] } : {}}
                    transition={{ repeat: isCurrentFloor ? Infinity : 0, duration: 1 }}
                  >
                    <span className="text-xs w-16 text-white/50 font-mono">
                      {floorEmojis[floorIdx % floorEmojis.length]} {mult}x
                    </span>
                    <div className="flex gap-1.5 flex-1">
                      {Array.from({ length: doorsPerFloor }).map((_, doorIdx) => {
                        const isChosen = chosen?.door === doorIdx;
                        const showTrap = (state === "fell" || state === "cashed") && floorIdx <= (state === "fell" ? currentFloor : currentFloor - 1) && trapDoors[floorIdx] === doorIdx;

                        return (
                          <motion.button
                            key={doorIdx}
                            onClick={() => isCurrentFloor ? pickDoor(doorIdx) : null}
                            disabled={!isCurrentFloor}
                            className={`flex-1 h-10 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-all ${
                              isChosen && chosen.safe ? "bg-green-500/30 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]" :
                              isChosen && !chosen.safe ? "bg-red-500/30 border-red-500/50 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                              showTrap ? "bg-red-500/10 border-red-500/20 text-red-400/50" :
                              isCurrentFloor ? "bg-white/10 border-white/20 hover:border-primary/50 hover:bg-primary/10 cursor-pointer" :
                              "bg-white/3 border-white/5"
                            }`}
                            whileHover={isCurrentFloor ? { scale: 1.05 } : {}}
                            whileTap={isCurrentFloor ? { scale: 0.95 } : {}}
                          >
                            {isChosen && chosen.safe ? "✅" :
                             isChosen && !chosen.safe ? "💥" :
                             showTrap ? "⚠️" :
                             isCurrentFloor ? "🚪" : "·"}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </GameBackground>
      )}

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className={`text-lg font-bold text-center mb-4 ${state === "cashed" ? "text-green-400" : "text-red-400"}`}>
            {result}
          </motion.div>
        )}
      </AnimatePresence>

      {state === "playing" && currentFloor > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <Button className="py-5 text-base font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20" onClick={cashOut}>
            💰 Cash Out (₦{Math.floor(pointCost * getMultiplier(currentFloor) * 2).toLocaleString()})
          </Button>
          <Button variant="outline" className="py-5 text-base" disabled>
            Floor {currentFloor + 1} →
          </Button>
        </div>
      ) : state !== "playing" ? (
        <BetControls onPlay={startGame} xpLives={xpLives} pointCost={pointCost} playLabel={`BET ${pointCost} pts`} />
      ) : null}
    </motion.div>
  );
};

export default TowerEngine;
