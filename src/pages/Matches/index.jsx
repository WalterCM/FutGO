import React, { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useMatches } from '../../hooks/useMatches'

// UI Components
import Button from '../../components/ui/Button'
import StatusMessage from '../../components/ui/StatusMessage'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Spinner from '../../components/ui/Spinner'

// Sub-components
import MatchForm from './MatchForm'
import MatchCard from './MatchCard'

export default function Matches({ profile, onMatchClick }) {
    const {
        matches,
        fields,
        loading,
        actionLoading,
        statusMsg,
        confirmingLeaveId,
        joinMatch,
        leaveMatch,
        deleteMatch,
        saveMatch
    } = useMatches(profile)

    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [newMatch, setNewMatch] = useState({
        field_id: '',
        date: '',
        time: '',
        status: 'open'
    })
    const [confirmModal, setConfirmModal] = useState({ show: false, id: null })

    const handleEdit = (match) => {
        setEditingId(match.id)
        setNewMatch({
            field_id: match.field_id,
            date: match.date,
            time: match.time,
            status: match.status
        })
        setShowForm(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const cancelForm = () => {
        setShowForm(false)
        setEditingId(null)
        setNewMatch({ field_id: fields[0]?.id || '', date: '', time: '', status: 'open' })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const success = await saveMatch(newMatch, editingId)
        if (success) cancelForm()
    }

    const handleDeleteClick = (id) => {
        setConfirmModal({ show: true, id })
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ color: 'var(--primary)', fontSize: '2rem' }}>Días de Pichanga</h2>
                {(profile?.is_super_admin || profile?.is_admin) && (
                    <Button
                        onClick={() => {
                            if (showForm && !editingId) setShowForm(false)
                            else {
                                setEditingId(null)
                                setNewMatch({ field_id: fields[0]?.id || '', date: '', time: '', status: 'open' })
                                setShowForm(true)
                            }
                        }}
                    >
                        <Plus size={20} style={{ marginRight: '0.5rem' }} /> {showForm && !editingId ? 'Ocultar Form' : 'Programar Encuentro'}
                    </Button>
                )}
            </div>

            {showForm && (
                <MatchForm
                    fields={fields}
                    newMatch={newMatch}
                    setNewMatch={setNewMatch}
                    onSubmit={handleSubmit}
                    onCancel={cancelForm}
                    editingId={editingId}
                    loading={loading}
                />
            )}

            <div className="grid-dashboard" style={{ padding: 0 }}>
                {loading && matches.length === 0 ? (
                    <div className="flex-center" style={{ padding: '3rem', width: '100%' }}>
                        <Spinner />
                        <p style={{ marginLeft: '1rem' }}>Cargando partidos...</p>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="premium-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>No hay encuentros programados aún.</p>
                        {profile?.is_admin && <p style={{ fontSize: '0.9rem' }}>¡Programa el primer evento del grupo! ⚽</p>}
                    </div>
                ) : (
                    matches.map(match => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            profile={profile}
                            onMatchClick={onMatchClick}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                            onJoin={joinMatch}
                            onLeave={leaveMatch}
                            actionLoading={actionLoading}
                            confirmingLeaveId={confirmingLeaveId}
                        />
                    ))
                )}
            </div>

            <ConfirmModal
                show={confirmModal.show}
                onClose={() => setConfirmModal({ show: false, id: null })}
                onConfirm={async () => {
                    await deleteMatch(confirmModal.id)
                    setConfirmModal({ show: false, id: null })
                }}
                title="Eliminar Partido"
                message="¿Estás completamente seguro de eliminar este encuentro? Esta acción no se puede deshacer."
                variant="danger"
            />

            <StatusMessage type={statusMsg.type} text={statusMsg.text} />
        </div>
    )
}
