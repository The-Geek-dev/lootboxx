import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const MIN_DEPOSIT = 7000;

export const useDepositGate = () => {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data } = await supabase
        .from("user_wallets")
        .select("total_deposited")
        .eq("user_id", session.user.id)
        .single();

      if (!data || Number(data.total_deposited) < MIN_DEPOSIT) {
        navigate("/deposit", { state: { gated: true } });
        return;
      }

      setIsAuthorized(true);
      setIsChecking(false);
    };

    check();
  }, [navigate]);

  return { isAuthorized, isChecking };
};
