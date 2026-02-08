-- CLEANUP AND HARDENING MIGRATION (Consolidated)
-- 1. FIX AUTH TRIGGERS FIRST (Ensure they don't reference balance)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  user_name := COALESCE(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );
  
  INSERT INTO public.profiles (id, full_name, is_admin, elo_rating, profile_complete)
  VALUES (new.id, user_name, false, 1000, false);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS TRIGGER AS $$
DECLARE
    is_requesting_admin BOOLEAN;
BEGIN
    is_requesting_admin := (
        current_user IN ('postgres', 'service_role') OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND (is_super_admin = true)
        )
    );

    IF NOT is_requesting_admin THEN
        IF NEW.id != auth.uid() THEN
            RAISE EXCEPTION 'No tienes permiso para editar este perfil';
        END IF;

        IF NEW.is_admin != OLD.is_admin OR 
           NEW.is_super_admin != OLD.is_super_admin THEN
            RAISE EXCEPTION 'Solo un Administrador puede cambiar rangos';
        END IF;

        IF NEW.elo_rating != OLD.elo_rating THEN
            RAISE EXCEPTION 'El ELO solo se actualiza automáticamente por resultados de partidos';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Remove financial tracking column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS balance;

-- 3. Refactor enrollment limit trigger
CREATE OR REPLACE FUNCTION public.check_enrollment_limit()
RETURNS TRIGGER AS $$
DECLARE
    current_count INTEGER;
    max_p INTEGER;
BEGIN
    SELECT max_players INTO max_p FROM public.matches WHERE id = NEW.match_id;
    IF max_p IS NULL THEN max_p := 20; END IF;

    SELECT COUNT(*) INTO current_count 
    FROM public.enrollments 
    WHERE match_id = NEW.match_id 
    AND is_excluded = false;

    IF current_count >= max_p THEN
        NEW.is_waitlist := true;
    ELSE
        NEW.is_waitlist := false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attendance Dependency
CREATE OR REPLACE FUNCTION public.check_attendance_dependency()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_present = true AND NEW.paid = false THEN
        RAISE EXCEPTION 'NO SE PUEDE MARCAR PRESENTE SIN HABER PAGADO';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_attendance_dependency ON public.enrollments;
CREATE TRIGGER tr_check_attendance_dependency
BEFORE INSERT OR UPDATE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.check_attendance_dependency();

-- 5. Lock Protection
CREATE OR REPLACE FUNCTION public.check_match_lock()
RETURNS TRIGGER AS $$
DECLARE
    v_match_id UUID;
    v_is_locked BOOLEAN;
BEGIN
    IF TG_TABLE_NAME = 'enrollments' THEN
        v_match_id := COALESCE(NEW.match_id, OLD.match_id);
    ELSIF TG_TABLE_NAME = 'games' THEN
        v_match_id := COALESCE(NEW.match_day_id, OLD.match_day_id);
    END IF;

    SELECT is_locked INTO v_is_locked FROM public.matches WHERE id = v_match_id;

    IF v_is_locked = true THEN
        RAISE EXCEPTION 'EL PARTIDO ESTÁ FINALIZADO Y BLOQUEADO';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_match_lock_enrollments ON public.enrollments;
CREATE TRIGGER tr_check_match_lock_enrollments
BEFORE UPDATE OR DELETE ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.check_match_lock();

DROP TRIGGER IF EXISTS tr_check_match_lock_games ON public.games;
CREATE TRIGGER tr_check_match_lock_games
BEFORE INSERT OR UPDATE OR DELETE ON public.games
FOR EACH ROW EXECUTE FUNCTION public.check_match_lock();
