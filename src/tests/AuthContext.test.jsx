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

        // Mock getSession to return a valid session
        supabase.auth.getSession.mockResolvedValue({
            data: { session: { user: mockUser } }
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
        supabase.auth.getSession.mockResolvedValue({
            data: { session: null }
        })

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
            expect(result.current.user).toBeNull()
            expect(result.current.profile).toBeNull()
        })
    })

    test('provides signIn function that calls supabase', async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
        supabase.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null })

        const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
        const { result } = renderHook(() => useAuth(), { wrapper })

        await waitFor(() => {
            expect(result.current.signIn).toBeDefined()
        })

        await act(async () => {
            await result.current.signIn({ email: 'test@test.com', password: '123456' })
        })

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: 'test@test.com',
            password: '123456'
        })
    })

    test('provides signOut function that calls supabase', async () => {
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } })
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

        supabase.auth.getSession.mockResolvedValue({
            data: { session: { user: mockUser } }
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
