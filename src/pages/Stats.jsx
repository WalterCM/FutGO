import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Trophy, Medal, Goal, Star, Loader2 } from 'lucide-react'
import Card from '../components/ui/Card'
import { getRating, getDisplayName } from '../lib/utils'

export default function Stats() {
    const [topPlayers, setTopPlayers] = useState([])
    const [maxElo, setMaxElo] = useState(2000)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    async function fetchStats() {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, nickname, elo_rating')
                .order('elo_rating', { ascending: false })
                .order('full_name', { ascending: true })
                .limit(5)

            if (error) throw error

            const players = data || []
            if (players.length > 0) {
                setMaxElo(players[0].elo_rating)
            }
            setTopPlayers(players)
        } catch (error) {
            console.error('Error fetching stats:', error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h2 style={{ color: 'var(--primary)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    Líderes de la Cancha
                </h2>
                <p style={{ color: 'var(--text-dim)' }}>Los más cracks de la comunidad FutGO</p>
            </div>

            {loading ? (
                <div className="flex-center" style={{ minHeight: '40vh' }}>
                    <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {/* Top 5 Ranking */}
                    <section>
                        <h3 style={{ marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Medal size={24} style={{ color: 'var(--primary)' }} /> Top 5 Ranking
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {topPlayers.map((player, index) => {
                                const rank = index + 1
                                const isTop3 = rank <= 3
                                const medalColor = rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : 'var(--text-dim)'

                                return (
                                    <Card key={player.id} className="premium-card" style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '1.2rem',
                                        borderLeft: isTop3 ? `4px solid ${medalColor}` : '1px solid var(--border)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                            <div style={{
                                                fontSize: '1.5rem',
                                                fontWeight: '900',
                                                color: medalColor,
                                                width: '30px',
                                                textAlign: 'center'
                                            }}>
                                                {rank}
                                            </div>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                {getDisplayName(player)}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <div style={{
                                                fontSize: '1.2rem',
                                                fontWeight: 'bold',
                                                color: 'var(--primary)',
                                                background: 'rgba(var(--primary-rgb), 0.1)',
                                                padding: '0.3rem 0.8rem',
                                                borderRadius: '8px',
                                                minWidth: '60px',
                                                textAlign: 'center'
                                            }}>
                                                {getRating(player.elo_rating, maxElo)}
                                            </div>
                                            <Star size={18} fill={isTop3 ? medalColor : 'transparent'} color={isTop3 ? medalColor : 'var(--text-dim)'} />
                                        </div>
                                    </Card>
                                )
                            })}
                        </div>
                    </section>

                    {/* Future Stats Placeholders */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                        <Card style={{ padding: '1.5rem', opacity: 0.6, borderStyle: 'dashed' }} hover={false}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Goal size={20} /> Goleador del Mes
                            </h4>
                            <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Próximamente...</div>
                            </div>
                        </Card>
                        <Card style={{ padding: '1.5rem', opacity: 0.6, borderStyle: 'dashed' }} hover={false}>
                            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                                <Star size={20} /> Goleador del Año
                            </h4>
                            <div style={{ textAlign: 'center', padding: '1rem' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Próximamente...</div>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
