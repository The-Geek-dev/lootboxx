CREATE TABLE public.user_testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  display_name TEXT NOT NULL,
  location TEXT,
  content TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials"
ON public.user_testimonials FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can view own testimonials"
ON public.user_testimonials FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own testimonials"
ON public.user_testimonials FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own testimonials"
ON public.user_testimonials FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any testimonial"
ON public.user_testimonials FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete testimonials"
ON public.user_testimonials FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_user_testimonials_updated_at
BEFORE UPDATE ON public.user_testimonials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_testimonials_status_created ON public.user_testimonials(status, created_at DESC);