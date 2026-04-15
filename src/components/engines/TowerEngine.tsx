import { useState } from "react";
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

    // One trap door per floor
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
      setResult(`💥 Trap on floor ${currentFloor + 1}! You fell!`);
      await recordGameResult(gameId, pointCost, 0, { floor: currentFloor, choices: newChoices });
    } else {
      const nextFloor = currentFloor + 1;
      if (nextFloor >= floors) {
        // Reached the top!
        await cashOutInternal(nextFloor);
      } else {
        setCurrentFloor(nextFloor);
      }
    }
  };

  const cashOutInternal = async (floor: number) => {
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
      <h1 className="text-2xl sm:text-4xl font-bold text-center mb-1">{emoji} {name}</h1>
      <p className={`${theme.accentColor} text-center text-sm mb-4`}>{theme.description}</p>

      {state !== "idle" && (
        <Card className={`p-4 bg-gradient-to-br ${theme.bgGradient} backdrop-blur-sm border-primary/20 mb-4`}>
          {/* Tower visualization - show floors from top to bottom */}
          <div className="flex flex-col-reverse gap-1.5">
            {Array.from({ length: floors }).map((_, floorIdx) => {
              const chosen = chosenDoors.find(c => c.floor === floorIdx);
              const isCurrentFloor = floorIdx === currentFloor && state === "playing";
              const isPast = floorIdx < currentFloor || chosen;
              const mult = getMultiplier(floorIdx + 1);

              return (
                <motion.div
                  key={floorIdx}
                  className={`flex items-center gap-2 p-1.5 rounded-lg transition-all ${
                    isCurrentFloor ? "bg-primary/20 ring-1 ring-primary" :
                    isPast && chosen?.safe ? "bg-green-500/10" :
                    isPast && chosen && !chosen.safe ? "bg-destructive/10" :
                    "bg-card/30"
                  }`}
                  animate={isCurrentFloor ? { scale: [1, 1.01, 1] } : {}}
                  transition={{ repeat: isCurrentFloor ? Infinity : 0, duration: 1 }}
                >
                  <span className="text-xs w-14 text-muted-foreground">
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
                          className={`flex-1 h-9 rounded flex items-center justify-center text-sm font-bold border transition-all ${
                            isChosen && chosen.safe ? "bg-green-500/30 border-green-500/50 text-green-400" :
                            isChosen && !chosen.safe ? "bg-destructive/30 border-destructive/50 text-destructive" :
                            showTrap ? "bg-destructive/20 border-destructive/30 text-destructive/60" :
                            isCurrentFloor ? "bg-card/60 border-border/50 hover:border-primary/50 cursor-pointer" :
                            "bg-card/20 border-border/20"
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
        </Card>
      )}

      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className={`text-lg font-bold text-center mb-4 ${state === "cashed" ? theme.accentColor : "text-destructive"}`}>
          {result}
        </motion.div>
      )}

      {state === "playing" && currentFloor > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          <Button className="py-4 text-base bg-green-600 hover:bg-green-700 text-white" onClick={cashOut}>
            💰 Cash Out (₦{Math.floor(pointCost * getMultiplier(currentFloor) * 2).toLocaleString()})
          </Button>
          <Button variant="outline" className="py-4 text-base" disabled>
            Floor {currentFloor + 1} →
          </Button>
        </div>
      ) : state !== "playing" ? (
        <Button className="button-gradient w-full py-3 text-lg" onClick={startGame} disabled={xpLives <= 0}>
          {xpLives <= 0 ? "No XP Lives" : `Play (${pointCost} pts)`}
        </Button>
      ) : null}
    </motion.div>
  );
};

export default TowerEngine;
