import React from 'react'
import { FastForward, Play, Info, Settings } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

const FixtureSuggester = ({
    matchMode,
    numTeams,
    games,
    teamConfigs,
    onStartMatch,
    canManage,
    onUpdateMode
}) => {
    // Logic to determine the next match
    const getNextMatch = () => {
        if (numTeams < 2) return null

        if (matchMode === 'winner_stays') {
            if (games.length === 0) return { team1Id: 1, team2Id: 2, label: 'Partido Inaugural' }

            const lastGame = games[0] // Assuming games are sorted by created_at desc
            const winnerId = lastGame.score1 > lastGame.score2 ? lastGame.team1_id : lastGame.team2_id

            // Next team is (lastTeamId % numTeams) + 1, unless it's the winner
            let nextTeamId = (Math.max(lastGame.team1_id, lastGame.team2_id) % numTeams) + 1
            if (nextTeamId === winnerId) nextTeamId = (nextTeamId % numTeams) + 1

            return { team1Id: winnerId, team2Id: nextTeamId, label: 'Ganador se Queda' }
        }

        if (matchMode === 'liguilla' || matchMode === 'tournament') {
            // Generate all possible pairings
            const pairings = []
            for (let i = 1; i <= numTeams; i++) {
                for (let j = i + 1; j <= numTeams; j++) {
                    pairings.push({ team1Id: i, team2Id: j })
                }
            }

            // Find pairings not yet played
            const playedPairings = games.map(g => {
                const ids = [g.team1_id, g.team2_id].sort()
                return ids.join('-')
            })

            const unplayed = pairings.filter(p => !playedPairings.includes(`${p.team1Id}-${p.team2Id}`))

            if (unplayed.length > 0) {
                return { ...unplayed[0], label: `Fase de Grupos (${pairings.length - unplayed.length + 1}/${pairings.length})` }
            }

            // Liguilla finished. If tournament, suggest Final/3rd Place
            if (matchMode === 'tournament' && numTeams >= 3) {
                // Calculate standings
                const stats = {}
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

                // Check if 3rd place already played
                const thirdPlayed = games.some(g =>
                    (g.team1_id === sorted[2]?.id && g.team2_id === sorted[3]?.id) ||
                    (g.team1_id === sorted[3]?.id && g.team2_id === sorted[2]?.id)
                )

                if (numTeams >= 4 && !thirdPlayed) {
                    return { team1Id: sorted[2].id, team2Id: sorted[3].id, label: 'Tercer Puesto 🥉' }
                }

                // Check if final already played
                const finalPlayed = games.some(g =>
                    (g.team1_id === sorted[0]?.id && g.team2_id === sorted[1]?.id) ||
                    (g.team1_id === sorted[1]?.id && g.team2_id === sorted[0]?.id)
                )

                if (!finalPlayed) {
                    return { team1Id: sorted[0].id, team2Id: sorted[1].id, label: '¡Gran Final! 🏆' }
                }
            }

            // Fallback: If everything finished or no logic, suggest winner stays or just repeat liguilla
            return { team1Id: 1, team2Id: 2, label: 'Ronda Extra' }
        }

        return null
    }

    const nextMatch = getNextMatch()

    const modes = [
        { id: 'liguilla', name: 'Liguilla', desc: 'Todos vs Todos' },
        { id: 'tournament', name: 'Mundialito', desc: 'Grupos + Finales' },
        { id: 'winner_stays', name: 'Ganador Queda', desc: 'El que gana sigue' }
    ]

    return (
        <Card style={{ marginBottom: '2rem', border: '1px solid var(--primary)', background: 'rgba(var(--primary-rgb), 0.05)' }} hover={false}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <FastForward size={18} color="var(--primary)" />
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>
                            Próximo Encuentro
                        </span>
                    </div>
                    {nextMatch ? (
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span style={{ color: teamConfigs[nextMatch.team1Id]?.color }}>{teamConfigs[nextMatch.team1Id]?.name}</span>
                            <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>VS</span>
                            <span style={{ color: teamConfigs[nextMatch.team2Id]?.color }}>{teamConfigs[nextMatch.team2Id]?.name}</span>
                        </h3>
                    ) : (
                        <h3 style={{ margin: 0 }}>Esperando jugadores...</h3>
                    )}
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.4rem' }}>
                        {nextMatch?.label || 'Preparen los equipos'} • Modo: {modes.find(m => m.id === matchMode)?.name}
                    </div>
                </div>

                {canManage && (
                    <div style={{ position: 'relative' }}>
                        <select
                            value={matchMode}
                            onChange={(e) => onUpdateMode(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
                                color: 'white', padding: '0.3rem', borderRadius: '6px', fontSize: '0.7rem'
                            }}
                        >
                            {modes.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {canManage && nextMatch && (
                <Button
                    size="sm"
                    fullWidth
                    icon={Play}
                    onClick={() => onStartMatch(nextMatch.team1Id, nextMatch.team2Id)}
                >
                    Iniciar Encuentro
                </Button>
            )}
        </Card>
    )
}

export default FixtureSuggester
