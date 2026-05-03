CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount numeric,
  p_bank_name text,
  p_account_number text,
  p_account_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  v_balance numeric;
  v_winnings numeric;
  v_pending numeric;
  v_id uuid;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount < 1000 THEN
    RAISE EXCEPTION 'Minimum withdrawal is 1000';
  END IF;

  SELECT balance INTO v_balance FROM public.user_wallets WHERE user_id = caller_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Only winnings (not deposits) are withdrawable
  SELECT COALESCE(total_won, 0) INTO v_winnings FROM public.user_wallets WHERE user_id = caller_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_pending FROM public.withdrawals
    WHERE user_id = caller_id AND status IN ('pending','approved','completed');
  IF (v_winnings - v_pending) < p_amount THEN
    RAISE EXCEPTION 'You can only withdraw your winnings. Available: %', GREATEST(0, v_winnings - v_pending);
  END IF;

  INSERT INTO public.withdrawals (user_id, amount, bank_name, account_number, account_name, status)
  VALUES (caller_id, p_amount, p_bank_name, p_account_number, p_account_name, 'pending')
  RETURNING id INTO v_id;

  -- Debit immediately so admin rejection refunds correctly
  UPDATE public.user_wallets
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = caller_id;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;