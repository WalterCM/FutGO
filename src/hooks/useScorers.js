import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

function getMonthRange(month, year) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = month === 12
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 1).padStart(2, '0')}-01`
    return { start, end }
}

function getYearRange(year) {
    return { start: `${year}-01-01`, end: `${year + 1}-01-01` }
}

function countGoals(games) {
    const goalCount = {}
    games.forEach(game => {
        if (!game.goals || !Array.isArray(game.goals)) return
        game.goals.forEach(goal => {
            if (goal.is_own_goal) return
            if (!goal.player_id) return
            goalCount[goal.player_id] = (goalCount[goal.player_id] || 0) + 1
        })
    })
    return goalCount
}

export function useMonthlyScorers(month, year) {
    const [scorers, setScorers] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalGoals, setTotalGoals] = useState(0)

    const fetchScorers = useCallback(async () => {
        setLoading(true)
        try {
            const { start, end } = getMonthRange(month, year)

            const { data: matchIds } = await supabase
                .from('matches')
                .select('id')
                .gte('date', start)
                .lt('date', end)
                .eq('is_canceled', false)
                .eq('is_locked', true)

            if (!matchIds || matchIds.length === 0) {
                setScorers([])
                setTotalGoals(0)
                return
            }

            const ids = matchIds.map(m => m.id)

            const { data: games } = await supabase
                .from('games')
                .select('goals')
                .in('match_day_id', ids)

            if (!games || games.length === 0) {
                setScorers([])
                setTotalGoals(0)
                return
            }

            const goalCount = countGoals(games)
            const playerIds = Object.keys(goalCount)

            if (playerIds.length === 0) {
                setScorers([])
                setTotalGoals(0)
                return
            }

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, nickname')
                .in('id', playerIds)

            const profileMap = {}
            if (profiles) {
                profiles.forEach(p => {
                    profileMap[p.id] = p.nickname || p.full_name || 'Jugador'
                })
            }

            const sorted = playerIds
                .map(id => ({
                    player_id: id,
                    name: profileMap[id] || 'Jugador',
                    goals: goalCount[id]
                }))
                .sort((a, b) => b.goals - a.goals)

            setScorers(sorted)
            setTotalGoals(sorted.reduce((sum, s) => sum + s.goals, 0))
        } catch (error) {
            console.error('Error fetching monthly scorers:', error)
            setScorers([])
            setTotalGoals(0)
        } finally {
            setLoading(false)
        }
    }, [month, year])

    useEffect(() => {
        fetchScorers()
    }, [fetchScorers])

    return { scorers, loading, totalGoals }
}

export function useYearlyScorers(year) {
    const [scorers, setScorers] = useState([])
    const [loading, setLoading] = useState(true)
    const [totalGoals, setTotalGoals] = useState(0)

    const fetchScorers = useCallback(async () => {
        setLoading(true)
        try {
            const { start, end } = getYearRange(year)

            const { data: matchIds } = await supabase
                .from('matches')
                .select('id')
                .gte('date', start)
                .lt('date', end)
                .eq('is_canceled', false)
                .eq('is_locked', true)

            if (!matchIds || matchIds.length === 0) {
                setScorers([])
                setTotalGoals(0)
                return
            }

            const ids = matchIds.map(m => m.id)

            const { data: games } = await supabase
                .from('games')
                .select('goals')
                .in('match_day_id', ids)

            if (!games || games.length === 0) {
                setScorers([])
                setTotalGoals(0)
                return
            }

            const goalCount = countGoals(games)
            const playerIds = Object.keys(goalCount)

            if (playerIds.length === 0) {
                setScorers([])
                setTotalGoals(0)
                return
            }

            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, nickname')
                .in('id', playerIds)

            const profileMap = {}
            if (profiles) {
                profiles.forEach(p => {
                    profileMap[p.id] = p.nickname || p.full_name || 'Jugador'
                })
            }

            const sorted = playerIds
                .map(id => ({
                    player_id: id,
                    name: profileMap[id] || 'Jugador',
                    goals: goalCount[id]
                }))
                .sort((a, b) => b.goals - a.goals)

            setScorers(sorted)
            setTotalGoals(sorted.reduce((sum, s) => sum + s.goals, 0))
        } catch (error) {
            console.error('Error fetching yearly scorers:', error)
            setScorers([])
            setTotalGoals(0)
        } finally {
            setLoading(false)
        }
    }, [year])

    useEffect(() => {
        fetchScorers()
    }, [fetchScorers])

    return { scorers, loading, totalGoals }
}

export { MONTH_NAMES }
