import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, describe, vi, beforeEach } from 'vitest'
import Users from '../pages/Users'
import { supabase } from '../lib/supabase'
import { createMockProfile, resetIdCounter } from './factories'

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        refreshProfile: vi.fn()
    })
}))

describe('Users', () => {
    beforeEach(() => {
        resetIdCounter()
        vi.clearAllMocks()
    })

    test('shows access restricted for non-super-admins', () => {
        render(<Users profile={createMockProfile({ is_super_admin: false })} />)

        expect(screen.getByText(/Acceso Restringido/i)).toBeDefined()
        expect(screen.getByText(/Solo el Dueño \(Owner\) puede gestionar usuarios/i)).toBeDefined()
    })

    test('renders user list for super admins', async () => {
        const users = [
            createMockProfile({ full_name: 'Walter Crack', is_super_admin: true }),
            createMockProfile({ full_name: 'Pedro Goleador', is_admin: true }),
            createMockProfile({ full_name: 'Luis Defensa' })
        ]

        supabase.from().select().order.mockResolvedValue({
            data: users,
            error: null
        })

        render(<Users profile={createMockProfile({ is_super_admin: true })} />)

        await waitFor(() => {
            expect(screen.getByText('Walter Crack')).toBeDefined()
            expect(screen.getByText('Pedro Goleador')).toBeDefined()
            expect(screen.getByText('Luis Defensa')).toBeDefined()
        })
    })

    test('shows correct role labels for each user', async () => {
        const users = [
            createMockProfile({ full_name: 'Owner User', is_super_admin: true }),
            createMockProfile({ full_name: 'Admin User', is_admin: true, is_super_admin: false }),
            createMockProfile({ full_name: 'Regular User', is_admin: false, is_super_admin: false })
        ]

        supabase.from().select().order.mockResolvedValue({
            data: users,
            error: null
        })

        render(<Users profile={createMockProfile({ is_super_admin: true })} />)

        await waitFor(() => {
            expect(screen.getByText('Owner')).toBeDefined()
            expect(screen.getByText('Administrador')).toBeDefined()
            expect(screen.getByText('Jugador')).toBeDefined()
        })
    })

    test('filters users by search term', async () => {
        const users = [
            createMockProfile({ full_name: 'Carlos Tevez' }),
            createMockProfile({ full_name: 'Juan Roman' }),
            createMockProfile({ full_name: 'Martin Palermo' })
        ]

        supabase.from().select().order.mockResolvedValue({
            data: users,
            error: null
        })

        render(<Users profile={createMockProfile({ is_super_admin: true })} />)

        await waitFor(() => {
            expect(screen.getByText('Carlos Tevez')).toBeDefined()
        })

        // Type in search
        const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i)
        await userEvent.type(searchInput, 'Juan')

        // Only Juan should be visible
        expect(screen.getByText('Juan Roman')).toBeDefined()
        expect(screen.queryByText('Carlos Tevez')).toBeNull()
        expect(screen.queryByText('Martin Palermo')).toBeNull()
    })

    test('shows "No se encontraron cracks" when search has no results', async () => {
        const users = [createMockProfile({ full_name: 'Carlos' })]

        supabase.from().select().order.mockResolvedValue({
            data: users,
            error: null
        })

        render(<Users profile={createMockProfile({ is_super_admin: true })} />)

        await waitFor(() => {
            expect(screen.getByText('Carlos')).toBeDefined()
        })

        const searchInput = screen.getByPlaceholderText(/Buscar por nombre/i)
        await userEvent.type(searchInput, 'ZZZZZ')

        expect(screen.getByText(/No se encontraron cracks/i)).toBeDefined()
    })
})
