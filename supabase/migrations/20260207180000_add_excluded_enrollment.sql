-- Add is_excluded column for logical removal of players
-- When a player is "excluded/withdrawn", they are marked but not deleted
-- This prevents them from re-signing up and preserves the history

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS is_excluded BOOLEAN DEFAULT false;

-- Add comment explaining the business logic
COMMENT ON COLUMN public.enrollments.is_excluded IS 'Logical removal: player was withdrawn/excluded from match. Prevents re-signup. Only unpaid players can be excluded.';
