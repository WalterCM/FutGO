-- STRICT RLS COMPLIANCE MIGRATION
-- This ensures only the creator or a superadmin can manage matches and their data.

-- 1. DROP OLD POLICIES
DROP POLICY IF EXISTS "Only admins can manage matches" ON public.matches;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Only admins can manage games" ON public.games;

-- 2. NEW STRICT POLICIES FOR MATCHES
CREATE POLICY "Creators and superadmins can manage matches" ON public.matches
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_super_admin = true
    ) OR
    creator_id = auth.uid()
);

-- 3. NEW STRICT POLICIES FOR ENROLLMENTS (Team assignments, attendance, payments)
CREATE POLICY "Creators and superadmins can manage enrollments" ON public.enrollments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_super_admin = true
    ) OR
    EXISTS (
        SELECT 1 FROM public.matches
        WHERE public.matches.id = public.enrollments.match_id
        AND creator_id = auth.uid()
    )
);

-- 4. NEW STRICT POLICIES FOR GAMES (Results)
CREATE POLICY "Creators and superadmins can manage games" ON public.games
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_super_admin = true
    ) OR
    EXISTS (
        SELECT 1 FROM public.matches
        WHERE public.matches.id = public.games.match_day_id
        AND creator_id = auth.uid()
    )
);
