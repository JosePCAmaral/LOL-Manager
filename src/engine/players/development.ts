/**
 * Player annual development: attribute growth, aging, burnout.
 * All randomness passes through the rng parameter.
 */

import type { Player, PlayerAttributes } from '@types-app/index'
import { calculateAttributeGrowth, applyAttributeCap } from './attributes'
import { randomInt } from '../core/rng'

type AttrKey = keyof PlayerAttributes

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

/** Age at which potential starts degrading. Source: task spec ("26+ anos"). */
const AGING_THRESHOLD = 26

/**
 * Applies annual development to a player (immutable).
 * - Each attribute may grow by 0–2 based on potential.
 * - Age increments by 1.
 * - Players 26+ may lose 0–1 potential point.
 */
export function developPlayer(player: Player, rng: () => number): Player {
  const newAttributes = { ...player.attributes }

  for (const attr of ALL_ATTRS) {
    const delta = calculateAttributeGrowth(newAttributes[attr], player.potential, rng)
    newAttributes[attr] = applyAttributeCap(newAttributes[attr] + delta)
  }

  const newAge = player.age + 1

  // Potential decay for veterans (spec: "reduz potential em 0–1 se o jogador já tem 26+ anos")
  let newPotential = player.potential
  if (newAge >= AGING_THRESHOLD) {
    const decay = randomInt(rng, 0, 1)
    newPotential = Math.max(0, player.potential - decay)
  }

  return {
    ...player,
    attributes: newAttributes,
    age: newAge,
    potential: newPotential,
  }
}

/**
 * Calculates burnout risk score for the current state.
 * Formula (from task spec): burnoutRisk + (100 - stamina) * 0.3 - morale * 0.1, clamped [0, 100].
 */
export function calculateBurnoutRisk(player: Player): number {
  const raw = player.burnoutRisk + (100 - player.stamina) * 0.3 - player.morale * 0.1
  return Math.max(0, Math.min(100, raw))
}

/**
 * Applies burnout effects when the player is at high risk.
 * Spec: if burnoutRisk > 70 AND rng() < (burnoutRisk - 70) / 100,
 * reduce all attributes by 1–2 and raise burnoutRisk by 5.
 */
export function applyBurnout(player: Player, rng: () => number): Player {
  if (player.burnoutRisk <= 70) return player

  const triggerChance = (player.burnoutRisk - 70) / 100
  if (rng() >= triggerChance) return player

  const reduction = randomInt(rng, 1, 2)
  const newAttributes = { ...player.attributes }
  for (const attr of ALL_ATTRS) {
    newAttributes[attr] = applyAttributeCap(newAttributes[attr] - reduction)
  }

  return {
    ...player,
    attributes: newAttributes,
    burnoutRisk: Math.min(100, player.burnoutRisk + 5),
  }
}
