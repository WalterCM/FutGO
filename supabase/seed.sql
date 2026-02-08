-- Semilla de datos (Fixtures) para FutGO v3.0 (Extended Test Cases)
-- Includes: Multiple field types, team sizes, payment/attendance scenarios

-- ====================
-- 1. CAMPOS (Fields)
-- ====================
-- Different field sizes with 10 soles per player pricing
INSERT INTO public.fields (id, name, players_per_team, price_per_hour, address, google_maps_url, phone)
VALUES 
    -- 5v5 fields (10 players * 10 soles = 100 soles)
    ('00000000-0000-0000-0000-f00000000001', 'Campo 5v5 - La Cantera', 5, 100.00, 'Av. Brasil 123, Magdalena', 'https://www.google.com/maps/search/?api=1&query=La+Cantera+Magdalena', '987654321'),
    ('00000000-0000-0000-0000-f00000000005', 'Grass Sintético Pro 5v5', 5, 100.00, 'Jirón Tacna 456, Cercado', 'https://www.google.com/maps/search/?api=1&query=Grass+Sintetico+Pro', '911222333'),
    
    -- 6v6 fields (12 players * 10 soles = 120 soles)
    ('00000000-0000-0000-0000-f00000000003', 'Complejo Deportivo 6v6', 6, 120.00, 'Av. Miraflores 789, San Isidro', 'https://www.google.com/maps/search/?api=1&query=Complejo+Deportivo+6v6', '945678123'),
    ('00000000-0000-0000-0000-f00000000006', 'Estadio Municipal 6v6', 6, 120.00, 'Av. Arequipa 1234, Lince', 'https://www.google.com/maps/search/?api=1&query=Estadio+Municipal', '922333444'),
    
    -- 7v7 fields (14 players * 10 soles = 140 soles)
    ('00000000-0000-0000-0000-f00000000002', 'La Bombonera 7v7', 7, 140.00, 'Calle Las Flores 456, Surco', 'https://www.google.com/maps/search/?api=1&query=La+Bombonera+7v7', '912345678'),
    ('00000000-0000-0000-0000-f00000000007', 'Arena Fútbol 7', 7, 140.00, 'Av. La Marina 567, San Miguel', 'https://www.google.com/maps/search/?api=1&query=Arena+Futbol+7', '933444555'),
    
    -- 8v8 field (16 players * 10 soles = 160 soles)
    ('00000000-0000-0000-0000-f00000000004', 'Estadio FutGO XL 8v8', 8, 160.00, 'Jr. Lima 890, Cercado de Lima', 'https://www.google.com/maps/search/?api=1&query=Estadio+FutGO+XL', '999888777')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, players_per_team = EXCLUDED.players_per_team, price_per_hour = EXCLUDED.price_per_hour;

-- ====================
-- 2. AUTH USERS
-- ====================
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

-- Auth identities
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, provider_id)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-100000000001', format('{"sub": "%s", "email": "%s", "email_verified": true}', '00000000-0000-0000-0000-100000000001', 'walter@futgo.com')::jsonb, 'email', now(), now(), now(), '00000000-0000-0000-0000-100000000001'),
  (gen_random_uuid(), '00000000-0000-0000-0000-200000000001', format('{"sub": "%s", "email": "%s", "email_verified": true}', '00000000-0000-0000-0000-200000000001', 'tester@futgo.com')::jsonb, 'email', now(), now(), now(), '00000000-0000-0000-0000-200000000001'),
  (gen_random_uuid(), '00000000-0000-0000-0000-300000000001', format('{"sub": "%s", "email": "%s", "email_verified": true}', '00000000-0000-0000-0000-300000000001', 'admin@futgo.com')::jsonb, 'email', now(), now(), now(), '00000000-0000-0000-0000-300000000001')
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ====================
-- 3. PROFILES
-- ====================
-- Admin users
INSERT INTO public.profiles (id, full_name, elo_rating, is_admin, is_super_admin)
VALUES 
    ('00000000-0000-0000-0000-100000000001', 'Walter Admin', 1500, true, true),
    ('00000000-0000-0000-0000-200000000001', 'Tester', 1200, false, false),
    ('00000000-0000-0000-0000-300000000001', 'Admin', 1350, true, false)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, is_admin = EXCLUDED.is_admin, is_super_admin = EXCLUDED.is_super_admin;

-- Pool of 50 Star Players (enough for all test cases)
DO $$
DECLARE
    names text[] := ARRAY[
        -- Peruvian Stars
        'Paolo Guerrero', 'Gianluca Lapadula', 'André Carrillo', 'Luis Advíncula', 'Renato Tapia',
        'Piero Quispe', 'Joao Grimaldo', 'Bryan Reyna', 'Yoshimar Yotún', 'Edison Flores',
        'Andy Polo', 'Alex Valera', 'Hernán Barcos', 'Jefferson Farfán', 'Claudio Pizarro',
        'Pedro Gallese', 'Alexander Callens', 'Carlos Zambrano', 'Miguel Trauco', 'Wilder Cartagena',
        -- World Stars
        'Lionel Messi', 'Cristiano Ronaldo', 'Kylian Mbappé', 'Erling Haaland', 'Jude Bellingham', 
        'Vinícius Júnior', 'Kevin De Bruyne', 'Mohamed Salah', 'Robert Lewandowski', 'Neymar Jr', 
        'Harry Kane', 'Luka Modric', 'Antoine Griezmann', 'Bukayo Saka', 'Pedri', 
        'Gavi', 'Rodri', 'Lautaro Martínez', 'Paulo Dybala', 'Julián Álvarez',
        -- More players
        'Sergio Ramos', 'Virgil van Dijk', 'Trent Alexander-Arnold', 'João Cancelo', 'Alphonso Davies',
        'Joshua Kimmich', 'Toni Kroos', 'Casemiro', 'Bruno Fernandes', 'Phil Foden',
        'Marcus Rashford', 'Jamal Musiala', 'Florian Wirtz', 'Cole Palmer', 'Alejandro Garnacho'
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

-- ====================
-- 4. MATCHES (Match Days)
-- ====================

-- Case 1: 5v5, 4 teams (20 players), complete - everyone paid & arrived
-- 20 players x 10 soles = 200 soles target
INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players, match_mode)
VALUES (
    '00000000-0000-0000-0000-e00000000001', 
    '00000000-0000-0000-0000-f00000000001',  -- 5v5 field
    CURRENT_DATE + 1, '20:00:00', 'open', 200.0, 
    '00000000-0000-0000-0000-100000000001', 
    20,  -- 4 teams x 5 players = 20
    'liguilla'
) ON CONFLICT (id) DO NOTHING;

-- Case 2: 5v5, 4 teams (20 players), with no-shows - 3 didn't arrive
-- 20 players x 10 soles = 200 soles target
INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players, match_mode)
VALUES (
    '00000000-0000-0000-0000-e00000000002', 
    '00000000-0000-0000-0000-f00000000005',  -- Another 5v5 field
    CURRENT_DATE + 2, '18:00:00', 'open', 200.0, 
    '00000000-0000-0000-0000-100000000001', 
    20,  -- 4 teams but 3 no-shows
    'tournament'
) ON CONFLICT (id) DO NOTHING;

-- Case 3: 5v5, 3 teams (15 players)
-- 15 players x 10 soles = 150 soles target
INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players, match_mode)
VALUES (
    '00000000-0000-0000-0000-e00000000003', 
    '00000000-0000-0000-0000-f00000000001',
    CURRENT_DATE + 3, '19:00:00', 'open', 150.0, 
    '00000000-0000-0000-0000-300000000001', 
    15,  -- 3 teams x 5 players = 15
    'winner_stays'
) ON CONFLICT (id) DO NOTHING;

-- Case 4: 5v5, 5 teams (25 players) - larger tournament
-- 25 players x 10 soles = 250 soles target
INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players, match_mode)
VALUES (
    '00000000-0000-0000-0000-e00000000004', 
    '00000000-0000-0000-0000-f00000000005',
    CURRENT_DATE + 4, '17:00:00', 'open', 250.0, 
    '00000000-0000-0000-0000-100000000001', 
    25,  -- 5 teams x 5 players = 25
    'liguilla'
) ON CONFLICT (id) DO NOTHING;

-- Case 5: 6v6, 2 teams (12 players) - simple match
INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players, match_mode)
VALUES (
    '00000000-0000-0000-0000-e00000000005', 
    '00000000-0000-0000-0000-f00000000003',  -- 6v6 field, 120 soles
    CURRENT_DATE + 5, '20:00:00', 'open', 120.0, 
    '00000000-0000-0000-0000-100000000001', 
    12,  -- 2 teams x 6 players = 12
    'free'
) ON CONFLICT (id) DO NOTHING;

-- Case 6: 6v6, 3 teams (18 players) - tournament
-- 18 players x 10 soles = 180 soles target
INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players, match_mode)
VALUES (
    '00000000-0000-0000-0000-e00000000006', 
    '00000000-0000-0000-0000-f00000000006',
    CURRENT_DATE + 6, '19:00:00', 'open', 180.0, 
    '00000000-0000-0000-0000-300000000001', 
    18,  -- 3 teams x 6 players = 18
    'liguilla'
) ON CONFLICT (id) DO NOTHING;

-- Case 7: 7v7, 2 teams (14 players)
INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players, match_mode)
VALUES (
    '00000000-0000-0000-0000-e00000000007', 
    '00000000-0000-0000-0000-f00000000002',  -- 7v7 field, 140 soles
    CURRENT_DATE + 7, '21:00:00', 'open', 140.0, 
    '00000000-0000-0000-0000-100000000001', 
    14,  -- 2 teams x 7 players = 14
    'winner_stays'
) ON CONFLICT (id) DO NOTHING;

-- Case 8: 7v7, 4 teams (28 players) - big tournament
-- 28 players x 10 soles = 280 soles target
INSERT INTO public.matches (id, field_id, date, time, status, fixed_cost, creator_id, max_players, match_mode)
VALUES (
    '00000000-0000-0000-0000-e00000000008', 
    '00000000-0000-0000-0000-f00000000007',
    CURRENT_DATE + 8, '18:00:00', 'open', 280.0, 
    '00000000-0000-0000-0000-100000000001', 
    28,  -- 4 teams x 7 players = 28
    'tournament'
) ON CONFLICT (id) DO NOTHING;

-- ====================
-- 5. ENROLLMENTS
-- ====================

-- Case 1: 5v5, 4 teams, ALL 20 players paid and arrived
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT '00000000-0000-0000-0000-e00000000001', id, true, true, 
    CASE 
        WHEN row_number() over () <= 5 THEN 1
        WHEN row_number() over () <= 10 THEN 2
        WHEN row_number() over () <= 15 THEN 3
        ELSE 4
    END, 
    now()
FROM (SELECT id FROM public.profiles WHERE full_name NOT IN ('Walter Admin', 'Tester', 'Admin') LIMIT 20) p
ON CONFLICT (match_id, player_id) DO NOTHING;

-- Case 2: 5v5, 4 teams, 20 signups but 3 didn't arrive (17 arrived)
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT '00000000-0000-0000-0000-e00000000002', id, true, 
    CASE WHEN row_number() over () <= 17 THEN true ELSE false END,  -- Last 3 didn't arrive
    CASE 
        WHEN row_number() over () <= 5 THEN 1
        WHEN row_number() over () <= 10 THEN 2
        WHEN row_number() over () <= 15 THEN 3
        ELSE 4
    END, 
    now()
FROM (SELECT id FROM public.profiles WHERE full_name NOT IN ('Walter Admin', 'Tester', 'Admin') LIMIT 20) p
ON CONFLICT (match_id, player_id) DO NOTHING;

-- Case 3: 5v5, 3 teams (15 players) - all paid and arrived
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT '00000000-0000-0000-0000-e00000000003', id, true, true, 
    CASE 
        WHEN row_number() over () <= 5 THEN 1
        WHEN row_number() over () <= 10 THEN 2
        ELSE 3
    END, 
    now()
FROM (SELECT id FROM public.profiles WHERE full_name NOT IN ('Walter Admin', 'Tester', 'Admin') OFFSET 5 LIMIT 15) p
ON CONFLICT (match_id, player_id) DO NOTHING;

-- Case 4: 5v5, 5 teams (25 players) - partial signups (20 so far)
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT '00000000-0000-0000-0000-e00000000004', id, 
    CASE WHEN row_number() over () <= 15 THEN true ELSE false END,  -- 15 paid, 5 haven't
    NULL,  -- Not yet arrived (match not started)
    CASE 
        WHEN row_number() over () <= 5 THEN 1
        WHEN row_number() over () <= 10 THEN 2
        WHEN row_number() over () <= 15 THEN 3
        WHEN row_number() over () <= 20 THEN 4
        ELSE 5
    END, 
    CASE WHEN row_number() over () <= 15 THEN now() ELSE NULL END
FROM (SELECT id FROM public.profiles WHERE full_name NOT IN ('Walter Admin', 'Tester', 'Admin') OFFSET 10 LIMIT 20) p
ON CONFLICT (match_id, player_id) DO NOTHING;

-- Case 5: 6v6, 2 teams (12 players) - all confirmed
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT '00000000-0000-0000-0000-e00000000005', id, true, true, 
    CASE WHEN row_number() over () <= 6 THEN 1 ELSE 2 END, 
    now()
FROM (SELECT id FROM public.profiles WHERE full_name NOT IN ('Walter Admin', 'Tester', 'Admin') OFFSET 15 LIMIT 12) p
ON CONFLICT (match_id, player_id) DO NOTHING;

-- Case 6: 6v6, 3 teams (18 players) - all confirmed
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT '00000000-0000-0000-0000-e00000000006', id, true, true, 
    CASE 
        WHEN row_number() over () <= 6 THEN 1
        WHEN row_number() over () <= 12 THEN 2
        ELSE 3
    END, 
    now()
FROM (SELECT id FROM public.profiles WHERE full_name NOT IN ('Walter Admin', 'Tester', 'Admin') OFFSET 20 LIMIT 18) p
ON CONFLICT (match_id, player_id) DO NOTHING;

-- Case 7: 7v7, 2 teams (14 players) - all confirmed
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT '00000000-0000-0000-0000-e00000000007', id, true, true, 
    CASE WHEN row_number() over () <= 7 THEN 1 ELSE 2 END, 
    now()
FROM (SELECT id FROM public.profiles WHERE full_name NOT IN ('Walter Admin', 'Tester', 'Admin') OFFSET 25 LIMIT 14) p
ON CONFLICT (match_id, player_id) DO NOTHING;

-- Case 8: 7v7, 4 teams (28 players) - 25 signed up so far, 5 haven't paid
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT '00000000-0000-0000-0000-e00000000008', id, 
    CASE WHEN row_number() over () <= 20 THEN true ELSE false END,  -- 20 paid, 5 haven't
    NULL,  -- Not yet arrived
    CASE 
        WHEN row_number() over () <= 7 THEN 1
        WHEN row_number() over () <= 14 THEN 2
        WHEN row_number() over () <= 21 THEN 3
        ELSE 4
    END, 
    CASE WHEN row_number() over () <= 20 THEN now() ELSE NULL END
FROM (SELECT id FROM public.profiles WHERE full_name NOT IN ('Walter Admin', 'Tester', 'Admin') OFFSET 30 LIMIT 25) p
ON CONFLICT (match_id, player_id) DO NOTHING;

-- Add admins to some matches
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
VALUES 
    ('00000000-0000-0000-0000-e00000000001', '00000000-0000-0000-0000-100000000001', true, true, 1, now()),
    ('00000000-0000-0000-0000-e00000000002', '00000000-0000-0000-0000-100000000001', true, true, 1, now()),
    ('00000000-0000-0000-0000-e00000000003', '00000000-0000-0000-0000-300000000001', true, true, 1, now()),
    ('00000000-0000-0000-0000-e00000000005', '00000000-0000-0000-0000-200000000001', true, true, 2, now())
ON CONFLICT (match_id, player_id) DO NOTHING;

-- ====================
-- 6. SAMPLE GAMES (for Case 1 - complete liguilla)
-- ====================
INSERT INTO public.games (match_day_id, team1_id, team2_id, score1, score2, team1_players, team2_players, goals)
SELECT 
    '00000000-0000-0000-0000-e00000000001', 1, 2, 3, 1, 
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = '00000000-0000-0000-0000-e00000000001' AND team_assignment = 1 LIMIT 5),
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = '00000000-0000-0000-0000-e00000000001' AND team_assignment = 2 LIMIT 5),
    '[]'::jsonb
ON CONFLICT DO NOTHING;

INSERT INTO public.games (match_day_id, team1_id, team2_id, score1, score2, team1_players, team2_players, goals)
SELECT 
    '00000000-0000-0000-0000-e00000000001', 3, 4, 2, 2, 
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = '00000000-0000-0000-0000-e00000000001' AND team_assignment = 3 LIMIT 5),
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = '00000000-0000-0000-0000-e00000000001' AND team_assignment = 4 LIMIT 5),
    '[]'::jsonb
ON CONFLICT DO NOTHING;
