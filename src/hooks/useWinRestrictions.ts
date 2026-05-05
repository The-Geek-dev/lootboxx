import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Defaults — overridden by global_game_settings if set by admin
const DEFAULT_MAX_FULL_WINS_PER_DAY = 3;
const DEFAULT_WIN_WINDOW_RADIUS = 1;

export const useWinRestrictions = () => {
  const [adminSettings, setAdminSettings] = useState({
    win_rate_modifier: 1,
    payout_modifier: 1,
    max_full_wins_per_day: DEFAULT_MAX_FULL_WINS_PER_DAY,
    win_window_radius_hours: DEFAULT_WIN_WINDOW_RADIUS,
    is_active: false,
  });

  useEffect(() => {
    supabase.rpc("get_effective_game_settings").then(({ data }) => {
      if (data && data.length > 0) {
        const r = data[0];
        setAdminSettings({
          win_rate_modifier: Number(r.win_rate_modifier),
          payout_modifier: Number(r.payout_modifier),
          max_full_wins_per_day: Number(r.max_full_wins_per_day),
          win_window_radius_hours: Number(r.win_window_radius_hours),
          is_active: r.is_active,
        });
      }
    });
  }, []);
  const [winData, setWinData] = useState<{
    fullWinCount: number;
    winWindowHour: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWinData = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("daily_win_tracking")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("win_date", today)
      .maybeSingle();

    if (data) {
      setWinData({
        fullWinCount: data.full_win_count,
        winWindowHour: data.win_window_hour,
      });
    } else {
      // Create today's record with random win window hour
      const randomHour = Math.floor(Math.random() * 24);
      const { data: newData } = await supabase
        .from("daily_win_tracking")
        .insert({
          user_id: session.user.id,
          win_date: today,
          full_win_count: 0,
          win_window_hour: randomHour,
        })
        .select()
        .single();

      if (newData) {
        setWinData({
          fullWinCount: newData.full_win_count,
          winWindowHour: newData.win_window_hour,
        });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchWinData(); }, [fetchWinData]);

  const canFullyWin = (): boolean => {
    if (!winData) return false;
    // Admin override: win_rate_modifier of 0 means user can never fully win
    if (adminSettings.is_active && adminSettings.win_rate_modifier <= 0) return false;
    // Admin override: high win_rate_modifier (>=2) bypasses time/count restrictions
    if (adminSettings.is_active && adminSettings.win_rate_modifier >= 2) {
      return winData.fullWinCount < MAX_FULL_WINS_PER_DAY * 3;
    }
    const currentHour = new Date().getHours();
    const isInWindow = Math.abs(currentHour - winData.winWindowHour) <= 1; // ±1 hour window
    return isInWindow && winData.fullWinCount < MAX_FULL_WINS_PER_DAY;
  };

  const recordFullWin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !winData) return;

    const today = new Date().toISOString().split("T")[0];
    const newCount = winData.fullWinCount + 1;

    await supabase
      .from("daily_win_tracking")
      .update({ full_win_count: newCount })
      .eq("user_id", session.user.id)
      .eq("win_date", today);

    setWinData({ ...winData, fullWinCount: newCount });
  };

  // Reduce win amount if not in win window or max wins reached
  const adjustWinAmount = (originalWin: number): number => {
    if (originalWin <= 0) return 0;
    let amount: number;
    if (canFullyWin()) {
      amount = originalWin;
    } else {
      // Outside win window or max wins reached: reduce to 10-30% of original
      const reduction = 0.1 + Math.random() * 0.2;
      amount = Math.floor(originalWin * reduction);
    }
    // Apply admin payout modifier on top
    if (adminSettings.is_active) {
      amount = Math.round(amount * adminSettings.payout_modifier);
      // Apply win rate modifier as a probability gate: low modifier => chance to nullify win
      if (adminSettings.win_rate_modifier < 1) {
        if (Math.random() > adminSettings.win_rate_modifier) amount = 0;
      }
    }
    return Math.max(0, amount);
  };

  return {
    winData,
    loading,
    canFullyWin,
    recordFullWin,
    adjustWinAmount,
    maxFullWins: MAX_FULL_WINS_PER_DAY,
  };
};
