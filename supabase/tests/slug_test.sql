-- Test Match Slug Generation Trigger

BEGIN;

-- 1. Setup test data
INSERT INTO public.fields (id, name, nickname, players_per_team, price_per_hour)
VALUES ('00000000-0000-0000-0000-000000000999', 'Cancha de Prueba - Lolo', 'Lolo', 5, 100.00);

-- 2. Insert match and check generated slug
INSERT INTO public.matches (id, field_id, date, time, creator_id)
VALUES ('00000000-0000-0000-0000-000000000123', '00000000-0000-0000-0000-000000000999', '2026-02-15', '20:00:00', '00000000-0000-0000-0000-100000000001');

-- Slug should be 'lolo-domingo-15-feb-26' (2026-02-15 is Sunday)
DO $$
DECLARE
    v_slug TEXT;
BEGIN
    SELECT slug INTO v_slug FROM public.matches WHERE id = '00000000-0000-0000-0000-000000000123';
    
    IF v_slug != 'lolo-domingo-15-feb-26' THEN
        RAISE EXCEPTION 'Slug generation failed! Expected lolo-domingo-15-feb-26, got %', v_slug;
    END IF;
    
    RAISE NOTICE 'Slug generation test passed: %', v_slug;
END $$;

-- 3. Test collision handling (same field, same day, different time)
INSERT INTO public.matches (id, field_id, date, time, creator_id)
VALUES ('00000000-0000-0000-0000-000000000456', '00000000-0000-0000-0000-000000000999', '2026-02-15', '22:00:00', '00000000-0000-0000-0000-100000000001');

-- Slug should be 'lolo-domingo-15-feb-26-22h'
DO $$
DECLARE
    v_slug TEXT;
BEGIN
    SELECT slug INTO v_slug FROM public.matches WHERE id = '00000000-0000-0000-0000-000000000456';
    
    IF v_slug != 'lolo-domingo-15-feb-26-22h' THEN
        RAISE EXCEPTION 'Collision handling failed! Expected lolo-domingo-15-feb-26-22h, got %', v_slug;
    END IF;
    
    RAISE NOTICE 'Collision handling test passed: %', v_slug;
END $$;

ROLLBACK;
