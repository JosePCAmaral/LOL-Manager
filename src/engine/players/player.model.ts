/**
 * Pure functions operating on the Player entity.
 * No side effects, no external dependencies, no randomness.
 */

import type { Player } from '@types-app/index'

// ---------------------------------------------------------------------------
// Weight tables
// ---------------------------------------------------------------------------

/** Overall rating: mechanics and gameSense weight 1.5, all others 1.0 */
const OVERALL_WEIGHTS: Record<keyof import('@types-app/index').PlayerAttributes, number> = {
  mechanics: 1.5,
  gameSense: 1.5,
  laning: 1.0,
  teamfight: 1.0,
  shotcalling: 1.0,
  metaAdaptation: 1.0,
  consistency: 1.0,
  resilience: 1.0,
  synergy: 0.0,   // synergy is team-context stat, excluded from individual rating
}

/**
 * Per-role attribute weights for getPlayerRoleScore.
 * Attributes not listed receive a weight of 1.0.
 */
const ROLE_WEIGHTS: Record<
  import('@types-app/index').Role,
  Partial<Record<keyof import('@types-app/index').PlayerAttributes, number>>
> = {
  TOP: { resilience: 1.5, laning: 1.5 },
  JUNGLE: { gameSense: 1.5, mechanics: 1.5 },
  MID: { mechanics: 1.5, metaAdaptation: 1.5 },
  ADC: { mechanics: 1.5, consistency: 1.5 },
  SUPPORT: { shotcalling: 1.5, gameSense: 1.5 },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type AttrKey = keyof import('@types-app/index').PlayerAttributes

const ALL_ATTRS: AttrKey[] = [
  'mechanics',
  'laning',
  'teamfight',
  'gameSense',
  'shotcalling',
  'metaAdaptation',
  'consistency',
  'resilience',
]

function weightedAverage(
  player: Player,
  weights: Partial<Record<AttrKey, number>>,
): number {
  let weightedSum = 0
  let totalWeight = 0

  for (const attr of ALL_ATTRS) {
    const w = weights[attr] ?? 1.0
    weightedSum += player.attributes[attr] * w
    totalWeight += w
  }

  const raw = weightedSum / totalWeight
  return Math.round(raw * 10) / 10
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Overall rating: weighted average of all 8 attributes.
 * mechanics and gameSense have weight 1.5; others weight 1.0.
 * Result is in [1, 20], rounded to 1 decimal place.
 */
export function getPlayerOverallRating(player: Player): number {
  return weightedAverage(player, OVERALL_WEIGHTS)
}

/**
 * Role-specific score: same weighted average but with role-specific
 * emphasis on the two most relevant attributes (weight 1.5 each).
 * Result is in [1, 20], rounded to 1 decimal place.
 */
export function getPlayerRoleScore(player: Player): number {
  return weightedAverage(player, ROLE_WEIGHTS[player.role])
}

/**
 * Returns true if the player has an active contract and is currently a starter.
 */
export function isPlayerAvailable(player: Player): boolean {
  return player.contract !== null && player.isStarter
}

/**
 * Returns the championId with the highest masteryLevel, or null if pool is empty.
 */
export function getTopChampion(player: Player): string | null {
  if (player.championPool.length === 0) return null

  let best = player.championPool[0]
  for (const entry of player.championPool) {
    if (entry.masteryLevel > best.masteryLevel) {
      best = entry
    }
  }
  return best.championId
}
