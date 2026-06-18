/**
 * schedule.ts — fixture generation for round-robin league schedules.
 *
 * All functions are pure; no mutation of inputs.
 * All randomness goes through the SeededRng parameter (never Math.random).
 */

import type { Fixture } from '@types-app/index'
import type { GameDate } from '@types-app/index'
import { REGULAR_SEASON_START_DAY, REGULAR_SEASON_END_DAY } from './season'

/** Type alias for the seeded RNG function returned by seededRandom(). */
export type SeededRng = () => number

// ---------------------------------------------------------------------------
// Round-robin generation
// ---------------------------------------------------------------------------

/**
 * Generates a double round-robin schedule for the given team IDs.
 *
 * Algorithm: classic "circle" (polygon) method.
 *   - Fix team at index 0; rotate the remaining (n-1) teams across (n-1) rounds.
 *   - Each round produces n/2 pairs (for even n); for odd n, one team gets a bye
 *     (the fixture simply does not exist for that slot).
 *   - Second half of the schedule reverses home/away for each pair.
 *
 * Dates: fixtures are distributed uniformly across
 * [REGULAR_SEASON_START_DAY, REGULAR_SEASON_END_DAY] in the given year.
 * The algorithm assigns one "match slot" per round, spacing them evenly.
 * With n teams there are (n-1) rounds per half, so (2*(n-1)) total rounds.
 *
 * Fixture IDs: `fix-{year}-{index:04d}` (zero-padded, 0-indexed).
 *
 * All fixtures start with played === false.
 */
export function generateRoundRobin(teamIds: string[], year: number): Fixture[] {
  const n = teamIds.length
  if (n < 2) return []

  // Pad to even number of teams so the circle algorithm works cleanly.
  // The dummy entry is used only internally for bye calculation.
  const teams = n % 2 === 0 ? [...teamIds] : [...teamIds, '__bye__']
  const size = teams.length // always even
  const halfSize = size / 2
  const roundsPerHalf = size - 1
  const totalRounds = roundsPerHalf * 2

  const availableDays = REGULAR_SEASON_END_DAY - REGULAR_SEASON_START_DAY + 1
  // Space rounds evenly; minimum 1 day apart.
  const spacing = Math.max(1, Math.floor(availableDays / totalRounds))

  const fixtures: Fixture[] = []
  let fixtureIndex = 0

  // Build rotation array (all teams except the fixed one at position 0)
  const rotation = teams.slice(1)

  for (let round = 0; round < roundsPerHalf; round++) {
    // Day assigned to this round (1-based dayOfYear)
    const dayOfYear = Math.min(
      REGULAR_SEASON_START_DAY + round * spacing,
      REGULAR_SEASON_END_DAY,
    )
    const date: GameDate = { year, dayOfYear }

    // Build pairs for this round using the circle method.
    // Fixed team (teams[0]) pairs with rotation[0]; then rotation[i] pairs with rotation[size-2-i].
    const roundPairs: Array<[string, string]> = []

    roundPairs.push([teams[0], rotation[0]])
    for (let i = 1; i < halfSize; i++) {
      roundPairs.push([rotation[i], rotation[size - 1 - i]])
    }

    // First half: add fixtures (skip byes)
    for (const [home, away] of roundPairs) {
      if (home === '__bye__' || away === '__bye__') continue
      fixtures.push({
        id: `fix-${year}-${String(fixtureIndex).padStart(4, '0')}`,
        date,
        teamA: home,
        teamB: away,
        played: false,
      })
      fixtureIndex++
    }

    // Rotate: move last element of rotation to front
    rotation.unshift(rotation.pop()!)
  }

  // Second half: reverse home/away, placed in the second block of rounds
  // We keep the original round order but offset dates into the second half of available days.
  // Reset rotation
  const rotation2 = teams.slice(1)

  for (let round = 0; round < roundsPerHalf; round++) {
    const dayOfYear = Math.min(
      REGULAR_SEASON_START_DAY + (roundsPerHalf + round) * spacing,
      REGULAR_SEASON_END_DAY,
    )
    const date: GameDate = { year, dayOfYear }

    const roundPairs: Array<[string, string]> = []
    roundPairs.push([teams[0], rotation2[0]])
    for (let i = 1; i < halfSize; i++) {
      roundPairs.push([rotation2[i], rotation2[size - 1 - i]])
    }

    for (const [home, away] of roundPairs) {
      if (home === '__bye__' || away === '__bye__') continue
      // Reverse home/away for the return leg
      fixtures.push({
        id: `fix-${year}-${String(fixtureIndex).padStart(4, '0')}`,
        date,
        teamA: away,
        teamB: home,
        played: false,
      })
      fixtureIndex++
    }

    rotation2.unshift(rotation2.pop()!)
  }

  return fixtures
}

// ---------------------------------------------------------------------------
// Fixture utilities
// ---------------------------------------------------------------------------

/**
 * Shuffles the order of fixtures using Fisher-Yates, drawing randomness from
 * `rng`. Does NOT change the dates assigned to fixtures — only the order of
 * elements in the returned array. Returns a new array.
 */
export function shuffleFixtures(fixtures: Fixture[], rng: SeededRng): Fixture[] {
  const arr = [...fixtures]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const temp = arr[i]
    arr[i] = arr[j]
    arr[j] = temp
  }
  return arr
}

/**
 * Returns all fixtures where the given team is either teamA or teamB.
 */
export function getFixturesForTeam(fixtures: Fixture[], teamId: string): Fixture[] {
  return fixtures.filter(f => f.teamA === teamId || f.teamB === teamId)
}

/**
 * Returns all fixtures scheduled on the given date (same year and dayOfYear).
 */
export function getFixturesByDate(fixtures: Fixture[], date: GameDate): Fixture[] {
  return fixtures.filter(
    f => f.date.year === date.year && f.date.dayOfYear === date.dayOfYear,
  )
}
