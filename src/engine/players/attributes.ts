/**
 * Attribute cap, growth, and training bonus functions.
 * All randomness is delegated to the rng parameter — never Math.random().
 */

import type { PlayerAttributes, Role } from '@types-app/index'

/** Hard minimum and maximum for any player attribute. */
const ATTR_MIN = 1
const ATTR_MAX = 20

/**
 * Clamps a raw attribute value to the valid [1, 20] range.
 */
export function applyAttributeCap(value: number): number {
  return Math.max(ATTR_MIN, Math.min(ATTR_MAX, value))
}

/**
 * Calculates the integer growth delta (0, 1, or 2) for a single attribute.
 *
 * Design decisions (not in spec, justified here for review):
 * - Base probability of growing scales with potential (0–100 → 0–1 fraction).
 * - A proximity penalty reduces that probability as attr approaches the cap:
 *   penalty = attr / ATTR_MAX (attr=20 → 0% chance, attr=1 → ~5% boost kept).
 * - If growth fires, a second roll decides delta=1 vs delta=2:
 *   prob(delta=2) = potential / 200  (max 50% when potential=100).
 */
export function calculateAttributeGrowth(
  attr: number,
  potential: number,
  rng: () => number,
): number {
  const proximityPenalty = attr / ATTR_MAX
  const growthChance = (potential / 100) * (1 - proximityPenalty)

  if (rng() >= growthChance) return 0

  const bigGrowthChance = potential / 200
  return rng() < bigGrowthChance ? 2 : 1
}

/**
 * Role-specific training bonus targets.
 * Each role lists the two attributes that receive the bonus from focused training.
 * Source: task spec ("TOP ganha +laning/resilience", etc.)
 */
const ROLE_TRAINING_ATTRS: Record<Role, [keyof PlayerAttributes, keyof PlayerAttributes]> = {
  TOP: ['laning', 'resilience'],
  JUNGLE: ['gameSense', 'mechanics'],
  MID: ['metaAdaptation', 'mechanics'],
  ADC: ['consistency', 'mechanics'],
  SUPPORT: ['shotcalling', 'gameSense'],
}

/**
 * Returns a new PlayerAttributes object with training bonuses applied.
 *
 * @param attributes - current attributes
 * @param role       - determines which two attributes benefit
 * @param intensity  - training intensity in [0, 1]; max bonus is +1 per attribute
 */
export function applyTrainingBonus(
  attributes: PlayerAttributes,
  role: Role,
  intensity: number,
): PlayerAttributes {
  const [attrA, attrB] = ROLE_TRAINING_ATTRS[role]
  const clampedIntensity = Math.max(0, Math.min(1, intensity))
  const bonus = Math.round(clampedIntensity * 1)

  return {
    ...attributes,
    [attrA]: applyAttributeCap(attributes[attrA] + bonus),
    [attrB]: applyAttributeCap(attributes[attrB] + bonus),
  }
}
