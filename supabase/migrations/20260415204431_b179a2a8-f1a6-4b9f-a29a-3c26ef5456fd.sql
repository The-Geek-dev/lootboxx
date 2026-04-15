
CREATE OR REPLACE FUNCTION public.buy_xp_refill()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_id uuid;
  current_points integer;
  refill_cost integer := 500;
  max_lives integer := 10;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT points INTO current_points
  FROM user_wallets
  WHERE user_id = caller_id
  FOR UPDATE;

  IF current_points IS NULL OR current_points < refill_cost THEN
    RETURN false;
  END IF;

  UPDATE user_wallets
  SET xp_lives = max_lives,
      points = points - refill_cost,
      xp_last_refill_at = now(),
      updated_at = now()
  WHERE user_id = caller_id;

  RETURN true;
END;
$$;
