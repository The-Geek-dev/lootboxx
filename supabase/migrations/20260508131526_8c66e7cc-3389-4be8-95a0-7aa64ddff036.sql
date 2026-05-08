-- Enums
CREATE TYPE public.prediction_region AS ENUM ('nigeria', 'global');
CREATE TYPE public.prediction_tier AS ENUM ('regular', 'vip');
CREATE TYPE public.prediction_outcome AS ENUM ('yes', 'no', 'void');
CREATE TYPE public.prediction_side AS ENUM ('yes', 'no');
CREATE TYPE public.prediction_currency AS ENUM ('points', 'cash');

-- Markets
CREATE TABLE public.prediction_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region prediction_region NOT NULL,
  tier prediction_tier NOT NULL,
  currency prediction_currency NOT NULL,
  question text NOT NULL,
  description text,
  category text,
  source_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  deadline timestamptz NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  outcome prediction_outcome,
  yes_pool numeric NOT NULL DEFAULT 0,
  no_pool numeric NOT NULL DEFAULT 0,
  total_stakers integer NOT NULL DEFAULT 0,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX idx_pred_markets_open ON public.prediction_markets (region, tier, resolved, deadline);

ALTER TABLE public.prediction_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view markets" ON public.prediction_markets
  FOR SELECT USING (true);
CREATE POLICY "Admins insert markets" ON public.prediction_markets
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update markets" ON public.prediction_markets
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete markets" ON public.prediction_markets
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Service role bypasses RLS automatically; edge functions will use it to insert markets.

-- Stakes
CREATE TABLE public.prediction_stakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id uuid NOT NULL REFERENCES public.prediction_markets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  side prediction_side NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency prediction_currency NOT NULL,
  payout numeric NOT NULL DEFAULT 0,
  settled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pred_stakes_user ON public.prediction_stakes (user_id, created_at DESC);
CREATE INDEX idx_pred_stakes_market ON public.prediction_stakes (market_id);

ALTER TABLE public.prediction_stakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own stakes" ON public.prediction_stakes
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
-- Inserts/updates only via SECURITY DEFINER RPCs.

-- Place stake
CREATE OR REPLACE FUNCTION public.place_prediction_stake(
  p_market_id uuid, p_side prediction_side, p_amount numeric
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_id uuid := auth.uid();
  m public.prediction_markets;
  v_points int;
  v_balance numeric;
  v_min numeric;
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;

  SELECT * INTO m FROM public.prediction_markets WHERE id = p_market_id FOR UPDATE;
  IF m.id IS NULL THEN RAISE EXCEPTION 'Market not found'; END IF;
  IF m.resolved THEN RAISE EXCEPTION 'Market already resolved'; END IF;
  IF m.deadline <= now() THEN RAISE EXCEPTION 'Market closed'; END IF;

  v_min := CASE WHEN m.currency = 'points' THEN 20 ELSE 100 END;
  IF p_amount < v_min THEN RAISE EXCEPTION 'Minimum stake is %', v_min; END IF;

  IF m.currency = 'points' THEN
    SELECT points INTO v_points FROM public.user_wallets WHERE user_id = caller_id FOR UPDATE;
    IF v_points IS NULL OR v_points < p_amount THEN RAISE EXCEPTION 'Insufficient points'; END IF;
    UPDATE public.user_wallets SET points = points - p_amount::int, updated_at = now()
      WHERE user_id = caller_id;
  ELSE
    SELECT balance INTO v_balance FROM public.user_wallets WHERE user_id = caller_id FOR UPDATE;
    IF v_balance IS NULL OR v_balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
    UPDATE public.user_wallets SET balance = balance - p_amount, updated_at = now()
      WHERE user_id = caller_id;
  END IF;

  INSERT INTO public.prediction_stakes (market_id, user_id, side, amount, currency)
    VALUES (p_market_id, caller_id, p_side, p_amount, m.currency);

  IF p_side = 'yes' THEN
    UPDATE public.prediction_markets SET yes_pool = yes_pool + p_amount, total_stakers = total_stakers + 1
      WHERE id = p_market_id;
  ELSE
    UPDATE public.prediction_markets SET no_pool = no_pool + p_amount, total_stakers = total_stakers + 1
      WHERE id = p_market_id;
  END IF;

  RETURN jsonb_build_object('success', true);
END $$;

-- Resolve market (admin or service role)
CREATE OR REPLACE FUNCTION public.resolve_prediction_market(
  p_market_id uuid, p_outcome prediction_outcome, p_notes text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_id uuid := auth.uid();
  m public.prediction_markets;
  s record;
  winning_pool numeric;
  losing_pool numeric;
  payout numeric;
  total_paid numeric := 0;
BEGIN
  IF caller_id IS NOT NULL AND NOT public.has_role(caller_id, 'admin') THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT * INTO m FROM public.prediction_markets WHERE id = p_market_id FOR UPDATE;
  IF m.id IS NULL THEN RAISE EXCEPTION 'Market not found'; END IF;
  IF m.resolved THEN RETURN jsonb_build_object('success', false, 'reason', 'already_resolved'); END IF;

  IF p_outcome = 'void' THEN
    -- Refund all stakes
    FOR s IN SELECT * FROM public.prediction_stakes WHERE market_id = p_market_id LOOP
      IF s.currency = 'points' THEN
        UPDATE public.user_wallets SET points = points + s.amount::int, updated_at = now() WHERE user_id = s.user_id;
      ELSE
        UPDATE public.user_wallets SET balance = balance + s.amount, updated_at = now() WHERE user_id = s.user_id;
      END IF;
      UPDATE public.prediction_stakes SET payout = s.amount, settled = true WHERE id = s.id;
      total_paid := total_paid + s.amount;
    END LOOP;
  ELSE
    IF p_outcome = 'yes' THEN
      winning_pool := m.yes_pool; losing_pool := m.no_pool;
    ELSE
      winning_pool := m.no_pool; losing_pool := m.yes_pool;
    END IF;

    -- Pay winners pro-rata: stake + share of losing pool
    IF winning_pool > 0 THEN
      FOR s IN SELECT * FROM public.prediction_stakes WHERE market_id = p_market_id AND side = p_outcome::text::prediction_side LOOP
        payout := s.amount + (losing_pool * (s.amount / winning_pool));
        IF s.currency = 'points' THEN
          UPDATE public.user_wallets SET points = points + payout::int, updated_at = now() WHERE user_id = s.user_id;
        ELSE
          UPDATE public.user_wallets
            SET balance = balance + payout,
                total_won = total_won + GREATEST(0, payout - s.amount),
                updated_at = now()
            WHERE user_id = s.user_id;
        END IF;
        UPDATE public.prediction_stakes SET payout = payout, settled = true WHERE id = s.id;
        total_paid := total_paid + payout;
      END LOOP;
    END IF;
    -- Mark losing stakes settled with 0 payout
    UPDATE public.prediction_stakes SET settled = true
      WHERE market_id = p_market_id AND settled = false;
  END IF;

  UPDATE public.prediction_markets
    SET resolved = true, outcome = p_outcome, resolution_notes = p_notes, resolved_at = now()
    WHERE id = p_market_id;

  RETURN jsonb_build_object('success', true, 'total_paid', total_paid);
END $$;