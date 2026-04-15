import { useParams, useNavigate } from "react-router-dom";
import { useDepositGate } from "@/hooks/useDepositGate";
import GamePageLayout from "@/components/GamePageLayout";
import { allGames } from "@/config/gamesData";
import { getGameTheme, getSportsTeams, getDiceConfig, getCrashVisuals } from "@/config/gameThemes";
import SlotsEngine from "@/components/engines/SlotsEngine";
import CrashEngine from "@/components/engines/CrashEngine";
import CardsEngine from "@/components/engines/CardsEngine";
import DiceEngine from "@/components/engines/DiceEngine";
import InstantEngine from "@/components/engines/InstantEngine";
import ArcadeEngine from "@/components/engines/ArcadeEngine";
import LotteryEngine from "@/components/engines/LotteryEngine";
import SportsEngine from "@/components/engines/SportsEngine";
import MinesEngine from "@/components/engines/MinesEngine";
import WheelEngine from "@/components/engines/WheelEngine";
import TowerEngine from "@/components/engines/TowerEngine";
import CoinFlipEngine from "@/components/engines/CoinFlipEngine";
import ReactionEngine from "@/components/engines/ReactionEngine";
import ScratchCardEngine from "@/components/engines/ScratchCardEngine";
import RaceEngine from "@/components/engines/RaceEngine";
import { useEffect } from "react";

const GAME_ENGINE_OVERRIDES: Record<string, string> = {
  "spin-wheel": "spin-wheel",
  "lucky-slots": "lucky-slots",
  "trivia-quiz": "trivia",
  "raffle-draw": "raffle",
  // Route specific games to new engines
  "mine-field": "mines",
  "diamond-mine": "mines",
  "coin-flip": "coinflip",
  "double-or-nothing": "coinflip",
  "cash-grab": "coinflip",
  "mega-wheel": "wheel",
  "wheel-fortune": "wheel",
  "tower-climb": "tower",
  "plinko": "tower",
  // Reaction-based games
  "ninja-strike": "reaction",
  "zombie-hunt": "reaction",
  "space-invader": "reaction",
  "bubble-pop": "reaction",
  "fish-catch": "reaction",
  "balloon-pop": "reaction",
};

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
  "spin-match": ["🎯", "💎", "⭐", "🔥", "🍒", "7️⃣"],
  "fruit-blast": ["🍎", "🍊", "🍇", "🍋", "🍒", "🍓"],
};

const MINES_CONFIG: Record<string, { gridSize: number; mineCount: number }> = {
  "mine-field": { gridSize: 25, mineCount: 5 },
  "diamond-mine": { gridSize: 16, mineCount: 3 },
};

const COINFLIP_SIDES: Record<string, [string, string]> = {
  "coin-flip": ["👑", "🌟"],
  "double-or-nothing": ["✅", "❌"],
  "cash-grab": ["💵", "💨"],
};

const TOWER_CONFIG: Record<string, { floors: number; doors: number }> = {
  "tower-climb": { floors: 8, doors: 3 },
  "plinko": { floors: 6, doors: 4 },
};

const REACTION_CONFIG: Record<string, { targets: string[]; duration: number; gridSize: number; gridCols: number }> = {
  "ninja-strike": { targets: ["🥷", "⚔️", "🌙", "⭐"], duration: 20, gridSize: 16, gridCols: 4 },
  "zombie-hunt": { targets: ["🧟", "💀", "🧠"], duration: 25, gridSize: 16, gridCols: 4 },
  "space-invader": { targets: ["👾", "🛸", "🌟", "💥"], duration: 20, gridSize: 16, gridCols: 4 },
  "bubble-pop": { targets: ["🫧", "🔵", "🟢", "🔴", "🟡"], duration: 25, gridSize: 12, gridCols: 4 },
  "fish-catch": { targets: ["🐟", "🐠", "🦈", "🐙", "💎"], duration: 25, gridSize: 12, gridCols: 4 },
  "balloon-pop": { targets: ["🎈", "🎈", "🎁", "⭐"], duration: 20, gridSize: 12, gridCols: 4 },
};

function getEngineType(gameId: string, categories: string[]): string {
  if (GAME_ENGINE_OVERRIDES[gameId]) return GAME_ENGINE_OVERRIDES[gameId];
  const priority = ["slots", "crash", "cards", "dice", "sports", "lottery", "arcade", "instant"];
  for (const cat of priority) {
    if (categories.includes(cat)) return cat;
  }
  return "instant";
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
  const theme = getGameTheme(game.id);
  const baseProps = { gameId: game.id, name: game.name, emoji: game.emoji, pointCost: game.pointCost, theme };

  const renderEngine = () => {
    switch (engineType) {
      case "slots":
        return <SlotsEngine {...baseProps} symbols={SLOT_THEMES[game.id]} />;
      case "crash":
        return <CrashEngine {...baseProps} visuals={getCrashVisuals(theme.variant)} />;
      case "cards":
        return <CardsEngine {...baseProps} />;
      case "dice": {
        const diceConfig = getDiceConfig(game.id);
        return <DiceEngine {...baseProps} diceCount={diceConfig.diceCount} targetRange={diceConfig.targetRange} />;
      }
      case "mines": {
        const mc = MINES_CONFIG[game.id] || { gridSize: 25, mineCount: 5 };
        return <MinesEngine {...baseProps} gridSize={mc.gridSize} mineCount={mc.mineCount} />;
      }
      case "wheel":
        return <WheelEngine {...baseProps} />;
      case "tower": {
        const tc = TOWER_CONFIG[game.id] || { floors: 8, doors: 3 };
        return <TowerEngine {...baseProps} floors={tc.floors} doorsPerFloor={tc.doors} />;
      }
      case "coinflip":
        return <CoinFlipEngine {...baseProps} sides={COINFLIP_SIDES[game.id]} />;
      case "reaction": {
        const rc = REACTION_CONFIG[game.id] || { targets: ["🎯", "⭐", "💎"], duration: 20, gridSize: 16, gridCols: 4 };
        return <ReactionEngine {...baseProps} targets={rc.targets} duration={rc.duration} gridSize={rc.gridSize} gridCols={rc.gridCols} />;
      }
      case "instant":
        return <InstantEngine {...baseProps} />;
      case "arcade":
        return <ArcadeEngine {...baseProps} />;
      case "lottery":
        return <LotteryEngine {...baseProps} />;
      case "sports": {
        const teams = getSportsTeams(game.id);
        return <SportsEngine {...baseProps} teams={teams} />;
      }
      default:
        return <InstantEngine {...baseProps} />;
    }
  };

  return (
    <GamePageLayout>
      {renderEngine()}
    </GamePageLayout>
  );
};

export default DynamicGame;
