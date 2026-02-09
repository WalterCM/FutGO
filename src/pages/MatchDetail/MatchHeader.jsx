import React from 'react'
import { ArrowLeft, Calendar, Clock, MapPin, Phone, Pencil, Shield, Copy, CheckCircle as CheckCircle2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import { getDisplayName } from '../../lib/utils'

const MatchHeader = ({
    match,
    onBack,
    enrolledCount,
    totalNeeded,
    numTeams,
    playersPerTeam,
    isEnrolled,
    onJoin,
    onLeave,
    actionLoading,
    confirmingLeave,
    canManage,
    onEdit,
    viewerId,
    viewerIsSuperAdmin,
    hasPaid
}) => {
    const [copied, setCopied] = React.useState(false)

    if (!match) return null

    const showPaymentInfo = match.creator?.phone && !hasPaid

    const handleCopyPhone = () => {
        if (!match.creator?.phone) return
        navigator.clipboard.writeText(match.creator.phone)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

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
                    <div className="match-header-title-container">
                        <h2 className="match-title">{match.field?.name}</h2>
                        {canManage && !match.is_locked && (
                            <button
                                onClick={onEdit}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    cursor: 'pointer',
                                    opacity: 0.7,
                                    padding: '0.3rem 0',
                                    flexShrink: 0
                                }}
                                title="Editar detalles"
                            >
                                <Pencil size={20} />
                            </button>
                        )}
                    </div>

                    <div className="match-status-badge">
                        <div className="player-count-box">
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', lineHeight: 1 }}>
                                {enrolledCount > totalNeeded
                                    ? `${totalNeeded} / ${totalNeeded} (+${enrolledCount - totalNeeded})`
                                    : `${enrolledCount} / ${totalNeeded}`
                                }
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Jugadores</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', opacity: 0.8, marginTop: '0.4rem', fontWeight: 'bold' }}>
                                Fútbol {playersPerTeam} • {numTeams} Equipos
                            </div>
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
                                    disabled={match.is_locked || enrolledCount >= totalNeeded + playersPerTeam}
                                >
                                    {enrolledCount >= totalNeeded + playersPerTeam ? 'Lleno' :
                                        enrolledCount >= totalNeeded ? 'Unirme a Espera' : 'Unirme'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border)', margin: '1.5rem -1.5rem', width: 'auto' }} />

                <div className="match-info-list">
                    <div className="info-item">
                        <Calendar size={18} />
                        <span>{new Date(match.date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="info-item">
                        <Clock size={18} /> <span>{match.time.substring(0, 5)} hrs</span>
                    </div>
                    {match.field?.address && (
                        <div className="info-item-with-action">
                            <div className="info-item">
                                <MapPin size={18} />
                                <span className="text-truncate">{match.field.address}</span>
                            </div>
                            {match.field?.google_maps_url && (
                                <a
                                    href={match.field.google_maps_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="info-action-link"
                                >
                                    <MapPin size={14} /> Mapa
                                </a>
                            )}
                        </div>
                    )}
                    {canManage && match.field?.phone && (
                        <div className="info-item-with-action">
                            <div className="info-item">
                                <Phone size={18} />
                                <span>{match.field.phone}</span>
                            </div>
                            <a
                                href={`tel:${match.field.phone}`}
                                className="info-action-link"
                            >
                                <Phone size={14} /> Llamar
                            </a>
                        </div>
                    )}
                </div>

                {showPaymentInfo && (
                    <div className="payment-info-box">
                        <div style={{ fontSize: '0.65rem', color: 'var(--primary)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            <Shield size={12} /> Información de Pago (Yape/Plin)
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', letterSpacing: '0.5px' }}>{match.creator.phone}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>A nombre de: <span style={{ color: 'var(--text-main)' }}>{match.creator.full_name}</span></div>
                            </div>
                            <Button
                                size="sm"
                                variant={copied ? 'success' : 'outline'}
                                onClick={handleCopyPhone}
                                icon={copied ? CheckCircle2 : Copy}
                                style={{ padding: '0.5rem 1rem', minWidth: '100px', borderRadius: '10px' }}
                            >
                                {copied ? 'Copiado' : 'Copiar'}
                            </Button>
                        </div>
                        <div style={{ marginTop: '1rem', padding: '0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', gap: '0.4rem', alignItems: 'flex-start', margin: 0, lineHeight: '1.4' }}>
                                <span>💡</span> <span>Paga y envía el comprobante al organizador para asegurar tu lugar en la lista de titulares.</span>
                            </p>
                        </div>
                    </div>
                )}

                {!showPaymentInfo && (
                    <div className="match-header-footer" style={{ borderTop: '1px solid var(--border)', marginTop: '1.5rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            color: 'var(--primary)',
                            fontWeight: '500',
                            fontSize: '0.9rem'
                        }}>
                            <Shield size={18} />
                            <span>Administrado por {getDisplayName(match.creator, viewerId, match.creator_id, viewerIsSuperAdmin)}</span>
                        </div>
                    </div>
                )}
            </Card>
        </>
    )
}

export default MatchHeader
