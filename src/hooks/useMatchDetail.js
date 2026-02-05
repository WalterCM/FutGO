import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export const useMatchDetail = (matchId, profile, onBack) => {
    const [match, setMatch] = useState(null)
    const [enrollments, setEnrollments] = useState([])
    const [games, setGames] = useState([])
    const [loading, setLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [actionLoading, setActionLoading] = useState(null)
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })

    // Store onBack in a ref to avoid re-triggering effects when the callback changes
    const onBackRef = useRef(onBack)
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    useEffect(() => {
        onBackRef.current = onBack
    }, [onBack])

    const showMsg = useCallback((type, text) => {
        setStatusMsg({ type, text })
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000)
    }, [])

    const fetchMatchDetails = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setIsRefreshing(true)

        try {
            // Fetch match
            const { data: matchData, error: matchError } = await supabase
                .from('matches')
                .select('*, field:fields(*), creator:profiles(full_name)')
                .eq('id', matchId)
                .single()

            if (matchError) throw matchError
            setMatch(matchData)

            // Fetch enrollments
            const { data: enrollData, error: enrollError } = await supabase
                .from('enrollments')
                .select('*, player:profiles(*)')
                .eq('match_id', matchId)
                .order('created_at', { ascending: true })

            if (enrollError) throw enrollError
            setEnrollments(enrollData)

            // Fetch games
            const { data: gamesData, error: gamesError } = await supabase
                .from('games')
                .select('*')
                .eq('match_day_id', matchId)
                .order('created_at', { ascending: false })

            // Note: games relationship might be different in actual schema, 
            // but MatchDetail uses it. Let's stick to what works.
            setGames(gamesData || [])

        } catch (error) {
            console.error('Error fetching match details:', error)
            showMsg('error', error.message)
            if (onBackRef.current && !silent) onBackRef.current()
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }, [matchId, showMsg])

    useEffect(() => {
        if (matchId) fetchMatchDetails()
    }, [matchId, fetchMatchDetails])

    const joinMatch = async () => {
        if (!profile) return
        setActionLoading('join')
        try {
            await Promise.all([
                supabase
                    .from('enrollments')
                    .insert([{
                        match_id: matchId,
                        player_id: profile.id
                    }]),
                wait(300)
            ]).then(([res]) => {
                if (res.error) throw res.error
            })
            showMsg('success', '¡Te has unido al encuentro!')
            await fetchMatchDetails(true)
        } catch (error) {
            showMsg('error', error.message)
        } finally {
            setActionLoading(null)
        }
    }

    const leaveMatch = async () => {
        if (!profile) return
        setActionLoading('leave')
        try {
            await Promise.all([
                supabase
                    .from('enrollments')
                    .delete()
                    .eq('match_id', matchId)
                    .eq('player_id', profile.id),
                wait(300)
            ]).then(([res]) => {
                if (res.error) throw res.error
            })
            showMsg('success', 'Has salido del encuentro')
            await fetchMatchDetails(true)
        } catch (error) {
            showMsg('error', error.message)
        } finally {
            setActionLoading(null)
        }
    }

    const updateEnrollment = async (enrolId, updates) => {
        try {
            const { error } = await supabase
                .from('enrollments')
                .update(updates)
                .eq('id', enrolId)

            if (error) throw error
            setEnrollments(prev => prev.map(e => e.id === enrolId ? { ...e, ...updates } : e))
        } catch (error) {
            showMsg('error', error.message)
        }
    }

    const togglePaid = async (enrol) => {
        const newPaid = !enrol.paid
        await updateEnrollment(enrol.id, {
            paid: newPaid,
            paid_at: newPaid ? new Date().toISOString() : null
        })
    }

    const togglePresent = async (enrol) => {
        await updateEnrollment(enrol.id, { is_present: !enrol.is_present })
    }

    const movePlayer = async (enrolId, teamId) => {
        await updateEnrollment(enrolId, { team_assignment: teamId })
    }

    const addGameResult = async (gameData) => {
        setActionLoading('game-form')
        try {
            const { error } = await supabase
                .from('games')
                .insert([{
                    score1: gameData.score1,
                    score2: gameData.score2,
                    team1_id: gameData.team1Id,
                    team2_id: gameData.team2Id,
                    match_day_id: matchId
                }])

            if (error) throw error
            showMsg('success', 'Resultado registrado')
            fetchMatchDetails(true)
            return true
        } catch (error) {
            showMsg('error', error.message)
            return false
        } finally {
            setActionLoading(null)
        }
    }

    const updateMatchCapacity = async (newMaxPlayers, newCost) => {
        setActionLoading('capacity')
        try {
            const { error } = await supabase
                .from('matches')
                .update({
                    max_players: newMaxPlayers,
                    fixed_cost: newCost
                })
                .eq('id', matchId)

            if (error) throw error
            showMsg('success', 'Capacidad actualizada')
            fetchMatchDetails(true)
        } catch (error) {
            showMsg('error', error.message)
        } finally {
            setActionLoading(null)
        }
    }

    const cancelMatch = async () => {
        setActionLoading('canceling')
        try {
            const { error } = await supabase
                .from('matches')
                .update({ is_canceled: true, is_locked: true })
                .eq('id', matchId)

            if (error) throw error
            showMsg('success', 'Partido cancelado')
            fetchMatchDetails(true)
        } catch (error) {
            showMsg('error', error.message)
        } finally {
            setActionLoading(null)
        }
    }

    const updateMatch = async (updates) => {
        try {
            const { error } = await supabase
                .from('matches')
                .update(updates)
                .eq('id', matchId)

            if (error) throw error
            // Update local state optimistically or via refresh
            setMatch(prev => ({ ...prev, ...updates }))
            return true
        } catch (error) {
            showMsg('error', error.message)
            return false
        }
    }

    return {
        match,
        enrollments,
        games,
        loading,
        isRefreshing,
        actionLoading,
        statusMsg,
        showMsg,
        joinMatch,
        leaveMatch,
        togglePaid,
        togglePresent,
        movePlayer,
        addGameResult,
        updateMatchCapacity,
        cancelMatch,
        updateMatch,
        refresh: () => fetchMatchDetails(true)
    }
}
