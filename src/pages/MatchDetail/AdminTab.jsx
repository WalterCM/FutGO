/**
 * AdminTab - Match Day Administration Panel
 * 
 * BUSINESS LOGIC DOCUMENTATION:
 * 
 * 1. PAYMENT = SPOT (CUPO)
 *    - Players sign up to show interest, but PAYMENT confirms their spot
 *    - Paying first wins the "titular" position (first-come-first-served by payment)
 *    - Non-payers remain as "interested" but have no guaranteed spot
 * 
 * 2. TITULAR vs RESERVA
 *    - TITULAR: Paid players within the team capacity (first N paid players)
 *    - RESERVA: Paid players beyond capacity (backup players)
 *    - Reserves are called ONLY if a titular gives advance notice they can't come
 *    - If someone no-shows without notice, reserves won't have been called
 * 
 * 3. NO REFUNDS FOR NO-SHOWS
 *    - If a player pays but doesn't show up, NO REFUND is given
 *    - The field was still used, other players shouldn't compensate for no-shows
 *    - The only "refund" is being removed BEFORE the match (with advance notice)
 *    - Removing a player before the match = unpaid status = they lose their spot
 * 
 * 4. PRESENCE (is_present)
 *    - Used for FIELD CHECK-IN only (who actually showed up)
 *    - Not related to reserves - presence is tracked at match time
 *    - No-shows (paid + not present) keep their payment but didn't play
 * 
 * 5. NO ON-SITE PAYMENTS
 *    - Payment must be confirmed BEFORE the match
 *    - Avoid "I'll pay you later" scenarios - they often don't pay
 *    - Presence toggle requires payment first for this reason
 * 
 * 6. FIXED QUOTA
 *    - Each player pays the same fixed amount (quota)
 *    - If extra money is collected, admin can distribute surplus or save it
 *    - Simple operations: everyone knows what they owe upfront
 * 
 * 7. PLAYER EXCLUSION (is_excluded)
 *    - Only UNPAID players can be excluded/withdrawn
 *    - Paid players cannot be removed (they already paid for their spot)
 *    - Exclusion is logical (not physical delete) - prevents re-signup
 *    - Admin can restore excluded players if needed
 *    - Shows "RETIRADO" tag for excluded players
 * 
 * 8. CONFIRMATION MODALS FOR SENSITIVE ACTIONS
 *    - Removing payment (Pagado -> Cobrar): requires confirmation
 *    - Marking absent (Presente -> Ausente): requires confirmation
 *    - Excluding player (Retirar): requires confirmation
 *    - POSITIVE actions (adding payment, marking present) don't need confirmation
 *    - This prevents accidental data loss from misclicks
 */

import React, { useState } from 'react'
import { CheckCircle, CreditCard, Users, UserMinus, UserPlus } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { getDisplayName } from '../../lib/utils'

const AdminTab = ({
    enrollments,
    totalNeeded,
    suggestedQuota,
    match,
    canManage,
    onTogglePaid,
    onTogglePresent,
    onRemovePlayer,  // Handler to exclude a player (logical removal)
    onRestorePlayer, // Handler to restore an excluded player
    onExpand,
    onShrink,
    onCancel,
    actionLoading,
    numTeams,
    getOrdinal
}) => {
    // Modal state for removal confirmation
    const [removeConfirm, setRemoveConfirm] = useState({ show: false, enrol: null })
    // Modal state for unpaid confirmation (removing payment)
    const [unpaidConfirm, setUnpaidConfirm] = useState({ show: false, enrol: null })
    // Modal state for absent confirmation (marking as not present)
    const [absentConfirm, setAbsentConfirm] = useState({ show: false, enrol: null })

    // Titulares are the first N players who PAID (by paid_at time)
    // Reserves are players who PAID after the quota was filled
    // Interested are players who haven't paid yet
    const paidEnrollments = enrollments
        .filter(e => e.paid && !e.is_excluded)
        .sort((a, b) => new Date(a.paid_at) - new Date(b.paid_at))

    const unpaidEnrollments = enrollments
        .filter(e => !e.paid && !e.is_excluded)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    const excludedEnrollments = enrollments
        .filter(e => e.is_excluded)

    const sortedEnrollments = [...paidEnrollments, ...unpaidEnrollments, ...excludedEnrollments]

    // Handle removal with confirmation
    const handleRemoveClick = (enrol) => {
        setRemoveConfirm({ show: true, enrol })
    }

    const handleConfirmRemove = () => {
        if (removeConfirm.enrol && onRemovePlayer) {
            onRemovePlayer(removeConfirm.enrol)
        }
        setRemoveConfirm({ show: false, enrol: null })
    }

    // Handle payment toggle - if already paid, confirm before removing payment
    const handlePaymentClick = (enrol) => {
        if (enrol.paid) {
            // Removing payment requires confirmation
            setUnpaidConfirm({ show: true, enrol })
        } else {
            // Adding payment doesn't need confirmation
            onTogglePaid(enrol)
        }
    }

    const handleConfirmUnpaid = () => {
        if (unpaidConfirm.enrol && onTogglePaid) {
            onTogglePaid(unpaidConfirm.enrol)
        }
        setUnpaidConfirm({ show: false, enrol: null })
    }

    // Handle presence toggle - if already present, confirm before marking absent
    const handlePresenceClick = (enrol) => {
        if (enrol.is_present) {
            // Marking absent requires confirmation
            setAbsentConfirm({ show: true, enrol })
        } else {
            // Marking present doesn't need confirmation
            onTogglePresent(enrol)
        }
    }

    const handleConfirmAbsent = () => {
        if (absentConfirm.enrol && onTogglePresent) {
            onTogglePresent(absentConfirm.enrol)
        }
        setAbsentConfirm({ show: false, enrol: null })
    }

    return (
        <>
            {/* Removal confirmation modal */}
            <ConfirmModal
                show={removeConfirm.show}
                title="Retirar Jugador"
                message={`¿Estás seguro de retirar a ${getDisplayName(removeConfirm.enrol?.player)} (${removeConfirm.enrol?.player?.full_name}) del partido? El jugador no podrá volver a inscribirse por su cuenta, pero puedes restaurarlo manualmente.`}
                confirmText="Sí, Retirar"
                cancelText="Cancelar"
                onConfirm={handleConfirmRemove}
                onClose={() => setRemoveConfirm({ show: false, enrol: null })}
                variant="danger"
            />

            {/* Unpaid confirmation modal - to prevent accidental payment removal */}
            <ConfirmModal
                show={unpaidConfirm.show}
                title="Quitar Pago"
                message={`¿Estás seguro de quitar el pago de ${getDisplayName(unpaidConfirm.enrol?.player)} (${unpaidConfirm.enrol?.player?.full_name})? El jugador perderá su cupo de titular.`}
                confirmText="Sí, Quitar Pago"
                cancelText="Cancelar"
                onConfirm={handleConfirmUnpaid}
                onClose={() => setUnpaidConfirm({ show: false, enrol: null })}
                variant="danger"
            />

            {/* Absent confirmation modal - to prevent accidental presence removal */}
            <ConfirmModal
                show={absentConfirm.show}
                title="Marcar Ausente"
                message={`¿Estás seguro de marcar a ${getDisplayName(absentConfirm.enrol?.player)} (${absentConfirm.enrol?.player?.full_name}) como ausente?`}
                confirmText="Sí, Marcar Ausente"
                cancelText="Cancelar"
                onConfirm={handleConfirmAbsent}
                onClose={() => setAbsentConfirm({ show: false, enrol: null })}
                variant="danger"
            />

            {/* ===== MATCH INFO CARD ===== */}
            <Card style={{
                marginBottom: '2rem',
                padding: '1.2rem',
                border: '1px solid var(--border)',
                background: 'rgba(255, 255, 255, 0.02)'
            }} hover={false}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Jugadores Titulares</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {paidEnrollments.slice(0, totalNeeded).length} / {totalNeeded}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Reservas Pagados</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {Math.max(0, paidEnrollments.length - totalNeeded)}
                        </div>
                    </div>
                </div>
            </Card>

            {/* ===== ATTENDANCE & PAYMENTS LIST ===== */}
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={20} /> Asistencia y Pagos
            </h3>

            <Card style={{ marginBottom: '3rem', padding: '1rem' }} hover={false}>
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {sortedEnrollments.map((enrol, index) => {
                        // Find its position in the overall sorted list
                        const overallIndex = index + 1

                        // Find its position in the PAID list to determine Titular status
                        const paidIndex = paidEnrollments.findIndex(e => e.id === enrol.id)
                        const isTitular = enrol.paid && (paidIndex !== -1 && paidIndex < totalNeeded)
                        const isReserva = enrol.paid && (paidIndex !== -1 && paidIndex >= totalNeeded)

                        // Determine player status tag
                        let tagLabel = null
                        let tagColor = ''
                        let tagBg = ''
                        let tagBorder = ''

                        if (enrol.is_excluded) {
                            tagLabel = 'RETIRADO'
                            tagColor = '#f97316'
                            tagBg = 'rgba(249, 115, 22, 0.15)'
                            tagBorder = '#f97316'
                        } else if (enrol.paid) {
                            if (isTitular) {
                                tagLabel = 'TITULAR'
                                tagColor = '#10b981'
                                tagBg = 'rgba(16, 185, 129, 15%)'
                                tagBorder = '#10b981'
                            } else if (isReserva) {
                                tagLabel = 'RESERVA'
                                tagColor = 'var(--text-dim)'
                                tagBg = 'rgba(255, 255, 255, 0.05)'
                                tagBorder = 'var(--border)'
                            }
                        } else {
                            tagLabel = 'INTERESADO'
                            tagColor = 'var(--text-dim)'
                            tagBg = 'rgba(255, 255, 255, 0.02)'
                            tagBorder = 'var(--border)'
                            tagBorder = 'rgba(255, 255, 255, 0.1)'
                        }

                        // NO-SHOW: paid but didn't come (field day has passed or presence was not marked)
                        const isNoShow = enrol.paid && enrol.is_present === false && match.is_locked && !enrol.is_excluded

                        // Can remove: only unpaid players who are not excluded
                        const canRemove = !enrol.paid && !enrol.is_excluded && !match.is_locked

                        return (
                            <div key={enrol.id} className="admin-player-row" style={{
                                opacity: enrol.is_excluded ? 0.5 : 1
                            }}>
                                <div className="admin-player-info">
                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{enrol.is_excluded ? '-' : overallIndex}.</span>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{
                                            fontWeight: '600',
                                            color: enrol.is_excluded ? 'var(--text-dim)' : isNoShow ? 'var(--danger)' : enrol.is_present ? 'var(--primary)' : 'white',
                                            textDecoration: enrol.is_excluded || isNoShow ? 'line-through' : 'none'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span>{getDisplayName(enrol.player)}</span>
                                                {enrol.player?.nickname && (
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 'normal' }}>
                                                        ({enrol.player.full_name})
                                                    </span>
                                                )}
                                            </div>
                                        </span>
                                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
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
                                            {/* NO-SHOW indicator */}
                                            {isNoShow && (
                                                <div style={{
                                                    fontSize: '0.6rem',
                                                    padding: '0.1rem 0.3rem',
                                                    borderRadius: '3px',
                                                    background: 'rgba(239, 68, 68, 0.15)',
                                                    color: 'var(--danger)',
                                                    border: '1px solid var(--danger)',
                                                    fontWeight: 'bold'
                                                }}>
                                                    NO LLEGÓ
                                                </div>
                                            )}
                                            {enrol.paid && !enrol.is_excluded && (
                                                <div style={{ fontSize: '0.6rem', color: 'var(--primary)', opacity: 0.8 }}>
                                                    Pagó: {new Date(enrol.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="admin-player-actions">
                                    {canManage && !enrol.is_excluded ? (
                                        <>
                                            <Button
                                                size="sm"
                                                variant={enrol.paid ? 'success' : 'outline'}
                                                onClick={() => handlePaymentClick(enrol)}
                                                disabled={match.is_locked || !canManage}
                                                icon={CreditCard}
                                                style={{ transition: 'none' }}
                                            >
                                                {enrol.paid ? 'Pagado' : 'Cobrar'}
                                            </Button>
                                            {/* Presence toggle - requires payment first (no on-site payments) */}
                                            <Button
                                                size="sm"
                                                variant={enrol.is_present ? 'primary' : 'outline'}
                                                onClick={() => handlePresenceClick(enrol)}
                                                disabled={match.is_locked || !canManage || (!enrol.paid && !enrol.is_present)}
                                                icon={Users}
                                            >
                                                {enrol.is_present ? 'Presente' : 'Ausente'}
                                            </Button>
                                            {/* Remove button - ONLY for unpaid players who haven't been excluded */}
                                            {canRemove && onRemovePlayer && (
                                                <Button
                                                    size="sm"
                                                    variant="outline-danger"
                                                    onClick={() => handleRemoveClick(enrol)}
                                                    disabled={!canManage}
                                                    icon={UserMinus}
                                                    title="Retirar del partido"
                                                />
                                            )}
                                        </>
                                    ) : canManage && enrol.is_excluded && !match.is_locked ? (
                                        // Restore button for excluded players (can undo exclusion)
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onRestorePlayer && onRestorePlayer(enrol)}
                                            disabled={!canManage}
                                            icon={UserPlus}
                                        >
                                            Restaurar
                                        </Button>
                                    ) : (
                                        enrol.is_present && !enrol.is_excluded && (
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

            {/* ===== TEAM MANAGEMENT BUTTONS ===== */}
            {canManage && !match.is_locked && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                    {/* Expand up to 6 teams max */}
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
                    {/* Shrink down to minimum 2 teams */}
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

            {/* ===== LOCKED MATCH STATUS ===== */}
            {match.is_locked && (
                <Card style={{ marginTop: '2rem', textAlign: 'center', border: `1px solid ${match.is_canceled ? 'var(--danger)' : '#10b981'}`, background: match.is_canceled ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)' }} hover={false}>
                    <h4 style={{ color: match.is_canceled ? 'var(--danger)' : '#10b981' }}>
                        {match.is_canceled ? '✕ Partido Cancelado' : '✓ Partido Finalizado'}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {match.is_canceled ? 'El partido fue cancelado.' : 'El partido ha sido finalizado y los resultados guardados.'}
                    </p>
                </Card>
            )}
        </>
    )
}

export default AdminTab
