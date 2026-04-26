
CREATE OR REPLACE FUNCTION public.convert_points_to_cash()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  current_points integer;
  current_balance numeric;
  min_convert constant integer := 5000;
  rate constant numeric := 2; -- 1 point = ₦0.5
  batches integer;
  points_to_convert integer;
  cash_amount numeric;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT points, balance
    INTO current_points, current_balance
  FROM public.user_wallets
  WHERE user_id = caller_id
  FOR UPDATE;

  IF current_points IS NULL OR current_points < min_convert THEN
    RETURN jsonb_build_object('success', false, 'cash_amount', 0);
  END IF;

  batches := current_points / min_convert;
  points_to_convert := batches * min_convert;
  cash_amount := points_to_convert / rate;

  UPDATE public.user_wallets
  SET points = current_points - points_to_convert,
      balance = current_balance + cash_amount,
      updated_at = now()
  WHERE user_id = caller_id;

  RETURN jsonb_build_object(
    'success', true,
    'cash_amount', cash_amount,
    'points_remaining', current_points - points_to_convert,
    'balance', current_balance + cash_amount
  );
END;
$$;
