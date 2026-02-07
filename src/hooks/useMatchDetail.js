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

            // After fetching games, resolve any pending placeholders in elimination fixtures
            // This is handled inline here since we have direct access to standings computation

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

            // Get players for each team (prioritize passed lists, fallback to official assignments)
            const team1Players = gameData.team1_players || enrollments
                .filter(e => e.is_present && e.paid && e.team_assignment === gameData.team1Id)
                .map(e => e.player_id)

            const team2Players = gameData.team2_players || enrollments
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
                const currentFixture = match.fixtures.find(f => f.id === fixtureId)
                let nextFixtures = (match.fixtures || []).map(f =>
                    f.id === fixtureId ? { ...f, status: 'completed', score1: finalScore1, score2: finalScore2, gameId: newGame.id } : f
                )

                // Check if this is a winner_stays phase
                const isWinnerStaysPhase = currentFixture &&
                    match.phases?.find(p => p.id === currentFixture.phaseId)?.type === 'winner_stays'

                // Winner Stays: add next fixture for the loser to come back
                if (match.match_mode === 'winner_stays' || isWinnerStaysPhase) {
                    const winnerId = finalScore1 > finalScore2 ? gameData.team1Id : gameData.team2Id
                    const loserId = finalScore1 > finalScore2 ? gameData.team2Id : gameData.team1Id

                    // Get phase fixtures
                    const phaseId = currentFixture?.phaseId
                    const phaseFixtures = phaseId
                        ? nextFixtures.filter(f => f.phaseId === phaseId)
                        : nextFixtures

                    // Count completed fixtures to determine next Reto number
                    const completedFixtures = phaseFixtures.filter(f => f.status === 'completed')
                    const pendingFixtures = phaseFixtures.filter(f => f.status === 'pending')
                    const highestRetoNum = phaseFixtures.reduce((max, f) => {
                        const num = parseInt(f.label?.match(/Reto (\d+)/)?.[1] || '0')
                        return num > max ? num : max
                    }, 0)

                    // Always add new fixture for the loser to come back
                    // The loser will challenge the winner of the last pending fixture
                    const nextRetoNum = highestRetoNum + 1
                    const lastPendingFixture = pendingFixtures[pendingFixtures.length - 1]

                    if (lastPendingFixture) {
                        // Create new fixture: Winner of last pending vs Loser of current game
                        nextFixtures.push({
                            id: Math.random().toString(36).substr(2, 9),
                            team1Id: null,
                            team2Id: loserId,
                            status: 'pending',
                            label: `Reto ${nextRetoNum}`,
                            placeholder1: `Ganador Reto ${highestRetoNum}`,
                            phaseId: phaseId || undefined
                        })
                    }
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
            const updateData = {
                match_mode: mode
                // No automatically generated fixtures here anymore
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

    const generatePhaseFixtures = (phase) => {
        if (!match) return []
        const { type } = phase
        const playersPerTeam = match.field?.players_per_team || 5
        const maxPlayers = match.max_players || (playersPerTeam * 2)
        const numTeams = Math.max(2, Math.round(maxPlayers / playersPerTeam))

        const newFixtures = []
        if (type === 'liguilla') {
            for (let i = 1; i <= numTeams; i++) {
                for (let j = i + 1; j <= numTeams; j++) {
                    newFixtures.push({
                        id: Math.random().toString(36).substr(2, 9),
                        team1Id: i,
                        team2Id: j,
                        status: 'pending',
                        label: phase.name || 'Liguilla',
                        phaseId: phase.id
                    })
                }
            }
            newFixtures.sort(() => Math.random() - 0.5)
        } else if (type === 'tournament') {
            // Basic Elimination Bracket (1 vs 4, 2 vs 3, etc.)
            // If it's the first phase, we use team numbers. If not, we might use placeholders.
            // For now, let's assume it's an initial bracket if it's the only phase or first.
            const rounds = Math.ceil(Math.log2(numTeams))
            const totalSlots = Math.pow(2, rounds)

            // Simple 1st round generation
            for (let i = 0; i < totalSlots / 2; i++) {
                const t1 = i + 1
                const t2 = totalSlots - i

                newFixtures.push({
                    id: Math.random().toString(36).substr(2, 9),
                    team1Id: t1 <= numTeams ? t1 : null,
                    team2Id: t2 <= numTeams ? t2 : null,
                    status: 'pending',
                    label: totalSlots === 4 ? 'Semifinal' : totalSlots === 2 ? 'Final' : `Ronda 1`,
                    phaseId: phase.id,
                    placeholder1: t1 > numTeams ? 'BYE' : null,
                    placeholder2: t2 > numTeams ? 'BYE' : null
                })
            }
        } else if (type === 'winner_stays') {
            // M1: T1 vs T2
            newFixtures.push({
                id: `ws-1-${Math.random().toString(36).substr(2, 5)}`,
                team1Id: 1,
                team2Id: 2,
                status: 'pending',
                label: 'Reto 1',
                phaseId: phase.id
            })

            // Placeholder matches for the rest of the teams
            for (let i = 3; i <= numTeams; i++) {
                newFixtures.push({
                    id: `ws-${i - 1}-${Math.random().toString(36).substr(2, 5)}`,
                    team1Id: null, // Winner stays
                    team2Id: i,
                    status: 'pending',
                    label: `Reto ${i - 1}`,
                    placeholder1: `Ganador Reto ${i - 2}`,
                    phaseId: phase.id
                })
            }
        } else if (type === 'tournament_random') {
            // Shuffle team IDs for random pairings
            const teamIds = Array.from({ length: numTeams }, (_, i) => i + 1)
            for (let i = teamIds.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [teamIds[i], teamIds[j]] = [teamIds[j], teamIds[i]]
            }

            // Create matches from shuffled pairs
            for (let i = 0; i < teamIds.length; i += 2) {
                if (teamIds[i + 1]) {
                    newFixtures.push({
                        id: Math.random().toString(36).substr(2, 9),
                        team1Id: teamIds[i],
                        team2Id: teamIds[i + 1],
                        status: 'pending',
                        label: numTeams <= 4 ? 'Semifinal' : `Ronda 1`,
                        phaseId: phase.id
                    })
                }
            }
        } else if (type === 'tournament_standings') {
            // Generate placeholders based on standings positions
            // For 4 teams: 1º vs 4º, 2º vs 3º
            // For 2 teams: 1º vs 2º (final)
            if (numTeams >= 4) {
                // Semifinals: 1v4, 2v3
                newFixtures.push({
                    id: Math.random().toString(36).substr(2, 9),
                    team1Id: null,
                    team2Id: null,
                    status: 'pending',
                    label: 'Semifinal 1',
                    placeholder1: '1º de Liguilla',
                    placeholder2: '4º de Liguilla',
                    phaseId: phase.id
                })
                newFixtures.push({
                    id: Math.random().toString(36).substr(2, 9),
                    team1Id: null,
                    team2Id: null,
                    status: 'pending',
                    label: 'Semifinal 2',
                    placeholder1: '2º de Liguilla',
                    placeholder2: '3º de Liguilla',
                    phaseId: phase.id
                })
                // Final placeholder
                newFixtures.push({
                    id: Math.random().toString(36).substr(2, 9),
                    team1Id: null,
                    team2Id: null,
                    status: 'pending',
                    label: 'Gran Final',
                    placeholder1: 'Ganador SF1',
                    placeholder2: 'Ganador SF2',
                    phaseId: phase.id
                })
            } else {
                // Just a final: 1º vs 2º
                newFixtures.push({
                    id: Math.random().toString(36).substr(2, 9),
                    team1Id: null,
                    team2Id: null,
                    status: 'pending',
                    label: 'Gran Final',
                    placeholder1: '1º de Liguilla',
                    placeholder2: '2º de Liguilla',
                    phaseId: phase.id
                })
            }
        } else if (type === 'tournament_manual') {
            // No auto-generation. User adds fixtures manually.
        }
        return newFixtures
    }

    const addPhase = async (type, name) => {
        if (type === 'semis' || type === 'finals') {
            return addKnockoutPhase(type)
        }
        setActionLoading('phase')
        try {
            const newPhase = {
                id: Math.random().toString(36).substr(2, 9),
                type,
                name: name || (type === 'liguilla' ? 'Liguilla' : type === 'tournament' ? 'Fase de Grupos' : type === 'winner_stays' ? 'Ganador Queda' : 'Fase Libre'),
                status: 'pending',
                created_at: new Date().toISOString()
            }

            const currentPhases = Array.isArray(match.phases) ? match.phases : []
            const nextPhases = [...currentPhases, newPhase]

            const { error } = await supabase
                .from('matches')
                .update({ phases: nextPhases })
                .eq('id', matchId)

            if (error) throw error
            setMatch(prev => ({ ...prev, phases: nextPhases }))
            showMsg('success', 'Fase añadida')
        } catch (error) {
            showMsg('error', 'Error al añadir fase')
        } finally {
            setActionLoading(null)
        }
    }

    const removePhase = async (phaseId) => {
        setActionLoading('phase')
        try {
            const nextPhases = match.phases.filter(p => p.id !== phaseId)
            const nextFixtures = (match.fixtures || []).filter(f => f.phaseId !== phaseId)

            const { error } = await supabase
                .from('matches')
                .update({ phases: nextPhases, fixtures: nextFixtures })
                .eq('id', matchId)

            if (error) throw error
            setMatch(prev => ({ ...prev, phases: nextPhases, fixtures: nextFixtures }))
            showMsg('success', 'Fase eliminada')
        } catch (error) {
            showMsg('error', 'Error al eliminar fase')
        } finally {
            setActionLoading(null)
        }
    }

    const generateFixtures = async (phaseId) => {
        setActionLoading('fixtures')
        const phase = match.phases.find(p => p.id === phaseId)
        if (!phase) return

        const newFixtures = generatePhaseFixtures(phase)
        const updatedPhases = match.phases.map(p =>
            p.id === phaseId ? { ...p, status: 'in_progress' } : p
        )

        try {
            const { error } = await supabase
                .from('matches')
                .update({
                    fixtures: [...(match.fixtures || []), ...newFixtures],
                    phases: updatedPhases
                })
                .eq('id', matchId)

            if (error) throw error
            setMatch(prev => ({
                ...prev,
                fixtures: [...(prev.fixtures || []), ...newFixtures],
                phases: updatedPhases
            }))
            showMsg('success', 'Encuentros generados')
        } catch (error) {
            showMsg('error', 'Error generando encuentros')
        } finally {
            setActionLoading(null)
        }
    }

    const addManualFixture = async (phaseId, team1Id, team2Id, label = 'Partido') => {
        const newFixture = {
            id: Math.random().toString(36).substr(2, 9),
            team1Id: team1Id || null,
            team2Id: team2Id || null,
            status: 'pending',
            label,
            phaseId
        }

        setActionLoading('fixtures')
        try {
            const nextFixtures = [...(match.fixtures || []), newFixture]
            const { error } = await supabase
                .from('matches')
                .update({ fixtures: nextFixtures })
                .eq('id', matchId)

            if (error) throw error
            setMatch(prev => ({ ...prev, fixtures: nextFixtures }))
            showMsg('success', 'Encuentro añadido')
        } catch (error) {
            showMsg('error', 'Error al añadir encuentro')
        } finally {
            setActionLoading(null)
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

    const getStandings = useCallback(() => {
        if (!match || !games.length) return []

        const stats = {}
        const playersPerTeam = match.field?.players_per_team || 5
        const maxPlayers = match.max_players || (playersPerTeam * 2)
        const numTeams = Math.max(2, Math.round(maxPlayers / playersPerTeam))

        // Initialize all teams
        for (let i = 1; i <= numTeams; i++) {
            stats[i] = { teamId: i, points: 0, goalDiff: 0, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
        }

        // Get liguilla phase IDs (only count games from round-robin phases)
        const liguillaPhaseIds = (match.phases || [])
            .filter(p => p.type === 'liguilla')
            .map(p => p.id)

        // Get liguilla fixture IDs for filtering
        const liguillaFixtureIds = new Set(
            (match.fixtures || [])
                .filter(f => liguillaPhaseIds.includes(f.phaseId))
                .map(f => f.id)
        )

        // Only count games that are linked to liguilla fixtures
        // Or games without a fixture_id (legacy games)
        const liguillaGames = games.filter(g =>
            !g.fixture_id || liguillaFixtureIds.has(g.fixture_id)
        )

        // Accumulate stats from liguilla games only
        liguillaGames.forEach(g => {
            const t1 = g.team1_id, t2 = g.team2_id
            if (!stats[t1] || !stats[t2]) return

            stats[t1].played++
            stats[t2].played++
            stats[t1].goalsFor += g.score1
            stats[t1].goalsAgainst += g.score2
            stats[t2].goalsFor += g.score2
            stats[t2].goalsAgainst += g.score1
            stats[t1].goalDiff += (g.score1 - g.score2)
            stats[t2].goalDiff += (g.score2 - g.score1)

            if (g.score1 > g.score2) {
                stats[t1].points += 3
                stats[t1].wins++
                stats[t2].losses++
            } else if (g.score1 < g.score2) {
                stats[t2].points += 3
                stats[t2].wins++
                stats[t1].losses++
            } else {
                stats[t1].points += 1
                stats[t2].points += 1
                stats[t1].draws++
                stats[t2].draws++
            }
        })

        return Object.values(stats).sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff)
    }, [match, games])

    const addKnockoutPhase = async (type) => {
        const sorted = getStandings()
        if (sorted.length < 2) return

        const phaseId = Math.random().toString(36).substr(2, 9)
        const knockoutMatches = []

        if (type === 'semis' && sorted.length >= 4) {
            knockoutMatches.push({
                id: `semi-1-${Date.now()}`,
                team1Id: sorted[0].teamId, // 1st
                team2Id: sorted[3].teamId, // 4th
                status: 'pending',
                label: 'Semifinal 1',
                phaseId
            })
            knockoutMatches.push({
                id: `semi-2-${Date.now()}`,
                team1Id: sorted[1].teamId, // 2nd
                team2Id: sorted[2].teamId, // 3rd
                status: 'pending',
                label: 'Semifinal 2',
                phaseId
            })
        } else {
            // Default to Finals (can be called directly or after semis)
            if (sorted.length >= 4) {
                knockoutMatches.push({
                    id: `final-3rd-${Date.now()}`,
                    team1Id: sorted[2].teamId,
                    team2Id: sorted[3].teamId,
                    status: 'pending',
                    label: '3er Puesto 🥉',
                    phaseId
                })
            }
            knockoutMatches.push({
                id: `final-gold-${Date.now()}`,
                team1Id: sorted[0].teamId,
                team2Id: sorted[1].teamId,
                status: 'pending',
                label: '¡Gran Final! 🏆',
                phaseId
            })
        }

        const newPhase = {
            id: phaseId,
            type: 'knockout',
            name: type === 'semis' ? 'Semifinales' : 'Gran Final 🏆',
            status: 'in_progress',
            created_at: new Date().toISOString()
        }

        const currentPhases = Array.isArray(match.phases) ? match.phases : []
        const nextPhases = [...currentPhases, newPhase]
        const nextFixtures = [...(match.fixtures || []), ...knockoutMatches]

        try {
            setActionLoading('phase')
            const { error } = await supabase
                .from('matches')
                .update({
                    phases: nextPhases,
                    fixtures: nextFixtures
                })
                .eq('id', matchId)

            if (error) throw error
            setMatch(prev => ({
                ...prev,
                phases: nextPhases,
                fixtures: nextFixtures
            }))
            showMsg('success', type === 'semis' ? 'Semifinales generadas' : 'Finales generadas')
        } catch (error) {
            showMsg('error', 'Error al generar fase')
        } finally {
            setActionLoading(null)
        }
    }

    // Resolve placeholders in elimination fixtures based on standings
    // Also resolves Ganador Queda placeholders based on game results
    const resolveEliminationPlaceholders = useCallback(async () => {
        if (!match?.fixtures?.length || !match?.phases?.length) return

        let hasChanges = false
        let updatedFixtures = [...match.fixtures]

        // Check if liguilla phase is complete
        const liguillaPhases = match.phases.filter(p => p.type === 'liguilla')
        let liguillaComplete = false

        if (liguillaPhases.length > 0) {
            const liguillaFixtures = match.fixtures.filter(f =>
                liguillaPhases.some(p => p.id === f.phaseId)
            )
            const completedLiguillaFixtures = liguillaFixtures.filter(f => f.status === 'completed')
            liguillaComplete = liguillaFixtures.length > 0 &&
                completedLiguillaFixtures.length === liguillaFixtures.length
        }

        // Only build standings map if liguilla is complete
        const positionMap = {}
        if (liguillaComplete) {
            const standings = getStandings()
            if (standings[0]) positionMap['1º de Liguilla'] = standings[0].teamId
            if (standings[1]) positionMap['2º de Liguilla'] = standings[1].teamId
            if (standings[2]) positionMap['3º de Liguilla'] = standings[2].teamId
            if (standings[3]) positionMap['4º de Liguilla'] = standings[3].teamId
        }

        // Build a map of fixture IDs to their winners (from completed fixtures)
        const fixtureWinners = {}
        match.fixtures.forEach(f => {
            if (f.status === 'completed' && f.score1 !== undefined && f.score2 !== undefined) {
                if (f.score1 > f.score2) {
                    fixtureWinners[f.id] = f.team1Id
                } else if (f.score2 > f.score1) {
                    fixtureWinners[f.id] = f.team2Id
                }
            }
        })

        updatedFixtures = updatedFixtures.map((f) => {
            const updated = { ...f }

            // Resolve position placeholders (only if liguilla is complete)
            if (liguillaComplete) {
                if (f.placeholder1 && positionMap[f.placeholder1] && !f.team1Id) {
                    updated.team1Id = positionMap[f.placeholder1]
                    hasChanges = true
                }
                if (f.placeholder2 && positionMap[f.placeholder2] && !f.team2Id) {
                    updated.team2Id = positionMap[f.placeholder2]
                    hasChanges = true
                }
            }

            // Resolve Ganador Queda placeholders (winner of previous match)
            if (f.placeholder1 && f.placeholder1.startsWith('Ganador Reto') && !f.team1Id) {
                const retoMatch = f.placeholder1.match(/Ganador Reto (\d+)/)
                if (retoMatch) {
                    const prevRetoNum = parseInt(retoMatch[1])
                    const prevFixture = match.fixtures.find(pf =>
                        pf.label === `Reto ${prevRetoNum}` && pf.phaseId === f.phaseId
                    )
                    if (prevFixture && fixtureWinners[prevFixture.id]) {
                        updated.team1Id = fixtureWinners[prevFixture.id]
                        hasChanges = true
                    }
                }
            }

            // Resolve semifinal winner placeholders for finals
            if (f.placeholder1 === 'Ganador SF1' && !f.team1Id) {
                const sf1 = match.fixtures.find(x => x.label === 'Semifinal 1' && x.phaseId === f.phaseId)
                if (sf1 && fixtureWinners[sf1.id]) {
                    updated.team1Id = fixtureWinners[sf1.id]
                    hasChanges = true
                }
            }
            if (f.placeholder2 === 'Ganador SF2' && !f.team2Id) {
                const sf2 = match.fixtures.find(x => x.label === 'Semifinal 2' && x.phaseId === f.phaseId)
                if (sf2 && fixtureWinners[sf2.id]) {
                    updated.team2Id = fixtureWinners[sf2.id]
                    hasChanges = true
                }
            }

            return updated
        })

        if (hasChanges) {
            try {
                const { error } = await supabase
                    .from('matches')
                    .update({ fixtures: updatedFixtures })
                    .eq('id', matchId)

                if (error) throw error
                setMatch(prev => ({ ...prev, fixtures: updatedFixtures }))
            } catch (error) {
                console.error('Error resolving placeholders:', error)
            }
        }
    }, [match, matchId, getStandings])

    // Auto-resolve placeholders whenever fixture statuses change
    const completedFixtureCount = match?.fixtures?.filter(f => f.status === 'completed').length || 0
    useEffect(() => {
        if (completedFixtureCount > 0 && match?.fixtures?.length > 0) {
            resolveEliminationPlaceholders()
        }
    }, [completedFixtureCount])

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
        addPhase,
        removePhase,
        addManualFixture,
        addFinals: addKnockoutPhase,
        addKnockoutPhase,
        getStandings,
        resolveEliminationPlaceholders,
        updateMatchCapacity,
        cancelMatch,
        updateMatch,
        randomizeTeams,
        refresh: () => fetchMatchDetails(true)
    }
}
