
-- Add points and XP columns to user_wallets
ALTER TABLE public.user_wallets
  ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_lives integer NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS xp_last_refill_at timestamp with time zone NOT NULL DEFAULT now();

-- Create renewal_codes table
CREATE TABLE public.renewal_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.renewal_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own renewal codes"
  ON public.renewal_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages renewal codes"
  ON public.renewal_codes FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Create daily_win_tracking table
CREATE TABLE public.daily_win_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  win_date date NOT NULL DEFAULT CURRENT_DATE,
  full_win_count integer NOT NULL DEFAULT 0,
  win_window_hour integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, win_date)
);

ALTER TABLE public.daily_win_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own win tracking"
  ON public.daily_win_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own win tracking"
  ON public.daily_win_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own win tracking"
  ON public.daily_win_tracking FOR UPDATE
  USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
