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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                            <h2 style={{ color: 'var(--primary)', fontSize: '2rem', margin: 0 }}>{match.field?.name}</h2>
                            {canManage && !match.is_locked && (
                                <button
                                    onClick={onEdit}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', opacity: 0.7 }}
                                    title="Editar detalles"
                                >
                                    <Pencil size={20} />
                                </button>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'var(--text-dim)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Calendar size={18} />
                                {new Date(match.date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Clock size={18} /> {match.time.substring(0, 5)} hrs
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {enrolledCount} / {totalNeeded}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>Jugadores</div>

                        {isEnrolled ? (
                            <Button
                                onClick={onLeave}
                                variant={confirmingLeave ? 'danger' : 'outline-danger'}
                                size="sm"
                                style={{ width: '100%' }}
                                loading={actionLoading === 'leave'}
                                disabled={match.is_locked}
                            >
                                {confirmingLeave ? '¿Seguro?' : 'Salir'}
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

                {match.field?.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                        <MapPin size={18} />
                        {match.field.address.startsWith('http') ? (
                            <a href={match.field.address} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                Ver en Google Maps
                            </a>
                        ) : (
                            match.field.address
                        )}
                    </div>
                )}

                {match.field?.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: match.creator?.full_name ? '1rem' : '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)' }}>
                            <Phone size={18} />
                            {match.field.phone}
                        </div>
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
                                color: 'var(--bg-dark)'
                            }}
                        >
                            <Phone size={14} /> Llamar a Cancha
                        </a>
                    </div>
                )}

                {match.creator?.full_name && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: 'var(--primary)',
                        fontWeight: '500',
                        fontSize: '0.9rem',
                        paddingTop: '1rem',
                        borderTop: '1px solid var(--border)'
                    }}>
                        <Shield size={18} /> Administrado por {match.creator.full_name}
                    </div>
                )}
            </Card>
        </>
    )
}

export default MatchHeader
