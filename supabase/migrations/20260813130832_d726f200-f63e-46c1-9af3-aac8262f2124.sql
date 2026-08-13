REVOKE EXECUTE ON FUNCTION public.get_or_create_referral_code() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_referral_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_or_create_referral_code() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_stats() TO authenticated;