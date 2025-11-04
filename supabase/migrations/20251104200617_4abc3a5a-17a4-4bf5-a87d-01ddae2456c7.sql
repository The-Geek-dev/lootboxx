-- Create signup tokens table
CREATE TABLE public.signup_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.signup_tokens ENABLE ROW LEVEL SECURITY;

-- Admin policy (for now, no one can directly query - we'll use functions)
CREATE POLICY "Service role can manage tokens" 
ON public.signup_tokens 
FOR ALL 
USING (false);

-- Function to validate and mark token as used
CREATE OR REPLACE FUNCTION public.validate_signup_token(token_value TEXT, user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_exists BOOLEAN;
BEGIN
  -- Check if token exists and is not used
  SELECT EXISTS (
    SELECT 1 FROM public.signup_tokens 
    WHERE token = token_value AND used = false
  ) INTO token_exists;
  
  IF token_exists THEN
    -- Mark token as used
    UPDATE public.signup_tokens 
    SET used = true, used_by = user_id, used_at = now()
    WHERE token = token_value;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Insert 50 unique tokens
INSERT INTO public.signup_tokens (token) VALUES
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8)),
  ('ASTRA-' || substr(md5(random()::text), 1, 8));