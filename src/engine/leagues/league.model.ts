/**
 * league.model.ts — pure functions over the League entity.
 *
 * No mutation; all functions return new objects.
 */

import type { League, Fixture } from '@types-app/index'

/**
 * Returns all team IDs that are active in the league.
 * In the MVP every team in the league is active.
 */
export function getActiveTeams(league: League): string[] {
  return [...league.teamIds]
}

/**
 * Returns true if the league is currently in the given phase.
 */
export function isLeagueInPhase(league: League, phase: League['phase']): boolean {
  return league.phase === phase
}

/**
 * Returns how many fixtures belonging to this league have already been played.
 * Uses league.schedule as the source of truth.
 */
export function getLeagueMatchday(league: League, fixtures: Fixture[]): number {
  // Intersect provided fixtures with those in the league schedule by ID.
  const leagueFixtureIds = new Set(league.schedule.map(f => f.id))
  return fixtures.filter(f => leagueFixtureIds.has(f.id) && f.played).length
}

/**
 * Advances the league to the next phase.
 *
 * Transition order:
 *   offseason → regularSeason → playoffs → offseason
 *
 * Returns a new League object; does not mutate the argument.
 */
export function advanceLeaguePhase(league: League): League {
  const next: League['phase'] =
    league.phase === 'offseason'
      ? 'regularSeason'
      : league.phase === 'regularSeason'
        ? 'playoffs'
        : 'offseason'

  return { ...league, phase: next }
}
