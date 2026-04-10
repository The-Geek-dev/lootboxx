import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Win window: a random hour of the day (0-23) where full wins are possible
// Max 3 full wins per day
const MAX_FULL_WINS_PER_DAY = 3;

export const useWinRestrictions = () => {
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
    if (canFullyWin()) return originalWin;
    // Outside win window or max wins reached: reduce to 10-30% of original
    const reduction = 0.1 + Math.random() * 0.2;
    return Math.floor(originalWin * reduction);
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
