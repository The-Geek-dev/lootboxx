
CREATE OR REPLACE FUNCTION public.apply_game_result(
  p_game_type text,
  p_point_cost integer,
  p_win_amount numeric,
  p_result jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  current_points integer;
  current_balance numeric;
  current_total_won numeric;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_point_cost < 0 OR p_win_amount < 0 THEN
    RAISE EXCEPTION 'Invalid amounts';
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
      balance = current_balance + p_win_amount,
      total_won = current_total_won + p_win_amount,
      updated_at = now()
  WHERE user_id = caller_id;

  INSERT INTO public.game_results (user_id, game_type, bet_amount, win_amount, result)
  VALUES (caller_id, p_game_type, p_point_cost, p_win_amount, p_result);

  RETURN jsonb_build_object(
    'points', current_points - p_point_cost,
    'balance', current_balance + p_win_amount,
    'win_amount', p_win_amount
  );
END;
$$;
