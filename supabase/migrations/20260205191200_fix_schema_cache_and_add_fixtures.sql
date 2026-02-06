-- Add fixtures JSONB to matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS fixtures jsonb DEFAULT '[]'::jsonb;

-- Extra check for match_mode just in case
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_mode text DEFAULT 'liguilla';

-- Reload schema for PostgREST
NOTIFY pgrst, 'reload schema';
