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

      // Check if user is admin — admins bypass deposit gate
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      const { data } = await supabase
        .from("user_wallets")
        .select("is_activated")
        .eq("user_id", session.user.id)
        .single();

      if (!data || !data.is_activated) {
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
