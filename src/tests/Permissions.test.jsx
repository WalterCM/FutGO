import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { expect, test, describe, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MatchDetail from '../pages/MatchDetail'
import { createMockMatch, createMockProfile, resetIdCounter } from './factories'
import { mockQuery } from './setup'
import { useAuth } from '../context/AuthContext'

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn()
}))

const renderWithRouter = (ui, { matchId = '00000000-0000-0000-0000-000000000001' } = {}) => {
    return render(
        <MemoryRouter initialEntries={[`/partido/${matchId}`]}>
            <Routes>
                <Route path="/partido/:slugOrId" element={ui} />
            </Routes>
        </MemoryRouter>
    )
}

describe('Permissions & Access Control', () => {
    const matchId = '00000000-0000-0000-0000-000000000001'

    beforeEach(() => {
        resetIdCounter()
        vi.clearAllMocks()

        // Default Supabase mocks to allow MatchDetail to load
        mockQuery.single.mockResolvedValue({ data: createMockMatch({ id: matchId }), error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })
    })

    test('Regular Player can see Asistencias tab but not management buttons', async () => {
        const regularUser = createMockProfile({ id: 'player-1', is_admin: false, is_super_admin: false })
        vi.mocked(useAuth).mockReturnValue({
            profile: regularUser,
            refreshProfile: vi.fn(),
            user: { id: 'player-1' }
        })

        renderWithRouter(<MatchDetail profile={regularUser} onBack={() => { }} />, { matchId })

        // Wait for load - search for field name 'El Monumental' instead of 'Detalles'
        await waitFor(() => {
            expect(screen.getByText(/El Monumental/i)).toBeDefined()
        })

        // Header edit button should be HIDDEN
        expect(screen.queryByTitle(/Editar detalles/i)).toBeNull()

        // Should see the tab button (it's always there)
        expect(screen.getByText(/Asistencias/i)).toBeDefined()

        // Switch to Asistencias tab
        fireEvent.click(screen.getByText(/Asistencias/i))

        // Management buttons should be HIDDEN
        expect(screen.queryByText(/Habilitar .* Equipo/i)).toBeNull()
        expect(screen.queryByText(/Cancelar Partido/i)).toBeNull()
    })

    test('Match Creator can see management buttons', async () => {
        const creatorId = 'creator-123'
        const match = createMockMatch({ id: matchId, creator_id: creatorId })
        const creatorUser = createMockProfile({ id: creatorId, is_admin: false })

        mockQuery.single.mockResolvedValue({ data: match, error: null })

        vi.mocked(useAuth).mockReturnValue({
            profile: creatorUser,
            refreshProfile: vi.fn(),
            user: { id: creatorId }
        })

        renderWithRouter(<MatchDetail profile={creatorUser} onBack={() => { }} />, { matchId })

        await waitFor(() => {
            expect(screen.getByText(/El Monumental/i)).toBeDefined()
        })

        // Header edit button should be VISIBLE
        expect(screen.getByTitle(/Editar detalles/i)).toBeDefined()

        // Switch to Asistencias tab
        fireEvent.click(screen.getByText(/Asistencias/i))

        // Management buttons should be VISIBLE
        expect(screen.getByText(/Habilitar .* Equipo/i)).toBeDefined()
        expect(screen.getByText(/Cancelar Partido/i)).toBeDefined()
    })

    test('SuperAdmin can see Unlock button on a locked match', async () => {
        const adminUser = createMockProfile({ id: 'admin-1', is_super_admin: true })
        const lockedMatch = createMockMatch({ id: matchId, is_locked: true, status: 'closed' })

        mockQuery.single.mockResolvedValue({ data: lockedMatch, error: null })

        vi.mocked(useAuth).mockReturnValue({
            profile: adminUser,
            refreshProfile: vi.fn(),
            user: { id: 'admin-1' }
        })

        renderWithRouter(<MatchDetail profile={adminUser} onBack={() => { }} />, { matchId })

        await waitFor(() => {
            expect(screen.getByText(/Asistencias/i)).toBeDefined()
        })

        fireEvent.click(screen.getByText(/Asistencias/i))

        // Should see Unlock button (only for SuperAdmin on locked matches)
        // Wait, the button for unlocking is typically "Desbloquear Partido"
        // Let's verify in MatchDetail/index.jsx if I can
        expect(screen.getByText(/Desbloquear Partido/i)).toBeDefined()
    })
})
