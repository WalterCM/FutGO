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
