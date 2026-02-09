import React, { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import './styles/global.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Wallet, Star, LayoutDashboard, Calendar, MapPin, Users as UsersIcon, LogOut, Menu, X, Activity } from 'lucide-react'
import Auth from './pages/Auth'
import ProfileSetup from './pages/ProfileSetup'
import Fields from './pages/Fields'
import Matches from './pages/Matches/index'
import ProfileModal from './components/ProfileModal'
import MatchDetail from './pages/MatchDetail/index'
import Users from './pages/Users/index'
import Stats from './pages/Stats'
import { Trophy } from 'lucide-react'
import { supabase } from './lib/supabase'
import { getRating, getDisplayName } from './lib/utils'


function MainContent() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [profileModal, setProfileModal] = useState(false)

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

  if (loading) return <div className="flex-center" style={{ minHeight: '100vh' }}>Cargando...</div>

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
          <Link to="/" className="logo" style={{ textDecoration: 'none' }}>⚽ FutGO</Link>
        </div>

        <nav className="nav-desktop">
          <NavLinks />
        </nav>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div
            className="user-info-desktop"
            style={{ textAlign: 'right', marginRight: '1rem', cursor: 'pointer' }}
            onClick={() => setProfileModal(true)}
          >
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{getDisplayName(profile, profile?.id, null, profile?.is_super_admin)}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{user?.email} {profile?.is_super_admin ? '(Owner)' : (profile?.is_admin && '(Admin)')}</div>
          </div>
          <button className="btn-primary" onClick={signOut} style={{ background: 'var(--danger)', color: 'white', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LogOut size={16} /> <span className="user-info-desktop">Salir</span>
          </button>
        </div>
      </header>

      <ProfileModal
        show={profileModal}
        onClose={() => setProfileModal(false)}
        profile={profile}
        onUpdate={refreshProfile}
      />

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)} />
          <div className="mobile-menu-drawer animate-slide-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="logo">⚽ FutGO</span>
              <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{getDisplayName(profile, profile?.id, null, profile?.is_super_admin)}</div>
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
          <Route path="/lideres" element={<Stats viewerId={profile?.id} viewerIsSuperAdmin={profile?.is_super_admin} />} />
          <Route path="/partido/:id" element={<MatchDetail profile={profile} onBack={handleBack} />} />
          <Route path="*" element={<div className="flex-center" style={{ minHeight: '60vh' }}><h3>404 - Página no encontrada</h3></div>} />
        </Routes>
      </main>
    </div>
  )
}

function Dashboard({ profile, onMatchClick }) {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    nextMatch: null,
    gamesPlayed: 0,
    goals: 0,
    loading: true
  })

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // 1. Fetch Next Match (Closest upcoming)
        const { data: nextMatch } = await supabase
          .from('matches')
          .select('*, field:fields(*)')
          .gte('date', new Date().toISOString().split('T')[0])
          .eq('is_canceled', false)
          .order('date', { ascending: true })
          .order('time', { ascending: true })
          .limit(1)
          .maybeSingle()

        // 2. Fetch Games Played (Enrolled + Present)
        const { count: gamesPlayed } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('player_id', profile.id)
          .eq('is_present', true)

        // 3. Fetch Goals (from completed games where user played)
        const { data: games } = await supabase
          .from('games')
          .select('goals')
          .or(`team1_players.cs.{${profile.id}},team2_players.cs.{${profile.id}}`)
          .eq('is_completed', true)

        let totalGoals = 0
        if (games) {
          games.forEach(g => {
            if (g.goals && Array.isArray(g.goals)) {
              g.goals.forEach(goal => {
                if (goal.player_id === profile.id) {
                  totalGoals++
                }
              })
            }
          })
        }

        setStats({
          nextMatch,
          gamesPlayed: gamesPlayed || 0,
          goals: totalGoals,
          loading: false
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }

    if (profile?.id) fetchDashboardData()
  }, [profile?.id])

  if (stats.loading) return <div className="flex-center" style={{ minHeight: '300px', color: 'var(--text-dim)' }}>Cargando pichangas...</div>

  const { nextMatch } = stats

  return (
    <div className="grid-dashboard">
      <section className="premium-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} /> Próximo Partido
        </h3>
        {nextMatch ? (
          <>
            <div style={{ margin: '1rem 0' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                {nextMatch.field?.name || 'Cancha por confirmar'}
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                {new Date(nextMatch.date + 'T00:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} • {nextMatch.time.substring(0, 5)} hrs
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-primary"
                style={{ padding: '0.6rem 1.2rem', borderRadius: '10px' }}
                onClick={() => onMatchClick(nextMatch)}
              >
                Ver Detalles
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>No hay partidos programados pronto.</p>
            <button
              className="btn-primary"
              style={{ padding: '0.6rem 1.2rem', marginTop: '1rem', borderRadius: '10px' }}
              onClick={() => navigate('/partidos')}
            >
              Explorar Partidos
            </button>
          </div>
        )}
      </section>

      <section className="premium-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={20} /> Partidos Jugados
        </h3>
        <div style={{ fontSize: '3rem', fontWeight: '900', margin: '0.5rem 0', color: 'var(--primary)', lineHeight: 1 }}>
          {stats.gamesPlayed}
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Presencias confirmadas en cancha.</p>
      </section>

      <section className="premium-card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Star size={20} style={{ fill: 'var(--primary)', color: 'var(--primary)' }} /> Goles Anotados
        </h3>
        <div style={{ fontSize: '3rem', fontWeight: '900', margin: '0.5rem 0', color: 'var(--primary)', lineHeight: 1 }}>
          {stats.goals}
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Total de goles en partidos oficiales.</p>
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
