-- Semilla de datos (Fixtures) para FutGO v2.10 (Full Compatibility)
-- Incluye: Walter Admin, Admin, Tester y 35+ cracks mundiales y peruanos.

-- 1. Canchas (Fields)
INSERT INTO public.fields (id, name, players_per_team, price_per_hour, address, google_maps_url, phone)
VALUES 
    ('00000000-0000-0000-0000-f00000000001', 'Sede Principal - Campo A', 5, 120.00, 'Av. Siempre Viva 123', 'https://www.google.com/maps/search/?api=1&query=Sede+Principal+Campo+A', '987654321'),
    ('00000000-0000-0000-0000-f00000000002', 'La Bombonera Local', 7, 180.00, 'Calle Las Flores 456', 'https://www.google.com/maps/search/?api=1&query=La+Bombonera', '912345678'),
    ('00000000-0000-0000-0000-f00000000003', 'Complejo VIP - Grass Natural', 6, 150.00, 'Miraflores 789', 'https://www.google.com/maps/search/?api=1&query=Complejo+VIP', '945678123'),
    ('00000000-0000-0000-0000-f00000000004', 'Estadio FutGO XL', 8, 250.00, 'Cercado de Lima', '', '999888777')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, players_per_team = EXCLUDED.players_per_team;

-- 2. Usuarios de Autenticación (Auth Users) 
-- REGLA: Tokens y Email-related = '', Phone y Timestamps No-Confirmados = NULL
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, 
    email_confirmed_at, recovery_token, confirmation_token, 
    email_change_token_new, email_change, raw_app_meta_data, 
    raw_user_meta_data, is_super_admin, created_at, updated_at, 
    phone_change, phone_change_token, 
    email_change_token_current, email_change_confirm_status, 
    is_sso_user, is_anonymous
)
VALUES
  (
    '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-100000000001', 'authenticated', 'authenticated', 'walter@futgo.com', extensions.crypt('tester123', extensions.gen_salt('bf')), now(),
    '', '', '', '', '{"provider": "email", "providers": ["email"]}', 
    format('{"sub": "%s", "email": "%s", "full_name": "Walter Admin", "email_verified": true, "phone_verified": false}', '00000000-0000-0000-0000-100000000001', 'walter@futgo.com')::jsonb,
    false, now(), now(), '', '', '', 0, false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-200000000001', 'authenticated', 'authenticated', 'tester@futgo.com', extensions.crypt('tester123', extensions.gen_salt('bf')), now(),
    '', '', '', '', '{"provider": "email", "providers": ["email"]}', 
    format('{"sub": "%s", "email": "%s", "full_name": "Tester", "email_verified": true, "phone_verified": false}', '00000000-0000-0000-0000-200000000001', 'tester@futgo.com')::jsonb,
    false, now(), now(), '', '', '', 0, false, false
  ),
  (
    '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-300000000001', 'authenticated', 'authenticated', 'admin@futgo.com', extensions.crypt('tester123', extensions.gen_salt('bf')), now(),
    '', '', '', '', '{"provider": "email", "providers": ["email"]}', 
    format('{"sub": "%s", "email": "%s", "full_name": "Admin", "email_verified": true, "phone_verified": false}', '00000000-0000-0000-0000-300000000001', 'admin@futgo.com')::jsonb,
    false, now(), now(), '', '', '', 0, false, false
  )
ON CONFLICT (id) DO NOTHING;

-- Identidades para auth
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-100000000001', format('{"sub": "%s", "email": "%s", "email_verified": true}', '00000000-0000-0000-0000-100000000001', 'walter@futgo.com')::jsonb, 'email', now(), now(), now(), '00000000-0000-0000-0000-100000000001'),
  (gen_random_uuid(), '00000000-0000-0000-0000-200000000001', format('{"sub": "%s", "email": "%s", "email_verified": true}', '00000000-0000-0000-0000-200000000001', 'tester@futgo.com')::jsonb, 'email', now(), now(), now(), '00000000-0000-0000-0000-200000000001'),
  (gen_random_uuid(), '00000000-0000-0000-0000-300000000001', format('{"sub": "%s", "email": "%s", "email_verified": true}', '00000000-0000-0000-0000-300000000001', 'admin@futgo.com')::jsonb, 'email', now(), now(), now(), '00000000-0000-0000-0000-300000000001')
ON CONFLICT (provider, provider_id) DO NOTHING;

-- 3. Perfiles (Profiles) 
INSERT INTO public.profiles (id, full_name, elo_rating, is_admin, is_super_admin, balance)
VALUES 
    ('00000000-0000-0000-0000-100000000001', 'Walter Admin', 1500, true, true, 100.0),
    ('00000000-0000-0000-0000-200000000001', 'Tester', 1200, false, false, 0.0),
    ('00000000-0000-0000-0000-300000000001', 'Admin', 1350, true, false, 0.0)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, is_admin = EXCLUDED.is_admin, is_super_admin = EXCLUDED.is_super_admin, balance = EXCLUDED.balance;

-- Pool de Jugadores Estrellas
DO $$
DECLARE
    names text[] := ARRAY[
        'Paolo Guerrero', 'Gianluca Lapadula', 'André Carrillo', 'Luis Advíncula', 'Renato Tapia',
        'Piero Quispe', 'Joao Grimaldo', 'Bryan Reyna', 'Yoshimar Yotún', 'Edison Flores',
        'Andy Polo', 'Alex Valera', 'Hernán Barcos', 'Jefferson Farfán', 'Claudio Pizarro',
        'Pedro Gallese', 'Alexander Callens', 'Lionel Messi', 'Cristiano Ronaldo', 'Kylian Mbappé',
        'Erling Haaland', 'Jude Bellingham', 'Vinícius Júnior', 'Kevin De Bruyne', 'Mohamed Salah',
        'Robert Lewandowski', 'Neymar Jr', 'Harry Kane', 'Luka Modric', 'Antoine Griezmann',
        'Bukayo Saka', 'Pedri', 'Gavi', 'Rodri', 'Lautaro Martínez', 'Paulo Dybala', 'Julián Álvarez'
    ];
BEGIN
    FOR i IN 1..cardinality(names) LOOP
        INSERT INTO public.profiles (id, full_name, elo_rating, is_admin, is_super_admin)
        VALUES (
            gen_random_uuid(),
            names[i],
            1000 + (random() * 800)::int,
            false,
            false
        ) ON CONFLICT (id) DO NOTHING;
    END LOOP;
END $$;

-- 4. Partidos (Matches)
INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players, match_mode)
VALUES (
    '00000000-0000-0000-0000-e00000000001', 
    '00000000-0000-0000-0000-f00000000001', 
    CURRENT_DATE + 1, '20:00:00', 'open', 120.0, 
    '00000000-0000-0000-0000-100000000001', 
    10, 'liguilla'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players, match_mode)
VALUES (
    '00000000-0000-0000-0000-e00000000002', 
    '00000000-0000-0000-0000-f00000000003', 
    CURRENT_DATE + 2, '21:00:00', 'open', 180.0, 
    '00000000-0000-0000-0000-100000000001', 
    18, 'tournament'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players, match_mode)
VALUES (
    '00000000-0000-0000-0000-e00000000003', 
    '00000000-0000-0000-0000-f00000000002', 
    CURRENT_DATE + 3, '19:00:00', 'open', 180.0, 
    '00000000-0000-0000-0000-300000000001', 
    14, 'winner_stays'
) ON CONFLICT (id) DO NOTHING;

-- 5. Inscripciones (Enrollments)
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT '00000000-0000-0000-0000-e00000000001', id, true, true, (row_number() over () % 2) + 1, now()
FROM (SELECT id FROM public.profiles WHERE full_name NOT IN ('Walter Admin', 'Tester', 'Admin') LIMIT 10) p
ON CONFLICT (match_id, player_id) DO NOTHING;

INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT '00000000-0000-0000-0000-e00000000002', id, true, true, (row_number() over () % 3) + 1, now()
FROM (SELECT id FROM public.profiles WHERE full_name NOT IN ('Walter Admin', 'Tester', 'Admin') OFFSET 10 LIMIT 15) p
ON CONFLICT (match_id, player_id) DO NOTHING;

INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
VALUES 
    ('00000000-0000-0000-0000-e00000000002', '00000000-0000-0000-0000-100000000001', true, true, 1, now()),
    ('00000000-0000-0000-0000-e00000000002', '00000000-0000-0000-0000-300000000001', true, true, 2, now()),
    ('00000000-0000-0000-0000-e00000000002', '00000000-0000-0000-0000-200000000001', true, true, 3, now())
ON CONFLICT (match_id, player_id) DO NOTHING;

INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT '00000000-0000-0000-0000-e00000000003', id, true, true, (row_number() over () % 2) + 1, now()
FROM (SELECT id FROM public.profiles WHERE full_name NOT IN ('Walter Admin', 'Tester', 'Admin') OFFSET 25 LIMIT 14) p
ON CONFLICT (match_id, player_id) DO NOTHING;

-- 6. Resultados de Juegos (Games) con Goles
-- Partido 1 (Liguilla)
INSERT INTO public.games (match_day_id, team1_id, team2_id, score1, score2, team1_players, team2_players, goals)
SELECT 
    '00000000-0000-0000-0000-e00000000001', 1, 2, 2, 1, 
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = '00000000-0000-0000-0000-e00000000001' AND team_assignment = 1),
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = '00000000-0000-0000-0000-e00000000001' AND team_assignment = 2),
    '[
        {"player_id": "00000000-0000-0000-0000-100000000001", "team_id": 1, "player_name": "Walter Admin"},
        {"player_id": "00000000-0000-0000-0000-200000000001", "team_id": 1, "player_name": "Tester"},
        {"player_id": "00000000-0000-0000-0000-300000000001", "team_id": 2, "player_name": "Admin", "is_own_goal": false}
    ]'::jsonb
ON CONFLICT DO NOTHING;
