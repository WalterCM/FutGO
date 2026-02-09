import React from 'react'
import { ArrowLeft, Calendar, Clock, MapPin, Phone, Pencil, Shield, Copy, CheckCircle as CheckCircle2, Share2, Users } from 'lucide-react'
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
    hasPaid,
    enrollments
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

    const handleShare = () => {
        const dateStr = new Date(match.date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
        const timeStr = match.time.substring(0, 5)

        let message = `⚽ *Lista para el partido en ${match.field?.name}*\n`
        message += `📅 ${dateStr}\n`
        message += `⏰ ${timeStr} hrs\n\n`

        if (enrollments && enrollments.length > 0) {
            const activeEnrollments = enrollments.filter(e => !e.is_excluded)
            message += `*Jugadores (${activeEnrollments.length}/${totalNeeded}):*\n`
            activeEnrollments.forEach((enrol, index) => {
                const name = getDisplayName(enrol.player || enrol.profiles, viewerId, match.creator_id, viewerIsSuperAdmin)
                message += `${index + 1}. ${name}${enrol.paid ? ' ✅' : ''}\n`
            })
        } else {
            message += `¡Aún no hay jugadores inscritos!\n`
        }

        message += `\n📲 Únete aquí: ${window.location.href}`

        const encodedMessage = encodeURIComponent(message)
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
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
                <div className="match-header-content">
                    <div className="match-header-main">
                        <div className="match-title-row">
                            <h2 className="match-title">{match.field?.name}</h2>
                            <div className="match-header-actions">
                                <button
                                    onClick={handleShare}
                                    className="icon-action-btn"
                                    title="Compartir en WhatsApp"
                                >
                                    <Share2 size={18} />
                                </button>

                                {canManage && !match.is_locked && (
                                    <button
                                        onClick={onEdit}
                                        className="icon-action-btn subtle"
                                        title="Editar detalles"
                                    >
                                        <Pencil size={20} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="match-stats-row">
                            <div className="stat-pill">
                                <Users size={14} />
                                <span>Fútbol {playersPerTeam} • {numTeams} Equipos</span>
                            </div>
                            <div className="stat-pill primary">
                                <span>
                                    {enrolledCount > totalNeeded
                                        ? `${totalNeeded}/${totalNeeded} (+${enrolledCount - totalNeeded})`
                                        : `${enrolledCount}/${totalNeeded}`
                                    } Reservados
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="match-header-side">
                        {isEnrolled ? (
                            <Button
                                onClick={onLeave}
                                variant={(confirmingLeave || actionLoading === 'leave') ? 'danger' : 'outline-danger'}
                                style={{ minWidth: '140px', transition: 'none' }}
                                loading={actionLoading === 'leave'}
                                disabled={match.is_locked}
                            >
                                {(confirmingLeave && actionLoading !== 'leave') ? '¿Confirmar Salir?' :
                                    actionLoading === 'leave' ? 'Saliendo...' : 'Salir del Partido'}
                            </Button>
                        ) : (
                            <Button
                                onClick={onJoin}
                                style={{ minWidth: '140px' }}
                                loading={actionLoading === 'join'}
                                disabled={match.is_locked || enrolledCount >= totalNeeded + playersPerTeam}
                            >
                                {enrolledCount >= totalNeeded + playersPerTeam ? 'Lleno' :
                                    enrolledCount >= totalNeeded ? 'Unirme a Espera' : 'Unirme al Partido'}
                            </Button>
                        )}
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
