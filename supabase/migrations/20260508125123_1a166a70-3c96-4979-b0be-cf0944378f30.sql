-- Cooldown timestamp
ALTER TABLE public.user_wallets
ADD COLUMN IF NOT EXISTS last_ad_reward_at timestamptz;

-- Reward claim RPC: enforces cooldown, grants points + rare cash, logs to game_results
CREATE OR REPLACE FUNCTION public.claim_ad_reward()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  v_last timestamptz;
  v_now timestamptz := now();
  v_cooldown_seconds constant int := 60;
  v_seconds_left int;
  v_points_reward int;
  v_cash_reward numeric := 0;
  v_won_cash boolean := false;
  v_new_points int;
  v_new_balance numeric;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT last_ad_reward_at INTO v_last
  FROM public.user_wallets
  WHERE user_id = caller_id
  FOR UPDATE;

  IF v_last IS NOT NULL THEN
    v_seconds_left := v_cooldown_seconds - EXTRACT(EPOCH FROM (v_now - v_last))::int;
    IF v_seconds_left > 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'cooldown',
        'seconds_left', v_seconds_left
      );
    END IF;
  END IF;

  -- Guaranteed: 5–10 points
  v_points_reward := 5 + floor(random() * 6)::int;

  -- 5% chance of bonus ₦20–₦100 cash (rounded to nearest 10)
  IF random() < 0.05 THEN
    v_won_cash := true;
    v_cash_reward := (20 + floor(random() * 9)::int * 10);
  END IF;

  UPDATE public.user_wallets
  SET points = points + v_points_reward,
      balance = balance + v_cash_reward,
      total_won = total_won + v_cash_reward,
      last_ad_reward_at = v_now,
      updated_at = v_now
  WHERE user_id = caller_id
  RETURNING points, balance INTO v_new_points, v_new_balance;

  INSERT INTO public.game_results (user_id, game_type, bet_amount, win_amount, result)
  VALUES (
    caller_id,
    'ad_rewards',
    0,
    v_cash_reward,
    jsonb_build_object(
      'points_reward', v_points_reward,
      'cash_reward', v_cash_reward,
      'won_cash', v_won_cash
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'points_reward', v_points_reward,
    'cash_reward', v_cash_reward,
    'won_cash', v_won_cash,
    'points', v_new_points,
    'balance', v_new_balance,
    'cooldown_seconds', v_cooldown_seconds
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_ad_reward() TO authenticated;