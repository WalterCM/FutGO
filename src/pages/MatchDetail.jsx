import React, { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Calendar, Clock, MapPin, Users, CheckCircle, XCircle, CreditCard, Trophy, Plus, ChevronRight, Wallet, Pencil } from 'lucide-react'

export default function MatchDetail({ profile, onBack }) {
    const { refreshProfile } = useAuth()
    const { id: matchId } = useParams()
    const location = useLocation()
    const initialMatch = location.state?.match

    const [match, setMatch] = useState(initialMatch || null)
    const [enrollments, setEnrollments] = useState(initialMatch?.enrollments || [])
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(!initialMatch)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [showGameForm, setShowGameForm] = useState(false)
    const [gameData, setGameData] = useState({ score1: 0, score2: 0, team1Id: 1, team2Id: 2 })
    const [actionLoading, setActionLoading] = useState(null)
    const [confirmingLeave, setConfirmingLeave] = useState(false)
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
    const [selectedPlayerId, setSelectedPlayerId] = useState(null)
    const [activeTab, setActiveTab] = useState('admin') // 'admin' or 'field'
    const [showCheckout, setShowCheckout] = useState(false)
    const [balanceLoading, setBalanceLoading] = useState(false)
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null })
    const [expansionData, setExpansionData] = useState({ show: false, newCost: 150 })
    const [isEditing, setIsEditing] = useState(false)
    const [fields, setFields] = useState([])
    const [editData, setEditData] = useState({ field_id: '', date: '', time: '' })

    function showMsg(type, text) {
        setStatusMsg({ type, text })
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000)
    }

    useEffect(() => {
        if (matchId) {
            fetchMatchDetails(!!initialMatch)
        }
    }, [matchId])

    async function fetchMatchDetails(silent = false) {
        if (!silent) setLoading(true)
        else setIsRefreshing(true)

        // Fetch match with field info
        const { data: matchData, error: matchError } = await supabase
            .from('matches')
            .select('*, field:fields(*)')
            .eq('id', matchId)
            .single()

        if (matchError) {
            alert(matchError.message)
            onBack()
            return
        }
        setMatch(matchData)

        // Fetch enrollments with player profiles
        const { data: enrollData, error: enrollError } = await supabase
            .from('enrollments')
            .select('*, player:profiles(*)')
            .eq('match_id', matchId)
            .order('created_at', { ascending: true })

        if (enrollError) {
            showMsg('error', enrollError.message)
        } else {
            setEnrollments(enrollData || [])
        }

        // Fetch individual games (mini-matches)
        const { data: gamesData, error: gamesError } = await supabase
            .from('games')
            .select('*')
            .eq('match_day_id', matchId)
            .order('created_at', { ascending: false })

        if (!gamesError) setGames(gamesData || [])

        setLoading(false)
        setIsRefreshing(false)
    }

    async function updateEnrollment(enrolId, updates) {
        // Optimistic Update
        setEnrollments(prev => prev.map(enrol =>
            enrol.id === enrolId ? { ...enrol, ...updates } : enrol
        ))

        const { error } = await supabase
            .from('enrollments')
            .update(updates)
            .eq('id', enrolId)

        if (error) {
            showMsg('error', error.message)
            fetchMatchDetails(true) // Revert on error
        }
    }

    function handleTogglePaid(enrol) {
        if (!canManage) return
        if (enrol.paid) {
            setConfirmModal({
                show: true,
                title: 'Desmarcar Pago',
                message: `¿Estás seguro de que quieres revertir el pago de ${enrol.player?.full_name}?`,
                onConfirm: () => updateEnrollment(enrol.id, { paid: false })
            })
        } else {
            updateEnrollment(enrol.id, { paid: true })
        }
    }

    function handleTogglePresent(enrol) {
        if (!canManage) return
        if (enrol.is_present) {
            setConfirmModal({
                show: true,
                title: 'Quitar de Cancha',
                message: `¿Estás seguro de que quieres marcar como ausente a ${enrol.player?.full_name}?`,
                onConfirm: () => updateEnrollment(enrol.id, { is_present: false })
            })
        } else {
            updateEnrollment(enrol.id, { is_present: true })
        }
    }

    async function handleAddGame(e) {
        if (!canManage) return
        e.preventDefault()
        setActionLoading('game-form')

        const { error } = await supabase
            .from('games')
            .insert([{
                match_day_id: matchId,
                score1: gameData.score1,
                score2: gameData.score2,
                team1_id: gameData.team1Id,
                team2_id: gameData.team2Id,
                team1_players: enrollments.filter(e => e.team_assignment === gameData.team1Id).map(e => e.player_id),
                team2_players: enrollments.filter(e => e.team_assignment === gameData.team2Id).map(e => e.player_id),
                is_completed: true
            }])

        if (error) {
            showMsg('error', error.message)
        } else {
            showMsg('success', 'Resultado guardado')
            setShowGameForm(false)
            setGameData({ score1: 0, score2: 0, team1Id: 1, team2Id: 2 })
            fetchMatchDetails(true)
        }
        setActionLoading(null)
    }

    async function joinMatch(useBalance = false) {
        setActionLoading('join')
        const cost = 10; // Standard price

        /* Wallet disabled for decentralized model 
        if (useBalance) {
            if ((profile.balance || 0) < cost) {
                showMsg('error', 'Saldo insuficiente')
                setActionLoading(null)
                return
            }

            // Deduct from profile balance
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({ balance: profile.balance - cost })
                .eq('id', profile.id)

            if (balanceError) {
                showMsg('error', 'Error al usar saldo: ' + balanceError.message)
                setActionLoading(null)
                return
            }
        }
        */

        const { error } = await supabase
            .from('enrollments')
            .insert([{
                match_id: matchId,
                player_id: profile.id,
                paid: false, // Default to false in decentralized model
                is_waitlist: enrolledCount >= totalNeeded
            }])

        if (error) {
            showMsg('error', error.message)
            // If balance was used, we should ideally revert it here, 
            // but for now we'll just show the error.
        } else {
            showMsg('success', enrolledCount >= totalNeeded ? '¡Anotado en lista de espera! ⏳' : '¡Te has unido! ⚽')
            setShowCheckout(false)
            fetchMatchDetails(true)
            refreshProfile()
        }
        setActionLoading(null)
    }

    async function leaveMatch() {
        if (!confirmingLeave) {
            setConfirmingLeave(true)
            setTimeout(() => setConfirmingLeave(false), 3000)
            return
        }

        setActionLoading('leave')
        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('match_id', matchId)
            .eq('player_id', profile.id)

        if (error) {
            showMsg('error', error.message)
        } else {
            showMsg('success', 'Has salido del partido')
            setConfirmingLeave(false)
            fetchMatchDetails(true)
            refreshProfile()
        }
        setActionLoading(null)
    }

    const teamConfigs = {
        0: { name: 'Banca', color: 'var(--text-dim)', bg: 'rgba(255,255,255,0.05)', border: 'var(--border)' },
        1: { name: 'Crema', color: '#800000', bg: '#fdf5e6', border: '#800000' },
        2: { name: 'Blanquiazul', color: '#ffffff', bg: '#002366', border: '#ffffff' },
        3: { name: 'Celeste', color: '#00008b', bg: '#add8e6', border: '#00008b' }
    }

    const onDragStart = (e, enrolId) => {
        e.dataTransfer.setData('enrolId', enrolId)
    }

    const onDragOver = (e) => {
        e.preventDefault()
    }

    const onDrop = async (e, teamId) => {
        e.preventDefault()
        const enrolId = e.dataTransfer.getData('enrolId')
        if (!enrolId) return

        await updateEnrollment(enrolId, { team_assignment: teamId === 0 ? null : teamId })
    }

    const handleMobileMove = async (teamId) => {
        if (!selectedPlayerId) return
        await updateEnrollment(selectedPlayerId, { team_assignment: teamId === 0 ? null : teamId })
        setSelectedPlayerId(null)
    }

    async function handleCloseMatch() {
        if (!canManage) return
        const collected = enrollments.filter(e => e.paid).length * 10
        const cost = match.fixed_cost || 100
        const surplus = collected - cost
        const presentPlayers = enrollments.filter(e => e.is_present)

        const finalize = async () => {
            setActionLoading('closing')
            /* Wallet disabled for decentralized model - No balance distribution
            // Distribute surplus
            if (surplus > 0) {
                const perPerson = (surplus / presentPlayers.length).toFixed(2)
                for (const p of presentPlayers) {
                    const { data: pData } = await supabase.from('profiles').select('balance').eq('id', p.player_id).single()
                    await supabase.from('profiles').update({ balance: (pData?.balance || 0) + Number(perPerson) }).eq('id', p.player_id)
                }
            }
            */
            const { error } = await supabase.from('matches').update({ is_locked: true }).eq('id', matchId)
            if (error) showMsg('error', error.message)
            else {
                showMsg('success', '¡Caja cerrada y partido finalizado! 🏁')
                fetchMatchDetails()
                refreshProfile()
            }
            setActionLoading(null)
        }

        if (surplus < 0) {
            setConfirmModal({
                show: true,
                title: 'Déficit Detectado',
                message: `Hay un déficit de S/ ${Math.abs(surplus)}. ¿Cerrar de todas formas? No se repartirá saldo.`,
                onConfirm: finalize
            })
        } else if (surplus > 0) {
            const perPerson = (surplus / presentPlayers.length).toFixed(2)
            setConfirmModal({
                show: true,
                title: 'Repartir Superávit',
                message: `Se repartirán S/ ${surplus} (S/ ${perPerson} por crack) a los ${presentPlayers.length} presentes. ¿Confirmar cierre?`,
                onConfirm: finalize
            })

        } else {
            setConfirmModal({
                show: true,
                title: 'Cerrar Partido',
                message: 'El balance es 0. ¿Confirmas el cierre definitivo del partido?',
                onConfirm: finalize
            })
        }
    }

    async function handleExpandMatch() {
        if (!canManage) return
        setActionLoading('expanding')
        const { error } = await supabase.from('matches').update({
            max_players: 15,
            fixed_cost: Number(expansionData.newCost)
        }).eq('id', matchId)

        if (error) {
            showMsg('error', error.message)
        } else {
            showMsg('success', '¡Partido expandido a 3 equipos! ⚽⚽⚽')
            setExpansionData({ show: false, newCost: 150 })
            fetchMatchDetails(true)
        }
        setActionLoading(null)
    }

    async function handleCancelMatch() {
        if (!canManage) return
        setConfirmModal({
            show: true,
            title: 'Cancelar Partido',
            message: '¿Estás seguro de cancelar el partido? (Recuerda realizar las devoluciones manuales si corresponde).',
            onConfirm: async () => {
                setActionLoading('canceling')
                /* Wallet disabled for decentralized model - No automated refunds
                const paidEnrollments = enrollments.filter(e => e.paid)

                // Refund to wallets
                for (const enroll of paidEnrollments) {
                    const { data: pData } = await supabase.from('profiles').select('balance').eq('id', enroll.player_id).single()
                    await supabase.from('profiles').update({ balance: (pData?.balance || 0) + 10 }).eq('id', enroll.player_id)
                }
                */

                // Lock the match and mark as canceled
                const { error } = await supabase.from('matches').update({ is_locked: true, is_canceled: true }).eq('id', matchId)

                if (error) {
                    await supabase.from('matches').update({ is_locked: true }).eq('id', matchId)
                    showMsg('success', 'Partido cancelado (Caja Bloqueada) y saldos devueltos')
                } else {
                    showMsg('success', 'Partido cancelado y saldos devueltos 💸')
                }
                fetchMatchDetails()
                refreshProfile()
                setActionLoading(null)
            }
        })
    }

    async function handleUpdateMatch(e) {
        e.preventDefault()
        setActionLoading('updating')
        const { error } = await supabase
            .from('matches')
            .update({
                field_id: editData.field_id,
                date: editData.date,
                time: editData.time
            })
            .eq('id', matchId)

        if (error) {
            showMsg('error', error.message)
        } else {
            showMsg('success', '¡Encuentro actualizado! ⚽')
            setIsEditing(false)
            fetchMatchDetails(true)
        }
        setActionLoading(null)
    }

    async function startEditing() {
        if (!fields.length) {
            const { data } = await supabase.from('fields').select('*').order('name')
            setFields(data || [])
        }
        setEditData({
            field_id: match.field_id,
            date: match.date,
            time: match.time
        })
        setIsEditing(true)
    }

    const canManage = profile?.is_super_admin || match?.creator_id === profile?.id

    if (loading) return <div className="flex-center" style={{ minHeight: '60vh' }}>Cargando detalles...</div>
    if (!match) return null

    const totalNeeded = match.field?.players_per_team * 2;
    const enrolledCount = enrollments.length;

    const getTeamPlayers = (teamId) => {
        return enrollments.filter(e => {
            const assignment = e.team_assignment || 0
            return assignment === teamId
        })
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
            {isRefreshing && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.75rem', animation: 'fadeIn 0.3s' }}>
                    <div className="spin" style={{ width: '12px', height: '12px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                    Actualizando...
                </div>
            )}
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

            <div className="premium-card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                            <h2 style={{ color: 'var(--primary)', fontSize: '2rem', margin: 0 }}>{match.field?.name}</h2>
                            {canManage && !match.is_locked && (
                                <button
                                    onClick={startEditing}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', opacity: 0.7 }}
                                    title="Editar detalles"
                                >
                                    <Pencil size={20} />
                                </button>
                            )}
                        </div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1rem' }}>Sede del Encuentro</p>
                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-dim)', flexWrap: 'wrap' }}>
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

                        {enrollments.some(e => e.player_id === profile.id) ? (
                            <button
                                onClick={leaveMatch}
                                className="btn-primary"
                                style={{
                                    padding: '0.5rem 1rem', fontSize: '0.8rem', width: '100%',
                                    background: confirmingLeave ? 'var(--danger)' : 'transparent',
                                    border: '1px solid var(--danger)',
                                    color: confirmingLeave ? 'white' : 'var(--danger)'
                                }}
                                disabled={actionLoading === 'leave' || match.is_locked}
                            >
                                {actionLoading === 'leave' ? 'Saliendo...' : (confirmingLeave ? '¿Seguro?' : 'Salir')}
                            </button>
                        ) : (
                            <button
                                onClick={() => joinMatch()}
                                className="btn-primary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', width: '100%' }}
                                disabled={actionLoading === 'join' || match.is_locked || (enrolledCount >= totalNeeded && enrollments.some(e => e.player_id === profile.id))}
                            >
                                {actionLoading === 'join' ? 'Uniendo...' : (enrolledCount >= totalNeeded ? 'Me interesa' : 'Unirme')}
                            </button>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                                textDecoration: 'none'
                            }}
                        >
                            <Phone size={14} /> Llamar a Cancha
                        </a>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                padding: '0.3rem',
                borderRadius: '12px',
                marginBottom: '2rem',
                border: '1px solid var(--border)'
            }}>
                <button
                    onClick={() => setActiveTab('admin')}
                    style={{
                        flex: 1,
                        padding: '0.8rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: activeTab === 'admin' ? 'var(--primary)' : 'transparent',
                        color: activeTab === 'admin' ? 'black' : 'var(--text-dim)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <CheckCircle size={18} /> Administración
                </button>
                <button
                    onClick={() => setActiveTab('field')}
                    style={{
                        flex: 1,
                        padding: '0.8rem',
                        borderRadius: '10px',
                        border: 'none',
                        background: activeTab === 'field' ? 'var(--primary)' : 'transparent',
                        color: activeTab === 'field' ? 'black' : 'var(--text-dim)',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <MapPin size={18} /> Cancha / Equipos
                </button>
            </div>

            {activeTab === 'admin' ? (
                <>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={20} /> Asistencia y Pagos
                    </h3>
                    <div className="premium-card" style={{ marginBottom: '3rem', padding: '1rem' }}>
                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            {enrollments.map((enrol, index) => (
                                <div key={enrol.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{index + 1}.</span>
                                        <span style={{ fontWeight: '600', color: enrol.is_present ? 'var(--primary)' : 'white' }}>{enrol.player?.full_name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleTogglePaid(enrol)}
                                            disabled={match.is_locked || !canManage}
                                            style={{
                                                padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem', cursor: 'pointer',
                                                background: enrol.paid ? '#10b981' : 'transparent', color: enrol.paid ? 'black' : 'var(--text-dim)',
                                                opacity: (match.is_locked || !canManage) ? 0.6 : 1
                                            }}
                                        >
                                            <CreditCard size={12} style={{ marginRight: '4px' }} /> {enrol.paid ? 'Pagado' : 'Cobrar'}
                                        </button>
                                        <button
                                            onClick={() => handleTogglePresent(enrol)}
                                            disabled={match.is_locked || !canManage}
                                            style={{
                                                padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem', cursor: 'pointer',
                                                background: enrol.is_present ? 'var(--primary)' : 'transparent', color: enrol.is_present ? 'black' : 'var(--text-dim)',
                                                opacity: (match.is_locked || !canManage) ? 0.6 : 1
                                            }}
                                        >
                                            <Users size={12} style={{ marginRight: '4px' }} /> {enrol.is_present ? 'Presente' : 'Ausente'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="premium-card" style={{ padding: '1.5rem', border: '1px solid var(--primary)', background: 'rgba(var(--primary-rgb), 0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h4 style={{ color: 'var(--primary)', marginBottom: '0.2rem' }}>Resumen de Partido</h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>División sugerida: S/ 10 por crack</p>
                            </div>
                            <div style={{ display: 'flex', gap: '2rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                        S/ {enrollments.filter(e => e.paid).length * 10}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Recaudado</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>
                                        S/ {match.fixed_cost || 100}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Costo Cancha</div>
                                </div>
                                {/* Financial Balance hidden for now */}
                                {/* 
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: (enrollments.filter(e => e.paid).length * 10) >= (match.fixed_cost || 100) ? '#10b981' : 'var(--danger)' }}>
                                        S/ {(enrollments.filter(e => e.paid).length * 10) - (match.fixed_cost || 100)}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Balance</div>
                                </div>
                                */}
                            </div>
                        </div>
                    </div>

                    {canManage && !match.is_locked && (
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            {match.max_players < 15 && (
                                <button
                                    onClick={() => setExpansionData({ show: true, newCost: (match.fixed_cost || 100) + 50 })}
                                    className="btn-primary"
                                    style={{ flex: 1, background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                                    disabled={actionLoading === 'expanding'}
                                >
                                    {actionLoading === 'expanding' ? 'Expandiendo...' : 'Habilitar 3er Equipo'}
                                </button>
                            )}
                            <button
                                onClick={handleCloseMatch}
                                className="btn-primary"
                                style={{ flex: 1, background: '#10b981', color: 'black' }}
                                disabled={actionLoading === 'closing'}
                            >
                                {actionLoading === 'closing' ? 'Cerrando...' : 'Cerrar Caja'}
                            </button>
                            <button
                                onClick={handleCancelMatch}
                                className="btn-primary"
                                style={{ flex: 1, background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                                disabled={actionLoading === 'canceling'}
                            >
                                {actionLoading === 'canceling' ? 'Cancelando...' : 'Cancelar Partido'}
                            </button>
                        </div>
                    )}

                    {match.is_locked && (
                        <div className="premium-card" style={{ marginTop: '2rem', textAlign: 'center', border: `1px solid ${match.is_canceled ? 'var(--danger)' : '#10b981'}`, background: match.is_canceled ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)' }}>
                            <h4 style={{ color: match.is_canceled ? 'var(--danger)' : '#10b981' }}>{match.is_canceled ? '✕ Partido Cancelado' : '✓ Partido Finalizado'}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                {match.is_canceled ? 'El partido fue cancelado y los saldos devueltos.' : 'La caja ha sido cerrada y los saldos repartidos.'}
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: enrollments.some(e => e.is_present) ? 1 : 0.5 }}>
                        <MapPin size={20} /> Cancha y Equipos
                    </h3>
                    {!enrollments.some(e => e.is_present) && (
                        <div className="premium-card" style={{ textAlign: 'center', padding: '2rem', marginBottom: '2rem', border: '2px dashed var(--border)' }}>
                            <p style={{ color: 'var(--text-dim)' }}>No hay nadie "Presente". Marca quién llegó en la pestaña de Administración.</p>
                        </div>
                    )}

                    <div style={{
                        opacity: enrollments.some(e => e.is_present) ? 1 : 0.5,
                        pointerEvents: enrollments.some(e => e.is_present) ? 'auto' : 'none',
                        marginBottom: '4rem'
                    }}>
                        {selectedPlayerId && (
                            <div style={{ background: 'var(--primary)', color: 'black', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', animation: 'slideIn 0.3s' }}>
                                Selecciona un equipo para mover a <b>{enrollments.find(e => e.id === selectedPlayerId)?.player?.full_name}</b>
                            </div>
                        )}

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '1rem',
                            alignItems: 'start'
                        }}>
                            {[0, 1, 2, 3].map(teamId => {
                                // En la cancha solo mostramos a los que están presentes
                                const players = getTeamPlayers(teamId).filter(p => p.is_present)
                                const config = teamConfigs[teamId]

                                return (
                                    <div
                                        key={teamId}
                                        onDragOver={onDragOver}
                                        onDrop={(e) => onDrop(e, teamId)}
                                        onClick={() => handleMobileMove(teamId)}
                                        style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${selectedPlayerId ? 'var(--primary)' : (teamId === 0 ? 'var(--border)' : config.bg)}`,
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            minHeight: '200px',
                                            transition: 'all 0.3s ease',
                                            cursor: selectedPlayerId ? 'pointer' : 'default'
                                        }}
                                    >
                                        <h4 style={{
                                            color: teamId === 0 ? 'var(--text-dim)' : config.color,
                                            background: teamId === 0 ? 'transparent' : config.bg,
                                            padding: '0.4rem',
                                            borderRadius: '6px',
                                            textAlign: 'center',
                                            marginBottom: '1rem',
                                            fontSize: '0.8rem',
                                            border: teamId === 0 ? 'none' : `1px solid ${config.color}`
                                        }}>
                                            {config.name} ({players.length})
                                        </h4>

                                        <div style={{ display: 'grid', gap: '0.6rem' }}>
                                            {players.map(p => (
                                                <div
                                                    key={p.id}
                                                    draggable
                                                    onDragStart={(e) => onDragStart(e, p.id)}
                                                    onClick={(e) => {
                                                        if (teamId === 0) {
                                                            e.stopPropagation()
                                                            setSelectedPlayerId(selectedPlayerId === p.id ? null : p.id)
                                                        }
                                                    }}
                                                    className="premium-card"
                                                    style={{
                                                        padding: '0.8rem',
                                                        cursor: 'grab',
                                                        fontSize: '0.8rem',
                                                        background: selectedPlayerId === p.id ? 'var(--primary)' : (teamId === 0 ? 'var(--bg-card)' : config.bg),
                                                        border: `1px solid ${teamId === 0 ? 'var(--border)' : config.color}`,
                                                        color: selectedPlayerId === p.id ? 'black' : (teamId === 0 ? 'white' : (teamId === 2 ? 'white' : config.color)),
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 'bold' }}>{p.player?.full_name}</div>
                                                    <div style={{ fontSize: '0.65rem', opacity: 0.7 }}>{p.player?.elo_rating}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <Trophy size={20} /> Partidos Jugados
                            </h3>
                            {canManage && (
                                <button
                                    className="btn-primary"
                                    style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}
                                    onClick={() => setShowGameForm(!showGameForm)}
                                >
                                    {showGameForm ? <XCircle size={16} /> : <Plus size={16} />}
                                    {showGameForm ? ' Cancelar' : ' Registrar Score'}
                                </button>
                            )}
                        </div>

                        {showGameForm && (
                            <div className="premium-card" style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)' }}>
                                <form onSubmit={handleAddGame}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <select
                                                value={gameData.team1Id}
                                                onChange={(e) => setGameData({ ...gameData, team1Id: parseInt(e.target.value) })}
                                                style={{
                                                    background: teamConfigs[gameData.team1Id].bg,
                                                    color: gameData.team1Id === 2 ? 'white' : teamConfigs[gameData.team1Id].color,
                                                    border: `1px solid ${teamConfigs[gameData.team1Id].color}`,
                                                    padding: '0.4rem', borderRadius: '6px', marginBottom: '0.5rem', width: '100%', fontWeight: 'bold'
                                                }}
                                            >
                                                {[1, 2, 3].map(id => <option key={id} value={id} style={{ background: 'var(--bg-dark)', color: 'white' }}>{teamConfigs[id].name}</option>)}
                                            </select>
                                            <input
                                                type="number"
                                                className="input-field"
                                                style={{ width: '60px', textAlign: 'center', fontSize: '1.5rem' }}
                                                value={gameData.score1}
                                                onChange={(e) => setGameData({ ...gameData, score1: parseInt(e.target.value) || 0 })}
                                                min="0"
                                            />
                                        </div>

                                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>VS</div>

                                        <div style={{ textAlign: 'center' }}>
                                            <select
                                                value={gameData.team2Id}
                                                onChange={(e) => setGameData({ ...gameData, team2Id: parseInt(e.target.value) })}
                                                style={{
                                                    background: teamConfigs[gameData.team2Id].bg,
                                                    color: gameData.team2Id === 2 ? 'white' : teamConfigs[gameData.team2Id].color,
                                                    border: `1px solid ${teamConfigs[gameData.team2Id].color}`,
                                                    padding: '0.4rem', borderRadius: '6px', marginBottom: '0.5rem', width: '100%', fontWeight: 'bold'
                                                }}
                                                disabled={match.is_locked}
                                            >
                                                {[1, 2, 3].map(id => <option key={id} value={id} style={{ background: 'var(--bg-dark)', color: 'white' }}>{teamConfigs[id].name}</option>)}
                                            </select>
                                            <input
                                                type="number"
                                                className="input-field"
                                                style={{ width: '60px', textAlign: 'center', fontSize: '1.5rem' }}
                                                value={gameData.score2}
                                                onChange={(e) => setGameData({ ...gameData, score2: parseInt(e.target.value) || 0 })}
                                                min="0"
                                                disabled={match.is_locked}
                                            />
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '1rem' }}>
                                        El score se registrará para los jugadores actualmente en cada equipo.
                                    </p>
                                    {!match.is_locked && (
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            style={{ width: '100%' }}
                                            disabled={actionLoading === 'game-form' || gameData.team1Id === gameData.team2Id}
                                        >
                                            {actionLoading === 'game-form' ? 'Guardando...' :
                                                gameData.team1Id === gameData.team2Id ? 'Selecciona equipos distintos' : 'Confirmar Resultado'}
                                        </button>
                                    )}
                                </form>
                            </div>
                        )}

                        {games.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                                <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Aún no se han registrado resultados de juegos individuales.</p>
                                <p style={{ color: 'var(--primary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>¡Los resultados afectan el ELO de los cracks! 📈</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {games.map((game, idx) => (
                                    <div key={game.id} className="premium-card" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <div style={{
                                                    color: game.team1Id === 2 ? 'white' : teamConfigs[game.team1_id || 1]?.color,
                                                    background: teamConfigs[game.team1_id || 1]?.bg,
                                                    padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                                    border: `1px solid ${teamConfigs[game.team1_id || 1]?.color}`
                                                }}>
                                                    {teamConfigs[game.team1_id || 1]?.name}
                                                </div>
                                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{game.score1}</div>
                                            </div>
                                            <div style={{ color: 'var(--text-dim)', fontWeight: 'bold' }}>VS</div>
                                            <div style={{ textAlign: 'center', flex: 1 }}>
                                                <div style={{
                                                    color: game.team2Id === 2 ? 'white' : teamConfigs[game.team2_id || 2]?.color,
                                                    background: teamConfigs[game.team2_id || 2]?.bg,
                                                    padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                                    border: `1px solid ${teamConfigs[game.team2_id || 2]?.color}`
                                                }}>
                                                    {teamConfigs[game.team2_id || 2]?.name}
                                                </div>
                                                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{game.score2}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Checkout Modal disabled for decentralized model */}
            {/* 
            {showCheckout && (
                <div className="flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, padding: '1rem' }}>
                    <div className="premium-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', animation: 'scaleIn 0.3s ease-out' }}>
                        <Wallet size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>Confirmar Inscripción</h3>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>La cuota para este partido es de <b>S/ 10.00</b></p>

                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Tu Saldo FutGO:</span>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>S/ {profile?.balance || 0}</span>
                            </div>
                            {profile?.balance >= 10 ? (
                                <div style={{ fontSize: '0.8rem', color: '#10b981' }}>✓ Tienes saldo suficiente</div>
                            ) : (
                                <div style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>⚠ Saldo insuficiente para pago automático</div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gap: '0.8rem' }}>
                            <button
                                className="btn-primary"
                                disabled={profile?.balance < 10 || actionLoading === 'join'}
                                onClick={() => joinMatch(true)}
                                style={{ width: '100%', opacity: profile?.balance < 10 ? 0.5 : 1 }}
                            >
                                {actionLoading === 'join' ? 'Procesando...' : 'Usar Saldo FutGO'}
                            </button>
                            <button
                                className="btn-primary"
                                style={{ width: '100%', border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)' }}
                                onClick={() => joinMatch(false)}
                                disabled={actionLoading === 'join'}
                            >
                                Pagaré Externo (Yape/Efectivo)
                            </button>
                            <button
                                onClick={() => setShowCheckout(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '0.5rem' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            */}
            {confirmModal.show && (
                <div className="flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, padding: '1rem' }}>
                    <div className="premium-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', animation: 'scaleIn 0.2s ease-out' }}>
                        <h3 style={{ marginBottom: '1rem' }}>{confirmModal.title}</h3>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>{confirmModal.message}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                className="btn-primary"
                                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white' }}
                                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    confirmModal.onConfirm?.()
                                    setConfirmModal({ ...confirmModal, show: false })
                                }}
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {expansionData.show && (
                <div className="flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, padding: '1rem' }}>
                    <div className="premium-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', animation: 'scaleIn 0.2s ease-out' }}>
                        <Trophy size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>Expandir Partido</h3>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Habilitar un 3er equipo permitirá hasta 15 jugadores. Ingrese el nuevo costo total de la cancha.
                        </p>

                        <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>Costo Total de Cancha (S/)</label>
                            <input
                                type="number"
                                className="premium-input"
                                style={{ width: '100%', marginTop: '0.3rem', fontSize: '1.2rem', padding: '1rem' }}
                                value={expansionData.newCost}
                                onChange={(e) => setExpansionData({ ...expansionData, newCost: e.target.value })}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                className="btn-primary"
                                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white' }}
                                onClick={() => setExpansionData({ ...expansionData, show: false })}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-primary"
                                disabled={!expansionData.newCost || actionLoading === 'expanding'}
                                onClick={handleExpandMatch}
                            >
                                Expandir
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {statusMsg.text && (
                <div style={{
                    position: 'fixed',
                    top: '2rem',
                    right: '2rem',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    backgroundColor: statusMsg.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    zIndex: 1000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {statusMsg.text}
                </div>
            )}
            {/* Edit Modal */}
            {isEditing && (
                <div className="flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, padding: '1rem' }}>
                    <form onSubmit={handleUpdateMatch} className="premium-card" style={{ maxWidth: '500px', width: '100%', animation: 'scaleIn 0.2s ease-out' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Pencil size={20} /> Editar Encuentro
                        </h3>

                        <div style={{ display: 'grid', gap: '1.2rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>Cancha</label>
                                <select
                                    required
                                    className="premium-input"
                                    style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                    value={editData.field_id}
                                    onChange={e => setEditData({ ...editData, field_id: e.target.value })}
                                >
                                    {fields.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        className="premium-input"
                                        style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                        value={editData.date}
                                        onChange={e => setEditData({ ...editData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>Hora</label>
                                    <input
                                        type="time"
                                        required
                                        className="premium-input"
                                        style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                        value={editData.time}
                                        onChange={e => setEditData({ ...editData, time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                type="button"
                                className="btn-primary"
                                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white' }}
                                onClick={() => setIsEditing(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={actionLoading === 'updating'}
                            >
                                {actionLoading === 'updating' ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
