import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, describe, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MatchDetail from '../pages/MatchDetail'
import { createMockMatch, createMockProfile, createMockField, createMockEnrollment, resetIdCounter } from './factories'
import { mockQuery } from './setup'

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        refreshProfile: vi.fn()
    })
}))

// Helper to render with Router and match params
const renderWithRouter = (ui, { matchId = 'match-1' } = {}) => {
    return render(
        <MemoryRouter initialEntries={[`/partido/${matchId}`]}>
            <Routes>
                <Route path="/partido/:id" element={ui} />
            </Routes>
        </MemoryRouter>
    )
}

describe('MatchDetail', () => {
    beforeEach(() => {
        resetIdCounter()
    })

    test('renders loading state initially', () => {
        mockQuery.single.mockReturnValue(new Promise(() => { }))

        renderWithRouter(
            <MatchDetail profile={createMockProfile()} onBack={() => { }} />,
            { matchId: 'match-1' }
        )

        expect(screen.getByText(/Cargando detalles.../i)).toBeDefined()
    })

    test('renders match details correctly', async () => {
        const field = createMockField({ name: 'Estadio Nacional', players_per_team: 5, price_per_hour: 100 })
        const match = createMockMatch({ id: 'match-1', field, date: '2026-02-15', time: '19:30:00' })

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })

        renderWithRouter(
            <MatchDetail profile={createMockProfile()} onBack={() => { }} />,
            { matchId: 'match-1' }
        )

        await waitFor(() => {
            expect(screen.getByText('Estadio Nacional')).toBeDefined()
        })
    })

    test('shows player count correctly', async () => {
        const field = createMockField({ players_per_team: 5 })
        const match = createMockMatch({ id: 'match-1', field })
        const enrollments = [
            createMockEnrollment({ match_id: 'match-1' }),
            createMockEnrollment({ match_id: 'match-1' }),
            createMockEnrollment({ match_id: 'match-1' })
        ]

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: enrollments, error: null })

        renderWithRouter(
            <MatchDetail profile={createMockProfile()} onBack={() => { }} />,
            { matchId: 'match-1' }
        )

        await waitFor(() => {
            expect(screen.getByText('3 / 10')).toBeDefined()
        })
    })

    test('shows "Unirme" button when user is not enrolled', async () => {
        const field = createMockField()
        const match = createMockMatch({ id: 'match-1', field })

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })

        renderWithRouter(
            <MatchDetail profile={createMockProfile({ id: 'not-enrolled' })} onBack={() => { }} />,
            { matchId: 'match-1' }
        )

        await waitFor(() => {
            expect(screen.getByText(/Unirme/i)).toBeDefined()
        })
    })

    test('shows "Salir" button when user is enrolled', async () => {
        const currentUser = createMockProfile({ id: 'current-user' })
        const field = createMockField()
        const match = createMockMatch({ id: 'match-1', field })
        const enrollments = [createMockEnrollment({ match_id: 'match-1', player_id: 'current-user', player: currentUser })]

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: enrollments, error: null })

        renderWithRouter(
            <MatchDetail profile={currentUser} onBack={() => { }} />,
            { matchId: 'match-1' }
        )

        await waitFor(() => {
            expect(screen.getByText(/Salir/i)).toBeDefined()
        })
    })

    test('calls onBack when back button is clicked', async () => {
        const field = createMockField()
        const match = createMockMatch({ id: 'match-1', field })
        const onBack = vi.fn()

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })

        renderWithRouter(
            <MatchDetail profile={createMockProfile()} onBack={onBack} />,
            { matchId: 'match-1' }
        )

        await waitFor(() => {
            expect(screen.getByText(field.name)).toBeDefined()
        })

        await userEvent.click(screen.getByText(/Volver/i))
        expect(onBack).toHaveBeenCalled()
    })
})

describe('MatchDetail Business Logic', () => {
    beforeEach(() => {
        resetIdCounter()
    })

    test('calculates quota correctly for 5v5 at S/120', async () => {
        const field = createMockField({ players_per_team: 5, price_per_hour: 120 })
        const match = createMockMatch({ id: 'match-1', field })

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })

        renderWithRouter(
            <MatchDetail profile={createMockProfile()} onBack={() => { }} />,
            { matchId: 'match-1' }
        )

        await waitFor(() => {
            expect(screen.getByText(/Cuota: S\/ 12/i)).toBeDefined()
        })
    })

    test('calculates quota correctly for 7v7 at S/150', async () => {
        const field = createMockField({ players_per_team: 7, price_per_hour: 150 })
        const match = createMockMatch({ id: 'match-7v7', field, fixed_cost: 150 })

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })

        renderWithRouter(
            <MatchDetail profile={createMockProfile()} onBack={() => { }} />,
            { matchId: 'match-7v7' }
        )

        await waitFor(() => {
            expect(screen.getByText(/Cuota: S\/ 11/i)).toBeDefined()
        })
    })

    test('requires confirmation to leave a match', async () => {
        const currentUser = createMockProfile({ id: 'current-user-leave' })
        const match = createMockMatch({ id: 'match-leave' })
        const enrollments = [createMockEnrollment({ match_id: 'match-leave', player_id: 'current-user-leave', player: currentUser })]

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: enrollments, error: null })

        renderWithRouter(
            <MatchDetail profile={currentUser} onBack={() => { }} />,
            { matchId: 'match-leave' }
        )

        await waitFor(() => {
            expect(screen.getByText(/1 \/ 10/i)).toBeDefined()
            expect(screen.getByRole('button', { name: /Salir/i })).toBeDefined()
        })

        // First click: should change to confirmation state
        const leaveBtn = screen.getByRole('button', { name: /Salir/i })
        await userEvent.click(leaveBtn)

        expect(screen.getByRole('button', { name: /¿Seguro\?/i })).toBeDefined()
        expect(mockQuery.delete).not.toHaveBeenCalled()

        // Second click: should actually call delete
        await userEvent.click(screen.getByRole('button', { name: /¿Seguro\?/i }))
        expect(mockQuery.delete).toHaveBeenCalled()
        expect(mockQuery.eq).toHaveBeenCalledWith('match_id', 'match-leave')
        expect(mockQuery.eq).toHaveBeenCalledWith('player_id', 'current-user-leave')
    })

    test('opens Edit Match modal and saves changes', async () => {
        const currentUser = createMockProfile({ id: 'admin-user-edit', is_admin: true })
        const match = createMockMatch({ id: 'match-edit', creator_id: 'admin-user-edit' })

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })
        mockQuery.update.mockResolvedValue({ data: { ...match }, error: null })

        renderWithRouter(
            <MatchDetail profile={currentUser} onBack={() => { }} />,
            { matchId: 'match-edit' }
        )

        await waitFor(() => {
            expect(screen.getByTitle(/Editar detalles/i)).toBeDefined()
        })

        // Open modal
        await userEvent.click(screen.getByTitle(/Editar detalles/i))
        expect(screen.getByText(/Editar Encuentro/i)).toBeDefined()

        // Save changes
        await userEvent.click(screen.getByText(/Guardar Cambios/i))

        await waitFor(() => {
            expect(mockQuery.update).toHaveBeenCalled()
            expect(mockQuery.eq).toHaveBeenCalledWith('id', 'match-edit')
        })
    })

    test('queries games using match_day_id column', async () => {
        const match = createMockMatch({ id: 'match-games' })
        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })

        renderWithRouter(
            <MatchDetail profile={createMockProfile()} onBack={() => { }} />,
            { matchId: 'match-games' }
        )

        await waitFor(() => {
            expect(mockQuery.from).toHaveBeenCalledWith('games')
            expect(mockQuery.eq).toHaveBeenCalledWith('match_day_id', 'match-games')
        })
    })
})
