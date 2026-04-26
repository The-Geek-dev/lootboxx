import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const POINTS_TO_CASH_RATE = 2; // 5000 points = ₦2500, so 1 point = ₦0.5
const MIN_CONVERT_POINTS = 5000;

export const usePoints = () => {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPoints = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("user_wallets")
      .select("points")
      .eq("user_id", session.user.id)
      .single();

    if (data) setPoints(Number(data.points));
    setLoading(false);
  };

  useEffect(() => { fetchPoints(); }, []);

  // Optimistic local update — server-side credits/deductions are handled by RPCs
  // (apply_game_result for gameplay, convert_points_to_cash for conversions, edge functions for deposits)
  const addPoints = async (amount: number) => {
    setPoints((p) => Math.max(0, p + amount));
    return true;
  };

  // Optimistic local deduction. The actual point deduction is performed
  // server-side inside apply_game_result when the game records its result.
  const spendPoints = async (amount: number): Promise<boolean> => {
    if (points < amount) return false;
    setPoints((p) => p - amount);
    return true;
  };

  const convertToCash = async (): Promise<{ success: boolean; cashAmount: number }> => {
    if (points < MIN_CONVERT_POINTS) return { success: false, cashAmount: 0 };

    const { data, error } = await supabase.rpc("convert_points_to_cash");

    if (error || !data || !(data as any).success) {
      console.error("convert_points_to_cash failed:", error);
      await fetchPoints();
      return { success: false, cashAmount: 0 };
    }

    const result = data as any;
    setPoints(Number(result.points_remaining ?? 0));
    return { success: true, cashAmount: Number(result.cash_amount ?? 0) };
  };

  return {
    points,
    loading,
    addPoints,
    spendPoints,
    convertToCash,
    fetchPoints,
    minConvertPoints: MIN_CONVERT_POINTS,
    pointsToCashRate: POINTS_TO_CASH_RATE,
  };
};
