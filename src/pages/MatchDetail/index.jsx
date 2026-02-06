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
import { KIT_LIBRARY, BENCH_KIT, DEFAULT_KIT } from './constants'

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
    const [showHistory, setShowHistory] = useState(false)
    const [confirmingLeave, setConfirmingLeave] = useState(false)
    const leaveTimerRef = useRef(null)

    // Form States
    const [showForm, setShowForm] = useState(false)
    const [gameData, setGameData] = useState({ team1Id: 1, team2Id: 2, goals: [] })

    // Field Tab Selection/Drag State
    const [selectedPlayerId, setSelectedPlayerId] = useState(null)

    // Modal States
    const [editModal, setEditModal] = useState({ show: false, date: '', time: '' })
    const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: () => { } })
    const [expansionData, setExpansionData] = useState({ show: false, mode: '', newCost: 0 })
    const [kitPicker, setKitPicker] = useState({ show: false, teamId: null })

    const syncTab = () => {
        const hash = window.location.hash.replace('#', '')
        if (['admin', 'field', 'fixtures', 'games', 'results'].includes(hash)) {
            setActiveTab(hash === 'results' ? 'games' : hash)
        }
    }

    useEffect(() => {
        syncTab()
        window.addEventListener('hashchange', syncTab)
        return () => window.removeEventListener('hashchange', syncTab)
    }, [])

    const handleTabChange = (tab) => {
        window.location.hash = tab
        setActiveTab(tab === 'results' ? 'games' : tab)
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
        return enrollments.filter(e => (e.team_assignment || 0) === teamId)
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
        setGameData({ team1Id, team2Id, goals: [], fixtureId })
        setShowForm(true)
        handleTabChange('games')
    }

    const handleSaveGame = async () => {
        const success = await addGameResult(gameData, gameData.fixtureId)
        if (success) {
            setShowForm(false)
            setGameData({ team1Id: 1, team2Id: 2, goals: [] })
        }
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
    const enrolledCount = enrollments.length
    const isEnrolled = enrollments.some(e => e.player_id === profile?.id)
    const suggestedQuota = Math.ceil((match.field?.price_per_hour || 120) / (2 * playersPerTeam))
    const canManage = profile?.is_admin || profile?.is_super_admin || match?.creator_id === profile?.id

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
            <MatchHeader
                match={match}
                isRefreshing={isRefreshing}
                onBack={onBack}
                onEdit={() => setEditModal({ show: true, date: match.date, time: match.time })}
                canManage={canManage}
                enrolledCount={enrolledCount}
                totalNeeded={totalNeeded}
                numTeams={numTeams}
                playersPerTeam={playersPerTeam}
                isEnrolled={isEnrolled}
                onJoin={handleJoin}
                onLeave={handleLeave}
                actionLoading={actionLoading}
                confirmingLeave={confirmingLeave}
            />

            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                    <span>Cuota: S/ {suggestedQuota}</span>
                </div>

                <TabsNavigation activeTab={activeTab} onTabChange={handleTabChange} />

                {activeTab === 'admin' && (
                    <AdminTab
                        match={match}
                        enrollments={enrollments}
                        onJoin={handleJoin}
                        onLeave={handleLeave}
                        onTogglePaid={togglePaid}
                        onTogglePresent={togglePresent}
                        onExpand={() => setExpansionData({ show: true, mode: 'expand', newCost: (match.fixed_cost || 120) + suggestedQuota * playersPerTeam })}
                        onShrink={() => setExpansionData({ show: true, mode: 'shrink', newCost: (match.fixed_cost || 120) - suggestedQuota * playersPerTeam })}
                        onCancel={cancelMatch}
                        actionLoading={actionLoading}
                        numTeams={numTeams}
                        totalNeeded={totalNeeded}
                        suggestedQuota={suggestedQuota}
                        canManage={canManage}
                        getOrdinal={getOrdinal}
                    />
                )}

                {activeTab === 'field' && (
                    <FieldTab
                        enrollments={enrollments}
                        numTeams={numTeams}
                        getTeamPlayers={getTeamPlayers}
                        teamConfigs={teamConfigs}
                        canManage={canManage}
                        selectedPlayerId={selectedPlayerId}
                        onPlayerClick={(id) => setSelectedPlayerId(selectedPlayerId === id ? null : id)}
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
                    />
                )}

                {activeTab === 'fixtures' && (
                    <FixtureTimeline
                        matchMode={match?.match_mode || 'free'}
                        numTeams={numTeams}
                        fixtures={match?.fixtures}
                        teamConfigs={teamConfigs}
                        onStartMatch={handleStartMatch}
                        onUpdateMode={updateMatchMode}
                        onReorder={updateFixtures}
                        onAddFinals={addFinals}
                        onGenerateFixtures={generateFixtures}
                        canManage={canManage}
                        games={games}
                    />
                )}

                {activeTab === 'games' && (
                    <>
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
                            onUndoMatch={deleteGameResult}
                        />

                        <MatchHistory
                            showHistory={showHistory}
                            setShowHistory={setShowHistory}
                            games={games}
                            teamConfigs={teamConfigs}
                            canManage={canManage}
                            onDeleteGame={deleteGameResult}
                        />
                    </>
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

            <StatusMessage type={statusMsg.type} text={statusMsg.text} />
        </div>
    )
}
