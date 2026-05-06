CREATE TABLE public.ad_settings (
  id integer PRIMARY KEY DEFAULT 1,
  adsterra_enabled boolean NOT NULL DEFAULT true,
  route_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  slot_order jsonb NOT NULL DEFAULT '["ad-home-top","ad-home-mid","ad-home-bottom","ad-about-mid","ad-about-bottom","ad-faq-bottom"]'::jsonb,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ad_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.ad_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ad settings" ON public.ad_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins insert ad settings" ON public.ad_settings
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update ad settings" ON public.ad_settings
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.ad_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER ad_settings_updated_at
  BEFORE UPDATE ON public.ad_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();