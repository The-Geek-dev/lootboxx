-- Daily free bonus points (100/day, expire if unused)
ALTER TABLE public.user_wallets
  ADD COLUMN IF NOT EXISTS daily_bonus_points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_bonus_date date;

CREATE OR REPLACE FUNCTION public.claim_daily_bonus()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  v_today date := (now() AT TIME ZONE 'Africa/Lagos')::date;
  v_last date;
  v_prev_bonus int;
  v_points int;
  v_new_points int;
  v_granted int := 0;
  v_expired int := 0;
  c_daily constant int := 100;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT daily_bonus_date, daily_bonus_points, points
    INTO v_last, v_prev_bonus, v_points
  FROM public.user_wallets
  WHERE user_id = caller_id
  FOR UPDATE;

  IF v_last = v_today THEN
    RETURN jsonb_build_object('claimed', false, 'daily_bonus', v_prev_bonus, 'points', v_points);
  END IF;

  -- Expire any unused bonus from a previous day
  IF v_last IS NOT NULL AND v_last < v_today AND COALESCE(v_prev_bonus, 0) > 0 THEN
    v_expired := LEAST(v_prev_bonus, v_points);
  END IF;

  v_granted := c_daily;
  v_new_points := GREATEST(0, v_points - v_expired) + v_granted;

  UPDATE public.user_wallets
  SET points = v_new_points,
      daily_bonus_points = v_granted,
      daily_bonus_date = v_today,
      updated_at = now()
  WHERE user_id = caller_id;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (caller_id, '🎁 Daily Bonus!', 'You received 100 free points. Use them today or they expire!', 'bonus');

  RETURN jsonb_build_object(
    'claimed', true,
    'granted', v_granted,
    'expired', v_expired,
    'daily_bonus', v_granted,
    'points', v_new_points
  );
END;
$$;

-- Helper view: user's withdrawable winnings = total_won - (approved + pending withdrawals)
CREATE OR REPLACE FUNCTION public.get_winnings_balance()
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT GREATEST(0,
    COALESCE((SELECT total_won FROM public.user_wallets WHERE user_id = auth.uid()), 0)
    - COALESCE((SELECT SUM(amount) FROM public.withdrawals
                WHERE user_id = auth.uid()
                  AND status IN ('pending','approved','completed')), 0)
  );
$$;