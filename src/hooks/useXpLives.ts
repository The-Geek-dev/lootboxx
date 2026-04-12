import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const MAX_LIVES = 10;
const REFILL_INTERVAL_MS = 4 * 60 * 60 * 1000; // 4 hours
const XP_REFILL_COST_POINTS = 500; // cost in points to buy a full refill

export const useXpLives = () => {
  const [xpLives, setXpLives] = useState(MAX_LIVES);
  const [nextRefillAt, setNextRefillAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);

  const fetchXp = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("user_wallets")
      .select("xp_lives, xp_last_refill_at, points")
      .eq("user_id", session.user.id)
      .single();

    if (data) {
      const lastRefill = new Date(data.xp_last_refill_at);
      const now = new Date();
      const elapsed = now.getTime() - lastRefill.getTime();
      const refillCycles = Math.floor(elapsed / REFILL_INTERVAL_MS);

      let currentLives = Number(data.xp_lives);
      if (refillCycles > 0 && currentLives < MAX_LIVES) {
        currentLives = MAX_LIVES;
        const newRefillTime = new Date(lastRefill.getTime() + refillCycles * REFILL_INTERVAL_MS);
        await supabase
          .from("user_wallets")
          .update({ xp_lives: MAX_LIVES, xp_last_refill_at: newRefillTime.toISOString() })
          .eq("user_id", session.user.id);
        setNextRefillAt(new Date(newRefillTime.getTime() + REFILL_INTERVAL_MS));
      } else {
        setNextRefillAt(new Date(lastRefill.getTime() + (refillCycles + 1) * REFILL_INTERVAL_MS));
      }

      setXpLives(currentLives);
      setPoints(Number(data.points));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchXp(); }, [fetchXp]);

  const consumeLife = async (): Promise<boolean> => {
    if (xpLives <= 0) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const newLives = xpLives - 1;
    const updates: any = { xp_lives: newLives };
    if (xpLives === MAX_LIVES) {
      // Start the refill timer from now
      updates.xp_last_refill_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("user_wallets")
      .update(updates)
      .eq("user_id", session.user.id);

    if (!error) {
      setXpLives(newLives);
      return true;
    }
    return false;
  };

  const buyRefill = async (): Promise<boolean> => {
    if (points < XP_REFILL_COST_POINTS) return false;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase
      .from("user_wallets")
      .update({
        xp_lives: MAX_LIVES,
        points: points - XP_REFILL_COST_POINTS,
        xp_last_refill_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id);

    if (!error) {
      setXpLives(MAX_LIVES);
      setPoints(points - XP_REFILL_COST_POINTS);
      return true;
    }
    return false;
  };

  return {
    xpLives,
    maxLives: MAX_LIVES,
    nextRefillAt,
    loading,
    points,
    consumeLife,
    buyRefill,
    refillCostPoints: XP_REFILL_COST_POINTS,
    fetchXp,
  };
};
