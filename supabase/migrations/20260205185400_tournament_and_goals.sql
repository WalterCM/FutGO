-- Add match_mode to matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_mode text DEFAULT 'liguilla';

-- Add goals JSONB to games
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS goals jsonb DEFAULT '[]'::jsonb;
