-- Function to delete guest user
CREATE OR REPLACE FUNCTION delete_guest_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First delete enrollments
    DELETE FROM enrollments WHERE player_id = p_user_id;
    
    -- Then delete profile
    DELETE FROM profiles WHERE id = p_user_id;
    
    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_guest_user(uuid) TO authenticated;