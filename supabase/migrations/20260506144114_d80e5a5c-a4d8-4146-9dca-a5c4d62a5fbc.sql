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
  IF p_user_id IS NULL THEN RETURN jsonb_build_object('success', false); END IF;

  SELECT id, referrer_id INTO v_ref_id, v_referrer
  FROM public.referrals
  WHERE referred_id = p_user_id
    AND activation_bonus_awarded = false
  LIMIT 1;

  IF v_referrer IS NULL THEN RETURN jsonb_build_object('success', false, 'reason', 'no_referrer_or_already_awarded'); END IF;

  UPDATE public.referrals
  SET activation_bonus_awarded = true,
      status = 'activated',
      bonus_amount = c_activation_cash
  WHERE id = v_ref_id;

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

  RETURN jsonb_build_object('success', true, 'activation_points', c_activation_points, 'activation_cash', c_activation_cash);
END;
$function$;