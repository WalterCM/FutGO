import React, { useState } from 'react'
import { Trophy, Plus, X, Trash2, User } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

const GameResultForm = ({
    showForm,
    setShowForm,
    gameData,
    setGameData,
    onAddGame,
    games,
    teamConfigs,
    numTeams,
    canManage,
    actionLoading,
    isLocked,
    enrollments
}) => {
    const [recordingForTeam, setRecordingForTeam] = useState(null)

    const handleAddGoal = (playerId, teamId) => {
        // Find if it's an own goal (player is from the other team)
        const playerEnrol = enrollments.find(e => e.player_id === playerId)
        const isOwnGoal = playerEnrol && playerEnrol.team_assignment !== teamId

        const newGoal = {
            id: Date.now(),
            player_id: playerId,
            team_id: teamId,
            is_own_goal: isOwnGoal,
            player_name: playerEnrol?.player?.full_name || 'Desconocido'
        }

        setGameData({
            ...gameData,
            goals: [...(gameData.goals || []), newGoal]
        })
        setRecordingForTeam(null)
    }

    const handleRemoveGoal = (goalId) => {
        setGameData({
            ...gameData,
            goals: (gameData.goals || []).filter(g => g.id !== goalId)
        })
    }

    const currentScore1 = gameData.goals?.filter(g => g.team_id === gameData.team1Id).length || 0
    const currentScore2 = gameData.goals?.filter(g => g.team_id === gameData.team2Id).length || 0

    const presentPlayers = enrollments.filter(e => e.is_present && e.paid)

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Trophy size={20} /> Partidos Jugados
                </h3>
                {canManage && (
                    <Button
                        size="sm"
                        onClick={() => setShowForm(!showForm)}
                        variant={showForm ? 'ghost' : 'primary'}
                        icon={showForm ? X : Plus}
                    >
                        {showForm ? 'Terminar' : 'Registrar Encuentro'}
                    </Button>
                )}
            </div>

            {showForm && (
                <Card style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1.5rem' }} hover={false}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        {/* Team 1 Selector & Score */}
                        <div style={{ textAlign: 'center' }}>
                            <select
                                value={gameData.team1Id}
                                onChange={(e) => setGameData({ ...gameData, team1Id: parseInt(e.target.value), goals: [] })}
                                style={{
                                    background: teamConfigs[gameData.team1Id]?.bg || 'transparent',
                                    color: teamConfigs[gameData.team1Id]?.color || 'white',
                                    border: `1px solid ${teamConfigs[gameData.team1Id]?.color || 'var(--border)'}`,
                                    padding: '0.4rem', borderRadius: '6px', marginBottom: '0.8rem', width: '100%', fontWeight: 'bold'
                                }}
                            >
                                {Array.from({ length: numTeams }, (_, i) => i + 1).map(id => (
                                    <option key={id} value={id} style={{ background: 'var(--bg-dark)', color: 'white' }}>
                                        {teamConfigs[id]?.name}
                                    </option>
                                ))}
                            </select>
                            <div
                                onClick={() => !isLocked && setRecordingForTeam(gameData.team1Id)}
                                style={{
                                    fontSize: '3rem', fontWeight: 'bold', cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.5rem'
                                }}
                            >
                                {currentScore1}
                            </div>
                            <Button
                                size="sm" variant="ghost"
                                style={{ marginTop: '0.5rem', width: '100%' }}
                                onClick={() => setRecordingForTeam(gameData.team1Id)}
                            >
                                + Gol
                            </Button>
                        </div>

                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-dim)' }}>VS</div>

                        {/* Team 2 Selector & Score */}
                        <div style={{ textAlign: 'center' }}>
                            <select
                                value={gameData.team2Id}
                                onChange={(e) => setGameData({ ...gameData, team2Id: parseInt(e.target.value), goals: [] })}
                                style={{
                                    background: teamConfigs[gameData.team2Id]?.bg || 'transparent',
                                    color: teamConfigs[gameData.team2Id]?.color || 'white',
                                    border: `1px solid ${teamConfigs[gameData.team2Id]?.color || 'var(--border)'}`,
                                    padding: '0.4rem', borderRadius: '6px', marginBottom: '0.8rem', width: '100%', fontWeight: 'bold'
                                }}
                            >
                                {Array.from({ length: numTeams }, (_, i) => i + 1).map(id => (
                                    <option key={id} value={id} style={{ background: 'var(--bg-dark)', color: 'white' }}>
                                        {teamConfigs[id]?.name}
                                    </option>
                                ))}
                            </select>
                            <div
                                onClick={() => !isLocked && setRecordingForTeam(gameData.team2Id)}
                                style={{
                                    fontSize: '3rem', fontWeight: 'bold', cursor: 'pointer',
                                    background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '0.5rem'
                                }}
                            >
                                {currentScore2}
                            </div>
                            <Button
                                size="sm" variant="ghost"
                                style={{ marginTop: '0.5rem', width: '100%' }}
                                onClick={() => setRecordingForTeam(gameData.team2Id)}
                            >
                                + Gol
                            </Button>
                        </div>
                    </div>

                    {/* Goal Scorer Selection Modal (Modernized) */}
                    {recordingForTeam && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1100,
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                        }}>
                            <div className="premium-card" style={{
                                width: '100%', maxWidth: '400px', padding: '2rem',
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                                        Gol para <span style={{ color: teamConfigs[recordingForTeam]?.color }}>{teamConfigs[recordingForTeam]?.name}</span>
                                    </h3>
                                    <Button variant="ghost" onClick={() => setRecordingForTeam(null)} icon={X} />
                                </div>

                                <div style={{ display: 'grid', gap: '1.5rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {/* Only show players from the two teams involved in the match */}
                                    {/* Primary team (the one that scored) goes first, opponent second */}
                                    {[recordingForTeam, recordingForTeam === gameData.team1Id ? gameData.team2Id : gameData.team1Id].map(tId => {
                                        const teamPlayers = presentPlayers.filter(e => e.team_assignment === tId)
                                        if (teamPlayers.length === 0) return null

                                        const isOwnGoalTeam = tId !== recordingForTeam

                                        return (
                                            <div key={tId}>
                                                <div style={{
                                                    fontSize: '0.75rem', fontWeight: 'bold', color: teamConfigs[tId]?.color,
                                                    marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px',
                                                    display: 'flex', justifyContent: 'space-between'
                                                }}>
                                                    <span>{teamConfigs[tId]?.name}</span>
                                                    {isOwnGoalTeam && <span style={{ color: 'var(--error)' }}>Autogol</span>}
                                                </div>
                                                <div style={{ display: 'grid', gap: '0.4rem' }}>
                                                    {teamPlayers.map(enrol => (
                                                        <div
                                                            key={enrol.id}
                                                            onClick={() => handleAddGoal(enrol.player_id, recordingForTeam)}
                                                            className="clickable-item"
                                                            style={{
                                                                background: teamConfigs[tId]?.bg || 'rgba(255,255,255,0.05)',
                                                                color: teamConfigs[tId]?.color || 'white',
                                                                padding: '0.8rem 1rem',
                                                                borderRadius: '8px',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                border: `1px solid ${teamConfigs[tId]?.color}33`, // Subtle border with transparency
                                                                transition: 'all 0.2s ease',
                                                                textAlign: 'center',
                                                                fontWeight: '600',
                                                                fontSize: '0.9rem'
                                                            }}
                                                        >
                                                            {enrol.player?.full_name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <Button
                                    variant="outline"
                                    fullWidth
                                    style={{ marginTop: '2rem' }}
                                    onClick={() => setRecordingForTeam(null)}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Recorded Goals List */}
                    {gameData.goals?.length > 0 && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>Sucesos del Partido</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {gameData.goals.map(goal => (
                                    <div
                                        key={goal.id}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem',
                                            borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem'
                                        }}
                                    >
                                        <span style={{ color: teamConfigs[goal.team_id]?.color }}>●</span>
                                        {goal.player_name} {goal.is_own_goal && <span style={{ color: 'var(--error)', fontSize: '0.7rem' }}>(AG)</span>}
                                        <Trash2
                                            size={14}
                                            style={{ cursor: 'pointer', opacity: 0.5 }}
                                            onClick={() => handleRemoveGoal(goal.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={onAddGame} style={{ marginTop: '2rem' }}>
                        {!isLocked && (
                            <Button
                                type="submit"
                                style={{ width: '100%' }}
                                loading={actionLoading === 'game-form'}
                                disabled={gameData.team1Id === gameData.team2Id}
                            >
                                {gameData.team1Id === gameData.team2Id ? 'Selecciona equipos distintos' : 'Guardar Encuentro'}
                            </Button>
                        )}
                    </form>
                </Card>
            )}

            {games.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    <p style={{ color: 'var(--text-dim)' }}>Aún no hay encuentros registrados.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {games.map((game) => (
                        <Card key={game.id} style={{ padding: '1.2rem' }} hover={false}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{
                                        color: teamConfigs[game.team1_id]?.color,
                                        background: teamConfigs[game.team1_id]?.bg,
                                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                        border: `1px solid ${teamConfigs[game.team1_id]?.color}`
                                    }}>
                                        {teamConfigs[game.team1_id]?.name}
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{game.score1}</div>
                                </div>
                                <div style={{ color: 'var(--text-dim)', fontWeight: 'bold' }}>VS</div>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{
                                        color: teamConfigs[game.team2_id]?.color,
                                        background: teamConfigs[game.team2_id]?.bg,
                                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                        border: `1px solid ${teamConfigs[game.team2_id]?.color}`
                                    }}>
                                        {teamConfigs[game.team2_id]?.name}
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{game.score2}</div>
                                </div>
                            </div>

                            {/* Detailed Goals Summary */}
                            {game.goals?.length > 0 && (
                                <div style={{
                                    marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-end', flex: 1 }}>
                                        {game.goals.filter(g => g.team_id === game.team1_id).map((g, idx) => (
                                            <div key={idx} style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                {g.player_name} {g.is_own_goal && '(AG)'} ⚽
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'flex-start', flex: 1 }}>
                                        {game.goals.filter(g => g.team_id === game.team2_id).map((g, idx) => (
                                            <div key={idx} style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                                ⚽ {g.player_name} {g.is_own_goal && '(AG)'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default GameResultForm
