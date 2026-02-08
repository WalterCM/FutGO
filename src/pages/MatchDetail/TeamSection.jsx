import React from 'react'
import { Palette, Dices } from 'lucide-react'
import PlayerCard from './PlayerCard'

const TeamSection = ({
    teamId,
    players,
    config,
    onDragOver,
    onDrop,
    canManage,
    onKitPicker,
    onRandomizeKit,
    selectedPlayerId,
    onPlayerClick,
    showArrivalOrder = false,
    viewerId,
    viewerIsSuperAdmin,
    matchCreatorId
}) => {
    return (
        <div
            onDragOver={canManage ? onDragOver : null}
            onDrop={canManage ? (e) => onDrop(e, teamId) : null}
            style={{
                minHeight: '200px',
                padding: '1rem',
                borderRadius: '16px',
                background: teamId === 0 ? 'rgba(255,255,255,0.02)' : `linear-gradient(rgba(10, 14, 20, 0.7), rgba(10, 14, 20, 0.7)), ${config.bg}`,
                border: teamId === 0 ? '1px dashed var(--border)' : `2px solid ${config.color}`,
                boxShadow: teamId === 0 ? 'none' : `0 10px 30px -10px ${config.color}40`,
                transition: 'all 0.3s ease'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.2rem',
                background: teamId === 0 ? 'transparent' : config.bg,
                padding: teamId === 0 ? '0' : '0.8rem 1.2rem',
                borderRadius: '12px',
                border: teamId === 0 ? 'none' : `3px solid ${config.color}`,
                boxShadow: teamId === 0 ? 'none' : '0 8px 20px rgba(0,0,0,0.4)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <h4 style={{
                    margin: 0,
                    color: config.color,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.8rem',
                    letterSpacing: '1px',
                    fontWeight: '900',
                    textTransform: 'uppercase',
                    fontSize: '0.9rem',
                    textShadow: 'none' // Clean contrast from kit colors
                }}>
                    {config.name}
                    <span style={{ fontSize: '0.8rem', opacity: 0.6, fontWeight: 'normal' }}>({players.length})</span>
                </h4>

                {teamId !== 0 && canManage && (
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                            onClick={() => onKitPicker(teamId)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                                color: config.color,
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Cambiar Camiseta"
                        >
                            <Palette size={14} style={{ opacity: 0.8 }} />
                        </button>
                        <button
                            onClick={() => onRandomizeKit(teamId)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px',
                                borderRadius: '4px',
                                color: config.color,
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            title="Aleatorio"
                        >
                            <Dices size={14} style={{ opacity: 0.8 }} />
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gap: '0.6rem' }}>
                {players.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem 1rem',
                        color: 'var(--text-dim)',
                        fontSize: '0.8rem',
                        border: '1px dashed var(--border)',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.01)'
                    }}>
                        Vacío
                    </div>
                ) : (
                    players.map((p, index) => (
                        <PlayerCard
                            key={p.id}
                            registration={p}
                            isSelected={selectedPlayerId === p.id}
                            isBench={teamId === 0}
                            config={config}
                            arrivalOrder={showArrivalOrder ? index + 1 : null}
                            onClick={() => onPlayerClick(p.id, teamId)}
                            onDragStart={canManage ? (e) => {
                                e.dataTransfer.setData('enrolId', p.id)
                            } : null}
                            viewerId={viewerId}
                            viewerIsSuperAdmin={viewerIsSuperAdmin}
                            matchCreatorId={matchCreatorId}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

export default TeamSection
