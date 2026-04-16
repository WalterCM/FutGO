/**
 * App - Main Application Hub & Dashboard
 * 
 * BUSINESS LOGIC DOCUMENTATION:
 * 
 * 1. DASHBOARD STATISTICS (ESTADÍSTICAS EN VIVO)
 *    - Data is fetched on-the-fly when the profile is loaded
 *    - PRÓXIMO PARTIDO: Fetches the closest upcoming match that isn't canceled
 *    - PARTIDOS JUGADOS: Counts `enrollments` where `is_present = true` and `is_excluded = false`
 *    - GOLES ANOTADOS: Iterates through all `completed` games where the user played. 
 *      Counts instances within the `goals` JSONB array where `player_id` matches the user.
 * 
 * 2. APP INITIALIZATION & PROFILE SETUP
 *    - On mount, the app checks for a valid session via `AuthContext`
 *    - If a session exists but no profile is found, the user is redirected to `/setup`
 *    - Navigational links (Asistencias, Equipos, Fixture) are only active when a match is selected
 */

import React, { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom'
import './styles/global.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProfileModal from './components/ProfileModal'
import { NavLinks, MobileNavLinks } from './components/Navigation'
import { useDashboardStats, NextMatchCard, StatsCard } from './components/Dashboard'
import { Menu, X, LogOut, Calendar, Activity, Star } from 'lucide-react'


// Lazy load components for better performance
const Auth = lazy(() => import('./pages/Auth'))
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'))
const Fields = lazy(() => import('./pages/Fields'))
const Matches = lazy(() => import('./pages/Matches/index'))
const MatchDetail = lazy(() => import('./pages/MatchDetail/index'))
const Users = lazy(() => import('./pages/Users/index'))
const Stats = lazy(() => import('./pages/Stats'))

function MainContent() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const renderCount = useRef(0)
  renderCount.current++
  console.log('MainContent render:', renderCount.current, 'isMenuOpen:', isMenuOpen)
  const [profileModal, setProfileModal] = useState(false)

  const handleMatchClick = useCallback((m) => {
    const slugOrId = m.slug || m.id
    navigate(`/partido/${slugOrId}`, { state: { match: m } })
    setIsMenuOpen(false)
  }, [navigate])

  const handleBack = useCallback(() => {
    navigate('/partidos')
  }, [navigate])

  // Close menu when location changes
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location])

  // Close menu when clicking outside
  useEffect(() => {
    if (!isMenuOpen) return
    
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen])

  if (loading) return <div className="flex-center" style={{ minHeight: '100vh' }}>Cargando...</div>

  if (!user) {
    return (
      <Suspense fallback={<div className="flex-center" style={{ minHeight: '100vh' }}>Cargando...</div>}>
        <Auth />
      </Suspense>
    )
  }
  
  if (!profile?.profile_complete) {
    return (
      <Suspense fallback={<div className="flex-center" style={{ minHeight: '100vh' }}>Cargando...</div>}>
        <ProfileSetup onComplete={refreshProfile} />
      </Suspense>
    )
  }
  

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="nav-mobile-toggle" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen) }} aria-label="Abrir menú">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
          <Link to="/" className="logo" style={{ textDecoration: 'none' }}>⚽ FutGO</Link>
        </div>

        <nav className="nav-desktop">
          <NavLinks profile={profile} />
        </nav>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div
            className="user-info-desktop"
            style={{ textAlign: 'right', marginRight: '1rem', cursor: 'pointer' }}
            onClick={() => setProfileModal(true)}
          >
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{profile?.nickname || profile?.full_name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
              {user?.email} {profile?.is_super_admin ? '(Owner)' : (profile?.is_admin && '(Admin)')}
            </div>
          </div>
          <button 
            className="btn-primary" 
            onClick={signOut} 
            style={{ 
              background: 'var(--danger)', 
              color: 'white', 
              padding: '0.5rem 1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem' 
            }}
          >
            <LogOut size={16} /> <span className="user-info-desktop">Salir</span>
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {isMenuOpen && (
          <>
            <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)} />
            <div className="mobile-menu-drawer animate-slide-in" ref={menuRef}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="logo">⚽ FutGO</span>
                <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                  <X size={24} />
                </button>
              </div>

              <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                  {profile?.nickname || profile?.full_name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{user?.email}</div>
              </div>

              <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <MobileNavLinks profile={profile} />
              </nav>

              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                <button
                  className="btn-primary"
                  onClick={signOut}
                  style={{ 
                    background: 'var(--danger)', 
                    color: 'white', 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    gap: '0.6rem' 
                  }}
                >
                  <LogOut size={20} /> Salir
                </button>
              </div>
            </div>
          </>
        )}
      </header>

      <ProfileModal
        show={profileModal}
        onClose={() => setProfileModal(false)}
        profile={profile}
        onUpdate={refreshProfile}
      />

      <main>
        <Suspense fallback={<div className="flex-center" style={{ minHeight: '60vh' }}>Cargando...</div>}>
          <Routes>
            <Route path="/" element={<Dashboard profile={profile} onMatchClick={handleMatchClick} />} />
            <Route path="/partidos" element={<Matches profile={profile} onMatchClick={handleMatchClick} />} />
            <Route path="/canchas" element={<Fields profile={profile} />} />
            <Route path="/usuarios" element={<Users profile={profile} />} />
            <Route path="/lideres" element={<Stats viewerId={profile?.id} viewerIsSuperAdmin={profile?.is_super_admin} />} />
            <Route path="/partido/:slugOrId" element={<MatchDetail profile={profile} onBack={handleBack} />} />
            <Route path="*" element={<div className="flex-center" style={{ minHeight: '60vh' }}><h3>404 - Página no encontrada</h3></div>} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

function Dashboard({ profile, onMatchClick }) {
  const navigate = useNavigate()
  const stats = useDashboardStats(profile?.id)

  if (stats.loading) {
    return <div className="flex-center" style={{ minHeight: '300px', color: 'var(--text-dim)' }}>Cargando pichangas...</div>
  }

  return (
    <div className="grid-dashboard">
      <NextMatchCard 
        nextMatch={stats.nextMatch} 
        onMatchClick={onMatchClick} 
        navigate={navigate}
      />
      
      <StatsCard
        title="Partidos Jugados"
        value={stats.gamesPlayed}
        subtitle="Presencias confirmadas en cancha."
        icon={<Activity size={20} />}
      />
      
      <StatsCard
        title="Goles Anotados"
        value={stats.goals}
        subtitle="Total de goles en partidos oficiales."
        icon={<Star size={20} style={{ fill: 'var(--primary)', color: 'var(--primary)' }} />}
      />
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
