import { renderHook, waitFor, act } from '@testing-library/react'
import { expect, test, describe, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { createMockProfile, resetIdCounter } from './factories'

describe('AuthContext', () => {
    beforeEach(() => {
        resetIdCounter()
        vi.clearAllMocks()
    })

    test('sets user and profile when session exists', async () => {
        const mockUser = { id: 'user-123', email: 'test@test.com' }
        const mockProfile = createMockProfile({ id: 'user-123', full_name: 'Test User' })

        // Mock getUser to return a valid user
        supabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null
        })

        // Mock profile fetch
        supabase.from().select().eq().single.mockResolvedValue({
            data: mockProfile,
            error: null
        })

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
            expect(result.current.user).toEqual(mockUser)
            expect(result.current.profile).toEqual(mockProfile)
        })
    })

    test('returns null user when no session exists', async () => {
        supabase.auth.getUser.mockResolvedValue({
            data: { user: null },
            error: null
        })

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
            expect(result.current.user).toBeNull()
            expect(result.current.profile).toBeNull()
        })
    })

    test('provides signInWithGoogle function that calls supabase OAuth', async () => {
        supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
        supabase.auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null })

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
            expect(result.current.signInWithGoogle).toBeDefined()
        })

        await act(async () => {
            await result.current.signInWithGoogle()
        })

        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        })
    })


    test('provides signOut function that calls supabase', async () => {
        supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
        supabase.auth.signOut.mockResolvedValue({ error: null })

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
            expect(result.current.signOut).toBeDefined()
        })

        await act(async () => {
            await result.current.signOut()
        })

        expect(supabase.auth.signOut).toHaveBeenCalled()
    })

    test('refreshProfile fetches updated profile data', async () => {
        const mockUser = { id: 'user-123' }
        const initialProfile = createMockProfile({ id: 'user-123', full_name: 'Initial' })
        const updatedProfile = createMockProfile({ id: 'user-123', full_name: 'Updated' })

        supabase.auth.getUser.mockResolvedValue({
            data: { user: mockUser },
            error: null
        })

        supabase.from().select().eq().single
            .mockResolvedValueOnce({ data: initialProfile, error: null })
            .mockResolvedValueOnce({ data: updatedProfile, error: null })

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
            expect(result.current.profile?.full_name).toBe('Initial')
        })

        await act(async () => {
            await result.current.refreshProfile()
        })

        await waitFor(() => {
            expect(result.current.profile?.full_name).toBe('Updated')
        })
    })
})
