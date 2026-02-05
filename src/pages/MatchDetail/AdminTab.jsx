import React from 'react'
import { CheckCircle, CreditCard, Users } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const AdminTab = ({
    enrollments,
    totalNeeded,
    suggestedQuota,
    match,
    canManage,
    onTogglePaid,
    onTogglePresent,
    onExpand,
    onShrink,
    onCancel,
    actionLoading,
    numTeams,
    getOrdinal
}) => {
    const sortedEnrollments = [...enrollments].sort((a, b) => {
        if (a.paid && !b.paid) return -1
        if (!a.paid && b.paid) return 1
        if (a.paid && b.paid) return new Date(a.paid_at) - new Date(b.paid_at)
        return new Date(a.created_at) - new Date(b.created_at)
    })

    const collected = enrollments.filter(e => e.paid).length * suggestedQuota
    const cost = match.fixed_cost || 120
    const balance = collected - cost

    return (
        <>
            {/* 1. Estado de la Caja (NUEVO - Posición Superior) */}
            <Card style={{
                marginBottom: '2rem',
                padding: '1.5rem',
                border: `1px solid ${balance >= 0 ? '#10b981' : 'var(--primary)'}`,
                background: balance >= 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(var(--primary-rgb), 0.05)'
            }} hover={false}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h4 style={{ color: balance >= 0 ? '#10b981' : 'var(--primary)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <CreditCard size={18} /> Estado de la Caja
                            </h4>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold' }}>
                                {balance < 0 ? (
                                    <>Faltan <span style={{ color: 'var(--danger)' }}>S/ {Math.abs(balance)}</span></>
                                ) : (
                                    <span style={{ color: '#10b981' }}>¡Cancha Cubierta!</span>
                                )}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Cuota: S/ {suggestedQuota}</div>
                            {balance > 0 && <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>Sobra: S/ {balance}</div>}
                        </div>
                    </div>

                    {/* Barra de Progreso */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${Math.min(100, (collected / cost) * 100)}%`,
                            height: '100%',
                            background: balance >= 0 ? '#10b981' : 'var(--primary)',
                            transition: 'width 0.4s ease-out'
                        }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        <span>Recaudado: S/ {collected}</span>
                        <span>Meta: S/ {cost}</span>
                    </div>
                </div>
            </Card>

            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} /> Asistencia y Pagos
            </h3>

            <Card style={{ marginBottom: '3rem', padding: '1rem' }} hover={false}>
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {sortedEnrollments.map((enrol, index) => {
                        const rank = index + 1
                        const isTitular = rank <= totalNeeded

                        // Simplest logic: Only Paid = Fixed Status. No pay = No tag.
                        let tagLabel = null
                        let tagColor = ''
                        let tagBg = ''
                        let tagBorder = ''

                        if (enrol.paid) {
                            if (isTitular) {
                                tagLabel = 'TITULAR'
                                tagColor = '#10b981'
                                tagBg = 'rgba(16, 185, 129, 15%)'
                                tagBorder = '#10b981'
                            } else {
                                tagLabel = 'RESERVA'
                                tagColor = 'var(--text-dim)'
                                tagBg = 'rgba(255, 255, 255, 0.05)'
                                tagBorder = 'var(--border)'
                            }
                        }

                        return (
                            <div key={enrol.id} className="admin-player-row">
                                <div className="admin-player-info">
                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{rank}.</span>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: enrol.is_present ? 'var(--primary)' : 'white' }}>{enrol.player?.full_name}</span>
                                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                                            {tagLabel && (
                                                <div style={{
                                                    fontSize: '0.6rem',
                                                    padding: '0.1rem 0.3rem',
                                                    borderRadius: '3px',
                                                    background: tagBg,
                                                    color: tagColor,
                                                    border: `1px solid ${tagBorder}`,
                                                    fontWeight: 'bold'
                                                }}>
                                                    {tagLabel}
                                                </div>
                                            )}
                                            {enrol.paid && <div style={{ fontSize: '0.6rem', color: 'var(--primary)', opacity: 0.8 }}>Pagó: {new Date(enrol.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div className="admin-player-actions">
                                    {canManage ? (
                                        <>
                                            <Button
                                                size="sm"
                                                variant={enrol.paid ? 'success' : 'outline'}
                                                onClick={() => onTogglePaid(enrol)}
                                                disabled={match.is_locked || !canManage}
                                                icon={CreditCard}
                                                style={{ transition: 'none' }}
                                            >
                                                {enrol.paid ? 'Pagado' : 'Cobrar'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={enrol.is_present ? 'primary' : 'outline'}
                                                onClick={() => onTogglePresent(enrol)}
                                                disabled={match.is_locked || !canManage || (!enrol.paid && !enrol.is_present)}
                                                icon={Users}
                                            >
                                                {enrol.is_present ? 'Presente' : 'Ausente'}
                                            </Button>
                                        </>
                                    ) : (
                                        enrol.is_present && (
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--primary)',
                                                padding: '0.2rem 0.6rem',
                                                background: 'rgba(var(--primary-rgb), 0.1)',
                                                borderRadius: '30px',
                                                fontWeight: 'bold',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                                border: '1px solid rgba(var(--primary-rgb), 0.2)'
                                            }}>
                                                <Users size={12} /> PRESENTE
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>

            {canManage && !match.is_locked && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    {numTeams < 6 && (
                        <Button
                            variant="outline"
                            onClick={onExpand}
                            style={{ flex: 1 }}
                            loading={actionLoading === 'capacity'}
                        >
                            Habilitar {getOrdinal(numTeams + 1)} Equipo
                        </Button>
                    )}
                    {numTeams > 2 && (
                        <Button
                            variant="outline-danger"
                            onClick={onShrink}
                            style={{ flex: 1 }}
                            loading={actionLoading === 'capacity'}
                        >
                            Quitar Equipo
                        </Button>
                    )}
                    <Button
                        variant="outline-danger"
                        onClick={onCancel}
                        style={{ flex: 1 }}
                        loading={actionLoading === 'canceling'}
                    >
                        Cancelar Partido
                    </Button>
                </div>
            )}

            {match.is_locked && (
                <Card style={{ marginTop: '2rem', textAlign: 'center', border: `1px solid ${match.is_canceled ? 'var(--danger)' : '#10b981'}`, background: match.is_canceled ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)' }} hover={false}>
                    <h4 style={{ color: match.is_canceled ? 'var(--danger)' : '#10b981' }}>
                        {match.is_canceled ? '✕ Partido Cancelado' : '✓ Partido Finalizado'}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {match.is_canceled ? 'El partido fue cancelado y los saldos devueltos.' : 'La caja ha sido cerrada y los saldos repartidos.'}
                    </p>
                </Card>
            )}
        </>
    )
}

export default AdminTab
