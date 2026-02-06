import React from 'react'
import { Trophy, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import Card from '../../components/ui/Card'
import TeamBadge from './TeamBadge'

export default function MatchHistory({
    showHistory,
    setShowHistory,
    games,
    teamConfigs,
    canManage,
    onDeleteGame
}) {
    if (games.length === 0) return null

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
                    {games.map((game) => (
                        <Card key={game.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} hover={false}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                {canManage && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('¿Borrar este resultado?')) {
                                                onDeleteGame(game.id, game.fixture_id)
                                            }
                                        }}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: '0.5rem', color: 'var(--error)', opacity: 0.4 }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
