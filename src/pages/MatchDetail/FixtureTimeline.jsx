import React, { useState } from 'react'
import { GripVertical, CheckCircle2, Settings2, PlusCircle, Plus, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import ManualFixtureModal from './ManualFixtureModal'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import TeamBadge from './TeamBadge'
import PhaseConfigModal from './PhaseConfigModal'
import ConfirmModal from '../../components/ConfirmModal'

const FixtureTimeline = ({
    matchId,
    phases = [],
    fixtures: rawFixtures = [],
    teamConfigs,
    onStartMatch,
    canManage,
    onAddPhase,
    onRemovePhase,
    onGenerateFixtures,
    onUpdateFixtures,
    onAddManualFixture,
    onResolvePlaceholders,
    numTeams,
    getStandings,
    games = []
}) => {
    const fixtures = Array.isArray(rawFixtures) ? rawFixtures : []
    const [isReordering, setIsReordering] = useState(false)
    const [showConfig, setShowConfig] = useState(false)
    const [manualMatch, setManualMatch] = useState({ show: false, phaseId: null })
    const [expandedStandings, setExpandedStandings] = useState({})
    const [deleteConfirm, setDeleteConfirm] = useState({ show: false, phaseId: null })

    const handleDragStart = (e, index) => {
        if (!canManage) return
        e.dataTransfer.setData('index', index)
    }

    const handleDrop = (e, targetIndex) => {
        if (!canManage) return
        const sourceIndex = e.dataTransfer.getData('index')
        const newFixtures = [...fixtures]
        const [moved] = newFixtures.splice(sourceIndex, 1)
        newFixtures.splice(targetIndex, 0, moved)
        onUpdateFixtures(newFixtures)
    }

    const getPhaseFixtures = (phaseId) => {
        return fixtures.filter(f => f.phaseId === phaseId || (!phaseId && !f.phaseId))
    }

    // Check if there's a liguilla phase (for standings-based elimination)
    const hasPreviousLiguilla = phases.some(p => p.type === 'liguilla')

    // Get global standings (all liguilla phases) for PhaseConfigModal
    const globalStandings = getStandings ? getStandings() : []

    const toggleStandings = (phaseId) => {
        setExpandedStandings(prev => ({
            ...prev,
            [phaseId]: !prev[phaseId]
        }))
    }

    const getPhaseIcon = (type) => {
        if (type === 'liguilla') return '🏆'
        if (type?.startsWith('tournament')) return '⚔️'
        if (type === 'winner_stays') return '🔥'
        return '⚽'
    }

    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* Header with Phase Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings2 size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 'bold', color: 'var(--text-dim)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Arquitectura del Torneo
                    </span>
                </div>

                {canManage && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button
                            variant="primary"
                            size="sm"
                            icon={PlusCircle}
                            onClick={() => setShowConfig(true)}
                        >
                            Añadir Fase
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={isReordering ? CheckCircle2 : GripVertical}
                            onClick={() => setIsReordering(!isReordering)}
                            style={{ opacity: isReordering ? 1 : 0.6 }}
                        >
                            {isReordering ? 'Listo' : 'Reordenar'}
                        </Button>
                    </div>
                )}
            </div>

            {/* Render Phases */}
            <div style={{ display: 'grid', gap: '2rem' }}>
                {phases.length === 0 && fixtures.length === 0 ? (
                    <Card style={{ textAlign: 'center', padding: '3rem 2rem', border: '1px dashed var(--border)', background: 'transparent' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.2 }}>🏗️</div>
                        <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>Torneo Vacío</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Comienza añadiendo la primera fase de tu torneo (Liguilla, Eliminación, etc.)
                        </p>
                        <Button variant="primary" icon={PlusCircle} onClick={() => setShowConfig(true)}>
                            Crear Primera Fase
                        </Button>
                    </Card>
                ) : (
                    <>
                        {/* Fallback for legacy fixtures without phaseId */}
                        {getPhaseFixtures(null).length > 0 && (
                            <Card style={{ border: '1px solid #ffd70033', padding: '1rem', background: 'rgba(255, 215, 0, 0.02)' }}>
                                <div style={{ marginBottom: '1rem', borderBottom: '1px solid #ffd70044', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                    <h4 style={{ margin: 0, color: '#ffd700', fontSize: '0.8rem', textTransform: 'uppercase' }}>Encuentros Sin Clasificar</h4>
                                    <span style={{ fontSize: '0.6rem', color: '#ffd700', opacity: 0.7 }}>Legacy Data</span>
                                </div>
                                <div style={{ display: 'grid', gap: '0.6rem' }}>
                                    {getPhaseFixtures(null).map(f => (
                                        <div key={f.id} style={{
                                            display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.8rem',
                                            background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,215,0,0.1)'
                                        }}>
                                            <TeamBadge id={f.team1Id} teamConfigs={teamConfigs} />
                                            <span style={{ fontSize: '0.8rem', opacity: 0.3 }}>VS</span>
                                            <TeamBadge id={f.team2Id} teamConfigs={teamConfigs} />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )}

                        {phases.map((phase) => {
                            const phaseFixtures = getPhaseFixtures(phase.id)
                            const isGenerated = phaseFixtures.length > 0
                            const isLiguilla = phase.type === 'liguilla'
                            // Get standings for THIS specific phase
                            const standings = isLiguilla && getStandings ? getStandings(phase.id) : []
                            const showStandingsButton = isLiguilla && standings.length > 0
                            const hasUnresolvedPlaceholders = phaseFixtures.some(f =>
                                (f.placeholder1 && !f.team1Id) || (f.placeholder2 && !f.team2Id)
                            )

                            return (
                                <Card key={phase.id} style={{ padding: '0', background: 'transparent', border: 'none' }} hover={false}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        marginBottom: '1.2rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <div style={{
                                                background: 'rgba(var(--primary-rgb), 0.2)', padding: '0.4rem',
                                                borderRadius: '8px', color: 'var(--primary)', width: '32px', height: '32px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                                {getPhaseIcon(phase.type)}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>
                                                    {phase.name}
                                                </h4>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                                                    {phase.type.replace(/_/g, ' ')} • {phaseFixtures.length} encuentros
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {showStandingsButton && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={expandedStandings[phase.id] ? ChevronUp : BarChart3}
                                                    onClick={() => toggleStandings(phase.id)}
                                                    style={{ color: '#3b82f6' }}
                                                >
                                                    Tabla
                                                </Button>
                                            )}
                                            {canManage && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    icon={Plus}
                                                    onClick={() => setManualMatch({ show: true, phaseId: phase.id })}
                                                >
                                                    Encuentro
                                                </Button>
                                            )}
                                            {!isGenerated && canManage && (
                                                <Button variant="primary" size="sm" onClick={() => onGenerateFixtures(phase.id)}>
                                                    Generar
                                                </Button>
                                            )}
                                            {canManage && phase.type?.startsWith('tournament') && hasUnresolvedPlaceholders && standings.length > 0 && onResolvePlaceholders && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onResolvePlaceholders()}
                                                    style={{ color: '#10b981', borderColor: '#10b981' }}
                                                >
                                                    Actualizar Cruces
                                                </Button>
                                            )}
                                            {canManage && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    style={{ color: '#ef4444', opacity: 0.6 }}
                                                    onClick={() => setDeleteConfirm({ show: true, phaseId: phase.id })}
                                                >
                                                    Eliminar
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Standings Table (collapsible) */}
                                    {expandedStandings[phase.id] && standings.length > 0 && (
                                        <div style={{
                                            background: 'rgba(59, 130, 246, 0.05)',
                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            marginBottom: '1rem'
                                        }}>
                                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                                <div style={{
                                                    display: 'grid', gridTemplateColumns: '30px 1fr repeat(4, 40px)',
                                                    fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase',
                                                    fontWeight: 'bold', padding: '0 0.5rem'
                                                }}>
                                                    <span>#</span>
                                                    <span>Equipo</span>
                                                    <span style={{ textAlign: 'center' }}>PJ</span>
                                                    <span style={{ textAlign: 'center' }}>G</span>
                                                    <span style={{ textAlign: 'center' }}>DG</span>
                                                    <span style={{ textAlign: 'center' }}>Pts</span>
                                                </div>
                                                {standings.map((team, idx) => (
                                                    <div key={team.teamId} style={{
                                                        display: 'grid', gridTemplateColumns: '30px 1fr repeat(4, 40px)',
                                                        fontSize: '0.8rem', padding: '0.5rem',
                                                        background: idx < 4 ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                                        borderRadius: '6px'
                                                    }}>
                                                        <span style={{ color: idx < 4 ? '#10b981' : 'var(--text-dim)', fontWeight: 'bold' }}>{idx + 1}º</span>
                                                        <TeamBadge id={team.teamId} teamConfigs={teamConfigs} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }} />
                                                        <span style={{ textAlign: 'center', color: 'var(--text-dim)' }}>{team.played}</span>
                                                        <span style={{ textAlign: 'center', color: 'var(--text-dim)' }}>{team.wins}</span>
                                                        <span style={{ textAlign: 'center', color: team.goalDiff > 0 ? '#10b981' : team.goalDiff < 0 ? '#ef4444' : 'var(--text-dim)' }}>
                                                            {team.goalDiff > 0 ? '+' : ''}{team.goalDiff}
                                                        </span>
                                                        <span style={{ textAlign: 'center', fontWeight: 'bold', color: 'white' }}>{team.points}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gap: '0.6rem' }}>
                                        {phaseFixtures.map((fixture) => {
                                            const globalIdx = fixtures.findIndex(f => f.id === fixture.id)
                                            return (
                                                <div
                                                    key={fixture.id}
                                                    draggable={canManage && isReordering}
                                                    onDragStart={(e) => handleDragStart(e, globalIdx)}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => handleDrop(e, globalIdx)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem',
                                                        borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
                                                        border: '1px solid var(--border)',
                                                        opacity: fixture.status === 'completed' ? 0.6 : 1,
                                                        cursor: isReordering ? 'grab' : 'default'
                                                    }}
                                                >
                                                    {isReordering && <GripVertical size={16} color="var(--text-dim)" />}

                                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1.5rem', justifyContent: 'center' }}>
                                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                                                            {fixture.team1Id ? (
                                                                <TeamBadge id={fixture.team1Id} teamConfigs={teamConfigs} />
                                                            ) : (
                                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                                                                    {fixture.placeholder1 || 'Por Definir'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ minWidth: '80px', textAlign: 'center' }}>
                                                            {fixture.status === 'completed' ? (
                                                                <div style={{
                                                                    fontWeight: 'bold', fontSize: '1.3rem',
                                                                    background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.8rem',
                                                                    borderRadius: '8px'
                                                                }}>
                                                                    {fixture.score1} - {fixture.score2}
                                                                </div>
                                                            ) : (
                                                                <span style={{ fontSize: '0.8rem', opacity: 0.4, fontWeight: 'bold' }}>VS</span>
                                                            )}
                                                        </div>
                                                        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '0.5rem' }}>
                                                            {fixture.team2Id ? (
                                                                <TeamBadge id={fixture.team2Id} teamConfigs={teamConfigs} />
                                                            ) : (
                                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                                                                    {fixture.placeholder2 || 'Por Definir'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div style={{ minWidth: '80px', textAlign: 'right' }}>
                                                        {fixture.status === 'pending' && canManage && !isReordering && fixture.team1Id && fixture.team2Id && (
                                                            <Button size="sm" onClick={() => onStartMatch(fixture.team1Id, fixture.team2Id, fixture.id)}>
                                                                Jugar
                                                            </Button>
                                                        )}
                                                        {fixture.status === 'completed' && <CheckCircle2 size={18} color="#10b981" style={{ marginLeft: 'auto' }} />}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {!isGenerated && (
                                            <div style={{ textAlign: 'center', padding: '1rem', opacity: 0.4, fontSize: '0.85rem' }}>
                                                Esta fase no tiene encuentros generados.
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            )
                        })}
                    </>
                )}
            </div>

            <PhaseConfigModal
                show={showConfig}
                onClose={() => setShowConfig(false)}
                onAdd={onAddPhase}
                standingsCount={globalStandings.length}
                numTeams={numTeams}
                hasPreviousLiguilla={hasPreviousLiguilla}
            />

            <ManualFixtureModal
                show={manualMatch.show}
                onClose={() => setManualMatch({ show: false, phaseId: null })}
                onAdd={onAddManualFixture}
                teamConfigs={teamConfigs}
                numTeams={numTeams}
                phaseId={manualMatch.phaseId}
            />

            <ConfirmModal
                isOpen={deleteConfirm.show}
                onClose={() => setDeleteConfirm({ show: false, phaseId: null })}
                onConfirm={() => onRemovePhase(deleteConfirm.phaseId)}
                title="Eliminar Fase"
                message="¿Eliminar esta fase y todos sus partidos? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                variant="danger"
            />
        </div>
    )
}

export default FixtureTimeline
