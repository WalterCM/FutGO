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
            const { data: gamesData, error: gamesErr } = await supabase
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
        const isPresent = !enrol.is_present
        await updateEnrollment(enrol.id, {
            is_present: isPresent,
            present_at: isPresent ? new Date().toISOString() : null
        })
    }

    const movePlayer = async (enrolId, teamId) => {
        await updateEnrollment(enrolId, { team_assignment: teamId })
    }

    const addGameResult = async (gameData, fixtureId = null) => {
        setActionLoading('game-form')
        try {
            // If goals array is provided, calculate scores automatically
            let finalScore1 = gameData.score1 || 0
            let finalScore2 = gameData.score2 || 0

            if (gameData.goals && gameData.goals.length > 0) {
                finalScore1 = gameData.goals.filter(g => g.team_id === gameData.team1Id).length
                finalScore2 = gameData.goals.filter(g => g.team_id === gameData.team2Id).length
            }

            // Get players for each team (only present and paid)
            const team1Players = enrollments
                .filter(e => e.is_present && e.paid && e.team_assignment === gameData.team1Id)
                .map(e => e.player_id)

            const team2Players = enrollments
                .filter(e => e.is_present && e.paid && e.team_assignment === gameData.team2Id)
                .map(e => e.player_id)

            const { data: gameDataRes, error } = await supabase
                .from('games')
                .insert([{
                    score1: finalScore1,
                    score2: finalScore2,
                    team1_id: gameData.team1Id,
                    team2_id: gameData.team2Id,
                    team1_players: team1Players,
                    team2_players: team2Players,
                    match_day_id: matchId,
                    goals: gameData.goals || [],
                    fixture_id: fixtureId
                }])
                .select()

            if (error) throw error
            const newGame = gameDataRes[0]

            // Update fixture status if linked
            if (fixtureId && match.fixtures) {
                const nextFixtures = (match.fixtures || []).map(f =>
                    f.id === fixtureId ? { ...f, status: 'completed', score1: finalScore1, score2: finalScore2, gameId: newGame.id } : f
                )

                // Winner Stays auto-generation
                if (match.match_mode === 'winner_stays') {
                    const winnerId = finalScore1 > finalScore2 ? gameData.team1Id : gameData.team2Id

                    // Logic to find next challenger (T3, then T4... then T1)
                    const playersPerTeam = match.field?.players_per_team || 5
                    const maxPlayers = match.max_players || (playersPerTeam * 2)
                    const numTeams = Math.max(2, Math.round(maxPlayers / playersPerTeam))

                    // Find the last used team ID that isn't the winner
                    const lastOpponentId = finalScore1 > finalScore2 ? gameData.team2Id : gameData.team1Id
                    let nextChallengerId = (lastOpponentId % numTeams) + 1
                    if (nextChallengerId === winnerId) {
                        nextChallengerId = (nextChallengerId % numTeams) + 1
                    }

                    nextFixtures.push({
                        id: Math.random().toString(36).substr(2, 9),
                        team1Id: winnerId,
                        team2Id: nextChallengerId,
                        status: 'pending',
                        label: 'Ganador se Queda'
                    })
                }

                await supabase.from('matches').update({ fixtures: nextFixtures }).eq('id', matchId)
            }

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

    const deleteGameResult = async (gameId, fixtureId = null) => {
        setActionLoading('delete-game')
        try {
            const { error } = await supabase.from('games').delete().eq('id', gameId)
            if (error) throw error

            if (fixtureId && match.fixtures) {
                const nextFixtures = (match.fixtures || []).map(f =>
                    f.id === fixtureId ? { ...f, status: 'pending', score1: null, score2: null } : f
                )
                // If it was Winner Stays, we might want to remove the auto-generated next match too
                // But for now, let's just reset the current one.
                await supabase.from('matches').update({ fixtures: nextFixtures }).eq('id', matchId)
            }

            showMsg('success', 'Partido eliminado')
            fetchMatchDetails(true)
        } catch (error) {
            showMsg('error', error.message)
        } finally {
            setActionLoading(null)
        }
    }

    const updateMatchMode = async (mode) => {
        setActionLoading('mode')
        try {
            const nextFixtures = mode !== 'free' ? generateFixturesHelper(mode) : []
            const updateData = {
                match_mode: mode,
                fixtures: nextFixtures
            }

            const { error } = await supabase
                .from('matches')
                .update(updateData)
                .eq('id', matchId)

            if (error) throw error
            setMatch(prev => ({ ...prev, ...updateData }))
            showMsg('success', `Modo cambiado a ${mode}`)
        } catch (error) {
            showMsg('error', error.message)
        } finally {
            setActionLoading(null)
        }
    }

    const generateFixturesHelper = (mode) => {
        if (!match) return []

        const playersPerTeam = match.field?.players_per_team || 5
        const maxPlayers = match.max_players || (playersPerTeam * 2)
        const numTeams = Math.max(2, Math.round(maxPlayers / playersPerTeam))

        const newFixtures = []
        if (mode === 'liguilla' || mode === 'tournament') {
            for (let i = 1; i <= numTeams; i++) {
                for (let j = i + 1; j <= numTeams; j++) {
                    newFixtures.push({
                        id: Math.random().toString(36).substr(2, 9),
                        team1Id: i,
                        team2Id: j,
                        status: 'pending',
                        label: 'Fase de Grupos'
                    })
                }
            }
            newFixtures.sort(() => Math.random() - 0.5)
        } else if (mode === 'winner_stays') {
            newFixtures.push({
                id: Math.random().toString(36).substr(2, 9),
                team1Id: 1,
                team2Id: 2,
                status: 'pending',
                label: 'Partido Inaugural'
            })
        }
        return newFixtures
    }

    const generateFixtures = async (mode) => {
        const newFixtures = generateFixturesHelper(mode)
        try {
            const { error } = await supabase
                .from('matches')
                .update({ fixtures: newFixtures })
                .eq('id', matchId)
            if (error) throw error
            setMatch(prev => ({ ...prev, fixtures: newFixtures }))
        } catch (error) {
            showMsg('error', 'Error generando encuentros')
        }
    }

    const updateFixtures = async (newFixtures) => {
        try {
            const { error } = await supabase
                .from('matches')
                .update({ fixtures: newFixtures })
                .eq('id', matchId)
            if (error) throw error
            setMatch(prev => ({ ...prev, fixtures: newFixtures }))
        } catch (error) {
            showMsg('error', 'Error actualizando el fixture')
        }
    }

    const addFinals = async () => {
        if (!match || !games.length) return

        // Simplified standings calculation
        const stats = {}
        const playersPerTeam = match.field?.players_per_team || 5
        const maxPlayers = match.max_players || (playersPerTeam * 2)
        const numTeams = Math.max(2, Math.round(maxPlayers / playersPerTeam))

        for (let i = 1; i <= numTeams; i++) stats[i] = { id: i, pts: 0, gd: 0 }
        games.forEach(g => {
            const t1 = g.team1_id, t2 = g.team2_id
            if (g.score1 > g.score2) stats[t1].pts += 3
            else if (g.score1 < g.score2) stats[t2].pts += 3
            else { stats[t1].pts += 1; stats[t2].pts += 1 }
            stats[t1].gd += (g.score1 - g.score2)
            stats[t2].gd += (g.score2 - g.score1)
        })

        const sorted = Object.values(stats).sort((a, b) => b.pts - a.pts || b.gd - a.gd)

        const finalMatches = []
        if (numTeams >= 4) {
            finalMatches.push({
                id: 'final-3rd',
                team1Id: sorted[2].id,
                team2Id: sorted[3].id,
                status: 'pending',
                label: '3er Puesto 🥉'
            })
        }
        finalMatches.push({
            id: 'final-gold',
            team1Id: sorted[0].id,
            team2Id: sorted[1].id,
            status: 'pending',
            label: '¡Gran Final! 🏆'
        })

        const nextFixtures = [...(match.fixtures || []), ...finalMatches]
        await updateFixtures(nextFixtures)
        showMsg('success', 'Finales generadas')
    }

    const updateMatchCapacity = async (newMaxPlayers, newCost, newTeamConfigs = null) => {
        setActionLoading('capacity')
        try {
            const updates = {
                max_players: newMaxPlayers,
                fixed_cost: newCost
            }
            if (newTeamConfigs) {
                updates.team_configs = newTeamConfigs
            }

            const { error } = await supabase
                .from('matches')
                .update(updates)
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

    const randomizeTeams = async (numTeams, kitLibrary = []) => {
        setActionLoading('randomizing')
        try {
            // 1. Get present players and SORT BY ARRIVAL (First in, first out)
            const presentEnrollments = [...enrollments]
                .filter(e => e.is_present)
                .sort((a, b) => new Date(a.present_at) - new Date(b.present_at))

            if (presentEnrollments.length === 0) {
                throw new Error('No hay jugadores marcados como "Presente"')
            }

            // 2. Business Logic: Determine how many full teams can be formed
            const playersPerTeam = match?.field?.players_per_team || 5
            const teamsToFill = Math.min(numTeams, Math.floor(presentEnrollments.length / playersPerTeam))
            const maxParticipantsCount = teamsToFill * playersPerTeam

            if (maxParticipantsCount === 0) {
                throw new Error(`No hay suficientes jugadores para formar al menos un equipo de ${playersPerTeam}`)
            }

            // 3. Selection: Take strictly the first X people who arrived
            const participants = presentEnrollments.slice(0, maxParticipantsCount)

            // 4. Balanced Shuffle (ELO Jitter) of ONLY the selected participants
            const sortedByElo = [...participants].sort((a, b) => {
                const jitterA = (Math.random() * 200) - 100
                const jitterB = (Math.random() * 200) - 100
                const scoreA = (a.player?.elo_rating || 1000) + jitterA
                const scoreB = (b.player?.elo_rating || 1000) + jitterB
                return scoreB - scoreA
            })

            const updates = []

            // 5. Assign ONLY selected participants (Snake Draft)
            sortedByElo.forEach((enrol, index) => {
                // Alternating assignment for balance
                // 0, 1, 2, 2, 1, 0, 0, 1, 2... (Snake)
                const cycle = teamsToFill * 2
                const pos = index % cycle
                let teamId
                if (pos < teamsToFill) {
                    teamId = pos + 1
                } else {
                    teamId = cycle - pos
                }

                updates.push(
                    supabase
                        .from('enrollments')
                        .update({ team_assignment: teamId })
                        .eq('id', enrol.id)
                )
            })

            // 6. Move LATE ARRIVALS and ABSENT to Bench (Team 0)
            const participantIds = participants.map(p => p.id)
            const benchEnrollments = enrollments.filter(e => !participantIds.includes(e.id))

            if (benchEnrollments.length > 0) {
                updates.push(
                    supabase
                        .from('enrollments')
                        .update({ team_assignment: 0 })
                        .in('id', benchEnrollments.map(e => e.id))
                )
            }

            // 3. Assign Kits if missing
            const currentConfigs = { ...(match.team_configs || {}) }
            let configsChanged = false

            if (kitLibrary.length > 0) {
                for (let i = 1; i <= numTeams; i++) {
                    if (!currentConfigs[i] || !currentConfigs[i].bg || currentConfigs[i].bg.includes('rgba')) {
                        // Use a kit from library not already taken
                        const takenKits = Object.values(currentConfigs).map(c => c.name)
                        const availableKits = kitLibrary.filter(k => !takenKits.includes(k.name))
                        const pool = availableKits.length > 0 ? availableKits : kitLibrary
                        currentConfigs[i] = pool[Math.floor(Math.random() * pool.length)]
                        configsChanged = true
                    }
                }
            }

            if (configsChanged) {
                updates.push(
                    supabase
                        .from('matches')
                        .update({ team_configs: currentConfigs })
                        .eq('id', matchId)
                )
            }

            await Promise.all(updates)
            showMsg('success', 'Equipos balanceados y colores asignados 🎲⚽')
            await fetchMatchDetails(true)
        } catch (error) {
            showMsg('error', error.message)
        } finally {
            setActionLoading(null)
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
        deleteGameResult,
        updateMatchMode,
        generateFixtures,
        updateFixtures,
        addFinals,
        updateMatchCapacity,
        cancelMatch,
        updateMatch,
        randomizeTeams,
        refresh: () => fetchMatchDetails(true)
    }
}
