import React, { useState } from 'react'
import { Trophy, Plus, X, Trash2, User, Users, RotateCcw } from 'lucide-react'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import TeamBadge from './TeamBadge'

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
    enrollments,
    matchMode,
    onUndoMatch,
    onOpenLineup
}) => {
    const [recordingForTeam, setRecordingForTeam] = useState(null)

    const handleAddGoal = (playerId, teamId) => {
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

    // Filter players based on verified lineup if available
    const getParticipantsForTeam = (teamId) => {
        const participantIds = teamId === gameData.team1Id ? gameData.team1_players : gameData.team2_players

        if (participantIds) {
            return enrollments.filter(e => participantIds.includes(e.player_id))
        }

        // Fallback to official assignments if no manual lineup was passed
        return enrollments.filter(e => e.is_present && e.paid && e.team_assignment === teamId)
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Trophy size={20} /> {matchMode === 'free' ? 'Partidos Jugados' : 'Registro de Resultado'}
                </h3>
                {canManage && matchMode === 'free' && (
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
                            <div style={{
                                padding: '0.8rem', borderRadius: '8px',
                                background: teamConfigs[gameData.team1Id]?.bg || 'rgba(255,255,255,0.05)',
                                color: 'white', marginBottom: '0.8rem',
                                position: 'relative'
                            }}>
                                <TeamBadge id={gameData.team1Id} teamConfigs={teamConfigs} />
                                {gameData.team1_players && (
                                    <div style={{ fontSize: '0.65rem', marginTop: '0.4rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                        Alineación Personalizada ({gameData.team1_players.length})
                                    </div>
                                )}
                            </div>
                            <div style={{ fontSize: '3.5rem', fontWeight: 'bold' }}>{currentScore1}</div>
                            <Button
                                size="sm" variant="ghost"
                                style={{ marginTop: '0.5rem', width: '100%' }}
                                onClick={() => setRecordingForTeam(gameData.team1Id)}
                            >
                                + Gol
                            </Button>
                        </div>

                        <div style={{ fontSize: '1.5rem', opacity: 0.3, fontWeight: 'bold' }}>VS</div>

                        {/* Team 2 Selector & Score */}
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                padding: '0.8rem', borderRadius: '8px',
                                background: teamConfigs[gameData.team2Id]?.bg || 'rgba(255,255,255,0.05)',
                                color: 'white', marginBottom: '0.8rem',
                                position: 'relative'
                            }}>
                                <TeamBadge id={gameData.team2Id} teamConfigs={teamConfigs} />
                                {gameData.team2_players && (
                                    <div style={{ fontSize: '0.65rem', marginTop: '0.4rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                        Alineación Personalizada ({gameData.team2_players.length})
                                    </div>
                                )}
                            </div>
                            <div style={{ fontSize: '3.5rem', fontWeight: 'bold' }}>{currentScore2}</div>
                            <Button
                                size="sm" variant="ghost"
                                style={{ marginTop: '0.5rem', width: '100%' }}
                                onClick={() => setRecordingForTeam(gameData.team2Id)}
                            >
                                + Gol
                            </Button>
                        </div>
                    </div>

                    {canManage && (
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onOpenLineup}
                                icon={Users}
                                style={{ fontSize: '0.8rem', opacity: 0.8 }}
                            >
                                {(gameData.team1_players || gameData.team2_players) ? 'Editar Alineación' : 'Ajustar Alineación / Préstamos'}
                            </Button>
                        </div>
                    )}

                    {/* Goal Scorer Selection Modal */}
                    {recordingForTeam && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1400,
                            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                        }}>
                            <div className="premium-card" style={{
                                width: '100%', maxWidth: '400px', padding: '2rem',
                                background: 'var(--bg-card)', border: '1px solid var(--border)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Gol para Equipo {recordingForTeam}</h3>
                                    <Button variant="ghost" onClick={() => setRecordingForTeam(null)} icon={X} />
                                </div>

                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {getParticipantsForTeam(recordingForTeam).map(enrol => (
                                        <button
                                            key={enrol.id}
                                            onClick={() => handleAddGoal(enrol.player_id, recordingForTeam)}
                                            style={{
                                                padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--border)', borderRadius: '8px',
                                                color: 'white', cursor: 'pointer', textAlign: 'left',
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                            }}
                                        >
                                            <span>{enrol.player?.full_name}</span>
                                            {enrol.team_assignment !== recordingForTeam && (
                                                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold' }}>Refuerzo</span>
                                            )}
                                        </button>
                                    ))}

                                    {/* Handle Own Goals / Others */}
                                    <div style={{ height: '1px', background: 'var(--border)', margin: '1rem 0' }} />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const otherTeam = recordingForTeam === gameData.team1Id ? gameData.team2Id : gameData.team1Id;
                                            setRecordingForTeam(otherTeam); // Toggle to other team for own goal selection
                                        }}
                                    >
                                        Registrar Autogol
                                    </Button>
                                </div>
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

                    <Button
                        variant="primary"
                        fullWidth
                        onClick={onAddGame}
                        style={{ marginTop: '2rem' }}
                        loading={actionLoading === 'game-form'}
                        disabled={isLocked}
                    >
                        Guardar Resultado
                    </Button>
                </Card>
            )}

        </div>
    )
}

export default GameResultForm
