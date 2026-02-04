import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import './styles/global.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Wallet, Star, LayoutDashboard, Calendar, MapPin, Users as UsersIcon, LogOut } from 'lucide-react'
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

  if (user && !profile) return <div className="flex-center" style={{ minHeight: '100vh' }}>Cargando datos...</div>
  if (!user) return <Auth />
  if (!profile) return <ProfileSetup onComplete={refreshProfile} />

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
          {profile?.is_super_admin && (
            <NavLink
              to="/usuarios"
              style={({ isActive }) => ({ cursor: 'pointer', color: isActive ? 'var(--primary)' : 'white', textDecoration: 'none' })}
            >
              Usuarios
            </NavLink>
          )}
        </nav>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {/* Wallet disabled for decentralized model */}
          {/* 
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <Wallet size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>S/ {profile?.balance || 0}</span>
          </div>
          */}
          <div style={{ textAlign: 'right', marginRight: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{profile?.full_name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{user?.email} {profile?.is_super_admin ? '(Owner)' : (profile?.is_admin && '(Admin)')}</div>
          </div>
          <button className="btn-primary" onClick={signOut} style={{ background: 'var(--danger)', color: 'white', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <LogOut size={16} /> <span style={{ display: 'none' }}>Salir</span>
          </button>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Dashboard profile={profile} onMatchClick={(m) => navigate(`/partido/${m.id}`, { state: { match: m } })} />} />
          <Route path="/partidos" element={<Matches profile={profile} onMatchClick={(m) => navigate(`/partido/${m.id}`, { state: { match: m } })} />} />
          <Route path="/canchas" element={<Fields profile={profile} />} />
          <Route path="/usuarios" element={<Users profile={profile} />} />
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
