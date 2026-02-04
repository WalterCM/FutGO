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
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} /> Asistencia y Pagos
            </h3>

            <Card style={{ marginBottom: '3rem', padding: '1rem' }} hover={false}>
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {sortedEnrollments.map((enrol, index) => {
                        const rank = index + 1
                        const isTitular = rank <= totalNeeded

                        return (
                            <div key={enrol.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{rank}.</span>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '600', color: enrol.is_present ? 'var(--primary)' : 'white' }}>{enrol.player?.full_name}</span>
                                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                                            <div style={{
                                                fontSize: '0.6rem',
                                                padding: '0.1rem 0.3rem',
                                                borderRadius: '3px',
                                                background: isTitular ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                                color: isTitular ? '#10b981' : 'var(--text-dim)',
                                                border: `1px solid ${isTitular ? '#10b981' : 'var(--border)'}`,
                                                fontWeight: 'bold'
                                            }}>
                                                {isTitular ? (enrol.paid ? 'TITULAR' : 'PRIORIDAD') : 'RESERVA'}
                                            </div>
                                            {enrol.paid && <div style={{ fontSize: '0.6rem', color: 'var(--primary)', opacity: 0.8 }}>Pagó: {new Date(enrol.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button
                                        size="sm"
                                        variant={enrol.paid ? 'success' : 'outline'}
                                        onClick={() => onTogglePaid(enrol)}
                                        disabled={match.is_locked || !canManage}
                                        icon={CreditCard}
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
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Card>

            <Card style={{ padding: '1.5rem', border: '1px solid var(--primary)', background: 'rgba(var(--primary-rgb), 0.05)' }} hover={false}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h4 style={{ color: 'var(--primary)', marginBottom: '0.2rem' }}>Resumen de Partido</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Cuota: S/ {suggestedQuota} por crack</p>
                    </div>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>S/ {collected}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Recaudado</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>S/ {cost}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Costo Fijo</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: balance >= 0 ? '#10b981' : 'var(--danger)' }}>
                                S/ {balance}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Balance</div>
                        </div>
                    </div>
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
