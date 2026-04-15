
-- Table for admin-controlled per-user game difficulty and profit modifiers
CREATE TABLE public.user_game_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  difficulty_level INTEGER NOT NULL DEFAULT 5 CHECK (difficulty_level BETWEEN 1 AND 10),
  win_rate_modifier NUMERIC NOT NULL DEFAULT 1.0,
  payout_modifier NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_game_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage these settings
CREATE POLICY "Admins can view all user game settings"
ON public.user_game_settings FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert user game settings"
ON public.user_game_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user game settings"
ON public.user_game_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user game settings"
ON public.user_game_settings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_user_game_settings_updated_at
BEFORE UPDATE ON public.user_game_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function so game engines can read the current user's settings without exposing the table
CREATE OR REPLACE FUNCTION public.get_my_game_settings()
RETURNS TABLE(difficulty_level INTEGER, win_rate_modifier NUMERIC, payout_modifier NUMERIC, is_active BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT difficulty_level, win_rate_modifier, payout_modifier, is_active
  FROM public.user_game_settings
  WHERE user_id = auth.uid() AND is_active = true
  LIMIT 1;
$$;
