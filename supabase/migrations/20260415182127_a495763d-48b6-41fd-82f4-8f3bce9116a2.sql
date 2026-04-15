
-- Remove overly permissive update policy since updates go through SECURITY DEFINER function
DROP POLICY "Authenticated users can update jackpot" ON public.progressive_jackpot;
