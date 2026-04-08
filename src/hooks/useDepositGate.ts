import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const MIN_DEPOSIT = 7000;

export const useDepositGate = () => {
  // TEMPORARILY DISABLED FOR TESTING — re-enable before launch
  return { isAuthorized: true, isChecking: false };
};
