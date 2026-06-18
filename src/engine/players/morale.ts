/**
 * Morale, stamina, and decay functions.
 * All functions are pure and immutable — they return a new Player.
 */

import type { Player } from '@types-app/index'

function clampMorale(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function clampStamina(value: number): number {
  return Math.max(0, Math.min(100, value))
}

/**
 * Weekly morale decay: -1 morale per week during the competitive season.
 * Minimum: 0.
 */
export function applyMoraleDecay(player: Player): Player {
  return { ...player, morale: clampMorale(player.morale - 1) }
}

/**
 * Win bonus: +3 morale after a victory. Maximum: 100.
 */
export function applyWinBonus(player: Player): Player {
  return { ...player, morale: clampMorale(player.morale + 3) }
}

/**
 * Loss penalty: -2 morale after a defeat. Minimum: 0.
 */
export function applyLossPenalty(player: Player): Player {
  return { ...player, morale: clampMorale(player.morale - 2) }
}

/**
 * Adjusts morale based on stamina level.
 * stamina < 30  → -5 morale
 * stamina > 80  → +1 morale
 */
export function applyMoraleFromStamina(player: Player): Player {
  if (player.stamina < 30) {
    return { ...player, morale: clampMorale(player.morale - 5) }
  }
  if (player.stamina > 80) {
    return { ...player, morale: clampMorale(player.morale + 1) }
  }
  return player
}

/**
 * Recovers stamina based on the current calendar phase.
 * offseason: +5 stamina per week
 * regular season (no games scheduled): +2 stamina per week
 * Capped at 100.
 *
 * Design decision: this single function handles both cases via the `phase`
 * parameter because the spec doesn't define a separate function per phase.
 * Callers pass 'offseason' or 'regular' according to the calendar state.
 */
export function recoverStamina(
  player: Player,
  phase: 'offseason' | 'regular' = 'regular',
): Player {
  const recovery = phase === 'offseason' ? 5 : 2
  return { ...player, stamina: clampStamina(player.stamina + recovery) }
}
