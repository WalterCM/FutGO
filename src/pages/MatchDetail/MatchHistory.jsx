import React, { useState } from 'react'
import { Trophy, Trash2, ChevronDown, ChevronUp, Edit3 } from 'lucide-react'
import Card from '../../components/ui/Card'
import TeamBadge from './TeamBadge'

export default function MatchHistory({
    showHistory,
    setShowHistory,
    games,
    fixtures = [],
    teamConfigs,
    canManage,
    onDeleteGame,
    onEditGame
}) {
    const [expandedGame, setExpandedGame] = useState(null)

    if (games.length === 0) return null

    const toggleExpand = (gameId) => {
        setExpandedGame(expandedGame === gameId ? null : gameId)
    }

    return (
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
            <div
                onClick={() => setShowHistory(!showHistory)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '1.2rem', cursor: 'pointer', padding: '0.5rem',
                    borderRadius: '8px', transition: 'background 0.2s',
                    background: showHistory ? 'rgba(15, 23, 42, 0.4)' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)'}
                onMouseLeave={(e) => e.currentTarget.style.background = showHistory ? 'rgba(15, 23, 42, 0.4)' : 'transparent'}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.6 }}>
                    <Trophy size={18} />
                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Historial Completo del Día
                    </span>
                </div>
                {showHistory ? <ChevronUp size={18} style={{ opacity: 0.4 }} /> : <ChevronDown size={18} style={{ opacity: 0.4 }} />}
            </div>

            {showHistory && (
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {games.map((game) => {
                        const fixture = fixtures.find(f => f.id === game.fixture_id)
                        const goals = game.goals || []
                        return (
                            <div key={game.id} className="fixture-card" style={{ opacity: 1 }}>
                                <div
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => toggleExpand(game.id)}
                                >
                                    {fixture?.label && (
                                        <div className="fixture-label-badge">
                                            {fixture.label}
                                        </div>
                                    )}
                                    <div className="fixture-content" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center' }}>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <TeamBadge id={game.team1_id} teamConfigs={teamConfigs} />
                                        </div>
                                        <div style={{
                                            margin: '0 1rem', fontSize: '1.1rem', fontWeight: '800',
                                            background: 'rgba(255,255,255,0.1)', color: 'white',
                                            padding: '0.2rem 1rem', borderRadius: '12px', minWidth: '70px',
                                            textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                        }}>
                                            {game.score1} - {game.score2}
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <TeamBadge id={game.team2_id} teamConfigs={teamConfigs} />
                                        </div>
                                    </div>
                                </div>

                                {expandedGame === game.id && goals.length > 0 && (
                                    <div style={{
                                        padding: '0.8rem 1rem', marginTop: '0.5rem',
                                        borderTop: '1px solid var(--border)',
                                        display: 'flex', flexWrap: 'wrap', gap: '0.4rem'
                                    }}>
                                        {goals.map((goal, i) => (
                                            <div
                                                key={goal.id || i}
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem',
                                                    borderRadius: '20px', fontSize: '0.8rem',
                                                    display: 'flex', alignItems: 'center', gap: '0.4rem'
                                                }}
                                            >
                                                <span style={{ color: teamConfigs[goal.team_id]?.color }}>●</span>
                                                {goal.player_name}
                                                {goal.is_own_goal && (
                                                    <span style={{ color: 'var(--error)', fontSize: '0.7rem' }}>(AG)</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {canManage && (
                                    <div className="fixture-actions" style={{ display: 'flex', gap: '0.3rem' }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditGame?.(game)
                                            }}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', opacity: 0.5, fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                            title="Editar goles"
                                        >
                                            <Edit3 size={14} /> Editar
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteGame(game.id, game.fixture_id)
                                            }}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--error)', opacity: 0.4 }}
                                            title="Eliminar resultado"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
