-- Allow UPDATE on games when match is locked (INSERT/DELETE still blocked)
-- This lets admins edit goals/scores on saved games without needing to unlock.

DROP TRIGGER IF EXISTS tr_check_match_lock_games ON public.games;

CREATE TRIGGER tr_check_match_lock_games
BEFORE INSERT OR DELETE ON public.games
FOR EACH ROW EXECUTE FUNCTION public.check_match_lock();
