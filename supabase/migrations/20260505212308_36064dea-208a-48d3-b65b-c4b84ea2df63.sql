
-- 1. Global game settings (singleton row)
CREATE TABLE IF NOT EXISTS public.global_game_settings (
  id integer PRIMARY KEY DEFAULT 1,
  win_rate_modifier numeric NOT NULL DEFAULT 1.0,
  payout_modifier numeric NOT NULL DEFAULT 1.0,
  max_full_wins_per_day integer NOT NULL DEFAULT 3,
  win_window_radius_hours integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT only_one_row CHECK (id = 1)
);

ALTER TABLE public.global_game_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read global game settings" ON public.global_game_settings;
CREATE POLICY "Anyone can read global game settings"
ON public.global_game_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins update global game settings" ON public.global_game_settings;
CREATE POLICY "Admins update global game settings"
ON public.global_game_settings FOR UPDATE
USING (public.has_role(auth.uid(),'admin'))
WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins insert global game settings" ON public.global_game_settings;
CREATE POLICY "Admins insert global game settings"
ON public.global_game_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.global_game_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 2. Locked withdrawal account on user_wallets
ALTER TABLE public.user_wallets
  ADD COLUMN IF NOT EXISTS locked_bank_name text,
  ADD COLUMN IF NOT EXISTS locked_account_number text,
  ADD COLUMN IF NOT EXISTS locked_account_name text;

-- 3. Effective game settings RPC (user override > global > defaults)
CREATE OR REPLACE FUNCTION public.get_effective_game_settings()
RETURNS TABLE(
  difficulty_level integer,
  win_rate_modifier numeric,
  payout_modifier numeric,
  max_full_wins_per_day integer,
  win_window_radius_hours integer,
  is_active boolean,
  source text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH u AS (
    SELECT difficulty_level, win_rate_modifier, payout_modifier, is_active
    FROM public.user_game_settings
    WHERE user_id = auth.uid() AND is_active = true LIMIT 1
  ),
  g AS (
    SELECT win_rate_modifier, payout_modifier, max_full_wins_per_day,
           win_window_radius_hours, is_active
    FROM public.global_game_settings WHERE id = 1
  )
  SELECT
    COALESCE((SELECT difficulty_level FROM u), 5),
    COALESCE((SELECT win_rate_modifier FROM u), (SELECT win_rate_modifier FROM g), 1.0),
    COALESCE((SELECT payout_modifier FROM u), (SELECT payout_modifier FROM g), 1.0),
    COALESCE((SELECT max_full_wins_per_day FROM g), 3),
    COALESCE((SELECT win_window_radius_hours FROM g), 1),
    COALESCE((SELECT is_active FROM u), (SELECT is_active FROM g), false),
    CASE
      WHEN (SELECT is_active FROM u) THEN 'user'
      WHEN (SELECT is_active FROM g) THEN 'global'
      ELSE 'default'
    END;
$$;

-- 4. Update request_withdrawal to lock account on first use
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount numeric,
  p_bank_name text,
  p_account_number text,
  p_account_name text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_id uuid;
  v_balance numeric;
  v_winnings numeric;
  v_pending numeric;
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

  SELECT balance, locked_bank_name, locked_account_number, locked_account_name
    INTO v_balance, v_locked_bank, v_locked_acct, v_locked_name
  FROM public.user_wallets WHERE user_id = caller_id FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Enforce locked account if set
  IF v_locked_acct IS NOT NULL THEN
    IF p_bank_name <> v_locked_bank
       OR p_account_number <> v_locked_acct
       OR p_account_name <> v_locked_name THEN
      RAISE EXCEPTION 'Withdrawals must go to your locked account: % - % (%). Contact support to change.',
        v_locked_bank, v_locked_acct, v_locked_name;
    END IF;
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

  -- Lock account on first withdrawal
  UPDATE public.user_wallets
  SET balance = balance - p_amount,
      locked_bank_name = COALESCE(locked_bank_name, p_bank_name),
      locked_account_number = COALESCE(locked_account_number, p_account_number),
      locked_account_name = COALESCE(locked_account_name, p_account_name),
      updated_at = now()
  WHERE user_id = caller_id;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;
