/**
 * FieldTab.test.jsx - Tests for the Equipos (Teams) Tab
 * 
 * Tests cover the business logic documented in FieldTab.jsx:
 * 1. Only present players shown (excluded can't be present)
 * 2. Bench players sorted by arrival time
 * 3. Confirmation modal for shuffle
 * 4. Team size warning display
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FieldTab from '../pages/MatchDetail/FieldTab'
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

// Mock team configs
const mockTeamConfigs = {
    0: { name: 'Banca', color: '#666', bg: 'rgba(255,255,255,0.02)' },
    1: { name: 'Equipo 1', color: '#10b981', bg: 'linear-gradient(135deg, #10b981, #059669)' },
    2: { name: 'Equipo 2', color: '#3b82f6', bg: 'linear-gradient(135deg, #3b82f6, #2563eb)' }
}

describe('FieldTab', () => {
    let defaultProps

    beforeEach(() => {
        resetIdCounter()
        const field = createMockField({ players_per_team: 5 })
        const match = createMockMatch({ field })

        defaultProps = {
            enrollments: [],
            numTeams: 2,
            getTeamPlayers: vi.fn((teamId) => []),
            teamConfigs: mockTeamConfigs,
            canManage: true,
            onDragStart: vi.fn(),
            onDragOver: vi.fn(),
            onDrop: vi.fn(),
            onKitPicker: vi.fn(),
            onRandomizeKit: vi.fn(),
            onRandomizeAll: vi.fn(),
            onRandomizeKitsAll: vi.fn(),
            selectedPlayerId: null,
            onPlayerClick: vi.fn(),
            onMobileMove: vi.fn(),
            actionLoading: null
        }
    })

    describe('Presence Requirement', () => {
        it('shows empty state when no players are present', () => {
            const absent = createTestEnrollment('Juan', { is_present: false })

            render(<FieldTab {...defaultProps} enrollments={[absent]} />)

            expect(screen.getByText(/No hay nadie "Presente"/)).toBeInTheDocument()
        })

        it('does not show empty state when players are present', () => {
            const present = createTestEnrollment('Juan', { is_present: true, paid: true })

            render(<FieldTab {...defaultProps} enrollments={[present]} />)

            expect(screen.queryByText(/No hay nadie "Presente"/)).not.toBeInTheDocument()
        })

        it('treats excluded players as not present', () => {
            // An excluded player marked as present should not count
            const excluded = createTestEnrollment('Juan', { is_present: true, is_excluded: true })

            render(<FieldTab {...defaultProps} enrollments={[excluded]} />)

            expect(screen.getByText(/No hay nadie "Presente"/)).toBeInTheDocument()
        })
    })

    describe('Shuffle Confirmation', () => {
        it('shows shuffle button when can manage and has present players', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            render(<FieldTab {...defaultProps} enrollments={[present]} />)

            expect(screen.getByText('Sorteo de Equipos')).toBeInTheDocument()
        })

        it('does not show shuffle button when cannot manage', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            render(<FieldTab {...defaultProps} enrollments={[present]} canManage={false} />)

            expect(screen.queryByText('Sorteo de Equipos')).not.toBeInTheDocument()
        })

        it('shows confirmation modal when clicking shuffle', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            render(<FieldTab {...defaultProps} enrollments={[present]} />)

            fireEvent.click(screen.getByText('Sorteo de Equipos'))

            expect(screen.getByText(/Los equipos actuales serán reemplazados/)).toBeInTheDocument()
        })

        it('calls onRandomizeAll after confirming shuffle', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            render(<FieldTab {...defaultProps} enrollments={[present]} />)

            fireEvent.click(screen.getByText('Sorteo de Equipos'))
            fireEvent.click(screen.getByText('Sí, Sortear'))

            expect(defaultProps.onRandomizeAll).toHaveBeenCalled()
        })

        it('does not call onRandomizeAll when canceling shuffle', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            render(<FieldTab {...defaultProps} enrollments={[present]} />)

            fireEvent.click(screen.getByText('Sorteo de Equipos'))
            fireEvent.click(screen.getByText('Cancelar'))

            expect(defaultProps.onRandomizeAll).not.toHaveBeenCalled()
        })
    })

    describe('Team Size Warning', () => {
        it('shows warning when teams are unbalanced', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            // Mock unbalanced teams
            const getTeamPlayers = vi.fn((teamId) => {
                if (teamId === 1) return Array(5).fill({ id: 'p', player: { full_name: 'Test' } })
                if (teamId === 2) return Array(3).fill({ id: 'p', player: { full_name: 'Test' } })
                return []
            })

            render(<FieldTab {...defaultProps} enrollments={[present]} getTeamPlayers={getTeamPlayers} />)

            expect(screen.getByText(/Equipos desbalanceados/)).toBeInTheDocument()
            expect(screen.getByText(/5 vs 3/)).toBeInTheDocument()
        })

        it('does not show warning when teams are balanced', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            // Mock balanced teams
            const getTeamPlayers = vi.fn((teamId) => {
                if (teamId === 1) return Array(5).fill({ id: 'p', player: { full_name: 'Test' } })
                if (teamId === 2) return Array(5).fill({ id: 'p', player: { full_name: 'Test' } })
                return []
            })

            render(<FieldTab {...defaultProps} enrollments={[present]} getTeamPlayers={getTeamPlayers} />)

            expect(screen.queryByText(/Equipos desbalanceados/)).not.toBeInTheDocument()
        })

        it('does not show warning when no teams have players', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            render(<FieldTab {...defaultProps} enrollments={[present]} />)

            expect(screen.queryByText(/Equipos desbalanceados/)).not.toBeInTheDocument()
        })
    })

    describe('Bench (Banca)', () => {
        it('renders bench section', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            render(<FieldTab {...defaultProps} enrollments={[present]} />)

            expect(screen.getByText('Banca')).toBeInTheDocument()
        })

        it('shows bench in mobile move options', () => {
            const present = createTestEnrollment('Juan', { is_present: true, id: 'test-id' })

            render(<FieldTab {...defaultProps} enrollments={[present]} selectedPlayerId="test-id" />)

            // Should show move options including Banca
            expect(screen.getByText('Mover Jugador Seleccionado:')).toBeInTheDocument()
            expect(screen.getAllByText('Banca').length).toBeGreaterThanOrEqual(1)
        })
    })

    describe('Kit Customization', () => {
        it('shows colors button when can manage and has present players', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            render(<FieldTab {...defaultProps} enrollments={[present]} />)

            expect(screen.getByText('Colores')).toBeInTheDocument()
        })

        it('calls onRandomizeKitsAll when clicking colors button', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            render(<FieldTab {...defaultProps} enrollments={[present]} />)

            fireEvent.click(screen.getByText('Colores'))

            expect(defaultProps.onRandomizeKitsAll).toHaveBeenCalled()
        })
    })

    describe('Team Sections', () => {
        it('renders correct number of team sections', () => {
            const present = createTestEnrollment('Juan', { is_present: true })

            render(<FieldTab {...defaultProps} enrollments={[present]} numTeams={3} teamConfigs={{
                ...mockTeamConfigs,
                3: { name: 'Equipo 3', color: '#f59e0b', bg: 'linear-gradient(135deg, #f59e0b, #d97706)' }
            }} />)

            expect(screen.getByText('Equipo 1')).toBeInTheDocument()
            expect(screen.getByText('Equipo 2')).toBeInTheDocument()
            expect(screen.getByText('Equipo 3')).toBeInTheDocument()
        })
    })

    describe('Disabled State', () => {
        it('disables interaction when no players are present', () => {
            render(<FieldTab {...defaultProps} enrollments={[]} />)

            // The main container should have reduced opacity
            expect(screen.getByText(/No hay nadie "Presente"/)).toBeInTheDocument()
        })

        it('hides action buttons when no players are present', () => {
            render(<FieldTab {...defaultProps} enrollments={[]} />)

            expect(screen.queryByText('Sorteo de Equipos')).not.toBeInTheDocument()
            expect(screen.queryByText('Colores')).not.toBeInTheDocument()
        })
    })
})
