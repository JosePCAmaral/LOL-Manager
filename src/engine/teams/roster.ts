/**
 * Roster management: add, remove, swap players.
 * All functions are pure and immutable.
 */

import type { Team, Role } from '@types-app/index'

/**
 * Adds a player to the team's roster.
 * If asStarter is true, assigns to starters[role]; otherwise reserves[role].
 * Does not validate whether the slot is already occupied — callers are
 * responsible for checking before calling.
 */
export function addPlayerToRoster(
  team: Team,
  playerId: string,
  role: Role,
  asStarter: boolean,
): Team {
  if (asStarter) {
    return {
      ...team,
      roster: {
        ...team.roster,
        starters: { ...team.roster.starters, [role]: playerId },
      },
    }
  }
  return {
    ...team,
    roster: {
      ...team.roster,
      reserves: { ...team.roster.reserves, [role]: playerId },
    },
  }
}

/**
 * Removes a player from the roster (starters or reserves), returning a new Team.
 * If the player is not found, returns the team unchanged.
 */
export function removePlayerFromRoster(team: Team, playerId: string): Team {
  const newStarters = { ...team.roster.starters }
  const newReserves = { ...team.roster.reserves }
  let changed = false

  for (const role of Object.keys(newStarters) as Role[]) {
    if (newStarters[role] === playerId) {
      delete newStarters[role]
      changed = true
    }
  }

  for (const role of Object.keys(newReserves) as Role[]) {
    if (newReserves[role] === playerId) {
      delete newReserves[role]
      changed = true
    }
  }

  if (!changed) return team

  return {
    ...team,
    roster: { starters: newStarters, reserves: newReserves },
  }
}

/**
 * Swaps the starter and reserve for a given role.
 * If no reserve exists for that role, returns the team unchanged.
 */
export function swapStarterReserve(team: Team, role: Role): Team {
  const starter = team.roster.starters[role]
  const reserve = team.roster.reserves[role]

  if (reserve === undefined) return team

  const newStarters = { ...team.roster.starters }
  const newReserves = { ...team.roster.reserves }

  if (starter !== undefined) {
    newStarters[role] = reserve
    newReserves[role] = starter
  } else {
    newStarters[role] = reserve
    delete newReserves[role]
  }

  return {
    ...team,
    roster: { starters: newStarters, reserves: newReserves },
  }
}

/**
 * Returns the total number of players in starters + reserves.
 */
export function getRosterSize(team: Team): number {
  const starterCount = Object.values(team.roster.starters).filter(
    id => id !== undefined,
  ).length
  const reserveCount = Object.values(team.roster.reserves).filter(
    id => id !== undefined,
  ).length
  return starterCount + reserveCount
}
