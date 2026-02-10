import React, { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Calendar, MapPin, Users as UsersIcon, Trophy } from 'lucide-react'

export const NavLinks = memo(({ profile }) => (
  <>
    <NavLink
      to="/"
      style={({ isActive }) => ({
        cursor: 'pointer',
        color: isActive ? 'var(--primary)' : 'white',
        textDecoration: 'none',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem'
      })}
    >
      <LayoutDashboard size={18} /> Inicio
    </NavLink>
    <NavLink
      to="/partidos"
      style={({ isActive }) => ({
        cursor: 'pointer',
        color: isActive ? 'var(--primary)' : 'white',
        textDecoration: 'none',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem'
      })}
    >
      <Calendar size={18} /> Partidos
    </NavLink>
    <NavLink
      to="/canchas"
      style={({ isActive }) => ({
        cursor: 'pointer',
        color: isActive ? 'var(--primary)' : 'white',
        textDecoration: 'none',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem'
      })}
    >
      <MapPin size={18} /> Canchas
    </NavLink>
    <NavLink
      to="/lideres"
      style={({ isActive }) => ({
        cursor: 'pointer',
        color: isActive ? 'var(--primary)' : 'white',
        textDecoration: 'none',
        fontSize: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem'
      })}
    >
      <Trophy size={18} /> Líderes
    </NavLink>
    {profile?.is_super_admin && (
      <NavLink
        to="/usuarios"
        style={({ isActive }) => ({
          cursor: 'pointer',
          color: isActive ? 'var(--primary)' : 'white',
          textDecoration: 'none',
          fontSize: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem'
        })}
      >
        <UsersIcon size={18} /> Usuarios
      </NavLink>
    )}
  </>
))

export const MobileNavLinks = memo(({ profile }) => (
  <>
    <NavLink
      to="/"
      style={({ isActive }) => ({
        cursor: 'pointer',
        color: isActive ? 'var(--primary)' : 'white',
        textDecoration: 'none',
        fontSize: '1.2rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem'
      })}
    >
      <LayoutDashboard size={24} /> Inicio
    </NavLink>
    <NavLink
      to="/partidos"
      style={({ isActive }) => ({
        cursor: 'pointer',
        color: isActive ? 'var(--primary)' : 'white',
        textDecoration: 'none',
        fontSize: '1.2rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem'
      })}
    >
      <Calendar size={24} /> Partidos
    </NavLink>
    <NavLink
      to="/canchas"
      style={({ isActive }) => ({
        cursor: 'pointer',
        color: isActive ? 'var(--primary)' : 'white',
        textDecoration: 'none',
        fontSize: '1.2rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem'
      })}
    >
      <MapPin size={24} /> Canchas
    </NavLink>
    <NavLink
      to="/lideres"
      style={({ isActive }) => ({
        cursor: 'pointer',
        color: isActive ? 'var(--primary)' : 'white',
        textDecoration: 'none',
        fontSize: '1.2rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.8rem'
      })}
    >
      <Trophy size={24} /> Líderes
    </NavLink>
    {profile?.is_super_admin && (
      <NavLink
        to="/usuarios"
        style={({ isActive }) => ({
          cursor: 'pointer',
          color: isActive ? 'var(--primary)' : 'white',
          textDecoration: 'none',
          fontSize: '1.2rem',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '0.8rem'
        })}
      >
        <UsersIcon size={24} /> Usuarios
      </NavLink>
    )}
  </>
))