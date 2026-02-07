import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { AlertModal } from '../components/ConfirmModal'

export default function Auth() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [alertData, setAlertData] = useState(null)
    const { signIn, signUp } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        const { error } = isSignUp
            ? await signUp({ email, password })
            : await signIn({ email, password })

        if (error) {
            setAlertData({ title: 'Error', message: error.message, variant: 'danger' })
        } else if (isSignUp) {
            setAlertData({ title: '¡Cuenta Creada!', message: '¡Revisa tu email para confirmar tu cuenta!', variant: 'success' })
        }
        setLoading(false)
    }

    return (
        <>
            <div className="flex-center auth-wrapper">
                <form onSubmit={handleSubmit} className="premium-card" style={{ width: '100%', maxWidth: '400px' }}>
                    <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)', textAlign: 'center', fontSize: '2rem' }}>
                        {isSignUp ? 'Únete a FutGO' : 'Bienvenido'}
                    </h2>

                    <div style={{ marginBottom: '1.2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Email</label>
                        <input
                            type="email"
                            className="premium-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu@email.com"
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white',
                                fontSize: '1rem', outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Contraseña</label>
                        <input
                            type="password"
                            className="premium-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%', padding: '1rem', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white',
                                fontSize: '1rem', outline: 'none'
                            }}
                        />
                    </div>

                    <button disabled={loading} className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
                        {loading ? 'Procesando...' : isSignUp ? 'Crear mi cuenta' : 'Entrar a la cancha'}
                    </button>

                    <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-dim)' }}>
                        {isSignUp ? '¿Ya eres del equipo?' : '¿Aún no tienes cuenta?'}
                        <span
                            onClick={() => setIsSignUp(!isSignUp)}
                            style={{ color: 'var(--primary)', cursor: 'pointer', marginLeft: '0.5rem', fontWeight: 'bold' }}
                        >
                            {isSignUp ? 'Inicia sesión' : 'Regístrate aquí'}
                        </span>
                    </p>
                </form>
            </div>

            <AlertModal
                isOpen={!!alertData}
                onClose={() => setAlertData(null)}
                title={alertData?.title || 'Aviso'}
                message={alertData?.message}
                variant={alertData?.variant || 'info'}
            />
        </>
    )
}
