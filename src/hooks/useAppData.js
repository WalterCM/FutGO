import { useState, useCallback } from 'react'
import { useSupabaseData, useSupabaseCRUD } from './useSupabase'

export const useFields = () => {
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
  
  const { data: fields, loading, error, refetch } = useSupabaseData('fields', {
    orderBy: 'name'
  })
  
  const { create, update: updateField, remove: deleteField, loading: actionLoading } = useSupabaseCRUD('fields')

  const showMsg = useCallback((type, text) => {
    setStatusMsg({ type, text })
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000)
  }, [])

  const handleCreate = useCallback(async (fieldData) => {
    const result = await create(fieldData)
    if (result.error) {
      showMsg('error', result.error)
      return null
    } else {
      showMsg('success', 'Cancha creada exitosamente')
      await refetch()
      return result.data
    }
  }, [create, showMsg, refetch])

  const handleUpdate = useCallback(async (id, fieldData) => {
    const result = await updateField(id, fieldData)
    if (result.error) {
      showMsg('error', result.error)
      return null
    } else {
      showMsg('success', 'Cancha actualizada exitosamente')
      await refetch()
      return result.data
    }
  }, [updateField, showMsg, refetch])

  const handleDelete = useCallback(async (id) => {
    const result = await deleteField(id)
    if (result.error) {
      showMsg('error', result.error)
      return false
    } else {
      showMsg('success', 'Cancha eliminada exitosamente')
      await refetch()
      return true
    }
  }, [deleteField, showMsg, refetch])

  return {
    fields,
    loading,
    error,
    actionLoading,
    statusMsg,
    createField: handleCreate,
    updateField: handleUpdate,
    deleteField: handleDelete,
    refetch,
    showMsg
  }
}

export const useMatches = () => {
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
  
  const { data: matches, loading, error, refetch } = useSupabaseData('matches', {
    select: '*, field:fields(*)',
    orderBy: [{ column: 'date', ascending: true }, { column: 'time', ascending: true }]
  })
  
  const { create, update: updateMatch, remove: deleteMatch, loading: actionLoading } = useSupabaseCRUD('matches')

  const showMsg = useCallback((type, text) => {
    setStatusMsg({ type, text })
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 3000)
  }, [])

  const getUpcomingMatches = useCallback(() => {
    if (!matches) return []
    const today = new Date().toISOString().split('T')[0]
    return matches.filter(match => 
      match.date >= today && !match.is_canceled
    )
  }, [matches])

  const getPastMatches = useCallback(() => {
    if (!matches) return []
    const today = new Date().toISOString().split('T')[0]
    return matches.filter(match => match.date < today)
  }, [matches])

  return {
    matches,
    loading,
    error,
    actionLoading,
    statusMsg,
    createMatch: create,
    updateMatch,
    deleteMatch,
    refetch,
    getUpcomingMatches,
    getPastMatches,
    showMsg
  }
}