export type GameCategory = "top" | "popular" | "slots" | "cards" | "crash" | "dice" | "instant" | "arcade" | "lottery" | "sports";

export interface GameItem {
  id: string;
  name: string;
  emoji: string;
  category: GameCategory[];
  path: string;
  isPlayable: boolean;
  color: string;
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
};

const getColor = (cat: GameCategory, i: number) => {
  const colors = categoryColors[cat];
  return colors[i % colors.length];
};

export const allGames: GameItem[] = [
  // === PLAYABLE GAMES ===
  { id: "spin-wheel", name: "Spin the Wheel", emoji: "🎡", category: ["top", "popular", "instant"], path: "/games/spin-wheel", isPlayable: true, color: "from-purple-500 to-pink-500" },
  { id: "lucky-slots", name: "Lucky Slots", emoji: "🎰", category: ["top", "popular", "slots"], path: "/games/slots", isPlayable: true, color: "from-yellow-500 to-orange-500" },
  { id: "trivia-quiz", name: "Trivia Quiz", emoji: "🧠", category: ["top", "popular", "arcade"], path: "/games/trivia", isPlayable: true, color: "from-green-500 to-emerald-500" },
  { id: "raffle-draw", name: "Raffle Draw", emoji: "🎟️", category: ["top", "popular", "lottery"], path: "/games/raffle", isPlayable: true, color: "from-blue-500 to-cyan-500" },

  // === COMING SOON GAMES ===
  { id: "aviator", name: "Aviator", emoji: "✈️", category: ["top", "crash"], path: "#", isPlayable: false, color: "from-red-500 to-orange-500" },
  { id: "jet-rain", name: "Jet Rain", emoji: "🛩️", category: ["top", "crash"], path: "#", isPlayable: false, color: "from-sky-500 to-blue-500" },
  { id: "fire-strike", name: "Fire Strike", emoji: "🔥", category: ["slots"], path: "#", isPlayable: false, color: "from-red-600 to-orange-500" },
  { id: "red-black", name: "Red & Black", emoji: "♠️", category: ["cards", "popular"], path: "#", isPlayable: false, color: "from-red-500 to-gray-800" },
  { id: "plinko", name: "Plinko", emoji: "🔵", category: ["top", "instant"], path: "#", isPlayable: false, color: "from-cyan-400 to-blue-500" },
  { id: "hot-burn", name: "Hot to Burn", emoji: "🌶️", category: ["slots", "popular"], path: "#", isPlayable: false, color: "from-red-500 to-yellow-500" },
  { id: "rush", name: "Rush", emoji: "⚡", category: ["crash", "popular"], path: "#", isPlayable: false, color: "from-yellow-400 to-orange-500" },
  { id: "spin-match", name: "Spin & Match", emoji: "🎯", category: ["slots", "popular"], path: "#", isPlayable: false, color: "from-purple-500 to-pink-500" },
  { id: "dice-royale", name: "Dice Royale", emoji: "🎲", category: ["dice"], path: "#", isPlayable: false, color: "from-amber-500 to-yellow-400" },
  { id: "coin-flip", name: "Coin Flip", emoji: "🪙", category: ["instant"], path: "#", isPlayable: false, color: "from-yellow-500 to-amber-400" },
  { id: "blackjack", name: "Blackjack", emoji: "🃏", category: ["cards"], path: "#", isPlayable: false, color: "from-green-700 to-green-500" },
  { id: "poker-rush", name: "Poker Rush", emoji: "♦️", category: ["cards"], path: "#", isPlayable: false, color: "from-red-600 to-red-400" },
  { id: "baccarat", name: "Baccarat", emoji: "🂡", category: ["cards"], path: "#", isPlayable: false, color: "from-blue-700 to-blue-400" },
  { id: "mega-wheel", name: "Mega Wheel", emoji: "🎰", category: ["instant", "popular"], path: "#", isPlayable: false, color: "from-pink-500 to-purple-500" },
  { id: "crash-x", name: "Crash X", emoji: "📈", category: ["crash"], path: "#", isPlayable: false, color: "from-green-500 to-cyan-500" },
  { id: "rocket-ride", name: "Rocket Ride", emoji: "🚀", category: ["crash"], path: "#", isPlayable: false, color: "from-indigo-500 to-purple-500" },
  { id: "space-crash", name: "Space Crash", emoji: "🌌", category: ["crash"], path: "#", isPlayable: false, color: "from-purple-700 to-indigo-500" },
  { id: "golden-dice", name: "Golden Dice", emoji: "🎲", category: ["dice"], path: "#", isPlayable: false, color: "from-yellow-500 to-orange-400" },
  { id: "dice-duel", name: "Dice Duel", emoji: "🎯", category: ["dice"], path: "#", isPlayable: false, color: "from-red-500 to-orange-400" },
  { id: "fruit-blast", name: "Fruit Blast", emoji: "🍎", category: ["slots"], path: "#", isPlayable: false, color: "from-green-500 to-red-500" },
  { id: "diamond-rush", name: "Diamond Rush", emoji: "💎", category: ["slots"], path: "#", isPlayable: false, color: "from-cyan-400 to-blue-600" },
  { id: "treasure-hunt", name: "Treasure Hunt", emoji: "🏴‍☠️", category: ["arcade"], path: "#", isPlayable: false, color: "from-amber-600 to-yellow-400" },
  { id: "mine-field", name: "Mine Field", emoji: "💣", category: ["instant"], path: "#", isPlayable: false, color: "from-gray-600 to-gray-400" },
  { id: "tower-climb", name: "Tower Climb", emoji: "🏗️", category: ["instant"], path: "#", isPlayable: false, color: "from-blue-500 to-indigo-500" },
  { id: "hi-lo", name: "Hi-Lo", emoji: "⬆️", category: ["cards", "instant"], path: "#", isPlayable: false, color: "from-green-500 to-blue-500" },
  { id: "keno", name: "Keno", emoji: "🔢", category: ["lottery"], path: "#", isPlayable: false, color: "from-purple-500 to-pink-400" },
  { id: "scratch-card", name: "Scratch Card", emoji: "🃏", category: ["lottery", "instant"], path: "#", isPlayable: false, color: "from-yellow-400 to-green-400" },
  { id: "lotto-6", name: "Lotto 6/49", emoji: "🎱", category: ["lottery"], path: "#", isPlayable: false, color: "from-blue-500 to-purple-500" },
  { id: "number-game", name: "Number Game", emoji: "#️⃣", category: ["lottery"], path: "#", isPlayable: false, color: "from-teal-500 to-cyan-400" },
  { id: "penalty-kick", name: "Penalty Kick", emoji: "⚽", category: ["sports"], path: "#", isPlayable: false, color: "from-green-600 to-green-400" },
  { id: "basketball-shot", name: "Basketball Shot", emoji: "🏀", category: ["sports"], path: "#", isPlayable: false, color: "from-orange-500 to-red-400" },
  { id: "horse-race", name: "Horse Race", emoji: "🏇", category: ["sports"], path: "#", isPlayable: false, color: "from-amber-600 to-green-500" },
  { id: "goal-glory", name: "Goal Glory", emoji: "🥅", category: ["sports"], path: "#", isPlayable: false, color: "from-blue-500 to-green-500" },
  { id: "boxing-ring", name: "Boxing Ring", emoji: "🥊", category: ["sports"], path: "#", isPlayable: false, color: "from-red-600 to-red-400" },
  { id: "wild-west", name: "Wild West", emoji: "🤠", category: ["slots"], path: "#", isPlayable: false, color: "from-amber-700 to-yellow-500" },
  { id: "pharaoh-gold", name: "Pharaoh's Gold", emoji: "🏛️", category: ["slots"], path: "#", isPlayable: false, color: "from-yellow-600 to-amber-400" },
  { id: "ocean-treasure", name: "Ocean Treasure", emoji: "🐚", category: ["slots"], path: "#", isPlayable: false, color: "from-blue-400 to-cyan-300" },
  { id: "dragon-fortune", name: "Dragon Fortune", emoji: "🐉", category: ["slots"], path: "#", isPlayable: false, color: "from-red-500 to-orange-400" },
  { id: "mystic-gems", name: "Mystic Gems", emoji: "💠", category: ["slots"], path: "#", isPlayable: false, color: "from-purple-500 to-blue-500" },
  { id: "jungle-king", name: "Jungle King", emoji: "🦁", category: ["slots"], path: "#", isPlayable: false, color: "from-green-600 to-yellow-500" },
  { id: "candy-pop", name: "Candy Pop", emoji: "🍬", category: ["slots", "arcade"], path: "#", isPlayable: false, color: "from-pink-400 to-purple-400" },
  { id: "neon-lights", name: "Neon Lights", emoji: "💡", category: ["slots"], path: "#", isPlayable: false, color: "from-fuchsia-500 to-cyan-400" },
  { id: "viking-saga", name: "Viking Saga", emoji: "⚔️", category: ["slots"], path: "#", isPlayable: false, color: "from-gray-500 to-blue-500" },
  { id: "zeus-thunder", name: "Zeus Thunder", emoji: "⛈️", category: ["slots"], path: "#", isPlayable: false, color: "from-yellow-400 to-blue-600" },
  { id: "moon-magic", name: "Moon Magic", emoji: "🌙", category: ["slots"], path: "#", isPlayable: false, color: "from-indigo-600 to-purple-400" },
  { id: "lucky-7", name: "Lucky 7", emoji: "7️⃣", category: ["slots"], path: "#", isPlayable: false, color: "from-red-500 to-yellow-400" },
  { id: "bubble-pop", name: "Bubble Pop", emoji: "🫧", category: ["arcade"], path: "#", isPlayable: false, color: "from-blue-300 to-cyan-200" },
  { id: "space-invader", name: "Space Invader", emoji: "👾", category: ["arcade"], path: "#", isPlayable: false, color: "from-green-400 to-lime-300" },
  { id: "pac-gold", name: "Pac Gold", emoji: "🟡", category: ["arcade"], path: "#", isPlayable: false, color: "from-yellow-400 to-amber-300" },
  { id: "tetris-cash", name: "Tetris Cash", emoji: "🧱", category: ["arcade"], path: "#", isPlayable: false, color: "from-blue-500 to-red-400" },
  { id: "snake-ladder", name: "Snake & Ladder", emoji: "🐍", category: ["arcade"], path: "#", isPlayable: false, color: "from-green-500 to-yellow-400" },
  { id: "memory-match", name: "Memory Match", emoji: "🧩", category: ["arcade"], path: "#", isPlayable: false, color: "from-purple-400 to-pink-300" },
  { id: "word-hunt", name: "Word Hunt", emoji: "📝", category: ["arcade"], path: "#", isPlayable: false, color: "from-teal-400 to-green-300" },
  { id: "math-blitz", name: "Math Blitz", emoji: "➕", category: ["arcade"], path: "#", isPlayable: false, color: "from-blue-400 to-indigo-400" },
  { id: "color-guess", name: "Color Guess", emoji: "🎨", category: ["instant"], path: "#", isPlayable: false, color: "from-red-400 to-yellow-400" },
  { id: "wheel-fortune", name: "Wheel of Fortune", emoji: "🎪", category: ["instant"], path: "#", isPlayable: false, color: "from-purple-500 to-yellow-400" },
  { id: "pick-3", name: "Pick 3", emoji: "3️⃣", category: ["lottery"], path: "#", isPlayable: false, color: "from-green-500 to-teal-400" },
  { id: "mega-millions", name: "Mega Millions", emoji: "💰", category: ["lottery"], path: "#", isPlayable: false, color: "from-yellow-500 to-green-500" },
  { id: "power-ball", name: "Power Ball", emoji: "🔴", category: ["lottery"], path: "#", isPlayable: false, color: "from-red-500 to-white" },
  { id: "daily-draw", name: "Daily Draw", emoji: "📅", category: ["lottery"], path: "#", isPlayable: false, color: "from-blue-500 to-purple-400" },
  { id: "cricket-king", name: "Cricket King", emoji: "🏏", category: ["sports"], path: "#", isPlayable: false, color: "from-green-500 to-lime-400" },
  { id: "tennis-ace", name: "Tennis Ace", emoji: "🎾", category: ["sports"], path: "#", isPlayable: false, color: "from-yellow-400 to-green-400" },
  { id: "racing-pro", name: "Racing Pro", emoji: "🏎️", category: ["sports"], path: "#", isPlayable: false, color: "from-red-500 to-gray-600" },
  { id: "swimming-race", name: "Swimming Race", emoji: "🏊", category: ["sports"], path: "#", isPlayable: false, color: "from-blue-400 to-cyan-300" },
  { id: "archery-gold", name: "Archery Gold", emoji: "🏹", category: ["sports"], path: "#", isPlayable: false, color: "from-red-400 to-yellow-400" },
  { id: "sumo-slam", name: "Sumo Slam", emoji: "🤼", category: ["sports"], path: "#", isPlayable: false, color: "from-orange-500 to-red-500" },
  { id: "balloon-pop", name: "Balloon Pop", emoji: "🎈", category: ["instant", "arcade"], path: "#", isPlayable: false, color: "from-red-400 to-pink-400" },
  { id: "lucky-clover", name: "Lucky Clover", emoji: "🍀", category: ["instant"], path: "#", isPlayable: false, color: "from-green-500 to-emerald-400" },
  { id: "diamond-mine", name: "Diamond Mine", emoji: "⛏️", category: ["instant"], path: "#", isPlayable: false, color: "from-gray-500 to-cyan-400" },
  { id: "gold-rush", name: "Gold Rush", emoji: "🥇", category: ["instant"], path: "#", isPlayable: false, color: "from-yellow-500 to-amber-300" },
  { id: "double-or-nothing", name: "Double or Nothing", emoji: "✌️", category: ["instant"], path: "#", isPlayable: false, color: "from-green-500 to-red-500" },
  { id: "roulette", name: "Roulette", emoji: "🎰", category: ["cards"], path: "#", isPlayable: false, color: "from-red-600 to-gray-800" },
  { id: "bingo-blast", name: "Bingo Blast", emoji: "🅱️", category: ["lottery", "arcade"], path: "#", isPlayable: false, color: "from-blue-500 to-yellow-400" },
  { id: "jackpot-city", name: "Jackpot City", emoji: "🏙️", category: ["slots"], path: "#", isPlayable: false, color: "from-purple-600 to-pink-400" },
  { id: "royal-flush", name: "Royal Flush", emoji: "👑", category: ["cards"], path: "#", isPlayable: false, color: "from-yellow-500 to-purple-500" },
  { id: "mystery-box", name: "Mystery Box", emoji: "📦", category: ["instant"], path: "#", isPlayable: false, color: "from-gray-600 to-purple-500" },
  { id: "pirate-loot", name: "Pirate Loot", emoji: "☠️", category: ["slots", "arcade"], path: "#", isPlayable: false, color: "from-gray-700 to-red-500" },
  { id: "ninja-strike", name: "Ninja Strike", emoji: "🥷", category: ["arcade"], path: "#", isPlayable: false, color: "from-gray-700 to-gray-500" },
  { id: "zombie-hunt", name: "Zombie Hunt", emoji: "🧟", category: ["arcade"], path: "#", isPlayable: false, color: "from-green-700 to-gray-600" },
  { id: "star-burst", name: "Star Burst", emoji: "⭐", category: ["slots"], path: "#", isPlayable: false, color: "from-yellow-400 to-purple-500" },
  { id: "thunder-strike", name: "Thunder Strike", emoji: "⚡", category: ["instant"], path: "#", isPlayable: false, color: "from-yellow-500 to-blue-500" },
  { id: "ice-cold", name: "Ice Cold", emoji: "🧊", category: ["slots"], path: "#", isPlayable: false, color: "from-blue-300 to-cyan-200" },
  { id: "hot-pepper", name: "Hot Pepper", emoji: "🌶️", category: ["slots"], path: "#", isPlayable: false, color: "from-red-600 to-orange-400" },
  { id: "fortune-cat", name: "Fortune Cat", emoji: "🐱", category: ["instant"], path: "#", isPlayable: false, color: "from-yellow-400 to-red-400" },
  { id: "dragon-dice", name: "Dragon Dice", emoji: "🐲", category: ["dice"], path: "#", isPlayable: false, color: "from-red-500 to-green-500" },
  { id: "lucky-charm", name: "Lucky Charm", emoji: "🧿", category: ["instant"], path: "#", isPlayable: false, color: "from-blue-500 to-cyan-400" },
  { id: "safari-wild", name: "Safari Wild", emoji: "🦒", category: ["slots"], path: "#", isPlayable: false, color: "from-amber-500 to-green-500" },
  { id: "cherry-bomb", name: "Cherry Bomb", emoji: "🍒", category: ["slots"], path: "#", isPlayable: false, color: "from-red-500 to-pink-400" },
  { id: "magic-lamp", name: "Magic Lamp", emoji: "🪔", category: ["slots"], path: "#", isPlayable: false, color: "from-purple-500 to-yellow-400" },
  { id: "cash-grab", name: "Cash Grab", emoji: "💵", category: ["instant"], path: "#", isPlayable: false, color: "from-green-500 to-emerald-300" },
  { id: "sic-bo", name: "Sic Bo", emoji: "🎲", category: ["dice"], path: "#", isPlayable: false, color: "from-red-500 to-amber-400" },
  { id: "war-cards", name: "War Cards", emoji: "⚔️", category: ["cards"], path: "#", isPlayable: false, color: "from-gray-600 to-red-500" },
  { id: "fish-catch", name: "Fish Catch", emoji: "🐟", category: ["arcade"], path: "#", isPlayable: false, color: "from-blue-400 to-green-300" },
  { id: "gem-collector", name: "Gem Collector", emoji: "💎", category: ["arcade"], path: "#", isPlayable: false, color: "from-purple-400 to-cyan-400" },
  { id: "lava-flow", name: "Lava Flow", emoji: "🌋", category: ["crash"], path: "#", isPlayable: false, color: "from-red-600 to-orange-400" },
  { id: "moon-lander", name: "Moon Lander", emoji: "🌕", category: ["crash"], path: "#", isPlayable: false, color: "from-gray-500 to-yellow-300" },
  { id: "dice-master", name: "Dice Master", emoji: "🎯", category: ["dice"], path: "#", isPlayable: false, color: "from-green-500 to-yellow-400" },
];

export const categories: { key: GameCategory; label: string; emoji: string }[] = [
  { key: "top", label: "Top Games", emoji: "🔥" },
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
