/**
 * aiSuggestion.ts — AI ban/pick suggestions for the draft.
 *
 * Implements the scoring and selection logic described in
 * docs/simulacao_e_draft.md section 8.
 */

import type { Player, Champion } from '@types-app/index'
import type { Role } from '@types-app/index'
import type { SeededRng } from '../core/rng'
import { randomInt } from '../core/rng'
import type { DraftTeam, DraftState } from './draftEngine'
import {
  getMaestriaNormalizada,
  getChampionScore,
  getPickableChampions,
  computeContribuicaoComp,
} from './composition'

// ---------------------------------------------------------------------------
// suggestBan
// ---------------------------------------------------------------------------

/**
 * Suggests which champion to ban for the given side.
 *
 * Algorithm (section 8 intent — bans are described as targeting the highest-
 * value champions for the enemy team):
 *   1. For each available champion (not yet banned or picked), compute the
 *      average MaestriaNormalizada across all enemy players.
 *   2. Sort by that average score descending.
 *   3. With 80% probability (rng() < 0.8): ban the top champion (greedy).
 *      Otherwise: pick one of the top 3 at random (rng.nextInt equivalent).
 *
 * Decision (own — exact ban algorithm not in doc): section 8 focuses on pick
 * scoring. Ban logic is inferred from "maximize disruption to enemy" + the
 * 80/20 greedy/random split from the task specification. Flagged for review.
 *
 * Returns a championId string.
 */
export function suggestBan(
  _banningSide: DraftTeam,
  state: DraftState,
  enemyPlayers: Player[],
  allChampions: Champion[],
  rng: SeededRng
): string {
  const alreadyUsed = new Set([
    ...state.blueBans,
    ...state.redBans,
    ...Object.values(state.bluePicks).filter((v): v is string => v !== undefined),
    ...Object.values(state.redPicks).filter((v): v is string => v !== undefined),
  ])

  const available = allChampions.filter(c => !alreadyUsed.has(c.id))

  if (available.length === 0) {
    throw new Error('suggestBan: no champions available to ban')
  }

  // Score each champion as the average mastery among enemy players
  const scored = available.map(champion => {
    const avgMastery =
      enemyPlayers.reduce((sum, p) => sum + getMaestriaNormalizada(p, champion.id), 0) /
      Math.max(1, enemyPlayers.length)
    return { champion, score: avgMastery }
  })

  // Sort descending by threat score
  scored.sort((a, b) => b.score - a.score)

  const top3 = scored.slice(0, Math.min(3, scored.length))

  // 80% probability: ban the greedy top pick; 20%: random among top 3
  if (rng() < 0.8) {
    return top3[0].champion.id
  }
  const idx = randomInt(rng, 0, top3.length - 1)
  return top3[idx].champion.id
}

// ---------------------------------------------------------------------------
// suggestPick
// ---------------------------------------------------------------------------

/**
 * Suggests which champion to pick for a given role and side.
 *
 * Algorithm (section 8):
 *   1. Get pickable champions for the role (not banned, not already picked,
 *      eligible for the role).
 *   2. For the player assigned to this role, calculate getChampionScore for
 *      each available champion, passing the teammate champions already picked.
 *   3. Sort descending by score.
 *   4. With 70% probability: pick the top champion; otherwise pick randomly
 *      among the top 3.
 *
 * @param pickingSide        - 'blue' or 'red'
 * @param role               - The role slot being filled.
 * @param state              - Current draft state.
 * @param teamPlayers        - All 5 players for the picking team.
 * @param teammateChampions  - Champion objects already assigned to teammates
 *                             on this side (resolved by the caller).
 * @param allChampions       - Full champion catalogue.
 * @param allBanned          - All banned championIds so far.
 * @param allPicked          - All picked championIds so far.
 * @param rng                - Seeded RNG instance.
 * @returns A championId string.
 */
export function suggestPick(
  _pickingSide: DraftTeam,
  role: Role,
  _state: DraftState,
  teamPlayers: Player[],
  teammateChampions: Champion[],
  allChampions: Champion[],
  allBanned: string[],
  allPicked: string[],
  rng: SeededRng
): string {
  const pickable = getPickableChampions(allChampions, allBanned, allPicked, role)

  if (pickable.length === 0) {
    throw new Error(`suggestPick: no champions available for role ${role}`)
  }

  // Find the player for this role
  const player = teamPlayers.find(p => p.role === role)

  // Score each available champion for this player
  const scored = pickable.map(champion => {
    let score: number
    if (player !== undefined) {
      score = getChampionScore(player, champion, teammateChampions)
    } else {
      // No player found for role — fall back to composition contribution only
      score = computeContribuicaoComp(champion, teammateChampions)
    }
    return { champion, score }
  })

  // Sort descending
  scored.sort((a, b) => b.score - a.score)

  const top3 = scored.slice(0, Math.min(3, scored.length))

  // 70% probability: top pick; 30%: random among top 3
  if (rng() < 0.7) {
    return top3[0].champion.id
  }
  const idx = randomInt(rng, 0, top3.length - 1)
  return top3[idx].champion.id
}
