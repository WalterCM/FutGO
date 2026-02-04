import React from 'react'
import { Trophy, Plus, XCircle } from 'lucide-react'
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
    isLocked
}) => {
    return (
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Trophy size={20} /> Partidos Jugados
                </h3>
                {canManage && (
                    <Button
                        size="sm"
                        onClick={() => setShowForm(!showForm)}
                        variant={showForm ? 'ghost' : 'primary'}
                        icon={showForm ? XCircle : Plus}
                    >
                        {showForm ? 'Cancelar' : 'Registrar Score'}
                    </Button>
                )}
            </div>

            {showForm && (
                <Card style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.05)' }} hover={false}>
                    <form onSubmit={onAddGame}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <select
                                    value={gameData.team1Id}
                                    onChange={(e) => setGameData({ ...gameData, team1Id: parseInt(e.target.value) })}
                                    style={{
                                        background: teamConfigs[gameData.team1Id].bg,
                                        color: teamConfigs[gameData.team1Id].color,
                                        border: `1px solid ${teamConfigs[gameData.team1Id].color}`,
                                        padding: '0.4rem', borderRadius: '6px', marginBottom: '0.5rem', width: '100%', fontWeight: 'bold'
                                    }}
                                >
                                    {Array.from({ length: numTeams }, (_, i) => i + 1).map(id => (
                                        <option key={id} value={id} style={{ background: 'var(--bg-dark)', color: 'white' }}>
                                            {teamConfigs[id].name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ width: '60px', textAlign: 'center', fontSize: '1.5rem', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    value={gameData.score1}
                                    onChange={(e) => setGameData({ ...gameData, score1: parseInt(e.target.value) || 0 })}
                                    min="0"
                                />
                            </div>

                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>VS</div>

                            <div style={{ textAlign: 'center' }}>
                                <select
                                    value={gameData.team2Id}
                                    onChange={(e) => setGameData({ ...gameData, team2Id: parseInt(e.target.value) })}
                                    style={{
                                        background: teamConfigs[gameData.team2Id].bg,
                                        color: teamConfigs[gameData.team2Id].color,
                                        border: `1px solid ${teamConfigs[gameData.team2Id].color}`,
                                        padding: '0.4rem', borderRadius: '6px', marginBottom: '0.5rem', width: '100%', fontWeight: 'bold'
                                    }}
                                    disabled={isLocked}
                                >
                                    {Array.from({ length: numTeams }, (_, i) => i + 1).map(id => (
                                        <option key={id} value={id} style={{ background: 'var(--bg-dark)', color: 'white' }}>
                                            {teamConfigs[id].name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    className="input-field"
                                    style={{ width: '60px', textAlign: 'center', fontSize: '1.5rem', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}
                                    value={gameData.score2}
                                    onChange={(e) => setGameData({ ...gameData, score2: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    disabled={isLocked}
                                />
                            </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '1rem' }}>
                            El score se registrará para los jugadores actualmente en cada equipo.
                        </p>
                        {!isLocked && (
                            <Button
                                type="submit"
                                style={{ width: '100%' }}
                                loading={actionLoading === 'game-form'}
                                disabled={gameData.team1Id === gameData.team2Id}
                            >
                                {gameData.team1Id === gameData.team2Id ? 'Selecciona equipos distintos' : 'Confirmar Resultado'}
                            </Button>
                        )}
                    </form>
                </Card>
            )}

            {games.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                    <p style={{ color: 'var(--text-dim)' }}>Aún no se han registrado resultados de juegos individuales.</p>
                    <p style={{ color: 'var(--primary)', fontSize: '0.8rem', marginTop: '0.5rem' }}>¡Los resultados afectan el ELO de los cracks! 📈</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {games.map((game) => (
                        <Card key={game.id} style={{ padding: '1rem' }} hover={false}>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{
                                        color: teamConfigs[game.team1_id || 1]?.color,
                                        background: teamConfigs[game.team1_id || 1]?.bg,
                                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                        border: `1px solid ${teamConfigs[game.team1_id || 1]?.color}`
                                    }}>
                                        {teamConfigs[game.team1_id || 1]?.name}
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{game.score1}</div>
                                </div>
                                <div style={{ color: 'var(--text-dim)', fontWeight: 'bold' }}>VS</div>
                                <div style={{ textAlign: 'center', flex: 1 }}>
                                    <div style={{
                                        color: teamConfigs[game.team2_id || 2]?.color,
                                        background: teamConfigs[game.team2_id || 2]?.bg,
                                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                                        border: `1px solid ${teamConfigs[game.team2_id || 2]?.color}`
                                    }}>
                                        {teamConfigs[game.team2_id || 2]?.name}
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{game.score2}</div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

export default GameResultForm
