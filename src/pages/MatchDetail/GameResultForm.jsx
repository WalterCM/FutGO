import React, { useState } from 'react'
import { Trophy, Plus, X, Trash2, User, RotateCcw } from 'lucide-react'
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
    matchMode
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

    const presentPlayers = enrollments.filter(e => e.is_present && e.paid)

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
                            <select
                                value={gameData.team1Id}
                                disabled={matchMode !== 'free'}
                                onChange={(e) => setGameData({ ...gameData, team1Id: parseInt(e.target.value), goals: [] })}
                                style={{
                                    background: teamConfigs[gameData.team1Id]?.bg || 'transparent',
                                    color: teamConfigs[gameData.team1Id]?.color || 'white',
                                    border: `1px solid ${teamConfigs[gameData.team1Id]?.color || 'var(--border)'}`,
                                    padding: '0.4rem', borderRadius: '6px', marginBottom: '0.8rem', width: '100%', fontWeight: 'bold',
                                    opacity: matchMode !== 'free' ? 0.8 : 1
                                }}
                            >
                                {Array.from({ length: numTeams }, (_, i) => i + 1).map(id => (
                                    <option key={id} value={id} style={{ background: 'var(--bg-card)', color: 'white' }}>
                                        {teamConfigs[id]?.name}
                                    </option>
                                ))}
                            </select>
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
                            <select
                                value={gameData.team2Id}
                                disabled={matchMode !== 'free'}
                                onChange={(e) => setGameData({ ...gameData, team2Id: parseInt(e.target.value), goals: [] })}
                                style={{
                                    background: teamConfigs[gameData.team2Id]?.bg || 'transparent',
                                    color: teamConfigs[gameData.team2Id]?.color || 'white',
                                    border: `1px solid ${teamConfigs[gameData.team2Id]?.color || 'var(--border)'}`,
                                    padding: '0.4rem', borderRadius: '6px', marginBottom: '0.8rem', width: '100%', fontWeight: 'bold',
                                    opacity: matchMode !== 'free' ? 0.8 : 1
                                }}
                            >
                                {Array.from({ length: numTeams }, (_, i) => i + 1).map(id => (
                                    <option key={id} value={id} style={{ background: 'var(--bg-card)', color: 'white' }}>
                                        {teamConfigs[id]?.name}
                                    </option>
                                ))}
                            </select>
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
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Gol para <TeamBadge id={recordingForTeam} teamConfigs={teamConfigs} style={{ minWidth: 'auto' }} />
                                    </h3>
                                    <Button variant="ghost" onClick={() => setRecordingForTeam(null)} icon={X} />
                                </div>

                                <div style={{ display: 'grid', gap: '1.5rem', maxHeight: '60vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {[gameData.team1Id, gameData.team2Id].map(tId => {
                                        const teamPlayers = presentPlayers.filter(e => e.team_assignment === tId)
                                        if (teamPlayers.length === 0) return null

                                        const isOwnGoalTeam = tId !== recordingForTeam

                                        return (
                                            <div key={tId}>
                                                <div style={{
                                                    marginBottom: '0.8rem',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}>
                                                    <TeamBadge id={tId} teamConfigs={teamConfigs} style={{ minWidth: 'auto', fontSize: '0.7rem' }} />
                                                    {isOwnGoalTeam && <span style={{ color: 'var(--error)', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Autogol</span>}
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
                                                                border: `1px solid ${teamConfigs[tId]?.color}33`,
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
