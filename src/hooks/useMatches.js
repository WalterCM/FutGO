import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useMatches = (profile) => {
    const [matches, setMatches] = useState([])
    const [pastMatches, setPastMatches] = useState([])
    const [fields, setFields] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
    const [confirmingLeaveId, setConfirmingLeaveId] = useState(null)

    const showMsg = useCallback((type, text) => {
        setStatusMsg({ type, text })
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000)
    }, [])

    const fetchMatches = useCallback(async () => {
        const now = new Date()
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

        const { data: upcoming, error: upcomingError } = await supabase
            .from('matches')
            .select(`
                *,
                field:fields(*),
                creator:profiles(full_name),
                enrollments(*, player:profiles(*))
            `)
            .gte('date', today)
            .order('date', { ascending: true })
            .order('time', { ascending: true })

        if (upcomingError) {
            showMsg('error', upcomingError.message)
        } else {
            setMatches(upcoming || [])
        }

        const { data: past, error: pastError } = await supabase
            .from('matches')
            .select(`
                *,
                field:fields(*),
                creator:profiles(full_name),
                enrollments(*, player:profiles(*))
            `)
            .lt('date', today)
            .order('date', { ascending: false })
            .order('time', { ascending: false })

        if (pastError) {
            showMsg('error', pastError.message)
        } else {
            setPastMatches(past || [])
        }
    }, [showMsg])

    const fetchFields = useCallback(async () => {
        const { data } = await supabase.from('fields').select('*').order('name')
        setFields(data || [])
        return data || []
    }, [])

    useEffect(() => {
        setLoading(true)
        Promise.all([fetchMatches(), fetchFields()])
            .finally(() => setLoading(false))
    }, [fetchMatches, fetchFields])

    const joinMatch = async (matchId) => {
        setActionLoading(matchId)
        const { error } = await supabase
            .from('enrollments')
            .insert([{
                match_id: matchId,
                player_id: profile.id
            }])

        if (error) {
            if (error.code === '23505') showMsg('error', 'Ya estás inscrito')
            else showMsg('error', error.message)
        } else {
            showMsg('success', '¡Te has unido! ⚽')
            await fetchMatches()
        }
        setActionLoading(null)
    }

    const leaveMatch = async (matchId) => {
        if (confirmingLeaveId !== matchId) {
            setConfirmingLeaveId(matchId)
            setTimeout(() => setConfirmingLeaveId(null), 3000)
            return
        }

        setActionLoading(matchId)
        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('match_id', matchId)
            .eq('player_id', profile.id)

        if (error) {
            showMsg('error', error.message)
        } else {
            showMsg('success', 'Has salido del partido')
            setConfirmingLeaveId(null)
            await fetchMatches()
        }
        setActionLoading(null)
    }

    const deleteMatch = async (id) => {
        const { error } = await supabase.from('matches').delete().eq('id', id)
        if (error) {
            showMsg('error', error.message)
            return false
        } else {
            showMsg('success', 'Partido eliminado')
            await fetchMatches()
            return true
        }
    }

    const saveMatch = async (matchData, editingId = null) => {
        let error;
        if (editingId) {
            const { error: updateError } = await supabase
                .from('matches')
                .update(matchData)
                .eq('id', editingId)
            error = updateError
        } else {
            const { error: insertError } = await supabase
                .from('matches')
                .insert([{ ...matchData, creator_id: profile.id }])
            error = insertError
        }

        if (error) {
            showMsg('error', error.message)
            return false
        } else {
            showMsg('success', editingId ? '¡Encuentro actualizado! ⚽' : '¡Encuentro programado! ⚽')
            await fetchMatches()
            return true
        }
    }

    return {
        matches,
        pastMatches,
        fields,
        loading,
        actionLoading,
        statusMsg,
        confirmingLeaveId,
        joinMatch,
        leaveMatch,
        deleteMatch,
        saveMatch,
        refresh: fetchMatches
    }
}
