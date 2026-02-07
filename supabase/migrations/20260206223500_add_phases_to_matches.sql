-- Add phases JSONB column to matches for Phase-Based Architecture
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS phases jsonb DEFAULT '[]'::jsonb;

-- Reload PostgREST schema
NOTIFY pgrst, 'reload schema';
