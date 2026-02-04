import React from 'react'
import { MapPin, Palette, Dices } from 'lucide-react'
import TeamSection from './TeamSection'
import Card from '../../components/ui/Card'

const FieldTab = ({
    enrollments,
    numTeams,
    getTeamPlayers,
    teamConfigs,
    canManage,
    onDragStart,
    onDragOver,
    onDrop,
    onKitPicker,
    onRandomizeKit,
    selectedPlayerId,
    onPlayerClick,
    onMobileMove
}) => {
    const hasPresent = enrollments.some(e => e.is_present)

    return (
        <>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: hasPresent ? 1 : 0.5 }}>
                <MapPin size={20} /> Cancha y Equipos
            </h3>

            {!hasPresent && (
                <Card style={{ textAlign: 'center', padding: '2rem', marginBottom: '2rem', border: '2px dashed var(--border)' }} hover={false}>
                    <p style={{ color: 'var(--text-dim)' }}>No hay nadie "Presente". Marca quién llegó en la pestaña de Administración.</p>
                </Card>
            )}

            <div style={{
                opacity: hasPresent ? 1 : 0.5,
                pointerEvents: hasPresent ? 'auto' : 'none',
                marginBottom: '4rem'
            }}>
                {selectedPlayerId && (
                    <div style={{ background: 'var(--primary)', color: 'black', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', animation: 'slideIn 0.3s' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Mover Jugador Seleccionado:</div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {Array.from({ length: numTeams }, (_, i) => i + 1).map(id => (
                                <button
                                    key={id}
                                    onClick={() => onMobileMove(id)}
                                    style={{ background: 'black', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                                >
                                    {teamConfigs[id].name}
                                </button>
                            ))}
                            <button
                                onClick={() => onMobileMove(0)}
                                style={{ background: 'var(--bg-card)', color: 'white', border: '1px solid white', padding: '0.5rem 1rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                            >
                                Banca
                            </button>
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    {/* Teams Loop */}
                    {Array.from({ length: numTeams }, (_, i) => i + 1).map(teamId => (
                        <TeamSection
                            key={teamId}
                            teamId={teamId}
                            players={getTeamPlayers(teamId)}
                            config={teamConfigs[teamId]}
                            onDragOver={onDragOver}
                            onDrop={onDrop}
                            canManage={canManage}
                            onKitPicker={onKitPicker}
                            onRandomizeKit={onRandomizeKit}
                            selectedPlayerId={selectedPlayerId}
                            onPlayerClick={onPlayerClick}
                        />
                    ))}

                    {/* Bench Section */}
                    <TeamSection
                        teamId={0}
                        players={getTeamPlayers(0)}
                        config={teamConfigs[0]}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        canManage={canManage}
                        selectedPlayerId={selectedPlayerId}
                        onPlayerClick={onPlayerClick}
                    />
                </div>
            </div>
        </>
    )
}

export default FieldTab
