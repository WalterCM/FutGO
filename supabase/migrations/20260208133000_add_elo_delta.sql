-- Add elo_delta to enrollments to track ELO changes per match
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS elo_delta INTEGER DEFAULT 0;
