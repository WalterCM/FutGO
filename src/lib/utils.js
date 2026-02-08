/**
 * Computes a FIFA-style Rating (0-99) relative to the community's top player.
 * @param {number} elo - The player's current ELO.
 * @param {number} maxElo - The current maximum ELO in the community.
 * @returns {number} - A rating between 40 and 99.
 */
export function getRating(elo, maxElo = 2000) {
    if (!elo) return 60

    // Base floor for new/average players is 60 (Gold card style)
    const baseRating = 60
    const baseElo = 1000

    // If the community is small or maxElo is low, we use a default of 2000 as ceiling
    // to ensure a gradual transition (Min Excellence Benchmark)
    const effectiveMax = Math.max(maxElo, 2000)

    // Normalize: elo range [1000, effectiveMax] -> rating range [60, 99]
    // A single win (+20 ELO) in a new group will add ~1 point of rating (gradual)
    let rating = baseRating + ((elo - baseElo) / (effectiveMax - baseElo)) * 39

    // Clamp values
    rating = Math.max(40, Math.min(99, Math.floor(rating)))

    return rating
}

/**
 * Returns the display name for a player with privacy awareness.
 * @param {object} profile - Profile object with full_name and nickname
 * @param {string} viewerId - ID of the logged-in user
 * @param {string} matchCreatorId - ID of the match organizer (if applicable)
 * @param {boolean} viewerIsSuperAdmin - Whether the viewer has god-mode permissions
 * @returns {string} - The display name to show
 */
export function getDisplayName(profile, viewerId, matchCreatorId, viewerIsSuperAdmin) {
    if (!profile) return 'Jugador'

    const canSeeRealName = viewerIsSuperAdmin || (matchCreatorId && viewerId === matchCreatorId)

    // If viewer can see real name, we still prioritize nickname as the "Display" name
    // but the component will handle showing the real name in parenthesis if needed.
    if (canSeeRealName) {
        return profile.nickname || profile.full_name || 'Jugador'
    }

    // For regular users, prioritize nickname. If no nickname, fallback to full name (or could be masked 'Jugador')
    return profile.nickname || profile.full_name || 'Jugador'
}
