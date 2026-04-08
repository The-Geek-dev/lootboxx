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
      // Create wallet if not exists
      await supabase.from("user_wallets").insert({ user_id: session.user.id });
      setBalance(0);
    }
    setLoading(false);
  };

  const updateBalance = async (amount: number) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const newBalance = balance + amount;
    if (newBalance < 0) return false;

    const { error } = await supabase
      .from("user_wallets")
      .update({ balance: newBalance })
      .eq("user_id", session.user.id);

    if (!error) {
      setBalance(newBalance);
      return true;
    }
    return false;
  };

  const recordGameResult = async (gameType: string, betAmount: number, winAmount: number, result: object) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await supabase.from("game_results").insert({
      user_id: session.user.id,
      game_type: gameType,
      bet_amount: betAmount,
      win_amount: winAmount,
      result,
    });

    // Update wallet totals
    if (winAmount > 0) {
      await supabase
        .from("user_wallets")
        .update({ total_won: balance + winAmount })
        .eq("user_id", session.user.id);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  return { balance, loading, updateBalance, recordGameResult, fetchBalance };
};
