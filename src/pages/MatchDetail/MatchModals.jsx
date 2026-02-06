import React from 'react'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import KitPicker from './KitPicker'

export default function MatchModals({
    confirmModal,
    setConfirmModal,
    expansionData,
    setExpansionData,
    kitPicker,
    setKitPicker,
    editModal,
    setEditModal,
    match,
    numTeams,
    playersPerTeam,
    updateMatch,
    updateMatchCapacity,
    cancelMatch,
    actionLoading,
    KIT_LIBRARY
}) {
    return (
        <>
            <ConfirmModal
                show={confirmModal.show}
                onClose={() => setConfirmModal({ ...confirmModal, show: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
            />

            <ConfirmModal
                show={expansionData.show}
                onClose={() => setExpansionData({ ...expansionData, show: false })}
                onConfirm={() => {
                    const nextTeams = expansionData.mode === 'expand' ? numTeams + 1 : numTeams - 1
                    let nextConfigs = { ...(match.team_configs || {}) }

                    if (expansionData.mode === 'expand') {
                        const takenNames = Object.values(nextConfigs).map(c => c.name)
                        const pool = KIT_LIBRARY.filter(k => !takenNames.includes(k.name))
                        const finalPool = pool.length > 0 ? pool : KIT_LIBRARY
                        nextConfigs[nextTeams] = finalPool[Math.floor(Math.random() * finalPool.length)]
                    } else {
                        delete nextConfigs[numTeams]
                    }

                    updateMatchCapacity(
                        nextTeams * playersPerTeam,
                        expansionData.newCost,
                        nextConfigs
                    )
                    setExpansionData({ ...expansionData, show: false })
                }}
                title={expansionData.mode === 'expand' ? 'Expandir Encuentro' : 'Reducir Encuentro'}
                message={`Se ajustará la capacidad para ${expansionData.mode === 'expand' ? numTeams + 1 : numTeams - 1} equipos y el costo fijo será S/ ${expansionData.newCost}.`}
                confirmText="Confirmar"
                variant="primary"
            />

            <KitPicker
                show={kitPicker.show}
                teamId={kitPicker.teamId}
                onClose={() => setKitPicker({ show: false, teamId: null })}
                onSelect={async (kit) => {
                    const newConfigs = {
                        ...(match.team_configs || {}),
                        [kitPicker.teamId]: kit
                    }
                    await updateMatch({ team_configs: newConfigs })
                    setKitPicker({ show: false, teamId: null })
                }}
            />

            <Modal
                show={editModal.show}
                onClose={() => setEditModal({ ...editModal, show: false })}
                title="Editar Encuentro"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Fecha</label>
                        <input
                            type="date"
                            value={editModal.date}
                            onChange={(e) => setEditModal({ ...editModal, date: e.target.value })}
                            className="premium-input"
                            style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', padding: '0.8rem', borderRadius: '8px' }}
                        />
                    </div>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>Hora</label>
                        <input
                            type="time"
                            value={editModal.time}
                            onChange={(e) => setEditModal({ ...editModal, time: e.target.value })}
                            className="premium-input"
                            style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'white', padding: '0.8rem', borderRadius: '8px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <Button
                            onClick={() => setEditModal({ ...editModal, show: false })}
                            variant="outline"
                            style={{ flex: 1 }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={async () => {
                                const success = await updateMatch({ date: editModal.date, time: editModal.time })
                                if (success) setEditModal({ ...editModal, show: false })
                            }}
                            variant="primary"
                            style={{ flex: 1 }}
                            loading={actionLoading === 'update'}
                        >
                            Guardar Cambios
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    )
}
