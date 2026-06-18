/**
 * teamfightPhase.ts — Phase 3 simulation: Teamfight / Late Game.
 *
 * Source of truth: docs/simulacao_e_draft.md, sections 2 and 5.
 *
 * Design decisions made independently and flagged for human review:
 * - N_TEAMFIGHTS = 5 — the doc says "simula N teamfights" but does not specify N.
 *   5 fights is a reasonable late-game simulation count.
 * - CompCCBonus = avg(ccChain + peel) × 0.08 (additive) — the doc references
 *   "compTags.ccChain + compTags.peel" but gives no weight or formula for the bonus.
 * - Gold lead bonus: each 100 gold advantage from midGame adds 0.02 to TeamfightScore.
 *   Not in the doc; chosen so a decisive mid game (e.g. 4 objectives vs 0) gives ~+2.4
 *   to the leading team's score (within the ~0-20 range of attribute scores).
 * - TEAMFIGHT_NOISE = 1.5 — not specified in the doc.
 * - damageDealt: scaled from score×50 as a display-only number.
 *
 * All formulas from section 5 are implemented exactly:
 *   TeamfightScore_time = Σ(score×weight×ModEscala) × ModSinergia
 *   ModSinergia = 1 + (SinergiaMédia/100) × 0.10
 *   SinergiaMédia = average of player.attributes.synergy across the 5 players.
 */

import type { Player, Champion, Role } from '@types-app/index'
import type { SeededRng } from '../../core/rng'
import { getScalingModifierForPhase } from '../championEffects'
import type { MidGameResult } from './midGamePhase'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface TeamfightResult {
  blueWins: number
  redWins: number
  winner: 'blue' | 'red' | 'draw'
  damageDealt: { blue: number; red: number }
  blueTeamfightScore: number
  redTeamfightScore: number
}

// ---------------------------------------------------------------------------
// Constants — verbatim from section 5
// ---------------------------------------------------------------------------

/**
 * Attribute weights and role weights for the Teamfight phase — verbatim from section 5.
 *
 *   ADC:     Teamfight×0.6 + Mecânica×0.4  (weight 25%)
 *   JUNGLE:  Teamfight×0.5 + Mecânica×0.5  (weight 20%)
 *   MID:     Teamfight×0.5 + Mecânica×0.5  (weight 20%)
 *   SUPPORT: Teamfight×0.6 + Mecânica×0.4  (weight 20%)
 *   TOP:     Teamfight×0.5 + Mecânica×0.5  (weight 15%)
 */
const TF_ATTR_WEIGHTS: Record<Role, { teamfight: number; mechanics: number }> = {
  ADC:     { teamfight: 0.6, mechanics: 0.4 },
  JUNGLE:  { teamfight: 0.5, mechanics: 0.5 },
  MID:     { teamfight: 0.5, mechanics: 0.5 },
  SUPPORT: { teamfight: 0.6, mechanics: 0.4 },
  TOP:     { teamfight: 0.5, mechanics: 0.5 },
}

const TF_ROLE_WEIGHTS: Record<Role, number> = {
  ADC:     0.25,
  JUNGLE:  0.20,
  MID:     0.20,
  SUPPORT: 0.20,
  TOP:     0.15,
}

const ROLE_ORDER: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

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
 * ModSinergia factor — verbatim from section 5.
 * ModSinergia = 1 + (SinergiaMédia/100) × 0.10
 * Player entity has no synergy field, so SinergiaMédia = 0 → ModSinergia = 1.0.
 */
const SYNERGY_FACTOR = 0.10  // section 5

/**
 * Number of teamfights simulated — DESIGN DECISION, not in the doc.
 */
const N_TEAMFIGHTS = 5

/**
 * Gold lead from mid game contributes a bonus per 100 gold — DESIGN DECISION.
 */
const GOLD_LEAD_BONUS_PER_100 = 0.02

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * CompCCBonus based on ccChain and peel composition tags.
 * DESIGN DECISION — not specified in the doc beyond "compTags.ccChain + compTags.peel".
 */
function computeCompCCBonus(champions: Champion[]): number {
  const avg = champions.reduce((s, c) => s + c.compTags.ccChain + c.compTags.peel, 0) / champions.length
  return avg * 0.08
}

/**
 * ModSinergia — section 5.
 * SinergiaMédia = average of player.attributes.synergy (0–100).
 */
function computeModSinergia(players: Player[]): number {
  const synergyAvg = players.length > 0
    ? players.reduce((sum, p) => sum + (p.attributes.synergy ?? 0), 0) / players.length
    : 0
  return 1 + (synergyAvg / 100) * SYNERGY_FACTOR
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates the TeamfightScore for a team.
 *
 * Formula from section 5:
 *   TeamfightScore_time = Σ(score_papel × peso × ModEscala) × ModSinergia
 *   + CompCCBonus   (additive — design decision)
 */
export function calculateTeamfightScore(
  players: Player[],
  champions: Champion[],
  _rng?: SeededRng,
): number {
  let weightedSum = 0

  for (let i = 0; i < ROLE_ORDER.length; i++) {
    const player     = players[i]
    const champion   = champions[i]
    const role       = ROLE_ORDER[i]
    const w          = TF_ATTR_WEIGHTS[role]
    // Section 1: apply ModForma and ModStamina to each player's base score
    const modForma   = getModForma(player)
    const modStamina = getModStamina(player)
    const baseScore  = player.attributes.teamfight * w.teamfight + player.attributes.mechanics * w.mechanics
    const modEscala  = getScalingModifierForPhase(champion, 'teamfight')
    weightedSum     += baseScore * modForma * modStamina * TF_ROLE_WEIGHTS[role] * modEscala
  }

  const modSinergia  = computeModSinergia(players)
  const compCCBonus  = computeCompCCBonus(champions)

  return weightedSum * modSinergia + compCCBonus
}

/**
 * Simulates the teamfight phase.
 * Uses the gold lead from midGameResult as a bonus to the leading team's score.
 */
export function simulateTeamfights(
  bluePlayers: Player[],
  blueChampions: Champion[],
  redPlayers: Player[],
  redChampions: Champion[],
  midGameResult: MidGameResult,
  rng: SeededRng,
): TeamfightResult {
  const baseBlueTF = calculateTeamfightScore(bluePlayers, blueChampions)
  const baseRedTF  = calculateTeamfightScore(redPlayers,  redChampions)

  // Apply gold lead bonus from mid game — DESIGN DECISION
  const blueGoldBonus = (midGameResult.blueGoldLead / 100) * GOLD_LEAD_BONUS_PER_100
  const redGoldBonus  = (midGameResult.redGoldLead  / 100) * GOLD_LEAD_BONUS_PER_100

  let blueWins = 0
  let redWins  = 0

  for (let i = 0; i < N_TEAMFIGHTS; i++) {
    // Variancia per player (section 1) summed with role weight, centred on zero
    const blueVariancia = bluePlayers.reduce(
      (sum, p) => sum + computeVariancia(p, rng) * TF_ROLE_WEIGHTS[p.role], 0
    )
    const redVariancia  = redPlayers.reduce(
      (sum, p) => sum + computeVariancia(p, rng) * TF_ROLE_WEIGHTS[p.role], 0
    )
    const blueRoll = baseBlueTF + blueGoldBonus + blueVariancia
    const redRoll  = baseRedTF  + redGoldBonus  + redVariancia

    if (blueRoll > redRoll) {
      blueWins++
    } else if (redRoll > blueRoll) {
      redWins++
    }
    // exact tie: no winner counted (very unlikely with float noise)
  }

  let winner: 'blue' | 'red' | 'draw'
  if (blueWins > redWins) {
    winner = 'blue'
  } else if (redWins > blueWins) {
    winner = 'red'
  } else {
    winner = 'draw'
  }

  // damageDealt: display-only value — DESIGN DECISION
  const damageDealt = {
    blue: Math.round(baseBlueTF * 50 + blueWins * 500),
    red:  Math.round(baseRedTF  * 50 + redWins  * 500),
  }

  return {
    blueWins,
    redWins,
    winner,
    damageDealt,
    blueTeamfightScore: baseBlueTF + blueGoldBonus,
    redTeamfightScore:  baseRedTF  + redGoldBonus,
  }
}
