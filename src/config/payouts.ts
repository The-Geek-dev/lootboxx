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
