/**
 * AdminTab.test.jsx - Tests for the Asistencias (Admin) Tab
 * 
 * Tests cover the business logic documented in AdminTab.jsx:
 * 1. Player sorting (paid first by payment time, excluded last)
 * 2. Financial calculations (exclude excluded players)
 * 3. TITULAR/RESERVA badge logic
 * 4. NO LLEGÓ indicator for no-shows
 * 5. RETIRADO badge for excluded players
 * 6. Remove button only for unpaid players
 * 7. Restore button for excluded players
 * 8. Confirmation modals for sensitive actions
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import AdminTab from '../pages/MatchDetail/AdminTab'
import {
    createMockMatch,
    createMockEnrollment,
    createMockProfile,
    createMockField,
    resetIdCounter
} from './factories'

// Helper to create enrollments with specific states
function createTestEnrollment(name, options = {}) {
    const player = createMockProfile({ full_name: name })
    return createMockEnrollment({
        player,
        ...options
    })
}

describe('AdminTab', () => {
    // Common props
    let defaultProps

    beforeEach(() => {
        resetIdCounter()
        const field = createMockField({ players_per_team: 5, price_per_hour: 120 })
        const match = createMockMatch({ field, fixed_cost: 200 })

        defaultProps = {
            enrollments: [],
            totalNeeded: 10, // 2 teams x 5 players
            suggestedQuota: 12, // 120 / 10
            match,
            canManage: true,
            onTogglePaid: vi.fn(),
            onTogglePresent: vi.fn(),
            onRemovePlayer: vi.fn(),
            onRestorePlayer: vi.fn(),
            onExpand: vi.fn(),
            onShrink: vi.fn(),
            onCancel: vi.fn(),
            actionLoading: null,
            numTeams: 2,
            getOrdinal: (n) => `${n}º`
        }
    })

    describe('Sorting Logic', () => {
        it('sorts paid players before unpaid players', () => {
            const unpaid = createTestEnrollment('Unpaid Player', {
                paid: false,
                created_at: '2026-02-01T10:00:00Z'
            })
            const paid = createTestEnrollment('Paid Player', {
                paid: true,
                paid_at: '2026-02-01T11:00:00Z'
            })

            render(<AdminTab {...defaultProps} enrollments={[unpaid, paid]} />)

            const rows = screen.getAllByText(/Player/)
            expect(rows[0]).toHaveTextContent('Paid Player')
            expect(rows[1]).toHaveTextContent('Unpaid Player')
        })

        it('sorts paid players by payment time (first paid = first in list)', () => {
            const paidLater = createTestEnrollment('Paid Later', {
                paid: true,
                paid_at: '2026-02-01T12:00:00Z'
            })
            const paidFirst = createTestEnrollment('Paid First', {
                paid: true,
                paid_at: '2026-02-01T10:00:00Z'
            })

            render(<AdminTab {...defaultProps} enrollments={[paidLater, paidFirst]} />)

            const rows = screen.getAllByText(/Paid/)
            expect(rows[0]).toHaveTextContent('Paid First')
            expect(rows[1]).toHaveTextContent('Paid Later')
        })

        it('sorts excluded players to the end', () => {
            const active = createTestEnrollment('Active Player', { is_excluded: false })
            const excluded = createTestEnrollment('Excluded Player', { is_excluded: true })

            render(<AdminTab {...defaultProps} enrollments={[excluded, active]} />)

            const rows = screen.getAllByText(/Player/)
            expect(rows[0]).toHaveTextContent('Active Player')
            expect(rows[1]).toHaveTextContent('Excluded Player')
        })
    })

    describe('Financial Calculations', () => {
        it('calculates collected amount from paid enrollments', () => {
            const paid1 = createTestEnrollment('Paid 1', { paid: true, paid_at: '2026-02-01T10:00:00Z' })
            const paid2 = createTestEnrollment('Paid 2', { paid: true, paid_at: '2026-02-01T11:00:00Z' })
            const unpaid = createTestEnrollment('Unpaid', { paid: false })

            render(<AdminTab {...defaultProps} enrollments={[paid1, paid2, unpaid]} suggestedQuota={10} />)

            // 2 paid x 10 quota = 20 collected
            expect(screen.getByText(/Recaudado: S\/ 20/)).toBeInTheDocument()
        })

        it('excludes excluded players from financial calculations', () => {
            const paid = createTestEnrollment('Paid Player', { paid: true, paid_at: '2026-02-01T10:00:00Z' })
            const excludedPaid = createTestEnrollment('Excluded Paid', { paid: true, paid_at: '2026-02-01T11:00:00Z', is_excluded: true })

            render(<AdminTab {...defaultProps} enrollments={[paid, excludedPaid]} suggestedQuota={10} />)

            // Only 1 active paid x 10 quota = 10 collected (excluded doesn't count)
            expect(screen.getByText(/Recaudado: S\/ 10/)).toBeInTheDocument()
        })

        it('shows "Cancha Cubierta" when collected >= cost', () => {
            const paidPlayers = Array(10).fill(null).map((_, i) =>
                createTestEnrollment(`Player ${i}`, { paid: true, paid_at: `2026-02-01T${10 + i}:00:00Z` })
            )

            render(<AdminTab
                {...defaultProps}
                enrollments={paidPlayers}
                suggestedQuota={20}  // 10 x 20 = 200, matches fixed_cost
            />)

            expect(screen.getByText(/Cancha Cubierta/)).toBeInTheDocument()
        })

        it('shows "Faltan" when collected < cost', () => {
            const paid = createTestEnrollment('Paid Player', { paid: true, paid_at: '2026-02-01T10:00:00Z' })

            render(<AdminTab
                {...defaultProps}
                enrollments={[paid]}
                suggestedQuota={10}  // 1 x 10 = 10, need 200
            />)

            expect(screen.getByText(/Faltan/)).toBeInTheDocument()
        })
    })

    describe('Status Badges', () => {
        it('shows TITULAR badge for paid players within capacity', () => {
            const paid = createTestEnrollment('Juan', { paid: true, paid_at: '2026-02-01T10:00:00Z' })

            render(<AdminTab {...defaultProps} enrollments={[paid]} totalNeeded={10} />)

            expect(screen.getByText('TITULAR')).toBeInTheDocument()
        })

        it('shows RESERVA badge for paid players beyond capacity', () => {
            // Create 11 paid players (capacity is 10)
            const players = Array(11).fill(null).map((_, i) =>
                createTestEnrollment(`Player ${i}`, { paid: true, paid_at: `2026-02-01T${10 + i}:00:00Z` })
            )

            render(<AdminTab {...defaultProps} enrollments={players} totalNeeded={10} />)

            expect(screen.getByText('RESERVA')).toBeInTheDocument()
        })

        it('shows RETIRADO badge for excluded players', () => {
            const excluded = createTestEnrollment('Excluded', { is_excluded: true })

            render(<AdminTab {...defaultProps} enrollments={[excluded]} />)

            expect(screen.getByText('RETIRADO')).toBeInTheDocument()
        })

        it('shows NO LLEGÓ badge for no-shows (paid + not present + locked match)', () => {
            const noShow = createTestEnrollment('No Show', {
                paid: true,
                paid_at: '2026-02-01T10:00:00Z',
                is_present: false
            })
            const lockedMatch = { ...defaultProps.match, is_locked: true }

            render(<AdminTab {...defaultProps} enrollments={[noShow]} match={lockedMatch} />)

            expect(screen.getByText('NO LLEGÓ')).toBeInTheDocument()
        })

        it('does not show NO LLEGÓ for players who are present', () => {
            const present = createTestEnrollment('Present', {
                paid: true,
                paid_at: '2026-02-01T10:00:00Z',
                is_present: true
            })
            const lockedMatch = { ...defaultProps.match, is_locked: true }

            render(<AdminTab {...defaultProps} enrollments={[present]} match={lockedMatch} />)

            expect(screen.queryByText('NO LLEGÓ')).not.toBeInTheDocument()
        })
    })

    describe('Player Actions - Remove Button', () => {
        it('shows remove button for unpaid players', () => {
            const unpaid = createTestEnrollment('Unpaid', { paid: false })

            render(<AdminTab {...defaultProps} enrollments={[unpaid]} />)

            expect(screen.getByTitle('Retirar del partido')).toBeInTheDocument()
        })

        it('does not show remove button for paid players', () => {
            const paid = createTestEnrollment('Paid', { paid: true, paid_at: '2026-02-01T10:00:00Z' })

            render(<AdminTab {...defaultProps} enrollments={[paid]} />)

            expect(screen.queryByTitle('Retirar del partido')).not.toBeInTheDocument()
        })

        it('does not show remove button for excluded players', () => {
            const excluded = createTestEnrollment('Excluded', { is_excluded: true })

            render(<AdminTab {...defaultProps} enrollments={[excluded]} />)

            expect(screen.queryByTitle('Retirar del partido')).not.toBeInTheDocument()
        })

        it('does not show remove button when match is locked', () => {
            const unpaid = createTestEnrollment('Unpaid', { paid: false })
            const lockedMatch = { ...defaultProps.match, is_locked: true }

            render(<AdminTab {...defaultProps} enrollments={[unpaid]} match={lockedMatch} />)

            expect(screen.queryByTitle('Retirar del partido')).not.toBeInTheDocument()
        })
    })

    describe('Player Actions - Restore Button', () => {
        it('shows restore button for excluded players', () => {
            const excluded = createTestEnrollment('Excluded', { is_excluded: true })

            render(<AdminTab {...defaultProps} enrollments={[excluded]} />)

            expect(screen.getByText('Restaurar')).toBeInTheDocument()
        })

        it('calls onRestorePlayer when restore button is clicked', () => {
            const excluded = createTestEnrollment('Excluded', { is_excluded: true })

            render(<AdminTab {...defaultProps} enrollments={[excluded]} />)

            fireEvent.click(screen.getByText('Restaurar'))
            expect(defaultProps.onRestorePlayer).toHaveBeenCalled()
        })

        it('does not show restore button when match is locked', () => {
            const excluded = createTestEnrollment('Excluded', { is_excluded: true })
            const lockedMatch = { ...defaultProps.match, is_locked: true }

            render(<AdminTab {...defaultProps} enrollments={[excluded]} match={lockedMatch} />)

            expect(screen.queryByText('Restaurar')).not.toBeInTheDocument()
        })
    })

    describe('Confirmation Modals', () => {
        it('shows confirmation when clicking Pagado (removing payment)', async () => {
            const paid = createTestEnrollment('Juan', { paid: true, paid_at: '2026-02-01T10:00:00Z' })

            render(<AdminTab {...defaultProps} enrollments={[paid]} />)

            // Click "Pagado" button
            fireEvent.click(screen.getByText('Pagado'))

            // Modal should appear
            expect(screen.getByText('Quitar Pago')).toBeInTheDocument()
            expect(screen.getByText(/perderá su cupo de titular/)).toBeInTheDocument()
        })

        it('does not show confirmation when clicking Cobrar (adding payment)', async () => {
            const unpaid = createTestEnrollment('Juan', { paid: false })

            render(<AdminTab {...defaultProps} enrollments={[unpaid]} />)

            // Click "Cobrar" button
            fireEvent.click(screen.getByText('Cobrar'))

            // Should call onTogglePaid directly, no modal
            expect(defaultProps.onTogglePaid).toHaveBeenCalled()
            expect(screen.queryByText('Quitar Pago')).not.toBeInTheDocument()
        })

        it('shows confirmation when clicking Presente (marking absent)', async () => {
            const present = createTestEnrollment('Juan', {
                paid: true,
                paid_at: '2026-02-01T10:00:00Z',
                is_present: true
            })

            render(<AdminTab {...defaultProps} enrollments={[present]} />)

            // Click "Presente" button
            fireEvent.click(screen.getByText('Presente'))

            // Modal should appear
            expect(screen.getByText('Marcar Ausente')).toBeInTheDocument()
        })

        it('does not show confirmation when clicking Ausente (marking present)', async () => {
            const absent = createTestEnrollment('Juan', {
                paid: true,
                paid_at: '2026-02-01T10:00:00Z',
                is_present: false
            })

            render(<AdminTab {...defaultProps} enrollments={[absent]} />)

            // Click "Ausente" button
            fireEvent.click(screen.getByText('Ausente'))

            // Should call onTogglePresent directly, no modal
            expect(defaultProps.onTogglePresent).toHaveBeenCalled()
            expect(screen.queryByText('Marcar Ausente')).not.toBeInTheDocument()
        })

        it('shows confirmation when removing a player', async () => {
            const unpaid = createTestEnrollment('Juan Perez', { paid: false })

            render(<AdminTab {...defaultProps} enrollments={[unpaid]} />)

            // Click remove button
            fireEvent.click(screen.getByTitle('Retirar del partido'))

            // Modal should appear
            expect(screen.getByText('Retirar Jugador')).toBeInTheDocument()
            expect(screen.getByText(/no podrá volver a inscribirse/)).toBeInTheDocument()
        })

        it('calls onRemovePlayer after confirming removal', async () => {
            const unpaid = createTestEnrollment('Juan', { paid: false })

            render(<AdminTab {...defaultProps} enrollments={[unpaid]} />)

            // Click remove button and confirm
            fireEvent.click(screen.getByTitle('Retirar del partido'))
            fireEvent.click(screen.getByText('Sí, Retirar'))

            expect(defaultProps.onRemovePlayer).toHaveBeenCalled()
        })
    })

    describe('Locked Match State', () => {
        it('shows PRESENTE badge for present players when canManage is false', () => {
            const present = createTestEnrollment('Juan', {
                paid: true,
                paid_at: '2026-02-01T10:00:00Z',
                is_present: true
            })

            render(<AdminTab {...defaultProps} enrollments={[present]} canManage={false} />)

            expect(screen.getByText('PRESENTE')).toBeInTheDocument()
        })

        it('shows finalized status when match is locked', () => {
            const lockedMatch = { ...defaultProps.match, is_locked: true }

            render(<AdminTab {...defaultProps} enrollments={[]} match={lockedMatch} />)

            expect(screen.getByText(/Partido Finalizado/)).toBeInTheDocument()
        })

        it('shows canceled status when match is canceled', () => {
            const canceledMatch = { ...defaultProps.match, is_locked: true, is_canceled: true }

            render(<AdminTab {...defaultProps} enrollments={[]} match={canceledMatch} />)

            expect(screen.getByText(/Partido Cancelado/)).toBeInTheDocument()
        })
    })
})
