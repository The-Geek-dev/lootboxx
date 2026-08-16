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

  -- Games migrated to server-side RNG must not use this legacy client-trusted path.
  IF p_game_type IN ('dice-royale', 'golden-dice', 'dice-duel', 'dragon-dice', 'dice-master') THEN
    RAISE EXCEPTION 'This game must be played via resolve_dice_round, not apply_game_result';
  END IF;

  RETURN public.settle_game_round(caller_id, p_game_type, p_point_cost, p_win_amount, p_result);
END;
$function$;