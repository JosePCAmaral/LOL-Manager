// Zod schemas for validating datapacks before applying them.
// Datapack fields are adapted to match the actual Player, Team, and Champion types in src/types/index.ts.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// PlayerPatch
// ---------------------------------------------------------------------------
// Attribute names match PlayerAttributes in src/types/index.ts exactly.
// All fields optional except id (needed to locate the player in base data).
export const PlayerPatchSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  region: z.string().optional(),
  age: z.number().int().min(16).max(40).optional(),
  salary: z.number().min(0).optional(),
  buyoutClause: z.number().min(0).optional(),
  attributes: z
    .object({
      mechanics: z.number().min(1).max(20).optional(),
      laning: z.number().min(1).max(20).optional(),
      teamfight: z.number().min(1).max(20).optional(),
      gameSense: z.number().min(1).max(20).optional(),
      shotcalling: z.number().min(1).max(20).optional(),
      metaAdaptation: z.number().min(1).max(20).optional(),
      consistency: z.number().min(1).max(20).optional(),
      resilience: z.number().min(1).max(20).optional(),
    })
    .optional(),
  potential: z.number().min(1).max(100).optional(),
  championPool: z
    .array(
      z.object({
        championId: z.string(),
        masteryLevel: z.number().int().min(1).max(20),
      }),
    )
    .optional(),
})

export type PlayerPatch = z.infer<typeof PlayerPatchSchema>

// ---------------------------------------------------------------------------
// TeamPatch
// ---------------------------------------------------------------------------
// Team uses logoAssetId (not logoUrl) and has no shortName field — both differ
// from the spec draft. Adapted to match src/types/index.ts Team interface.
export const TeamPatchSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  logoAssetId: z.string().optional(),
  region: z.string().optional(),
  budget: z.number().min(0).optional(),
  reputation: z.number().min(0).max(100).optional(),
})

export type TeamPatch = z.infer<typeof TeamPatchSchema>

// ---------------------------------------------------------------------------
// ChampionPatch
// ---------------------------------------------------------------------------
// compTags are game-balance data and must not be overridden by user datapacks.
// imageUrl is not on the Champion type yet but is kept for forward-compat.
export const ChampionPatchSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  imageUrl: z.string().url().optional(),
})

export type ChampionPatch = z.infer<typeof ChampionPatchSchema>

// ---------------------------------------------------------------------------
// Datapack (root)
// ---------------------------------------------------------------------------
export const DatapackSchema = z.object({
  version: z.string(),
  name: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  players: z.array(PlayerPatchSchema).optional(),
  teams: z.array(TeamPatchSchema).optional(),
  champions: z.array(ChampionPatchSchema).optional(),
})

export type Datapack = z.infer<typeof DatapackSchema>

// ---------------------------------------------------------------------------
// validateDatapack
// ---------------------------------------------------------------------------
/**
 * Validates a raw unknown value against DatapackSchema.
 * Returns a discriminated union — callers never need to catch exceptions.
 * Errors are formatted as human-readable strings, e.g.:
 *   "players[0].attributes.mechanics: Expected number, received string"
 */
export function validateDatapack(
  raw: unknown,
): { success: true; data: Datapack } | { success: false; errors: string[] } {
  const result = DatapackSchema.safeParse(raw)
  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') + ': ' : ''
    return `${path}${issue.message}`
  })

  return { success: false, errors }
}
