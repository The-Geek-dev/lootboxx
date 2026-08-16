CREATE OR REPLACE FUNCTION public.resolve_dice_round(p_game_type text, p_point_cost integer, p_bet_type text, p_target integer, p_dice_count integer)
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
  v_payouts jsonb;
  v_big_diff numeric := 5000;
  v_mid_diff numeric := 2500;
  v_small_diff numeric := 1200;
  v_three_bonus numeric := 1.3;
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

  SELECT value INTO v_payouts FROM public.payout_overrides WHERE key = 'DICE_PAYOUTS';
  IF v_payouts IS NOT NULL THEN
    v_big_diff := COALESCE((v_payouts->>'bigDiff')::numeric, v_big_diff);
    v_mid_diff := COALESCE((v_payouts->>'midDiff')::numeric, v_mid_diff);
    v_small_diff := COALESCE((v_payouts->>'smallDiff')::numeric, v_small_diff);
    v_three_bonus := COALESCE((v_payouts->>'threeDiceBonus')::numeric, v_three_bonus);
  END IF;

  FOR i IN 1..p_dice_count LOOP
    v_dice := v_dice || (1 + floor(random() * 6))::int;
  END LOOP;

  SELECT sum(d) INTO v_total FROM unnest(v_dice) AS d;

  v_won := CASE WHEN p_bet_type = 'over' THEN v_total > p_target ELSE v_total < p_target END;

  IF v_won THEN
    v_diff := abs(v_total - p_target);
    v_win := CASE WHEN v_diff >= 4 THEN v_big_diff WHEN v_diff >= 2 THEN v_mid_diff ELSE v_small_diff END;
    IF p_dice_count = 3 THEN
      v_win := floor(v_win * v_three_bonus);
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

CREATE OR REPLACE FUNCTION public.resolve_roulette_round(p_game_type text, p_point_cost integer, p_bet_kind text, p_bet_value text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid := auth.uid();
  v_number int;
  v_color text;
  v_mult numeric := 0;
  v_coef numeric := 2.2;
  v_coefs jsonb;
  v_win numeric := 0;
  v_settle jsonb;
  v_num_bet int;
  RED_NUMBERS int[] := ARRAY[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_point_cost < 0 THEN
    RAISE EXCEPTION 'Invalid point cost';
  END IF;
  IF p_bet_kind NOT IN ('color','parity','dozen','number') THEN
    RAISE EXCEPTION 'Invalid bet kind';
  END IF;
  IF p_bet_kind = 'color' AND p_bet_value NOT IN ('red','black') THEN
    RAISE EXCEPTION 'Invalid bet value';
  END IF;
  IF p_bet_kind = 'parity' AND p_bet_value NOT IN ('odd','even') THEN
    RAISE EXCEPTION 'Invalid bet value';
  END IF;
  IF p_bet_kind = 'dozen' AND p_bet_value NOT IN ('1','2','3') THEN
    RAISE EXCEPTION 'Invalid bet value';
  END IF;
  IF p_bet_kind = 'number' THEN
    IF p_bet_value !~ '^[0-9]{1,2}$' THEN
      RAISE EXCEPTION 'Invalid bet value';
    END IF;
    v_num_bet := p_bet_value::int;
    IF v_num_bet < 0 OR v_num_bet > 36 THEN
      RAISE EXCEPTION 'Invalid bet value';
    END IF;
  END IF;

  SELECT value INTO v_coefs FROM public.payout_overrides WHERE key = 'PAYOUT_COEF';
  IF v_coefs IS NOT NULL THEN
    v_coef := COALESCE((v_coefs->>'roulette')::numeric, v_coef);
  END IF;

  v_number := floor(random() * 37)::int;
  v_color := CASE WHEN v_number = 0 THEN 'green'
                  WHEN v_number = ANY(RED_NUMBERS) THEN 'red'
                  ELSE 'black' END;

  IF p_bet_kind = 'color' THEN
    v_mult := CASE WHEN v_color = p_bet_value THEN 2 ELSE 0 END;
  ELSIF p_bet_kind = 'parity' THEN
    IF v_number = 0 THEN
      v_mult := 0;
    ELSIF (p_bet_value = 'even' AND v_number % 2 = 0) OR (p_bet_value = 'odd' AND v_number % 2 = 1) THEN
      v_mult := 2;
    END IF;
  ELSIF p_bet_kind = 'dozen' THEN
    IF v_number > 0 AND ceil(v_number / 12.0)::int = p_bet_value::int THEN
      v_mult := 3;
    END IF;
  ELSIF p_bet_kind = 'number' THEN
    v_mult := CASE WHEN v_num_bet = v_number THEN 36 ELSE 0 END;
  END IF;

  v_win := floor(p_point_cost * v_mult * v_coef);

  v_settle := public.settle_game_round(
    caller_id,
    p_game_type,
    p_point_cost,
    v_win,
    jsonb_build_object('number', v_number, 'color', v_color, 'bet_kind', p_bet_kind, 'bet_value', p_bet_value, 'multiplier', v_mult)
  );

  RETURN jsonb_build_object(
    'number', v_number,
    'color', v_color,
    'multiplier', v_mult,
    'win_amount', (v_settle->>'win_amount')::numeric,
    'points', (v_settle->>'points')::int,
    'balance', (v_settle->>'balance')::numeric
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.resolve_roulette_round(text, integer, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_roulette_round(text, integer, text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.apply_game_result(p_game_type text, p_point_cost integer, p_win_amount numeric, p_result jsonb DEFAULT '{}'::jsonb)
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

  IF p_game_type IN ('dice-royale', 'golden-dice', 'dice-duel', 'dragon-dice', 'dice-master') THEN
    RAISE EXCEPTION 'This game must be played via resolve_dice_round, not apply_game_result';
  END IF;

  IF p_game_type IN ('roulette') THEN
    RAISE EXCEPTION 'This game must be played via resolve_roulette_round, not apply_game_result';
  END IF;

  RETURN public.settle_game_round(caller_id, p_game_type, p_point_cost, p_win_amount, p_result);
END;
$function$;