-- Semilla de datos (Fixtures) para FutGO v3.0 (Fixed Lifecycle)
-- Matches are designed to show a clear progression from Stage 1 to Stage 10

-- ====================
-- 1. CAMPOS (Fields)
-- ====================
INSERT INTO public.fields (id, name, players_per_team, price_per_hour, address)
VALUES 
    ('00000000-0000-0000-0000-f00000000001', 'Cancha 5v5 - La Cantera', 5, 100.00, 'Av. Brasil 123'),
    ('00000000-0000-0000-0000-f00000000002', 'Cancha 6v6 - Pro', 6, 120.00, 'Jirón Tacna 456'),
    ('00000000-0000-0000-0000-f00000000003', 'Estadio 7v7 - FutGO', 7, 140.00, 'Av. Arequipa 789')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- ====================
-- 2. AUTH & PROFILES
-- ====================
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
VALUES
  ('00000000-0000-0000-0000-100000000001', 'walter@futgo.com', extensions.crypt('tester123', extensions.gen_salt('bf')), now(), '{"provider":"email"}', '{"full_name":"Walter Admin"}', 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, elo_rating, is_admin, is_super_admin, phone)
VALUES ('00000000-0000-0000-0000-100000000001', 'Walter Admin', 1500, true, true, '987654321')
ON CONFLICT (id) DO UPDATE SET is_super_admin = true, phone = '987654321';

-- Pool of 100 Players to avoid offset issues
DO $$
DECLARE names text[] := ARRAY['Lionel Messi','Cristiano Ronaldo','Kylian Mbappe','Erling Haaland','Jude Bellingham','Vinicius Jr','Kevin De Bruyne','Mohamed Salah','Robert Lewandowski','Neymar Jr','Harry Kane','Luka Modric','Gianluca Lapadula','Paolo Guerrero','Luis Advíncula','Renato Tapia','Pedro Gallese','Yoshimar Yotún','Edison Flores','André Carrillo','Carlos Zambrano','Miguel Trauco','Piero Quispe','Andy Polo','Alex Valera','Hernán Barcos','Jefferson Farfán','Claudio Pizarro','Alexander Callens','Joao Grimaldo','Bryan Reyna'];
DECLARE nicknames text[] := ARRAY['La Pulga','El Bicho','Donatello','Androide','Belligoat','Vini','KDB','The King',NULL,'Ney',NULL,NULL,'Lapa','Depredador','Rayo','Capitán',NULL,NULL,'Orejas','Culebra','Kaiser',NULL,NULL,NULL,NULL,'Pirata','Foquita','Bombardero',NULL,NULL,NULL];
BEGIN
    FOR i IN 1..cardinality(names) LOOP
        INSERT INTO public.profiles (id, full_name, nickname, elo_rating)
        VALUES (gen_random_uuid(), names[i], nicknames[i], 1000 + (random()*800)::int) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- ====================
-- 3. MATCHES (Stages 1-10)
-- Dates are set so they appear in order (Stages in future -> Stages in past)
-- ====================

-- #1: [EMPTY] 5v5 - Future
INSERT INTO public.matches (id, field_id, date, time, status, creator_id, max_players)
VALUES ('e0000001-0000-0000-0000-000000000001', '00000000-0000-0000-0000-f00000000001', CURRENT_DATE, '20:00:00', 'open', '00000000-0000-0000-0000-100000000001', 10);

-- #2: [PARTIAL] 5v5 (6/10) - Future
INSERT INTO public.matches (id, field_id, date, time, status, creator_id, max_players)
VALUES ('e0000002-0000-0000-0000-000000000002', '00000000-0000-0000-0000-f00000000001', CURRENT_DATE + 1, '21:00:00', 'open', '00000000-0000-0000-0000-100000000001', 10);

-- #3: [FULL - NO TEAMS] 5v5 (10/10) - Future
INSERT INTO public.matches (id, field_id, date, time, status, creator_id, max_players)
VALUES ('e0000003-0000-0000-0000-000000000003', '00000000-0000-0000-0000-f00000000001', CURRENT_DATE + 2, '19:00:00', 'open', '00000000-0000-0000-0000-100000000001', 10);

-- #4: [TEAM CONFIGS - 3 TEAMS formed] 6v6 - Future
INSERT INTO public.matches (id, field_id, date, time, status, creator_id, max_players)
VALUES ('e0000004-0000-0000-0000-000000000004', '00000000-0000-0000-0000-f00000000002', CURRENT_DATE + 3, '18:00:00', 'open', '00000000-0000-0000-0000-100000000001', 18);

-- #5: [PHASE CREATED - No Fixtures] 6v6 - Future
INSERT INTO public.matches (id, field_id, date, time, status, creator_id, max_players, phases)
VALUES ('e0000005-0000-0000-0000-000000000005', '00000000-0000-0000-0000-f00000000002', CURRENT_DATE + 4, '17:00:00', 'open', '00000000-0000-0000-0000-100000000001', 12,
'[{"id":"p5","name":"Liguilla Prueba","type":"liguilla"}]'::jsonb);

-- #6: [FIXTURES READY - All Pending] 5v5 - Near Future
INSERT INTO public.matches (id, field_id, date, time, status, creator_id, max_players, phases, fixtures)
VALUES ('e0000006-0000-0000-0000-000000000006', '00000000-0000-0000-0000-f00000000001', CURRENT_DATE + 5, '22:00:00', 'open', '00000000-0000-0000-0000-100000000001', 10,
'[{"id":"p6","name":"Torneo Martes","type":"liguilla"}]'::jsonb,
'[{"id":"f61","phaseId":"p6","team1Id":1,"team2Id":2,"status":"pending"}]'::jsonb);

-- #7: [LIVE - First Game Played] 5v5 - Near Future
INSERT INTO public.matches (id, field_id, date, time, status, creator_id, max_players, phases, fixtures)
VALUES ('e0000007-0000-0000-0000-000000000007', '00000000-0000-0000-0000-f00000000001', CURRENT_DATE + 6, '20:00:00', 'open', '00000000-0000-0000-0000-100000000001', 10,
'[{"id":"p7","name":"Reto ELO","type":"liguilla"}]'::jsonb,
'[{"id":"00000000-0000-0000-0000-000000000007","phaseId":"p7","team1Id":1,"team2Id":2,"status":"completed","score1":1,"score2":0}]'::jsonb);

-- #8: [LIVE - First Game Played] 7v7 - Very Near Future
INSERT INTO public.matches (id, field_id, date, time, status, creator_id, max_players, phases, fixtures)
VALUES ('e0000008-0000-0000-0000-000000000008', '00000000-0000-0000-0000-f00000000003', CURRENT_DATE + 7, '21:00:00', 'open', '00000000-0000-0000-0000-100000000001', 14,
'[{"id":"p8","name":"Liga de Barrio","type":"liguilla"}]'::jsonb,
'[{"id":"00000000-0000-0000-0000-000000000081","phaseId":"p8","team1Id":1,"team2Id":2,"status":"completed","score1":4,"score2":2},
  {"id":"00000000-0000-0000-0000-000000000082","phaseId":"p8","team1Id":1,"team2Id":2,"status":"pending"}]'::jsonb);

-- #9: [COMPLETED - NOT LOCKED] 5v5 - Future Far
INSERT INTO public.matches (id, field_id, date, time, status, creator_id, max_players, phases, fixtures)
VALUES ('e0000009-0000-0000-0000-000000000009', '00000000-0000-0000-0000-f00000000001', CURRENT_DATE + 8, '18:00:00', 'open', '00000000-0000-0000-0000-100000000001', 10,
'[{"id":"p9","name":"Final del Siglo","type":"liguilla"}]'::jsonb,
'[{"id":"00000000-0000-0000-0000-000000000009","phaseId":"p9","team1Id":1,"team2Id":2,"status":"completed","score1":2,"score2":2}]'::jsonb);

-- #10: [ARCHIVED - LOCKED] 5v5 - Furthest Future (to appear last in ASC)
INSERT INTO public.matches (id, field_id, date, time, status, creator_id, max_players, phases, fixtures)
VALUES ('e0000010-0000-0000-0000-000000000010', '00000000-0000-0000-0000-f00000000001', CURRENT_DATE + 15, '20:00:00', 'open', '00000000-0000-0000-0000-100000000001', 10,
'[{"id":"p10","name":"Leyendas Urbanas","type":"liguilla"}]'::jsonb,
'[{"id":"00000000-0000-0000-0000-000000000010","phaseId":"p10","team1Id":1,"team2Id":2,"status":"completed","score1":5,"score2":3}]'::jsonb);

-- ====================
-- 4. ENROLLMENTS & TEAMS (Fixed Offsets)
-- ====================

-- #2 (Partial: Only 6 players)
INSERT INTO public.enrollments (match_id, player_id, paid, paid_at)
SELECT 'e0000002-0000-0000-0000-000000000002', id, row_number() over() <= 3, now()
FROM (SELECT id FROM public.profiles WHERE id != '00000000-0000-0000-0000-100000000001' LIMIT 6) p;

-- #3 (Full - No Teams: 10 players)
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, paid_at)
SELECT 'e0000003-0000-0000-0000-000000000003', id, true, true, now()
FROM (SELECT id FROM public.profiles WHERE id != '00000000-0000-0000-0000-100000000001' OFFSET 6 LIMIT 10) p;

-- #4 (3 Teams Formed: 18 players)
INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
SELECT 'e0000004-0000-0000-0000-000000000004', id, true, true, 
    CASE WHEN row_number() over() <= 6 THEN 1 WHEN row_number() over() <= 12 THEN 2 ELSE 3 END, now()
FROM (SELECT id FROM public.profiles WHERE id != '00000000-0000-0000-0000-100000000001' OFFSET 16 LIMIT 18) p;

-- Loop for 5-10 (Ensure full player coverage)
DO $$
DECLARE 
    m_ids uuid[] := ARRAY[
        'e0000005-0000-0000-0000-000000000005'::uuid,
        'e0000006-0000-0000-0000-000000000006'::uuid,
        'e0000007-0000-0000-0000-000000000007'::uuid,
        'e0000008-0000-0000-0000-000000000008'::uuid,
        'e0000009-0000-0000-0000-000000000009'::uuid,
        'e0000010-0000-0000-0000-000000000010'::uuid
    ];
    sizes int[] := ARRAY[25, 12, 10, 14, 10, 10];
BEGIN
    FOR i IN 1..6 LOOP
        INSERT INTO public.enrollments (match_id, player_id, paid, is_present, team_assignment, paid_at)
        SELECT m_ids[i], id, true, true, 
               CASE WHEN row_number() over() <= (sizes[i]/2) THEN 1 ELSE 2 END, now()
        FROM (SELECT id FROM public.profiles WHERE id != '00000000-0000-0000-0000-100000000001' OFFSET 2*i LIMIT sizes[i]) p;
    END LOOP;
END $$;

-- ====================
-- 5. GAMES
-- ====================
INSERT INTO public.games (id, match_day_id, team1_id, team2_id, score1, score2, team1_players, team2_players, is_completed)
SELECT '00000000-0000-0000-0000-000000000007', 'e0000007-0000-0000-0000-000000000007', 1, 2, 1, 0,
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = 'e0000007-0000-0000-0000-000000000007' AND team_assignment = 1),
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = 'e0000007-0000-0000-0000-000000000007' AND team_assignment = 2),
    true;

INSERT INTO public.games (id, match_day_id, team1_id, team2_id, score1, score2, team1_players, team2_players, is_completed)
SELECT '00000000-0000-0000-0000-000000000081', 'e0000008-0000-0000-0000-000000000008', 1, 2, 4, 2,
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = 'e0000008-0000-0000-0000-000000000008' AND team_assignment = 1),
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = 'e0000008-0000-0000-0000-000000000008' AND team_assignment = 2),
    true;

INSERT INTO public.games (id, match_day_id, team1_id, team2_id, score1, score2, team1_players, team2_players, is_completed)
SELECT '00000000-0000-0000-0000-000000000009', 'e0000009-0000-0000-0000-000000000009', 1, 2, 2, 2,
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = 'e0000009-0000-0000-0000-000000000009' AND team_assignment = 1),
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = 'e0000009-0000-0000-0000-000000000009' AND team_assignment = 2),
    true;

INSERT INTO public.games (id, match_day_id, team1_id, team2_id, score1, score2, team1_players, team2_players, is_completed)
SELECT '00000000-0000-0000-0000-000000000010', 'e0000010-0000-0000-0000-000000000010', 1, 2, 5, 3,
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = 'e0000010-0000-0000-0000-000000000010' AND team_assignment = 1),
    ARRAY(SELECT player_id FROM public.enrollments WHERE match_id = 'e0000010-0000-0000-0000-000000000010' AND team_assignment = 2),
    true;

-- ====================
-- 6. FINAL LOCKS & ELO
-- ====================
-- AWARD ELO TO #10
UPDATE public.enrollments SET elo_delta = 10 WHERE match_id = 'e0000010-0000-0000-0000-000000000010' AND team_assignment = 1;
UPDATE public.enrollments SET elo_delta = -10 WHERE match_id = 'e0000010-0000-0000-0000-000000000010' AND team_assignment = 2;
-- LOCK #10
UPDATE public.matches SET is_locked = true, status = 'completed' WHERE id = 'e0000010-0000-0000-0000-000000000010';
