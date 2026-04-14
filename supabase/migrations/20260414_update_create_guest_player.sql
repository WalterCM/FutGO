-- Update create_guest_player function to set is_guest = true
CREATE OR REPLACE FUNCTION create_guest_player(p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
BEGIN
  new_id := gen_random_uuid();
  INSERT INTO profiles (id, full_name, is_guest, elo_rating, profile_complete)
  VALUES (new_id, p_name, true, 1000, true);
  RETURN new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_guest_player(text) TO authenticated;