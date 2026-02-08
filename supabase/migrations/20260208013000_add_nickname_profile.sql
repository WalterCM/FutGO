-- Add nickname and profile_complete columns for profile confirmation flow

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;

-- Mark existing profiles as complete (they already set up their accounts)
UPDATE public.profiles SET profile_complete = true WHERE profile_complete IS NULL OR profile_complete = false;

-- For new users, profile_complete will be false by default
-- After they confirm their profile, it will be set to true

COMMENT ON COLUMN public.profiles.nickname IS 'Optional display name shown to other players instead of full_name';
COMMENT ON COLUMN public.profiles.profile_complete IS 'False until user confirms their profile after first Google login';
