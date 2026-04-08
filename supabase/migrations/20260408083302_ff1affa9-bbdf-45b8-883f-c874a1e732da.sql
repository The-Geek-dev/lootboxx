
ALTER TABLE public.user_wallets 
ADD COLUMN is_activated boolean NOT NULL DEFAULT false,
ADD COLUMN last_weekly_bonus_at timestamp with time zone DEFAULT NULL;
