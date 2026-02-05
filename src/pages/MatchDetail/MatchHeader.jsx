import React from 'react'
import { ArrowLeft, Calendar, Clock, MapPin, Phone, Pencil, Shield } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

const MatchHeader = ({
    match,
    onBack,
    enrolledCount,
    totalNeeded,
    isEnrolled,
    onJoin,
    onLeave,
    actionLoading,
    confirmingLeave,
    canManage,
    onEdit
}) => {
    if (!match) return null

    return (
        <>
            <button
                onClick={onBack}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    marginBottom: '1.5rem',
                    fontSize: '1rem'
                }}
            >
                <ArrowLeft size={20} /> Volver
            </button>

            <Card style={{ marginBottom: '2rem' }} hover={false}>
                <div className="match-header-top">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                        <h2 className="match-title">{match.field?.name}</h2>
                        {canManage && !match.is_locked && (
                            <button
                                onClick={onEdit}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', opacity: 0.7, padding: '0.5rem 0' }}
                                title="Editar detalles"
                            >
                                <Pencil size={20} />
                            </button>
                        )}
                    </div>

                    <div className="match-status-badge">
                        <div className="player-count-box">
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', lineHeight: 1 }}>
                                {enrolledCount} / {totalNeeded}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Jugadores</div>
                        </div>

                        <div className="action-btn-container">
                            {isEnrolled ? (
                                <Button
                                    onClick={onLeave}
                                    variant={(confirmingLeave || actionLoading === 'leave') ? 'danger' : 'outline-danger'}
                                    size="sm"
                                    style={{ width: '100%', transition: 'none' }}
                                    loading={actionLoading === 'leave'}
                                    disabled={match.is_locked}
                                >
                                    {(confirmingLeave || actionLoading === 'leave') ? '¿Seguro?' : 'Salir'}
                                </Button>
                            ) : (
                                <Button
                                    onClick={onJoin}
                                    size="sm"
                                    style={{ width: '100%' }}
                                    loading={actionLoading === 'join'}
                                    disabled={match.is_locked || enrolledCount >= totalNeeded}
                                >
                                    {enrolledCount >= totalNeeded ? 'Me interesa' : 'Unirme'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '1.5rem -1.5rem', width: 'auto' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--text-dim)', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={18} />
                        <span>{new Date(match.date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={18} /> <span>{match.time.substring(0, 5)} hrs</span>
                    </div>
                    {match.field?.address && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={18} />
                            <span>{match.field.address}</span>
                        </div>
                    )}
                    {match.field?.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={18} />
                            <span>{match.field.phone}</span>
                        </div>
                    )}
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '1.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: 'var(--primary)',
                        fontWeight: '500',
                        fontSize: '0.9rem'
                    }}>
                        {match.creator?.full_name && (
                            <>
                                <Shield size={18} />
                                <span>Administrado por {match.creator.full_name}</span>
                            </>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        {match.field?.google_maps_url && (
                            <a
                                href={match.field.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-primary"
                                style={{
                                    padding: '0.4rem 1rem',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    textDecoration: 'none',
                                    background: 'rgba(var(--primary-rgb), 0.1)',
                                    border: '1px solid var(--primary)',
                                    color: 'var(--primary)'
                                }}
                            >
                                <MapPin size={14} /> Mapa
                            </a>
                        )}
                        {match.field?.phone && (
                            <a
                                href={`tel:${match.field.phone}`}
                                className="btn-primary"
                                style={{
                                    padding: '0.4rem 1rem',
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    textDecoration: 'none',
                                    background: 'rgba(var(--primary-rgb), 0.1)',
                                    border: '1px solid var(--primary)',
                                    color: 'var(--primary)'
                                }}
                            >
                                <Phone size={14} /> Llamar
                            </a>
                        )}
                    </div>
                </div>
            </Card>
        </>
    )
}

export default MatchHeader
