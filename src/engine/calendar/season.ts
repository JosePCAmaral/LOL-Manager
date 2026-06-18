/**
 * season.ts — season structure constants and phase-classification functions.
 *
 * Day-of-year ranges are defined here as the single source of truth.
 * All functions are pure and return new objects/values.
 */

import type { GameDate } from '@types-app/index'
import type { Fixture } from '@types-app/index'
import {
  createEmptyCalendar,
  setActivity,
  type CalendarDay,
  type DayActivity,
} from './calendar'

// ---------------------------------------------------------------------------
// Season constants
// ---------------------------------------------------------------------------

export const SEASON_LENGTH_DAYS = 365

/** Day on which the regular season begins (inclusive). */
export const REGULAR_SEASON_START_DAY = 15
/** Day on which the regular season ends (inclusive). */
export const REGULAR_SEASON_END_DAY = 270
/** Day on which the playoffs begin (inclusive). */
export const PLAYOFFS_START_DAY = 280
/** Day on which the playoffs end (inclusive). */
export const PLAYOFFS_END_DAY = 320
/** Day on which the off-season begins (inclusive). */
export const OFFSEASON_START_DAY = 321

// ---------------------------------------------------------------------------
// Phase determination
// ---------------------------------------------------------------------------

export type SeasonPhase = 'preseason' | 'regularSeason' | 'playoffs' | 'offseason'

/**
 * Determines which season phase `date` belongs to based on its dayOfYear.
 *
 * Ranges (inclusive):
 *   1–14          → preseason
 *   15–270        → regularSeason
 *   271–279       → (rest between phases, classified as offseason here so it maps cleanly)
 *   280–320       → playoffs
 *   321–365       → offseason
 *
 * Note: days 271–279 (rest break) are returned as 'offseason' because there is
 * no dedicated phase for them; callers that need to distinguish the inter-phase
 * rest window should check the dayOfYear range directly.
 */
export function getSeasonPhase(date: GameDate): SeasonPhase {
  const d = date.dayOfYear
  if (d < REGULAR_SEASON_START_DAY) return 'preseason'
  if (d <= REGULAR_SEASON_END_DAY) return 'regularSeason'
  if (d < PLAYOFFS_START_DAY) return 'offseason'
  if (d <= PLAYOFFS_END_DAY) return 'playoffs'
  return 'offseason'
}

// ---------------------------------------------------------------------------
// Match-day check
// ---------------------------------------------------------------------------

/**
 * Returns true if there is at least one unplayed Fixture scheduled on `date`.
 */
export function isMatchDay(date: GameDate, fixtures: Fixture[]): boolean {
  return fixtures.some(
    f =>
      !f.played &&
      f.date.year === date.year &&
      f.date.dayOfYear === date.dayOfYear,
  )
}

// ---------------------------------------------------------------------------
// Full season calendar builder
// ---------------------------------------------------------------------------

/**
 * Builds the complete 365-day CalendarDay array for a given `year`, using the
 * provided `fixtures` to stamp match days.
 *
 * Layout:
 *   days  1–14   : offseason (pre-season)
 *   days 15–270  : regular season
 *                  - days with fixtures → 'match' (fixtureId from first fixture that day)
 *                  - other days alternate: 'general_training' (4×/week) / 'rest' (3×/week)
 *                    determined by (dayOfYear % 7): values 0,1,2 → rest; 3,4,5,6 → general_training
 *   days 271–279 : rest (inter-phase break)
 *   days 280–320 : playoffs — same match/training/rest logic
 *   days 321–365 : offseason
 */
export function buildSeasonCalendar(year: number, fixtures: Fixture[]): CalendarDay[] {
  // Start on day 1 of the given year.
  const startDate: GameDate = { year, dayOfYear: 1 }
  let calendar = createEmptyCalendar(startDate, SEASON_LENGTH_DAYS)

  // Index fixtures by dayOfYear for O(1) lookup (only fixtures in this year).
  const fixturesByDay = new Map<number, Fixture[]>()
  for (const fixture of fixtures) {
    if (fixture.date.year !== year) continue
    const list = fixturesByDay.get(fixture.date.dayOfYear) ?? []
    list.push(fixture)
    fixturesByDay.set(fixture.date.dayOfYear, list)
  }

  for (let dayOfYear = 1; dayOfYear <= SEASON_LENGTH_DAYS; dayOfYear++) {
    const date: GameDate = { year, dayOfYear }
    let activity: DayActivity

    if (dayOfYear < REGULAR_SEASON_START_DAY) {
      // days 1–14: preseason offseason — default already set
      activity = { type: 'offseason' }
    } else if (dayOfYear <= REGULAR_SEASON_END_DAY) {
      // days 15–270: regular season
      activity = _resolvePhaseActivity(dayOfYear, fixturesByDay)
    } else if (dayOfYear < PLAYOFFS_START_DAY) {
      // days 271–279: rest break between phases
      activity = { type: 'rest' }
    } else if (dayOfYear <= PLAYOFFS_END_DAY) {
      // days 280–320: playoffs
      activity = _resolvePhaseActivity(dayOfYear, fixturesByDay)
    } else {
      // days 321–365: off-season
      activity = { type: 'offseason' }
    }

    calendar = setActivity(calendar, date, activity)
  }

  return calendar
}

/**
 * Internal helper: for a day inside a competitive phase (regular season or
 * playoffs), pick the appropriate activity:
 *   - If there is a fixture on this day → 'match' (uses the first fixture's id)
 *   - Otherwise alternate training/rest:
 *       dayOfYear % 7 in {0, 1, 2} → 'rest'   (3 days per cycle)
 *       dayOfYear % 7 in {3, 4, 5, 6} → 'general_training' (4 days per cycle)
 */
function _resolvePhaseActivity(
  dayOfYear: number,
  fixturesByDay: Map<number, Fixture[]>,
): DayActivity {
  const dayFixtures = fixturesByDay.get(dayOfYear)
  if (dayFixtures && dayFixtures.length > 0) {
    return { type: 'match', fixtureId: dayFixtures[0].id }
  }
  const mod = dayOfYear % 7
  if (mod === 0 || mod === 1 || mod === 2) {
    return { type: 'rest' }
  }
  return { type: 'general_training' }
}
