/**
 * laningPhase.ts — Phase 1 simulation: Laning.
 *
 * Source of truth: docs/simulacao_e_draft.md, sections 2 and 3.
 *
 * Design decisions made independently (not in the doc) and flagged for human review:
 * - LANING_NOISE = 2.0 — the doc says "adiciona ruído: score += rng() * LANING_NOISE"
 *   but does not specify the exact value. 2.0 was chosen so noise is meaningful relative
 *   to the score range (~0–20) without overwhelming skill differences.
 * - DRAW_THRESHOLD = 1.0 — margin below which both sides are considered tied.
 *   Not stated in the doc; chosen as half of max noise to reflect a genuinely close lane.
 * - goldDiff formula: (blueScore - redScore) * 15 — the doc says laning determines
 *   "who arrives at mid game with gold/XP advantage" but gives no gold formula.
 *   15 gold-per-score-point is a calibration placeholder for playtesting.
 * - gameMinute=10 passed to getScalingModifierForPhase via 'laning' phase — consistent
 *   with the doc stating "checkpoint = early" for this phase.
 *
 * All numbers from the document are applied exactly. Role weights and attribute
 * formulas come verbatim from section 3.
 */

import type { Player, Champion, Role } from '@types-app/index'
import type { SeededRng } from '../../core/rng'
import {
  calculateMatchupModifier,
  getScalingModifierForPhase,
} from '../championEffects'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface LaneResult {
  role: Role
  blueScore: number
  redScore: number
  winner: 'blue' | 'red' | 'draw'
  goldDiff: number  // positive = blue ahead
}

// ---------------------------------------------------------------------------
// Constants — values from section 3 of simulacao_e_draft.md
// ---------------------------------------------------------------------------

/**
 * Attribute weights per role in the Laning phase — verbatim from section 3.
 * Each entry: [W_mechanics, W_laning, W_gameSense]
 * Only mechanics+laning or mechanics+gameSense are used per role.
 */
const LANING_ATTR_WEIGHTS: Record<Role, { mechanics: number; laning: number; gameSense: number }> = {
  TOP:     { mechanics: 0.4, laning: 0.6, gameSense: 0.0 },  // section 3: Mecânica×0.4 + Laning×0.6
  MID:     { mechanics: 0.4, laning: 0.6, gameSense: 0.0 },  // section 3: Mecânica×0.4 + Laning×0.6
  ADC:     { mechanics: 0.4, laning: 0.6, gameSense: 0.0 },  // section 3: Mecânica×0.4 + Laning×0.6
  SUPPORT: { mechanics: 0.3, laning: 0.7, gameSense: 0.0 },  // section 3: Mecânica×0.3 + Laning×0.7
  JUNGLE:  { mechanics: 0.5, laning: 0.0, gameSense: 0.5 },  // section 3: Mecânica×0.5 + GameSense×0.5
}

/**
 * Role weights within the Laning phase score — verbatim from section 3.
 * Used for LaningScore_time = Σ(LaneScore_papel × peso do papel).
 */
const LANING_ROLE_WEIGHTS: Record<Role, number> = {
  TOP:     0.20,  // section 3: Topo 20%
  MID:     0.25,  // section 3: Meio 25%
  ADC:     0.20,  // section 3: Atirador 20%
  SUPPORT: 0.15,  // section 3: Suporte 15%
  JUNGLE:  0.20,  // section 3: Caçador 20%
}

/** Role order by index (0=TOP, 1=JGL, 2=MID, 3=ADC, 4=SUP) */
const ROLE_ORDER: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

/**
 * Score margin below which a lane result is considered a draw.
 * DESIGN DECISION — not in the doc: chosen as 1.0 (half of max noise).
 */
const DRAW_THRESHOLD = 1.0

/**
 * Gold per score-point difference — scales the goldDiff output.
 * DESIGN DECISION — not in the doc: 15 gold/point as a starting calibration.
 */
const GOLD_PER_SCORE_POINT = 15

// ---------------------------------------------------------------------------
// Section 1 modifiers — simulacao_e_draft.md
// ---------------------------------------------------------------------------

/**
 * ModMaestria — section 1.
 * Formula: 0.8 + (maestria - 1) / 19 × 0.3
 * Range: [0.8, 1.1]. Defaults to maestria=1 when champion not in pool.
 */
function getModMaestria(player: Player, championId: string): number {
  const entry = player.championPool.find(c => c.championId === championId)
  const maestria = entry ? entry.masteryLevel : 1
  return 0.8 + ((maestria - 1) / 19) * 0.3
}

/**
 * ModForma — section 1.
 * Formula: 0.85 + (morale / 100) × 0.30
 * Range: [0.85, 1.15].
 */
function getModForma(player: Player): number {
  return 0.85 + (player.morale / 100) * 0.30
}

/**
 * ModStamina — section 1.
 * Formula: 0.70 + (stamina / 100) × 0.30
 * Range: [0.70, 1.00].
 */
function getModStamina(player: Player): number {
  return 0.70 + (player.stamina / 100) * 0.30
}

/**
 * VarMax — section 1.
 * Formula: 0.30 - (consistency / 20) × 0.20
 * Range: [0.10, 0.30] (consistency 20 → 0.10; consistency 1 → ~0.29).
 */
function getVarMax(player: Player): number {
  return 0.30 - (player.attributes.consistency / 20) * 0.20
}

/**
 * Variancia — section 1.
 * Formula: (rng() - 0.5) × 2 × VarMax  (centred on zero, additive)
 */
export function computeVariancia(player: Player, rng: SeededRng): number {
  return (rng() - 0.5) * 2 * getVarMax(player)
}

// ---------------------------------------------------------------------------
// Base score for a role in laning
// ---------------------------------------------------------------------------

/**
 * Computes the raw (pre-modifier) attribute score for a player in the laning phase,
 * using role-specific weights from section 3.
 */
function computeBaseScore(player: Player): number {
  const w = LANING_ATTR_WEIGHTS[player.role]
  return (
    player.attributes.mechanics * w.mechanics +
    player.attributes.laning    * w.laning    +
    player.attributes.gameSense * w.gameSense
  )
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates the LaneScore for one player on one side of a lane.
 *
 * Formula from section 3:
 *   LaneScore_papel = (ScoreBaseDoJogador × ModEscala) + ModMatchup
 *
 * where:
 *   ScoreBaseDoJogador = (mechanics×W_mec + laning×W_lan [+ gameSense×W_gs]) × ModMaestria
 *   ModEscala = getScalingModifierForPhase(champion, 'laning')
 *   ModMatchup = calculateMatchupModifier(champion, opponentChampion)  [additive delta]
 *
 * Note: The task prompt pseudocode shows ModMaestria as a separate multiplicative factor
 * on top of the attribute sum, and ModEscala also as multiplicative. The doc section 3 formula
 * "LaneScore_papel = (ScoreBaseDoJogador × ModEscala) + ModMatchup" treats the base score
 * (which includes ModMaestria) as multiplied by ModEscala, then ModMatchup is added.
 * This interpretation is used here.
 *
 * @param gameMinute - Provided for API completeness; 'laning' phase is always used.
 */
export function calculateLaneScore(
  player: Player,
  champion: Champion,
  opponentPlayer: Player,
  opponentChampion: Champion,
  _gameMinute: number,
): number {
  const baseScore   = computeBaseScore(player)
  const modMaestria = getModMaestria(player, champion.id)
  const modForma    = getModForma(player)    // section 1: 0.85 + (morale/100)×0.30
  const modStamina  = getModStamina(player)  // section 1: 0.70 + (stamina/100)×0.30
  const modEscala   = getScalingModifierForPhase(champion, 'laning')
  const modMatchup  = calculateMatchupModifier(champion, opponentChampion)

  // Section 1 + 3: LaneScore = base × ModMaestria × ModForma × ModStamina × ModEscala + ModMatchup
  // Variancia is added per-player in simulateLaning (requires rng, kept separate).
  return (baseScore * modMaestria * modForma * modStamina * modEscala) + modMatchup
}

/**
 * Simulates a 1v1 lane between blue and red side players.
 * Adds seeded noise and determines winner and gold differential.
 */
export function simulateLaning(
  bluePlayer: Player,
  blueChampion: Champion,
  redPlayer: Player,
  redChampion: Champion,
  rng: SeededRng,
): LaneResult {
  const role: Role = bluePlayer.role

  let blueScore = calculateLaneScore(bluePlayer, blueChampion, redPlayer, redChampion, 10)
  let redScore  = calculateLaneScore(redPlayer, redChampion, bluePlayer, blueChampion, 10)

  // Variancia — section 1: centred on zero, magnitude inversely proportional to consistency
  blueScore += computeVariancia(bluePlayer, rng)
  redScore  += computeVariancia(redPlayer,  rng)

  const diff = blueScore - redScore
  let winner: 'blue' | 'red' | 'draw'
  if (diff > DRAW_THRESHOLD) {
    winner = 'blue'
  } else if (diff < -DRAW_THRESHOLD) {
    winner = 'red'
  } else {
    winner = 'draw'
  }

  // goldDiff: design decision — not in the doc; see module-level comment
  const goldDiff = diff * GOLD_PER_SCORE_POINT

  return { role, blueScore, redScore, winner, goldDiff }
}

/**
 * Simulates all 5 lanes.
 * Index mapping: 0=TOP, 1=JUNGLE, 2=MID, 3=ADC, 4=SUPPORT
 */
export function simulateAllLanes(
  bluePlayers: Player[],
  blueChampions: Champion[],
  redPlayers: Player[],
  redChampions: Champion[],
  rng: SeededRng,
): LaneResult[] {
  return ROLE_ORDER.map((_, i) =>
    simulateLaning(
      bluePlayers[i],
      blueChampions[i],
      redPlayers[i],
      redChampions[i],
      rng,
    ),
  )
}

/**
 * Computes the team-level LaningScore as a weighted sum of lane scores.
 * Formula from section 3: LaningScore_time = Σ (LaneScore_papel × peso do papel)
 * Used by matchSimulator for the final phase aggregation.
 */
export function computeTeamLaningScore(laneResults: LaneResult[], side: 'blue' | 'red'): number {
  return ROLE_ORDER.reduce((sum, role, i) => {
    const result = laneResults[i]
    const score  = side === 'blue' ? result.blueScore : result.redScore
    return sum + score * LANING_ROLE_WEIGHTS[role]
  }, 0)
}
