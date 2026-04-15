import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";

export const useDepositGate = () => {
  const navigate = useNavigate();
  const { isLaunched } = useLaunchStatus();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      if (!isLaunched) {
        // Pre-launch: allow all authenticated users to browse games
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Post-launch: check if user has activated wallet
      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("is_activated, coupon_expires_at")
        .eq("user_id", session.user.id)
        .single();

      if (wallet?.is_activated) {
        // Check if coupon is still valid
        if (wallet.coupon_expires_at && new Date(wallet.coupon_expires_at) > new Date()) {
          setIsAuthorized(true);
        } else {
          // Coupon expired, redirect to deposit for renewal
          navigate("/deposit");
          return;
        }
      } else {
        // Not activated, redirect to deposit
        navigate("/deposit");
        return;
      }

      setIsChecking(false);
    };

    check();
  }, [navigate, isLaunched]);

  return { isAuthorized, isChecking };
};
