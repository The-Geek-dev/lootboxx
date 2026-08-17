
CREATE OR REPLACE FUNCTION public.resolve_keno_round(p_game_type text, p_point_cost integer, p_picks int[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid := auth.uid();
  v_coef numeric := 2.2;
  v_coefs jsonb;
  v_drawn int[];
  v_hits int;
  v_mult numeric;
  v_win numeric := 0;
  v_settle jsonb;
  PAY numeric[] := ARRAY[0,0,1,3,12,50,250];
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_point_cost < 0 THEN RAISE EXCEPTION 'Invalid point cost'; END IF;
  IF p_picks IS NULL OR array_length(p_picks, 1) <> 6 THEN
    RAISE EXCEPTION 'Must pick exactly 6 numbers';
  END IF;
  IF EXISTS (SELECT 1 FROM unnest(p_picks) x WHERE x < 1 OR x > 60) THEN
    RAISE EXCEPTION 'Picks must be between 1 and 60';
  END IF;
  IF (SELECT count(DISTINCT x) FROM unnest(p_picks) x) <> 6 THEN
    RAISE EXCEPTION 'Picks must be unique';
  END IF;

  SELECT value INTO v_coefs FROM public.payout_overrides WHERE key = 'PAYOUT_COEF';
  IF v_coefs IS NOT NULL THEN
    v_coef := COALESCE((v_coefs->>'keno')::numeric, v_coef);
  END IF;

  SELECT array_agg(n ORDER BY n) INTO v_drawn
  FROM (SELECT n FROM generate_series(1,60) n ORDER BY random() LIMIT 15) s;

  SELECT count(*) INTO v_hits FROM unnest(p_picks) x WHERE x = ANY(v_drawn);
  v_mult := PAY[v_hits + 1];
  v_win := floor(p_point_cost * v_mult * v_coef);

  v_settle := public.settle_game_round(
    caller_id, p_game_type, p_point_cost, v_win,
    jsonb_build_object('picks', to_jsonb(p_picks), 'drawn', to_jsonb(v_drawn), 'hits', v_hits, 'multiplier', v_mult)
  );

  RETURN jsonb_build_object(
    'drawn', to_jsonb(v_drawn),
    'hits', v_hits,
    'multiplier', v_mult,
    'win_amount', (v_settle->>'win_amount')::numeric,
    'points', (v_settle->>'points')::int,
    'balance', (v_settle->>'balance')::numeric
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_plinko_round(p_game_type text, p_point_cost integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid := auth.uid();
  v_coef numeric := 4;
  v_coefs jsonb;
  v_moves int[] := ARRAY[]::int[];
  v_slot int := 0;
  v_mv int;
  v_mult numeric;
  v_win numeric := 0;
  v_settle jsonb;
  MULTS numeric[] := ARRAY[29,4,1.5,0.5,0.3,0.3,0.5,1.5,4,29];
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_point_cost < 0 THEN RAISE EXCEPTION 'Invalid point cost'; END IF;

  SELECT value INTO v_coefs FROM public.payout_overrides WHERE key = 'PAYOUT_COEF';
  IF v_coefs IS NOT NULL THEN
    v_coef := COALESCE((v_coefs->>'plinko')::numeric, v_coef);
  END IF;

  FOR i IN 1..9 LOOP
    v_mv := floor(random() * 2)::int;
    v_moves := v_moves || v_mv;
    v_slot := v_slot + v_mv;
  END LOOP;

  v_mult := MULTS[v_slot + 1];
  v_win := floor(p_point_cost * v_mult * v_coef);

  v_settle := public.settle_game_round(
    caller_id, p_game_type, p_point_cost, v_win,
    jsonb_build_object('slot', v_slot, 'moves', to_jsonb(v_moves), 'multiplier', v_mult)
  );

  RETURN jsonb_build_object(
    'slot', v_slot,
    'moves', to_jsonb(v_moves),
    'multiplier', v_mult,
    'win_amount', (v_settle->>'win_amount')::numeric,
    'points', (v_settle->>'points')::int,
    'balance', (v_settle->>'balance')::numeric
  );
END;
$function$;

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

  IF p_game_type IN ('keno') THEN
    RAISE EXCEPTION 'This game must be played via resolve_keno_round, not apply_game_result';
  END IF;

  IF p_game_type IN ('plinko') THEN
    RAISE EXCEPTION 'This game must be played via resolve_plinko_round, not apply_game_result';
  END IF;

  RETURN public.settle_game_round(caller_id, p_game_type, p_point_cost, p_win_amount, p_result);
END;
$function$;

REVOKE ALL ON FUNCTION public.resolve_keno_round(text, integer, int[]) FROM public, anon;
REVOKE ALL ON FUNCTION public.resolve_plinko_round(text, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.resolve_keno_round(text, integer, int[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_plinko_round(text, integer) TO authenticated;
