// Pure merge functions — apply datapack patches over seed data.
// All functions are immutable: they return new objects/arrays; inputs are never mutated.
// No RNG, no side-effects, no external imports beyond types.

import type { Player, Team, Champion } from '@types-app/index'
import type { PlayerPatch, TeamPatch, ChampionPatch, Datapack } from './schema'

// ---------------------------------------------------------------------------
// mergePlayers
// ---------------------------------------------------------------------------
/**
 * Applies PlayerPatch entries over basePlayers by id.
 * - Unknown ids are silently ignored (forward/backward compat).
 * - attributes are shallowly merged: only provided attribute keys are overwritten.
 * - championPool, if provided, replaces the entire pool (not merged entry-by-entry).
 * - salary and buyoutClause, if provided, are written into player.contract
 *   (the Contract object itself must already exist; free-agent players without a
 *   contract are not affected by salary/buyoutClause patches).
 */
export function mergePlayers(basePlayers: Player[], patches: PlayerPatch[]): Player[] {
  if (patches.length === 0) return basePlayers

  const patchById = new Map<string, PlayerPatch>()
  for (const patch of patches) {
    patchById.set(patch.id, patch)
  }

  return basePlayers.map((player) => {
    const patch = patchById.get(player.id)
    if (!patch) return player

    const mergedAttributes =
      patch.attributes !== undefined
        ? { ...player.attributes, ...patch.attributes }
        : player.attributes

    const mergedChampionPool =
      patch.championPool !== undefined ? patch.championPool : player.championPool

    // Salary / buyoutClause live inside Contract; only patch if contract exists.
    let mergedContract = player.contract
    if (player.contract !== null) {
      const salaryChanged = patch.salary !== undefined
      const buyoutChanged = patch.buyoutClause !== undefined
      if (salaryChanged || buyoutChanged) {
        mergedContract = {
          ...player.contract,
          ...(salaryChanged ? { salary: patch.salary as number } : {}),
          ...(buyoutChanged ? { buyoutClause: patch.buyoutClause as number } : {}),
        }
      }
    }

    return {
      ...player,
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.region !== undefined ? { region: patch.region } : {}),
      ...(patch.age !== undefined ? { age: patch.age } : {}),
      ...(patch.potential !== undefined ? { potential: patch.potential } : {}),
      attributes: mergedAttributes,
      championPool: mergedChampionPool,
      contract: mergedContract,
    }
  })
}

// ---------------------------------------------------------------------------
// mergeTeams
// ---------------------------------------------------------------------------
/**
 * Applies TeamPatch entries over baseTeams by id.
 * Unknown ids are silently ignored.
 */
export function mergeTeams(baseTeams: Team[], patches: TeamPatch[]): Team[] {
  if (patches.length === 0) return baseTeams

  const patchById = new Map<string, TeamPatch>()
  for (const patch of patches) {
    patchById.set(patch.id, patch)
  }

  return baseTeams.map((team) => {
    const patch = patchById.get(team.id)
    if (!patch) return team

    return {
      ...team,
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.logoAssetId !== undefined ? { logoAssetId: patch.logoAssetId } : {}),
      ...(patch.region !== undefined ? { region: patch.region } : {}),
      ...(patch.budget !== undefined ? { budget: patch.budget } : {}),
      ...(patch.reputation !== undefined ? { reputation: patch.reputation } : {}),
    }
  })
}

// ---------------------------------------------------------------------------
// mergeChampions
// ---------------------------------------------------------------------------
/**
 * Applies ChampionPatch entries over baseChampions by id.
 * compTags and other game-balance fields are never overwritten.
 * Unknown ids are silently ignored.
 */
export function mergeChampions(baseChampions: Champion[], patches: ChampionPatch[]): Champion[] {
  if (patches.length === 0) return baseChampions

  const patchById = new Map<string, ChampionPatch>()
  for (const patch of patches) {
    patchById.set(patch.id, patch)
  }

  return baseChampions.map((champion) => {
    const patch = patchById.get(champion.id)
    if (!patch) return champion

    // imageUrl is not on the Champion type yet; we cast via unknown to avoid
    // a TS error while keeping the value available at runtime for future use.
    return {
      ...champion,
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.imageUrl !== undefined ? { imageUrl: patch.imageUrl } : {}),
    } as Champion
  })
}

// ---------------------------------------------------------------------------
// applyDatapack
// ---------------------------------------------------------------------------
/**
 * Applies all three patch arrays from a validated Datapack in sequence.
 * Undefined or empty patch arrays leave the corresponding base data unchanged.
 */
export function applyDatapack(
  players: Player[],
  teams: Team[],
  champions: Champion[],
  datapack: Datapack,
): { players: Player[]; teams: Team[]; champions: Champion[] } {
  const patchedPlayers =
    datapack.players && datapack.players.length > 0
      ? mergePlayers(players, datapack.players)
      : players

  const patchedTeams =
    datapack.teams && datapack.teams.length > 0
      ? mergeTeams(teams, datapack.teams)
      : teams

  const patchedChampions =
    datapack.champions && datapack.champions.length > 0
      ? mergeChampions(champions, datapack.champions)
      : champions

  return { players: patchedPlayers, teams: patchedTeams, champions: patchedChampions }
}

// ---------------------------------------------------------------------------
// diffDatapack
// ---------------------------------------------------------------------------
/**
 * Compares basePlayers against patchedPlayers and generates a minimal
 * PlayerPatch array describing only the differences.
 * Useful for exporting user customisations as a reusable datapack.
 *
 * Only players that actually changed are included. Within each patch, only
 * the fields that differ are included (attributes are compared key-by-key).
 */
export function diffDatapack(basePlayers: Player[], patchedPlayers: Player[]): PlayerPatch[] {
  const baseById = new Map<string, Player>()
  for (const p of basePlayers) {
    baseById.set(p.id, p)
  }

  const patches: PlayerPatch[] = []

  for (const patched of patchedPlayers) {
    const base = baseById.get(patched.id)
    if (!base) continue // player exists only in patched array — skip

    const patch: PlayerPatch = { id: patched.id }
    let hasDiff = false

    if (patched.name !== base.name) { patch.name = patched.name; hasDiff = true }
    if (patched.region !== base.region) { patch.region = patched.region; hasDiff = true }
    if (patched.age !== base.age) { patch.age = patched.age; hasDiff = true }
    if (patched.potential !== base.potential) { patch.potential = patched.potential; hasDiff = true }

    // Contract fields
    if (
      patched.contract !== null &&
      base.contract !== null &&
      patched.contract.salary !== base.contract.salary
    ) {
      patch.salary = patched.contract.salary
      hasDiff = true
    }
    if (
      patched.contract !== null &&
      base.contract !== null &&
      patched.contract.buyoutClause !== base.contract.buyoutClause
    ) {
      patch.buyoutClause = patched.contract.buyoutClause
      hasDiff = true
    }

    // Attributes — compare key-by-key, include only changed ones
    const attrKeys = [
      'mechanics',
      'laning',
      'teamfight',
      'gameSense',
      'shotcalling',
      'metaAdaptation',
      'consistency',
      'resilience',
    ] as const

    const attrDiff: PlayerPatch['attributes'] = {}
    let attrChanged = false
    for (const key of attrKeys) {
      if (patched.attributes[key] !== base.attributes[key]) {
        ;(attrDiff as Record<string, number>)[key] = patched.attributes[key]
        attrChanged = true
      }
    }
    if (attrChanged) {
      patch.attributes = attrDiff
      hasDiff = true
    }

    // championPool — compare by serialising; if different, include full new pool
    const basePool = JSON.stringify(base.championPool)
    const patchedPool = JSON.stringify(patched.championPool)
    if (basePool !== patchedPool) {
      patch.championPool = patched.championPool
      hasDiff = true
    }

    if (hasDiff) patches.push(patch)
  }

  return patches
}
