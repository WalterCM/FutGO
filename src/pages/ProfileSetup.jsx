import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ProfileSetup({ onComplete }) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                full_name: fullName,
                elo_rating: 1200,
                is_admin: false
            })

        if (error) {
            alert(error.message)
        } else {
            onComplete()
        }
        setLoading(false)
    }

    return (
        <div className="flex-center auth-wrapper">
            <form onSubmit={handleSubmit} className="premium-card" style={{ width: '100%', maxWidth: '400px' }}>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', textAlign: 'center' }}>Completa tu Ficha</h2>
                <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', textAlign: 'center' }}>
                    Necesitamos saber cómo te conocen en la cancha para armar los equipos.
                </p>

                <div style={{ marginBottom: '2rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Tu Nombre o Apodo</label>
                    <input
                        type="text"
                        className="premium-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Ej: Lolo Fernández o 'El Capitán'"
                        required
                        style={{
                            width: '100%', padding: '1rem', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white'
                        }}
                    />
                </div>

                <button disabled={loading || !fullName} className="btn-primary" style={{ width: '100%' }}>
                    {loading ? 'Guardando...' : '¡Listo para jugar!'}
                </button>
            </form>
        </div>
    )
}
