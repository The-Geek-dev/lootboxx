CREATE OR REPLACE FUNCTION public.get_or_create_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_id uuid := auth.uid();
  v_code text;
  v_candidate text;
  i int := 0;
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT referral_code INTO v_code
  FROM public.referrals
  WHERE referrer_id = caller_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  LOOP
    i := i + 1;
    v_candidate := 'LOOT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.referrals WHERE referral_code = v_candidate);
    IF i > 20 THEN RAISE EXCEPTION 'Could not generate referral code'; END IF;
  END LOOP;

  INSERT INTO public.referrals (referrer_id, referral_code, bonus_amount, status)
  VALUES (caller_id, v_candidate, 0, 'active');

  RETURN v_candidate;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_referral_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'signups', COUNT(*) FILTER (WHERE referred_id IS NOT NULL),
    'activations', COUNT(*) FILTER (WHERE activation_bonus_awarded),
    'pending', COUNT(*) FILTER (WHERE referred_id IS NOT NULL AND NOT activation_bonus_awarded),
    'cash_earned', COALESCE(SUM(bonus_amount) FILTER (WHERE activation_bonus_awarded), 0),
    'is_influencer', EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role::text = 'influencer'
    ),
    'last_activation_at', MAX(created_at) FILTER (WHERE activation_bonus_awarded)
  )
  FROM public.referrals
  WHERE referrer_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_stats() TO authenticated;