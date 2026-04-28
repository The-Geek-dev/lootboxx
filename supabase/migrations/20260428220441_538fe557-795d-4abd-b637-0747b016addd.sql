
-- Receipts table
CREATE TABLE public.deposit_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  deposit_type TEXT NOT NULL,
  bonus NUMERIC NOT NULL DEFAULT 0,
  points_reward INTEGER NOT NULL DEFAULT 0,
  receipt_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | verified | rejected | manual_review
  ai_notes TEXT,
  extracted_amount NUMERIC,
  extracted_account TEXT,
  extracted_recipient TEXT,
  rejection_reason TEXT,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.deposit_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own receipts"
ON public.deposit_receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own receipts"
ON public.deposit_receipts FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update receipts"
ON public.deposit_receipts FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_deposit_receipts_updated_at
BEFORE UPDATE ON public.deposit_receipts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_deposit_receipts_user ON public.deposit_receipts(user_id, created_at DESC);
CREATE INDEX idx_deposit_receipts_status ON public.deposit_receipts(status);

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users view own receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Users delete own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RPC to credit wallet after successful verification (called by edge function with service role)
CREATE OR REPLACE FUNCTION public.credit_verified_deposit(
  p_user_id UUID,
  p_amount NUMERIC,
  p_bonus NUMERIC,
  p_points INTEGER,
  p_deposit_type TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_credit NUMERIC;
  new_balance NUMERIC;
BEGIN
  total_credit := p_amount + COALESCE(p_bonus, 0);

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

  RETURN jsonb_build_object(
    'success', true,
    'balance', new_balance,
    'total_credit', total_credit
  );
END;
$$;
