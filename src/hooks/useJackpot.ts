import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useJackpot() {
  const [jackpotAmount, setJackpotAmount] = useState(10000);
  const [lastWonAmount, setLastWonAmount] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("progressive_jackpot")
        .select("current_amount, last_won_amount")
        .limit(1)
        .single();
      if (data) {
        setJackpotAmount(Number(data.current_amount));
        setLastWonAmount(Number(data.last_won_amount));
      }
    };
    fetch();

    // Poll every 10s for live feel
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, []);

  const contribute = useCallback(async (amount: number): Promise<{ won: boolean; winAmount: number }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { won: false, winAmount: 0 };

    const contribution = Math.max(1, Math.min(1000, Math.floor(amount * 0.02))); // 2% of bet goes to jackpot
    
    const { data, error } = await supabase.rpc("contribute_to_jackpot", {
      contribution,
    } as any);

    if (error || !data) return { won: false, winAmount: 0 };

    const result = data as { current_amount: number; won: boolean; win_amount: number };
    setJackpotAmount(result.current_amount);

    return { won: result.won, winAmount: result.win_amount };
  }, []);

  return { jackpotAmount, lastWonAmount, contribute };
}
