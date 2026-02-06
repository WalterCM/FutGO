-- SECURITY HARDENING MIGRATION
-- This file implements strict database-level integrity and security policies.

-- 1. CAPACITY VALIDATION TRIGGER
CREATE OR REPLACE FUNCTION public.check_enrollment_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_p INTEGER;
    waitlist_p INTEGER;
BEGIN
    -- Get match limits
    SELECT max_players INTO max_p FROM public.matches WHERE id = NEW.match_id;
    
    -- If no max_players set, default to something sensible (e.g. 20)
    IF max_p IS NULL THEN
        max_p := 20;
    END IF;

    -- Waitlist is hardcoded to 5 for now (could be a match property later)
    waitlist_p := 5;

    -- Count existing enrollments for this match
    SELECT COUNT(*) INTO current_count FROM public.enrollments WHERE match_id = NEW.match_id;

    -- If we exceed (max + waitlist), reject the insert
    IF current_count >= (max_p + waitlist_p) THEN
        RAISE EXCEPTION 'EL PARTIDO ESTÁ COMPLETAMENTE LLENO (incluyendo lista de espera)';
    END IF;

    -- Set is_waitlist flag automatically if we are over max_players
    IF current_count >= max_p THEN
        NEW.is_waitlist := true;
    ELSE
        NEW.is_waitlist := false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_enrollment_limit ON public.enrollments;
CREATE TRIGGER tr_check_enrollment_limit
BEFORE INSERT ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.check_enrollment_limit();


-- 2. PROFILE PROTECTION TRIGGER
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER AS $$
DECLARE
    is_requesting_admin BOOLEAN;
BEGIN
    -- Check if we are running in a system context (CLI, migrations, etc.)
    -- Or if the requester is an actual super admin in the profiles table
    is_requesting_admin := (
        current_user IN ('postgres', 'service_role') OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_super_admin = true)
        )
    );

    -- If not a super admin, block changes to sensitive fields
    IF NOT is_requesting_admin THEN
        IF NEW.id != auth.uid() THEN
            RAISE EXCEPTION 'No tienes permiso para editar este perfil';
        END IF;

        IF NEW.is_admin != OLD.is_admin OR 
           NEW.is_super_admin != OLD.is_super_admin OR 
           NEW.balance != OLD.balance THEN
            RAISE EXCEPTION 'Solo un Administrador puede cambiar rangos o saldos';
        END IF;

        -- Prevent ELO manipulation (only games should update this)
        IF NEW.elo_rating != OLD.elo_rating THEN
            RAISE EXCEPTION 'El ELO solo se actualiza automáticamente por resultados de partidos';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_profile_sensitive_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_sensitive_fields
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_fields();


-- 3. ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;


-- 4. RLS POLICIES

-- PROFILES:
-- Everyone can see (public ranking)
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
-- Users can fill their basic data on first login
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Users can update themselves (trigger handles sensitive fields)
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- MATCHES:
-- Everyone can see
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
-- Only admins can create/update
CREATE POLICY "Only admins can manage matches" ON public.matches FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
-- Only super admins can delete (This overrides the policy above for DELETE)
DROP POLICY IF EXISTS "Solo Super Admins pueden borrar partidos" ON "public"."matches";
CREATE POLICY "Only super admins can delete matches" ON public.matches FOR DELETE 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true));

-- ENROLLMENTS:
-- Everyone can see who's playing
CREATE POLICY "Enrollments are viewable by everyone" ON public.enrollments FOR SELECT USING (true);
-- Authenticated users can join (Capacity trigger handles the rest)
CREATE POLICY "Users can enroll themselves" ON public.enrollments FOR INSERT 
    WITH CHECK (auth.uid() = player_id);
-- Users can leave themselves
CREATE POLICY "Users can remove their own enrollment" ON public.enrollments FOR DELETE 
    USING (auth.uid() = player_id);
-- Admins can manage all enrollments (e.g. for manual payments/presence)
CREATE POLICY "Admins can manage all enrollments" ON public.enrollments FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- FIELDS & GAMES:
-- Everyone can see
CREATE POLICY "Fields are viewable by everyone" ON public.fields FOR SELECT USING (true);
CREATE POLICY "Games are viewable by everyone" ON public.games FOR SELECT USING (true);
-- Only admins can manage
CREATE POLICY "Only admins can manage fields" ON public.fields FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Only admins can manage games" ON public.games FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
