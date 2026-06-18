/**
 * Scout report generation and prospect ranking.
 * All randomness passes through the rng parameter — never Math.random().
 * All functions return new objects (immutable).
 */

import type { ScoutingProspect, Team, Player, Role } from '@types-app/index'
import type { GameDate } from '@types-app/index'
import type { SeededRng } from '../core/rng'
import { randomFloat } from '../core/rng'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoutReport {
  prospectId: string
  teamId: string
  scoutedOn: GameDate
  estimatedRating: number
  estimatedPotential: number
  roleFit: number            // [0, 1]
  recommendation: 'sign' | 'monitor' | 'pass'
  notes: string[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determines how well the prospect's role fits the team's current needs.
 *
 * From spec:
 * - No starter for that role → 1.0
 * - Starter exists with rating < 10 → 0.7
 * - Starter exists with rating >= 10 → 0.3
 */
function calculateRoleFit(
  prospectRole: Role,
  team: Team,
  players: Player[],
): number {
  const starterId = team.roster.starters[prospectRole]

  if (!starterId) return 1.0

  const starter = players.find(p => p.id === starterId)
  if (!starter) return 1.0

  // Compute a simple average of the starter's attributes as a rough rating proxy
  const attrs = starter.attributes
  const attrValues = Object.values(attrs) as number[]
  const avgRating = attrValues.reduce((s, v) => s + v, 0) / attrValues.length

  return avgRating < 10 ? 0.7 : 0.3
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a scout report for a prospect in the context of a given team.
 *
 * From spec:
 * - roleFit: depends on whether team has a starter for the role and their quality.
 * - recommendation: based on trueRating and roleFit thresholds.
 * - estimatedPotential: prospect.potential ± noise (rng × 10 - 5), clamped [40, 100].
 */
export function generateScoutReport(
  prospect: ScoutingProspect,
  team: Team,
  players: Player[],
  staffBonus: number,
  date: GameDate,
  rng: SeededRng,
): ScoutReport {
  const prospectRole = prospect.role ?? prospect.estimatedRole
  const trueRating = prospect.trueRating ?? prospect.estimatedRating ?? 10
  const prospectPotential = prospect.potential ?? 70

  const roleFit = calculateRoleFit(prospectRole, team, players)

  // estimatedPotential with noise: potential ± (rng() × 10 - 5)
  // staffBonus can reduce noise in future iterations; current formula from spec
  void staffBonus // acknowledged — future: reduce noise with higher staffBonus
  const potentialNoise = rng() * 10 - 5
  const estimatedPotential = Math.max(40, Math.min(100, Math.round(prospectPotential + potentialNoise)))

  const estimatedRating = prospect.estimatedRating ?? trueRating

  // Recommendation logic from spec
  let recommendation: 'sign' | 'monitor' | 'pass'
  if (trueRating > 12 && roleFit > 0.5) {
    recommendation = 'sign'
  } else if (trueRating > 9 || roleFit > 0.7) {
    recommendation = 'monitor'
  } else {
    recommendation = 'pass'
  }

  const notes: string[] = []
  notes.push(`Rating estimado: ${estimatedRating.toFixed(1)}`)
  notes.push(`Encaixe no papel (${prospectRole}): ${(roleFit * 100).toFixed(0)}%`)
  if (recommendation === 'sign') {
    notes.push('Recomendado para contratação imediata')
  } else if (recommendation === 'monitor') {
    notes.push('Vale acompanhar o desenvolvimento')
  } else {
    notes.push('Não atende os critérios mínimos da equipa')
  }

  return {
    prospectId: prospect.id,
    teamId: team.id,
    scoutedOn: date,
    estimatedRating,
    estimatedPotential,
    roleFit,
    recommendation,
    notes,
  }
}

/**
 * Ranks prospects by their trueRating (descending).
 *
 * From spec: trueRating is the internal hidden value used by AI — only exposed
 * via this internal ranking function, not surfaced directly to the UI.
 */
export function rankProspects(
  prospects: ScoutingProspect[],
  _team: Team,
  _players: Player[],
): ScoutingProspect[] {
  return [...prospects].sort((a, b) => {
    const ratingA = a.trueRating ?? a.estimatedRating ?? 0
    const ratingB = b.trueRating ?? b.estimatedRating ?? 0
    return ratingB - ratingA
  })
}
