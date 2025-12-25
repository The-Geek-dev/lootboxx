-- Create table for user 2FA settings
CREATE TABLE public.user_2fa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for OTP codes
CREATE TABLE public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for API keys
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] NOT NULL DEFAULT ARRAY['read'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_2fa_settings
CREATE POLICY "Users can view their own 2FA settings"
ON public.user_2fa_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings"
ON public.user_2fa_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
ON public.user_2fa_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for otp_codes (only via service role for security)
CREATE POLICY "Service role manages OTP codes"
ON public.otp_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RLS policies for api_keys
CREATE POLICY "Users can view their own API keys"
ON public.api_keys
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
ON public.api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
ON public.api_keys
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys"
ON public.api_keys
FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at trigger to user_2fa_settings
CREATE TRIGGER update_user_2fa_settings_updated_at
BEFORE UPDATE ON public.user_2fa_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster OTP lookups
CREATE INDEX idx_otp_codes_user_expires ON public.otp_codes(user_id, expires_at);
CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);