export type GameCategory = "top" | "popular" | "slots" | "cards" | "crash" | "dice" | "instant" | "arcade" | "lottery" | "sports" | "vip";

export interface GameItem {
  id: string;
  name: string;
  emoji: string;
  category: GameCategory[];
  path: string;
  isPlayable: boolean;
  color: string;
  isVip?: boolean;
  pointCost: number; // points per play
}

const categoryColors: Record<GameCategory, string[]> = {
  top: ["from-red-500 to-orange-500", "from-purple-500 to-pink-500", "from-blue-500 to-cyan-500", "from-green-500 to-emerald-500", "from-yellow-500 to-red-500", "from-indigo-500 to-purple-500"],
  popular: ["from-pink-500 to-rose-500", "from-amber-500 to-orange-500", "from-teal-500 to-green-500"],
  slots: ["from-red-600 to-red-400", "from-orange-500 to-yellow-400", "from-purple-600 to-purple-400"],
  cards: ["from-green-600 to-green-400", "from-blue-600 to-blue-400"],
  crash: ["from-cyan-500 to-blue-500", "from-sky-500 to-indigo-500"],
  dice: ["from-amber-500 to-yellow-400", "from-lime-500 to-green-400"],
  instant: ["from-fuchsia-500 to-pink-400", "from-violet-500 to-purple-400"],
  arcade: ["from-emerald-500 to-teal-400", "from-cyan-500 to-sky-400"],
  lottery: ["from-yellow-500 to-amber-400", "from-orange-500 to-red-400"],
  sports: ["from-blue-500 to-indigo-400", "from-green-500 to-teal-400"],
  vip: ["from-yellow-400 to-amber-600", "from-purple-600 to-pink-500", "from-red-600 to-yellow-500"],
};

const getColor = (cat: GameCategory, i: number) => {
  const colors = categoryColors[cat];
  return colors[i % colors.length];
};

export const allGames: GameItem[] = [
  // === PLAYABLE GAMES ===
  { id: "spin-wheel", name: "Spin the Wheel", emoji: "🎡", category: ["top", "popular", "instant"], path: "/games/spin-wheel", isPlayable: true, color: "from-purple-500 to-pink-500", pointCost: 20 },
  { id: "lucky-slots", name: "Lucky Slots", emoji: "🎰", category: ["top", "popular", "slots"], path: "/games/slots", isPlayable: true, color: "from-yellow-500 to-orange-500", pointCost: 20 },
  { id: "trivia-quiz", name: "Trivia Quiz", emoji: "🧠", category: ["top", "popular", "arcade"], path: "/games/trivia", isPlayable: true, color: "from-green-500 to-emerald-500", pointCost: 20 },
  { id: "raffle-draw", name: "Raffle Draw", emoji: "🎟️", category: ["top", "popular", "lottery"], path: "/games/raffle", isPlayable: true, color: "from-blue-500 to-cyan-500", pointCost: 50 },

  // === VIP GAMES (Coming Soon but marked VIP) ===
  { id: "aviator", name: "Aviator", emoji: "✈️", category: ["top", "crash", "vip"], path: "/games/play/path: "/games/play/aviator", isPlayable: true, color: "from-red-500 to-orange-500", isVip: true, pointCost: 100 },
  { id: "jet-rain", name: "Jet Rain", emoji: "🛩️", category: ["top", "crash", "vip"], path: "/games/play/path: "/games/play/jet-rain", isPlayable: true, color: "from-sky-500 to-blue-500", isVip: true, pointCost: 80 },
  { id: "diamond-rush", name: "Diamond Rush", emoji: "💎", category: ["slots", "vip"], path: "/games/play/path: "/games/play/diamond-rush", isPlayable: true, color: "from-cyan-400 to-blue-600", isVip: true, pointCost: 75 },
  { id: "royal-flush", name: "Royal Flush", emoji: "👑", category: ["cards", "vip"], path: "/games/play/path: "/games/play/royal-flush", isPlayable: true, color: "from-yellow-500 to-purple-500", isVip: true, pointCost: 100 },
  { id: "jackpot-city", name: "Jackpot City", emoji: "🏙️", category: ["slots", "vip"], path: "/games/play/path: "/games/play/jackpot-city", isPlayable: true, color: "from-purple-600 to-pink-400", isVip: true, pointCost: 100 },
  { id: "mega-millions", name: "Mega Millions", emoji: "💰", category: ["lottery", "vip"], path: "/games/play/path: "/games/play/mega-millions", isPlayable: true, color: "from-yellow-500 to-green-500", isVip: true, pointCost: 150 },
  { id: "plinko", name: "Plinko", emoji: "🔵", category: ["top", "instant", "vip"], path: "/games/play/path: "/games/play/plinko", isPlayable: true, color: "from-cyan-400 to-blue-500", isVip: true, pointCost: 60 },
  { id: "blackjack", name: "Blackjack", emoji: "🃏", category: ["cards", "vip"], path: "/games/play/path: "/games/play/blackjack", isPlayable: true, color: "from-green-700 to-green-500", isVip: true, pointCost: 80 },
  { id: "roulette", name: "Roulette", emoji: "🎰", category: ["cards", "vip"], path: "/games/play/path: "/games/play/roulette", isPlayable: true, color: "from-red-600 to-gray-800", isVip: true, pointCost: 100 },
  { id: "baccarat", name: "Baccarat", emoji: "🂡", category: ["cards", "vip"], path: "/games/play/path: "/games/play/baccarat", isPlayable: true, color: "from-blue-700 to-blue-400", isVip: true, pointCost: 80 },
  { id: "dragon-fortune", name: "Dragon Fortune", emoji: "🐉", category: ["slots", "vip"], path: "/games/play/path: "/games/play/dragon-fortune", isPlayable: true, color: "from-red-500 to-orange-400", isVip: true, pointCost: 75 },
  { id: "gold-rush", name: "Gold Rush", emoji: "🥇", category: ["instant", "vip"], path: "/games/play/path: "/games/play/gold-rush", isPlayable: true, color: "from-yellow-500 to-amber-300", isVip: true, pointCost: 60 },

  // === REGULAR COMING SOON GAMES ===
  { id: "fire-strike", name: "Fire Strike", emoji: "🔥", category: ["slots"], path: "/games/play/path: "/games/play/fire-strike", isPlayable: true, color: "from-red-600 to-orange-500", pointCost: 20 },
  { id: "red-black", name: "Red & Black", emoji: "♠️", category: ["cards", "popular"], path: "/games/play/path: "/games/play/red-black", isPlayable: true, color: "from-red-500 to-gray-800", pointCost: 20 },
  { id: "hot-burn", name: "Hot to Burn", emoji: "🌶️", category: ["slots", "popular"], path: "/games/play/path: "/games/play/hot-burn", isPlayable: true, color: "from-red-500 to-yellow-500", pointCost: 20 },
  { id: "rush", name: "Rush", emoji: "⚡", category: ["crash", "popular"], path: "/games/play/path: "/games/play/rush", isPlayable: true, color: "from-yellow-400 to-orange-500", pointCost: 25 },
  { id: "spin-match", name: "Spin & Match", emoji: "🎯", category: ["slots", "popular"], path: "/games/play/path: "/games/play/spin-match", isPlayable: true, color: "from-purple-500 to-pink-500", pointCost: 20 },
  { id: "dice-royale", name: "Dice Royale", emoji: "🎲", category: ["dice"], path: "/games/play/path: "/games/play/dice-royale", isPlayable: true, color: "from-amber-500 to-yellow-400", pointCost: 20 },
  { id: "coin-flip", name: "Coin Flip", emoji: "🪙", category: ["instant"], path: "/games/play/path: "/games/play/coin-flip", isPlayable: true, color: "from-yellow-500 to-amber-400", pointCost: 20 },
  { id: "poker-rush", name: "Poker Rush", emoji: "♦️", category: ["cards"], path: "/games/play/path: "/games/play/poker-rush", isPlayable: true, color: "from-red-600 to-red-400", pointCost: 30 },
  { id: "mega-wheel", name: "Mega Wheel", emoji: "🎰", category: ["instant", "popular"], path: "/games/play/path: "/games/play/mega-wheel", isPlayable: true, color: "from-pink-500 to-purple-500", pointCost: 25 },
  { id: "crash-x", name: "Crash X", emoji: "📈", category: ["crash"], path: "/games/play/path: "/games/play/crash-x", isPlayable: true, color: "from-green-500 to-cyan-500", pointCost: 25 },
  { id: "rocket-ride", name: "Rocket Ride", emoji: "🚀", category: ["crash"], path: "/games/play/path: "/games/play/rocket-ride", isPlayable: true, color: "from-indigo-500 to-purple-500", pointCost: 25 },
  { id: "space-crash", name: "Space Crash", emoji: "🌌", category: ["crash"], path: "/games/play/path: "/games/play/space-crash", isPlayable: true, color: "from-purple-700 to-indigo-500", pointCost: 25 },
  { id: "golden-dice", name: "Golden Dice", emoji: "🎲", category: ["dice"], path: "/games/play/path: "/games/play/golden-dice", isPlayable: true, color: "from-yellow-500 to-orange-400", pointCost: 20 },
  { id: "dice-duel", name: "Dice Duel", emoji: "🎯", category: ["dice"], path: "/games/play/path: "/games/play/dice-duel", isPlayable: true, color: "from-red-500 to-orange-400", pointCost: 20 },
  { id: "fruit-blast", name: "Fruit Blast", emoji: "🍎", category: ["slots"], path: "/games/play/path: "/games/play/fruit-blast", isPlayable: true, color: "from-green-500 to-red-500", pointCost: 20 },
  { id: "treasure-hunt", name: "Treasure Hunt", emoji: "🏴‍☠️", category: ["arcade"], path: "/games/play/path: "/games/play/treasure-hunt", isPlayable: true, color: "from-amber-600 to-yellow-400", pointCost: 20 },
  { id: "mine-field", name: "Mine Field", emoji: "💣", category: ["instant"], path: "/games/play/path: "/games/play/mine-field", isPlayable: true, color: "from-gray-600 to-gray-400", pointCost: 20 },
  { id: "tower-climb", name: "Tower Climb", emoji: "🏗️", category: ["instant"], path: "/games/play/path: "/games/play/tower-climb", isPlayable: true, color: "from-blue-500 to-indigo-500", pointCost: 20 },
  { id: "hi-lo", name: "Hi-Lo", emoji: "⬆️", category: ["cards", "instant"], path: "/games/play/path: "/games/play/hi-lo", isPlayable: true, color: "from-green-500 to-blue-500", pointCost: 20 },
  { id: "keno", name: "Keno", emoji: "🔢", category: ["lottery"], path: "/games/play/path: "/games/play/keno", isPlayable: true, color: "from-purple-500 to-pink-400", pointCost: 20 },
  { id: "scratch-card", name: "Scratch Card", emoji: "🃏", category: ["lottery", "instant"], path: "/games/play/path: "/games/play/scratch-card", isPlayable: true, color: "from-yellow-400 to-green-400", pointCost: 20 },
  { id: "lotto-6", name: "Lotto 6/49", emoji: "🎱", category: ["lottery"], path: "/games/play/path: "/games/play/lotto-6", isPlayable: true, color: "from-blue-500 to-purple-500", pointCost: 20 },
  { id: "number-game", name: "Number Game", emoji: "#️⃣", category: ["lottery"], path: "/games/play/path: "/games/play/number-game", isPlayable: true, color: "from-teal-500 to-cyan-400", pointCost: 20 },
  { id: "penalty-kick", name: "Penalty Kick", emoji: "⚽", category: ["sports"], path: "/games/play/path: "/games/play/penalty-kick", isPlayable: true, color: "from-green-600 to-green-400", pointCost: 20 },
  { id: "basketball-shot", name: "Basketball Shot", emoji: "🏀", category: ["sports"], path: "/games/play/path: "/games/play/basketball-shot", isPlayable: true, color: "from-orange-500 to-red-400", pointCost: 20 },
  { id: "horse-race", name: "Horse Race", emoji: "🏇", category: ["sports"], path: "/games/play/path: "/games/play/horse-race", isPlayable: true, color: "from-amber-600 to-green-500", pointCost: 25 },
  { id: "goal-glory", name: "Goal Glory", emoji: "🥅", category: ["sports"], path: "/games/play/path: "/games/play/goal-glory", isPlayable: true, color: "from-blue-500 to-green-500", pointCost: 20 },
  { id: "boxing-ring", name: "Boxing Ring", emoji: "🥊", category: ["sports"], path: "/games/play/path: "/games/play/boxing-ring", isPlayable: true, color: "from-red-600 to-red-400", pointCost: 20 },
  { id: "wild-west", name: "Wild West", emoji: "🤠", category: ["slots"], path: "/games/play/path: "/games/play/wild-west", isPlayable: true, color: "from-amber-700 to-yellow-500", pointCost: 20 },
  { id: "pharaoh-gold", name: "Pharaoh's Gold", emoji: "🏛️", category: ["slots"], path: "/games/play/path: "/games/play/pharaoh-gold", isPlayable: true, color: "from-yellow-600 to-amber-400", pointCost: 20 },
  { id: "ocean-treasure", name: "Ocean Treasure", emoji: "🐚", category: ["slots"], path: "/games/play/path: "/games/play/ocean-treasure", isPlayable: true, color: "from-blue-400 to-cyan-300", pointCost: 20 },
  { id: "mystic-gems", name: "Mystic Gems", emoji: "💠", category: ["slots"], path: "/games/play/path: "/games/play/mystic-gems", isPlayable: true, color: "from-purple-500 to-blue-500", pointCost: 20 },
  { id: "jungle-king", name: "Jungle King", emoji: "🦁", category: ["slots"], path: "/games/play/path: "/games/play/jungle-king", isPlayable: true, color: "from-green-600 to-yellow-500", pointCost: 20 },
  { id: "candy-pop", name: "Candy Pop", emoji: "🍬", category: ["slots", "arcade"], path: "/games/play/path: "/games/play/candy-pop", isPlayable: true, color: "from-pink-400 to-purple-400", pointCost: 20 },
  { id: "neon-lights", name: "Neon Lights", emoji: "💡", category: ["slots"], path: "/games/play/path: "/games/play/neon-lights", isPlayable: true, color: "from-fuchsia-500 to-cyan-400", pointCost: 20 },
  { id: "viking-saga", name: "Viking Saga", emoji: "⚔️", category: ["slots"], path: "/games/play/path: "/games/play/viking-saga", isPlayable: true, color: "from-gray-500 to-blue-500", pointCost: 20 },
  { id: "zeus-thunder", name: "Zeus Thunder", emoji: "⛈️", category: ["slots"], path: "/games/play/path: "/games/play/zeus-thunder", isPlayable: true, color: "from-yellow-400 to-blue-600", pointCost: 20 },
  { id: "moon-magic", name: "Moon Magic", emoji: "🌙", category: ["slots"], path: "/games/play/path: "/games/play/moon-magic", isPlayable: true, color: "from-indigo-600 to-purple-400", pointCost: 20 },
  { id: "lucky-7", name: "Lucky 7", emoji: "7️⃣", category: ["slots"], path: "/games/play/path: "/games/play/lucky-7", isPlayable: true, color: "from-red-500 to-yellow-400", pointCost: 20 },
  { id: "bubble-pop", name: "Bubble Pop", emoji: "🫧", category: ["arcade"], path: "/games/play/path: "/games/play/bubble-pop", isPlayable: true, color: "from-blue-300 to-cyan-200", pointCost: 20 },
  { id: "space-invader", name: "Space Invader", emoji: "👾", category: ["arcade"], path: "/games/play/path: "/games/play/space-invader", isPlayable: true, color: "from-green-400 to-lime-300", pointCost: 20 },
  { id: "pac-gold", name: "Pac Gold", emoji: "🟡", category: ["arcade"], path: "/games/play/path: "/games/play/pac-gold", isPlayable: true, color: "from-yellow-400 to-amber-300", pointCost: 20 },
  { id: "tetris-cash", name: "Tetris Cash", emoji: "🧱", category: ["arcade"], path: "/games/play/path: "/games/play/tetris-cash", isPlayable: true, color: "from-blue-500 to-red-400", pointCost: 20 },
  { id: "snake-ladder", name: "Snake & Ladder", emoji: "🐍", category: ["arcade"], path: "/games/play/path: "/games/play/snake-ladder", isPlayable: true, color: "from-green-500 to-yellow-400", pointCost: 20 },
  { id: "memory-match", name: "Memory Match", emoji: "🧩", category: ["arcade"], path: "/games/play/path: "/games/play/memory-match", isPlayable: true, color: "from-purple-400 to-pink-300", pointCost: 20 },
  { id: "word-hunt", name: "Word Hunt", emoji: "📝", category: ["arcade"], path: "/games/play/path: "/games/play/word-hunt", isPlayable: true, color: "from-teal-400 to-green-300", pointCost: 20 },
  { id: "math-blitz", name: "Math Blitz", emoji: "➕", category: ["arcade"], path: "/games/play/path: "/games/play/math-blitz", isPlayable: true, color: "from-blue-400 to-indigo-400", pointCost: 20 },
  { id: "color-guess", name: "Color Guess", emoji: "🎨", category: ["instant"], path: "/games/play/path: "/games/play/color-guess", isPlayable: true, color: "from-red-400 to-yellow-400", pointCost: 20 },
  { id: "wheel-fortune", name: "Wheel of Fortune", emoji: "🎪", category: ["instant"], path: "/games/play/path: "/games/play/wheel-fortune", isPlayable: true, color: "from-purple-500 to-yellow-400", pointCost: 20 },
  { id: "pick-3", name: "Pick 3", emoji: "3️⃣", category: ["lottery"], path: "/games/play/path: "/games/play/pick-3", isPlayable: true, color: "from-green-500 to-teal-400", pointCost: 20 },
  { id: "power-ball", name: "Power Ball", emoji: "🔴", category: ["lottery"], path: "/games/play/path: "/games/play/power-ball", isPlayable: true, color: "from-red-500 to-white", pointCost: 20 },
  { id: "daily-draw", name: "Daily Draw", emoji: "📅", category: ["lottery"], path: "/games/play/path: "/games/play/daily-draw", isPlayable: true, color: "from-blue-500 to-purple-400", pointCost: 20 },
  { id: "cricket-king", name: "Cricket King", emoji: "🏏", category: ["sports"], path: "/games/play/path: "/games/play/cricket-king", isPlayable: true, color: "from-green-500 to-lime-400", pointCost: 20 },
  { id: "tennis-ace", name: "Tennis Ace", emoji: "🎾", category: ["sports"], path: "/games/play/path: "/games/play/tennis-ace", isPlayable: true, color: "from-yellow-400 to-green-400", pointCost: 20 },
  { id: "racing-pro", name: "Racing Pro", emoji: "🏎️", category: ["sports"], path: "/games/play/path: "/games/play/racing-pro", isPlayable: true, color: "from-red-500 to-gray-600", pointCost: 20 },
  { id: "swimming-race", name: "Swimming Race", emoji: "🏊", category: ["sports"], path: "/games/play/path: "/games/play/swimming-race", isPlayable: true, color: "from-blue-400 to-cyan-300", pointCost: 20 },
  { id: "archery-gold", name: "Archery Gold", emoji: "🏹", category: ["sports"], path: "/games/play/path: "/games/play/archery-gold", isPlayable: true, color: "from-red-400 to-yellow-400", pointCost: 20 },
  { id: "sumo-slam", name: "Sumo Slam", emoji: "🤼", category: ["sports"], path: "/games/play/path: "/games/play/sumo-slam", isPlayable: true, color: "from-orange-500 to-red-500", pointCost: 20 },
  { id: "balloon-pop", name: "Balloon Pop", emoji: "🎈", category: ["instant", "arcade"], path: "/games/play/path: "/games/play/balloon-pop", isPlayable: true, color: "from-red-400 to-pink-400", pointCost: 20 },
  { id: "lucky-clover", name: "Lucky Clover", emoji: "🍀", category: ["instant"], path: "/games/play/path: "/games/play/lucky-clover", isPlayable: true, color: "from-green-500 to-emerald-400", pointCost: 20 },
  { id: "diamond-mine", name: "Diamond Mine", emoji: "⛏️", category: ["instant"], path: "/games/play/path: "/games/play/diamond-mine", isPlayable: true, color: "from-gray-500 to-cyan-400", pointCost: 20 },
  { id: "double-or-nothing", name: "Double or Nothing", emoji: "✌️", category: ["instant"], path: "/games/play/path: "/games/play/double-or-nothing", isPlayable: true, color: "from-green-500 to-red-500", pointCost: 20 },
  { id: "bingo-blast", name: "Bingo Blast", emoji: "🅱️", category: ["lottery", "arcade"], path: "/games/play/path: "/games/play/bingo-blast", isPlayable: true, color: "from-blue-500 to-yellow-400", pointCost: 20 },
  { id: "mystery-box", name: "Mystery Box", emoji: "📦", category: ["instant"], path: "/games/play/path: "/games/play/mystery-box", isPlayable: true, color: "from-gray-600 to-purple-500", pointCost: 20 },
  { id: "pirate-loot", name: "Pirate Loot", emoji: "☠️", category: ["slots", "arcade"], path: "/games/play/path: "/games/play/pirate-loot", isPlayable: true, color: "from-gray-700 to-red-500", pointCost: 20 },
  { id: "ninja-strike", name: "Ninja Strike", emoji: "🥷", category: ["arcade"], path: "/games/play/path: "/games/play/ninja-strike", isPlayable: true, color: "from-gray-700 to-gray-500", pointCost: 20 },
  { id: "zombie-hunt", name: "Zombie Hunt", emoji: "🧟", category: ["arcade"], path: "/games/play/path: "/games/play/zombie-hunt", isPlayable: true, color: "from-green-700 to-gray-600", pointCost: 20 },
  { id: "star-burst", name: "Star Burst", emoji: "⭐", category: ["slots"], path: "/games/play/path: "/games/play/star-burst", isPlayable: true, color: "from-yellow-400 to-purple-500", pointCost: 20 },
  { id: "thunder-strike", name: "Thunder Strike", emoji: "⚡", category: ["instant"], path: "/games/play/path: "/games/play/thunder-strike", isPlayable: true, color: "from-yellow-500 to-blue-500", pointCost: 20 },
  { id: "ice-cold", name: "Ice Cold", emoji: "🧊", category: ["slots"], path: "/games/play/path: "/games/play/ice-cold", isPlayable: true, color: "from-blue-300 to-cyan-200", pointCost: 20 },
  { id: "hot-pepper", name: "Hot Pepper", emoji: "🌶️", category: ["slots"], path: "/games/play/path: "/games/play/hot-pepper", isPlayable: true, color: "from-red-600 to-orange-400", pointCost: 20 },
  { id: "fortune-cat", name: "Fortune Cat", emoji: "🐱", category: ["instant"], path: "/games/play/path: "/games/play/fortune-cat", isPlayable: true, color: "from-yellow-400 to-red-400", pointCost: 20 },
  { id: "dragon-dice", name: "Dragon Dice", emoji: "🐲", category: ["dice"], path: "/games/play/path: "/games/play/dragon-dice", isPlayable: true, color: "from-red-500 to-green-500", pointCost: 20 },
  { id: "lucky-charm", name: "Lucky Charm", emoji: "🧿", category: ["instant"], path: "/games/play/path: "/games/play/lucky-charm", isPlayable: true, color: "from-blue-500 to-cyan-400", pointCost: 20 },
  { id: "safari-wild", name: "Safari Wild", emoji: "🦒", category: ["slots"], path: "/games/play/path: "/games/play/safari-wild", isPlayable: true, color: "from-amber-500 to-green-500", pointCost: 20 },
  { id: "cherry-bomb", name: "Cherry Bomb", emoji: "🍒", category: ["slots"], path: "/games/play/path: "/games/play/cherry-bomb", isPlayable: true, color: "from-red-500 to-pink-400", pointCost: 20 },
  { id: "magic-lamp", name: "Magic Lamp", emoji: "🪔", category: ["slots"], path: "/games/play/path: "/games/play/magic-lamp", isPlayable: true, color: "from-purple-500 to-yellow-400", pointCost: 20 },
  { id: "cash-grab", name: "Cash Grab", emoji: "💵", category: ["instant"], path: "/games/play/path: "/games/play/cash-grab", isPlayable: true, color: "from-green-500 to-emerald-300", pointCost: 20 },
  { id: "sic-bo", name: "Sic Bo", emoji: "🎲", category: ["dice"], path: "/games/play/path: "/games/play/sic-bo", isPlayable: true, color: "from-red-500 to-amber-400", pointCost: 20 },
  { id: "war-cards", name: "War Cards", emoji: "⚔️", category: ["cards"], path: "/games/play/path: "/games/play/war-cards", isPlayable: true, color: "from-gray-600 to-red-500", pointCost: 20 },
  { id: "fish-catch", name: "Fish Catch", emoji: "🐟", category: ["arcade"], path: "/games/play/path: "/games/play/fish-catch", isPlayable: true, color: "from-blue-400 to-green-300", pointCost: 20 },
  { id: "gem-collector", name: "Gem Collector", emoji: "💎", category: ["arcade"], path: "/games/play/path: "/games/play/gem-collector", isPlayable: true, color: "from-purple-400 to-cyan-400", pointCost: 20 },
  { id: "lava-flow", name: "Lava Flow", emoji: "🌋", category: ["crash"], path: "/games/play/path: "/games/play/lava-flow", isPlayable: true, color: "from-red-600 to-orange-400", pointCost: 25 },
  { id: "moon-lander", name: "Moon Lander", emoji: "🌕", category: ["crash"], path: "/games/play/path: "/games/play/moon-lander", isPlayable: true, color: "from-gray-500 to-yellow-300", pointCost: 25 },
  { id: "dice-master", name: "Dice Master", emoji: "🎯", category: ["dice"], path: "/games/play/path: "/games/play/dice-master", isPlayable: true, color: "from-green-500 to-yellow-400", pointCost: 20 },
];

export const categories: { key: GameCategory; label: string; emoji: string }[] = [
  { key: "top", label: "Top Games", emoji: "🔥" },
  { key: "vip", label: "VIP Games", emoji: "👑" },
  { key: "popular", label: "Popular", emoji: "⭐" },
  { key: "slots", label: "Slots", emoji: "🎰" },
  { key: "crash", label: "Crash Games", emoji: "📈" },
  { key: "cards", label: "Card Games", emoji: "🃏" },
  { key: "dice", label: "Dice Games", emoji: "🎲" },
  { key: "instant", label: "Instant Win", emoji: "⚡" },
  { key: "arcade", label: "Arcade", emoji: "🕹️" },
  { key: "lottery", label: "Lottery", emoji: "🎟️" },
  { key: "sports", label: "Sports", emoji: "⚽" },
];

export const getGamesByCategory = (cat: GameCategory): GameItem[] =>
  allGames.filter((g) => g.category.includes(cat));
