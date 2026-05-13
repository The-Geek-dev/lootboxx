CREATE TABLE public.promo_push_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  campaign text NOT NULL DEFAULT 'launch_promo_4500',
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_push_log_user_campaign_sent
  ON public.promo_push_log (user_id, campaign, sent_at DESC);

ALTER TABLE public.promo_push_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages promo push log"
  ON public.promo_push_log
  FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Admins can view promo push log"
  ON public.promo_push_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));