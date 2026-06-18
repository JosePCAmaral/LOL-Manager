/**
 * midGamePhase.ts — Phase 2 simulation: Macro/Mid Game.
 *
 * Source of truth: docs/simulacao_e_draft.md, sections 2 and 4.
 *
 * Design decisions made independently (not in the doc) and flagged for human review:
 * - LaneLeadBonus: the doc says "derivado dos laneResults" but gives no formula.
 *   Implementation: sum of (blueScore - redScore) across all lanes × 0.05, so a
 *   team that won all lanes hard gets ~+1 to MacroScore. Calibration placeholder.
 * - CompEngageBonus: the doc mentions "baseado em compTags.engage da composição" but
 *   gives no formula or weight. Implementation: avg(engage) across 5 champions × 0.1,
 *   additive to MacroScore. Calibration placeholder.
 * - Objectives per side: derived from MacroScore difference using a logistic-like
 *   mapping. Not specified in the doc.
 * - MID_GAME_NOISE = 1.5 — not specified in the doc.
 * - Gold per objective = 300 — standard LoL dragon/herald value as placeholder.
 *
 * All formulas from section 4 are implemented exactly:
 *   MacroScore_time = Σ(score × weight × ModEscala) × BonusIGL
 *   BonusIGL = 1 + (Shotcalling_IGL / 20) × 0.15
 */

import type { Player, Champion, Role } from '@types-app/index'
import type { SeededRng } from '../../core/rng'
import { getScalingModifierForPhase } from '../championEffects'
import type { LaneResult } from './laningPhase'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface MidGameResult {
  blueObjectives: number
  redObjectives: number
  blueGoldLead: number
  redGoldLead: number
  winner: 'blue' | 'red' | 'draw'
  blueMacroScore: number
  redMacroScore: number
}

// ---------------------------------------------------------------------------
// Constants — values from section 4 of simulacao_e_draft.md
// ---------------------------------------------------------------------------

/**
 * Attribute weights and role weights for the Macro phase — verbatim from section 4.
 *
 * Formula per role:
 *   JUNGLE:  GameSense×0.6 + Shotcalling×0.4  (weight 30%)
 *   SUPPORT: GameSense×0.7 + Shotcalling×0.3  (weight 25%)
 *   MID:     GameSense×0.6 + Shotcalling×0.4  (weight 20%)
 *   TOP:     GameSense                          (weight 15%)
 *   ADC:     GameSense                          (weight 10%)
 */
const MACRO_ATTR_WEIGHTS: Record<Role, { gameSense: number; shotcalling: number }> = {
  JUNGLE:  { gameSense: 0.6, shotcalling: 0.4 },
  SUPPORT: { gameSense: 0.7, shotcalling: 0.3 },
  MID:     { gameSense: 0.6, shotcalling: 0.4 },
  TOP:     { gameSense: 1.0, shotcalling: 0.0 },
  ADC:     { gameSense: 1.0, shotcalling: 0.0 },
}

const MACRO_ROLE_WEIGHTS: Record<Role, number> = {
  JUNGLE:  0.30,
  SUPPORT: 0.25,
  MID:     0.20,
  TOP:     0.15,
  ADC:     0.10,
}

const ROLE_ORDER: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

/**
 * BonusIGL max contribution factor — verbatim from section 4.
 *   BonusIGL = 1 + (Shotcalling_IGL / 20) × 0.15
 */
const IGL_BONUS_FACTOR = 0.15  // section 4

// ---------------------------------------------------------------------------
// Section 1 modifiers (shared helpers)
// ---------------------------------------------------------------------------

/** ModForma — section 1: 0.85 + (morale/100)×0.30, range [0.85, 1.15] */
function getModForma(player: Player): number {
  return 0.85 + (player.morale / 100) * 0.30
}

/** ModStamina — section 1: 0.70 + (stamina/100)×0.30, range [0.70, 1.00] */
function getModStamina(player: Player): number {
  return 0.70 + (player.stamina / 100) * 0.30
}

/** VarMax — section 1: 0.30 - (consistency/20)×0.20 */
function getVarMax(player: Player): number {
  return 0.30 - (player.attributes.consistency / 20) * 0.20
}

/** Variancia — section 1: (rng()-0.5)×2×VarMax, centred on zero */
function computeVariancia(player: Player, rng: SeededRng): number {
  return (rng() - 0.5) * 2 * getVarMax(player)
}

/**
 * Gold awarded per objective captured — DESIGN DECISION, not in the doc.
 * 300 approximates a dragon/herald bounty.
 */
const GOLD_PER_OBJECTIVE = 300

/**
 * Max total objectives available per side during mid game — DESIGN DECISION.
 */
const MAX_OBJECTIVES = 4

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Computes the IGL bonus multiplier.
 * IGL = player with highest shotcalling.
 * Formula from section 4: BonusIGL = 1 + (Shotcalling_IGL / 20) × 0.15
 */
function computeBonusIGL(players: Player[]): number {
  const maxShotcalling = Math.max(...players.map(p => p.attributes.shotcalling))
  return 1 + (maxShotcalling / 20) * IGL_BONUS_FACTOR
}

/**
 * Computes the CompEngageBonus for a set of champions.
 * DESIGN DECISION — not in the doc: avg(engage) × 0.1 (additive).
 */
function computeCompEngageBonus(champions: Champion[]): number {
  const avgEngage = champions.reduce((s, c) => s + c.compTags.engage, 0) / champions.length
  return avgEngage * 0.1
}

/**
 * Computes LaneLeadBonus from the laning results for a given side.
 * DESIGN DECISION — not in the doc: sum of per-lane score differences × 0.05.
 */
function computeLaneLeadBonus(laneResults: LaneResult[], side: 'blue' | 'red'): number {
  const total = laneResults.reduce((sum, r) => {
    const diff = side === 'blue' ? (r.blueScore - r.redScore) : (r.redScore - r.blueScore)
    return sum + diff
  }, 0)
  return total * 0.05
}

/**
 * Distributes objectives between sides based on MacroScore difference.
 * DESIGN DECISION — not in the doc.
 * Stronger macro side gets proportionally more objectives (min 0, max MAX_OBJECTIVES each).
 */
function distributeObjectives(
  blueScore: number,
  redScore: number,
  rng: SeededRng,
): [number, number] {
  const total = MAX_OBJECTIVES * 2
  const blueShare = blueScore / (blueScore + redScore + 0.001)
  const blueObj  = Math.round(blueShare * total + (rng() - 0.5) * 1.5)
  const clamped  = Math.max(0, Math.min(MAX_OBJECTIVES, blueObj))
  const redObj   = Math.max(0, total - clamped - Math.round(rng() * 1.5))
  return [clamped, Math.min(MAX_OBJECTIVES, redObj)]
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates the MacroScore for a team.
 *
 * Formula from section 4:
 *   MacroScore_time = Σ(score_papel × peso × ModEscala) × BonusIGL + LaneLeadBonus + CompEngageBonus
 *
 * BonusIGL = 1 + (Shotcalling_IGL / 20) × 0.15
 */
/**
 * Calculates the MacroScore for a team (public API, deterministic — no rng).
 *
 * C-5 fix: delegates to computeSideMacroScore using 'blue' side by default.
 * The caller should pass laneResults that represent this team's side perspective.
 * ModForma, ModStamina, and LaneLeadBonus are all applied correctly.
 *
 * Formula from section 4:
 *   MacroScore_time = Σ(score_papel × ModForma × ModStamina × peso × ModEscala) × BonusIGL
 *                   + LaneLeadBonus + CompEngageBonus
 */
export function calculateTeamMacroScore(
  players: Player[],
  champions: Champion[],
  laneResults: LaneResult[],
  _rng: SeededRng,
  side: 'blue' | 'red' = 'blue',
): number {
  return computeSideMacroScore(players, champions, laneResults, side)
}

/**
 * Simulates the mid game phase for both teams.
 */
export function simulateMidGame(
  bluePlayers: Player[],
  blueChampions: Champion[],
  redPlayers: Player[],
  redChampions: Champion[],
  laneResults: LaneResult[],
  rng: SeededRng,
): MidGameResult {
  // Compute MacroScore per side using full formula
  let blueMacroScore = computeSideMacroScore(bluePlayers, blueChampions, laneResults, 'blue')
  let redMacroScore  = computeSideMacroScore(redPlayers,  redChampions,  laneResults, 'red')

  // Variancia per player (section 1) — summed contribution to team score
  for (const player of bluePlayers) {
    blueMacroScore += computeVariancia(player, rng) * MACRO_ROLE_WEIGHTS[player.role]
  }
  for (const player of redPlayers) {
    redMacroScore += computeVariancia(player, rng) * MACRO_ROLE_WEIGHTS[player.role]
  }

  const [blueObjectives, redObjectives] = distributeObjectives(blueMacroScore, redMacroScore, rng)

  const blueGoldLead = blueObjectives * GOLD_PER_OBJECTIVE
  const redGoldLead  = redObjectives  * GOLD_PER_OBJECTIVE

  const diff = blueMacroScore - redMacroScore
  let winner: 'blue' | 'red' | 'draw'
  if (diff > 0.5) {
    winner = 'blue'
  } else if (diff < -0.5) {
    winner = 'red'
  } else {
    winner = 'draw'
  }

  return {
    blueObjectives,
    redObjectives,
    blueGoldLead,
    redGoldLead,
    winner,
    blueMacroScore,
    redMacroScore,
  }
}

/**
 * Internal helper that computes a side's MacroScore with proper LaneLeadBonus.
 * Applies ModForma and ModStamina per player (section 1 modifiers).
 * Variancia is NOT applied here — it is added per player in simulateMidGame.
 */
function computeSideMacroScore(
  players: Player[],
  champions: Champion[],
  laneResults: LaneResult[],
  side: 'blue' | 'red',
): number {
  let weightedSum = 0

  for (let i = 0; i < ROLE_ORDER.length; i++) {
    const player    = players[i]
    const champion  = champions[i]
    const role      = ROLE_ORDER[i]
    const w         = MACRO_ATTR_WEIGHTS[role]
    // Section 1: apply ModForma and ModStamina to each player's base score
    const modForma   = getModForma(player)
    const modStamina = getModStamina(player)
    const baseScore  = player.attributes.gameSense * w.gameSense + player.attributes.shotcalling * w.shotcalling
    const modEscala  = getScalingModifierForPhase(champion, 'macro')
    weightedSum     += baseScore * modForma * modStamina * MACRO_ROLE_WEIGHTS[role] * modEscala
  }

  const bonusIGL        = computeBonusIGL(players)
  const laneLeadBonus   = computeLaneLeadBonus(laneResults, side)
  const compEngageBonus = computeCompEngageBonus(champions)

  return weightedSum * bonusIGL + laneLeadBonus + compEngageBonus
}
