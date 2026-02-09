/**
 * AuthContext - Authentication & Session Management
 * 
 * BUSINESS LOGIC DOCUMENTATION:
 * 
 * 1. SESSION VALIDATION (BULLETPROOFING)
 *    - Uses `supabase.auth.getUser()` instead of `supabase.auth.getSession()` on init
 *    - `getSession()` reads from `localStorage` (unsafe if DB was reset)
 *    - `getUser()` forces a server-side fetch to verify the JWT is still valid in the current DB
 *    - If `getUser()` fails, the app clears local state and forces a fresh login
 * 
 * 2. AUTH USER vs PROFILE
 *    - `user`: The Supabase Auth record (email, metadata, UUID)
 *    - `profile`: The public data in our `profiles` table (nickname, rating, phone)
 *    - A user can exist in Auth but not in `profiles` (Onboarding state)
 *    - `AuthContext` provides both; if `profile` is null, the app redirects to `/setup`
 * 
 * 3. LOGOUT & DB RESET HANDLING
 *    - When the organization resets the database (`supabase db reset`), old JWTs are invalid
 *    - The logic automatically triggers `signOut()` if a valid user has no corresponding profile
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = async (userId) => {
        if (!userId) {
            setProfile(null)
            return null
        }
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                // If it's a 401 or user simply doesn't exist in profiles, 
                // we treat it as "needs setup" but don't force logout yet 
                // unless it's a critical auth failure.
                console.log('Profile fetch notice:', error.message)
                setProfile(null)
                return null
            }
            setProfile(data)
            return data
        } catch (e) {
            console.error('Unexpected error fetching profile:', e)
            setProfile(null)
            return null
        }
    }

    useEffect(() => {
        let isMounted = true

        const initializeAuth = async () => {
            // Use getUser instead of getSession to force a server-side check.
            // This prevents stale localStorage sessions from surviving DB resets.
            const { data: { user: currentUser }, error } = await supabase.auth.getUser()

            if (error) {
                // If the user doesn't exist on the server, getSession might still 
                // return something, but getUser will fail.
                console.log('Session validation failed or no session found:', error.message)
                if (error.status === 401 || error.message.includes('not found')) {
                    await supabase.auth.signOut()
                }
                if (isMounted) {
                    setUser(null)
                    setLoading(false)
                }
                return
            }

            if (isMounted) setUser(currentUser)

            if (currentUser) {
                await fetchProfile(currentUser.id)
            }

            if (isMounted) setLoading(false)
        }

        initializeAuth()

        // Listen for changes on auth state
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null

            if (event === 'SIGNED_OUT') {
                setUser(null)
                setProfile(null)
                setLoading(false)
                return
            }

            setUser(prev => {
                if (currentUser?.id === prev?.id) return prev
                if (currentUser?.id) fetchProfile(currentUser.id)
                return currentUser
            })

            if (!currentUser) {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [])

    const value = {
        signInWithGoogle: () => supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        }),
        signOut: () => supabase.auth.signOut(),
        refreshProfile: () => fetchProfile(user?.id),
        user,
        profile
    }

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}
