-- Function to verify if a token belongs to a specific user
CREATE OR REPLACE FUNCTION public.verify_user_token(user_email TEXT, token_value TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id_from_email UUID;
  token_valid BOOLEAN;
BEGIN
  -- Get user id from email
  SELECT id INTO user_id_from_email 
  FROM auth.users 
  WHERE email = user_email;
  
  -- Check if the token matches the one used by this user
  SELECT EXISTS (
    SELECT 1 FROM public.signup_tokens 
    WHERE token = token_value 
    AND used = true 
    AND used_by = user_id_from_email
  ) INTO token_valid;
  
  RETURN token_valid;
END;
$$;