-- 1. Disable the protection trigger
ALTER TABLE public.profiles DISABLE TRIGGER tr_protect_profile_sensitive_fields;
-- 2. Update your account (replace 'your name' with the name on your profile)
UPDATE public.profiles 
SET is_super_admin = true, is_admin = true 
WHERE full_name ILIKE 'Walter Capa';
-- 3. Re-enable the protection trigger
ALTER TABLE public.profiles ENABLE TRIGGER tr_protect_profile_sensitive_fields;