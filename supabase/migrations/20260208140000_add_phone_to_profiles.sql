-- Add phone column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Update RLS to allow users to update their own phone
-- (Assuming existing RLS allows profile updates for the owner)
-- The cleanup_and_hardening migration already handles general profile updates.
