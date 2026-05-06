
CREATE TABLE public.payment_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  reference text NOT NULL,
  amount numeric NOT NULL,
  deposit_type text,
  status text NOT NULL DEFAULT 'initiated',
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_attempts_user ON public.payment_attempts(user_id, created_at DESC);
CREATE INDEX idx_payment_attempts_ref ON public.payment_attempts(reference);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payment attempts"
  ON public.payment_attempts FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages payment attempts"
  ON public.payment_attempts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER trg_payment_attempts_updated
BEFORE UPDATE ON public.payment_attempts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
