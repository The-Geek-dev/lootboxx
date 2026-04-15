
-- Progressive jackpot table - single shared row
CREATE TABLE public.progressive_jackpot (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_amount numeric NOT NULL DEFAULT 0.00,
  last_won_by uuid,
  last_won_at timestamp with time zone,
  last_won_amount numeric NOT NULL DEFAULT 0.00,
  total_contributions numeric NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.progressive_jackpot ENABLE ROW LEVEL SECURITY;

-- Everyone can view the jackpot
CREATE POLICY "Anyone can view jackpot" ON public.progressive_jackpot
  FOR SELECT TO public USING (true);

-- Authenticated users can update (contribute to jackpot)
CREATE POLICY "Authenticated users can update jackpot" ON public.progressive_jackpot
  FOR UPDATE TO authenticated USING (true);

-- Insert the initial jackpot row
INSERT INTO public.progressive_jackpot (current_amount, total_contributions)
VALUES (10000, 10000);

-- Function to contribute to jackpot and check for win
CREATE OR REPLACE FUNCTION public.contribute_to_jackpot(contribution numeric, player_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  current_jp numeric;
  won boolean := false;
  win_amount numeric := 0;
BEGIN
  -- Add contribution
  UPDATE progressive_jackpot 
  SET current_amount = current_amount + contribution,
      total_contributions = total_contributions + contribution,
      updated_at = now()
  WHERE id = (SELECT id FROM progressive_jackpot LIMIT 1)
  RETURNING current_amount INTO current_jp;

  -- 0.1% chance to win jackpot on each contribution
  IF random() < 0.001 AND current_jp >= 5000 THEN
    won := true;
    win_amount := current_jp;
    
    UPDATE progressive_jackpot
    SET last_won_by = player_id,
        last_won_at = now(),
        last_won_amount = current_jp,
        current_amount = 5000,
        updated_at = now()
    WHERE id = (SELECT id FROM progressive_jackpot LIMIT 1);
    
    -- Credit the winner
    UPDATE user_wallets
    SET balance = balance + win_amount,
        total_won = total_won + win_amount,
        updated_at = now()
    WHERE user_id = player_id;
  END IF;

  result := jsonb_build_object(
    'current_amount', CASE WHEN won THEN 5000 ELSE current_jp END,
    'won', won,
    'win_amount', win_amount
  );
  
  RETURN result;
END;
$$;
