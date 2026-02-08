-- Update trigger to handle Google OAuth users
-- Google OAuth stores name in raw_user_meta_data->>'name' or ->>'full_name'

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Try to get name from various possible locations in metadata
  -- Google OAuth uses 'name', email/password signup uses 'full_name'
  user_name := COALESCE(
    new.raw_user_meta_data->>'name',           -- Google OAuth
    new.raw_user_meta_data->>'full_name',      -- Email signup
    split_part(new.email, '@', 1)              -- Fallback to email prefix
  );
  
  INSERT INTO public.profiles (id, full_name, is_admin, balance, elo_rating, profile_complete)
  VALUES (new.id, user_name, false, 0, 1000, false);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
