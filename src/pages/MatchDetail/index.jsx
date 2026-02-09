import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useMatchDetail } from '../../hooks/useMatchDetail'

// UI Components
import Spinner from '../../components/ui/Spinner'
import StatusMessage from '../../components/ui/StatusMessage'
import Button from '../../components/ui/Button'

// Sub-components
import MatchHeader from './MatchHeader'
import TabsNavigation from './TabsNavigation'
import AdminTab from './AdminTab'
import FieldTab from './FieldTab'
import GameResultForm from './GameResultForm'
import FixtureTimeline from './FixtureTimeline'
import MatchModals from './MatchModals'
import MatchHistory from './MatchHistory'
import LineupVerificationModal from './LineupVerificationModal'
import { KIT_LIBRARY, BENCH_KIT, DEFAULT_KIT } from './constants'

export default function MatchDetail({ profile: authProfile, onBack }) {
    const { slugOrId: matchId } = useParams()
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
        removePlayer,
        restorePlayer,
        togglePaid,
        togglePresent,
        movePlayer,
        addGameResult,
        deleteGameResult,
        updateMatchMode,
        generateFixtures,
        updateFixtures,
        addKnockoutPhase,
        getStandings,
        resolveEliminationPlaceholders,
        updateMatchCapacity,
        addPhase,
        removePhase,
        addManualFixture,
        cancelMatch,
        updateMatch,
        randomizeTeams,
        lockMatch,
        unlockMatch
    } = useMatchDetail(matchId, profile, onBack)

    // Local UI State
    const [activeTab, setActiveTab] = useState('admin')
    const [showHistory, setShowHistory] = useState(false)
    const [confirmingLeave, setConfirmingLeave] = useState(false)
    const leaveTimerRef = useRef(null)

    // Form States
    const [showForm, setShowForm] = useState(false)
    const [gameData, setGameData] = useState({ team1Id: 1, team2Id: 2, goals: [], team1_players: null, team2_players: null })

    // Field Tab Selection/Drag State
    const [selectedPlayerId, setSelectedPlayerId] = useState(null)

    // Modal States
    const [editModal, setEditModal] = useState({ show: false, date: '', time: '' })
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: () => { } })
    const [expansionData, setExpansionData] = useState({ show: false, mode: '', newCost: 0 })
    const [kitPicker, setKitPicker] = useState({ show: false, teamId: null })
    const [lineupModal, setLineupModal] = useState({ show: false, fixture: null })
    const [phaseModal, setPhaseModal] = useState({ show: false })

    const syncTab = () => {
        const hash = window.location.hash.replace('#', '')
        if (['admin', 'field', 'results'].includes(hash)) {
            setActiveTab(hash)
        }
    }

    useEffect(() => {
        syncTab()
        window.addEventListener('hashchange', syncTab)
        return () => window.removeEventListener('hashchange', syncTab)
    }, [])

    const handleTabChange = (tab) => {
        window.location.hash = tab
        setActiveTab(tab)
    }

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

    useEffect(() => {
        return () => {
            if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
        }
    }, [])

    const getTeamPlayers = useCallback((teamId) => {
        // Only players marked as "Presente" are shown in the formation view
        // Unenrolled or not-yet-arrived players are hidden to avoid clutter
        return enrollments.filter(e => (e.team_assignment || 0) === teamId && e.is_present && !e.is_excluded)
    }, [enrollments])

    const getOrdinal = (n) => {
        const ordinals = ["", "Primer", "Segundo", "Tercer", "Cuarto", "Quinto", "Sexto"]
        return ordinals[n] || n
    }

    const handleRandomizeKit = async (teamId) => {
        const currentConfigs = { ...(match.team_configs || {}) }
        const takenKits = Object.values(currentConfigs).map(c => c.name)
        const availableKits = KIT_LIBRARY.filter(k => !takenKits.includes(k.name))
        const pool = availableKits.length > 0 ? availableKits : KIT_LIBRARY
        currentConfigs[teamId] = pool[Math.floor(Math.random() * pool.length)]
        await updateMatch({ team_configs: currentConfigs })
    }

    const handleRandomizeKitsAll = async () => {
        const currentConfigs = { ...(match.team_configs || {}) }
        const kits = [...KIT_LIBRARY].sort(() => Math.random() - 0.5)
        const playersPerTeam = match.field?.players_per_team || 5
        const rawTotal = match.max_players || (playersPerTeam * 2)
        const numTeams = Math.max(2, Math.round(rawTotal / playersPerTeam))

        for (let i = 1; i <= numTeams; i++) {
            currentConfigs[i] = kits[i - 1] || kits[0]
        }
        await updateMatch({ team_configs: currentConfigs })
    }

    const handleStartMatch = (team1Id, team2Id, fixtureId) => {
        setGameData({
            team1Id,
            team2Id,
            goals: [],
            fixtureId,
            team1_players: null,
            team2_players: null
        })
        setShowForm(true)
        setTimeout(() => {
            const formElement = document.getElementById('game-result-form')
            if (formElement) formElement.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }

    const handleOpenLineup = () => {
        setLineupModal({
            show: true,
            fixture: { id: gameData.fixtureId, team1Id: gameData.team1Id, team2Id: gameData.team2Id }
        })
    }

    const handleConfirmLineup = (team1PlayerIds, team2PlayerIds) => {
        const { fixture } = lineupModal

        // Calculate official lineup IDs for comparison
        const official1 = enrollments
            .filter(e => e.team_assignment === fixture.team1Id && e.is_present && e.paid)
            .map(e => e.player_id)
            .sort()

        const official2 = enrollments
            .filter(e => e.team_assignment === fixture.team2Id && e.is_present && e.paid)
            .map(e => e.player_id)
            .sort()

        const sortedT1 = [...team1PlayerIds].sort()
        const sortedT2 = [...team2PlayerIds].sort()

        const isSame1 = JSON.stringify(official1) === JSON.stringify(sortedT1)
        const isSame2 = JSON.stringify(official2) === JSON.stringify(sortedT2)

        setGameData(prev => ({
            ...prev,
            team1_players: isSame1 ? null : team1PlayerIds,
            team2_players: isSame2 ? null : team2PlayerIds
        }))
        setLineupModal({ show: false, fixture: null })
    }

    const handleSaveGame = async () => {
        const success = await addGameResult(gameData, gameData.fixtureId)
        if (success) {
            setShowForm(false)
            setGameData({ team1Id: 1, team2Id: 2, goals: [], team1_players: null, team2_players: null })
        }
    }

    const handleCancelMatchRequest = () => {
        setConfirmModal({
            show: true,
            title: 'Cancelar Encuentro',
            message: '¿Estás seguro de que deseas cancelar este encuentro? Esta acción marcará el partido como cancelado y no se podrán realizar más cambios.',
            onConfirm: async () => {
                await cancelMatch()
                setConfirmModal({ show: false, title: '', message: '', onConfirm: () => { } })
            }
        })
    }

    const handleDeleteGameRequest = (gameId, fixtureId) => {
        setConfirmModal({
            show: true,
            title: 'Eliminar Resultado',
            message: '¿Estás seguro de que deseas eliminar este resultado? Si el partido venía de un fixture, volverá a estar pendiente.',
            onConfirm: async () => {
                await deleteGameResult(gameId, fixtureId)
                setConfirmModal({ show: false, title: '', message: '', onConfirm: () => { } })
            }
        })
    }

    const handleUndoMatchRequest = (gameId, fixtureId) => {
        handleDeleteGameRequest(gameId, fixtureId)
    }

    if (loading) return (
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-dark)', flexDirection: 'column', gap: '1rem' }}>
            <Spinner />
            <p style={{ color: 'var(--text-dim)' }}>Cargando detalles...</p>
        </div>
    )

    if (!match) return (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', background: 'var(--bg-dark)', minHeight: '100vh' }}>
            <p>No se encontró el encuentro.</p>
            <Button onClick={onBack} variant="outline" style={{ marginTop: '1rem' }}>Volver</Button>
        </div>
    )

    // Derived Data
    const playersPerTeam = match.field?.players_per_team || 5
    const rawTotal = match.max_players || (playersPerTeam * 2)
    const numTeams = Math.max(2, Math.round(rawTotal / playersPerTeam))
    const totalNeeded = numTeams * playersPerTeam
    const enrolledCount = enrollments.filter(e => !e.is_excluded).length
    const isEnrolled = enrollments.some(e => e.player_id === profile?.id && !e.is_excluded)
    const suggestedQuota = Math.ceil((match.field?.price_per_hour || 120) / (2 * playersPerTeam))
    const canManage = profile?.is_super_admin || profile?.is_admin || match?.creator_id === profile?.id

    // Ensure robust teamConfigs with defaults
    const teamConfigs = {
        0: BENCH_KIT,
        ...match.team_configs
    }

    // Fill missing team configs for formed teams
    for (let i = 1; i <= numTeams; i++) {
        if (!teamConfigs[i]) {
            teamConfigs[i] = { ...DEFAULT_KIT, name: `Equipo ${i}` }
        }
    }

    return (
        <div className="match-detail-page" style={{ padding: '1rem', paddingBottom: '5rem', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
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
                    viewerId={profile?.id}
                    viewerIsSuperAdmin={profile?.is_super_admin}
                    hasPaid={enrollments?.find(e => e.player_id === profile?.id)?.paid || false}
                    enrollments={enrollments}
                />

                <TabsNavigation activeTab={activeTab} onTabChange={handleTabChange} />

                {activeTab === 'admin' && (
                    <AdminTab
                        match={match}
                        enrollments={enrollments}
                        onJoin={handleJoin}
                        onLeave={handleLeave}
                        onTogglePaid={togglePaid}
                        onTogglePresent={togglePresent}
                        onRemovePlayer={(enrol) => removePlayer(enrol.id)}
                        onRestorePlayer={(enrol) => restorePlayer(enrol.id)}
                        onExpand={() => setExpansionData({ show: true, mode: 'expand', newCost: (match.fixed_cost || 120) + suggestedQuota * playersPerTeam })}
                        onShrink={() => setExpansionData({ show: true, mode: 'shrink', newCost: (match.fixed_cost || 120) - suggestedQuota * playersPerTeam })}
                        onCancel={handleCancelMatchRequest}
                        actionLoading={actionLoading}
                        numTeams={numTeams}
                        totalNeeded={totalNeeded}
                        suggestedQuota={suggestedQuota}
                        canManage={canManage}
                        getOrdinal={getOrdinal}
                        viewerId={profile?.id}
                        viewerIsSuperAdmin={profile?.is_super_admin}
                    />
                )}

                {/* Match Finalization Controls */}
                {canManage && activeTab === 'admin' && (
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                        {!match.is_locked ? (
                            <Button
                                variant="success"
                                onClick={lockMatch}
                                loading={actionLoading === 'lock'}
                                disabled={games.length === 0}
                                style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                            >
                                Finalizar Encuentro y Cerrar ELO
                            </Button>
                        ) : (
                            profile.is_super_admin && (
                                <Button
                                    variant="outline-danger"
                                    onClick={unlockMatch}
                                    loading={actionLoading === 'unlock'}
                                    style={{ paddingLeft: '3rem', paddingRight: '3rem' }}
                                >
                                    ⚠️ Desbloquear Partido (Revertir ELO)
                                </Button>
                            )
                        )}
                    </div>
                )}

                {activeTab === 'field' && (
                    <FieldTab
                        enrollments={enrollments}
                        numTeams={numTeams}
                        getTeamPlayers={getTeamPlayers}
                        teamConfigs={teamConfigs}
                        canManage={canManage}
                        selectedPlayerId={selectedPlayerId}
                        onPlayerClick={(id) => {
                            if (!canManage) return
                            setSelectedPlayerId(selectedPlayerId === id ? null : id)
                        }}
                        onMobileMove={(teamId) => {
                            if (selectedPlayerId) {
                                movePlayer(selectedPlayerId, teamId)
                                setSelectedPlayerId(null)
                            }
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e, teamId) => {
                            e.preventDefault()
                            const enrolId = e.dataTransfer.getData('enrolId')
                            if (enrolId) movePlayer(enrolId, teamId)
                        }}
                        onKitPicker={(teamId) => setKitPicker({ show: true, teamId })}
                        onRandomizeKit={handleRandomizeKit}
                        onRandomizeAll={() => randomizeTeams(numTeams, KIT_LIBRARY)}
                        onRandomizeKitsAll={handleRandomizeKitsAll}
                        actionLoading={actionLoading}
                        viewerId={profile?.id}
                        viewerIsSuperAdmin={profile?.is_super_admin}
                        matchCreatorId={match?.creator_id}
                    />
                )}

                {activeTab === 'results' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <FixtureTimeline
                            matchId={matchId}
                            phases={match?.phases}
                            fixtures={match?.fixtures}
                            teamConfigs={teamConfigs}
                            onStartMatch={handleStartMatch}
                            onAddPhase={addPhase}
                            onRemovePhase={removePhase}
                            onUpdateFixtures={updateFixtures}
                            onGenerateFixtures={generateFixtures}
                            onAddManualFixture={addManualFixture}
                            onResolvePlaceholders={resolveEliminationPlaceholders}
                            canManage={canManage}
                            getStandings={getStandings}
                            numTeams={numTeams}
                            games={games}
                        />

                        <div id="game-result-form">
                            <GameResultForm
                                showForm={showForm}
                                setShowForm={setShowForm}
                                gameData={gameData}
                                setGameData={setGameData}
                                onAddGame={handleSaveGame}
                                games={games}
                                teamConfigs={teamConfigs}
                                numTeams={numTeams}
                                canManage={canManage}
                                actionLoading={actionLoading}
                                isLocked={match.is_locked}
                                enrollments={enrollments}
                                matchMode={match?.match_mode || 'free'}
                                onUndoMatch={handleUndoMatchRequest}
                                onOpenLineup={handleOpenLineup}
                                viewerId={profile?.id}
                                viewerIsSuperAdmin={profile?.is_super_admin}
                                matchCreatorId={match?.creator_id}
                            />
                        </div>

                        <MatchHistory
                            showHistory={showHistory}
                            setShowHistory={setShowHistory}
                            games={games}
                            fixtures={match?.fixtures}
                            teamConfigs={teamConfigs}
                            canManage={canManage}
                            onDeleteGame={handleDeleteGameRequest}
                        />
                    </div>
                )}
            </div>

            <MatchModals
                confirmModal={confirmModal}
                setConfirmModal={setConfirmModal}
                expansionData={expansionData}
                setExpansionData={setExpansionData}
                kitPicker={kitPicker}
                setKitPicker={setKitPicker}
                editModal={editModal}
                setEditModal={setEditModal}
                match={match}
                numTeams={numTeams}
                playersPerTeam={playersPerTeam}
                updateMatch={updateMatch}
                updateMatchCapacity={updateMatchCapacity}
                cancelMatch={cancelMatch}
                actionLoading={actionLoading}
                KIT_LIBRARY={KIT_LIBRARY}
            />

            <LineupVerificationModal
                show={lineupModal.show}
                onClose={() => setLineupModal({ show: false, fixture: null })}
                onConfirm={handleConfirmLineup}
                fixture={lineupModal.fixture}
                teamConfigs={teamConfigs}
                enrollments={enrollments}
                playersPerTeam={playersPerTeam}
                currentLineup1={gameData.team1_players}
                currentLineup2={gameData.team2_players}
                viewerId={profile?.id}
                viewerIsSuperAdmin={profile?.is_super_admin}
                matchCreatorId={match?.creator_id}
            />


            <StatusMessage type={statusMsg.type} text={statusMsg.text} />
        </div>
    )
}
