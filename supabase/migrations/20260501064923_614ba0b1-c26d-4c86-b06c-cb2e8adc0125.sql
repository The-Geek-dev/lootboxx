-- 1. RPC to process a referral code on signup. Links referred user, credits both wallets, creates milestone bonus when applicable.
CREATE OR REPLACE FUNCTION public.process_referral_signup(p_referral_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  v_referrer_id uuid;
  v_referral_row_id uuid;
  v_existing_count int;
  v_active_count int;
  v_milestone_hit boolean := false;
  c_bonus_cash constant numeric := 500;
  c_bonus_points constant int := 200;
  c_milestone_step constant int := 5;
  c_milestone_cash constant numeric := 5000;
  c_milestone_points constant int := 3000;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_referral_code IS NULL OR length(trim(p_referral_code)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_code');
  END IF;

  -- Find an unused referrer slot for this code
  SELECT id, referrer_id INTO v_referral_row_id, v_referrer_id
  FROM public.referrals
  WHERE referral_code = upper(trim(p_referral_code))
    AND referred_id IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  -- If template row exists but already used, fetch the referrer from any existing row
  IF v_referrer_id IS NULL THEN
    SELECT referrer_id INTO v_referrer_id
    FROM public.referrals
    WHERE referral_code = upper(trim(p_referral_code))
    LIMIT 1;
  END IF;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_code');
  END IF;

  IF v_referrer_id = caller_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'self_referral');
  END IF;

  -- Block duplicate use by the same referred user
  SELECT count(*) INTO v_existing_count
  FROM public.referrals
  WHERE referred_id = caller_id;
  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_referred');
  END IF;

  -- If we found an empty template row, fill it; else insert a new completed row.
  IF v_referral_row_id IS NOT NULL THEN
    UPDATE public.referrals
    SET referred_id = caller_id,
        bonus_amount = c_bonus_cash,
        status = 'completed'
    WHERE id = v_referral_row_id;
  ELSE
    INSERT INTO public.referrals (referrer_id, referred_id, referral_code, bonus_amount, status)
    VALUES (v_referrer_id, caller_id, upper(trim(p_referral_code)), c_bonus_cash, 'completed');
  END IF;

  -- Credit referrer
  UPDATE public.user_wallets
  SET balance = balance + c_bonus_cash,
      points = points + c_bonus_points,
      total_referral_bonus = total_referral_bonus + c_bonus_cash,
      updated_at = now()
  WHERE user_id = v_referrer_id;

  -- Credit referred user
  UPDATE public.user_wallets
  SET balance = balance + c_bonus_cash,
      points = points + c_bonus_points,
      updated_at = now()
  WHERE user_id = caller_id;

  -- Notify referrer
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_referrer_id,
    '🎉 New Referral!',
    'Someone just signed up with your code. You earned ₦' || c_bonus_cash || ' + ' || c_bonus_points || ' points!',
    'referral'
  );

  -- Notify referred user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    caller_id,
    '🎁 Welcome Bonus!',
    'You used a referral code and earned ₦' || c_bonus_cash || ' + ' || c_bonus_points || ' points!',
    'referral'
  );

  -- Milestone check
  SELECT count(*) INTO v_active_count
  FROM public.referrals
  WHERE referrer_id = v_referrer_id AND referred_id IS NOT NULL;

  IF v_active_count > 0 AND v_active_count % c_milestone_step = 0 THEN
    v_milestone_hit := true;
    UPDATE public.user_wallets
    SET balance = balance + c_milestone_cash,
        points = points + c_milestone_points,
        total_referral_bonus = total_referral_bonus + c_milestone_cash,
        updated_at = now()
    WHERE user_id = v_referrer_id;

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      v_referrer_id,
      '🏆 Milestone Bonus!',
      'You hit ' || v_active_count || ' referrals! You earned ₦' || c_milestone_cash || ' + ' || c_milestone_points || ' bonus points!',
      'milestone'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'milestone', v_milestone_hit,
    'bonus_cash', c_bonus_cash,
    'bonus_points', c_bonus_points
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_referral_signup(text) TO authenticated;