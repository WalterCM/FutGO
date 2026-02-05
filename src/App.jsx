import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import './styles/global.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Wallet, Star, LayoutDashboard, Calendar, MapPin, Users as UsersIcon, LogOut, Menu, X } from 'lucide-react'
import Auth from './pages/Auth'
import ProfileSetup from './pages/ProfileSetup'
import Fields from './pages/Fields'
import Matches from './pages/Matches'
import MatchDetail from './pages/MatchDetail'
import Users from './pages/Users'
import { supabase } from './lib/supabase'


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
  if (!profile) return <ProfileSetup onComplete={refreshProfile} />

  const NavLinks = ({ mobile = false }) => (
    <>
      <NavLink
        to="/"
        style={({ isActive }) => ({
          cursor: 'pointer',
          color: isActive ? 'var(--primary)' : 'white',
          textDecoration: 'none',
          fontSize: mobile ? '1.2rem' : '1rem',
          fontWeight: mobile ? '600' : 'normal'
        })}
      >
        Inicio
      </NavLink>
      <NavLink
        to="/partidos"
        style={({ isActive }) => ({
          cursor: 'pointer',
          color: isActive ? 'var(--primary)' : 'white',
          textDecoration: 'none',
          fontSize: mobile ? '1.2rem' : '1rem',
          fontWeight: mobile ? '600' : 'normal'
        })}
      >
        Partidos
      </NavLink>
      <NavLink
        to="/canchas"
        style={({ isActive }) => ({
          cursor: 'pointer',
          color: isActive ? 'var(--primary)' : 'white',
          textDecoration: 'none',
          fontSize: mobile ? '1.2rem' : '1rem',
          fontWeight: mobile ? '600' : 'normal'
        })}
      >
        Canchas
      </NavLink>
      {profile?.is_super_admin && (
        <NavLink
          to="/usuarios"
          style={({ isActive }) => ({
            cursor: 'pointer',
            color: isActive ? 'var(--primary)' : 'white',
            textDecoration: 'none',
            fontSize: mobile ? '1.2rem' : '1rem',
            fontWeight: mobile ? '600' : 'normal'
          })}
        >
          Usuarios
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
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{profile?.full_name}</div>
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
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{profile?.full_name}</div>
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
          <Route path="/partido/:id" element={<MatchDetail profile={profile} onBack={handleBack} />} />
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

      <section className="premium-card">
        <h3>Mi Ranking</h3>
        <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>{profile?.elo_rating || 1200} ELO</div>
        <p style={{ color: 'var(--primary)' }}>Nivel: {profile?.elo_rating > 1400 ? 'Crack ★★★★★' : 'Promesa ★★★☆☆'}</p>
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
