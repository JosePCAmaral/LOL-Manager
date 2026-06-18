/**
 * SoloQueue prospect generator for the scouting system.
 * All randomness passes through the rng parameter — never Math.random().
 * All functions return new objects (immutable).
 */

import type { ScoutingProspect, Role } from '@types-app/index'
import type { SeededRng } from '../core/rng'
import { randomInt, randomFloat, randomChoice } from '../core/rng'

const ALL_ROLES: readonly Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const

/**
 * Generates a pool of solo-queue prospects for a given region.
 *
 * From spec:
 * - id: prospect-{region}-{index:04d}
 * - estimatedRating: [5, 15] (imprecise, visible)
 * - trueRating: [3, 18] (real, hidden)
 * - potential: integer [50, 95]
 * - age: integer [16, 21]
 * - role: distributed uniformly by rng
 * - scoutedBy: null, contractStatus: 'free_agent', salary: 0, discovered: false
 *
 * Design decision: GameDate for trackedSince is set to year 1, dayOfYear 1 as a
 * placeholder because the generator doesn't receive the current game date. Callers
 * should overwrite trackedSince with the actual current date when storing prospects.
 */
export function generateSoloQueuePool(
  region: string,
  count: number,
  rng: SeededRng,
): ScoutingProspect[] {
  const prospects: ScoutingProspect[] = []

  for (let i = 0; i < count; i++) {
    const index = i + 1
    const role = randomChoice(rng, ALL_ROLES)
    const age = randomInt(rng, 16, 21)
    const trueRating = parseFloat(randomFloat(rng, 3, 18).toFixed(1))
    const estimatedRating = parseFloat(randomFloat(rng, 5, 15).toFixed(1))
    const potential = randomInt(rng, 50, 95)

    const prospect: ScoutingProspect = {
      id: `prospect-${region}-${String(index).padStart(4, '0')}`,
      name: `Prospect ${region}-${String(index).padStart(4, '0')}`,
      region,
      estimatedRole: role,
      observedAttributes: {},
      confidence: 0,
      trackedSince: { year: 1, dayOfYear: 1 },
      // Extended fields for the scouting engine
      role,
      age,
      estimatedRating,
      trueRating,
      potential,
      scoutedBy: null,
      contractStatus: 'free_agent',
      salary: 0,
      discovered: false,
    }

    prospects.push(prospect)
  }

  return prospects
}

/**
 * Refines the visible estimate of a prospect based on scout staff quality.
 *
 * From spec:
 * - No staff bonus: estimatedRating = trueRating ± random error up to ±3
 * - staffBonus > 0.5: error reduced to ±1.5
 * - staffBonus > 0.8: estimatedRating = trueRating exactly
 *
 * Design decision: error is sampled from [-maxError, +maxError] uniformly.
 * The result is clamped to [1, 20] since ratings cannot exceed that range.
 */
export function refineProspectEstimate(
  prospect: ScoutingProspect,
  staffBonus: number,
  rng: SeededRng,
): ScoutingProspect {
  const trueRating = prospect.trueRating ?? prospect.estimatedRating ?? 10

  let newEstimate: number

  if (staffBonus > 0.8) {
    newEstimate = trueRating
  } else {
    const maxError = staffBonus > 0.5 ? 1.5 : 3
    const error = randomFloat(rng, -maxError, maxError)
    newEstimate = trueRating + error
  }

  // Clamp to valid rating range [1, 20]
  newEstimate = Math.max(1, Math.min(20, parseFloat(newEstimate.toFixed(1))))

  return {
    ...prospect,
    estimatedRating: newEstimate,
  }
}
