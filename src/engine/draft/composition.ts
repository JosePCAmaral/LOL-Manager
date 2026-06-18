/**
 * composition.ts — Composition scoring functions for the draft.
 *
 * Formulas from docs/simulacao_e_draft.md section 8.
 */

import type { Player, Champion } from '@types-app/index'
import type { Role } from '@types-app/index'

// ---------------------------------------------------------------------------
// MaestriaNormalizada
// ---------------------------------------------------------------------------

/**
 * Returns a normalized mastery value in [0, 1] for a player on a given champion.
 *
 * Formula (section 8): MaestriaNormalizada = masteryLevel / 20
 *
 * If the champion is not found in the player's pool, returns 0.05 (equiv. to
 * masteryLevel=1) — the minimum possible value, reflecting zero experience.
 * This penalises out-of-pool picks heavily, consistent with the doc's intent
 * that the risk is captured at draft time via this score.
 */
export function getMaestriaNormalizada(player: Player, championId: string): number {
  const mastery = player.championPool.find(m => m.championId === championId)
  if (mastery === undefined) return 0.05
  // masteryLevel is 1-20, so result is in [0.05, 1.0]
  return mastery.masteryLevel / 20
}

// ---------------------------------------------------------------------------
// ContribuicaoComp (internal helper + public variant)
// ---------------------------------------------------------------------------

const COMP_TAGS = ['engage', 'peel', 'waveClear', 'ccChain'] as const
type CompTag = typeof COMP_TAGS[number]

/**
 * Computes ContribuicaoComp given the Champion objects already present in
 * the partial composition (i.e., champions already picked by teammates).
 *
 * Logic: for each compTag, the champion contributes more when the current
 * composition has less of that tag (diminishing returns / gap-filling).
 *   gap_tag = max(0, MAX_TAG_SUM - currentSum_tag) / MAX_TAG_SUM
 *   contribution_tag = champion.compTags[tag] * gap_tag
 *
 * MAX_TAG_SUM per tag across 5 champions = 5 × 2 = 10.
 * Total is normalized to [0, 1] by dividing by the theoretical maximum for
 * a single champion with a full gap on all tags: 4 × 2 × 1 = 8.
 *
 * Decision (own — not given explicitly in doc): diminishing-returns weighting
 * is the natural implementation of "1st engage champion contributes far more
 * than the 3rd" stated in section 8.
 */
export function computeContribuicaoComp(
  champion: Champion,
  existingChampions: Champion[]
): number {
  const MAX_TAG_SUM = 10 // 5 champions × max tag value 2

  const currentSums: Record<CompTag, number> = {
    engage: 0, peel: 0, waveClear: 0, ccChain: 0
  }

  for (const ec of existingChampions) {
    for (const tag of COMP_TAGS) {
      currentSums[tag] += ec.compTags[tag]
    }
  }

  let total = 0
  for (const tag of COMP_TAGS) {
    const gap = Math.max(0, MAX_TAG_SUM - currentSums[tag]) / MAX_TAG_SUM
    total += champion.compTags[tag] * gap
  }

  // Theoretical max: 4 tags × 2 max value × 1.0 full gap = 8
  return total / 8
}

// ---------------------------------------------------------------------------
// getChampionScore
// ---------------------------------------------------------------------------

// Weights from docs/simulacao_e_draft.md section 8 (exact values):
export const PESO_MAESTRIA = 0.6
export const PESO_COMP = 0.4

/**
 * Calculates the overall draft score for a champion for a given player,
 * taking into account the existing partial composition of teammates.
 *
 * Formula (section 8, exact):
 *   Score = 0.6 × MaestriaNormalizada + 0.4 × ContribuicaoComp
 *
 * Note: The task prompt mentions a SinergiaMeta / PesoMeta third term, but
 * section 8 of docs/simulacao_e_draft.md does NOT include it. The document is
 * the authoritative source per project rules, so only the two-term formula is
 * implemented here. This is a deliberate deviation from the task prompt,
 * flagged for human review.
 *
 * @param player            - The player who would play this champion.
 * @param champion          - The champion being evaluated.
 * @param teammateChampions - Champion objects already assigned to teammates on
 *                            the same side (the caller resolves which champion
 *                            each teammate is playing).
 */
export function getChampionScore(
  player: Player,
  champion: Champion,
  teammateChampions: Champion[]
): number {
  const maestriaNorm = getMaestriaNormalizada(player, champion.id)
  const contribuicaoComp = computeContribuicaoComp(champion, teammateChampions)
  return PESO_MAESTRIA * maestriaNorm + PESO_COMP * contribuicaoComp
}

// ---------------------------------------------------------------------------
// getCompositionStrength
// ---------------------------------------------------------------------------

/**
 * Computes the overall strength of a composition as a value in [0, 1].
 *
 * Sums all compTags (engage + peel + waveClear + ccChain) across all picked
 * champions, normalized by the theoretical maximum:
 *   max = 5 champions × 4 tags × 2 = 40
 */
export function getCompositionStrength(
  picks: Partial<Record<Role, string>>,
  allChampions: Champion[]
): number {
  const THEORETICAL_MAX = 40 // 5 × 4 tags × max 2

  let total = 0
  for (const championId of Object.values(picks)) {
    if (championId === undefined) continue
    const champion = allChampions.find(c => c.id === championId)
    if (champion === undefined) continue
    for (const tag of COMP_TAGS) {
      total += champion.compTags[tag]
    }
  }

  return total / THEORETICAL_MAX
}

// ---------------------------------------------------------------------------
// getPickableChampions
// ---------------------------------------------------------------------------

/**
 * Returns champions available to be picked: not banned, not already picked,
 * and eligible for the given role.
 */
export function getPickableChampions(
  allChampions: Champion[],
  banned: string[],
  alreadyPicked: string[],
  role: Role
): Champion[] {
  const excludedSet = new Set([...banned, ...alreadyPicked])
  return allChampions.filter(
    c => !excludedSet.has(c.id) && c.eligibleRoles.includes(role)
  )
}

