/**
 * Test Data Factories
 * Utility functions to generate consistent mock data for tests.
 */

let idCounter = 1

export function createMockProfile(overrides = {}) {
    const id = `profile-${idCounter++}`
    return {
        id,
        full_name: 'Juan Jugador',
        elo_rating: 1200,
        balance: 50,
        is_admin: false,
        is_super_admin: false,
        ...overrides
    }
}

export function createMockField(overrides = {}) {
    const id = `field-${idCounter++}`
    return {
        id,
        name: 'El Monumental',
        players_per_team: 5,
        price_per_hour: 120,
        address: 'https://maps.google.com/test',
        phone: '987654321',
        ...overrides
    }
}

export function createMockMatch(overrides = {}) {
    const id = `match-${idCounter++}`
    const field = overrides.field || createMockField()
    return {
        id,
        field_id: field.id,
        field,
        date: '2026-02-10',
        time: '20:00:00',
        status: 'open',
        max_players: field.players_per_team * 2,
        is_locked: false,
        is_canceled: false,
        creator_id: 'creator-1',
        team_configs: null,
        enrollments: [],
        ...overrides
    }
}

export function createMockEnrollment(overrides = {}) {
    const id = `enroll-${idCounter++}`
    const player = overrides.player || createMockProfile()
    return {
        id,
        match_id: overrides.match_id || 'match-1',
        player_id: player.id,
        player,
        paid: false,
        paid_at: null,
        is_present: false,
        is_excluded: false,
        is_waitlist: false,
        team_assignment: null,
        created_at: new Date().toISOString(),
        ...overrides
    }
}

/**
 * Creates a match with a specified number of enrollments
 */
export function createMockMatchWithEnrollments(enrollmentCount, matchOverrides = {}) {
    const field = matchOverrides.field || createMockField()
    const match = createMockMatch({ field, ...matchOverrides })

    const enrollments = []
    for (let i = 0; i < enrollmentCount; i++) {
        enrollments.push(createMockEnrollment({
            match_id: match.id,
            player: createMockProfile({ full_name: `Jugador ${i + 1}` })
        }))
    }

    match.enrollments = enrollments
    return match
}

/**
 * Reset counter between test suites
 */
export function resetIdCounter() {
    idCounter = 1
}
