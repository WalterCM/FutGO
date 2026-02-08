import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import './styles/global.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Wallet, Star, LayoutDashboard, Calendar, MapPin, Users as UsersIcon, LogOut, Menu, X } from 'lucide-react'
import Auth from './pages/Auth'
import ProfileSetup from './pages/ProfileSetup'
import Fields from './pages/Fields'
import Matches from './pages/Matches/index'
import MatchDetail from './pages/MatchDetail/index'
import Users from './pages/Users/index'
import Stats from './pages/Stats'
import { Trophy } from 'lucide-react'
import { supabase } from './lib/supabase'
import { getRating, getDisplayName } from './lib/utils'


function MainContent() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleMatchClick = useCallback((m) => {
    navigate(`/partido/${m.id}`, { state: { match: m } })
    setIsMenuOpen(false)
  }, [navigate])

  const handleBack = useCallback(() => {
    navigate('/partidos')
  }, [navigate])

  // Close menu when location changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  if (user && !profile) return <div className="flex-center" style={{ minHeight: '100vh' }}>Cargando datos...</div>
  if (!user) return <Auth />
  if (!profile?.profile_complete) return <ProfileSetup onComplete={refreshProfile} />

  const NavLinks = ({ mobile = false }) => (
    <>
      <NavLink
        to="/"
        style={({ isActive }) => ({
          cursor: 'pointer',
          color: isActive ? 'var(--primary)' : 'white',
          textDecoration: 'none',
          fontSize: mobile ? '1.2rem' : '1rem',
          fontWeight: mobile ? '600' : 'normal',
          display: 'flex',
          alignItems: 'center',
          gap: mobile ? '0.8rem' : '0.4rem'
        })}
      >
        <LayoutDashboard size={mobile ? 24 : 18} /> Inicio
      </NavLink>
      <NavLink
        to="/partidos"
        style={({ isActive }) => ({
          cursor: 'pointer',
          color: isActive ? 'var(--primary)' : 'white',
          textDecoration: 'none',
          fontSize: mobile ? '1.2rem' : '1rem',
          fontWeight: mobile ? '600' : 'normal',
          display: 'flex',
          alignItems: 'center',
          gap: mobile ? '0.8rem' : '0.4rem'
        })}
      >
        <Calendar size={mobile ? 24 : 18} /> Partidos
      </NavLink>
      <NavLink
        to="/canchas"
        style={({ isActive }) => ({
          cursor: 'pointer',
          color: isActive ? 'var(--primary)' : 'white',
          textDecoration: 'none',
          fontSize: mobile ? '1.2rem' : '1rem',
          fontWeight: mobile ? '600' : 'normal',
          display: 'flex',
          alignItems: 'center',
          gap: mobile ? '0.8rem' : '0.4rem'
        })}
      >
        <MapPin size={mobile ? 24 : 18} /> Canchas
      </NavLink>
      <NavLink
        to="/lideres"
        style={({ isActive }) => ({
          cursor: 'pointer',
          color: isActive ? 'var(--primary)' : 'white',
          textDecoration: 'none',
          fontSize: mobile ? '1.2rem' : '1rem',
          fontWeight: mobile ? '600' : 'normal',
          display: 'flex',
          alignItems: 'center',
          gap: mobile ? '0.8rem' : '0.4rem'
        })}
      >
        <Trophy size={mobile ? 24 : 18} /> Líderes
      </NavLink>
      {profile?.is_super_admin && (
        <NavLink
          to="/usuarios"
          style={({ isActive }) => ({
            cursor: 'pointer',
            color: isActive ? 'var(--primary)' : 'white',
            textDecoration: 'none',
            fontSize: mobile ? '1.2rem' : '1rem',
            fontWeight: mobile ? '600' : 'normal',
            display: 'flex',
            alignItems: 'center',
            gap: mobile ? '0.8rem' : '0.4rem'
          })}
        >
          <UsersIcon size={mobile ? 24 : 18} /> Usuarios
        </NavLink>
      )}
    </>
  )

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="nav-mobile-toggle" onClick={() => setIsMenuOpen(true)}>
            <Menu size={24} />
          </button>
          <Link to="/" className="logo" style={{ textDecoration: 'none' }}>FutGO</Link>
        </div>

        <nav className="nav-desktop">
          <NavLinks />
        </nav>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="user-info-desktop" style={{ textAlign: 'right', marginRight: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{getDisplayName(profile)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{user?.email} {profile?.is_super_admin ? '(Owner)' : (profile?.is_admin && '(Admin)')}</div>
          </div>
          <button className="btn-primary" onClick={signOut} style={{ background: 'var(--danger)', color: 'white', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LogOut size={16} /> <span className="user-info-desktop">Salir</span>
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)} />
          <div className="mobile-menu-drawer animate-slide-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="logo">FutGO</span>
              <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{getDisplayName(profile)}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{user?.email}</div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <NavLinks mobile />
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <button
                className="btn-primary"
                onClick={signOut}
                style={{ background: 'var(--danger)', color: 'white', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.6rem' }}
              >
                <LogOut size={20} /> Salir
              </button>
            </div>
          </div>
        </>
      )}

      <main>
        <Routes>
          <Route path="/" element={<Dashboard profile={profile} onMatchClick={handleMatchClick} />} />
          <Route path="/partidos" element={<Matches profile={profile} onMatchClick={handleMatchClick} />} />
          <Route path="/canchas" element={<Fields profile={profile} />} />
          <Route path="/usuarios" element={<Users profile={profile} />} />
          <Route path="/lideres" element={<Stats />} />
          <Route path="/partido/:id" element={<MatchDetail profile={profile} onBack={handleBack} />} />
          <Route path="*" element={<div className="flex-center" style={{ minHeight: '60vh' }}><h3>404 - Página no encontrada</h3></div>} />
        </Routes>
      </main>
    </div>
  )
}

function Dashboard({ profile, onMatchClick }) { // Receive profile as prop
  const navigate = useNavigate()
  const [maxElo, setMaxElo] = useState(2000)

  useEffect(() => {
    async function fetchMaxElo() {
      const { data } = await supabase
        .from('profiles')
        .select('elo_rating')
        .order('elo_rating', { ascending: false })
        .limit(1)
        .single()

      if (data?.elo_rating) setMaxElo(data.elo_rating)
    }
    fetchMaxElo()
  }, [])

  const rating = getRating(profile?.elo_rating, maxElo)

  return (
    <div className="grid-dashboard">
      <section className="premium-card">
        <h3>Próximo Partido</h3>
        <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>Sábado, 20:00 • El Monumental</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>12 reservado</span>
          <button className="btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => onMatchClick({ id: 'latest' })}>Ir al Partido</button>
        </div>
      </section>

      {/* Wallet disabled for decentralized model */}
      {/* 
      <section className="premium-card">
        <h3>Mi Billetera FutGO</h3>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0', color: 'var(--primary)' }}>S/ {profile?.balance || 0}</div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Saldo disponible para tus pichangas.</p>
      </section>
      */}

      <section className="premium-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/lideres')}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Trophy size={20} /> Mi Nivel
        </h3>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Rating FutGO</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>
          {rating}
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Toca para ver los Líderes</p>
      </section>
    </div>
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
