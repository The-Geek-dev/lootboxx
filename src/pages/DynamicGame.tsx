import { useParams, useNavigate } from "react-router-dom";
import { useDepositGate } from "@/hooks/useDepositGate";
import GamePageLayout from "@/components/GamePageLayout";
import { allGames } from "@/config/gamesData";
import { getGameTheme, getSportsTeams, getDiceConfig, getCrashVisuals } from "@/config/gameThemes";
import {
  getEngineType, SLOT_THEMES, MINES_CONFIG, COINFLIP_SIDES, TOWER_CONFIG,
  REACTION_CONFIG, SCRATCH_PRIZES, RACE_CONFIGS, MATCH3_SYMBOLS,
  NUMBER_PICK_CONFIG, CATCHER_CONFIG
} from "@/config/engineConfig";
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
import MatchThreeEngine from "@/components/engines/MatchThreeEngine";
import NumberPickEngine from "@/components/engines/NumberPickEngine";
import HighLowEngine from "@/components/engines/HighLowEngine";
import CatcherEngine from "@/components/engines/CatcherEngine";
import QuickMathEngine from "@/components/engines/QuickMathEngine";
import { useEffect } from "react";

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
        const dc = getDiceConfig(game.id);
        return <DiceEngine {...baseProps} diceCount={dc.diceCount} targetRange={dc.targetRange} />;
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
      case "scratch":
        return <ScratchCardEngine {...baseProps} prizes={SCRATCH_PRIZES[game.id]} />;
      case "race":
        return <RaceEngine {...baseProps} racers={RACE_CONFIGS[game.id]} />;
      case "match3":
        return <MatchThreeEngine {...baseProps} symbols={MATCH3_SYMBOLS[game.id]} />;
      case "numberpick": {
        const nc = NUMBER_PICK_CONFIG[game.id] || { maxNumber: 49, pickCount: 6, drawCount: 6 };
        return <NumberPickEngine {...baseProps} maxNumber={nc.maxNumber} pickCount={nc.pickCount} drawCount={nc.drawCount} />;
      }
      case "highlow":
        return <HighLowEngine {...baseProps} />;
      case "catcher": {
        const cc = CATCHER_CONFIG[game.id] || { items: [{ emoji: "💎", points: 30 }, { emoji: "⭐", points: 20 }], badItems: ["💣"], duration: 25 };
        return <CatcherEngine {...baseProps} items={cc.items} badItems={cc.badItems} duration={cc.duration} />;
      }
      case "quickmath":
        return <QuickMathEngine {...baseProps} mode="math" />;
      case "quickword":
        return <QuickMathEngine {...baseProps} mode="word" />;
      case "quickcolor":
        return <QuickMathEngine {...baseProps} mode="color" />;
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
