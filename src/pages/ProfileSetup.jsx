import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AlertModal } from '../components/ConfirmModal'

export default function ProfileSetup({ onComplete }) {
    const { user, profile } = useAuth()
    const [fullName, setFullName] = useState(
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        user?.user_metadata?.name ||
        ''
    )
    const [nickname, setNickname] = useState('')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!fullName.trim()) {
            setErrorMsg('El nombre es requerido')
            return
        }

        setLoading(true)

        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: user.id, // Ensure ID is included for upsert
                full_name: fullName.trim(),
                nickname: nickname.trim() || null,
                phone: phone.trim() || null,
                profile_complete: true
            })

        if (error) {
            setErrorMsg(error.message)
            setLoading(false)
            return
        }

        onComplete()
    }

    return (
        <>
            <div className="flex-center auth-wrapper">
                <form onSubmit={handleSubmit} className="premium-card" style={{ width: '100%', maxWidth: '450px' }}>
                    <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary)', textAlign: 'center', fontSize: '1.8rem' }}>
                        ⚽ Confirma tu perfil
                    </h2>
                    <p style={{ marginBottom: '2rem', color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center' }}>
                        Verifica que tu información es correcta
                    </p>

                    {/* Full Name Field */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            Nombre Completo *
                        </label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            placeholder="Tu nombre real"
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border)',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                        <p style={{ marginTop: '0.5rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                            ⚠️ Usa tu nombre real para que el admin pueda verificar tu pago en Yape
                        </p>
                    </div>

                    {/* Nickname Field */}
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'white', fontSize: '0.9rem', fontWeight: 'bold' }}>
                            Apodo <span style={{ color: 'var(--text-dim)', fontWeight: 'normal' }}>(opcional)</span>
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Ej: Juancho, El Crack, etc."
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border)',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none'
                            }}
                        />
                        <p style={{ marginTop: '0.5rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                            💡 Si agregas un apodo, los demás jugadores verán tu apodo en vez de tu nombre completo
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !fullName.trim()}
                        className="btn-primary"
                        style={{ width: '100%', padding: '1rem' }}
                    >
                        {loading ? 'Guardando...' : 'Confirmar y Continuar'}
                    </button>
                </form>
            </div>

            <AlertModal
                isOpen={!!errorMsg}
                onClose={() => setErrorMsg(null)}
                title="Error"
                message={errorMsg}
                variant="danger"
            />
        </>
    )
}
