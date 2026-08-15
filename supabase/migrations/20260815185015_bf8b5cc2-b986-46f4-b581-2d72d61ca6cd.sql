
CREATE OR REPLACE FUNCTION public.settle_game_round(
  p_user_id uuid,
  p_game_type text,
  p_point_cost integer,
  p_win_amount numeric,
  p_result jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid := p_user_id;
  current_points integer;
  current_balance numeric;
  current_total_won numeric;
  v_cap numeric;
  v_win numeric;
  v_is_full_win boolean;
  s_win_rate numeric;
  s_payout numeric;
  s_max_wins integer;
  s_radius integer;
  s_active boolean;
  t_count integer;
  t_hour integer;
  v_today date;
  v_hour integer;
  v_allowed boolean;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_point_cost < 0 OR p_win_amount < 0 THEN
    RAISE EXCEPTION 'Invalid amounts';
  END IF;

  SELECT max_win INTO v_cap FROM public.game_payout_caps WHERE game_type = p_game_type;
  IF v_cap IS NULL THEN
    SELECT max_win INTO v_cap FROM public.game_payout_caps WHERE game_type = '__default__';
    v_cap := COALESCE(v_cap, 30000);
  END IF;

  IF p_win_amount > v_cap THEN
    RAISE EXCEPTION 'Win amount % exceeds cap % for game %', p_win_amount, v_cap, p_game_type;
  END IF;

  v_win := p_win_amount;

  SELECT
    COALESCE((SELECT u.win_rate_modifier FROM public.user_game_settings u WHERE u.user_id = caller_id AND u.is_active LIMIT 1),
             (SELECT g.win_rate_modifier FROM public.global_game_settings g WHERE g.id = 1), 1.0),
    COALESCE((SELECT u.payout_modifier FROM public.user_game_settings u WHERE u.user_id = caller_id AND u.is_active LIMIT 1),
             (SELECT g.payout_modifier FROM public.global_game_settings g WHERE g.id = 1), 1.0),
    COALESCE((SELECT g.max_full_wins_per_day FROM public.global_game_settings g WHERE g.id = 1), 3),
    COALESCE((SELECT g.win_window_radius_hours FROM public.global_game_settings g WHERE g.id = 1), 1),
    COALESCE((SELECT u.is_active FROM public.user_game_settings u WHERE u.user_id = caller_id AND u.is_active LIMIT 1),
             (SELECT g.is_active FROM public.global_game_settings g WHERE g.id = 1), false)
  INTO s_win_rate, s_payout, s_max_wins, s_radius, s_active;

  IF v_win > 0 AND s_active THEN
    v_win := round(v_win * s_payout);
    IF s_win_rate <= 0 THEN
      v_win := 0;
    END IF;
  END IF;

  v_is_full_win := v_win >= 1000;

  IF v_is_full_win THEN
    v_today := (now() AT TIME ZONE 'Africa/Lagos')::date;
    v_hour := EXTRACT(hour FROM (now() AT TIME ZONE 'Africa/Lagos'))::int;

    INSERT INTO public.daily_win_tracking (user_id, win_date, full_win_count, win_window_hour)
    VALUES (caller_id, v_today, 0, floor(random() * 24)::int)
    ON CONFLICT (user_id, win_date) DO NOTHING;

    SELECT full_win_count, win_window_hour INTO t_count, t_hour
    FROM public.daily_win_tracking
    WHERE user_id = caller_id AND win_date = v_today
    FOR UPDATE;

    IF s_active AND s_win_rate >= 2 THEN
      v_allowed := t_count < s_max_wins * 3;
    ELSE
      v_allowed := abs(v_hour - t_hour) <= s_radius AND t_count < s_max_wins;
    END IF;

    IF NOT v_allowed THEN
      v_win := floor(v_win * 0.2);
      v_is_full_win := false;
    ELSE
      UPDATE public.daily_win_tracking
      SET full_win_count = t_count + 1
      WHERE user_id = caller_id AND win_date = v_today;
    END IF;
  END IF;

  IF v_win > v_cap THEN
    RAISE EXCEPTION 'Adjusted win amount % exceeds cap % for game %', v_win, v_cap, p_game_type;
  END IF;

  SELECT points, balance, total_won
    INTO current_points, current_balance, current_total_won
  FROM public.user_wallets
  WHERE user_id = caller_id
  FOR UPDATE;

  IF current_points IS NULL THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  IF current_points < p_point_cost THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  UPDATE public.user_wallets
  SET points = current_points - p_point_cost,
      balance = current_balance + v_win,
      total_won = current_total_won + v_win,
      updated_at = now()
  WHERE user_id = caller_id;

  INSERT INTO public.game_results (user_id, game_type, bet_amount, win_amount, result)
  VALUES (caller_id, p_game_type, p_point_cost, v_win, p_result);

  RETURN jsonb_build_object(
    'points', current_points - p_point_cost,
    'balance', current_balance + v_win,
    'win_amount', v_win
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.settle_game_round(uuid, text, integer, numeric, jsonb) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_game_round(uuid, text, integer, numeric, jsonb) TO service_role;

CREATE OR REPLACE FUNCTION public.apply_game_result(
  p_game_type text,
  p_point_cost integer,
  p_win_amount numeric,
  p_result jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  RETURN public.settle_game_round(caller_id, p_game_type, p_point_cost, p_win_amount, p_result);
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_dice_round(
  p_game_type text,
  p_point_cost integer,
  p_bet_type text,
  p_target integer,
  p_dice_count integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid := auth.uid();
  v_dice int[] := '{}';
  i int;
  v_total int := 0;
  v_won boolean;
  v_diff int;
  v_win numeric := 0;
  v_settle jsonb;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_bet_type NOT IN ('over','under') THEN
    RAISE EXCEPTION 'Invalid bet type';
  END IF;
  IF p_dice_count NOT IN (2,3) THEN
    RAISE EXCEPTION 'Invalid dice count';
  END IF;
  IF p_target < 2 OR p_target > p_dice_count * 6 THEN
    RAISE EXCEPTION 'Invalid target';
  END IF;
  IF p_point_cost < 0 THEN
    RAISE EXCEPTION 'Invalid point cost';
  END IF;

  FOR i IN 1..p_dice_count LOOP
    v_dice := v_dice || (1 + floor(random() * 6))::int;
  END LOOP;

  SELECT sum(d) INTO v_total FROM unnest(v_dice) AS d;

  v_won := CASE WHEN p_bet_type = 'over' THEN v_total > p_target ELSE v_total < p_target END;

  IF v_won THEN
    v_diff := abs(v_total - p_target);
    v_win := CASE WHEN v_diff >= 4 THEN 5000 WHEN v_diff >= 2 THEN 2500 ELSE 1200 END;
    IF p_dice_count = 3 THEN
      v_win := floor(v_win * 1.3);
    END IF;
  END IF;

  v_settle := public.settle_game_round(
    caller_id,
    p_game_type,
    p_point_cost,
    v_win,
    jsonb_build_object('dice', to_jsonb(v_dice), 'total', v_total, 'bet', p_bet_type, 'target', p_target)
  );

  RETURN jsonb_build_object(
    'dice', to_jsonb(v_dice),
    'total', v_total,
    'won', v_won,
    'win_amount', (v_settle->>'win_amount')::numeric,
    'points', (v_settle->>'points')::int,
    'balance', (v_settle->>'balance')::numeric
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.resolve_dice_round(text, integer, text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_dice_round(text, integer, text, integer, integer) TO service_role;
