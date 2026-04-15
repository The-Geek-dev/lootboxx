
-- 1. Fix contribute_to_jackpot: use auth.uid(), validate contribution, debit wallet
CREATE OR REPLACE FUNCTION public.contribute_to_jackpot(contribution numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  current_jp numeric;
  won boolean := false;
  win_amount numeric := 0;
  caller_id uuid;
  caller_balance numeric;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate contribution range
  IF contribution < 1 OR contribution > 1000 THEN
    RAISE EXCEPTION 'Invalid contribution amount';
  END IF;

  -- Check caller has sufficient balance
  SELECT balance INTO caller_balance FROM user_wallets WHERE user_id = caller_id FOR UPDATE;
  IF caller_balance IS NULL OR caller_balance < contribution THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Debit caller wallet
  UPDATE user_wallets SET balance = balance - contribution, updated_at = now() WHERE user_id = caller_id;

  -- Add contribution to jackpot
  UPDATE progressive_jackpot 
  SET current_amount = current_amount + contribution,
      total_contributions = total_contributions + contribution,
      updated_at = now()
  WHERE id = (SELECT id FROM progressive_jackpot LIMIT 1)
  RETURNING current_amount INTO current_jp;

  -- 0.1% chance to win jackpot
  IF random() < 0.001 AND current_jp >= 5000 THEN
    won := true;
    win_amount := current_jp;
    
    UPDATE progressive_jackpot
    SET last_won_by = caller_id,
        last_won_at = now(),
        last_won_amount = current_jp,
        current_amount = 5000,
        updated_at = now()
    WHERE id = (SELECT id FROM progressive_jackpot LIMIT 1);
    
    UPDATE user_wallets
    SET balance = balance + win_amount,
        total_won = total_won + win_amount,
        updated_at = now()
    WHERE user_id = caller_id;
  END IF;

  result := jsonb_build_object(
    'current_amount', CASE WHEN won THEN 5000 ELSE current_jp END,
    'won', won,
    'win_amount', win_amount
  );
  
  RETURN result;
END;
$$;

-- 2. Fix user_wallets UPDATE policy: restrict to non-financial fields only
DROP POLICY IF EXISTS "Users can update own wallet" ON public.user_wallets;

CREATE POLICY "Users can update non-financial wallet fields"
ON public.user_wallets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND balance IS NOT DISTINCT FROM (SELECT balance FROM public.user_wallets WHERE user_id = auth.uid())
  AND total_deposited IS NOT DISTINCT FROM (SELECT total_deposited FROM public.user_wallets WHERE user_id = auth.uid())
  AND total_won IS NOT DISTINCT FROM (SELECT total_won FROM public.user_wallets WHERE user_id = auth.uid())
  AND total_referral_bonus IS NOT DISTINCT FROM (SELECT total_referral_bonus FROM public.user_wallets WHERE user_id = auth.uid())
  AND points IS NOT DISTINCT FROM (SELECT points FROM public.user_wallets WHERE user_id = auth.uid())
  AND is_activated IS NOT DISTINCT FROM (SELECT is_activated FROM public.user_wallets WHERE user_id = auth.uid())
);

-- 3. Withdrawal time restriction trigger (WAT = UTC+1)
CREATE OR REPLACE FUNCTION public.validate_withdrawal_time()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wat_time timestamptz;
  day_of_week int;
  hour_of_day int;
BEGIN
  wat_time := now() AT TIME ZONE 'Africa/Lagos';
  day_of_week := EXTRACT(DOW FROM wat_time);
  hour_of_day := EXTRACT(HOUR FROM wat_time);
  
  -- 0=Sunday, 6=Saturday; allow 17:00-18:59 (5-7PM)
  IF day_of_week NOT IN (0, 6) OR hour_of_day NOT BETWEEN 17 AND 18 THEN
    RAISE EXCEPTION 'Withdrawals are only allowed on weekends between 5 PM and 7 PM WAT';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_withdrawal_time
BEFORE INSERT ON public.withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.validate_withdrawal_time();
