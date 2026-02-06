import React from 'react'
import { Pencil, ShieldCheck, Loader2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

export default function UserModals({
    editNameModal,
    setEditNameModal,
    onUpdateName,
    roleConfirm,
    setRoleConfirm,
    onToggleRole,
    actionLoading
}) {
    return (
        <>
            {/* Edit Name Modal */}
            <Modal
                show={editNameModal.show}
                onClose={() => setEditNameModal({ ...editNameModal, show: false })}
                title="Corregir Identidad"
            >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <Pencil size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Estás editando el nombre de cancha para este crack.</p>

                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'left' }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>Nombre o Apodo:</label>
                        <input
                            type="text"
                            autoFocus
                            className="premium-input"
                            style={{ width: '100%', fontSize: '1.1rem', padding: '0.8rem', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', borderRadius: '8px' }}
                            value={editNameModal.newName}
                            onChange={(e) => setEditNameModal({ ...editNameModal, newName: e.target.value })}
                            placeholder="Ej: Lolo Fernández"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Button
                            onClick={() => setEditNameModal({ ...editNameModal, show: false })}
                            variant="outline"
                        >
                            Cancelar
                        </Button>
                        <Button
                            disabled={!editNameModal.newName.trim() || editNameModal.newName === editNameModal.currentName || actionLoading}
                            onClick={() => onUpdateName(editNameModal.userId, editNameModal.newName)}
                            variant="primary"
                            loading={actionLoading === editNameModal.userId + 'name'}
                        >
                            Guardar
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Role Confirm Modal */}
            <Modal
                show={roleConfirm.show}
                onClose={() => setRoleConfirm({ show: false, user: null, roleField: '', newValue: false, inputName: '' })}
                title="Confirmar Cambio de Rol"
            >
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                    <ShieldCheck size={48} style={{ color: roleConfirm.roleField === 'is_super_admin' && roleConfirm.newValue ? 'var(--danger)' : 'var(--primary)', marginBottom: '1rem' }} />
                    <p style={{ marginBottom: '1.5rem', lineHeight: '1.5' }}>
                        {roleConfirm.newValue ? 'Estás a punto de convertir a ' : 'Estás a punto de quitar el rango de '}
                        <b>{roleConfirm.user?.full_name}</b>
                        {roleConfirm.newValue ? ' en ' : ' a '}
                        <b>{roleConfirm.roleField === 'is_super_admin' ? 'Owner (Dueño)' : 'Administrador'}</b>.
                        <br />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                            {roleConfirm.roleField === 'is_super_admin' && roleConfirm.newValue
                                ? 'Esta persona tendrá control total sobre usuarios y finanzas.'
                                : 'Esta acción cambiará los permisos de gestión del usuario.'}
                        </span>
                    </p>

                    {roleConfirm.roleField === 'is_super_admin' && roleConfirm.newValue && (
                        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.5rem' }}>
                                Escribe el nombre completo del crack para confirmar:
                            </label>
                            <input
                                type="text"
                                className="premium-input"
                                style={{ width: '100%', padding: '0.8rem', background: 'var(--bg-dark)', border: roleConfirm.inputName === roleConfirm.user?.full_name ? '1px solid #10b981' : '1px solid var(--border)', color: 'white', borderRadius: '8px' }}
                                value={roleConfirm.inputName}
                                onChange={(e) => setRoleConfirm({ ...roleConfirm, inputName: e.target.value })}
                                placeholder={roleConfirm.user?.full_name}
                                autoFocus
                            />
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Button
                            onClick={() => setRoleConfirm({ show: false, user: null, roleField: '', newValue: false, inputName: '' })}
                            variant="outline"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant={(roleConfirm.roleField === 'is_super_admin' && roleConfirm.newValue) ? 'danger' : 'primary'}
                            disabled={(roleConfirm.roleField === 'is_super_admin' && roleConfirm.newValue && roleConfirm.inputName !== roleConfirm.user?.full_name) || !!actionLoading}
                            onClick={() => onToggleRole(roleConfirm.user.id, roleConfirm.roleField, roleConfirm.newValue)}
                            loading={!!actionLoading}
                        >
                            Confirmar
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
