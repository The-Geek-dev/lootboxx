/**
 * Centralized payout configuration for ALL game engines.
 * Tune game economics from this single file.
 * All values are in Naira (₦).
 */

// ============================================================
// SLOT-STYLE GAMES
// ============================================================

/** Lucky Slots (src/pages/LuckySlots.tsx) — 3-reel emoji slot */
export const LUCKY_SLOTS = {
  combos: {
    "💎💎💎": 15000,
    "7️⃣7️⃣7️⃣": 10000,
    "⭐⭐⭐": 6000,
    "🔔🔔🔔": 4000,
    "🍒🍒🍒": 2000,
    "🍋🍋🍋": 1200,
  } as Record<string, number>,
  twoMatch: 300,
};

/** SlotsEngine (advanced multi-reel) — fallback payouts when no theme override */
export const SLOTS_ENGINE = {
  /** 1 pair on the reels */
  onePair: 300,
  /** 2 pairs on the reels */
  twoPair: 800,
};

// ============================================================
// SCORE-BASED ARCADE GAMES
// (Reaction, QuickMath, Catcher, MatchThree)
// ============================================================

export interface ScoreTier {
  /** Minimum score to qualify */
  minScore: number;
  /** Naira payout */
  payout: number;
}

/** Reaction-style games (tap targets) */
export const REACTION_TIERS: ScoreTier[] = [
  { minScore: 200, payout: 8000 },
  { minScore: 150, payout: 5000 },
  { minScore: 100, payout: 2500 },
  { minScore: 50, payout: 1500 },
  { minScore: 20, payout: 500 },
];

/** QuickMath / Catcher / MatchThree (4-tier score games) */
export const SCORE_4_TIERS: ScoreTier[] = [
  { minScore: 300, payout: 8000 },
  { minScore: 200, payout: 5000 },
  { minScore: 100, payout: 2500 },
  { minScore: 50, payout: 1000 },
];

/** QuickMath uses slightly different breakpoints (100/150/200) */
export const QUICK_MATH_TIERS: ScoreTier[] = [
  { minScore: 200, payout: 8000 },
  { minScore: 150, payout: 5000 },
  { minScore: 100, payout: 2500 },
  { minScore: 50, payout: 1000 },
];

/** Helper: returns the payout for a given score using a tier table */
export const getTierPayout = (score: number, tiers: ScoreTier[]): number => {
  for (const t of tiers) if (score >= t.minScore) return t.payout;
  return 0;
};

// ============================================================
// STREAK / PROGRESSION GAMES
// ============================================================

/** HighLow streak payouts */
export const HIGHLOW_STREAK_TIERS: ScoreTier[] = [
  { minScore: 10, payout: 12000 },
  { minScore: 7, payout: 7000 },
  { minScore: 5, payout: 4000 },
  { minScore: 3, payout: 1500 },
  { minScore: 1, payout: 500 },
];

/** Cards (Hi-Lo card streak) — payout per streak step */
export const CARDS_PER_STREAK = 350;

// ============================================================
// LOTTERY / NUMBER PICK
// ============================================================

/** Lottery payout by exact number of matches (index = match count) */
export const LOTTERY_PAYOUTS = [0, 300, 1500, 7000, 20000, 50000, 100000];

/** NumberPick payouts by match count relative to pickCount */
export const NUMBER_PICK = {
  full: 12000,           // matches >= pickCount
  oneOff: 5000,          // matches >= pickCount - 1
  twoOff: 1500,          // matches >= pickCount - 2
  twoMatch: 500,         // matches >= 2
};

// ============================================================
// SPORTS PREDICTION
// ============================================================

/** Sports betting payouts based on goal-difference (margin of victory) */
export const SPORTS_PAYOUTS = {
  bigMargin: 8000,    // |s1 - s2| >= 3
  midMargin: 4000,    // |s1 - s2| >= 2
  smallMargin: 2000,  // close win
};

// ============================================================
// ARCADE (memory-match style)
// ============================================================

/** ArcadeEngine match-ratio payouts */
export const ARCADE_PAYOUTS = {
  perfect: 5000,      // ratio >= 1
  half: 1500,         // ratio >= 0.5
  partial: 500,       // ratio > 0
  /** Bonus when fully solving the largest (16-tile) board */
  perfect16: 8000,
};

// ============================================================
// MULTIPLIER-BASED GAMES (Mines, Crash, Plinko, Tower, Roulette,
// Keno, RPS, MemoryMatch, ScratchCard, CoinFlip, Race, Dice, Wheel, Instant)
//
// These games already compute a per-round multiplier `mult` based on
// difficulty (probability, mines hit, crash point, picks, etc.).
// We only scale the FINAL cash-out — difficulty stays untouched.
// ============================================================

/**
 * Final payout coefficient applied AFTER difficulty-based multiplier.
 * Formula: winnings = floor(pointCost * mult * PAYOUT_COEF[game])
 * Bumping these gives bigger wins without making any game easier.
 */
export const PAYOUT_COEF = {
  mines: 4,         // was 2
  crash: 4,         // was 2
  plinko: 4,        // was 2
  tower: 4,         // was 2
  scratchCard: 4,   // was 2
  roulette: 2.2,    // was 1
  keno: 2.2,        // was 1
  rps: 2.5,         // was 1
  memoryMatch: 2.5, // was 1
  race: 2.5,        // was 1.5x racers
  coinFlip: 1,      // already exponential — see COINFLIP_BASE
};

/** CoinFlip uses pointCost * BASE^streak. Bigger base = bigger streak win. */
export const COINFLIP_BASE = 3; // was 2 (doubles per round → triples per round)

/** Wheel prize multiplier (applied to each segment.value) */
export const WHEEL_PRIZE_MULTIPLIER = 2.5;

/** Dice payout tiers (won + diff from target) */
export const DICE_PAYOUTS = {
  bigDiff: 5000,    // diff >= 4 (was 2000)
  midDiff: 2500,    // diff >= 2 (was 1000)
  smallDiff: 1200,  // close call (was 500)
  /** 3-dice multi-die bonus */
  threeDiceBonus: 1.3,
};

/** Instant scratch-style threshold for "big win" recordFullWin */
export const INSTANT_FULL_WIN_THRESHOLD = 1000;

