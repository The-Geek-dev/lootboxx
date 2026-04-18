// Engine routing and configuration for DynamicGame
import { GameTheme } from "@/config/gameThemes";

export const GAME_ENGINE_OVERRIDES: Record<string, string> = {
  "spin-wheel": "spin-wheel",
  "lucky-slots": "lucky-slots",
  "trivia-quiz": "trivia",
  "raffle-draw": "raffle",
  // Mines
  "mine-field": "mines",
  "diamond-mine": "mines",
  // Coin flip
  "coin-flip": "coinflip",
  "double-or-nothing": "coinflip",
  "cash-grab": "coinflip",
  // Wheel
  "mega-wheel": "wheel",
  "wheel-fortune": "wheel",
  // Tower / Plinko
  "tower-climb": "tower",
  "plinko": "plinko",
  // Roulette (dedicated engine)
  "roulette": "roulette",
  // Keno (dedicated engine)
  "keno": "keno",
  // Memory Match (dedicated engine)
  "memory-match": "memory",
  // Reaction tap
  "ninja-strike": "reaction",
  "zombie-hunt": "reaction",
  "space-invader": "reaction",
  "bubble-pop": "reaction",
  "fish-catch": "reaction",
  "balloon-pop": "reaction",
  // Scratch card
  "scratch-win": "scratch",
  "golden-ticket": "scratch",
  "lucky-scratch": "scratch",
  // Race
  "speed-race": "race",
  "horse-derby": "race",
  "rocket-race": "race",
  // Match Three (candy-crush style)
  "candy-pop": "match3",
  "fruit-blast": "match3",
  "mystic-gems": "match3",
  "ocean-treasure": "match3",
  "jungle-king": "match3",
  "cherry-bomb": "match3",
  // Number Pick (lottery-style)
  "keno": "numberpick",
  "lotto-6": "numberpick",
  "pick-3": "numberpick",
  "power-ball": "numberpick",
  "daily-draw": "numberpick",
  "number-game": "numberpick",
  "mega-millions": "numberpick",
  "bingo-blast": "numberpick",
  // High-Low card game
  "hi-lo": "highlow",
  "poker-rush": "highlow",
  "blackjack": "highlow",
  "baccarat": "highlow",
  "roulette": "highlow",
  "red-black": "highlow",
  "royal-flush": "highlow",
  // Catcher (falling items)
  "pac-gold": "catcher",
  "tetris-cash": "catcher",
  "treasure-hunt": "catcher",
  "snake-ladder": "catcher",
  "gold-rush": "catcher",
  // Quick Math / Word
  "math-blitz": "quickmath",
  "word-hunt": "quickword",
  "color-guess": "quickcolor",
  "memory-match": "arcade",
};

export interface SlotConfig {
  reelCount: number;        // 3, 4, or 5
  hasWild: boolean;         // wild symbol substitution
  hasBonus: boolean;        // bonus free-spin round
  spinStyle: "classic" | "cascade" | "avalanche" | "tumble";
}

export const SLOT_CONFIGS: Record<string, SlotConfig> = {
  "fire-strike":    { reelCount: 5, hasWild: true,  hasBonus: true,  spinStyle: "avalanche" },
  "hot-burn":       { reelCount: 4, hasWild: true,  hasBonus: false, spinStyle: "classic" },
  "wild-west":      { reelCount: 3, hasWild: true,  hasBonus: false, spinStyle: "classic" },
  "pharaoh-gold":   { reelCount: 5, hasWild: true,  hasBonus: true,  spinStyle: "tumble" },
  "mystic-gems":    { reelCount: 4, hasWild: true,  hasBonus: true,  spinStyle: "cascade" },
  "neon-lights":    { reelCount: 5, hasWild: false, hasBonus: true,  spinStyle: "cascade" },
  "viking-saga":    { reelCount: 4, hasWild: true,  hasBonus: false, spinStyle: "avalanche" },
  "zeus-thunder":   { reelCount: 5, hasWild: true,  hasBonus: true,  spinStyle: "tumble" },
  "moon-magic":     { reelCount: 3, hasWild: false, hasBonus: true,  spinStyle: "classic" },
  "lucky-7":        { reelCount: 3, hasWild: false, hasBonus: false, spinStyle: "classic" },
  "diamond-rush":   { reelCount: 4, hasWild: true,  hasBonus: true,  spinStyle: "cascade" },
  "jackpot-city":   { reelCount: 4, hasWild: true,  hasBonus: true,  spinStyle: "classic" },
  "dragon-fortune": { reelCount: 4, hasWild: true,  hasBonus: true,  spinStyle: "avalanche" },
  "star-burst":     { reelCount: 5, hasWild: true,  hasBonus: false, spinStyle: "tumble" },
  "ice-cold":       { reelCount: 3, hasWild: false, hasBonus: true,  spinStyle: "cascade" },
  "hot-pepper":     { reelCount: 3, hasWild: false, hasBonus: false, spinStyle: "classic" },
  "safari-wild":    { reelCount: 4, hasWild: true,  hasBonus: false, spinStyle: "avalanche" },
  "spin-match":     { reelCount: 3, hasWild: false, hasBonus: false, spinStyle: "classic" },
  "pirate-loot":    { reelCount: 5, hasWild: true,  hasBonus: true,  spinStyle: "tumble" },
  "magic-lamp":     { reelCount: 4, hasWild: true,  hasBonus: true,  spinStyle: "cascade" },
};

export const SLOT_THEMES: Record<string, string[]> = {
  "fire-strike": ["🔥", "💥", "⚡", "🌟", "💎", "7️⃣"],
  "hot-burn": ["🌶️", "🔥", "💰", "⭐", "🍒", "7️⃣"],
  "wild-west": ["🤠", "🐎", "💰", "🌵", "⭐", "🔫"],
  "pharaoh-gold": ["🏛️", "👁️", "💎", "🐍", "⭐", "🔮"],
  "mystic-gems": ["💠", "💎", "🔮", "⭐", "🌙", "✨"],
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
  "spin-match": ["🎯", "💎", "⭐", "🔥", "🍒", "7️⃣"],
  "pirate-loot": ["☠️", "🏴‍☠️", "💰", "💎", "⭐", "🗡️"],
  "magic-lamp": ["🪔", "🧞", "💎", "⭐", "👑", "✨"],
};

export const MINES_CONFIG: Record<string, { gridSize: number; mineCount: number }> = {
  "mine-field": { gridSize: 25, mineCount: 5 },
  "diamond-mine": { gridSize: 16, mineCount: 3 },
};

export const COINFLIP_SIDES: Record<string, [string, string]> = {
  "coin-flip": ["👑", "🌟"],
  "double-or-nothing": ["✅", "❌"],
  "cash-grab": ["💵", "💨"],
};

export const TOWER_CONFIG: Record<string, { floors: number; doors: number }> = {
  "tower-climb": { floors: 8, doors: 3 },
  "plinko": { floors: 6, doors: 4 },
};

export const REACTION_CONFIG: Record<string, { targets: string[]; duration: number; gridSize: number; gridCols: number }> = {
  "ninja-strike": { targets: ["🥷", "⚔️", "🌙", "⭐"], duration: 20, gridSize: 16, gridCols: 4 },
  "zombie-hunt": { targets: ["🧟", "💀", "🧠"], duration: 25, gridSize: 16, gridCols: 4 },
  "space-invader": { targets: ["👾", "🛸", "🌟", "💥"], duration: 20, gridSize: 16, gridCols: 4 },
  "bubble-pop": { targets: ["🫧", "🔵", "🟢", "🔴", "🟡"], duration: 25, gridSize: 12, gridCols: 4 },
  "fish-catch": { targets: ["🐟", "🐠", "🦈", "🐙", "💎"], duration: 25, gridSize: 12, gridCols: 4 },
  "balloon-pop": { targets: ["🎈", "🎈", "🎁", "⭐"], duration: 20, gridSize: 12, gridCols: 4 },
};

export const SCRATCH_PRIZES: Record<string, string[]> = {
  "scratch-win": ["💎x5", "⭐x3", "🍒x2", "💰x10", "🎯x4", "🔥x2", "👑x8", "💫x1", "🌟x3"],
  "golden-ticket": ["🎫x5", "👑x10", "💰x8", "🌟x3", "💎x6", "🏆x12", "⭐x2", "🎁x4", "✨x1"],
  "lucky-scratch": ["🍀x3", "🌈x5", "💵x4", "🎲x2", "🔔x6", "💎x8", "⭐x1", "🎯x3", "🍒x2"],
};

export const RACE_CONFIGS: Record<string, { emoji: string; name: string }[]> = {
  "speed-race": [{ emoji: "🏎️", name: "Red Fury" }, { emoji: "🏍️", name: "Blue Bolt" }, { emoji: "🚗", name: "Gold Rush" }, { emoji: "🚕", name: "Thunder" }],
  "horse-derby": [{ emoji: "🐎", name: "Storm" }, { emoji: "🦄", name: "Mystic" }, { emoji: "🐴", name: "Thunder" }, { emoji: "🏇", name: "Flash" }],
  "rocket-race": [{ emoji: "🚀", name: "Apollo" }, { emoji: "🛸", name: "Nebula" }, { emoji: "✈️", name: "Falcon" }, { emoji: "⚡", name: "Comet" }],
};

export const MATCH3_SYMBOLS: Record<string, string[]> = {
  "candy-pop": ["🍬", "🍭", "🍫", "🎂", "🍩", "🍪"],
  "fruit-blast": ["🍎", "🍊", "🍇", "🍋", "🍒", "🍓"],
  "mystic-gems": ["💠", "💎", "🔮", "✨", "🌙", "⭐"],
  "ocean-treasure": ["🐚", "🐟", "🦈", "💎", "🌊", "⭐"],
  "jungle-king": ["🦁", "🐘", "🍃", "💎", "🌴", "⭐"],
  "cherry-bomb": ["🍒", "💣", "💎", "⭐", "🔥", "7️⃣"],
};

export const NUMBER_PICK_CONFIG: Record<string, { maxNumber: number; pickCount: number; drawCount: number }> = {
  "keno": { maxNumber: 40, pickCount: 5, drawCount: 10 },
  "lotto-6": { maxNumber: 49, pickCount: 6, drawCount: 6 },
  "pick-3": { maxNumber: 20, pickCount: 3, drawCount: 3 },
  "power-ball": { maxNumber: 35, pickCount: 5, drawCount: 5 },
  "daily-draw": { maxNumber: 30, pickCount: 4, drawCount: 4 },
  "number-game": { maxNumber: 25, pickCount: 4, drawCount: 6 },
  "mega-millions": { maxNumber: 50, pickCount: 6, drawCount: 6 },
  "bingo-blast": { maxNumber: 25, pickCount: 5, drawCount: 8 },
};

export const CATCHER_CONFIG: Record<string, { items: { emoji: string; points: number }[]; badItems: string[]; duration: number }> = {
  "pac-gold": { items: [{ emoji: "🟡", points: 10 }, { emoji: "💰", points: 30 }, { emoji: "🍒", points: 20 }], badItems: ["👻"], duration: 25 },
  "tetris-cash": { items: [{ emoji: "🧱", points: 10 }, { emoji: "💎", points: 30 }, { emoji: "⭐", points: 20 }], badItems: ["💣", "🔴"], duration: 25 },
  "treasure-hunt": { items: [{ emoji: "💰", points: 20 }, { emoji: "💎", points: 30 }, { emoji: "👑", points: 40 }], badItems: ["☠️", "🐍"], duration: 30 },
  "snake-ladder": { items: [{ emoji: "🪜", points: 15 }, { emoji: "⭐", points: 25 }, { emoji: "🏆", points: 35 }], badItems: ["🐍", "💣"], duration: 25 },
  "gold-rush": { items: [{ emoji: "🥇", points: 20 }, { emoji: "💰", points: 30 }, { emoji: "💎", points: 40 }], badItems: ["🪨", "💣"], duration: 25 },
};

export function getEngineType(gameId: string, categories: string[]): string {
  if (GAME_ENGINE_OVERRIDES[gameId]) return GAME_ENGINE_OVERRIDES[gameId];
  const priority = ["slots", "crash", "cards", "dice", "sports", "lottery", "arcade", "instant"];
  for (const cat of priority) {
    if (categories.includes(cat)) return cat;
  }
  return "instant";
}
