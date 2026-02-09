-- ADD SLUG SUPPORT FOR MATCHES
-- 1. Add nickname to fields for better URL control
ALTER TABLE public.fields ADD COLUMN IF NOT EXISTS nickname TEXT;

-- 2. Add slug to matches (UNIQUE and INDEXED)
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS matches_slug_idx ON public.matches (slug);

-- 3. Trigger function to auto-generate slugs
CREATE OR REPLACE FUNCTION public.generate_match_slug()
RETURNS TRIGGER AS $$
DECLARE
    v_field_name TEXT;
    v_field_nickname TEXT;
    v_base_slug TEXT;
    v_day_name TEXT;
    v_month_name TEXT;
    v_year_short TEXT;
    v_day_num TEXT;
BEGIN
    -- Get field info
    SELECT name, nickname INTO v_field_name, v_field_nickname
    FROM public.fields WHERE id = NEW.field_id;

    -- Normalize field part (prefer nickname, then first word of name)
    IF v_field_nickname IS NOT NULL AND v_field_nickname != '' THEN
        v_base_slug := lower(regexp_replace(v_field_nickname, '[^a-zA-Z0-9]+', '-', 'g'));
    ELSE
        -- Take first word and normalize
        v_base_slug := lower(regexp_replace(split_part(v_field_name, ' ', 1), '[^a-zA-Z0-9]+', '-', 'g'));
    END IF;

    -- Clean up trailing/leading hyphens
    v_base_slug := trim(both '-' from v_base_slug);

    -- Day names mapping (English DOW to Spanish Slugs)
    v_day_name := CASE extract(dow from NEW.date)
        WHEN 0 THEN 'domingo'
        WHEN 1 THEN 'lunes'
        WHEN 2 THEN 'martes'
        WHEN 3 THEN 'miercoles'
        WHEN 4 THEN 'jueves'
        WHEN 5 THEN 'viernes'
        WHEN 6 THEN 'sabado'
    END;

    -- Month names mapping
    v_month_name := CASE extract(month from NEW.date)
        WHEN 1 THEN 'ene'
        WHEN 2 THEN 'feb'
        WHEN 3 THEN 'mar'
        WHEN 4 THEN 'abr'
        WHEN 5 THEN 'may'
        WHEN 6 THEN 'jun'
        WHEN 7 THEN 'jul'
        WHEN 8 THEN 'ago'
        WHEN 9 THEN 'sep'
        WHEN 10 THEN 'oct'
        WHEN 11 THEN 'nov'
        WHEN 12 THEN 'dic'
    END;

    v_day_num := to_char(NEW.date, 'DD');
    v_year_short := to_char(NEW.date, 'YY');

    -- Construct slug: nickname-dayname-daynum-month-year
    NEW.slug := v_base_slug || '-' || v_day_name || '-' || v_day_num || '-' || v_month_name || '-' || v_year_short;

    -- Handle collisions (same field, same day)
    -- If slug already exists for a DIFFERENT match, append hour part
    IF EXISTS (SELECT 1 FROM public.matches WHERE slug = NEW.slug AND id != NEW.id) THEN
        NEW.slug := NEW.slug || '-' || 
            CASE 
                WHEN extract(minute from NEW.time) = 0 THEN to_char(NEW.time, 'HH24') || 'h'
                ELSE replace(to_char(NEW.time, 'HH24:MI'), ':', 'h')
            END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Apply trigger
DROP TRIGGER IF EXISTS tr_sync_match_slug ON public.matches;
CREATE TRIGGER tr_sync_match_slug
    BEFORE INSERT OR UPDATE OF field_id, date, time
    ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_match_slug();

-- 5. Backfill existing matches
UPDATE public.matches SET slug = NULL WHERE slug IS NULL;
