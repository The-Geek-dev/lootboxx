/**
 * Centralized payout configuration for ALL game engines.
 * Values can be overridden live via the admin Payout Tuner page,
 * which writes to the `payout_overrides` table. On app boot,
 * `loadPayoutOverrides()` is called and patches these objects in place.
 *
 * IMPORTANT: All exports are objects (no exported primitives) so that
 * mutations made by the loader are visible to every importer at call time.
 *
 * All values are in Naira (₦).
 */

import { supabase } from "@/integrations/supabase/client";

// ============================================================
// SLOT-STYLE GAMES
// ============================================================

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

export const SLOTS_ENGINE = {
  onePair: 300,
  twoPair: 800,
};

// ============================================================
// SCORE-BASED ARCADE GAMES
// ============================================================

export interface ScoreTier {
  minScore: number;
  payout: number;
}

export const REACTION_TIERS: ScoreTier[] = [
  { minScore: 200, payout: 8000 },
  { minScore: 150, payout: 5000 },
  { minScore: 100, payout: 2500 },
  { minScore: 50, payout: 1500 },
  { minScore: 20, payout: 500 },
];

export const SCORE_4_TIERS: ScoreTier[] = [
  { minScore: 300, payout: 8000 },
  { minScore: 200, payout: 5000 },
  { minScore: 100, payout: 2500 },
  { minScore: 50, payout: 1000 },
];

export const QUICK_MATH_TIERS: ScoreTier[] = [
  { minScore: 200, payout: 8000 },
  { minScore: 150, payout: 5000 },
  { minScore: 100, payout: 2500 },
  { minScore: 50, payout: 1000 },
];

export const getTierPayout = (score: number, tiers: ScoreTier[]): number => {
  for (const t of tiers) if (score >= t.minScore) return t.payout;
  return 0;
};

// ============================================================
// STREAK / PROGRESSION GAMES
// ============================================================

export const HIGHLOW_STREAK_TIERS: ScoreTier[] = [
  { minScore: 10, payout: 12000 },
  { minScore: 7, payout: 7000 },
  { minScore: 5, payout: 4000 },
  { minScore: 3, payout: 1500 },
  { minScore: 1, payout: 500 },
];

/** Cards (Hi-Lo card streak) — payout per streak step. Wrapped so the value is mutable across imports. */
export const CARDS = { perStreak: 350 };

// ============================================================
// LOTTERY / NUMBER PICK
// ============================================================

export const LOTTERY_PAYOUTS = [0, 300, 1500, 7000, 20000, 50000, 100000];

export const NUMBER_PICK = {
  full: 12000,
  oneOff: 5000,
  twoOff: 1500,
  twoMatch: 500,
};

// ============================================================
// SPORTS PREDICTION
// ============================================================

export const SPORTS_PAYOUTS = {
  bigMargin: 8000,
  midMargin: 4000,
  smallMargin: 2000,
};

// ============================================================
// ARCADE (memory-match style)
// ============================================================

export const ARCADE_PAYOUTS = {
  perfect: 5000,
  half: 1500,
  partial: 500,
  perfect16: 8000,
};

// ============================================================
// MULTIPLIER-BASED GAMES
// ============================================================

export const PAYOUT_COEF = {
  mines: 4,
  crash: 4,
  plinko: 4,
  tower: 4,
  scratchCard: 4,
  roulette: 2.2,
  keno: 2.2,
  rps: 2.5,
  memoryMatch: 2.5,
  race: 2.5,
  coinFlip: 1,
  blackjack: 2,
  limbo: 1,
  sicbo: 2,
};

/** CoinFlip uses pointCost * BASE^streak. Wrapped so it stays mutable. */
export const COINFLIP = { base: 3 };

export const WHEEL = { prizeMultiplier: 2.5 };

export const DICE_PAYOUTS = {
  bigDiff: 5000,
  midDiff: 2500,
  smallDiff: 1200,
  threeDiceBonus: 1.3,
};

export const INSTANT = { fullWinThreshold: 1000 };

// ============================================================
// Back-compat re-exports (older engines may import these names)
// ============================================================
export const COINFLIP_BASE = COINFLIP.base; // legacy primitive — kept for old imports
export const WHEEL_PRIZE_MULTIPLIER = WHEEL.prizeMultiplier;
export const CARDS_PER_STREAK = CARDS.perStreak;
export const INSTANT_FULL_WIN_THRESHOLD = INSTANT.fullWinThreshold;

// ============================================================
// Live override loader (admin Payout Tuner)
// ============================================================

/** Map of override key → mutable target object */
const OVERRIDE_TARGETS: Record<string, any> = {
  LUCKY_SLOTS,
  SLOTS_ENGINE,
  REACTION_TIERS,
  SCORE_4_TIERS,
  QUICK_MATH_TIERS,
  HIGHLOW_STREAK_TIERS,
  CARDS,
  LOTTERY_PAYOUTS,
  NUMBER_PICK,
  SPORTS_PAYOUTS,
  ARCADE_PAYOUTS,
  PAYOUT_COEF,
  COINFLIP,
  WHEEL,
  DICE_PAYOUTS,
  INSTANT,
};

/** Snapshot of the original (code-default) values, for "Reset to default" */
export const PAYOUT_DEFAULTS: Record<string, any> = JSON.parse(
  JSON.stringify(OVERRIDE_TARGETS)
);

/** Mutate a target in place so existing references see the new values */
function applyOverride(key: string, value: any) {
  const target = OVERRIDE_TARGETS[key];
  if (!target) return;
  if (Array.isArray(target) && Array.isArray(value)) {
    target.length = 0;
    for (const v of value) target.push(v);
  } else if (typeof target === "object" && typeof value === "object") {
    // Replace keys with override values
    for (const k of Object.keys(target)) delete target[k];
    Object.assign(target, value);
  }
}

let loaded = false;

/** Load all overrides from the DB and patch the in-memory objects. Safe to call multiple times. */
export async function loadPayoutOverrides(force = false): Promise<void> {
  if (loaded && !force) return;
  try {
    const { data, error } = await supabase
      .from("payout_overrides")
      .select("key, value");
    if (error) {
      console.warn("[payouts] override load failed:", error.message);
      return;
    }
    for (const row of data ?? []) applyOverride(row.key, row.value);
    loaded = true;
  } catch (e) {
    console.warn("[payouts] override load exception:", e);
  }
}

/** Returns a clone of the current (possibly overridden) value for a key */
export function getCurrentPayout(key: string): any {
  const t = OVERRIDE_TARGETS[key];
  return t ? JSON.parse(JSON.stringify(t)) : null;
}

/** Returns the list of all tunable keys */
export function getPayoutKeys(): string[] {
  return Object.keys(OVERRIDE_TARGETS);
}
