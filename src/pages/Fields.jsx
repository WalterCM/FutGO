import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Plus, MapPin, Users, DollarSign, Trash2, Pencil, X } from 'lucide-react'

export default function Fields({ profile }) {
    const [fields, setFields] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [newField, setNewField] = useState({
        name: '',
        players_per_team: 5,
        price_per_hour: '',
        address: ''
    })

    useEffect(() => {
        fetchFields()
    }, [])

    async function fetchFields() {
        setLoading(true)
        const { data, error } = await supabase
            .from('fields')
            .select('*')
            .order('name')

        if (error) alert(error.message)
        else setFields(data || [])
        setLoading(false)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        let error;
        if (editingId) {
            const { error: updateError } = await supabase
                .from('fields')
                .update(newField)
                .eq('id', editingId)
            error = updateError
        } else {
            const { error: insertError } = await supabase
                .from('fields')
                .insert([newField])
            error = insertError
        }

        if (error) alert(error.message)
        else {
            setShowForm(false)
            setEditingId(null)
            setNewField({ name: '', players_per_team: 5, price_per_hour: '', address: '' })
            fetchFields()
        }
        setLoading(false)
    }

    function handleEdit(field) {
        setEditingId(field.id)
        setNewField({
            name: field.name,
            players_per_team: field.players_per_team,
            price_per_hour: field.price_per_hour,
            address: field.address
        })
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function cancelEdit() {
        setShowForm(false)
        setEditingId(null)
        setNewField({ name: '', players_per_team: 5, price_per_hour: '', address: '' })
    }

    async function deleteField(id) {
        if (!confirm('¿Estás seguro de eliminar esta cancha?')) return
        const { error } = await supabase
            .from('fields')
            .delete()
            .eq('id', id)

        if (error) alert(error.message)
        else fetchFields()
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--primary)', fontSize: '2rem' }}>Catálogo de Canchas</h2>
                {profile?.is_admin && !showForm && (
                    <button
                        className="btn-primary"
                        onClick={() => setShowForm(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <Plus size={20} /> Nueva Cancha
                    </button>
                )}
            </div>

            {showForm && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                    <form onSubmit={handleSubmit} className="premium-card" style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
                        <button
                            type="button"
                            onClick={cancelEdit}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>
                        <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>
                            {editingId ? 'Editar Cancha' : 'Nueva Cancha'}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Nombre de la Cancha</label>
                                <input
                                    type="text"
                                    required
                                    className="premium-input"
                                    style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                    value={newField.name}
                                    onChange={e => setNewField({ ...newField, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Jugadores por Equipo</label>
                                <input
                                    type="number"
                                    required
                                    className="premium-input"
                                    style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                    value={newField.players_per_team}
                                    onChange={e => setNewField({ ...newField, players_per_team: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Precio por Hora (S/)</label>
                                <input
                                    type="number"
                                    required
                                    className="premium-input"
                                    style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                    value={newField.price_per_hour}
                                    onChange={e => setNewField({ ...newField, price_per_hour: e.target.value })}
                                />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Dirección / Link Maps</label>
                                <input
                                    type="text"
                                    className="premium-input"
                                    style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '8px', color: 'white' }}
                                    value={newField.address}
                                    onChange={e => setNewField({ ...newField, address: e.target.value })}
                                />
                            </div>
                        </div>
                        <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }}>Guardar Cancha</button>
                    </form>
                </div>
            )}

            <div className="grid-dashboard" style={{ padding: 0 }}>
                {loading ? (
                    <p>Cargando canchas...</p>
                ) : fields.length === 0 ? (
                    <p style={{ color: 'var(--text-dim)' }}>No hay canchas registradas aún.</p>
                ) : (
                    fields.map(field => (
                        <div key={field.id} className="premium-card" style={{ position: 'relative' }}>
                            {profile?.is_admin && (
                                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleEdit(field)}
                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                                        title="Editar"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => deleteField(field.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                                        title="Eliminar"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )}
                            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{field.name}</h3>
                            <div style={{ display: 'grid', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Users size={16} /> Fútbol {field.players_per_team} ({field.players_per_team * 2} jugadores)
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <DollarSign size={16} /> S/ {field.price_per_hour} por hora
                                </div>
                                {field.address && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={16} />
                                        {field.address.startsWith('http') ? (
                                            <a
                                                href={field.address}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}
                                            >
                                                Ver ubicación en Maps
                                            </a>
                                        ) : (
                                            field.address
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div >
    )
}
