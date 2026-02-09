-- FIX MATCH LOCK TRIGGER RETURN VALUES
-- This corrects the logic where BEFORE DELETE triggers were returning NULL, 
-- effectively cancelling all deletions silently.

CREATE OR REPLACE FUNCTION public.check_match_lock()
RETURNS TRIGGER AS $$
DECLARE
    v_match_id UUID;
    v_is_locked BOOLEAN;
BEGIN
    -- Determine which match ID to check based on the table
    IF TG_TABLE_NAME = 'enrollments' THEN
        v_match_id := COALESCE(NEW.match_id, OLD.match_id);
    ELSIF TG_TABLE_NAME = 'games' THEN
        v_match_id := COALESCE(NEW.match_day_id, OLD.match_day_id);
    END IF;

    -- Check if the match is locked
    SELECT is_locked INTO v_is_locked FROM public.matches WHERE id = v_match_id;

    -- If locked, prevent changes
    IF v_is_locked = true THEN
        RAISE EXCEPTION 'EL PARTIDO ESTÁ FINALIZADO Y BLOQUEADO';
    END IF;

    -- CRITICAL FIX: Return OLD for DELETE operations to proceed
    -- Return NEW for INSERT/UPDATE operations
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
