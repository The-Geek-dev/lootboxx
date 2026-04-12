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
import { useEffect } from "react";

const ENGINE_MAP: Record<string, string> = {
  slots: "slots", crash: "crash", cards: "cards", dice: "dice",
  instant: "instant", arcade: "arcade", lottery: "lottery", sports: "sports",
};

const GAME_ENGINE_OVERRIDES: Record<string, string> = {
  "spin-wheel": "spin-wheel", "lucky-slots": "lucky-slots",
  "trivia-quiz": "trivia", "raffle-draw": "raffle",
};

const SLOT_THEMES: Record<string, string[]> = {
  "fire-strike": ["\u{1F525}", "\u{1F4A5}", "\u26A1", "\u{1F31F}", "\u{1F48E}", "7\uFE0F\u20E3"],
  "hot-burn": ["\u{1F336}\uFE0F", "\u{1F525}", "\u{1F4B0}", "\u2B50", "\u{1F352}", "7\uFE0F\u20E3"],
  "wild-west": ["\u{1F920}", "\u{1F40E}", "\u{1F4B0}", "\u{1F335}", "\u2B50", "\u{1F52B}"],
  "pharaoh-gold": ["\u{1F3DB}\uFE0F", "\u{1F441}\uFE0F", "\u{1F48E}", "\u{1F40D}", "\u2B50", "\u{1F52E}"],
  "ocean-treasure": ["\u{1F41A}", "\u{1F41F}", "\u{1F988}", "\u{1F48E}", "\u2B50", "\u{1F30A}"],
  "mystic-gems": ["\u{1F4A0}", "\u{1F48E}", "\u{1F52E}", "\u2B50", "\u{1F319}", "\u2728"],
  "jungle-king": ["\u{1F981}", "\u{1F418}", "\u{1F343}", "\u{1F48E}", "\u2B50", "\u{1F334}"],
  "candy-pop": ["\u{1F36C}", "\u{1F36D}", "\u{1F36B}", "\u{1F382}", "\u2B50", "\u{1F369}"],
  "neon-lights": ["\u{1F4A1}", "\u{1F308}", "\u26A1", "\u{1F48E}", "\u2B50", "\u{1F386}"],
  "viking-saga": ["\u2694\uFE0F", "\u{1F6E1}\uFE0F", "\u{1F3F0}", "\u{1F48E}", "\u2B50", "\u26A1"],
  "zeus-thunder": ["\u26C8\uFE0F", "\u26A1", "\u{1F3DB}\uFE0F", "\u{1F48E}", "\u2B50", "\u{1F531}"],
  "moon-magic": ["\u{1F319}", "\u2728", "\u{1F52E}", "\u{1F48E}", "\u2B50", "\u{1F31F}"],
  "lucky-7": ["7\uFE0F\u20E3", "\u{1F352}", "\u{1F48E}", "\u2B50", "\u{1F514}", "\u{1F34B}"],
  "diamond-rush": ["\u{1F48E}", "\u{1F4B0}", "\u{1F451}", "\u2B50", "\u{1F525}", "\u2728"],
  "jackpot-city": ["\u{1F3D9}\uFE0F", "\u{1F4B0}", "\u{1F48E}", "7\uFE0F\u20E3", "\u2B50", "\u{1F3B0}"],
  "dragon-fortune": ["\u{1F409}", "\u{1F525}", "\u{1F48E}", "\u{1F451}", "\u2B50", "\u{1F3EE}"],
  "star-burst": ["\u2B50", "\u{1F4AB}", "\u2728", "\u{1F31F}", "\u{1F48E}", "\u{1F525}"],
  "ice-cold": ["\u{1F9CA}", "\u2744\uFE0F", "\u{1F48E}", "\u2B50", "\u{1F30A}", "\u2603\uFE0F"],
  "hot-pepper": ["\u{1F336}\uFE0F", "\u{1F525}", "\u{1F4B0}", "\u{1F48E}", "\u2B50", "7\uFE0F\u20E3"],
  "safari-wild": ["\u{1F992}", "\u{1F981}", "\u{1F418}", "\u{1F48E}", "\u2B50", "\u{1F334}"],
  "cherry-bomb": ["\u{1F352}", "\u{1F4A3}", "\u{1F48E}", "\u2B50", "\u{1F525}", "7\uFE0F\u20E3"],
  "magic-lamp": ["\u{1FA94}", "\u{1F9DE}", "\u{1F48E}", "\u2B50", "\u{1F451}", "\u2728"],
  "pirate-loot": ["\u2620\uFE0F", "\u{1F3F4}\u200D\u2620\uFE0F", "\u{1F4B0}", "\u{1F48E}", "\u2B50", "\u{1F5E1}\uFE0F"],
  "spin-match": ["\u{1F3AF}", "\u{1F48E}", "\u2B50", "\u{1F525}", "\u{1F352}", "7\uFE0F\u20E3"],
  "fruit-blast": ["\u{1F34E}", "\u{1F34A}", "\u{1F347}", "\u{1F34B}", "\u{1F352}", "\u{1F353}"],
};

function getEngineType(gameId: string, categories: string[]): string {
  if (GAME_ENGINE_OVERRIDES[gameId]) return GAME_ENGINE_OVERRIDES[gameId];
  const priority = ["slots", "crash", "cards", "dice", "sports", "lottery", "arcade", "instant"];
  for (const cat of priority) {
    if (categories.includes(cat)) return ENGINE_MAP[cat];
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
