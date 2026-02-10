import React from 'react'
import { Menu, X, LogOut } from 'lucide-react'
import { getDisplayName } from '../lib/utils'
import { MobileNavLinks } from './Navigation'

export const Header = ({ 
  profile, 
  user, 
  signOut, 
  setProfileModal, 
  isMenuOpen, 
  setIsMenuOpen 
}) => (
  <header className="header">
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button className="nav-mobile-toggle" onClick={() => setIsMenuOpen(true)}>
        <Menu size={24} />
      </button>
      <a href="/" className="logo" style={{ textDecoration: 'none' }}>⚽ FutGO</a>
    </div>

    <nav className="nav-desktop">
      {/* NavLinks will be rendered here via props */}
    </nav>

    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <div
        className="user-info-desktop"
        style={{ textAlign: 'right', marginRight: '1rem', cursor: 'pointer' }}
        onClick={() => setProfileModal(true)}
      >
        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
          {getDisplayName(profile, profile?.id, null, profile?.is_super_admin)}
        </div>
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
        <div className="mobile-menu-drawer animate-slide-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span className="logo">⚽ FutGO</span>
            <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          </div>

          <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
              {getDisplayName(profile, profile?.id, null, profile?.is_super_admin)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{user?.email}</div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
)