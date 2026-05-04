-- 1) Referral changes
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS activation_bonus_awarded boolean NOT NULL DEFAULT false;

-- Replace process_referral_signup: signup gives referrer 150 pts only
CREATE OR REPLACE FUNCTION public.process_referral_signup(p_referral_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid;
  v_referrer_id uuid;
  v_referral_row_id uuid;
  v_existing_count int;
  c_signup_points constant int := 150;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_referral_code IS NULL OR length(trim(p_referral_code)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_code');
  END IF;

  SELECT id, referrer_id INTO v_referral_row_id, v_referrer_id
  FROM public.referrals
  WHERE referral_code = upper(trim(p_referral_code))
    AND referred_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_referrer_id IS NULL THEN
    SELECT referrer_id INTO v_referrer_id
    FROM public.referrals
    WHERE referral_code = upper(trim(p_referral_code))
    LIMIT 1;
  END IF;

  IF v_referrer_id IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'invalid_code'); END IF;
  IF v_referrer_id = caller_id THEN RETURN jsonb_build_object('success', false, 'reason', 'self_referral'); END IF;

  SELECT count(*) INTO v_existing_count FROM public.referrals WHERE referred_id = caller_id;
  IF v_existing_count > 0 THEN RETURN jsonb_build_object('success', false, 'reason', 'already_referred'); END IF;

  IF v_referral_row_id IS NOT NULL THEN
    UPDATE public.referrals
    SET referred_id = caller_id, bonus_amount = 0, status = 'signed_up'
    WHERE id = v_referral_row_id;
  ELSE
    INSERT INTO public.referrals (referrer_id, referred_id, referral_code, bonus_amount, status)
    VALUES (v_referrer_id, caller_id, upper(trim(p_referral_code)), 0, 'signed_up');
  END IF;

  -- Credit referrer with signup points only
  UPDATE public.user_wallets
  SET points = points + c_signup_points, updated_at = now()
  WHERE user_id = v_referrer_id;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_referrer_id,
    '🎉 New Referral Signup!',
    'Someone signed up with your code — you earned ' || c_signup_points || ' points! They earn you 250 more when they activate.',
    'referral'
  );

  RETURN jsonb_build_object('success', true, 'signup_points', c_signup_points);
END;
$function$;

-- Award activation bonus (called from payment verifiers when a user activates)
CREATE OR REPLACE FUNCTION public.award_referral_activation_bonus(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ref_id uuid;
  v_referrer uuid;
  c_activation_points constant int := 250;
BEGIN
  IF p_user_id IS NULL THEN RETURN jsonb_build_object('success', false); END IF;

  SELECT id, referrer_id INTO v_ref_id, v_referrer
  FROM public.referrals
  WHERE referred_id = p_user_id
    AND activation_bonus_awarded = false
  LIMIT 1;

  IF v_referrer IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_referrer_or_already_awarded'); END IF;

  UPDATE public.referrals SET activation_bonus_awarded = true, status = 'activated' WHERE id = v_ref_id;

  UPDATE public.user_wallets
  SET points = points + c_activation_points, updated_at = now()
  WHERE user_id = v_referrer;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_referrer,
    '💎 Referral Activated!',
    'Your referral just activated their account — you earned ' || c_activation_points || ' bonus points!',
    'referral'
  );

  RETURN jsonb_build_object('success', true, 'activation_points', c_activation_points);
END;
$function$;

-- 2) Push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own push subs" ON public.push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own push subs" ON public.push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own push subs" ON public.push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own push subs" ON public.push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();