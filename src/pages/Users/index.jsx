import React, { useState } from 'react'
import { Users as UsersIcon, Search, Shield, ShieldCheck, Loader2 } from 'lucide-react'
import { useUsers } from '../../hooks/useUsers'

// UI Components
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import StatusMessage from '../../components/ui/StatusMessage'

// Sub-components
import UserTable from './UserTable'
import UserModals from './UserModals'

export default function Users({ profile }) {
    const {
        filteredUsers,
        loading,
        actionLoading,
        statusMsg,
        searchTerm,
        setSearchTerm,
        updateUserName,
        toggleRole
    } = useUsers(profile)

    // Modal States
    const [editNameModal, setEditNameModal] = useState({ show: false, userId: null, currentName: '', newName: '' })
    const [roleConfirm, setRoleConfirm] = useState({ show: false, user: null, roleField: '', newValue: false, inputName: '' })

    const handleEditName = (user) => {
        setEditNameModal({
            show: true,
            userId: user.id,
            currentName: user.full_name,
            newName: user.full_name
        })
    }

    const handleToggleRoleClick = (user, roleField) => {
        const newValue = !user[roleField]
        setRoleConfirm({
            show: true,
            user,
            roleField,
            newValue,
            inputName: ''
        })
    }

    const handleConfirmToggleRole = async (userId, roleField, newValue) => {
        const success = await toggleRole(userId, roleField, newValue)
        if (success) {
            setRoleConfirm({ show: false, user: null, roleField: '', newValue: false, inputName: '' })
        }
    }

    const handleSaveName = async (userId, newName) => {
        const success = await updateUserName(userId, newName)
        if (success) {
            setEditNameModal({ ...editNameModal, show: false })
        }
    }

    if (!profile?.is_super_admin) {
        return (
            <div className="flex-center" style={{ minHeight: '60vh' }}>
                <Card style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <Shield size={48} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
                    <h3>Acceso Restringido</h3>
                    <p style={{ color: 'var(--text-dim)' }}>Solo el Dueño (Owner) puede gestionar usuarios.</p>
                </Card>
            </div>
        )
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ color: 'var(--primary)', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UsersIcon size={32} /> Gestión de Jugadores
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
                    <Spinner size={32} />
                </div>
            ) : (
                <>
                    <UserTable
                        users={filteredUsers}
                        profile={profile}
                        onEditName={handleEditName}
                        onToggleRole={handleToggleRoleClick}
                        actionLoading={actionLoading}
                    />
                    {filteredUsers.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                            No se encontraron jugadores con ese nombre.
                        </div>
                    )}
                </>
            )}

            <UserModals
                editNameModal={editNameModal}
                setEditNameModal={setEditNameModal}
                onUpdateName={handleSaveName}
                roleConfirm={roleConfirm}
                setRoleConfirm={setRoleConfirm}
                onToggleRole={handleConfirmToggleRole}
                actionLoading={actionLoading}
            />

            <StatusMessage type={statusMsg.type} text={statusMsg.text} />
        </div>
    )
}
