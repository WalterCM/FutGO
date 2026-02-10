import React, { useState, useEffect, useCallback, memo } from 'react'
import { supabase } from '../lib/supabase'
import { Calendar, Activity, Star } from 'lucide-react'

export const useDashboardStats = (profileId) => {
  const [stats, setStats] = useState({
    nextMatch: null,
    gamesPlayed: 0,
    goals: 0,
    loading: true
  })

  const fetchDashboardData = useCallback(async () => {
    if (!profileId) return

    try {
      // 1. Fetch Next Match (Closest upcoming)
      const { data: nextMatch } = await supabase
        .from('matches')
        .select('*, field:fields(*)')
        .gte('date', new Date().toISOString().split('T')[0])
        .eq('is_canceled', false)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(1)
        .maybeSingle()

      // 2. Fetch Games Played (Enrolled + Present)
      const { count: gamesPlayed } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('player_id', profileId)
        .eq('is_present', true)

      // 3. Fetch Goals (from completed games where user played)
      const { data: games } = await supabase
        .from('games')
        .select('goals')
        .or(`team1_players.cs.{${profileId}},team2_players.cs.{${profileId}}`)
        .eq('is_completed', true)

      let totalGoals = 0
      if (games) {
        games.forEach(g => {
          if (g.goals && Array.isArray(g.goals)) {
            g.goals.forEach(goal => {
              if (goal.player_id === profileId) {
                totalGoals++
              }
            })
          }
        })
      }

      setStats({
        nextMatch,
        gamesPlayed: gamesPlayed || 0,
        goals: totalGoals,
        loading: false
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }, [profileId])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return stats
}

export const NextMatchCard = memo(({ nextMatch, onMatchClick, navigate }) => {
  if (!nextMatch) {
    return (
      <section className="premium-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} /> Próximo Partido
        </h3>
        <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No hay partidos programados pronto.</p>
          <button
            className="btn-primary"
            style={{ padding: '0.6rem 1.2rem', marginTop: '1rem', borderRadius: '10px' }}
            onClick={() => navigate('/partidos')}
          >
            Explorar Partidos
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="premium-card">
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Calendar size={20} /> Próximo Partido
      </h3>
      <div style={{ margin: '1rem 0' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
          {nextMatch.field?.name || 'Cancha por confirmar'}
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
          {new Date(nextMatch.date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} • {nextMatch.time.substring(0, 5)} hrs
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          className="btn-primary"
          style={{ padding: '0.6rem 1.2rem', borderRadius: '10px' }}
          onClick={() => onMatchClick(nextMatch)}
        >
          Ver Detalles
        </button>
      </div>
    </section>
  )
})

export const StatsCard = memo(({ title, value, subtitle, icon }) => (
  <section className="premium-card">
    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {icon} {title}
    </h3>
    <div style={{ fontSize: '3rem', fontWeight: '900', margin: '0.5rem 0', color: 'var(--primary)', lineHeight: 1 }}>
      {value}
    </div>
    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{subtitle}</p>
  </section>
))