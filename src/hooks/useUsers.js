import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export const useUsers = (profile) => {
    const { refreshProfile } = useAuth()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(null)
    const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
    const [searchTerm, setSearchTerm] = useState('')

    const showMsg = useCallback((type, text) => {
        setStatusMsg({ type, text })
        setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000)
    }, [])

    const fetchUsers = useCallback(async () => {
        if (!profile?.is_super_admin) return
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('full_name')

        if (error) {
            showMsg('error', error.message)
        } else {
            setUsers(data || [])
        }
        setLoading(false)
    }, [profile, showMsg])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const updateUserName = async (userId, newName) => {
        if (!newName.trim()) return false
        setActionLoading(userId + 'name')

        const { error } = await supabase
            .from('profiles')
            .update({ full_name: newName.trim() })
            .eq('id', userId)

        if (error) {
            showMsg('error', error.message)
            setActionLoading(null)
            return false
        } else {
            showMsg('success', 'Identidad actualizada')
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, full_name: newName.trim() } : u
            ))
            refreshProfile()
            setActionLoading(null)
            return true
        }
    }

    const adjustBalance = async (userId, currentBalance, amount) => {
        setActionLoading(userId + 'balance')
        const newBalance = Number(currentBalance || 0) + Number(amount)

        const { error } = await supabase
            .from('profiles')
            .update({ balance: newBalance })
            .eq('id', userId)

        if (error) {
            showMsg('error', error.message)
            setActionLoading(null)
            return false
        } else {
            showMsg('success', 'Balance actualizado')
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, balance: newBalance } : u
            ))
            refreshProfile()
            setActionLoading(null)
            return true
        }
    }

    const toggleRole = async (userId, roleField, newValue) => {
        setActionLoading(userId + roleField)
        const { error } = await supabase
            .from('profiles')
            .update({ [roleField]: newValue })
            .eq('id', userId)

        if (error) {
            showMsg('error', error.message)
            setActionLoading(null)
            return false
        } else {
            showMsg('success', 'Rol actualizado')
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, [roleField]: newValue } : u
            ))
            refreshProfile()
            setActionLoading(null)
            return true
        }
    }

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [users, searchTerm])

    return {
        users,
        filteredUsers,
        loading,
        actionLoading,
        statusMsg,
        searchTerm,
        setSearchTerm,
        updateUserName,
        adjustBalance,
        toggleRole,
        refresh: fetchUsers
    }
}
