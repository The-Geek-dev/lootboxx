
CREATE TABLE IF NOT EXISTS public.slot_configs (
  game_id text PRIMARY KEY,
  reel_count integer NOT NULL,
  has_wild boolean NOT NULL DEFAULT false,
  symbols text[] NOT NULL
);

GRANT SELECT ON public.slot_configs TO anon, authenticated;
GRANT ALL ON public.slot_configs TO service_role;
ALTER TABLE public.slot_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Slot configs are public" ON public.slot_configs;
CREATE POLICY "Slot configs are public" ON public.slot_configs FOR SELECT USING (true);

INSERT INTO public.slot_configs (game_id, reel_count, has_wild, symbols) VALUES
('fire-strike',5,true, ARRAY['🔥','💥','⚡','🌟','💎','7️⃣']),
('hot-burn',4,true, ARRAY['🌶️','🔥','💰','⭐','🍒','7️⃣']),
('wild-west',3,true, ARRAY['🤠','🐎','💰','🌵','⭐','🔫']),
('pharaoh-gold',5,true, ARRAY['🏛️','👁️','💎','🐍','⭐','🔮']),
('mystic-gems',4,true, ARRAY['💠','💎','🔮','⭐','🌙','✨']),
('neon-lights',5,false, ARRAY['💡','🌈','⚡','💎','⭐','🎆']),
('viking-saga',4,true, ARRAY['⚔️','🛡️','🏰','💎','⭐','⚡']),
('zeus-thunder',5,true, ARRAY['⛈️','⚡','🏛️','💎','⭐','🔱']),
('moon-magic',3,false, ARRAY['🌙','✨','🔮','💎','⭐','🌟']),
('lucky-7',3,false, ARRAY['7️⃣','🍒','💎','⭐','🔔','🍋']),
('diamond-rush',4,true, ARRAY['💎','💰','👑','⭐','🔥','✨']),
('jackpot-city',4,true, ARRAY['🏙️','💰','💎','7️⃣','⭐','🎰']),
('dragon-fortune',4,true, ARRAY['🐉','🔥','💎','👑','⭐','🏮']),
('star-burst',5,true, ARRAY['⭐','💫','✨','🌟','💎','🔥']),
('ice-cold',3,false, ARRAY['🧊','❄️','💎','⭐','🌊','☃️']),
('hot-pepper',3,false, ARRAY['🌶️','🔥','💰','💎','⭐','7️⃣']),
('safari-wild',4,true, ARRAY['🦒','🦁','🐘','💎','⭐','🌴']),
('spin-match',3,false, ARRAY['🎯','💎','⭐','🔥','🍒','7️⃣']),
('pirate-loot',5,true, ARRAY['☠️','🏴‍☠️','💰','💎','⭐','🗡️']),
('magic-lamp',4,true, ARRAY['🪔','🧞','💎','⭐','👑','✨'])
ON CONFLICT (game_id) DO UPDATE SET reel_count = EXCLUDED.reel_count, has_wild = EXCLUDED.has_wild, symbols = EXCLUDED.symbols;

CREATE OR REPLACE FUNCTION public.resolve_slots_round(p_game_type text, p_point_cost integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid := auth.uid();
  v_reel_count int;
  v_has_wild boolean;
  v_symbols text[];
  WILD text := '🃏';
  v_reels text[] := ARRAY[]::text[];
  v_effective text[] := ARRAY[]::text[];
  v_wilds int[] := ARRAY[]::int[];
  v_best text;
  v_best_count int := -1;
  v_cnt int;
  v_sym text;
  v_idx int;
  v_all_match boolean := true;
  v_pairs int := 0;
  v_tiers numeric[] := ARRAY[5000,3000,1500,1000,500,300];
  v_tiers_json jsonb;
  v_engine jsonb;
  v_one_pair numeric := 300;
  v_two_pair numeric := 800;
  v_payout numeric := 0;
  v_is_jackpot boolean := false;
  v_settle jsonb;
BEGIN
  IF caller_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_point_cost < 0 THEN RAISE EXCEPTION 'Invalid point cost'; END IF;

  SELECT reel_count, has_wild, symbols INTO v_reel_count, v_has_wild, v_symbols
  FROM public.slot_configs WHERE game_id = p_game_type;
  IF v_reel_count IS NULL THEN RAISE EXCEPTION 'Unknown slots game %', p_game_type; END IF;

  SELECT value INTO v_tiers_json FROM public.payout_overrides WHERE key = 'SLOTS_PAYOUT_TIERS';
  IF v_tiers_json IS NOT NULL AND jsonb_typeof(v_tiers_json) = 'array' AND jsonb_array_length(v_tiers_json) = 6 THEN
    SELECT array_agg(x::numeric ORDER BY ord) INTO v_tiers
    FROM jsonb_array_elements_text(v_tiers_json) WITH ORDINALITY AS t(x, ord);
  END IF;

  SELECT value INTO v_engine FROM public.payout_overrides WHERE key = 'SLOTS_ENGINE';
  IF v_engine IS NOT NULL THEN
    v_one_pair := COALESCE((v_engine->>'onePair')::numeric, v_one_pair);
    v_two_pair := COALESCE((v_engine->>'twoPair')::numeric, v_two_pair);
  END IF;

  -- Roll reels
  FOR i IN 1..v_reel_count LOOP
    IF v_has_wild AND random() < 0.06 THEN
      v_reels := v_reels || WILD;
      v_wilds := v_wilds || (i - 1);
    ELSE
      v_reels := v_reels || v_symbols[1 + floor(random() * array_length(v_symbols, 1))::int];
    END IF;
  END LOOP;

  -- Best non-wild symbol (first-occurrence order wins ties)
  FOR i IN 1..v_reel_count LOOP
    v_sym := v_reels[i];
    CONTINUE WHEN v_sym = WILD;
    SELECT count(*) INTO v_cnt FROM unnest(v_reels) AS s WHERE s = v_sym;
    IF v_cnt > v_best_count THEN
      v_best_count := v_cnt;
      v_best := v_sym;
    END IF;
  END LOOP;
  IF v_best IS NULL THEN v_best := v_reels[1]; END IF;

  FOR i IN 1..v_reel_count LOOP
    v_effective := v_effective || (CASE WHEN v_reels[i] = WILD THEN v_best ELSE v_reels[i] END);
  END LOOP;

  FOR i IN 1..v_reel_count LOOP
    IF v_effective[i] IS DISTINCT FROM v_effective[1] THEN v_all_match := false; END IF;
  END LOOP;

  IF v_reel_count >= 3 THEN
    v_pairs := (CASE WHEN v_effective[1] = v_effective[2] THEN 1 ELSE 0 END)
             + (CASE WHEN v_effective[2] = v_effective[3] THEN 1 ELSE 0 END)
             + (CASE WHEN v_effective[1] = v_effective[3] THEN 1 ELSE 0 END);
  END IF;

  IF v_all_match THEN
    v_idx := array_position(v_symbols, v_effective[1]);
    IF v_idx IS NULL THEN
      v_payout := 500;
    ELSE
      v_payout := COALESCE(v_tiers[((v_idx - 1) % 6) + 1], 500);
    END IF;
    IF v_reel_count >= 4 THEN v_payout := floor(v_payout * 1.5); END IF;
    IF v_reel_count >= 5 THEN v_payout := floor(v_payout * 2); END IF;
    IF array_length(v_wilds, 1) > 0 THEN
      v_payout := floor(v_payout * (1 + array_length(v_wilds, 1) * 0.5));
    END IF;
    IF v_effective[1] = v_symbols[1] OR v_effective[1] = '7️⃣' THEN v_is_jackpot := true; END IF;
  ELSIF v_pairs > 0 THEN
    v_payout := CASE WHEN v_pairs = 1 THEN v_one_pair ELSE v_two_pair END;
  END IF;

  v_settle := public.settle_game_round(
    caller_id, p_game_type, p_point_cost, v_payout,
    jsonb_build_object('reels', to_jsonb(v_reels), 'effective', to_jsonb(v_effective), 'wilds', to_jsonb(v_wilds), 'is_jackpot', v_is_jackpot)
  );

  RETURN jsonb_build_object(
    'reels', to_jsonb(v_reels),
    'effective', to_jsonb(v_effective),
    'wilds', to_jsonb(v_wilds),
    'payout', (v_settle->>'win_amount')::numeric,
    'is_jackpot', v_is_jackpot,
    'points', (v_settle->>'points')::int,
    'balance', (v_settle->>'balance')::numeric
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_game_result(p_game_type text, p_point_cost integer, p_win_amount numeric, p_result jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_game_type IN ('dice-royale', 'golden-dice', 'dice-duel', 'dragon-dice', 'dice-master') THEN
    RAISE EXCEPTION 'This game must be played via resolve_dice_round, not apply_game_result';
  END IF;

  IF p_game_type IN ('roulette') THEN
    RAISE EXCEPTION 'This game must be played via resolve_roulette_round, not apply_game_result';
  END IF;

  IF p_game_type IN ('keno') THEN
    RAISE EXCEPTION 'This game must be played via resolve_keno_round, not apply_game_result';
  END IF;

  IF p_game_type IN ('plinko') THEN
    RAISE EXCEPTION 'This game must be played via resolve_plinko_round, not apply_game_result';
  END IF;

  IF EXISTS (SELECT 1 FROM public.slot_configs WHERE game_id = p_game_type) THEN
    RAISE EXCEPTION 'This game must be played via resolve_slots_round, not apply_game_result';
  END IF;

  RETURN public.settle_game_round(caller_id, p_game_type, p_point_cost, p_win_amount, p_result);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.resolve_slots_round(text, integer) TO authenticated;
