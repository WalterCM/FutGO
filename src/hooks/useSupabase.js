import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// Generic hook for fetching data from Supabase
export const useSupabaseData = (tableName, options = {}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const {
    select = '*',
    orderBy = null,
    limit = null,
    eq = null,
    in: inFilter = null,
    or: orFilter = null,
    single = false,
    maybeSingle = false,
    count = false,
    dependencies = []
  } = options

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase.from(tableName).select(select, { count })

      if (eq) {
        Object.entries(eq).forEach(([column, value]) => {
          query = query.eq(column, value)
        })
      }

      if (inFilter) {
        Object.entries(inFilter).forEach(([column, values]) => {
          query = query.in(column, values)
        })
      }

      if (orFilter) {
        query = query.or(orFilter)
      }

      if (orderBy) {
        if (Array.isArray(orderBy)) {
          orderBy.forEach(order => {
            if (typeof order === 'string') {
              query = query.order(order)
            } else {
              query = query.order(order.column, { ascending: order.ascending })
            }
          })
        } else {
          query = query.order(orderBy)
        }
      }

      if (limit) {
        query = query.limit(limit)
      }

      if (single) {
        const { data, error } = await query.single()
        if (error) throw error
        setData(data)
      } else if (maybeSingle) {
        const { data, error } = await query.maybeSingle()
        if (error) throw error
        setData(data)
      } else {
        const { data, error } = await query
        if (error) throw error
        setData(data || [])
      }
    } catch (err) {
      setError(err.message)
      console.error(`Error fetching data from ${tableName}:`, err)
    } finally {
      setLoading(false)
    }
  }, [tableName, select, orderBy, limit, eq, inFilter, orFilter, single, maybeSingle, count, ...dependencies])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Hook for managing CRUD operations
export const useSupabaseCRUD = (tableName) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const create = useCallback(async (newData) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .insert(newData)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [tableName])

  const update = useCallback(async (id, updateData) => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (err) {
      setError(err.message)
      return { data: null, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [tableName])

  const remove = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { error: null }
    } catch (err) {
      setError(err.message)
      return { error: err.message }
    } finally {
      setLoading(false)
    }
  }, [tableName])

  return { create, update, remove, loading, error }
}

// Hook for managing form state and validation
export const useForm = (initialState, validationSchema = null) => {
  const [values, setValues] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
    setTouched(prev => ({ ...prev, [name]: true }))
  }, [])

  const setError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }))
  }, [])

  const clearError = useCallback((name) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }, [])

  const resetForm = useCallback(() => {
    setValues(initialState)
    setErrors({})
    setTouched({})
  }, [initialState])

  const validate = useCallback(() => {
    if (!validationSchema) return true

    const newErrors = {}
    let isValid = true

    Object.entries(validationSchema).forEach(([field, rules]) => {
      const value = values[field]
      
      if (rules.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = rules.requiredMessage || 'Este campo es requerido'
        isValid = false
      }
      
      if (rules.minLength && value && value.length < rules.minLength) {
        newErrors[field] = `Mínimo ${rules.minLength} caracteres`
        isValid = false
      }
      
      if (rules.pattern && value && !rules.pattern.test(value)) {
        newErrors[field] = rules.patternMessage || 'Formato inválido'
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validationSchema])

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    clearError,
    resetForm,
    validate,
    setValues
  }
}