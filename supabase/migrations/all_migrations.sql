-- ============================================
-- FutGO Database Migration Script (IDEMPOTENT)
-- Se puede ejecutar múltiples veces sin errores
-- ============================================

-- 1. Auth Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Maps URL
ALTER TABLE fields ADD COLUMN IF NOT EXISTS maps_url TEXT;

-- 3. Present At
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS present_at TIMESTAMPTZ;

-- 4. Tournament & Goals
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS match_mode text DEFAULT 'liguilla';
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS goals jsonb DEFAULT '[]'::jsonb;

-- 5. Fixtures
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS fixtures jsonb DEFAULT '[]'::jsonb;
NOTIFY pgrst, 'reload schema';

-- 6. Fixture ID
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS fixture_id text;

-- 7. Security Hardening
CREATE OR REPLACE FUNCTION public.check_enrollment_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_p INTEGER;
BEGIN
    SELECT max_players INTO max_p FROM public.matches WHERE id = NEW.match_id;
    IF max_p IS NULL THEN max_p := 20; END IF;
    SELECT COUNT(*) INTO current_count FROM public.enrollments WHERE match_id = NEW.match_id AND is_excluded = false;
    IF current_count >= max_p THEN NEW.is_waitlist := true;
    ELSE NEW.is_waitlist := false; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_enrollment_limit ON public.enrollments;
CREATE TRIGGER tr_check_enrollment_limit BEFORE INSERT ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.check_enrollment_limit();

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER AS $$
DECLARE is_requesting_admin BOOLEAN;
BEGIN
    is_requesting_admin := (current_user IN ('postgres', 'service_role') OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_super_admin = true)));
    IF NOT is_requesting_admin THEN
        IF NEW.id != auth.uid() THEN RAISE EXCEPTION 'No tienes permiso para editar este perfil'; END IF;
        IF NEW.is_admin != OLD.is_admin OR NEW.is_super_admin != OLD.is_super_admin THEN RAISE EXCEPTION 'Solo un Administrador puede cambiar rangos'; END IF;
        IF NEW.elo_rating != OLD.elo_rating THEN RAISE EXCEPTION 'El ELO solo se actualiza automáticamente por resultados de partidos'; END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_protect_profile_sensitive_fields ON public.profiles;
CREATE TRIGGER tr_protect_profile_sensitive_fields BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_profile_sensitive_fields();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Matches are viewable by everyone" ON public.matches;
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
DROP POLICY IF EXISTS "Fields are viewable by everyone" ON public.fields;
CREATE POLICY "Fields are viewable by everyone" ON public.fields FOR SELECT USING (true);
DROP POLICY IF EXISTS "Games are viewable by everyone" ON public.games;
CREATE POLICY "Games are viewable by everyone" ON public.games FOR SELECT USING (true);

-- 8. Phases
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS phases jsonb DEFAULT '[]'::jsonb;

-- 9. Excluded Enrollment
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS is_excluded BOOLEAN DEFAULT false;

-- 10. Google OAuth Trigger (actualizado)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE user_name TEXT;
BEGIN
  user_name := COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  INSERT INTO public.profiles (id, full_name, is_admin, elo_rating, profile_complete)
  VALUES (new.id, user_name, false, 1000, false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Nickname & Profile Complete
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN DEFAULT false;
UPDATE public.profiles SET profile_complete = true WHERE profile_complete IS NULL OR profile_complete = false;

-- 12. Strict RLS
DROP POLICY IF EXISTS "Only admins can manage matches" ON public.matches;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Only admins can manage games" ON public.games;
DROP POLICY IF EXISTS "Creators and superadmins can manage matches" ON public.matches;
CREATE POLICY "Creators and superadmins can manage matches" ON public.matches FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true) OR creator_id = auth.uid()
);
DROP POLICY IF EXISTS "Creators and superadmins can manage enrollments" ON public.enrollments;
CREATE POLICY "Creators and superadmins can manage enrollments" ON public.enrollments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true) OR
    EXISTS (SELECT 1 FROM public.matches WHERE public.matches.id = public.enrollments.match_id AND creator_id = auth.uid())
);
DROP POLICY IF EXISTS "Creators and superadmins can manage games" ON public.games;
CREATE POLICY "Creators and superadmins can manage games" ON public.games FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_super_admin = true) OR
    EXISTS (SELECT 1 FROM public.matches WHERE public.matches.id = public.games.match_day_id AND creator_id = auth.uid())
);

-- 13. Cleanup & Hardening
ALTER TABLE public.profiles DROP COLUMN IF EXISTS balance;

CREATE OR REPLACE FUNCTION public.check_attendance_dependency()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_present = true AND NEW.paid = false THEN RAISE EXCEPTION 'NO SE PUEDE MARCAR PRESENTE SIN HABER PAGADO'; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_attendance_dependency ON public.enrollments;
CREATE TRIGGER tr_check_attendance_dependency BEFORE INSERT OR UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.check_attendance_dependency();

CREATE OR REPLACE FUNCTION public.check_match_lock()
RETURNS TRIGGER AS $$
DECLARE v_match_id UUID; v_is_locked BOOLEAN;
BEGIN
    IF TG_TABLE_NAME = 'enrollments' THEN v_match_id := COALESCE(NEW.match_id, OLD.match_id);
    ELSIF TG_TABLE_NAME = 'games' THEN v_match_id := COALESCE(NEW.match_day_id, OLD.match_day_id); END IF;
    SELECT is_locked INTO v_is_locked FROM public.matches WHERE id = v_match_id;
    IF v_is_locked = true THEN RAISE EXCEPTION 'EL PARTIDO ESTÁ FINALIZADO Y BLOQUEADO'; END IF;
    IF (TG_OP = 'DELETE') THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_match_lock_enrollments ON public.enrollments;
CREATE TRIGGER tr_check_match_lock_enrollments BEFORE UPDATE OR DELETE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION public.check_match_lock();
DROP TRIGGER IF EXISTS tr_check_match_lock_games ON public.games;
CREATE TRIGGER tr_check_match_lock_games BEFORE INSERT OR DELETE ON public.games FOR EACH ROW EXECUTE FUNCTION public.check_match_lock();

-- 14. ELO Delta
ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS elo_delta INTEGER DEFAULT 0;

-- 15. Phone
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 16. Slugs
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS matches_slug_idx ON public.matches (slug);

CREATE OR REPLACE FUNCTION public.generate_match_slug()
RETURNS TRIGGER AS $$
DECLARE v_field_name TEXT; v_field_nickname TEXT; v_base_slug TEXT;
BEGIN
    SELECT name, nickname INTO v_field_name, v_field_nickname FROM public.fields WHERE id = NEW.field_id;
    IF v_field_nickname IS NOT NULL AND v_field_nickname != '' THEN
        v_base_slug := lower(regexp_replace(v_field_nickname, '[^a-zA-Z0-9]+', '-', 'g'));
    ELSE v_base_slug := lower(regexp_replace(split_part(v_field_name, ' ', 1), '[^a-zA-Z0-9]+', '-', 'g'));
    END IF;
    v_base_slug := trim(both '-' from v_base_slug);
    NEW.slug := v_base_slug || '-' ||
        CASE extract(dow from NEW.date)
            WHEN 0 THEN 'domingo' WHEN 1 THEN 'lunes' WHEN 2 THEN 'martes'
            WHEN 3 THEN 'miercoles' WHEN 4 THEN 'jueves' WHEN 5 THEN 'viernes' WHEN 6 THEN 'sabado'
        END || '-' ||
        to_char(NEW.date, 'DD') || '-' ||
        CASE extract(month from NEW.date)
            WHEN 1 THEN 'ene' WHEN 2 THEN 'feb' WHEN 3 THEN 'mar' WHEN 4 THEN 'abr'
            WHEN 5 THEN 'may' WHEN 6 THEN 'jun' WHEN 7 THEN 'jul' WHEN 8 THEN 'ago'
            WHEN 9 THEN 'sep' WHEN 10 THEN 'oct' WHEN 11 THEN 'nov' WHEN 12 THEN 'dic'
        END || '-' ||
        to_char(NEW.date, 'YY');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_match_slug ON public.matches;
CREATE TRIGGER tr_sync_match_slug BEFORE INSERT OR UPDATE OF field_id, date, time ON public.matches FOR EACH ROW EXECUTE FUNCTION public.generate_match_slug();

-- 17. Is Guest
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_guest BOOLEAN DEFAULT false;

CREATE OR REPLACE FUNCTION create_guest_player(p_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_id uuid;
BEGIN
  new_id := gen_random_uuid();
  INSERT INTO profiles (id, full_name, is_guest, elo_rating, profile_complete)
  VALUES (new_id, p_name, true, 1000, true);
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION delete_guest_user(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    DELETE FROM enrollments WHERE player_id = p_user_id;
    DELETE FROM profiles WHERE id = p_user_id;
    RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION create_guest_player(text) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_guest_user(uuid) TO authenticated;

-- Reload schema
NOTIFY pgrst, 'reload schema';
