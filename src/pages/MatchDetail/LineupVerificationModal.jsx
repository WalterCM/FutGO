import React, { useState, useEffect } from 'react'
import { X, UserPlus, UserMinus, Shield, User, CheckCircle2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import TeamBadge from './TeamBadge'

const LineupVerificationModal = ({
    show,
    onClose,
    onConfirm,
    fixture,
    teamConfigs,
    enrollments,
    playersPerTeam
}) => {
    const [lineup1, setLineup1] = useState([])
    const [lineup2, setLineup2] = useState([])
    const [availablePlayers, setAvailablePlayers] = useState([])
    const [activeTeamSelect, setActiveTeamSelect] = useState(null)

    useEffect(() => {
        if (show && fixture) {
            // Initial lineups based on official team assignments
            const t1 = enrollments
                .filter(e => e.team_assignment === fixture.team1Id && e.is_present && e.paid)
                .map(e => ({ id: e.player_id, name: e.player?.full_name, officialTeam: fixture.team1Id }))

            const t2 = enrollments
                .filter(e => e.team_assignment === fixture.team2Id && e.is_present && e.paid)
                .map(e => ({ id: e.player_id, name: e.player?.full_name, officialTeam: fixture.team2Id }))

            // Available players: everyone present/paid NOT in the current teams
            const currentLineupIds = [...t1, ...t2].map(p => p.id)
            const available = enrollments
                .filter(e => e.is_present && e.paid && !currentLineupIds.includes(e.player_id))
                .map(e => ({ id: e.player_id, name: e.player?.full_name, officialTeam: e.team_assignment }))

            setLineup1(t1)
            setLineup2(t2)
            setAvailablePlayers(available)
        }
    }, [show, fixture, enrollments])

    if (!show || !fixture) return null

    const handleRemove = (playerId, teamNum) => {
        if (teamNum === 1) {
            const player = lineup1.find(p => p.id === playerId)
            setLineup1(lineup1.filter(p => p.id !== playerId))
            setAvailablePlayers([...availablePlayers, player])
        } else {
            const player = lineup2.find(p => p.id === playerId)
            setLineup2(lineup2.filter(p => p.id !== playerId))
            setAvailablePlayers([...availablePlayers, player])
        }
    }

    const handleAdd = (player) => {
        if (activeTeamSelect === 1) {
            setLineup1([...lineup1, player])
        } else {
            setLineup2([...lineup2, player])
        }
        setAvailablePlayers(availablePlayers.filter(p => p.id !== player.id))
        setActiveTeamSelect(null)
    }

    const isUneven = lineup1.length !== lineup2.length
    const isUnderCapacity = lineup1.length < playersPerTeam || lineup2.length < playersPerTeam

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1200,
            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div className="premium-card" style={{
                width: '100%', maxWidth: '600px', padding: '2rem',
                maxHeight: '90vh', overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Verificar Alineaciones</h2>
                        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                            Ajusta los equipos para este encuentro específico.
                        </p>
                    </div>
                    <Button variant="ghost" onClick={onClose} icon={X} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Team 1 */}
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <TeamBadge id={fixture.team1Id} teamConfigs={teamConfigs} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {lineup1.map(player => (
                                <div key={player.id} className="lineup-item" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px', border: player.officialTeam !== fixture.team1Id ? '1px dashed var(--primary)' : '1px solid transparent'
                                }}>
                                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {player.officialTeam !== fixture.team1Id && <Shield size={14} style={{ color: 'var(--primary)' }} title="Refuerzo" />}
                                        {player.name}
                                    </span>
                                    <button onClick={() => handleRemove(player.id, 1)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.6 }}>
                                        <UserMinus size={16} />
                                    </button>
                                </div>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                fullWidth
                                onClick={() => setActiveTeamSelect(1)}
                                icon={UserPlus}
                                style={{ border: '1px dashed var(--border)', marginTop: '0.5rem' }}
                            >
                                Añadir Refuerzo
                            </Button>
                        </div>
                    </div>

                    {/* Team 2 */}
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <TeamBadge id={fixture.team2Id} teamConfigs={teamConfigs} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {lineup2.map(player => (
                                <div key={player.id} className="lineup-item" style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px', border: player.officialTeam !== fixture.team2Id ? '1px dashed var(--primary)' : '1px solid transparent'
                                }}>
                                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {player.officialTeam !== fixture.team2Id && <Shield size={14} style={{ color: 'var(--primary)' }} title="Refuerzo" />}
                                        {player.name}
                                    </span>
                                    <button onClick={() => handleRemove(player.id, 2)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', opacity: 0.6 }}>
                                        <UserMinus size={16} />
                                    </button>
                                </div>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                fullWidth
                                onClick={() => setActiveTeamSelect(2)}
                                icon={UserPlus}
                                style={{ border: '1px dashed var(--border)', marginTop: '0.5rem' }}
                            >
                                Añadir Refuerzo
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Status Alerts */}
                {(isUneven || isUnderCapacity) && (
                    <div style={{
                        padding: '1rem', background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid var(--warning)', borderRadius: '8px',
                        marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--warning)',
                        display: 'flex', gap: '0.8rem'
                    }}>
                        <div style={{ paddingTop: '0.1rem' }}>⚠️</div>
                        <div>
                            {isUneven && <p style={{ margin: 0 }}>Los equipos están desparejos ({lineup1.length} vs {lineup2.length}).</p>}
                            {isUnderCapacity && <p style={{ margin: 0 }}>Los equipos no están completos para un {playersPerTeam}v{playersPerTeam}.</p>}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button variant="outline" fullWidth onClick={onClose}>Cancelar</Button>
                    <Button
                        variant="primary"
                        fullWidth
                        icon={CheckCircle2}
                        onClick={() => onConfirm(lineup1.map(p => p.id), lineup2.map(p => p.id))}
                    >
                        Confirmar e Ir al Marcador
                    </Button>
                </div>
            </div>

            {/* Selection Overlay */}
            {activeTeamSelect && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1300,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div className="premium-card" style={{ width: '100%', maxWidth: '400px', padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Seleccionar Refuerzo</h3>
                            <Button variant="ghost" onClick={() => setActiveTeamSelect(null)} icon={X} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '50vh', overflowY: 'auto' }}>
                            {availablePlayers.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-dim)' }}>No hay jugadores disponibles.</p>
                            ) : availablePlayers.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => handleAdd(player)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.8rem',
                                        padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--border)', borderRadius: '8px',
                                        color: 'white', cursor: 'pointer', textAlign: 'left',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                                >
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-dark)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <User size={16} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '500' }}>{player.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                            {player.officialTeam ? `Equipo ${player.officialTeam}` : 'Sin equipo'}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LineupVerificationModal
