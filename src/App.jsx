import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import './styles/global.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import Auth from './pages/Auth'
import ProfileSetup from './pages/ProfileSetup'
import Fields from './pages/Fields'
import Matches from './pages/Matches'
import MatchDetail from './pages/MatchDetail'
import { supabase } from './lib/supabase'


function MainContent() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

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
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>FutGO</Link>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          <NavLink
            to="/"
            style={({ isActive }) => ({ cursor: 'pointer', color: isActive ? 'var(--primary)' : 'white', textDecoration: 'none' })}
          >
            Inicio
          </NavLink>
          <NavLink
            to="/partidos"
            style={({ isActive }) => ({ cursor: 'pointer', color: isActive ? 'var(--primary)' : 'white', textDecoration: 'none' })}
          >
            Partidos
          </NavLink>
          <NavLink
            to="/canchas"
            style={({ isActive }) => ({ cursor: 'pointer', color: isActive ? 'var(--primary)' : 'white', textDecoration: 'none' })}
          >
            Canchas
          </NavLink>
        </nav>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'right', marginRight: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{profile?.full_name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{user?.email} {profile?.is_super_admin ? '(Owner)' : (profile?.is_admin && '(Admin)')}</div>
          </div>
          <button className="btn-primary" onClick={signOut} style={{ background: 'var(--danger)', color: 'white', padding: '0.5rem 1rem' }}>Salir</button>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Dashboard profile={profile} onMatchClick={(m) => navigate(`/partido/${m.id}`, { state: { match: m } })} />} />
          <Route path="/partidos" element={<Matches profile={profile} onMatchClick={(m) => navigate(`/partido/${m.id}`, { state: { match: m } })} />} />
          <Route path="/canchas" element={<Fields profile={profile} />} />
          <Route path="/partido/:id" element={<MatchDetail profile={profile} onBack={() => navigate('/partidos')} />} />
          <Route path="*" element={<div className="flex-center" style={{ minHeight: '60vh' }}><h3>404 - Página no encontrada</h3></div>} />
        </Routes>
      </main>
    </div>
  )
}

function Dashboard({ profile, onMatchClick }) { // Receive profile as prop
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
        <h3>Mi Estado</h3>
        <p style={{ color: 'var(--text-dim)', margin: '1rem 0' }}>No tienes partidos por confirmar.</p>
        <div style={{ fontSize: '0.9rem', color: 'var(--primary)', opacity: 0.8 }}>
          ¡Todo al día! Asegura tu cupo pagando por Yape/Plin.
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
