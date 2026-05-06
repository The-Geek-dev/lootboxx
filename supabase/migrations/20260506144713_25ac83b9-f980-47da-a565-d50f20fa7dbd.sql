-- Enforce at most one awarded bonus per referred user
CREATE UNIQUE INDEX IF NOT EXISTS referrals_one_awarded_per_referred
ON public.referrals (referred_id)
WHERE activation_bonus_awarded = true;

CREATE OR REPLACE FUNCTION public.award_referral_activation_bonus(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_ref_id uuid;
  v_referrer uuid;
  c_activation_points constant int := 300;
  c_activation_cash constant numeric := 200;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_user');
  END IF;

  -- Atomically claim the unawarded referral row. If another concurrent call
  -- already flipped activation_bonus_awarded to true, this returns no rows
  -- and we exit without crediting again.
  UPDATE public.referrals
  SET activation_bonus_awarded = true,
      status = 'activated',
      bonus_amount = c_activation_cash
  WHERE referred_id = p_user_id
    AND activation_bonus_awarded = false
    AND id = (
      SELECT id FROM public.referrals
      WHERE referred_id = p_user_id
        AND activation_bonus_awarded = false
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
  RETURNING id, referrer_id INTO v_ref_id, v_referrer;

  IF v_ref_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_awarded_or_no_referrer');
  END IF;

  UPDATE public.user_wallets
  SET points = points + c_activation_points,
      balance = balance + c_activation_cash,
      total_won = total_won + c_activation_cash,
      total_referral_bonus = total_referral_bonus + c_activation_cash,
      updated_at = now()
  WHERE user_id = v_referrer;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_referrer,
    '💎 Referral Activated!',
    'Your referral just activated their account — you earned ' || c_activation_points || ' points + ₦' || c_activation_cash || '!',
    'referral'
  );

  RETURN jsonb_build_object(
    'success', true,
    'activation_points', c_activation_points,
    'activation_cash', c_activation_cash
  );
END;
$function$;