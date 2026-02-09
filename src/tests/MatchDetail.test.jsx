import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, describe, vi, beforeEach } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MatchDetail from '../pages/MatchDetail'
import { createMockMatch, createMockProfile, createMockField, createMockEnrollment, resetIdCounter } from './factories'
import { mockQuery } from './setup'

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        refreshProfile: vi.fn(),
        profile: null
    })
}))

// Helper to render with Router and match params
const renderWithRouter = (ui, { matchId = 'match-1' } = {}) => {
    return render(
        <MemoryRouter initialEntries={[`/partido/${matchId}`]}>
            <Routes>
                <Route path="/partido/:slugOrId" element={ui} />
            </Routes>
        </MemoryRouter>
    )
}

describe('MatchDetail', () => {
    beforeEach(() => {
        resetIdCounter()
        vi.clearAllMocks()

        // Default mocks to avoid unhandled rejections or undefined errors
        mockQuery.order.mockResolvedValue({ data: [], error: null })
        mockQuery.single.mockResolvedValue({ data: null, error: null })
        mockQuery.eq.mockImplementation(() => mockQuery)
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
        const field = createMockField({ name: 'Estadio Nacional' })
        const match = createMockMatch({ id: 'match-1', field })
        mockQuery.single.mockResolvedValue({ data: match, error: null })

        renderWithRouter(<MatchDetail profile={createMockProfile()} onBack={() => { }} />, { matchId: 'match-1' })

        await waitFor(() => {
            expect(screen.getByText('Estadio Nacional')).toBeDefined()
        })
    })

    test('shows player count correctly', async () => {
        const match = createMockMatch({ id: 'match-1' })
        const enrollments = [createMockEnrollment(), createMockEnrollment()]
        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValueOnce({ data: enrollments, error: null })

        renderWithRouter(<MatchDetail profile={createMockProfile()} onBack={() => { }} />, { matchId: 'match-1' })

        await waitFor(() => {
            expect(screen.getByText('2/10 Reservados')).toBeDefined()
        })
    })

    test('renders correctly for non-existent match', async () => {
        mockQuery.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
        renderWithRouter(<MatchDetail profile={createMockProfile()} onBack={() => { }} />, { matchId: 'missing' })

        await waitFor(() => {
            expect(screen.getByText(/No se encontró el encuentro/i)).toBeDefined()
        })
    })

    test('slug support: queries by slug if not a UUID', async () => {
        const slug = 'my-cool-match'
        const match = createMockMatch({ id: 'uuid-123', slug })
        mockQuery.single.mockResolvedValue({ data: match, error: null })

        renderWithRouter(<MatchDetail profile={createMockProfile()} onBack={() => { }} />, { matchId: slug })

        await waitFor(() => {
            expect(mockQuery.eq).toHaveBeenCalledWith('slug', slug)
        })
    })
})
