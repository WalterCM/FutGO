import React, { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import TeamBadge from './TeamBadge'

const ManualFixtureModal = ({ show, onClose, onAdd, teamConfigs = {}, numTeams = 5, phaseId }) => {
    const [team1, setTeam1] = useState('')
    const [team2, setTeam2] = useState('')
    const [label, setLabel] = useState('Partido')

    const teams = []
    for (let i = 1; i <= numTeams; i++) {
        teams.push(i)
    }

    const handleAdd = () => {
        if (!team1 || !team2) {
            alert('Selecciona ambos equipos')
            return
        }
        if (team1 === team2) {
            alert('Un equipo no puede jugar contra sí mismo')
            return
        }
        onAdd(phaseId, parseInt(team1), parseInt(team2), label)
        onClose()
        // Reset
        setTeam1('')
        setTeam2('')
        setLabel('Partido')
    }

    return (
        <Modal show={show} onClose={onClose} title="Añadir Encuentro Manual">
            <div style={{ padding: '1rem', display: 'grid', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Referencia del Partido (opcional)</label>
                    <input
                        className="premium-input"
                        value={label}
                        onChange={e => setLabel(e.target.value)}
                        placeholder="Ej: Jornada 1, Amistoso..."
                        style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <select
                            className="premium-input"
                            value={team1}
                            onChange={e => setTeam1(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                        >
                            <option value="">Equipo A</option>
                            {teams.map(t => (
                                <option key={t} value={t}>Equipo {t} {teamConfigs[t]?.name ? `- ${teamConfigs[t].name}` : ''}</option>
                            ))}
                        </select>
                        {team1 && <div style={{ display: 'flex', justifyContent: 'center' }}><TeamBadge id={parseInt(team1)} teamConfigs={teamConfigs} /></div>}
                    </div>

                    <div style={{ fontSize: '0.8rem', opacity: 0.3, fontWeight: 'bold' }}>VS</div>

                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                        <select
                            className="premium-input"
                            value={team2}
                            onChange={e => setTeam2(e.target.value)}
                            style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                        >
                            <option value="">Equipo B</option>
                            {teams.map(t => (
                                <option key={t} value={t}>Equipo {t} {teamConfigs[t]?.name ? `- ${teamConfigs[t].name}` : ''}</option>
                            ))}
                        </select>
                        {team2 && <div style={{ display: 'flex', justifyContent: 'center' }}><TeamBadge id={parseInt(team2)} teamConfigs={teamConfigs} /></div>}
                    </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <Button variant="ghost" fullWidth onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" fullWidth onClick={handleAdd} disabled={!team1 || !team2}>Añadir</Button>
                </div>
            </div>
        </Modal>
    )
}

export default ManualFixtureModal
