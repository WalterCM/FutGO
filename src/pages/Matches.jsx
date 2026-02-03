import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, Calendar, Clock, Users, CheckCircle, Trash2, LogOut, Loader2 } from 'lucide-react'

export default function Matches({ profile, onMatchClick }) {
    const [matches, setMatches] = useState([])
    const [fields, setFields] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [confirmingLeaveId, setConfirmingLeaveId] = useState(null)
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
    const [actionLoading, setActionLoading] = useState(null)
    const [newMatch, setNewMatch] = useState({
        field_id: '',
        date: '',
        time: '',
        status: 'open'
    })

    useEffect(() => {
        fetchMatches()
        fetchFields()
    }, [])

    function showMsg(type, text) {
        setStatusMsg({ type, text })
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000)
    }

    async function fetchFields() {
        const { data } = await supabase.from('fields').select('*').order('name')
        setFields(data || [])
        if (data?.length > 0 && !newMatch.field_id) {
            setNewMatch(prev => ({ ...prev, field_id: data[0].id }))
        }
    }

    async function fetchMatches() {
        setLoading(true)
        // We select matches and join with fields. 
        // We also want to know how many people are enrolled.
        const { data, error } = await supabase
            .from('matches')
            .select(`
                *,
                field:fields(*),
                enrollments(*)
            `)
            .order('date', { ascending: true })
            .order('time', { ascending: true })

        if (error) {
            console.error(error)
            alert(error.message)
        } else {
            setMatches(data || [])
        }
        setLoading(false)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase
            .from('matches')
            .insert([newMatch])

        if (error) {
            alert(error.message)
        } else {
            setShowForm(false)
            setNewMatch({ field_id: fields[0]?.id || '', date: '', time: '', status: 'open' })
            fetchMatches()
        }
        setLoading(false)
    }

    async function joinMatch(matchId) {
        setActionLoading(matchId)
        const { error } = await supabase
            .from('enrollments')
            .insert([{
                match_id: matchId,
                player_id: profile.id
            }])

        if (error) {
            if (error.code === '23505') showMsg('error', 'Ya estás inscrito')
            else showMsg('error', error.message)
        } else {
            showMsg('success', '¡Te has unido! ⚽')
            fetchMatches()
        }
        setActionLoading(null)
    }

    async function leaveMatch(matchId) {
        if (confirmingLeaveId !== matchId) {
            setConfirmingLeaveId(matchId)
            setTimeout(() => setConfirmingLeaveId(null), 3000) // Reset after 3 seconds
            return
        }

        setActionLoading(matchId)
        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('match_id', matchId)
            .eq('player_id', profile.id)

        if (error) {
            showMsg('error', error.message)
        } else {
            showMsg('success', 'Has salido del partido')
            setConfirmingLeaveId(null)
            fetchMatches()
        }
        setActionLoading(null)
    }

    async function deleteMatch(id) {
        if (!confirm('¿Estás seguro de eliminar este partido?')) return
        const { error } = await supabase.from('matches').delete().eq('id', id)
        if (error) alert(error.message)
        else fetchMatches()
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--primary)', fontSize: '2rem' }}>Próximos Partidos</h2>
                {profile?.is_admin && !showForm && (
                    <button
                        className="btn-primary"
                        onClick={() => setShowForm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} /> Nuevo Partido
                    </button>
                )}
            </div>

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

            {showForm && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <form onSubmit={handleSubmit} className="premium-card" style={{ width: '100%', maxWidth: '500px' }}>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Programar Partido</h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Seleccionar Cancha</label>
                                <select
                                    required
                                    className="premium-input"
                                    style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                    value={newMatch.field_id}
                                    onChange={e => setNewMatch({ ...newMatch, field_id: e.target.value })}
                                >
                                    <option value="" disabled>Selecciona una cancha...</option>
                                    {fields.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.name} (Fútbol {f.players_per_team})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        className="premium-input"
                                        style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                        value={newMatch.date}
                                        onChange={e => setNewMatch({ ...newMatch, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Hora</label>
                                    <input
                                        type="time"
                                        required
                                        className="premium-input"
                                        style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                        value={newMatch.time}
                                        onChange={e => setNewMatch({ ...newMatch, time: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button type="button" onClick={() => setShowForm(false)} className="btn-primary" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)' }}>Cancelar</button>
                            <button type="submit" className="btn-primary" style={{ flex: 2 }}>Crear Partido</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid-dashboard" style={{ padding: 0 }}>
                {loading ? (
                    <p>Cargando partidos...</p>
                ) : matches.length === 0 ? (
                    <div className="premium-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>No hay partidos programados aún.</p>
                        {profile?.is_admin && <p style={{ fontSize: '0.9rem' }}>¡Crea el primer partido del grupo! ⚽</p>}
                    </div>
                ) : (
                    matches.map(match => {
                        const enrolledCount = match.enrollments?.length || 0;
                        const totalNeeded = (match.field?.players_per_team || 5) * 2;
                        const isFull = enrolledCount >= totalNeeded;
                        const isEnrolled = match.enrollments?.some(e => e.player_id === profile.id);

                        return (
                            <div
                                key={match.id}
                                className="premium-card"
                                style={{ position: 'relative', cursor: 'pointer' }}
                                onClick={() => onMatchClick(match.id)}
                            >
                                {profile?.is_admin && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            deleteMatch(match.id)
                                        }}
                                        style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', zIndex: 10 }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}

                                <div style={{ marginBottom: '1rem' }}>
                                    <h3 style={{ color: 'var(--primary)', marginBottom: '0.2rem' }}>{match.field?.name}</h3>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: isEnrolled ? '#10b981' : (isFull ? 'var(--danger)' : 'var(--primary)'),
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}>
                                        {isEnrolled ? 'Estás Inscrito ✅' : (isFull ? 'Cupos Llenos' : 'Inscripciones Abiertas')}
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
                                        <Users size={16} /> {enrolledCount} / {totalNeeded} jugadores
                                    </div>
                                </div>

                                {isEnrolled ? (
                                    <button
                                        className="btn-primary"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            leaveMatch(match.id)
                                        }}
                                        disabled={actionLoading === match.id}
                                        style={{
                                            width: '100%',
                                            background: confirmingLeaveId === match.id ? 'var(--danger)' : 'transparent',
                                            border: '1px solid var(--danger)',
                                            color: confirmingLeaveId === match.id ? 'white' : 'var(--danger)',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            transition: 'all 0.3s ease',
                                            position: 'relative',
                                            zIndex: 10
                                        }}
                                    >
                                        {actionLoading === match.id ? (
                                            <Loader2 size={18} className="spin" />
                                        ) : confirmingLeaveId === match.id ? (
                                            '¿Estás seguro?'
                                        ) : (
                                            <><LogOut size={18} /> Salir del Partido</>
                                        )}
                                    </button>
                                ) : (
                                    <button
                                        className="btn-primary"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            joinMatch(match.id)
                                        }}
                                        disabled={isFull || actionLoading === match.id}
                                        style={{
                                            width: '100%',
                                            opacity: isFull ? 0.5 : 1,
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            position: 'relative',
                                            zIndex: 10
                                        }}
                                    >
                                        {actionLoading === match.id ? <Loader2 size={18} className="spin" /> : (isFull ? 'Partido Lleno' : 'Unirme al Partido')}
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    )
}
