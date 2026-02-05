-- Semilla de datos (Fixtures) para FutGO

-- 1. Canchas (Fields)
INSERT INTO public.fields (id, name, players_per_team, price_per_hour, address, google_maps_url, phone)
VALUES 
    ('f1b1a1a1-1111-4111-a111-111111111111', 'Sede Principal - Campo A', 5, 120.00, 'Av. Siempre Viva 123', 'https://www.google.com/maps/search/?api=1&query=Lima+Peru+Av+Siempre+Viva+123', '987654321'),
    ('f2b2b2b2-2222-4222-b222-222222222222', 'La Bombonera Local', 7, 180.00, 'Calle Las Flores 456', 'https://www.google.com/maps/search/?api=1&query=Lima+Peru+Calle+Las+Flores+456', '912345678');

-- 2. Usuarios de Autenticación (Auth Users)
-- Creamos un usuario de prueba para poder loguearnos directo después de un reset.
-- Email: walter@futgo.com | Password: password123
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
VALUES
  ('11111111-1111-4111-a111-111111111111', '00000000-0000-0000-0000-000000000000', 'walter@futgo.com', extensions.crypt('password123', extensions.gen_salt('bf')), now(), 'authenticated', 'authenticated', '{"provider": "email", "providers": ["email"]}', '{"full_name": "Walter Admin"}', now(), now(), '', '', '', '');

-- Identidad para el usuario (necesario para el login de Supabase)
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES
  (gen_random_uuid(), '11111111-1111-4111-a111-111111111111', format('{"sub": "%s", "email": "%s"}', '11111111-1111-4111-a111-111111111111', 'walter@futgo.com')::jsonb, 'email', now(), now(), now(), '11111111-1111-4111-a111-111111111111');

-- 3. Perfiles (Profiles / Players)
-- Usamos ON CONFLICT porque el trigger de auth.users ya crea un perfil base.
INSERT INTO public.profiles (id, full_name, elo_rating, is_admin, is_super_admin, balance)
VALUES 
    ('11111111-1111-4111-a111-111111111111', 'Walter Admin', 1500, true, true, 50.0),
    ('22222222-2222-4222-b222-222222222222', 'Lionel Messi', 2500, false, false, 0.0),
    ('33333333-3333-4333-c333-333333333333', 'Cristiano Ronaldo', 2400, false, false, 10.0),
    ('44444444-4444-4444-d444-444444444444', 'Zinedine Zidane', 2200, false, false, 0.0),
    ('55555555-5555-4555-e555-555555555555', 'Ronaldinho Gaucho', 2300, false, false, 5.0),
    ('66666666-6666-4666-f666-666666666666', 'Luka Modric', 2100, false, false, 0.0)
ON CONFLICT (id) DO UPDATE 
SET 
  full_name = EXCLUDED.full_name,
  elo_rating = EXCLUDED.elo_rating,
  is_admin = EXCLUDED.is_admin,
  is_super_admin = EXCLUDED.is_super_admin,
  balance = EXCLUDED.balance;

-- 4. Partidos (Matches)
INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players)
VALUES 
    ('1c1c1c1c-1111-4111-a111-111111111111', 'f1b1a1a1-1111-4111-a111-111111111111', CURRENT_DATE + INTERVAL '1 day', '20:00:00', 'open', 120.0, '11111111-1111-4111-a111-111111111111', 10);

-- 4. Inscripciones (Enrollments)
INSERT INTO public.enrollments (match_id, player_id, paid, team_assignment)
VALUES 
    ('1c1c1c1c-1111-4111-a111-111111111111', '11111111-1111-4111-a111-111111111111', true, 1),
    ('1c1c1c1c-1111-4111-a111-111111111111', '22222222-2222-4222-b222-222222222222', true, 1),
    ('1c1c1c1c-1111-4111-a111-111111111111', '33333333-3333-4333-c333-333333333333', false, 2),
    ('1c1c1c1c-1111-4111-a111-111111111111', '44444444-4444-4444-d444-444444444444', false, 2);
