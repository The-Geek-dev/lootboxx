
CREATE TABLE public.payout_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read payout overrides"
  ON public.payout_overrides FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert payout overrides"
  ON public.payout_overrides FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update payout overrides"
  ON public.payout_overrides FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete payout overrides"
  ON public.payout_overrides FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_payout_overrides_updated_at
  BEFORE UPDATE ON public.payout_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
