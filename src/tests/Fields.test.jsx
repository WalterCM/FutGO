import { render, screen, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import Fields from '../pages/Fields'
import { supabase } from '../lib/supabase'

test('renders the fields catalog title', async () => {
    // Mock the supabase response for fetching fields
    supabase.from().select().order.mockResolvedValue({
        data: [
            { id: '1', name: 'Cancha 1', players_per_team: 5, price_per_hour: 100, address: 'Link' },
        ],
        error: null
    })

    render(<Fields profile={{ is_admin: true }} />)

    // Wait for the component to load and render the title
    await waitFor(() => {
        expect(screen.getByText(/Catálogo de Canchas/i)).toBeDefined()
    })

    // Check if our mocked cancha name is visible
    expect(screen.getByText('Cancha 1')).toBeDefined()
})
