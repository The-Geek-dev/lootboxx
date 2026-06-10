-- Add influencer role and 20% activation commission

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'influencer';

-- Modify activation-bonus function:
--  * Normal referrer: ₦200 + 300 points (existing)
--  * Influencer referrer: 20% of the new user's first activation deposit (cash only)
CREATE OR REPLACE FUNCTION public.award_referral_activation_bonus(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ref_id uuid;
  v_referrer uuid;
  v_activation_amount numeric;
  v_is_influencer boolean;
  v_cash_bonus numeric;
  v_points_bonus int;
  c_default_points constant int := 300;
  c_default_cash constant numeric := 200;
  c_influencer_pct constant numeric := 0.20;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_user');
  END IF;

  -- Atomically claim the unawarded referral row
  UPDATE public.referrals
  SET activation_bonus_awarded = true,
      status = 'activated'
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

  -- Check influencer status via raw text compare so this works even when the
  -- enum value was added in the same migration transaction.
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_referrer AND role::text = 'influencer'
  ) INTO v_is_influencer;

  IF v_is_influencer THEN
    -- Use the latest completed deposit as activation amount
    SELECT amount INTO v_activation_amount
    FROM public.deposits
    WHERE user_id = p_user_id AND status = 'completed'
    ORDER BY created_at DESC
    LIMIT 1;
    v_activation_amount := COALESCE(v_activation_amount, 7000);
    v_cash_bonus := ROUND(v_activation_amount * c_influencer_pct, 2);
    v_points_bonus := 0;
  ELSE
    v_cash_bonus := c_default_cash;
    v_points_bonus := c_default_points;
  END IF;

  UPDATE public.referrals
  SET bonus_amount = v_cash_bonus
  WHERE id = v_ref_id;

  UPDATE public.user_wallets
  SET points = points + v_points_bonus,
      balance = balance + v_cash_bonus,
      total_won = total_won + v_cash_bonus,
      total_referral_bonus = total_referral_bonus + v_cash_bonus,
      updated_at = now()
  WHERE user_id = v_referrer;

  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_referrer,
    CASE WHEN v_is_influencer THEN '💎 Influencer Commission!' ELSE '💎 Referral Activated!' END,
    CASE
      WHEN v_is_influencer THEN 'Your referral activated — you earned a 20% commission of ₦' || v_cash_bonus || '!'
      ELSE 'Your referral just activated their account — you earned ' || v_points_bonus || ' points + ₦' || v_cash_bonus || '!'
    END,
    'referral'
  );

  RETURN jsonb_build_object(
    'success', true,
    'is_influencer', v_is_influencer,
    'cash_bonus', v_cash_bonus,
    'points_bonus', v_points_bonus
  );
END;
$function$;