-- Add present_at column to track arrival order
ALTER TABLE public.enrollments ADD COLUMN present_at TIMESTAMP WITH TIME ZONE;

-- Optional: Initialize existing present players with created_at if needed,
-- but since we are in dev/reset mode, it's safer to just let it be.
