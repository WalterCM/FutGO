import React from 'react'
import Button from '../../components/ui/Button'

export default function MatchForm({
    fields,
    newMatch,
    setNewMatch,
    onSubmit,
    onCancel,
    editingId,
    loading
}) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <form onSubmit={onSubmit} className="premium-card" style={{ width: '100%', maxWidth: '500px' }}>
                <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
                    {editingId ? 'Editar Encuentro' : 'Programar Partido'}
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Seleccionar Cancha</label>
                        <select
                            required
                            className="premium-input"
                            style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                            value={newMatch.field_id}
                            onChange={e => setNewMatch({ ...newMatch, field_id: e.target.value })}
                        >
                            <option value="" disabled>Selecciona una cancha...</option>
                            {fields.map(f => (
                                <option key={f.id} value={f.id}>
                                    {f.name} (Fútbol {f.players_per_team})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Fecha</label>
                            <input
                                type="date"
                                required
                                className="premium-input"
                                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                value={newMatch.date}
                                onChange={e => setNewMatch({ ...newMatch, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Hora</label>
                            <input
                                type="time"
                                required
                                className="premium-input"
                                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                value={newMatch.time}
                                onChange={e => setNewMatch({ ...newMatch, time: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="outline"
                        style={{ flex: 1 }}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        style={{ flex: 1 }}
                        loading={loading}
                    >
                        {editingId ? 'Guardar Cambios' : 'Programar Encuentro'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
