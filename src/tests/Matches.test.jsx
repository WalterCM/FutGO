import { render, screen, waitFor, cleanup } from '@testing-library/react'
import { expect, test, describe, beforeEach, afterEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import Matches from '../pages/Matches'
import { createMockMatch, createMockProfile, createMockField, resetIdCounter } from './factories'
import { mockQuery } from './setup'

// Helper to render with Router
const renderWithRouter = (ui) => render(<BrowserRouter>{ui}</BrowserRouter>)

// Helper to setup Matches mock - handles double .order() chain
const setupMatchesMock = (matchesData) => {
    // Matches.jsx chains: from().select().order().order()
    // We need .order() to return mockQuery the first time, then resolve the second time
    let orderCallCount = 0
    mockQuery.order.mockImplementation(() => {
        orderCallCount++
        if (orderCallCount >= 2) {
            // Second call - resolve with data
            return Promise.resolve({ data: matchesData, error: null })
        }
        // First call - return mockQuery for chaining
        return mockQuery
    })
}

describe('Matches', () => {
    beforeEach(() => {
        resetIdCounter()
    })

    afterEach(() => {
        cleanup()
    })

    test('renders loading state initially', async () => {
        // Use a promise we can resolve to allow proper cleanup
        let resolvePromise
        const pendingPromise = new Promise((resolve) => { resolvePromise = resolve })

        // Chain needs to return mockQuery first, then the pending promise
        let callCount = 0
        mockQuery.order.mockImplementation(() => {
            callCount++
            if (callCount >= 2) {
                return pendingPromise
            }
            return mockQuery
        })

        renderWithRouter(<Matches profile={createMockProfile()} onMatchClick={() => { }} />)

        expect(screen.getByText(/Cargando partidos.../i)).toBeDefined()

        // Resolve and wait for React to process the update
        resolvePromise({ data: [], error: null })
        await waitFor(() => {
            expect(screen.getByText(/No hay encuentros programados aún/i)).toBeDefined()
        })
    })

    test('renders empty state when no matches exist', async () => {
        setupMatchesMock([])

        renderWithRouter(<Matches profile={createMockProfile()} onMatchClick={() => { }} />)

        await waitFor(() => {
            expect(screen.getByText(/No hay encuentros programados aún/i)).toBeDefined()
        })
    })

    test('renders list of matches', async () => {
        const match1 = createMockMatch({ field: createMockField({ name: 'Cancha Central' }) })
        const match2 = createMockMatch({ field: createMockField({ name: 'El Potrero' }) })

        setupMatchesMock([match1, match2])

        renderWithRouter(<Matches profile={createMockProfile()} onMatchClick={() => { }} />)

        await waitFor(() => {
            expect(screen.getByText('Cancha Central')).toBeDefined()
            expect(screen.getByText('El Potrero')).toBeDefined()
        })
    })

    test('shows "Programar Encuentro" button only for admins', async () => {
        setupMatchesMock([])

        // Regular user - NO button
        const { unmount } = renderWithRouter(
            <Matches profile={createMockProfile({ is_admin: false })} onMatchClick={() => { }} />
        )

        await waitFor(() => {
            expect(screen.queryByText(/Programar Encuentro/i)).toBeNull()
        })

        unmount()

        // Reset for second render
        setupMatchesMock([])

        // Admin user - YES button
        renderWithRouter(
            <Matches profile={createMockProfile({ is_admin: true })} onMatchClick={() => { }} />
        )

        await waitFor(() => {
            expect(screen.getByText(/Programar Encuentro/i)).toBeDefined()
        })
    })

    test('shows enrollment status correctly', async () => {
        const currentUser = createMockProfile({ id: 'current-user' })
        const match = createMockMatch()
        match.enrollments = [{ player_id: 'current-user' }]

        setupMatchesMock([match])

        renderWithRouter(<Matches profile={currentUser} onMatchClick={() => { }} />)

        await waitFor(() => {
            expect(screen.getByText(/Estás Inscrito/i)).toBeDefined()
        })
    })

    test('shows "Partido Lleno" when capacity is reached', async () => {
        const field = createMockField({ players_per_team: 5 })
        const match = createMockMatch({ field })
        match.enrollments = Array(10).fill(null).map((_, i) => ({ player_id: `player-${i}` }))

        setupMatchesMock([match])

        renderWithRouter(<Matches profile={createMockProfile()} onMatchClick={() => { }} />)

        await waitFor(() => {
            expect(screen.getByText(/Cupos Llenos/i)).toBeDefined()
        })
    })
})
