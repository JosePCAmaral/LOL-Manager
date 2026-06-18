/**
 * matchSimulator.ts — Main entry point for match simulation.
 *
 * Source of truth: docs/simulacao_e_draft.md, sections 3–7.
 *
 * This module orchestrates the three simulation phases and produces
 * the final MatchResult with a complete, sorted event timeline.
 *
 * Design decisions made independently and flagged for human review:
 * - Phase time boundaries passed to event generators:
 *     laning  → baseMinute = 0
 *     midgame → baseMinute = 15
 *     teamfight → baseMinute = 25
 *   Not stated in the doc (which describes the structure but not exact boundaries).
 * - determineWinner uses a logistic function (section 6) with the final score
 *   aggregate and the seeded rng for the probabilistic draw resolution.
 *
 * All weights from section 6 are exact:
 *   VantagemTotal = 0.30×Laning + 0.35×Macro + 0.35×Teamfight
 *   ProbVitoria_A = 1 / (1 + e^(-0.35 × VantagemTotal))
 */

import type { MatchResult, DraftResult, Player, Champion } from '@types-app/index'
import type { GameDate } from '@types-app/index'
import type { SeededRng } from '../core/rng'
import { simulateAllLanes, computeTeamLaningScore } from './phases/laningPhase'
import { simulateMidGame } from './phases/midGamePhase'
import { simulateTeamfights } from './phases/teamfightPhase'
import {
  generateLaningEvents,
  generateMidGameEvents,
  generateTeamfightEvents,
  generateItemEvents,
  generateGoldUpdates,
} from './events'
import type { LaneResult } from './phases/laningPhase'
import type { MidGameResult } from './phases/midGamePhase'
import type { TeamfightResult } from './phases/teamfightPhase'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SimulateMatchParams {
  matchId: string
  leagueId: string
  date: GameDate
  blueTeamId: string
  redTeamId: string
  bluePlayers: Player[]       // exactly 5, order: TOP, JGL, MID, ADC, SUP
  redPlayers: Player[]
  blueChampions: Champion[]   // same order as players
  redChampions: Champion[]
  draft: DraftResult
}

// ---------------------------------------------------------------------------
// Constants — verbatim from section 6
// ---------------------------------------------------------------------------

/**
 * Phase weights in the final score aggregation — section 6:
 *   VantagemTotal = 0.30×Laning + 0.35×Macro + 0.35×Teamfight
 */
const W_LANING    = 0.30
const W_MACRO     = 0.35
const W_TEAMFIGHT = 0.35

/**
 * Logistic steepness — section 6:
 *   ProbVitoria_A = 1 / (1 + e^(-0.35 × VantagemTotal))
 */
const LOGISTIC_K = 0.35

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Determines the winning team based on the three phase scores.
 *
 * Formula from section 6:
 *   VantagemTotal = 0.30×(Laning_blue - Laning_red)
 *                 + 0.35×(Macro_blue - Macro_red)
 *                 + 0.35×(Teamfight_blue - Teamfight_red)
 *   ProbVitoria_blue = 1 / (1 + e^(-0.35 × VantagemTotal))
 *
 * A seeded rng roll resolves the winner probabilistically.
 */
export function determineWinner(
  blueTeamId: string,
  redTeamId: string,
  laneResults: LaneResult[],
  midGameResult: MidGameResult,
  teamfightResult: TeamfightResult,
  rng: SeededRng,
): string {
  // Phase-level score differences (blue minus red)
  const laningDiff    = computeTeamLaningScore(laneResults, 'blue') - computeTeamLaningScore(laneResults, 'red')
  const macroDiff     = midGameResult.blueMacroScore     - midGameResult.redMacroScore
  const teamfightDiff = teamfightResult.blueTeamfightScore - teamfightResult.redTeamfightScore

  const vantagemTotal = W_LANING * laningDiff + W_MACRO * macroDiff + W_TEAMFIGHT * teamfightDiff

  // Logistic win probability — section 6
  const probBlueWin = 1 / (1 + Math.exp(-LOGISTIC_K * vantagemTotal))

  return rng() < probBlueWin ? blueTeamId : redTeamId
}

/**
 * Simulates a full match and returns a MatchResult with complete timeline.
 *
 * Mandatory flow (section 7):
 *   1. simulateAllLanes
 *   2. simulateMidGame
 *   3. simulateTeamfights
 *   4. determineWinner
 *   5. Generate and merge timeline events (sorted by time)
 */
export function simulateMatch(params: SimulateMatchParams, rng: SeededRng): MatchResult {
  const {
    matchId,
    leagueId,
    date,
    blueTeamId,
    redTeamId,
    bluePlayers,
    redPlayers,
    blueChampions,
    redChampions,
    draft,
  } = params

  // Step 1: Laning phase
  const laneResults = simulateAllLanes(bluePlayers, blueChampions, redPlayers, redChampions, rng)

  // Step 2: Mid game phase
  const midGameResult = simulateMidGame(bluePlayers, blueChampions, redPlayers, redChampions, laneResults, rng)

  // Step 3: Teamfight phase
  const teamfightResult = simulateTeamfights(bluePlayers, blueChampions, redPlayers, redChampions, midGameResult, rng)

  // Step 4: Determine winner
  const winner = determineWinner(blueTeamId, redTeamId, laneResults, midGameResult, teamfightResult, rng)

  // Step 5: Generate timeline
  const laningEvents    = generateLaningEvents(laneResults, 0, rng, bluePlayers, redPlayers)
  const midGameEvents   = generateMidGameEvents(midGameResult, 15, rng, bluePlayers, redPlayers)
  const teamfightEvents = generateTeamfightEvents(teamfightResult, 25, rng, bluePlayers, redPlayers)
  const itemEvents      = generateItemEvents(rng, bluePlayers, redPlayers)
  const goldUpdates     = generateGoldUpdates(laneResults, midGameResult, rng)

  const timeline = [
    ...laningEvents,
    ...midGameEvents,
    ...teamfightEvents,
    ...itemEvents,
    ...goldUpdates,
  ].sort((a, b) => a.time - b.time)

  return {
    id:       matchId,
    leagueId,
    date,
    teamA:    blueTeamId,
    teamB:    redTeamId,
    draft,
    timeline,
    winner,
  }
}
