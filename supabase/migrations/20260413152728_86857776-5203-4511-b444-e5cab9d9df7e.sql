
ALTER TABLE public.user_wallets
ADD COLUMN coupon_expires_at timestamp with time zone DEFAULT NULL;

-- Set existing activated users to have 7 days from now
UPDATE public.user_wallets
SET coupon_expires_at = now() + interval '7 days'
WHERE is_activated = true;
