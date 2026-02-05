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
            return
        }
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error || !data) {
            console.warn('Profile not found, signing out...')
            supabase.auth.signOut()
            setProfile(null)
            setLoading(false)
            return
        }
        setProfile(data)
    }

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)
            if (currentUser) fetchProfile(currentUser.id)
            setLoading(false)
        })

        // Listen for changes on auth state (sign in, sign out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const currentUser = session?.user ?? null

            setUser(prev => {
                // If it's the same user (e.g. refocus/token refresh), return prev to avoid re-renders
                if (currentUser?.id === prev?.id) {
                    return prev
                }

                // If it's a new user, fetch their profile
                if (currentUser?.id) {
                    fetchProfile(currentUser.id)
                }
                return currentUser
            })

            if (!currentUser) {
                setProfile(null)
                setLoading(false)
            } else {
                // If we already have a profile and the user hasn't changed, we don't need to block loading
                // But on init, we want to wait for the first fetchProfile if possible.
                // fetchProfile is async, so we depend on its setProfile to trigger the next step.
                // Actually, fetchProfile(currentUser.id) is called above.
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const value = {
        signUp: (data) => supabase.auth.signUp(data),
        signIn: (data) => supabase.auth.signInWithPassword(data),
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
