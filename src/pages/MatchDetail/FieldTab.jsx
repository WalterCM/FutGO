/**
 * FieldTab - Team Management Panel (Equipos)
 * 
 * BUSINESS LOGIC DOCUMENTATION:
 * 
 * 1. PRESENCE REQUIREMENT
 *    - Only players marked as "Presente" in the Asistencias tab appear here
 *    - Payment is required before marking present (no on-site payments)
 *    - Excluded players (is_excluded) cannot be present, so they never appear here
 * 
 * 2. BENCH (BANCA - Team 0)
 *    - Grouping for players who haven't been assigned to a team yet
 *    - NOT a real bench for substitutes - just a staging area
 *    - After "Sorteo de Equipos", late arrivals or extras go to bench
 *    - Players on bench can be assigned to teams manually or via next sorteo
 * 
 * 3. SORTEO DE EQUIPOS (RANDOM TEAM ASSIGNMENT)
 *    - Uses ELO-jitter algorithm for balanced teams
 *    - Snake draft pattern: 1,2,3,3,2,1,1,2,3... for fairness
 *    - Only fills complete teams (e.g., if 5v5 and 13 present, fills 2 teams of 5, bench 3)
 *    - Arrival order determines who participates (first N * playersPerTeam)
 *    - Late arrivals automatically go to bench
 * 
 * 4. MANUAL TEAM MOVEMENT
 *    - Drag & drop on desktop, tap-to-select on mobile
 *    - Admins can move players between teams at any time (even during match)
 *    - Useful for injuries, late arrivals, or balancing mid-match
 * 
 * 5. KIT CUSTOMIZATION
 *    - Each team can have custom colors (kit picker)
 *    - Random kit assignment available per-team or all-at-once
 *    - Kits stored in match.team_configs
 * 
 * 6. TEAM SIZE WARNINGS
 *    - Soft warning shown when teams have unequal player counts
 *    - Not blocking - sometimes unequal teams are unavoidable (injuries, no-shows)
 * 
 * FUTURE FEATURES:
 * - Undo for team assignments (snapshot/restore mechanism)
 */

import React, { useState } from 'react'
import { Users, Palette, Dices, Shuffle, AlertTriangle } from 'lucide-react'
import TeamSection from './TeamSection'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ConfirmModal from '../../components/ui/ConfirmModal'

const FieldTab = ({
    enrollments,
    numTeams,
    getTeamPlayers,
    teamConfigs,
    canManage,
    onDragStart,
    onDragOver,
    onDrop,
    onKitPicker,
    onRandomizeKit,
    onRandomizeAll,
    onRandomizeKitsAll,
    selectedPlayerId,
    onPlayerClick,
    onMobileMove,
    actionLoading,
    viewerId,
    viewerIsSuperAdmin,
    matchCreatorId
}) => {
    // Confirmation modal state for shuffle
    const [showShuffleConfirm, setShowShuffleConfirm] = useState(false)

    // Only present players are shown (excluded players can't be present)
    const presentEnrollments = enrollments.filter(e => e.is_present && !e.is_excluded)
    const hasPresent = presentEnrollments.length > 0

    // Get bench players sorted by arrival time (present_at)
    const getBenchPlayers = () => {
        const benchPlayers = getTeamPlayers(0)
        return [...benchPlayers].sort((a, b) =>
            new Date(a.present_at) - new Date(b.present_at)
        )
    }

    // Check for unbalanced teams
    const getTeamSizes = () => {
        const sizes = []
        for (let i = 1; i <= numTeams; i++) {
            sizes.push(getTeamPlayers(i).length)
        }
        return sizes
    }

    const teamSizes = getTeamSizes()
    const maxTeamSize = Math.max(...teamSizes, 0)
    const minTeamSize = Math.min(...teamSizes.filter(s => s > 0), Infinity)
    const hasUnbalancedTeams = maxTeamSize > 0 && minTeamSize !== Infinity && maxTeamSize !== minTeamSize

    // Handle shuffle with confirmation
    const handleShuffleClick = () => {
        setShowShuffleConfirm(true)
    }

    const handleConfirmShuffle = () => {
        setShowShuffleConfirm(false)
        onRandomizeAll()
    }

    return (
        <>
            {/* Shuffle confirmation modal */}
            <ConfirmModal
                show={showShuffleConfirm}
                title="Sorteo de Equipos"
                message="¿Estás seguro? Los equipos actuales serán reemplazados por un sorteo aleatorio balanceado."
                confirmText="Sí, Sortear"
                cancelText="Cancelar"
                onConfirm={handleConfirmShuffle}
                onClose={() => setShowShuffleConfirm(false)}
                variant="primary"
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: hasPresent ? 1 : 0.5 }}>
                    <Users size={20} /> Equipos
                </h3>

                {canManage && hasPresent && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onRandomizeKitsAll}
                            icon={Palette}
                            title="Camisetas Aleatorias"
                        >
                            Colores
                        </Button>
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={handleShuffleClick}
                            icon={Shuffle}
                            loading={actionLoading === 'randomizing'}
                        >
                            Sorteo de Equipos
                        </Button>
                    </div>
                )}
            </div>

            {/* Team size warning */}
            {hasUnbalancedTeams && hasPresent && (
                <Card style={{
                    marginBottom: '1rem',
                    padding: '0.8rem 1rem',
                    background: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }} hover={false}>
                    <AlertTriangle size={16} style={{ color: '#fbbf24' }} />
                    <span style={{ color: '#fbbf24', fontSize: '0.85rem' }}>
                        Equipos desbalanceados: {teamSizes.filter(s => s > 0).join(' vs ')} jugadores
                    </span>
                </Card>
            )}

            {!hasPresent && (
                <Card style={{ textAlign: 'center', padding: '2rem', marginBottom: '2rem', border: '2px dashed var(--border)' }} hover={false}>
                    <p style={{ color: 'var(--text-dim)', margin: 0 }}>
                        {canManage
                            ? 'No hay nadie "Presente". Marca quién llegó en la pestaña de Asistencias.'
                            : 'Aún no han llegado jugadores. Esperando a que el organizador marque las asistencias...'
                        }
                    </p>
                </Card>
            )}

            <div style={{
                opacity: hasPresent ? 1 : 0.5,
                pointerEvents: hasPresent ? 'auto' : 'none',
                marginBottom: '4rem'
            }}>
                {selectedPlayerId && (
                    <div style={{ background: 'var(--primary)', color: 'black', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', animation: 'slideIn 0.3s' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Mover Jugador Seleccionado:</div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {Array.from({ length: numTeams }, (_, i) => i + 1).map(id => (
                                <button
                                    key={id}
                                    onClick={() => onMobileMove(id)}
                                    style={{ background: 'black', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                                >
                                    {teamConfigs[id].name}
                                </button>
                            ))}
                            <button
                                onClick={() => onMobileMove(0)}
                                style={{ background: 'var(--bg-card)', color: 'white', border: '1px solid white', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                                Banca
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    {/* Bench Section - shows arrival order */}
                    <TeamSection
                        teamId={0}
                        players={getBenchPlayers()}
                        config={teamConfigs[0]}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        canManage={canManage}
                        selectedPlayerId={selectedPlayerId}
                        onPlayerClick={onPlayerClick}
                        showArrivalOrder={true}
                        viewerId={viewerId}
                        viewerIsSuperAdmin={viewerIsSuperAdmin}
                        matchCreatorId={matchCreatorId}
                    />

                    {/* Teams Loop */}
                    {Array.from({ length: numTeams }, (_, i) => i + 1).map(teamId => (
                        <TeamSection
                            key={teamId}
                            teamId={teamId}
                            players={getTeamPlayers(teamId)}
                            config={teamConfigs[teamId]}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            canManage={canManage}
                            onKitPicker={onKitPicker}
                            onRandomizeKit={onRandomizeKit}
                            selectedPlayerId={selectedPlayerId}
                            onPlayerClick={onPlayerClick}
                            viewerId={viewerId}
                            viewerIsSuperAdmin={viewerIsSuperAdmin}
                            matchCreatorId={matchCreatorId}
                        />
                    ))}
                </div>
            </div>
        </>
    )
}

export default FieldTab
