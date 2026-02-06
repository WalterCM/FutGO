-- Add fixture_id to games to link them to the timeline
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS fixture_id text;

-- Reload schema for PostgREST
NOTIFY pgrst, 'reload schema';
