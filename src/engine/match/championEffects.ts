/**
 * championEffects.ts — matchup counter modifier and champion scaling modifier.
 *
 * Source of truth: docs/simulacao_e_draft.md, section 2.
 *
 * This module is purely deterministic — no randomness, no side-effects, no
 * mutation of arguments. It has zero imports from React, Zustand, Dexie or PixiJS.
 *
 * ─── Design notes ──────────────────────────────────────────────────────────────
 *
 * 1. calculateMatchupModifier / calculateMatchupModifierDetailed
 *    The document defines ModMatchup as an ADDITIVE delta, not a multiplicative
 *    modifier. The formula produces a value in [-3, +3] that is summed directly
 *    into LaneScore (see section 2 and section 3 of simulacao_e_draft.md).
 *    The task prompt describes it loosely as "próximo de 1.0", but the authoritative
 *    source (the document) is unambiguous: it is additive. The return type is
 *    therefore a number in [-3, +3], not a ratio around 1.0.
 *
 * 2. getScalingModifier
 *    Section 2 defines ModEscala as a lookup table over three discrete phase
 *    checkpoints (Laning / Macro / Teamfight), not a continuous function of
 *    gameMinute. Since the public signature receives a gameMinute integer, we
 *    derive the phase from it using the conventional LoL timing boundaries:
 *      early  (Laning)    : minute  0–14
 *      mid    (Macro)     : minute 15–24
 *      late   (Teamfight) : minute 25+
 *    The exact table values (1.15 / 1.00 / 0.85 / 0.95 / 1.05 / 1.00 / 0.85 /
 *    0.95 / 1.20) come verbatim from the document.
 *
 * 3. getScalingModifierForPhase
 *    Exported separately so laningPhase.ts, midGamePhase.ts and teamfightPhase.ts
 *    can look up ModEscala without having to invent a representative minute — they
 *    already know which phase they are computing.
 */

import type { Champion, ScalingCurve } from '@types-app/index'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * The three discrete game phases that correspond to the ModEscala checkpoints
 * in docs/simulacao_e_draft.md section 2.
 */
export type GamePhase = 'laning' | 'macro' | 'teamfight'

/**
 * Breakdown of every component that makes up the matchup modifier.
 * Useful for unit tests and debug tooling.
 */
export interface MatchupModifierBreakdown {
  /** 0.5 × (range_A − range_B) */
  rangeAdvantage: number
  /** 0.7 × (earlyPower_A − earlyPower_B) */
  earlyPowerDelta: number
  /** 0.4 × (sustain_A − sustain_B) */
  sustainDelta: number
  /** 0.3 × (mobility_A − mobility_B) */
  mobilityDelta: number
  /**
   * Sum of the four components, clamped to [-3, +3].
   * This value is added directly to LaneScore — it is not a ratio around 1.0.
   */
  total: number
}

// ---------------------------------------------------------------------------
// Internal constants — every magic number is sourced from section 2 of the doc
// ---------------------------------------------------------------------------

/** Weights from the ModMatchup formula in section 2. */
const MATCHUP_WEIGHTS = {
  range: 0.5,
  earlyPower: 0.7,
  sustain: 0.4,
  mobility: 0.3,
} as const

/** Clamp bounds stated in section 2: "Resultado limitado entre -3 e +3". */
const MATCHUP_MIN = -3
const MATCHUP_MAX = 3

/**
 * ModEscala lookup table — verbatim from section 2 of simulacao_e_draft.md.
 *
 *   Curva   | Laning | Macro  | Teamfight
 *   Early   | ×1.15  | ×1.00  | ×0.85
 *   Mid     | ×0.95  | ×1.05  | ×1.00
 *   Late    | ×0.85  | ×0.95  | ×1.20
 */
const SCALING_TABLE: Record<ScalingCurve, Record<GamePhase, number>> = {
  early: { laning: 1.15, macro: 1.00, teamfight: 0.85 },
  mid:   { laning: 0.95, macro: 1.05, teamfight: 1.00 },
  late:  { laning: 0.85, macro: 0.95, teamfight: 1.20 },
}

/**
 * Conventional LoL timing boundaries used to map a game minute to a phase.
 * The document does not specify these minute thresholds; they are a derivation
 * decision made here to satisfy the gameMinute-based signature while honouring
 * the three-checkpoint model from the document.
 *
 * These constants are intentionally exported so tests can reference the same
 * values without duplicating them.
 */
export const PHASE_BOUNDARY_MID_START = 15   // minute 15 → macro/mid phase begins
export const PHASE_BOUNDARY_LATE_START = 25  // minute 25 → teamfight/late phase begins

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Maps a game minute (integer ≥ 0) to one of the three document-defined phases.
 * Derivation decision — see module-level comment point 2.
 */
function minuteToPhase(gameMinute: number): GamePhase {
  if (gameMinute < PHASE_BOUNDARY_MID_START) return 'laning'
  if (gameMinute < PHASE_BOUNDARY_LATE_START) return 'macro'
  return 'teamfight'
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates the matchup (counter) modifier of `attacker` against `defender`,
 * returning a detailed breakdown of every component.
 *
 * Formula (section 2 of simulacao_e_draft.md):
 *   ModMatchup = 0.5×(range_A − range_B)
 *              + 0.7×(earlyPower_A − earlyPower_B)
 *              + 0.4×(sustain_A − sustain_B)
 *              + 0.3×(mobility_A − mobility_B)
 *
 * Result clamped to [-3, +3].
 *
 * Note: this is an ADDITIVE value applied to LaneScore, not a multiplicative ratio.
 */
export function calculateMatchupModifierDetailed(
  attacker: Champion,
  defender: Champion,
): MatchupModifierBreakdown {
  const rangeAdvantage  = MATCHUP_WEIGHTS.range      * (attacker.range      - defender.range)
  const earlyPowerDelta = MATCHUP_WEIGHTS.earlyPower * (attacker.earlyPower - defender.earlyPower)
  const sustainDelta    = MATCHUP_WEIGHTS.sustain    * (attacker.sustain    - defender.sustain)
  const mobilityDelta   = MATCHUP_WEIGHTS.mobility   * (attacker.mobility   - defender.mobility)

  const raw   = rangeAdvantage + earlyPowerDelta + sustainDelta + mobilityDelta
  const total = clamp(raw, MATCHUP_MIN, MATCHUP_MAX)

  return { rangeAdvantage, earlyPowerDelta, sustainDelta, mobilityDelta, total }
}

/**
 * Calculates the matchup (counter) modifier of `attacker` against `defender`,
 * returning only the final clamped value in [-3, +3].
 *
 * This is the value added directly to `LaneScore` during the Laning phase
 * (see simulacao_e_draft.md section 3).
 *
 * Deterministic — pure function of the two champion objects.
 */
export function calculateMatchupModifier(
  attacker: Champion,
  defender: Champion,
): number {
  return calculateMatchupModifierDetailed(attacker, defender).total
}

/**
 * Returns the ModEscala multiplier for `champion` at the given `gameMinute`.
 *
 * The minute is mapped to a phase using `minuteToPhase`, then the value is
 * read from the lookup table in section 2 of simulacao_e_draft.md.
 *
 * Result is one of the nine table values: 0.85 / 0.95 / 1.00 / 1.05 / 1.15 / 1.20.
 *
 * Deterministic — pure function with no randomness.
 *
 * @param champion   - The champion whose scaling curve is evaluated.
 * @param gameMinute - Integer representing the current game minute (0–60+).
 */
export function getScalingModifier(champion: Champion, gameMinute: number): number {
  const phase = minuteToPhase(gameMinute)
  return SCALING_TABLE[champion.scalingCurve][phase]
}

/**
 * Returns the ModEscala multiplier for `champion` for an explicitly named phase.
 *
 * Preferred over `getScalingModifier` when the caller already knows the phase
 * (e.g. inside laningPhase.ts, midGamePhase.ts, teamfightPhase.ts) because it
 * avoids the minute-to-phase mapping entirely.
 *
 * @param champion - The champion whose scaling curve is evaluated.
 * @param phase    - The explicit game phase checkpoint.
 */
export function getScalingModifierForPhase(champion: Champion, phase: GamePhase): number {
  return SCALING_TABLE[champion.scalingCurve][phase]
}
