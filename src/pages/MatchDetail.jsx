import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Calendar, Clock, MapPin, Users, CheckCircle, XCircle, CreditCard } from 'lucide-react'

export default function MatchDetail({ matchId, profile, onBack }) {
    const [match, setMatch] = useState(null)
    const [enrollments, setEnrollments] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (matchId) {
            fetchMatchDetails()
        }
    }, [matchId])

    async function fetchMatchDetails() {
        setLoading(true)

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
            alert(enrollError.message)
        } else {
            setEnrollments(enrollData || [])
        }

        setLoading(false)
    }

    if (loading) return <div className="flex-center" style={{ minHeight: '60vh' }}>Cargando detalles...</div>
    if (!match) return null

    const totalNeeded = match.field?.players_per_team * 2;
    const enrolledCount = enrollments.length;

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
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
                <ArrowLeft size={20} /> Volver a Partidos
            </button>

            <div className="premium-card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ color: 'var(--primary)', fontSize: '2rem', marginBottom: '0.5rem' }}>{match.field?.name}</h2>
                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-dim)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Calendar size={18} />
                                {new Date(match.date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <Clock size={18} /> {match.time.substring(0, 5)} hrs
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {enrolledCount} / {totalNeeded}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Jugadores</div>
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
            </div>

            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} /> Lista de Convocados
            </h3>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {enrollments.length === 0 ? (
                    <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: '2rem' }}>Aún no hay nadie inscrito. ¡Sé el primero!</p>
                ) : (
                    enrollments.map((enrol, index) => (
                        <div
                            key={enrol.id}
                            className="premium-card"
                            style={{
                                padding: '1rem 1.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                background: enrol.player_id === profile.id ? 'rgba(0, 255, 136, 0.05)' : 'var(--bg-card)',
                                border: enrol.player_id === profile.id ? '1px solid var(--primary)' : '1px solid var(--border)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ color: 'var(--text-dim)', fontWeight: 'bold', minWidth: '20px' }}>{index + 1}.</span>
                                <div>
                                    <div style={{ fontWeight: '600' }}>
                                        {enrol.player?.full_name} {enrol.player_id === profile.id && '(Tú)'}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                                        {enrol.player?.elo_rating} ELO
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {enrol.paid ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#10b981', fontSize: '0.9rem' }}>
                                        <CheckCircle size={16} /> Pagado
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                        <CreditCard size={16} /> Pendiente
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
