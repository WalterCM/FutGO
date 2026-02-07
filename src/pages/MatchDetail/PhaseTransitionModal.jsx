import React from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Trophy, ChevronRight, Award, List } from 'lucide-react'
import TeamBadge from './TeamBadge'

const PhaseTransitionModal = ({ show, onClose, standings, teamConfigs, onGenerateNext }) => {
    if (!standings) return null

    return (
        <Modal
            show={show}
            onClose={onClose}
            title="Cierre de Fase y Siguiente Etapa"
        >
            <div style={{ padding: '1rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', opacity: 0.7 }}>
                        <List size={16} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Posiciones Finales</span>
                    </div>
                    <div style={{ display: 'grid', gap: '0.4rem' }}>
                        {standings.map((team, idx) => (
                            <div key={team.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
                                border: idx < 4 ? '1px solid rgba(var(--primary-rgb), 0.2)' : '1px solid transparent'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ width: '20px', fontWeight: 'bold', color: idx < 4 ? 'var(--primary)' : 'var(--text-dim)' }}>
                                        {idx + 1}
                                    </span>
                                    <TeamBadge id={team.id} teamConfigs={teamConfigs} />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem' }}>
                                    <span title="Puntos"><strong>{team.pts}</strong> PTS</span>
                                    <span style={{ color: 'var(--text-dim)' }} title="Diferencia de Goles">{team.gd > 0 ? `+${team.gd}` : team.gd} DG</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', opacity: 0.7 }}>
                        <Trophy size={16} color="var(--primary)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Selecciona el Formato de Cierre</span>
                    </div>

                    {standings.length >= 4 && (
                        <button
                            className="premium-card transition-all"
                            onClick={() => onGenerateNext('semis')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem',
                                background: 'rgba(var(--primary-rgb), 0.05)', border: '1px solid rgba(var(--primary-rgb), 0.2)',
                                cursor: 'pointer', textAlign: 'left', width: '100%', borderRadius: '12px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.1)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(var(--primary-rgb), 0.05)'}
                        >
                            <div style={{ background: 'var(--primary)', padding: '0.8rem', borderRadius: '10px' }}>
                                <Award color="white" size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', color: 'white' }}>Generar Semifinales</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Top 4 clasifican (1º vs 4º, 2º vs 3º)</div>
                            </div>
                            <ChevronRight size={20} color="var(--primary)" />
                        </button>
                    )}

                    <button
                        className="premium-card transition-all"
                        onClick={() => onGenerateNext('finals')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.2rem',
                            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                            cursor: 'pointer', textAlign: 'left', width: '100%', borderRadius: '12px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                        <div style={{ background: '#ffd700', padding: '0.8rem', borderRadius: '10px' }}>
                            <Trophy color="black" size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', color: 'white' }}>Ir a Gran Final</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>Clasifican los dos mejores (1º vs 2º)</div>
                        </div>
                        <ChevronRight size={20} color="var(--text-dim)" />
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default PhaseTransitionModal
