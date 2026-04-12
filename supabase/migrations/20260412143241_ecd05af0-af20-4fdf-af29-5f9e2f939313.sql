CREATE OR REPLACE FUNCTION public.get_leaderboard(limit_count integer DEFAULT 20)
RETURNS TABLE(
  rank bigint,
  player_name text,
  total_winnings numeric,
  games_played bigint,
  wins bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY SUM(gr.win_amount) DESC) as rank,
    COALESCE(p.full_name, 'Anonymous') as player_name,
    SUM(gr.win_amount) as total_winnings,
    COUNT(gr.id) as games_played,
    COUNT(CASE WHEN gr.win_amount > 0 THEN 1 END) as wins
  FROM public.game_results gr
  LEFT JOIN public.profiles p ON p.user_id = gr.user_id
  GROUP BY gr.user_id, p.full_name
  HAVING SUM(gr.win_amount) > 0
  ORDER BY total_winnings DESC
  LIMIT limit_count;
$$;