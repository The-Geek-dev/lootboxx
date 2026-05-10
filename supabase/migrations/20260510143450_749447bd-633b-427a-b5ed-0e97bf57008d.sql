ALTER TABLE public.user_wallets
  ADD COLUMN IF NOT EXISTS withdrawal_eligibility_notified_at timestamptz;