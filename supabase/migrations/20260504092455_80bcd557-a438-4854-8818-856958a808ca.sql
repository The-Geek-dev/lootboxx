CREATE OR REPLACE FUNCTION public.credit_verified_deposit(p_user_id uuid, p_amount numeric, p_bonus numeric, p_points integer, p_deposit_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  total_credit NUMERIC;
  new_balance NUMERIC;
  was_activated BOOLEAN;
BEGIN
  total_credit := p_amount + COALESCE(p_bonus, 0);

  SELECT is_activated INTO was_activated FROM public.user_wallets WHERE user_id = p_user_id;

  -- Update wallet
  UPDATE public.user_wallets
  SET balance = balance + total_credit,
      points = points + COALESCE(p_points, 0),
      total_deposited = total_deposited + p_amount,
      is_activated = CASE WHEN p_deposit_type IN ('activation','renewal','topup') THEN true ELSE is_activated END,
      coupon_expires_at = CASE
        WHEN p_deposit_type = 'activation' THEN now() + interval '7 days'
        WHEN p_deposit_type = 'renewal' THEN GREATEST(COALESCE(coupon_expires_at, now()), now()) + interval '7 days'
        ELSE coupon_expires_at
      END,
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING balance INTO new_balance;

  -- Log deposit
  INSERT INTO public.deposits (user_id, amount, status, payment_reference)
  VALUES (p_user_id, p_amount, 'completed', 'kuda-manual-' || gen_random_uuid()::text);

  -- Award referral activation bonus (only on first activation)
  IF p_deposit_type = 'activation' AND COALESCE(was_activated, false) = false THEN
    PERFORM public.award_referral_activation_bonus(p_user_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'balance', new_balance,
    'total_credit', total_credit
  );
END;
$function$;