CREATE OR REPLACE FUNCTION public.request_withdrawal(p_amount numeric, p_bank_name text, p_account_number text, p_account_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid;
  v_balance numeric;
  v_winnings numeric;
  v_pending numeric;
  v_pending_count int;
  v_id uuid;
  v_locked_bank text;
  v_locked_acct text;
  v_locked_name text;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount < 1000 THEN
    RAISE EXCEPTION 'Minimum withdrawal is 1000';
  END IF;

  -- Block duplicate submissions while a previous request is still in-flight
  SELECT count(*) INTO v_pending_count
  FROM public.withdrawals
  WHERE user_id = caller_id
    AND status IN ('pending','approved');
  IF v_pending_count > 0 THEN
    RAISE EXCEPTION 'You already have a withdrawal in progress. Please wait until it is completed or rejected before submitting another.';
  END IF;

  SELECT balance, locked_bank_name, locked_account_number, locked_account_name
    INTO v_balance, v_locked_bank, v_locked_acct, v_locked_name
  FROM public.user_wallets WHERE user_id = caller_id FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  IF v_locked_acct IS NOT NULL THEN
    IF p_bank_name <> v_locked_bank
       OR p_account_number <> v_locked_acct
       OR p_account_name <> v_locked_name THEN
      RAISE EXCEPTION 'Withdrawals must go to your locked account: % - % (%). Contact support to change.',
        v_locked_bank, v_locked_acct, v_locked_name;
    END IF;
  END IF;

  SELECT COALESCE(total_won, 0) INTO v_winnings FROM public.user_wallets WHERE user_id = caller_id;
  SELECT COALESCE(SUM(amount), 0) INTO v_pending FROM public.withdrawals
    WHERE user_id = caller_id AND status IN ('pending','approved','completed');
  IF (v_winnings - v_pending) < p_amount THEN
    RAISE EXCEPTION 'You can only withdraw your winnings. Available: %', GREATEST(0, v_winnings - v_pending);
  END IF;

  INSERT INTO public.withdrawals (user_id, amount, bank_name, account_number, account_name, status)
  VALUES (caller_id, p_amount, p_bank_name, p_account_number, p_account_name, 'pending')
  RETURNING id INTO v_id;

  UPDATE public.user_wallets
  SET balance = balance - p_amount,
      locked_bank_name = COALESCE(locked_bank_name, p_bank_name),
      locked_account_number = COALESCE(locked_account_number, p_account_number),
      locked_account_name = COALESCE(locked_account_name, p_account_name),
      updated_at = now()
  WHERE user_id = caller_id;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$function$;

-- Partial unique index as a hard safety net against concurrent duplicate inserts
CREATE UNIQUE INDEX IF NOT EXISTS withdrawals_one_pending_per_user
  ON public.withdrawals (user_id)
  WHERE status IN ('pending','approved');