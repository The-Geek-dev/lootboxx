
-- One "unclaimed" referral code row per referrer (prevents duplicate codes on concurrent calls)
CREATE UNIQUE INDEX IF NOT EXISTS referrals_one_open_code_per_referrer
  ON public.referrals (referrer_id)
  WHERE referred_id IS NULL;

CREATE OR REPLACE FUNCTION public.get_or_create_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    IF i > 20 THEN RAISE EXCEPTION 'Could not generate referral code'; END IF;

    v_candidate := 'LOOT-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    IF EXISTS (SELECT 1 FROM public.referrals WHERE referral_code = v_candidate) THEN
      CONTINUE;
    END IF;

    BEGIN
      INSERT INTO public.referrals (referrer_id, referral_code, bonus_amount, status)
      VALUES (caller_id, v_candidate, 0, 'active');
      RETURN v_candidate;
    EXCEPTION WHEN unique_violation THEN
      -- Either the code raced another insert, or this user already got a code
      -- from a concurrent call. Re-check for an existing code before retrying.
      SELECT referral_code INTO v_code
      FROM public.referrals
      WHERE referrer_id = caller_id
      ORDER BY created_at ASC
      LIMIT 1;
      IF v_code IS NOT NULL THEN
        RETURN v_code;
      END IF;
    END;
  END LOOP;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_or_create_referral_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_referral_code() TO authenticated;
