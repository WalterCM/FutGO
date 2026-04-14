import React from 'react'
import { User, Shield, ShieldCheck, Pencil, Loader2, Trash2 } from 'lucide-react'
import { getDisplayName } from '../../lib/utils'

export default function UserTable({
    users,
    profile,
    onEditName,
    onToggleRole,
    onDeleteUser,
    actionLoading
}) {
    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {users.map(user => (
                <div key={user.id} className='premium-card' style={{
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
                                {getDisplayName(user, profile.id, null, profile.is_super_admin)}
                                <button
                                    onClick={() => onEditName(user)}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', opacity: 0.5, padding: '0.2rem' }}
                                    title='Editar Nombre/Apodo'
                                >
                                    <Pencil size={14} />
                                </button>
                                {user.is_super_admin && <ShieldCheck size={16} style={{ color: 'var(--primary)' }} title='Owner' />}
                            </div>
                            {user.nickname && (profile.is_super_admin) && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                    ({user.full_name})
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
                            {actionLoading === user.id + 'is_admin' ? <Loader2 size={14} className='spin' /> :
                                (<> <Shield size={14} /> {user.is_admin ? 'Es Admin' : 'Hacer Admin'} </>)}
                        </button>
                        {/* Delete Button - only for users without auth account (guests) */}
                        {!user.is_admin && !user.is_super_admin && (
                            <button
                                onClick={(e) => {
                                    if (!user.is_guest) return
                                    onDeleteUser(user)
                                }}
                                disabled={!user.is_guest || actionLoading === user.id + 'delete'}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: '8px',
                                    border: user.is_guest ? '1px solid var(--danger)' : '1px solid var(--border)',
                                    background: 'transparent',
                                    color: user.is_guest ? 'var(--danger)' : 'var(--text-dim)',
                                    cursor: user.is_guest ? 'pointer' : 'not-allowed',
                                    opacity: user.is_guest ? 1 : 0.3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: user.is_guest ? 'auto' : 'none'
                                }}
                                title={user.is_guest ? 'Eliminar usuario' : 'Solo se pueden eliminar invitados'}
                            >
                                {actionLoading === user.id + 'delete' ? <Loader2 size={14} className='spin' /> : <Trash2 size={16} />}
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
