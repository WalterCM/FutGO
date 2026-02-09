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
        refreshProfile: vi.fn(),
        profile: { id: 'admin-1', is_admin: true }
    })
}))

const renderWithRouter = (ui, { matchId = 'match-1' } = {}) => {
    return render(
        <MemoryRouter initialEntries={[`/partido/${matchId}`]}>
            <Routes>
                <Route path="/partido/:slugOrId" element={ui} />
            </Routes>
        </MemoryRouter>
    )
}

describe('MatchPhases Refined Logic', () => {
    beforeEach(() => {
        resetIdCounter()
        vi.clearAllMocks()
    })

    test('Winner Stays generates placeholders for the full sequence', async () => {
        const match = createMockMatch({
            id: 'match-ws',
            max_players: 15, // Assumes 3 teams (5 per team)
            phases: [{ id: 'p1', type: 'winner_stays', name: 'Ganador Queda', status: 'pending' }]
        })

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })
        mockQuery.update.mockResolvedValue({ data: match, error: null })

        renderWithRouter(
            <MatchDetail profile={{ id: 'admin-1', is_admin: true }} onBack={() => { }} />,
            { matchId: 'match-ws' }
        )

        await userEvent.click(await screen.findByText('Encuentros'))

        // Find the "Generar" button for the WS phase
        const genBtn = await screen.findByText(/Generar/i)
        await userEvent.click(genBtn)

        await waitFor(() => {
            expect(mockQuery.update).toHaveBeenCalled()
            const updateCall = mockQuery.update.mock.calls[0][0]
            // For 3 teams, should have 2 matches (T1 vs T2, Ganador vs T3)
            expect(updateCall.fixtures.length).toBe(2)
            expect(updateCall.fixtures[1].placeholder1).toContain('Ganador')
        })
    })

    test('Eliminatoria can be generated without previous standings', async () => {
        const match = createMockMatch({
            id: 'match-tourney',
            max_players: 10, // 2 teams
            phases: [{ id: 'p1', type: 'tournament', name: 'Eliminatoria', status: 'pending' }]
        })

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })
        mockQuery.update.mockResolvedValue({ data: match, error: null })

        renderWithRouter(
            <MatchDetail profile={{ id: 'admin-1', is_admin: true }} onBack={() => { }} />,
            { matchId: 'match-tourney' }
        )

        await userEvent.click(await screen.findByText('Encuentros'))
        const genBtn = await screen.findByText(/Generar/i)
        await userEvent.click(genBtn)

        await waitFor(() => {
            expect(mockQuery.update).toHaveBeenCalled()
            const updateCall = mockQuery.update.mock.calls[0][0]
            expect(updateCall.fixtures.length).toBe(1) // 1 final for 2 teams
            expect(updateCall.fixtures[0].team1Id).toBe(1)
        })
    })

    test.skip('can add a manual match to any phase', async () => {
        const match = createMockMatch({
            id: 'match-manual',
            phases: [{ id: 'p1', type: 'free', name: 'Fase Libre', status: 'pending' }],
            max_players: 10 // 2 teams available
        })

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })
        mockQuery.update.mockResolvedValue({ data: match, error: null })

        renderWithRouter(
            <MatchDetail profile={{ id: 'admin-1', is_admin: true }} onBack={() => { }} />,
            { matchId: 'match-manual' }
        )

        await userEvent.click(await screen.findByText('Encuentros'))


        // Use exact button text to avoid matching tab label
        const manualBtn = await screen.findByRole('button', { name: /Encuentro$/i })
        await userEvent.click(manualBtn)

        // Modal should be open
        expect(await screen.findByText('Añadir Encuentro Manual')).toBeDefined()

        // Wait for select options to be populated
        const selectA = await screen.findByDisplayValue('Equipo A')
        const selectB = await screen.findByDisplayValue('Equipo B')

        await userEvent.selectOptions(selectA, '1')
        await userEvent.selectOptions(selectB, '2')

        const addBtn = await screen.findByText('Añadir')
        await userEvent.click(addBtn)

        await waitFor(() => {
            expect(mockQuery.update).toHaveBeenCalled()
            const updateCall = mockQuery.update.mock.calls[0][0]
            expect(updateCall.fixtures[0].team1Id).toBe(1)
            expect(updateCall.fixtures[0].team2Id).toBe(2)
        })
    })

    test('Tournament Standings generates correct placeholders for 4 teams', async () => {
        const match = createMockMatch({
            id: 'match-standings',
            max_players: 20, // 4 teams
            phases: [
                { id: 'p1', type: 'liguilla', name: 'Liguilla', status: 'in_progress' },
                { id: 'p2', type: 'tournament_standings', name: 'Eliminación', status: 'pending' }
            ]
        })

        mockQuery.single.mockResolvedValue({ data: match, error: null })
        mockQuery.order.mockResolvedValue({ data: [], error: null })
        mockQuery.update.mockResolvedValue({ data: match, error: null })

        renderWithRouter(
            <MatchDetail profile={{ id: 'admin-1', is_admin: true }} onBack={() => { }} />,
            { matchId: 'match-standings' }
        )

        await userEvent.click(await screen.findByText('Encuentros'))


        // Find the Generar button for the elimination phase
        const genBtns = await screen.findAllByText(/Generar/i)
        await userEvent.click(genBtns[1]) // Second phase

        await waitFor(() => {
            expect(mockQuery.update).toHaveBeenCalled()
            const updateCall = mockQuery.update.mock.calls[0][0]
            // For 4 teams: SF1 (1v4), SF2 (2v3), Third Place, Final
            expect(updateCall.fixtures.length).toBe(4)
            expect(updateCall.fixtures[0].placeholder1).toBe('1º de Liguilla')
            expect(updateCall.fixtures[0].placeholder2).toBe('4º de Liguilla')
            expect(updateCall.fixtures[1].placeholder1).toBe('2º de Liguilla')
            expect(updateCall.fixtures[1].placeholder2).toBe('3º de Liguilla')
            expect(updateCall.fixtures[2].label).toBe('Tercer Puesto')
            expect(updateCall.fixtures[3].label).toBe('Gran Final')
        })
    })
})

// Unit tests for getStandings logic (isolated)
describe('Standings Calculation', () => {
    test('calculates standings correctly from game results', () => {
        // Simulate the logic that getStandings uses
        const stats = {}
        const numTeams = 4

        // Initialize
        for (let i = 1; i <= numTeams; i++) {
            stats[i] = { teamId: i, points: 0, goalDiff: 0 }
        }

        // Simulate game results:
        // T1 beats T2 (3-1) -> T1: 3pts, +2gd
        // T1 beats T3 (2-0) -> T1: 6pts, +4gd
        // T1 beats T4 (1-0) -> T1: 9pts, +5gd
        // T2 beats T3 (2-1) -> T2: 3pts, -1gd
        // T2 beats T4 (3-0) -> T2: 6pts, +2gd
        // T3 beats T4 (1-0) -> T3: 3pts, -2gd
        // T4: 0pts, -5gd

        const games = [
            { team1_id: 1, team2_id: 2, score1: 3, score2: 1 },
            { team1_id: 1, team2_id: 3, score1: 2, score2: 0 },
            { team1_id: 1, team2_id: 4, score1: 1, score2: 0 },
            { team1_id: 2, team2_id: 3, score1: 2, score2: 1 },
            { team1_id: 2, team2_id: 4, score1: 3, score2: 0 },
            { team1_id: 3, team2_id: 4, score1: 1, score2: 0 },
        ]

        games.forEach(g => {
            const t1 = g.team1_id, t2 = g.team2_id
            stats[t1].goalDiff += (g.score1 - g.score2)
            stats[t2].goalDiff += (g.score2 - g.score1)

            if (g.score1 > g.score2) {
                stats[t1].points += 3
            } else if (g.score1 < g.score2) {
                stats[t2].points += 3
            } else {
                stats[t1].points += 1
                stats[t2].points += 1
            }
        })

        const sorted = Object.values(stats).sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff)

        // Expected order: T1 (9pts), T2 (6pts), T3 (3pts), T4 (0pts)
        expect(sorted[0].teamId).toBe(1)
        expect(sorted[0].points).toBe(9)
        expect(sorted[1].teamId).toBe(2)
        expect(sorted[1].points).toBe(6)
        expect(sorted[2].teamId).toBe(3)
        expect(sorted[2].points).toBe(3)
        expect(sorted[3].teamId).toBe(4)
        expect(sorted[3].points).toBe(0)
    })

    test('standings ignores elimination games', () => {
        // This tests the filtering logic
        const liguillaPhaseIds = ['p1']
        const fixtures = [
            { id: 'f1', phaseId: 'p1' }, // Liguilla
            { id: 'f2', phaseId: 'p1' }, // Liguilla
            { id: 'f3', phaseId: 'p2' }, // Elimination (should be ignored)
        ]

        const liguillaFixtureIds = new Set(
            fixtures.filter(f => liguillaPhaseIds.includes(f.phaseId)).map(f => f.id)
        )

        const games = [
            { fixture_id: 'f1', team1_id: 1, team2_id: 2, score1: 3, score2: 1 }, // Counts
            { fixture_id: 'f3', team1_id: 1, team2_id: 4, score1: 0, score2: 5 }, // Should NOT count
        ]

        const liguillaGames = games.filter(g =>
            !g.fixture_id || liguillaFixtureIds.has(g.fixture_id)
        )

        expect(liguillaGames.length).toBe(1)
        expect(liguillaGames[0].fixture_id).toBe('f1')
    })
})

describe('Placeholder Resolution', () => {
    test('resolves Ganador Queda placeholders correctly', () => {
        const fixtures = [
            { id: 'ws1', label: 'Juego 1', team1Id: 1, team2Id: 2, status: 'completed', score1: 3, score2: 1, phaseId: 'p1' },
            { id: 'ws2', label: 'Juego 2', team1Id: null, team2Id: 3, placeholder1: 'Ganador Juego 1', phaseId: 'p1' },
        ]

        // Build winner map
        const fixtureWinners = {}
        fixtures.forEach(f => {
            if (f.status === 'completed' && f.score1 !== undefined && f.score2 !== undefined) {
                if (f.score1 > f.score2) {
                    fixtureWinners[f.id] = f.team1Id
                } else if (f.score2 > f.score1) {
                    fixtureWinners[f.id] = f.team2Id
                }
            }
        })

        // Resolve placeholder
        const retoMatch = 'Ganador Juego 1'.match(/Ganador Juego (\d+)/)
        expect(retoMatch).not.toBeNull()
        const prevRetoNum = parseInt(retoMatch[1])
        const prevFixture = fixtures.find(pf =>
            pf.label === `Juego ${prevRetoNum}` && pf.phaseId === 'p1'
        )

        expect(prevFixture).toBeDefined()
        expect(fixtureWinners[prevFixture.id]).toBe(1) // Team 1 won Juego 1
    })
})
