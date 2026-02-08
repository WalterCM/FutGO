import React from 'react'
import { User, Shield, ShieldCheck, Pencil, Loader2 } from 'lucide-react'
import { getDisplayName } from '../../lib/utils'

export default function UserTable({
    users,
    profile,
    onEditName,
    onToggleRole,
    actionLoading
}) {
    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {users.map(user => (
                <div key={user.id} className="premium-card" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.2rem',
                    border: user.is_super_admin ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: user.id === profile.id ? 'rgba(var(--primary-rgb), 0.05)' : 'var(--bg-card)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                        <div style={{
                            width: '45px',
                            height: '45px',
                            borderRadius: '50%',
                            background: 'var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)'
                        }}>
                            <User size={24} />
                        </div>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {getDisplayName(user)}
                                <button
                                    onClick={() => onEditName(user)}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', opacity: 0.5, padding: '0.2rem' }}
                                    title="Editar Nombre/Apodo"
                                >
                                    <Pencil size={14} />
                                </button>
                                {user.is_super_admin && <ShieldCheck size={16} style={{ color: 'var(--primary)' }} title="Owner" />}
                            </div>
                            {user.nickname && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                    Oficial: {user.full_name}
                                </div>
                            )}
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                                {user.is_super_admin ? 'Owner' : (user.is_admin ? 'Administrador' : 'Jugador')}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        {/* Admin Toggle */}
                        <button
                            onClick={() => onToggleRole(user, 'is_admin')}
                            disabled={user.is_super_admin || actionLoading === user.id + 'is_admin'}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: user.is_admin ? 'var(--primary)' : 'transparent',
                                color: user.is_admin ? 'black' : 'var(--text-dim)',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                opacity: user.is_super_admin ? 0.5 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                minWidth: '100px',
                                justifyContent: 'center'
                            }}
                        >
                            {actionLoading === user.id + 'is_admin' ? <Loader2 size={14} className="spin" /> :
                                (<> <Shield size={14} /> {user.is_admin ? 'Es Admin' : 'Hacer Admin'} </>)}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
