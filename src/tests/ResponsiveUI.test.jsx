import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { expect, test, describe, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MatchDetail from '../pages/MatchDetail'
import { createMockMatch, createMockProfile, resetIdCounter, createMockEnrollment } from './factories'
import { mockQuery } from './setup'
import { useAuth } from '../context/AuthContext'

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn()
}))

const renderWithRouter = (ui, { matchId = 'responsive-match' } = {}) => {
    return render(
        <MemoryRouter initialEntries={[`/partido/${matchId}`]}>
            <Routes>
                <Route path="/partido/:slugOrId" element={ui} />
            </Routes>
        </MemoryRouter>
    )
}

describe('Responsive UI Logic', () => {
    const matchId = 'responsive-match'

    const setupMatchMedia = (matches) => {
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            configurable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: matches,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        })
    }

    beforeEach(() => {
        resetIdCounter()
        vi.clearAllMocks()

        // Default mock for order to return empty arrays (for enrollments and games)
        // This prevents the TypeError: enrollments.filter is not a function
        mockQuery.order.mockResolvedValue({ data: [], error: null })
    })

    test('Desktop View (>= 600px) shows full labels in AdminTab', async () => {
        setupMatchMedia(false)

        const adminUser = createMockProfile({ id: 'admin-1', is_admin: true })
        const enrol = createMockEnrollment({
            player: createMockProfile({ full_name: 'Juan' }),
            paid: true,
            is_present: true,
            paid_at: new Date().toISOString()
        })
        const match = createMockMatch({ id: matchId, enrollments: [enrol] })

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        // Return Juan as the only enrollment
        mockQuery.order.mockResolvedValueOnce({ data: [enrol], error: null }) // enrollments
        mockQuery.order.mockResolvedValueOnce({ data: [], error: null })      // games

        vi.mocked(useAuth).mockReturnValue({
            profile: adminUser,
            refreshProfile: vi.fn(),
            user: { id: 'admin-1' }
        })

        renderWithRouter(<MatchDetail profile={adminUser} onBack={() => { }} />, { matchId })

        await waitFor(() => {
            expect(screen.getByText(/El Monumental/i)).toBeDefined()
        })

        fireEvent.click(screen.getByText(/Asistencias/i))

        // On Desktop, should see "Pagado" and "Presente" labels
        await waitFor(() => {
            expect(screen.queryByText('Pagado')).not.toBeNull()
            expect(screen.queryByText('Presente')).not.toBeNull()
        })
    })

    test('Mobile View (< 600px) hides labels in AdminTab', async () => {
        setupMatchMedia(true)

        const adminUser = createMockProfile({ id: 'admin-1', is_admin: true })
        const enrol = createMockEnrollment({
            player: createMockProfile({ full_name: 'Juan' }),
            paid: true,
            is_present: true,
            paid_at: new Date().toISOString()
        })
        const match = createMockMatch({ id: matchId, enrollments: [enrol] })

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        // Return Juan as the only enrollment
        mockQuery.order.mockResolvedValueOnce({ data: [enrol], error: null }) // enrollments
        mockQuery.order.mockResolvedValueOnce({ data: [], error: null })      // games

        vi.mocked(useAuth).mockReturnValue({
            profile: adminUser,
            refreshProfile: vi.fn(),
            user: { id: 'admin-1' }
        })

        renderWithRouter(<MatchDetail profile={adminUser} onBack={() => { }} />, { matchId })

        await waitFor(() => {
            expect(screen.getByText(/El Monumental/i)).toBeDefined()
        })

        fireEvent.click(screen.getByText(/Asistencias/i))

        // On Mobile, "Pagado" and "Presente" text should NOT be in the document
        await waitFor(() => {
            expect(screen.queryByText('Pagado')).toBeNull()
            expect(screen.queryByText('Presente')).toBeNull()
        })
    })
})
