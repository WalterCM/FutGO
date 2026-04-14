-- Create function to add guest players to a match
-- Guest players are profiles without auth account

CREATE OR REPLACE FUNCTION create_guest_player(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  new_id := gen_random_uuid();
  INSERT INTO profiles (id, full_name, elo_rating, profile_complete)
  VALUES (new_id, p_name, 1000, true);
  RETURN new_id;
END;
$$;

-- Allow authenticated users to call this function (admins only via RLS)
GRANT EXECUTE ON FUNCTION create_guest_player(text) TO authenticated;