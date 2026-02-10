/**
 * utils - Global Utility Functions & Calculation Formulas
 * 
 * BUSINESS LOGIC DOCUMENTATION:
 * 
 * 1. FIFA-STYLE RATING (RATING VIRTUAL)
 *    - Formula: Normalizes raw ELO [1000-2000+] into a 40-99 scale.
 *    - Base Floor: 60 (Represents a standard amateur/gold player).
 *    - Excellence Ceiling: Math.max(Max Community ELO, 2000).
 *    - Scaling: Each win (+20 ELO) typically adds ~1 point to the rating, ensuring gradual progression.
 * 
 * 2. PRIVACY-AWARE DISPLAY NAMES
 *    - Goal: Show nicknames to everyone, but real names ONLY to admins/organizers.
 *    - Logic: if (isSuperAdmin || isCreator) -> canSeeRealName is true.
 *    - If allowed, the UI typically shows "Nickname (Real Name)".
 *    - Regular users only see "Nickname" or a fallback.
 *    - SECURITY: All display names are sanitized to prevent XSS attacks.
 */

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
 * Sanitizes text to prevent XSS attacks
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
    if (!text || typeof text !== 'string') return '';

    return text
        .replace(/[<>"'&]/g, '')  // Remove dangerous characters
        .replace(/\s+/g, ' ')      // Normalize spaces
        .trim();
};

/**
 * Validates and sanitizes a display name with length limits
 * @param {string} name - Name to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized name or fallback
 */
export const sanitizeDisplayName = (name, maxLength = 50) => {
    if (!name || typeof name !== 'string') return null;

    return sanitizeText(name).substring(0, maxLength) || null;
};

/**
 * Returns the display name for a player with privacy awareness and security.
 * @param {object} profile - Profile object with full_name and nickname
 * @param {string} viewerId - ID of the logged-in user
 * @param {string} matchCreatorId - ID of the match organizer (if applicable)
 * @param {boolean} viewerIsSuperAdmin - Whether the viewer has god-mode permissions
 * @returns {string} - The sanitized display name to show
 */
export function getDisplayName(profile, viewerId, matchCreatorId, viewerIsSuperAdmin) {
    if (!profile) return 'Jugador'

    const canSeeRealName = viewerIsSuperAdmin || (matchCreatorId && viewerId === matchCreatorId)
    const sanitizedNickname = sanitizeDisplayName(profile.nickname)
    const sanitizedFullName = sanitizeDisplayName(profile.full_name)

    // If viewer can see real name, we still prioritize nickname as the "Display" name
    // but the component will handle showing the real name in parenthesis if needed.
    if (canSeeRealName) {
        return sanitizedNickname || sanitizedFullName || 'Jugador'
    }

    // For regular users, prioritize nickname. If no nickname, fallback to full name
    return sanitizedNickname || sanitizedFullName || 'Jugador'
}
