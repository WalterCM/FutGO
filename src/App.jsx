import React, { useState, useEffect } from 'react'
import './styles/global.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import Auth from './pages/Auth'
import ProfileSetup from './pages/ProfileSetup'
import Fields from './pages/Fields'
import { supabase } from './lib/supabase'


function MainContent({ view, setView }) {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkProfile = async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(data)
    setLoading(false)
  }

  useEffect(() => {
    checkProfile()
  }, [user])

  if (loading && user) return <div className="flex-center" style={{ minHeight: '100vh' }}>Cargando...</div>
  if (!user) return <Auth />
  if (!profile) return <ProfileSetup onComplete={checkProfile} />

  return (
    <div className="app">
      <header className="header">
        <div className="logo" onClick={() => setView('dashboard')} style={{ cursor: 'pointer' }}>FutGO</div>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          <span
            onClick={() => setView('dashboard')}
            style={{ cursor: 'pointer', color: view === 'dashboard' ? 'var(--primary)' : 'white' }}
          >
            Inicio
          </span>
          <span
            onClick={() => setView('fields')}
            style={{ cursor: 'pointer', color: view === 'fields' ? 'var(--primary)' : 'white' }}
          >
            Canchas
          </span>
        </nav>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', marginRight: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{profile?.full_name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{user?.email} {profile?.is_admin && '(Admin)'}</div>
          </div>
          <button className="btn-primary" onClick={signOut} style={{ background: 'var(--danger)', color: 'white', padding: '0.5rem 1rem' }}>Salir</button>
        </div>
      </header>

      {view === 'dashboard' ? <Dashboard profile={profile} /> : <Fields profile={profile} />}
    </div>
  )
}

function Dashboard({ profile }) { // Receive profile as prop
  const { user } = useAuth()
  // Removed local profile state and useEffect for fetching profile, as it's now passed as a prop

  return (
    <main className="grid-dashboard">
      <section className="premium-card">
        <h3>Próximo Partido</h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>Viernes, 20:00 • Cancha "El Monumental"</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>12 / 14 Jugadores</span>
          <button className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Unirme</button>
        </div>
      </section>

      <section className="premium-card">
        <h3>Mi Ranking</h3>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>{profile?.elo_rating || 1200} ELO</div>
        <p style={{ color: 'var(--primary)' }}>Nivel: {profile?.elo_rating > 1500 ? 'Crack ★★★★★' : 'Amateur ★★★☆☆'}</p>
      </section>

      <section className="premium-card">
        <h3>Pendientes</h3>
        <p style={{ color: 'var(--danger)' }}>No tienes deudas pendientes</p>
        <button className="btn-primary" style={{ marginTop: '1rem', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', opacity: 0.5 }} disabled>Ver Deuda (S/)</button>
      </section>
    </main>
  )
}

function App() {
  const [view, setView] = useState('dashboard')

  return (
    <AuthProvider>
      <MainContent view={view} setView={setView} />
    </AuthProvider>
  )
}

export default App
