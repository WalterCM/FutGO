import React, { useState, useEffect, useRef } from 'react'
import { Trophy, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useMatchDetail } from '../../hooks/useMatchDetail'

// UI Components
import Spinner from '../../components/ui/Spinner'
import StatusMessage from '../../components/ui/StatusMessage'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

// Sub-components
import MatchHeader from './MatchHeader'
import TabsNavigation from './TabsNavigation'
import AdminTab from './AdminTab'
import FieldTab from './FieldTab'
import GameResultForm from './GameResultForm'
import FixtureTimeline from './FixtureTimeline'
import KitPicker from './KitPicker'
import TeamBadge from './TeamBadge'
import { BENCH_KIT, DEFAULT_KIT, KIT_LIBRARY } from './constants'

export default function MatchDetail({ profile: authProfile, onBack }) {
    const { id: matchId } = useParams()
    const { profile: contextProfile } = useAuth()
    const profile = authProfile || contextProfile

    const {
        match,
        enrollments,
        games,
        loading,
        isRefreshing,
        actionLoading,
        statusMsg,
        joinMatch,
        leaveMatch,
        togglePaid,
        togglePresent,
        movePlayer,
        addGameResult,
        deleteGameResult,
        updateMatchMode,
        generateFixtures,
        updateFixtures,
        addFinals,
        updateMatchCapacity,
        cancelMatch,
        updateMatch,
        randomizeTeams
    } = useMatchDetail(matchId, profile, onBack)

    // Local UI State
    const [activeTab, setActiveTab] = useState('admin')
    const [showGameForm, setShowGameForm] = useState(false)
    const [showHistory, setShowHistory] = useState(false)

    // Sync activeTab with URL hash
    useEffect(() => {
        const syncTab = () => {
            const hash = window.location.hash.replace('#', '')
            if (['admin', 'field', 'results'].includes(hash)) {
                setActiveTab(hash)
            }
        }

        syncTab()
        window.addEventListener('hashchange', syncTab)
        return () => window.removeEventListener('hashchange', syncTab)
    }, [])

    // Update URL hash when activeTab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab)
        window.location.hash = tab
    }
    const [gameData, setGameData] = useState({ score1: 0, score2: 0, team1Id: 1, team2Id: 2, goals: [] })
    const [confirmingLeave, setConfirmingLeave] = useState(false)
    const [selectedPlayerId, setSelectedPlayerId] = useState(null)
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null })
    const [expansionData, setExpansionData] = useState({ show: false, newCost: 150, mode: 'expand' })
    const [kitPicker, setKitPicker] = useState({ show: false, teamId: null })
    const [teamKits, setTeamKits] = useState({})
    const [editModal, setEditModal] = useState({ show: false, date: '', time: '' })
    const leaveTimerRef = useRef(null)

    // Derived Data
    const playersPerTeam = match?.field?.players_per_team || 5
    const rawTotal = match?.max_players || (playersPerTeam * 2)
    const numTeams = Math.max(2, Math.round(rawTotal / playersPerTeam))
    const totalNeeded = numTeams * playersPerTeam
    const enrolledCount = enrollments.length
    const suggestedQuota = Math.ceil((match?.field?.price_per_hour || 120) / (2 * playersPerTeam))
    const canManage = profile?.is_super_admin || match?.creator_id === profile?.id
    const isEnrolled = enrollments.some(e => e.player_id === profile?.id)

    // Team Configs
    const teamConfigs = {
        0: BENCH_KIT,
        ...Array.from({ length: numTeams }, (_, i) => i + 1).reduce((acc, id) => {
            const savedConfig = match?.team_configs?.[id]
            acc[id] = savedConfig ? {
                ...savedConfig,
                shadow: '0 2px 4px rgba(0,0,0,0.5)'
            } : {
                ...DEFAULT_KIT,
                name: `Equipo ${id}`
            }
            return acc
        }, {})
    }

    // Handlers
    const handleJoin = async () => {
        await joinMatch()
    }

    const handleLeave = async () => {
        if (!confirmingLeave) {
            setConfirmingLeave(true)
            if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
            leaveTimerRef.current = setTimeout(() => setConfirmingLeave(false), 2500)
            return
        }
        if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current)
            leaveTimerRef.current = null
        }
        await leaveMatch()
        setConfirmingLeave(false)
    }

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
        }
    }, [])

    const getTeamPlayers = (teamId) => {
        return enrollments
            .filter(e => {
                if (!e.paid || !e.is_present) return false
                return (e.team_assignment || 0) === teamId
            })
            .sort((a, b) => {
                if (teamId === 0) return new Date(a.paid_at) - new Date(b.paid_at)
                return (a.player?.full_name || '').localeCompare(b.player?.full_name || '')
            })
    }

    const onDrop = (e, teamId) => {
        e.preventDefault()
        const enrolId = e.dataTransfer.getData('enrolId')
        if (enrolId) movePlayer(enrolId, teamId)
    }

    const onPlayerClick = (playerId, currentTeamId) => {
        if (currentTeamId === 0) {
            setSelectedPlayerId(selectedPlayerId === playerId ? null : playerId)
        }
    }

    const handleMobileMove = (targetTeamId) => {
        if (selectedPlayerId) {
            movePlayer(selectedPlayerId, targetTeamId)
            setSelectedPlayerId(null)
        }
    }

    const handleRandomizeKit = async (teamId) => {
        const randomKit = KIT_LIBRARY[Math.floor(Math.random() * KIT_LIBRARY.length)]
        const newConfigs = {
            ...(match.team_configs || {}),
            [teamId]: randomKit
        }
        await updateMatch({ team_configs: newConfigs })
    }

    const handleRandomizeAllKits = async () => {
        let nextConfigs = { ...(match.team_configs || {}) }
        const shuffledKits = [...KIT_LIBRARY].sort(() => Math.random() - 0.5)

        for (let i = 1; i <= numTeams; i++) {
            nextConfigs[i] = shuffledKits[i % shuffledKits.length]
        }
        await updateMatch({ team_configs: nextConfigs })
    }

    const handleTogglePresent = (enrol) => {
        if (enrol.is_present) {
            setConfirmModal({
                show: true,
                title: 'Quitar Presencia',
                message: `¿Estás seguro de marcar a ${enrol.player?.full_name} como ausente? Se perderá su posición en la cancha.`,
                onConfirm: async () => {
                    await togglePresent(enrol)
                    setConfirmModal(prev => ({ ...prev, show: false }))
                }
            })
        } else {
            togglePresent(enrol)
        }
    }

    const handleTogglePaid = (enrol) => {
        if (enrol.paid) {
            setConfirmModal({
                show: true,
                title: 'Anular Pago',
                message: `¿Estás seguro de anular el pago de ${enrol.player?.full_name}?`,
                onConfirm: async () => {
                    await togglePaid(enrol)
                    setConfirmModal(prev => ({ ...prev, show: false }))
                }
            })
        } else {
            togglePaid(enrol)
        }
    }

    const handleStartMatch = (team1Id, team2Id, fixtureId = null) => {
        setGameData({
            ...gameData,
            team1Id,
            team2Id,
            fixtureId,
            goals: []
        })
        setShowGameForm(true)
    }

    const handleAddGame = async (e) => {
        e.preventDefault()
        const success = await addGameResult(gameData, gameData.fixtureId)
        if (success) setShowGameForm(false)
    }

    if (loading) return (
        <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
            <Spinner size={40} />
            <p style={{ color: 'var(--text-dim)' }}>Cargando detalles...</p>
        </div>
    )
    if (!match) return null

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', position: 'relative' }}>
            {isRefreshing && (
                <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.75rem' }}>
                    <Spinner size={12} /> Actualizando...
                </div>
            )}

            <MatchHeader
                match={match}
                onBack={onBack}
                enrolledCount={enrolledCount}
                totalNeeded={totalNeeded}
                numTeams={numTeams}
                playersPerTeam={playersPerTeam}
                isEnrolled={isEnrolled}
                onJoin={handleJoin}
                onLeave={handleLeave}
                actionLoading={actionLoading}
                confirmingLeave={confirmingLeave}
                canManage={canManage}
                onEdit={() => setEditModal({ show: true, date: match.date, time: match.time })}
            />

            <TabsNavigation activeTab={activeTab} onTabChange={handleTabChange} />

            {activeTab === 'admin' && (
                <AdminTab
                    enrollments={enrollments}
                    totalNeeded={totalNeeded}
                    suggestedQuota={suggestedQuota}
                    match={match}
                    canManage={canManage}
                    onTogglePaid={handleTogglePaid}
                    onTogglePresent={handleTogglePresent}
                    onExpand={() => {
                        const next = numTeams + 1
                        setExpansionData({ show: true, mode: 'expand', newCost: Math.round((match.field?.price_per_hour || 120) / 2 * next) })
                    }}
                    onShrink={() => {
                        const next = numTeams - 1
                        setExpansionData({ show: true, mode: 'shrink', newCost: Math.round((match.field?.price_per_hour || 120) / 2 * next) })
                    }}
                    onCancel={() => setConfirmModal({
                        show: true,
                        title: '¿Confirmar Cancelación?',
                        message: 'Esta acción cancelará el partido y debería ir acompañada de la devolución de los pagos (si aplica).',
                        onConfirm: () => {
                            cancelMatch()
                            setConfirmModal({ ...confirmModal, show: false })
                        }
                    })}
                    actionLoading={actionLoading}
                    numTeams={numTeams}
                    matchMode={match?.match_mode || 'liguilla'}
                    onUpdateMode={updateMatchMode}
                    getOrdinal={(n) => n === 3 ? '3er' : n === 4 ? '4to' : n === 5 ? '5to' : 'Próximo'}
                />
            )}

            {activeTab === 'field' && (
                <FieldTab
                    enrollments={enrollments}
                    numTeams={numTeams}
                    getTeamPlayers={getTeamPlayers}
                    teamConfigs={teamConfigs}
                    canManage={canManage}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={onDrop}
                    onKitPicker={(id) => setKitPicker({ show: true, teamId: id })}
                    onRandomizeKit={handleRandomizeKit}
                    onRandomizeAll={() => randomizeTeams(numTeams, KIT_LIBRARY)}
                    onRandomizeKitsAll={handleRandomizeAllKits}
                    selectedPlayerId={selectedPlayerId}
                    onPlayerClick={onPlayerClick}
                    onMobileMove={handleMobileMove}
                    actionLoading={actionLoading}
                />
            )}

            {activeTab === 'results' && (
                <>
                    <FixtureTimeline
                        matchMode={match?.match_mode || 'liguilla'}
                        numTeams={numTeams}
                        fixtures={match?.fixtures || []}
                        teamConfigs={teamConfigs}
                        onStartMatch={handleStartMatch}
                        canManage={canManage}
                        onUpdateMode={updateMatchMode}
                        onReorder={updateFixtures}
                        onAddFinals={addFinals}
                        onUndoMatch={deleteGameResult}
                        games={games}
                    />
                    <GameResultForm
                        showForm={showGameForm}
                        setShowForm={setShowGameForm}
                        gameData={gameData}
                        setGameData={setGameData}
                        onAddGame={handleAddGame}
                        games={games}
                        teamConfigs={teamConfigs}
                        numTeams={numTeams}
                        canManage={canManage}
                        actionLoading={actionLoading}
                        isLocked={match.is_locked}
                        enrollments={enrollments}
                        matchMode={match?.match_mode || 'free'}
                        onUndoMatch={deleteGameResult}
                    />

                    {/* Master Match History - Collapsible and High Contrast */}
                    {games.length > 0 && (
                        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                            <div
                                onClick={() => setShowHistory(!showHistory)}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    marginBottom: '1.2rem', cursor: 'pointer', padding: '0.5rem',
                                    borderRadius: '8px', transition: 'background 0.2s',
                                    background: showHistory ? 'rgba(255,255,255,0.05)' : 'transparent'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = showHistory ? 'rgba(255,255,255,0.05)' : 'transparent'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', opacity: 0.6 }}>
                                    <Trophy size={18} />
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        Historial Completo del Día
                                    </span>
                                </div>
                                {showHistory ? <ChevronUp size={18} style={{ opacity: 0.4 }} /> : <ChevronDown size={18} style={{ opacity: 0.4 }} />}
                            </div>

                            {showHistory && (
                                <div style={{ display: 'grid', gap: '0.8rem' }}>
                                    {games.map((game) => (
                                        <Card key={game.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }} hover={false}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <TeamBadge id={game.team1_id} teamConfigs={teamConfigs} />
                                                </div>
                                                <div style={{
                                                    margin: '0 1rem', fontSize: '1.1rem', fontWeight: '800',
                                                    background: 'rgba(255,255,255,0.1)', color: 'white',
                                                    padding: '0.2rem 1rem', borderRadius: '12px', minWidth: '70px',
                                                    textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                                                }}>
                                                    {game.score1} - {game.score2}
                                                </div>
                                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <TeamBadge id={game.team2_id} teamConfigs={teamConfigs} />
                                                </div>
                                                {canManage && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            confirm('¿Borrar este resultado?') && deleteGameResult(game.id, game.fixture_id)
                                                        }}
                                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', marginLeft: '0.5rem', color: 'var(--error)', opacity: 0.4 }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
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
                        // Cleanup deleted team config
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

            <StatusMessage type={statusMsg.type} text={statusMsg.text} />
        </div>
    )
}
