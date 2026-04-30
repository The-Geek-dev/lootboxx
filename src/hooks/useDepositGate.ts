import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLaunchStatus } from "@/hooks/useLaunchStatus";

export const useDepositGate = () => {
  const navigate = useNavigate();
  const { isLaunched } = useLaunchStatus();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [needsActivation, setNeedsActivation] = useState(false);
  const [activationReason, setActivationReason] = useState<"new" | "expired" | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // All authenticated users may browse the site freely.
      setIsAuthorized(true);

      if (!isLaunched) {
        setNeedsActivation(false);
        setIsChecking(false);
        return;
      }

      // Admins bypass activation entirely
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      if (isAdmin) {
        setNeedsActivation(false);
        setIsChecking(false);
        return;
      }

      const { data: wallet } = await supabase
        .from("user_wallets")
        .select("is_activated, coupon_expires_at")
        .eq("user_id", session.user.id)
        .single();

      if (!wallet?.is_activated) {
        setNeedsActivation(true);
        setActivationReason("new");
      } else if (
        wallet.coupon_expires_at &&
        new Date(wallet.coupon_expires_at) <= new Date()
      ) {
        setNeedsActivation(true);
        setActivationReason("expired");
      } else {
        setNeedsActivation(false);
        setActivationReason(null);
      }

      setIsChecking(false);
    };

    check();
  }, [navigate, isLaunched]);

  return { isAuthorized, isChecking, needsActivation, activationReason };
};
