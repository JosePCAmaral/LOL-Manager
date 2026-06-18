/**
 * standings.ts — pure functions for league standings calculation.
 *
 * All functions are immutable (return new arrays/objects).
 */

import type { StandingEntry, MatchResult } from '@types-app/index'

/**
 * Creates an initial StandingEntry for each team, with wins and losses at 0.
 */
export function initStandings(teamIds: string[]): StandingEntry[] {
  return teamIds.map(teamId => ({ teamId, wins: 0, losses: 0 }))
}

/**
 * Applies a MatchResult to the standings: increments the winner's wins and
 * the loser's losses. Returns a new array; does not mutate the input.
 *
 * If either team is not present in the standings array, it is ignored silently
 * (the caller is responsible for initialising standings with all teams).
 */
export function applyMatchResult(
  standings: StandingEntry[],
  result: MatchResult,
): StandingEntry[] {
  const loserId = result.teamA === result.winner ? result.teamB : result.teamA

  return standings.map(entry => {
    if (entry.teamId === result.winner) {
      return { ...entry, wins: entry.wins + 1 }
    }
    if (entry.teamId === loserId) {
      return { ...entry, losses: entry.losses + 1 }
    }
    return entry
  })
}

/**
 * Sorts standings by wins descending, then losses ascending (fewer losses is
 * better when wins are tied). Returns a new sorted array.
 */
export function sortStandings(standings: StandingEntry[]): StandingEntry[] {
  return [...standings].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    return a.losses - b.losses
  })
}

/**
 * Returns the 1-based position of `teamId` in the sorted standings.
 * Returns -1 if the team is not found.
 */
export function getTeamPosition(standings: StandingEntry[], teamId: string): number {
  const sorted = sortStandings(standings)
  const idx = sorted.findIndex(e => e.teamId === teamId)
  return idx === -1 ? -1 : idx + 1
}

/**
 * Returns the top `n` entries after sorting.
 */
export function getTopN(standings: StandingEntry[], n: number): StandingEntry[] {
  return sortStandings(standings).slice(0, n)
}
