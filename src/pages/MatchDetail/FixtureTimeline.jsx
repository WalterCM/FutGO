import React, { useState } from 'react'
import { FastForward, Play, GripVertical, CheckCircle2, Circle, Settings2, Trophy } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import TeamBadge from './TeamBadge'

const FixtureTimeline = ({
    matchMode,
    numTeams,
    fixtures = [],
    teamConfigs,
    onStartMatch,
    canManage,
    onUpdateMode,
    onReorder,
    onAddFinals,
    games = []
}) => {
    const [isReordering, setIsReordering] = useState(false)

    const modes = [
        { id: 'liguilla', name: 'Liguilla', icon: '🏆' },
        { id: 'tournament', name: 'Mundialito', icon: '🌎' },
        { id: 'winner_stays', name: 'Ganador Queda', icon: '🔥' },
        { id: 'free', name: 'Libre', icon: '⚽' }
    ]

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
        onReorder(newFixtures)
    }


    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* Modern Mode Selector */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {modes.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => canManage && onUpdateMode(mode.id)}
                        style={{
                            padding: '0.6rem 1rem',
                            borderRadius: '20px',
                            border: matchMode === mode.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                            background: matchMode === mode.id ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                            color: matchMode === mode.id ? 'var(--primary)' : 'var(--text-dim)',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            cursor: canManage ? 'pointer' : 'default',
                            transition: 'all 0.2s ease',
                            fontSize: '0.85rem'
                        }}
                    >
                        <span>{mode.icon}</span>
                        {mode.name}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Settings2 size={18} color="var(--primary)" />
                    <span style={{ fontWeight: 'bold', color: 'var(--text-dim)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Calendario de Encuentros
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {canManage && matchMode === 'tournament' && fixtures.length > 0 &&
                        fixtures.every(f => f.status === 'completed') && !fixtures.some(f => f.id.startsWith('final')) && (
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={onAddFinals}
                                icon={Trophy}
                            >
                                Generar Finales
                            </Button>
                        )}
                    {canManage && fixtures.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsReordering(!isReordering)}
                            style={{ opacity: 0.7 }}
                        >
                            {isReordering ? 'Listo' : 'Reordenar'}
                        </Button>
                    )}
                </div>
            </div>

            {fixtures.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '2.5rem', background: 'rgba(255,255,255,0.02)' }} hover={false}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem', opacity: 0.3 }}>⚽</div>
                    <p style={{ color: 'var(--text-dim)', margin: 0 }}>
                        {matchMode === 'free'
                            ? 'Modo Libre activo. Registra los encuentros manualmente usando el botón de abajo.'
                            : canManage ? 'Selecciona un modo arriba para generar el fixture.' : 'Esperando a que el organizador defina el modo.'}
                    </p>
                </Card>
            ) : (
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                    {fixtures.map((fixture, idx) => (
                        <div
                            key={fixture.id}
                            draggable={canManage && isReordering && fixture.status === 'pending'}
                            onDragStart={(e) => handleDragStart(e, idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, idx)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                borderRadius: '12px',
                                background: fixture.status === 'completed' ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                                border: fixture.status === 'completed' ? '1px solid transparent' : '1px solid var(--border)',
                                opacity: fixture.status === 'completed' ? 0.6 : 1,
                                transition: 'transform 0.2s ease',
                                cursor: isReordering && fixture.status === 'pending' ? 'grab' : 'default'
                            }}
                        >
                            {canManage && isReordering && fixture.status === 'pending' && (
                                <GripVertical size={18} color="var(--text-dim)" />
                            )}

                            <div style={{ flexShrink: 0 }}>
                                {fixture.status === 'completed' ? (
                                    <CheckCircle2 size={20} color="#10b981" />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <Circle size={20} color="var(--primary)" style={{ opacity: 0.5 }} />
                                        {fixture.label && <div style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '2px' }}>{fixture.label.split(' ')[0]}</div>}
                                    </div>
                                )}
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', justifyContent: 'center' }}>
                                    <TeamBadge id={fixture.team1Id} teamConfigs={teamConfigs} />
                                    {fixture.status === 'completed' ? (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem',
                                            borderRadius: '12px', minWidth: '60px', justifyContent: 'center'
                                        }}>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{fixture.score1}</span>
                                            <span style={{ opacity: 0.3 }}>-</span>
                                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{fixture.score2}</span>
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '0.8rem', opacity: 0.4, fontWeight: 'bold' }}>VS</span>
                                    )}
                                    <TeamBadge id={fixture.team2Id} teamConfigs={teamConfigs} />
                                </div>
                                {fixture.label && <div style={{ fontSize: '0.7rem', opacity: 0.6, fontStyle: 'italic' }}>{fixture.label}</div>}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end', minWidth: '80px' }}>
                                {fixture.status === 'pending' && canManage && !isReordering && (
                                    <Button size="sm" onClick={() => onStartMatch(fixture.team1Id, fixture.team2Id, fixture.id)}>
                                        Jugar
                                    </Button>
                                )}
                                {fixture.status === 'completed' && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Fin</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default FixtureTimeline
