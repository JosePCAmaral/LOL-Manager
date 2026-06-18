/**
 * Pure functions operating on the Team entity.
 */

import type { Team, Player, Role } from '@types-app/index'
import { getPlayerOverallRating } from '../players/player.model'

/**
 * Returns the average overall rating of the team's 5 starters.
 * Players not found in the provided array are skipped (not counted).
 * Result is in [1, 20].
 *
 * Design decision: the function receives a Player[] instead of a map to keep
 * the engine layer free from persistence concerns. The caller resolves IDs.
 */
export function getTeamStrength(team: Team, players: Player[]): number {
  const starterIds = Object.values(team.roster.starters) as string[]
  const starters = players.filter(p => starterIds.includes(p.id))

  if (starters.length === 0) return 1

  const total = starters.reduce((sum, p) => sum + getPlayerOverallRating(p), 0)
  return total / starters.length
}

/**
 * Assesses budget health based on remaining budget after estimated salary costs.
 *
 * Estimation: total salaries ≈ budget * 0.6 (fixed, as specified).
 * Remaining = budget - (budget * 0.6) = budget * 0.4.
 * The ratio is remaining / budget = 0.4 in a default case, but we use the
 * actual remaining fraction to support dynamic salary deductions in the future.
 *
 * For the MVP the remaining fraction is fixed at 40% (budget * 0.4 / budget).
 * Thresholds (from task spec):
 *   critical : < 20%
 *   low      : < 40%
 *   ok       : < 70%
 *   healthy  : >= 70%
 */
export function getTeamBudgetHealth(
  team: Team,
): 'critical' | 'low' | 'ok' | 'healthy' {
  const estimatedSalaries = team.budget * 0.6
  const remaining = team.budget - estimatedSalaries
  const ratio = remaining / team.budget   // always 0.4 with the fixed estimate

  if (ratio < 0.2) return 'critical'
  if (ratio < 0.4) return 'low'
  if (ratio < 0.7) return 'ok'
  return 'healthy'
}

/**
 * Returns true if the team can afford the given salary without going negative.
 */
export function canSignPlayer(team: Team, salary: number): boolean {
  return team.budget - salary >= 0
}

/**
 * Returns an array with the IDs of the team's 5 starters.
 * Only positions that have a value are included.
 */
export function getStarterIds(team: Team): string[] {
  return Object.values(team.roster.starters).filter(
    (id): id is string => id !== undefined,
  )
}
