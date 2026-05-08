import React, { useState, useEffect } from 'react'
import { X, User, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import TeamBadge from './TeamBadge'
import { getDisplayName } from '../../lib/utils'

const LineupVerificationModal = ({
    show,
    onClose,
    onConfirm,
    fixture,
    teamConfigs,
    enrollments,
    playersPerTeam,
    currentLineup1,
    currentLineup2,
    viewerId,
    viewerIsSuperAdmin,
    matchCreatorId
}) => {
    const [lineup1, setLineup1] = useState([])
    const [lineup2, setLineup2] = useState([])
    const [unassigned, setUnassigned] = useState([])

    useEffect(() => {
        if (show && fixture) {
            const getPlayerInfo = (id) => {
                const e = enrollments.find(env => env.player_id === id)
                return { id, name: getDisplayName(e?.player, viewerId, matchCreatorId, viewerIsSuperAdmin), officialTeam: e?.team_assignment }
            }

            let t1, t2
            if (currentLineup1) {
                t1 = currentLineup1.map(getPlayerInfo)
            } else {
                t1 = enrollments
                    .filter(e => e.team_assignment === fixture.team1Id && e.is_present && e.paid)
                    .map(e => ({ id: e.player_id, name: getDisplayName(e.player, viewerId, matchCreatorId, viewerIsSuperAdmin), officialTeam: fixture.team1Id }))
            }

            if (currentLineup2) {
                t2 = currentLineup2.map(getPlayerInfo)
            } else {
                t2 = enrollments
                    .filter(e => e.team_assignment === fixture.team2Id && e.is_present && e.paid)
                    .map(e => ({ id: e.player_id, name: getDisplayName(e.player, viewerId, matchCreatorId, viewerIsSuperAdmin), officialTeam: fixture.team2Id }))
            }

            const currentLineupIds = [...t1, ...t2].map(p => p.id)
            const bench = enrollments
                .filter(e => e.is_present && e.paid && !currentLineupIds.includes(e.player_id))
                .map(e => ({ id: e.player_id, name: getDisplayName(e.player, viewerId, matchCreatorId, viewerIsSuperAdmin), officialTeam: e.team_assignment }))

            setLineup1(t1)
            setLineup2(t2)
            setUnassigned(bench)
        }
    }, [show, fixture, enrollments, currentLineup1, currentLineup2, viewerId, viewerIsSuperAdmin, matchCreatorId])

    if (!show || !fixture) return null

    const moveToTeam = (playerId, fromTeam, toTeam) => {
        if (fromTeam === 1) {
            const player = lineup1.find(p => p.id === playerId)
            setLineup1(lineup1.filter(p => p.id !== playerId))
            setLineup2([...lineup2, player])
        } else {
            const player = lineup2.find(p => p.id === playerId)
            setLineup2(lineup2.filter(p => p.id !== playerId))
            setLineup1([...lineup1, player])
        }
    }

    const addToTeam = (player, team) => {
        setUnassigned(unassigned.filter(p => p.id !== player.id))
        if (team === 1) {
            setLineup1([...lineup1, player])
        } else {
            setLineup2([...lineup2, player])
        }
    }

    const isUneven = lineup1.length !== lineup2.length
    const isUnderCapacity = lineup1.length < playersPerTeam || lineup2.length < playersPerTeam

    const playerCard = (player, teamNum) => {
        const isLoan = player.officialTeam && player.officialTeam !== (teamNum === 1 ? fixture.team1Id : fixture.team2Id)
        return (
            <div key={player.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.6rem 0.8rem', background: isLoan ? 'rgba(var(--primary-rgb), 0.08)' : 'rgba(255,255,255,0.05)',
                borderRadius: '8px', border: isLoan ? '1px dashed var(--primary)' : '1px solid transparent'
            }}>
                <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={14} style={{ color: 'var(--text-dim)' }} />
                    {player.name}
                    {isLoan && <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold' }}>REFUERZO</span>}
                </span>
                <button
                    onClick={() => moveToTeam(player.id, teamNum, teamNum === 1 ? 2 : 1)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', padding: '0.3rem' }}
                    title={teamNum === 1 ? 'Prestar al otro equipo' : 'Traer al equipo'}
                >
                    {teamNum === 1 ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
                </button>
            </div>
        )
    }

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
                        <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Ajustar Alineaciones</h2>
                        <p style={{ margin: '0.3rem 0 0', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                            Asigna jugadores a cada equipo. Toca → para prestar al otro equipo.
                        </p>
                    </div>
                    <Button variant="ghost" onClick={onClose} icon={X} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <TeamBadge id={fixture.team1Id} teamConfigs={teamConfigs} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {lineup1.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                    Sin jugadores
                                </div>
                            ) : lineup1.map(p => playerCard(p, 1))}
                        </div>
                    </div>

                    <div>
                        <div style={{ marginBottom: '1rem' }}>
                            <TeamBadge id={fixture.team2Id} teamConfigs={teamConfigs} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {lineup2.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                    Sin jugadores
                                </div>
                            ) : lineup2.map(p => playerCard(p, 2))}
                        </div>
                    </div>
                </div>

                {unassigned.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ margin: '0 0 0.8rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                            Sin equipo ({unassigned.length})
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {unassigned.map(player => (
                                <div key={player.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px', border: '1px dashed var(--border)'
                                }}>
                                    <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <User size={14} style={{ color: 'var(--text-dim)' }} />
                                        {player.name}
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button
                                            onClick={() => addToTeam(player, 1)}
                                            style={{ background: 'rgba(var(--primary-rgb), 0.15)', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}
                                        >
                                            Eq 1
                                        </button>
                                        <button
                                            onClick={() => addToTeam(player, 2)}
                                            style={{ background: 'rgba(var(--primary-rgb), 0.15)', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}
                                        >
                                            Eq 2
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
        </div>
    )
}

export default LineupVerificationModal
