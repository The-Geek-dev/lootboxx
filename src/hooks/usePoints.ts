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

  const addPoints = async (amount: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const newPoints = points + amount;
    const { error } = await supabase
      .from("user_wallets")
      .update({ points: newPoints })
      .eq("user_id", session.user.id);

    if (!error) {
      setPoints(newPoints);
      return true;
    }
    return false;
  };

  const convertToCash = async (): Promise<{ success: boolean; cashAmount: number }> => {
    if (points < MIN_CONVERT_POINTS) return { success: false, cashAmount: 0 };

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { success: false, cashAmount: 0 };

    const batchesOf5k = Math.floor(points / MIN_CONVERT_POINTS);
    const pointsToConvert = batchesOf5k * MIN_CONVERT_POINTS;
    const cashAmount = pointsToConvert / POINTS_TO_CASH_RATE;
    const remainingPoints = points - pointsToConvert;

    // Get current balance
    const { data: wallet } = await supabase
      .from("user_wallets")
      .select("balance")
      .eq("user_id", session.user.id)
      .single();

    if (!wallet) return { success: false, cashAmount: 0 };

    const { error } = await supabase
      .from("user_wallets")
      .update({
        points: remainingPoints,
        balance: Number(wallet.balance) + cashAmount,
      })
      .eq("user_id", session.user.id);

    if (!error) {
      setPoints(remainingPoints);
      return { success: true, cashAmount };
    }
    return { success: false, cashAmount: 0 };
  };

  return {
    points,
    loading,
    addPoints,
    convertToCash,
    fetchPoints,
    minConvertPoints: MIN_CONVERT_POINTS,
    pointsToCashRate: POINTS_TO_CASH_RATE,
  };
};
