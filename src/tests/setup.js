import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'

// Create a Proxy-based mock that always returns itself for any method call
// This allows infinite chaining like: from().select().order().order().order()
// while still allowing mockResolvedValue at any point
function createProxyMock() {
    const handler = {
        get(target, prop) {
            // If accessing a vitest mock method (like mockResolvedValue), use the stored mock
            if (prop === 'mockResolvedValue' || prop === 'mockReturnValue' ||
                prop === 'mockResolvedValueOnce' || prop === 'mockImplementation' ||
                prop === 'mockClear' || prop === 'mockReset') {
                // Store the actual mock function on the target if not exists
                if (!target._mock) {
                    target._mock = vi.fn()
                }
                return target._mock[prop].bind(target._mock)
            }

            // For any database method call, return a function that:
            // 1. Calls the mock if it exists
            // 2. Returns the proxy for chaining
            if (!target[prop]) {
                target[prop] = vi.fn()
            }

            // Return a function that supports both chaining and resolution
            return (...args) => {
                const result = target[prop](...args)
                // If the mock was set to resolve, return that
                if (result && result.then) {
                    return result
                }
                // Otherwise return proxy for chaining
                return target._proxy
            }
        }
    }

    const target = {}
    target._proxy = new Proxy(target, handler)
    return target._proxy
}

// Simpler approach: just make sure each method returns itself
export const mockQuery = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    order: vi.fn(),
}

// Make each method return mockQuery by default for chaining
Object.keys(mockQuery).forEach(key => {
    mockQuery[key].mockImplementation(() => mockQuery)
})

// Reset before each test - restore chaining behavior
beforeEach(() => {
    Object.keys(mockQuery).forEach(key => {
        mockQuery[key].mockClear()
        mockQuery[key].mockImplementation(() => mockQuery)
    })
})

// Global mock for Supabase
vi.mock('../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => mockQuery),
        auth: {
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            })),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        },
    },
}))
