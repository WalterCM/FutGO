import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Users as UsersIcon, Shield, ShieldCheck, User, Search, Loader2, PlusCircle, MinusCircle, Wallet } from 'lucide-react'

export default function Users({ profile }) {
    const { refreshProfile } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [actionLoading, setActionLoading] = useState(null)
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
    const [balanceModal, setBalanceModal] = useState({ show: false, userId: null, userName: '', currentBalance: 0, type: 'deposit', amount: '' })

    function showMsg(type, text) {
        setStatusMsg({ type, text })
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000)
    }

    useEffect(() => {
        if (profile?.is_super_admin) {
            fetchUsers()
        }
    }, [profile])

    async function fetchUsers() {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name')

        if (error) showMsg('error', error.message)
        else setUsers(data || [])
        setLoading(false)
    }

    async function adjustBalance(userId, currentBalance, amount) {
        setActionLoading(userId + 'balance')
        const newBalance = Number(currentBalance || 0) + Number(amount)

        const { error } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId)

        if (error) {
            showMsg('error', error.message)
        } else {
            showMsg('success', 'Balance actualizado')
            setUsers(users.map(u =>
                u.id === userId ? { ...u, balance: newBalance } : u
            ))
            setBalanceModal({ ...balanceModal, show: false, amount: '' })
            refreshProfile()
        }
        setActionLoading(null)
    }

    async function toggleRole(userId, roleField, currentValue) {
        setActionLoading(userId + roleField)
        const { error } = await supabase
            .from('profiles')
            .update({ [roleField]: !currentValue })
            .eq('id', userId)

        if (error) {
            showMsg('error', error.message)
        } else {
            showMsg('success', 'Rol actualizado')
            setUsers(users.map(u =>
                u.id === userId ? { ...u, [roleField]: !currentValue } : u
            ))
            refreshProfile()
        }
        setActionLoading(null)
    }

    if (!profile?.is_super_admin) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh' }}>
                <div className="premium-card" style={{ textAlign: 'center' }}>
                    <Shield size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
                    <h3>Acceso Restringido</h3>
                    <p style={{ color: 'var(--text-dim)' }}>Solo el Dueño (Owner) puede gestionar usuarios.</p>
                </div>
            </div>
        )
    }

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ color: 'var(--primary)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UsersIcon size={32} /> Gestión de Cracks
                </h2>

                <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                    <Search size={18} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        className="premium-input"
                        style={{ width: '100%', padding: '0.8rem 0.8rem 0.8rem 2.5rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', borderRadius: '12px', color: 'white' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex-center" style={{ minHeight: '40vh' }}>
                    <Loader2 size={32} className="spin" style={{ color: 'var(--primary)' }} />
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredUsers.map(user => (
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
                                        {user.full_name}
                                        {user.is_super_admin && <ShieldCheck size={16} style={{ color: 'var(--primary)' }} title="Owner" />}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                            {user.elo_rating} ELO
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                                            {user.is_super_admin ? 'Owner' : (user.is_admin ? 'Administrador' : 'Jugador')}
                                        </div>
                                        {/* Wallet disabled for decentralized model */}
                                        {/* 
                                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                             <Wallet size={14} /> S/ {user.balance || 0}
                                         </div>
                                         */}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                {/* Balance Management disabled for decentralized model */}
                                {/* 
                                <div style={{ display: 'flex', gap: '0.3rem', borderRight: '1px solid var(--border)', paddingRight: '0.8rem', marginRight: '0.2rem' }}>
                                    <button
                                        onClick={() => setBalanceModal({
                                            show: true, userId: user.id, userName: user.full_name,
                                            currentBalance: user.balance || 0, type: 'deposit', amount: ''
                                        })}
                                        disabled={actionLoading === user.id + 'balance'}
                                        style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0.2rem' }}
                                        title="Depositar Saldo"
                                    >
                                        <PlusCircle size={20} />
                                    </button>
                                    <button
                                        onClick={() => setBalanceModal({
                                            show: true, userId: user.id, userName: user.full_name,
                                            currentBalance: user.balance || 0, type: 'withdraw', amount: ''
                                        })}
                                        disabled={actionLoading === user.id + 'balance'}
                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.2rem' }}
                                        title="Retirar Saldo"
                                    >
                                        <MinusCircle size={20} />
                                    </button>
                                </div>
                                */}

                                {/* Admin Toggle */}
                                <button
                                    onClick={() => toggleRole(user.id, 'is_admin', user.is_admin)}
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

                                {/* Super Admin Toggle */}
                                <button
                                    onClick={() => toggleRole(user.id, 'is_super_admin', user.is_super_admin)}
                                    disabled={user.id === profile.id || actionLoading === user.id + 'is_super_admin'}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border)',
                                        background: user.is_super_admin ? 'var(--danger)' : 'transparent',
                                        color: user.is_super_admin ? 'white' : 'var(--text-dim)',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        opacity: user.id === profile.id ? 0.5 : 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        minWidth: '110px',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {actionLoading === user.id + 'is_super_admin' ? <Loader2 size={14} className="spin" /> :
                                        (<> <ShieldCheck size={14} /> {user.is_super_admin ? 'Es Owner' : 'Hacer Owner'} </>)}
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredUsers.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                            No se encontraron cracks con ese nombre.
                        </div>
                    )}
                </div>
            )}

            {balanceModal.show && (
                <div className="flex-center" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, padding: '1rem' }}>
                    <div className="premium-card" style={{ maxWidth: '400px', width: '100%', textAlign: 'center', animation: 'scaleIn 0.2s ease-out' }}>
                        <Wallet size={48} style={{ color: balanceModal.type === 'deposit' ? '#10b981' : 'var(--danger)', marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem' }}>{balanceModal.type === 'deposit' ? 'Depositar Saldo' : 'Retirar Saldo'}</h3>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Ajustando billetera de <b>{balanceModal.userName}</b></p>

                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span>Saldo Actual:</span>
                                <span style={{ fontWeight: 'bold' }}>S/ {balanceModal.currentBalance}</span>
                            </div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem', display: 'block' }}>Monto (S/)</label>
                            <input
                                type="number"
                                autoFocus
                                className="premium-input"
                                style={{ width: '100%', marginTop: '0.3rem', fontSize: '1.2rem', padding: '0.8rem' }}
                                value={balanceModal.amount}
                                onChange={(e) => setBalanceModal({ ...balanceModal, amount: e.target.value })}
                                placeholder="0.00"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                className="btn-primary"
                                style={{ background: 'transparent', border: '1px solid var(--border)', color: 'white' }}
                                onClick={() => setBalanceModal({ ...balanceModal, show: false })}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn-primary"
                                style={{ background: balanceModal.type === 'deposit' ? '#10b981' : 'var(--danger)' }}
                                disabled={!balanceModal.amount || isNaN(balanceModal.amount) || actionLoading}
                                onClick={() => adjustBalance(balanceModal.userId, balanceModal.currentBalance, balanceModal.type === 'deposit' ? balanceModal.amount : -balanceModal.amount)}
                            >
                                {balanceModal.type === 'deposit' ? 'Depositar' : 'Retirar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {statusMsg.text && (
                <div style={{
                    position: 'fixed',
                    top: '2rem',
                    right: '2rem',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    backgroundColor: statusMsg.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    zIndex: 4000,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {statusMsg.text}
                </div>
            )}
        </div>
    )
}
