import { useParams, useNavigate } from "react-router-dom";
import { useDepositGate } from "@/hooks/useDepositGate";
import GamePageLayout from "@/components/GamePageLayout";
import { allGames } from "@/config/gamesData";
import SlotsEngine from "@/components/engines/SlotsEngine";
import CrashEngine from "@/components/engines/CrashEngine";
import CardsEngine from "@/components/engines/CardsEngine";
import DiceEngine from "@/components/engines/DiceEngine";
import InstantEngine from "@/components/engines/InstantEngine";
import ArcadeEngine from "@/components/engines/ArcadeEngine";
import LotteryEngine from "@/components/engines/LotteryEngine";
import SportsEngine from "@/components/engines/SportsEngine";
import { useEffect } from "react";

// Map game categories to engines
const ENGINE_MAP: Record<string, string> = {
  // Category-based defaults
  slots: "slots",
  crash: "crash",
  cards: "cards",
  dice: "dice",
  instant: "instant",
  arcade: "arcade",
  lottery: "lottery",
  sports: "sports",
};

// Specific game overrides (some games have unique engines)
const GAME_ENGINE_OVERRIDES: Record<string, string> = {
  "spin-wheel": "spin-wheel",
  "lucky-slots": "lucky-slots",
  "trivia-quiz": "trivia",
  "raffle-draw": "raffle",
};

// Themed symbol sets for slot variants
const SLOT_THEMES: Record<string, string[]> = {
  "fire-strike": ["🔥", "💥", "⚡", "🌟", "💎", "7️⃣"],
  "hot-burn": ["🌶️", "🔥", "💰", "⭐", "🍒", "7️⃣"],
  "wild-west": ["🤠", "🐎", "💰", "🌵", "⭐", "🔫"],
  "pharaoh-gold": ["🏛️", "👁️", "💎", "🐍", "⭐", "🔮"],
  "ocean-treasure": ["🐚", "🐟", "🦈", "💎", "⭐", "🌊"],
  "mystic-gems": ["💠", "💎", "🔮", "⭐", "🌙", "✨"],
  "jungle-king": ["🦁", "🐘", "🍃", "💎", "⭐", "🌴"],
  "candy-pop": ["🍬", "🍭", "🍫", "🎂", "⭐", "🍩"],
  "neon-lights": ["💡", "🌈", "⚡", "💎", "⭐", "🎆"],
  "viking-saga": ["⚔️", "🛡️", "🏰", "💎", "⭐", "⚡"],
  "zeus-thunder": ["⛈️", "⚡", "🏛️", "💎", "⭐", "🔱"],
  "moon-magic": ["🌙", "✨", "🔮", "💎", "⭐", "🌟"],
  "lucky-7": ["7️⃣", "🍒", "💎", "⭐", "🔔", "🍋"],
  "diamond-rush": ["💎", "💰", "👑", "⭐", "🔥", "✨"],
  "jackpot-city": ["🏙️", "💰", "💎", "7️⃣", "⭐", "🎰"],
  "dragon-fortune": ["🐉", "🔥", "💎", "👑", "⭐", "🏮"],
  "star-burst": ["⭐", "💫", "✨", "🌟", "💎", "🔥"],
  "ice-cold": ["🧊", "❄️", "💎", "⭐", "🌊", "☃️"],
  "hot-pepper": ["🌶️", "🔥", "💰", "💎", "⭐", "7️⃣"],
  "safari-wild": ["🦒", "🦁", "🐘", "💎", "⭐", "🌴"],
  "cherry-bomb": ["🍒", "💣", "💎", "⭐", "🔥", "7️⃣"],
  "magic-lamp": ["🪔", "🧞", "💎", "⭐", "👑", "✨"],
  "pirate-loot": ["☠️", "🏴‍☠️", "💰", "💎", "⭐", "🗡️"],
  "fortune-cat": ["🐱", "💰", "🎋", "💎", "⭐", "🏮"],
  "spin-match": ["🎯", "💎", "⭐", "🔥", "🍒", "7️⃣"],
};

function getEngineType(gameId: string, categories: string[]): string {
  if (GAME_ENGINE_OVERRIDES[gameId]) return GAME_ENGINE_OVERRIDES[gameId];
  
  // Priority order for engine selection
  const priority = ["slots", "crash", "cards", "dice", "sports", "lottery", "arcade", "instant"];
  for (const cat of priority) {
    if (categories.includes(cat)) return ENGINE_MAP[cat];
  }
  return "instant"; // fallback
}

const DynamicGame = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { isAuthorized, isChecking } = useDepositGate();

  const game = allGames.find((g) => g.id === gameId);

  useEffect(() => {
    if (!game && !isChecking) navigate("/games");
  }, [game, isChecking]);

  if (!isAuthorized || isChecking) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    </div>
  );

  if (!game) return null;

  const engineType = getEngineType(game.id, game.category as string[]);
  const props = { gameId: game.id, name: game.name, emoji: game.emoji, pointCost: game.pointCost };

  const renderEngine = () => {
    switch (engineType) {
      case "slots":
        return <SlotsEngine {...props} symbols={SLOT_THEMES[game.id]} />;
      case "crash":
        return <CrashEngine {...props} />;
      case "cards":
        return <CardsEngine {...props} />;
      case "dice":
        return <DiceEngine {...props} />;
      case "instant":
        return <InstantEngine {...props} />;
      case "arcade":
        return <ArcadeEngine {...props} />;
      case "lottery":
        return <LotteryEngine {...props} />;
      case "sports":
        return <SportsEngine {...props} />;
      default:
        return <InstantEngine {...props} />;
    }
  };

  return (
    <GamePageLayout>
      {renderEngine()}
    </GamePageLayout>
  );
};

export default DynamicGame;
