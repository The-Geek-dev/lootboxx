import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// Deposit gate is disabled during pre-launch. All authenticated users are authorized.
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
      // Pre-launch: skip deposit gate, allow all authenticated users
      setIsAuthorized(true);
      setIsChecking(false);
    };

    check();
  }, [navigate]);

  return { isAuthorized, isChecking };
};
