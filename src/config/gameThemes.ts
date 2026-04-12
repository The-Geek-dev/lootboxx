// Per-game visual and gameplay customizations
// Each game gets unique colors, descriptions, icons, and layout variants

export interface GameTheme {
  bgGradient: string;        // card background gradient
  accentColor: string;       // accent for highlights
  description: string;       // unique subtitle
  variant?: string;          // engine-specific layout variant
  customIcons?: string[];    // custom icons/emojis for the game
  atmosphere?: string;       // ambient description shown during play
}

// CRASH GAMES - each has unique visuals and feel
const crashThemes: Record<string, GameTheme> = {
  aviator: {
    bgGradient: "from-red-950/80 to-orange-950/80",
    accentColor: "text-orange-400",
    description: "Fly high and cash out before the plane crashes!",
    variant: "plane",
    atmosphere: "Altitude rising...",
  },
  "jet-rain": {
    bgGradient: "from-sky-950/80 to-blue-950/80",
    accentColor: "text-sky-400",
    description: "Ride the jet stream to massive multipliers!",
    variant: "jet",
    atmosphere: "Accelerating...",
  },
  rush: {
    bgGradient: "from-yellow-950/80 to-orange-950/80",
    accentColor: "text-yellow-400",
    description: "Feel the rush! How far can you push it?",
    variant: "lightning",
    atmosphere: "Voltage increasing...",
  },
  "crash-x": {
    bgGradient: "from-green-950/80 to-cyan-950/80",
    accentColor: "text-emerald-400",
    description: "Watch the chart climb and sell before the crash!",
    variant: "chart",
    atmosphere: "Market pumping...",
  },
  "rocket-ride": {
    bgGradient: "from-indigo-950/80 to-purple-950/80",
    accentColor: "text-violet-400",
    description: "Launch into orbit and escape before re-entry!",
    variant: "rocket",
    atmosphere: "Orbit achieved...",
  },
  "space-crash": {
    bgGradient: "from-purple-950/80 to-indigo-950/80",
    accentColor: "text-purple-400",
    description: "Navigate through asteroid fields for big wins!",
    variant: "asteroid",
    atmosphere: "Deep space entry...",
  },
  "lava-flow": {
    bgGradient: "from-red-950/80 to-orange-900/80",
    accentColor: "text-red-400",
    description: "Outrun the lava flow for scorching multipliers!",
    variant: "lava",
    atmosphere: "Temperature rising...",
  },
  "moon-lander": {
    bgGradient: "from-gray-950/80 to-yellow-950/80",
    accentColor: "text-yellow-300",
    description: "Land safely on the moon before fuel runs out!",
    variant: "moon",
    atmosphere: "Fuel decreasing...",
  },
};

// SLOTS GAMES - unique symbols already handled, add visual themes
const slotsThemes: Record<string, GameTheme> = {
  "fire-strike": { bgGradient: "from-red-950/80 to-orange-950/80", accentColor: "text-orange-400", description: "Strike it hot with blazing reels!", variant: "fire" },
  "hot-burn": { bgGradient: "from-red-950/80 to-yellow-950/80", accentColor: "text-yellow-400", description: "Too hot to handle! Spin the inferno!", variant: "fire" },
  "wild-west": { bgGradient: "from-amber-950/80 to-yellow-950/80", accentColor: "text-amber-400", description: "Saddle up for Wild West riches!", variant: "western" },
  "pharaoh-gold": { bgGradient: "from-yellow-950/80 to-amber-950/80", accentColor: "text-yellow-500", description: "Uncover the Pharaoh's hidden treasures!", variant: "egypt" },
  "ocean-treasure": { bgGradient: "from-blue-950/80 to-cyan-950/80", accentColor: "text-cyan-400", description: "Dive deep for sunken riches!", variant: "ocean" },
  "mystic-gems": { bgGradient: "from-purple-950/80 to-blue-950/80", accentColor: "text-purple-400", description: "Unlock the power of mystic gemstones!", variant: "mystic" },
  "jungle-king": { bgGradient: "from-green-950/80 to-yellow-950/80", accentColor: "text-green-400", description: "Rule the jungle and claim your throne!", variant: "jungle" },
  "candy-pop": { bgGradient: "from-pink-950/80 to-purple-950/80", accentColor: "text-pink-400", description: "Sweet spins with candy-coated wins!", variant: "candy" },
  "neon-lights": { bgGradient: "from-fuchsia-950/80 to-cyan-950/80", accentColor: "text-fuchsia-400", description: "Light up the night with neon jackpots!", variant: "neon" },
  "viking-saga": { bgGradient: "from-gray-900/80 to-blue-950/80", accentColor: "text-blue-300", description: "Raid and plunder with Viking warriors!", variant: "viking" },
  "zeus-thunder": { bgGradient: "from-yellow-950/80 to-blue-950/80", accentColor: "text-yellow-300", description: "Feel the thunder of Zeus' power!", variant: "thunder" },
  "moon-magic": { bgGradient: "from-indigo-950/80 to-purple-950/80", accentColor: "text-indigo-400", description: "Moonlit spins reveal magical wins!", variant: "night" },
  "lucky-7": { bgGradient: "from-red-950/80 to-yellow-950/80", accentColor: "text-red-400", description: "Classic lucky sevens for retro wins!", variant: "classic" },
  "diamond-rush": { bgGradient: "from-cyan-950/80 to-blue-950/80", accentColor: "text-cyan-300", description: "Rush for diamonds in crystal caves!", variant: "crystal" },
  "jackpot-city": { bgGradient: "from-purple-950/80 to-pink-950/80", accentColor: "text-pink-400", description: "Hit the big city jackpot!", variant: "city" },
  "dragon-fortune": { bgGradient: "from-red-950/80 to-orange-950/80", accentColor: "text-red-400", description: "The dragon guards immense fortune!", variant: "dragon" },
  "star-burst": { bgGradient: "from-yellow-950/80 to-purple-950/80", accentColor: "text-yellow-400", description: "Cosmic star explosions bring mega wins!", variant: "cosmic" },
  "ice-cold": { bgGradient: "from-blue-950/80 to-cyan-950/80", accentColor: "text-cyan-300", description: "Frozen reels with icy rewards!", variant: "ice" },
  "hot-pepper": { bgGradient: "from-red-950/80 to-orange-950/80", accentColor: "text-red-500", description: "Spicy reels that burn with prizes!", variant: "fire" },
  "safari-wild": { bgGradient: "from-amber-950/80 to-green-950/80", accentColor: "text-amber-400", description: "Go wild on an African safari spin!", variant: "safari" },
  "cherry-bomb": { bgGradient: "from-red-950/80 to-pink-950/80", accentColor: "text-red-400", description: "Explosive cherry combos for big wins!", variant: "explosive" },
  "magic-lamp": { bgGradient: "from-purple-950/80 to-yellow-950/80", accentColor: "text-purple-400", description: "Rub the lamp and wish for riches!", variant: "magic" },
  "pirate-loot": { bgGradient: "from-gray-900/80 to-red-950/80", accentColor: "text-red-400", description: "Plunder the seas for pirate treasure!", variant: "pirate" },
  "spin-match": { bgGradient: "from-purple-950/80 to-pink-950/80", accentColor: "text-pink-400", description: "Spin and match for instant prizes!", variant: "match" },
  "fruit-blast": { bgGradient: "from-green-950/80 to-red-950/80", accentColor: "text-green-400", description: "Juicy fruit combos burst with flavor!", variant: "fruit" },
};

// CARDS GAMES - different card game mechanics
const cardsThemes: Record<string, GameTheme> = {
  "red-black": { bgGradient: "from-red-950/80 to-gray-900/80", accentColor: "text-red-400", description: "Red or Black? Simple but thrilling!", variant: "color-guess" },
  "poker-rush": { bgGradient: "from-red-950/80 to-red-900/80", accentColor: "text-red-500", description: "Rush through poker hands for big streaks!", variant: "poker" },
  "hi-lo": { bgGradient: "from-green-950/80 to-blue-950/80", accentColor: "text-green-400", description: "Will the next card be higher or lower?", variant: "classic" },
  "royal-flush": { bgGradient: "from-yellow-950/80 to-purple-950/80", accentColor: "text-yellow-400", description: "Chase the Royal Flush for royal rewards!", variant: "royal" },
  blackjack: { bgGradient: "from-green-950/80 to-green-900/80", accentColor: "text-emerald-400", description: "Get as close to 21 as you dare!", variant: "blackjack" },
  roulette: { bgGradient: "from-red-950/80 to-gray-900/80", accentColor: "text-red-500", description: "Place your bets on the spinning wheel!", variant: "roulette" },
  baccarat: { bgGradient: "from-blue-950/80 to-blue-900/80", accentColor: "text-blue-400", description: "Elegant baccarat with big payoffs!", variant: "baccarat" },
  "war-cards": { bgGradient: "from-gray-900/80 to-red-950/80", accentColor: "text-red-400", description: "Battle of the cards! Highest wins!", variant: "war" },
};

// DICE GAMES
const diceThemes: Record<string, GameTheme> = {
  "dice-royale": { bgGradient: "from-amber-950/80 to-yellow-950/80", accentColor: "text-amber-400", description: "Roll the dice for royal payouts!", variant: "classic" },
  "golden-dice": { bgGradient: "from-yellow-950/80 to-orange-950/80", accentColor: "text-yellow-400", description: "Golden dice bring golden fortunes!", variant: "golden" },
  "dice-duel": { bgGradient: "from-red-950/80 to-orange-950/80", accentColor: "text-red-400", description: "Duel against fate with every roll!", variant: "duel" },
  "dragon-dice": { bgGradient: "from-red-950/80 to-green-950/80", accentColor: "text-red-500", description: "The dragon's dice hold ancient power!", variant: "dragon" },
  "sic-bo": { bgGradient: "from-red-950/80 to-amber-950/80", accentColor: "text-amber-400", description: "Ancient Chinese dice game of chance!", variant: "sicbo" },
  "dice-master": { bgGradient: "from-green-950/80 to-yellow-950/80", accentColor: "text-green-400", description: "Master the dice with precision rolls!", variant: "master" },
};

// INSTANT WIN GAMES - different reveal mechanics
const instantThemes: Record<string, GameTheme> = {
  "coin-flip": { bgGradient: "from-yellow-950/80 to-amber-950/80", accentColor: "text-yellow-400", description: "Heads or Tails? Double or nothing!", variant: "coin", customIcons: ["🪙", "👑", "💰", "⭐", "🔥", "💎"] },
  "mega-wheel": { bgGradient: "from-pink-950/80 to-purple-950/80", accentColor: "text-pink-400", description: "Spin the mega wheel for mega prizes!", variant: "wheel", customIcons: ["🎯", "💎", "🌟", "🔥", "💰", "👑"] },
  plinko: { bgGradient: "from-cyan-950/80 to-blue-950/80", accentColor: "text-cyan-400", description: "Drop the ball and watch it bounce to prizes!", variant: "plinko", customIcons: ["🔵", "💎", "⭐", "🌟", "💰", "🔥"] },
  "mine-field": { bgGradient: "from-gray-900/80 to-gray-800/80", accentColor: "text-gray-300", description: "Navigate the minefield for hidden gems!", variant: "mines", customIcons: ["💣", "💎", "🔥", "⭐", "💰", "🌟"] },
  "tower-climb": { bgGradient: "from-blue-950/80 to-indigo-950/80", accentColor: "text-blue-400", description: "Climb the tower, each floor is riskier!", variant: "tower", customIcons: ["🏗\uFE0F", "⬆\uFE0F", "💎", "⭐", "🔥", "👑"] },
  "color-guess": { bgGradient: "from-red-950/80 to-yellow-950/80", accentColor: "text-yellow-400", description: "Pick the right color for instant cash!", variant: "colors", customIcons: ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠"] },
  "wheel-fortune": { bgGradient: "from-purple-950/80 to-yellow-950/80", accentColor: "text-purple-400", description: "Spin the legendary wheel of fortune!", variant: "fortune", customIcons: ["🎪", "💰", "👑", "💎", "⭐", "🔥"] },
  "gold-rush": { bgGradient: "from-yellow-950/80 to-amber-950/80", accentColor: "text-yellow-500", description: "Pan for gold nuggets in the wild west!", variant: "gold", customIcons: ["🥇", "💰", "⭐", "💎", "🔥", "🌟"] },
  "balloon-pop": { bgGradient: "from-red-950/80 to-pink-950/80", accentColor: "text-pink-400", description: "Pop balloons to reveal hidden prizes!", variant: "balloon", customIcons: ["🎈", "🎁", "💰", "⭐", "💎", "🔥"] },
  "lucky-clover": { bgGradient: "from-green-950/80 to-emerald-950/80", accentColor: "text-emerald-400", description: "Find the four-leaf clover for luck!", variant: "clover", customIcons: ["🍀", "🌟", "💎", "🔥", "💰", "⭐"] },
  "diamond-mine": { bgGradient: "from-gray-900/80 to-cyan-950/80", accentColor: "text-cyan-400", description: "Dig through the mine for precious gems!", variant: "mine", customIcons: ["\u26CF\uFE0F", "💎", "💰", "⭐", "🔥", "🌟"] },
  "double-or-nothing": { bgGradient: "from-green-950/80 to-red-950/80", accentColor: "text-green-400", description: "Risk it all! Double your win or lose everything!", variant: "double", customIcons: ["\u270C\uFE0F", "💰", "💎", "🔥", "⭐", "❌"] },
  "mystery-box": { bgGradient: "from-gray-900/80 to-purple-950/80", accentColor: "text-purple-400", description: "What's in the mystery box? Open to find out!", variant: "mystery", customIcons: ["📦", "🎁", "💎", "👑", "💰", "🌟"] },
  "thunder-strike": { bgGradient: "from-yellow-950/80 to-blue-950/80", accentColor: "text-yellow-400", description: "Lightning strikes bring electrifying prizes!", variant: "thunder", customIcons: ["\u26A1", "🌩\uFE0F", "💎", "💰", "⭐", "🔥"] },
  "fortune-cat": { bgGradient: "from-yellow-950/80 to-red-950/80", accentColor: "text-yellow-400", description: "The lucky cat beckons fortune your way!", variant: "cat", customIcons: ["🐱", "🏮", "💰", "💎", "⭐", "🎋"] },
  "lucky-charm": { bgGradient: "from-blue-950/80 to-cyan-950/80", accentColor: "text-blue-400", description: "Your lucky charm reveals hidden prizes!", variant: "charm", customIcons: ["🧿", "💎", "⭐", "💰", "🔥", "🌟"] },
  "cash-grab": { bgGradient: "from-green-950/80 to-emerald-950/80", accentColor: "text-green-400", description: "Grab as much cash as you can!", variant: "cash", customIcons: ["💵", "💰", "💎", "🤑", "💲", "🏦"] },
  "scratch-card": { bgGradient: "from-yellow-950/80 to-green-950/80", accentColor: "text-yellow-400", description: "Scratch and win instant prizes!", variant: "scratch", customIcons: ["🃏", "💰", "💎", "⭐", "🔥", "🎉"] },
};

// ARCADE GAMES - different game mechanics per game
const arcadeThemes: Record<string, GameTheme> = {
  "treasure-hunt": { bgGradient: "from-amber-950/80 to-yellow-950/80", accentColor: "text-amber-400", description: "Hunt for buried treasure on the map!", variant: "treasure", customIcons: ["🗺\uFE0F", "💰", "🏴\u200D\u2620\uFE0F", "💎", "⚓", "🔱"] },
  "bubble-pop": { bgGradient: "from-blue-950/80 to-cyan-950/80", accentColor: "text-cyan-300", description: "Pop matching bubbles before they overflow!", variant: "bubble", customIcons: ["\u{1FAE7}", "🔵", "🟢", "🔴", "🟡", "🟣"] },
  "space-invader": { bgGradient: "from-green-950/80 to-black", accentColor: "text-green-400", description: "Defend Earth from alien invaders!", variant: "space", customIcons: ["👾", "🛸", "⭐", "💥", "🔫", "🌍"] },
  "pac-gold": { bgGradient: "from-yellow-950/80 to-amber-950/80", accentColor: "text-yellow-400", description: "Collect gold coins and avoid the ghosts!", variant: "pac", customIcons: ["🟡", "👻", "💰", "🍒", "⭐", "💎"] },
  "tetris-cash": { bgGradient: "from-blue-950/80 to-red-950/80", accentColor: "text-blue-400", description: "Stack blocks and clear lines for cash!", variant: "tetris", customIcons: ["🧱", "🟦", "🟧", "🟩", "🟥", "🟨"] },
  "snake-ladder": { bgGradient: "from-green-950/80 to-yellow-950/80", accentColor: "text-green-400", description: "Climb ladders and avoid snakes to win!", variant: "snake", customIcons: ["🐍", "🪜", "🎲", "⭐", "💰", "🏆"] },
  "memory-match": { bgGradient: "from-purple-950/80 to-pink-950/80", accentColor: "text-purple-400", description: "Test your memory with matching pairs!", variant: "memory", customIcons: ["🧩", "💎", "🌟", "🔥", "💰", "👑"] },
  "word-hunt": { bgGradient: "from-teal-950/80 to-green-950/80", accentColor: "text-teal-400", description: "Find hidden words for bonus prizes!", variant: "word", customIcons: ["📝", "📖", "💡", "⭐", "💰", "🏆"] },
  "math-blitz": { bgGradient: "from-blue-950/80 to-indigo-950/80", accentColor: "text-blue-400", description: "Solve math puzzles against the clock!", variant: "math", customIcons: ["\u2795", "\u2796", "\u2716\uFE0F", "\u2797", "💯", "🧮"] },
  "ninja-strike": { bgGradient: "from-gray-900/80 to-gray-800/80", accentColor: "text-gray-300", description: "Strike fast like a shadow ninja!", variant: "ninja", customIcons: ["🥷", "⚔\uFE0F", "🌙", "💨", "⭐", "🔥"] },
  "zombie-hunt": { bgGradient: "from-green-950/80 to-gray-900/80", accentColor: "text-green-500", description: "Survive the zombie apocalypse!", variant: "zombie", customIcons: ["🧟", "🔫", "💀", "🧠", "💉", "🔥"] },
  "fish-catch": { bgGradient: "from-blue-950/80 to-green-950/80", accentColor: "text-blue-300", description: "Cast your net and catch rare fish!", variant: "fish", customIcons: ["🐟", "🐠", "🦈", "🐙", "🦀", "💎"] },
  "gem-collector": { bgGradient: "from-purple-950/80 to-cyan-950/80", accentColor: "text-purple-400", description: "Collect rare gems before time runs out!", variant: "gems", customIcons: ["💎", "💠", "🔮", "✨", "⭐", "👑"] },
  "candy-pop": { bgGradient: "from-pink-950/80 to-purple-950/80", accentColor: "text-pink-400", description: "Match colorful candies for sweet prizes!", variant: "candy", customIcons: ["🍬", "🍭", "🍫", "🎂", "🍩", "🍪"] },
};

// LOTTERY GAMES
const lotteryThemes: Record<string, GameTheme> = {
  keno: { bgGradient: "from-purple-950/80 to-pink-950/80", accentColor: "text-purple-400", description: "Pick your lucky numbers in Keno!" },
  "lotto-6": { bgGradient: "from-blue-950/80 to-purple-950/80", accentColor: "text-blue-400", description: "Match 6 numbers for the grand prize!" },
  "number-game": { bgGradient: "from-teal-950/80 to-cyan-950/80", accentColor: "text-teal-400", description: "Guess the winning number combination!" },
  "mega-millions": { bgGradient: "from-yellow-950/80 to-green-950/80", accentColor: "text-yellow-400", description: "Play for mega millions in prizes!" },
  "pick-3": { bgGradient: "from-green-950/80 to-teal-950/80", accentColor: "text-green-400", description: "Pick 3 lucky numbers to win!" },
  "power-ball": { bgGradient: "from-red-950/80 to-white/10", accentColor: "text-red-400", description: "Match the Power Ball for the jackpot!" },
  "daily-draw": { bgGradient: "from-blue-950/80 to-purple-950/80", accentColor: "text-blue-400", description: "Enter the daily draw for daily prizes!" },
  "bingo-blast": { bgGradient: "from-blue-950/80 to-yellow-950/80", accentColor: "text-blue-400", description: "Mark your card and shout BINGO!" },
};

// SPORTS GAMES - different sport types with unique team names
const sportsThemes: Record<string, GameTheme> = {
  "penalty-kick": { bgGradient: "from-green-950/80 to-green-900/80", accentColor: "text-green-400", description: "Score the winning penalty kick!", variant: "soccer", customIcons: ["\u26BD", "\u{1F945}"] },
  "basketball-shot": { bgGradient: "from-orange-950/80 to-red-950/80", accentColor: "text-orange-400", description: "Sink the buzzer-beater three-pointer!", variant: "basketball", customIcons: ["\u{1F3C0}", "\u{1F3C6}"] },
  "horse-race": { bgGradient: "from-amber-950/80 to-green-950/80", accentColor: "text-amber-400", description: "Bet on the winning horse!", variant: "horse", customIcons: ["\u{1F3C7}", "\u{1F3C6}"] },
  "goal-glory": { bgGradient: "from-blue-950/80 to-green-950/80", accentColor: "text-blue-400", description: "Lead your team to goal glory!", variant: "football", customIcons: ["\u{1F945}", "\u{1F3C6}"] },
  "boxing-ring": { bgGradient: "from-red-950/80 to-red-900/80", accentColor: "text-red-500", description: "Step into the ring and fight for gold!", variant: "boxing", customIcons: ["\u{1F94A}", "\u{1F3C6}"] },
  "cricket-king": { bgGradient: "from-green-950/80 to-lime-950/80", accentColor: "text-lime-400", description: "Smash a six and be the Cricket King!", variant: "cricket", customIcons: ["\u{1F3CF}", "\u{1F3C6}"] },
  "tennis-ace": { bgGradient: "from-yellow-950/80 to-green-950/80", accentColor: "text-yellow-400", description: "Serve an ace to win the match!", variant: "tennis", customIcons: ["\u{1F3BE}", "\u{1F3C6}"] },
  "racing-pro": { bgGradient: "from-red-950/80 to-gray-900/80", accentColor: "text-red-400", description: "Cross the finish line first!", variant: "racing", customIcons: ["\u{1F3CE}\uFE0F", "\u{1F3C1}"] },
  "swimming-race": { bgGradient: "from-blue-950/80 to-cyan-950/80", accentColor: "text-cyan-400", description: "Swim to victory in the pool!", variant: "swimming", customIcons: ["\u{1F3CA}", "\u{1F3C6}"] },
  "archery-gold": { bgGradient: "from-red-950/80 to-yellow-950/80", accentColor: "text-red-400", description: "Hit the bullseye for gold!", variant: "archery", customIcons: ["\u{1F3F9}", "\u{1F3AF}"] },
  "sumo-slam": { bgGradient: "from-orange-950/80 to-red-950/80", accentColor: "text-orange-500", description: "Slam your opponent out of the ring!", variant: "sumo", customIcons: ["\u{1F93C}", "\u{1F3C6}"] },
};

// Merge all themes
const allThemes: Record<string, GameTheme> = {
  ...crashThemes,
  ...slotsThemes,
  ...cardsThemes,
  ...diceThemes,
  ...instantThemes,
  ...arcadeThemes,
  ...lotteryThemes,
  ...sportsThemes,
};

export const getGameTheme = (gameId: string): GameTheme => {
  return allThemes[gameId] || {
    bgGradient: "from-card/80 to-card/60",
    accentColor: "text-primary",
    description: "Play and win exciting prizes!",
  };
};

// Sport-specific team names
export const getSportsTeams = (gameId: string): [{ icon: string; label: string }, { icon: string; label: string }] => {
  const teams: Record<string, [{ icon: string; label: string }, { icon: string; label: string }]> = {
    "penalty-kick": [{ icon: "\u26BD", label: "Eagles" }, { icon: "\u{1F945}", label: "Lions" }],
    "basketball-shot": [{ icon: "\u{1F3C0}", label: "Thunder" }, { icon: "\u{1F525}", label: "Blazers" }],
    "horse-race": [{ icon: "\u{1F434}", label: "Stallion" }, { icon: "\u{1F40E}", label: "Mustang" }],
    "goal-glory": [{ icon: "\u{1F535}", label: "City FC" }, { icon: "\u{1F534}", label: "United" }],
    "boxing-ring": [{ icon: "\u{1F94A}", label: "Tyson" }, { icon: "\u{1F4AA}", label: "Ali" }],
    "cricket-king": [{ icon: "\u{1F3CF}", label: "Royals" }, { icon: "\u{1F451}", label: "Kings" }],
    "tennis-ace": [{ icon: "\u{1F3BE}", label: "Federer" }, { icon: "\u{1F525}", label: "Nadal" }],
    "racing-pro": [{ icon: "\u{1F3CE}\uFE0F", label: "Ferrari" }, { icon: "\u{1F3C1}", label: "McLaren" }],
    "swimming-race": [{ icon: "\u{1F3CA}", label: "Dolphins" }, { icon: "\u{1F40B}", label: "Sharks" }],
    "archery-gold": [{ icon: "\u{1F3F9}", label: "Robin" }, { icon: "\u{1F3AF}", label: "Hawkeye" }],
    "sumo-slam": [{ icon: "\u{1F93C}", label: "Yokozuna" }, { icon: "\u{1F4AA}", label: "Ozeki" }],
  };
  return teams[gameId] || [{ icon: "\u{1F3E0}", label: "Home" }, { icon: "\u{1F3C3}", label: "Away" }];
};

// Dice game variants - different number of dice, targets etc.
export const getDiceConfig = (gameId: string): { diceCount: number; targetRange: number[]; label: string } => {
  const configs: Record<string, { diceCount: number; targetRange: number[]; label: string }> = {
    "dice-royale": { diceCount: 2, targetRange: [5, 6, 7, 8, 9], label: "Over or Under?" },
    "golden-dice": { diceCount: 2, targetRange: [4, 5, 6, 7, 8, 9, 10], label: "Golden guess!" },
    "dice-duel": { diceCount: 2, targetRange: [6, 7, 8], label: "Beat the dealer!" },
    "dragon-dice": { diceCount: 3, targetRange: [8, 9, 10, 11, 12], label: "Summon the dragon!" },
    "sic-bo": { diceCount: 3, targetRange: [9, 10, 11, 12], label: "Big or Small?" },
    "dice-master": { diceCount: 2, targetRange: [3, 4, 5, 6, 7, 8, 9, 10, 11], label: "Master the roll!" },
  };
  return configs[gameId] || { diceCount: 2, targetRange: [5, 6, 7, 8, 9], label: "Over or Under?" };
};

// Crash game visual elements per variant
export const getCrashVisuals = (variant?: string): { icon: string; trailEmoji: string; crashEmoji: string } => {
  const visuals: Record<string, { icon: string; trailEmoji: string; crashEmoji: string }> = {
    plane: { icon: "\u2708\uFE0F", trailEmoji: "\u2601\uFE0F", crashEmoji: "\u{1F4A5}" },
    jet: { icon: "\u{1F6E9}\uFE0F", trailEmoji: "\u{1F4A8}", crashEmoji: "\u{1F4A5}" },
    lightning: { icon: "\u26A1", trailEmoji: "\u{1F525}", crashEmoji: "\u{1F4A5}" },
    chart: { icon: "\u{1F4C8}", trailEmoji: "\u{1F4B0}", crashEmoji: "\u{1F4C9}" },
    rocket: { icon: "\u{1F680}", trailEmoji: "\u{1F31F}", crashEmoji: "\u{1F4A5}" },
    asteroid: { icon: "\u2604\uFE0F", trailEmoji: "\u{1F30C}", crashEmoji: "\u{1F4A5}" },
    lava: { icon: "\u{1F30B}", trailEmoji: "\u{1F525}", crashEmoji: "\u{1F4A5}" },
    moon: { icon: "\u{1F315}", trailEmoji: "\u2B50", crashEmoji: "\u{1F4A5}" },
  };
  return visuals[variant || ""] || visuals.plane;
};
