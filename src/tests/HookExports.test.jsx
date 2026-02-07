import { renderHook } from '@testing-library/react'
import { expect, test, describe, vi } from 'vitest'
import { useMatchDetail } from '../hooks/useMatchDetail'

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: {}, error: null }),
                    order: () => Promise.resolve({ data: [], error: null })
                })
            })
        })
    })
}))

describe('useMatchDetail exports', () => {
    test('exports addManualFixture', () => {
        const { result } = renderHook(() => useMatchDetail('match-1', { id: 'user-1' }, () => { }))
        expect(result.current.addManualFixture).toBeDefined()
        expect(typeof result.current.addManualFixture).toBe('function')
    })
})
