// Handles loading, parsing, and serialising datapacks from/to JSON strings.
// No side-effects, no I/O — callers supply the raw string.

import { type Datapack, validateDatapack } from './schema'

/**
 * Parses a JSON string and validates it as a Datapack.
 * Never throws — always returns the discriminated union.
 */
export function parseDatapackFromJson(
  jsonString: string,
): { success: true; data: Datapack } | { success: false; errors: string[] } {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, errors: [`JSON inválido: ${message}`] }
  }
  return validateDatapack(parsed)
}

/**
 * Creates a minimal valid datapack with empty patch arrays.
 * Useful as a starting point for the user to fill in.
 */
export function createEmptyDatapack(name: string, version?: string): Datapack {
  return {
    name,
    version: version ?? '1.0.0',
    players: [],
    teams: [],
    champions: [],
  }
}

/**
 * Serialises a datapack to a pretty-printed JSON string for export/save.
 */
export function serializeDatapack(datapack: Datapack): string {
  return JSON.stringify(datapack, null, 2)
}
