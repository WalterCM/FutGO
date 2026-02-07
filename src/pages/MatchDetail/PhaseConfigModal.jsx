import React, { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Trophy, Award, Zap, Plus, Shuffle, ListOrdered, Users } from 'lucide-react'

const PhaseConfigModal = ({ show, onClose, onAdd, standingsCount = 0, numTeams = 4, hasPreviousLiguilla = false }) => {
    const [step, setStep] = useState('type') // 'type', 'elimination_config'
    const [selectedType, setSelectedType] = useState(null)

    const phaseTypes = [
        {
            id: 'liguilla',
            name: 'Liguilla',
            icon: <Trophy size={24} />,
            desc: 'Todos contra todos. Los equipos suman puntos por cada partido.',
            color: '#3b82f6'
        },
        {
            id: 'tournament',
            name: 'Eliminación Directa',
            icon: <Zap size={24} />,
            desc: 'El perdedor se va. Cruces random, manuales o basados en standings.',
            color: '#f59e0b'
        },
        {
            id: 'winner_stays',
            name: 'Ganador Queda',
            icon: <Award size={24} />,
            desc: 'Partidos rápidos donde el ganador sigue en cancha.',
            color: '#10b981'
        },
        {
            id: 'free',
            name: 'Fase Libre',
            icon: <Plus size={24} />,
            desc: 'Crea partidos manualmente sin restricciones de formato.',
            color: '#6b7280'
        }
    ]

    const handleSelect = (type) => {
        setSelectedType(type)
        if (type.id === 'tournament') {
            setStep('elimination_config')
        } else {
            onAdd(type.id, type.name)
            resetAndClose()
        }
    }

    const resetAndClose = () => {
        setStep('type')
        setSelectedType(null)
        onClose()
    }

    const hasStandings = standingsCount >= 2

    return (
        <Modal
            show={show}
            onClose={resetAndClose}
            title={step === 'type' ? 'Añadir Nueva Fase' : 'Configurar Eliminación'}
        >
            <div style={{ padding: '1rem' }}>
                {step === 'type' ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {phaseTypes.map(type => (
                            <button
                                key={type.id}
                                onClick={() => handleSelect(type)}
                                className="premium-card"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.2rem',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                                    borderRadius: '16px', cursor: 'pointer', textAlign: 'left', color: 'white',
                                    width: '100%', transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{
                                    background: type.color, padding: '0.8rem', borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                                }}>
                                    {type.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{type.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>{type.desc}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', margin: 0 }}>
                            ¿Cómo quieres armar los cruces de la eliminación?
                        </p>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {/* Option 1: Random */}
                            <Button
                                variant="primary"
                                fullWidth
                                size="lg"
                                icon={Shuffle}
                                style={{ height: 'auto', padding: '1.2rem', justifyContent: 'flex-start', gap: '1rem' }}
                                onClick={() => {
                                    onAdd('tournament_random', 'Eliminación (Random)')
                                    resetAndClose()
                                }}
                            >
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 'bold' }}>Cruces Aleatorios</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Los equipos se emparejan al azar</div>
                                </div>
                            </Button>

                            {/* Option 2: Based on Standings with placeholders (always available if liguilla exists) */}
                            <Button
                                variant={hasPreviousLiguilla ? 'outline' : 'ghost'}
                                fullWidth
                                size="lg"
                                icon={ListOrdered}
                                style={{ height: 'auto', padding: '1.2rem', justifyContent: 'flex-start', gap: '1rem', opacity: hasPreviousLiguilla ? 1 : 0.4 }}
                                disabled={!hasPreviousLiguilla}
                                onClick={() => {
                                    // Create elimination with placeholders based on standings positions
                                    onAdd('tournament_standings', 'Eliminación (Por Standings)')
                                    resetAndClose()
                                }}
                            >
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 'bold' }}>Por Standings {hasStandings && <span style={{ color: '#10b981', fontSize: '0.7rem' }}>● Datos disponibles</span>}</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                        {hasPreviousLiguilla
                                            ? numTeams >= 4
                                                ? `1º vs 4º, 2º vs 3º... (${numTeams} equipos)`
                                                : `1º vs 2º (${numTeams} equipos)`
                                            : 'Requiere una Liguilla como fase anterior'}
                                    </div>
                                </div>
                            </Button>

                            {/* Option 3: Manual (add empty phase, user adds fixtures manually) */}
                            <Button
                                variant="ghost"
                                fullWidth
                                size="lg"
                                icon={Plus}
                                style={{ height: 'auto', padding: '1.2rem', justifyContent: 'flex-start', gap: '1rem' }}
                                onClick={() => {
                                    onAdd('tournament_manual', 'Eliminación (Manual)')
                                    resetAndClose()
                                }}
                            >
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: 'bold' }}>Cruces Manuales</div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Tú defines cada partido uno por uno</div>
                                </div>
                            </Button>
                        </div>

                        <Button variant="ghost" fullWidth onClick={() => setStep('type')}>
                            ← Volver
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    )
}

export default PhaseConfigModal
