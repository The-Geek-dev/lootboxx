import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useWallet = () => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("user_wallets")
      .select("balance")
      .eq("user_id", session.user.id)
      .single();

    if (data) {
      setBalance(Number(data.balance));
    } else {
      await supabase.from("user_wallets").insert({ user_id: session.user.id });
      setBalance(0);
    }
    setLoading(false);
  };

  // Local optimistic update only — server-side credits happen via apply_game_result RPC
  const updateBalance = async (amount: number) => {
    setBalance((b) => Math.max(0, b + amount));
    return true;
  };

  // Records the game result server-side: deducts points, credits balance, inserts game_results
  const recordGameResult = async (
    gameType: string,
    pointCost: number,
    winAmount: number,
    result: object,
  ) => {
    const { data, error } = await supabase.rpc("apply_game_result", {
      p_game_type: gameType,
      p_point_cost: pointCost,
      p_win_amount: winAmount,
      p_result: result as any,
    });

    if (error) {
      console.error("apply_game_result failed:", error);
      // Re-sync from server to undo optimistic UI
      await fetchBalance();
      return { success: false, error };
    }

    // Sync from RPC response
    if (data && typeof (data as any).balance === "number") {
      setBalance(Number((data as any).balance));
    } else {
      await fetchBalance();
    }

    // Update daily play streak (silent, fire-and-forget)
    supabase.rpc("record_play_streak").then(({ data: streakData, error: streakErr }) => {
      if (streakErr) console.warn("record_play_streak failed:", streakErr);
      else if ((streakData as any)?.bonus_points) {
        console.info(`Streak milestone! +${(streakData as any).bonus_points} pts`);
      }
    });

    return { success: true, data };
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return { balance, loading, updateBalance, recordGameResult, fetchBalance };
};
