
-- Streak columns on wallet
ALTER TABLE public.user_wallets
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS longest_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_play_date date;

-- Email preferences (per-user opt outs)
CREATE TABLE IF NOT EXISTS public.email_preferences (
  user_id uuid PRIMARY KEY,
  nudge_emails_enabled boolean NOT NULL DEFAULT true,
  unsubscribe_token text NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_preferences_token_idx ON public.email_preferences (unsubscribe_token);

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own email prefs" ON public.email_preferences;
CREATE POLICY "Users view own email prefs"
  ON public.email_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own email prefs" ON public.email_preferences;
CREATE POLICY "Users update own email prefs"
  ON public.email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own email prefs" ON public.email_preferences;
CREATE POLICY "Users insert own email prefs"
  ON public.email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Streak update RPC
CREATE OR REPLACE FUNCTION public.record_play_streak()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid;
  v_last date;
  v_current int;
  v_longest int;
  v_today date := (now() AT TIME ZONE 'Africa/Lagos')::date;
  v_new_streak int;
  v_milestone_bonus int := 0;
  v_milestone_hit int := 0;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT last_play_date, current_streak, longest_streak
    INTO v_last, v_current, v_longest
  FROM public.user_wallets
  WHERE user_id = caller_id
  FOR UPDATE;

  IF v_last = v_today THEN
    -- already counted today
    RETURN jsonb_build_object('streak', v_current, 'changed', false);
  ELSIF v_last = v_today - 1 THEN
    v_new_streak := v_current + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  -- Milestones: 3, 7, 14, 30, 60, 100 days
  IF v_new_streak IN (3, 7, 14, 30, 60, 100) THEN
    v_milestone_hit := v_new_streak;
    v_milestone_bonus := CASE v_new_streak
      WHEN 3 THEN 100
      WHEN 7 THEN 300
      WHEN 14 THEN 700
      WHEN 30 THEN 2000
      WHEN 60 THEN 5000
      WHEN 100 THEN 10000
    END;
  END IF;

  UPDATE public.user_wallets
  SET current_streak = v_new_streak,
      longest_streak = GREATEST(v_longest, v_new_streak),
      last_play_date = v_today,
      points = points + v_milestone_bonus,
      updated_at = now()
  WHERE user_id = caller_id;

  IF v_milestone_bonus > 0 THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      caller_id,
      '🔥 ' || v_milestone_hit || '-day streak!',
      'You earned ' || v_milestone_bonus || ' bonus points for keeping your daily streak. Keep it going!',
      'streak'
    );
  END IF;

  RETURN jsonb_build_object(
    'streak', v_new_streak,
    'milestone', v_milestone_hit,
    'bonus_points', v_milestone_bonus,
    'changed', true
  );
END;
$$;
