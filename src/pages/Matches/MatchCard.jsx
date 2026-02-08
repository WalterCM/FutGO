import React from 'react'
import { Calendar, Clock, Users, Trash2, LogOut, Loader2, Pencil, Shield } from 'lucide-react'
import Button from '../../components/ui/Button'
import { getDisplayName } from '../../lib/utils'

export default function MatchCard({
    match,
    profile,
    onMatchClick,
    onEdit,
    onDelete,
    onJoin,
    onLeave,
    actionLoading,
    confirmingLeaveId
}) {
    const enrolledCount = match.enrollments?.length || 0
    const playersPerTeam = match.field?.players_per_team || 5
    const rawTotal = match.max_players || (playersPerTeam * 2)
    const numTeams = Math.max(2, Math.round(rawTotal / playersPerTeam))
    const totalNeeded = numTeams * playersPerTeam

    const isAtLimit = enrolledCount >= totalNeeded
    const canJoinWaitlist = enrolledCount < totalNeeded + playersPerTeam
    const isEnrolled = match.enrollments?.some(e => e.player_id === profile.id)

    const canManage = profile?.is_super_admin || (profile?.is_admin && match.creator_id === profile.id)

    return (
        <div
            className="premium-card"
            style={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => onMatchClick(match)}
        >
            {canManage && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit(match)
                        }}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                        title="Editar"
                    >
                        <Pencil size={18} />
                    </button>
                    {profile?.is_super_admin && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete(match.id)
                            }}
                            style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                            title="Eliminar"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
                <h3 style={{
                    color: match.is_canceled ? 'var(--text-dim)' : 'var(--primary)',
                    marginBottom: '0.2rem',
                    textDecoration: match.is_canceled ? 'line-through' : 'none',
                    paddingRight: canManage ? '3rem' : '0'
                }}>
                    {match.field?.name}
                </h3>
                <span style={{
                    fontSize: '0.7rem',
                    color: match.is_canceled ? 'var(--danger)' : (isEnrolled ? '#10b981' : (isAtLimit ? '#f59e0b' : 'var(--primary)')),
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                }}>
                    {match.is_canceled ? 'Partido Cancelado ✕' : (isEnrolled ? 'Estás Inscrito ✅' : (isAtLimit ? 'Completos (Lista de Espera) 🕒' : 'Inscripciones Abiertas'))}
                </span>
            </div>

            <div style={{ display: 'grid', gap: '0.8rem', marginBottom: '1.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} /> {new Date(match.date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} /> {match.time.substring(0, 5)} hrs
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={16} />
                    <span>
                        {enrolledCount > totalNeeded
                            ? `${totalNeeded} / ${totalNeeded} (+${enrolledCount - totalNeeded} en espera)`
                            : `${enrolledCount} / ${totalNeeded}`
                        } jugadores • Fútbol {playersPerTeam} • {numTeams} equipos
                    </span>
                </div>
                {match.creator?.full_name && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '500' }}>
                        <Shield size={16} /> Administrado por {getDisplayName(match.creator, profile?.id, match.creator_id, profile?.is_super_admin)}
                    </div>
                )}
            </div>

            <div style={{ marginTop: 'auto' }}>
                {isEnrolled ? (
                    <Button
                        onClick={(e) => {
                            e.stopPropagation()
                            onLeave(match.id)
                        }}
                        disabled={actionLoading === match.id || match.is_locked}
                        variant={confirmingLeaveId === match.id ? 'danger' : 'outline-danger'}
                        style={{ width: '100%' }}
                        loading={actionLoading === match.id}
                    >
                        {confirmingLeaveId === match.id ? '¿Estás seguro?' : <><LogOut size={18} style={{ marginRight: '0.5rem' }} /> Salir del Partido</>}
                    </Button>
                ) : (
                    <Button
                        onClick={(e) => {
                            e.stopPropagation()
                            onJoin(match.id)
                        }}
                        disabled={!canJoinWaitlist || actionLoading === match.id || match.is_locked}
                        variant="primary"
                        style={{ width: '100%', opacity: (!canJoinWaitlist || match.is_locked) ? 0.5 : 1 }}
                        loading={actionLoading === match.id}
                    >
                        {match.is_canceled ? 'Partido Cerrado' : (isAtLimit ? 'Unirme a Lista de Espera' : 'Unirme al Partido')}
                    </Button>
                )}
            </div>
        </div>
    )
}
