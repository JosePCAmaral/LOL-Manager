import { describe, it, expect } from 'vitest'
import { validateDatapack } from '@engine/datapack/schema'
import {
  parseDatapackFromJson,
  serializeDatapack,
  createEmptyDatapack,
} from '@engine/datapack/loader'
import {
  mergePlayers,
  mergeTeams,
  applyDatapack,
  diffDatapack,
} from '@engine/datapack/merge'
import { makePlayer, makeTeam } from '../helpers'
import type { Champion } from '@types-app/index'

// ---------------------------------------------------------------------------
// Helper: minimal valid champion for applyDatapack tests
// ---------------------------------------------------------------------------
function makeChampion(overrides: Partial<Champion> = {}): Champion {
  return {
    id: 'champ-1',
    name: 'TestChampion',
    eligibleRoles: ['MID'],
    damageType: 'magic',
    range: 1,
    earlyPower: 1,
    sustain: 1,
    mobility: 1,
    scalingCurve: 'mid',
    compTags: { engage: 1, peel: 1, waveClear: 1, ccChain: 1 },
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// validateDatapack — valid datapacks
// ---------------------------------------------------------------------------
describe('validateDatapack — valid datapacks', () => {
  it('minimal datapack with only version and name → success: true', () => {
    const result = validateDatapack({ version: '1.0.0', name: 'Test Pack' })
    expect(result.success).toBe(true)
  })

  it('datapack with a valid player patch → success: true', () => {
    const result = validateDatapack({
      version: '1.0.0',
      name: 'Player Pack',
      players: [
        {
          id: 'p1',
          name: 'New Name',
          attributes: { mechanics: 15 },
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('datapack with patches for players, teams, and champions → success: true', () => {
    const result = validateDatapack({
      version: '2.0.0',
      name: 'Full Pack',
      players: [{ id: 'p1', age: 22 }],
      teams: [{ id: 't1', name: 'New Team' }],
      champions: [{ id: 'c1', name: 'New Champ' }],
    })
    expect(result.success).toBe(true)
  })

  it('datapack with optional fields → success: true', () => {
    const result = validateDatapack({
      version: '1.0.0',
      name: 'Desc Pack',
      description: 'A description',
      author: 'Author Name',
    })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// validateDatapack — malformed datapacks
// ---------------------------------------------------------------------------
describe('validateDatapack — malformed datapacks', () => {
  it('object without version → success: false, errors not empty', () => {
    const result = validateDatapack({ name: 'No Version' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.length).toBeGreaterThan(0)
  })

  it('object without name → success: false', () => {
    const result = validateDatapack({ version: '1.0.0' })
    expect(result.success).toBe(false)
  })

  it('version as number instead of string → success: false', () => {
    const result = validateDatapack({ version: 1, name: 'Test' })
    expect(result.success).toBe(false)
  })

  it('player patch with missing id → success: false', () => {
    const result = validateDatapack({
      version: '1.0.0',
      name: 'Test',
      players: [{ name: 'No ID Player' }],
    })
    expect(result.success).toBe(false)
  })

  it('attribute out of range [1-20] (mechanics: 25) → success: false', () => {
    const result = validateDatapack({
      version: '1.0.0',
      name: 'Test',
      players: [{ id: 'p1', attributes: { mechanics: 25 } }],
    })
    expect(result.success).toBe(false)
  })

  it('age out of range (age: 10) → success: false', () => {
    const result = validateDatapack({
      version: '1.0.0',
      name: 'Test',
      players: [{ id: 'p1', age: 10 }],
    })
    expect(result.success).toBe(false)
  })

  it('null input → success: false', () => {
    const result = validateDatapack(null)
    expect(result.success).toBe(false)
  })

  it('number input (42) → success: false', () => {
    const result = validateDatapack(42)
    expect(result.success).toBe(false)
  })

  it('empty array as datapack → success: false', () => {
    const result = validateDatapack([])
    expect(result.success).toBe(false)
  })

  it('attribute at minimum value (mechanics: 1) → success: true', () => {
    const result = validateDatapack({
      version: '1.0.0',
      name: 'Test',
      players: [{ id: 'p1', attributes: { mechanics: 1 } }],
    })
    expect(result.success).toBe(true)
  })

  it('attribute at maximum value (mechanics: 20) → success: true', () => {
    const result = validateDatapack({
      version: '1.0.0',
      name: 'Test',
      players: [{ id: 'p1', attributes: { mechanics: 20 } }],
    })
    expect(result.success).toBe(true)
  })

  it('attribute below minimum (mechanics: 0) → success: false', () => {
    const result = validateDatapack({
      version: '1.0.0',
      name: 'Test',
      players: [{ id: 'p1', attributes: { mechanics: 0 } }],
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// parseDatapackFromJson
// ---------------------------------------------------------------------------
describe('parseDatapackFromJson', () => {
  it('valid JSON of a datapack → success: true', () => {
    const json = JSON.stringify({ version: '1.0.0', name: 'Valid' })
    const result = parseDatapackFromJson(json)
    expect(result.success).toBe(true)
  })

  it('malformed JSON (truncated string) → success: false, errors include "JSON inválido"', () => {
    const result = parseDatapackFromJson('{ "version": "1.0.0", "name":')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.some(e => e.includes('JSON inválido'))).toBe(true)
    }
  })

  it('valid JSON but failing schema → success: false', () => {
    const json = JSON.stringify({ version: 1, name: 42 })
    const result = parseDatapackFromJson(json)
    expect(result.success).toBe(false)
  })

  it('empty string → success: false', () => {
    const result = parseDatapackFromJson('')
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// createEmptyDatapack
// ---------------------------------------------------------------------------
describe('createEmptyDatapack', () => {
  it('returns datapack with version 1.0.0 by default', () => {
    const dp = createEmptyDatapack('My Pack')
    expect(dp.version).toBe('1.0.0')
  })

  it('returns datapack with the passed name', () => {
    const dp = createEmptyDatapack('Custom Name')
    expect(dp.name).toBe('Custom Name')
  })

  it('is valid according to validateDatapack', () => {
    const dp = createEmptyDatapack('Valid Empty')
    const result = validateDatapack(dp)
    expect(result.success).toBe(true)
  })

  it('accepts a custom version string', () => {
    const dp = createEmptyDatapack('Test', '2.5.0')
    expect(dp.version).toBe('2.5.0')
  })
})

// ---------------------------------------------------------------------------
// serializeDatapack + parseDatapackFromJson round-trip
// ---------------------------------------------------------------------------
describe('serializeDatapack + parseDatapackFromJson round-trip', () => {
  it('serialise then parse yields original datapack', () => {
    const original = {
      version: '1.0.0',
      name: 'Round Trip',
      players: [{ id: 'p1', name: 'Player One', attributes: { mechanics: 14 } }],
      teams: [],
      champions: [],
    }
    const serialized = serializeDatapack(original)
    const result = parseDatapackFromJson(serialized)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(original)
    }
  })
})

// ---------------------------------------------------------------------------
// mergePlayers
// ---------------------------------------------------------------------------
describe('mergePlayers', () => {
  it('player without matching patch is returned unchanged', () => {
    const player = makePlayer({ id: 'p1', name: 'Original' })
    const result = mergePlayers([player], [{ id: 'p-unknown' }])
    expect(result[0].name).toBe('Original')
  })

  it('patch with name → name updated, other fields unchanged', () => {
    const player = makePlayer({ id: 'p1', name: 'Old Name', age: 22 })
    const result = mergePlayers([player], [{ id: 'p1', name: 'New Name' }])
    expect(result[0].name).toBe('New Name')
    expect(result[0].age).toBe(22)
  })

  it('patch with unknown id → ignored silently, array size unchanged', () => {
    const players = [makePlayer({ id: 'p1' }), makePlayer({ id: 'p2' })]
    const result = mergePlayers(players, [{ id: 'p-ghost' }])
    expect(result.length).toBe(2)
  })

  it('patch with attributes.mechanics: 18 → only mechanics changes', () => {
    const player = makePlayer({
      id: 'p1',
      attributes: {
        mechanics: 10, laning: 10, teamfight: 10, gameSense: 10,
        shotcalling: 10, metaAdaptation: 10, consistency: 10, resilience: 10,
      },
    })
    const result = mergePlayers([player], [{ id: 'p1', attributes: { mechanics: 18 } }])
    expect(result[0].attributes.mechanics).toBe(18)
    expect(result[0].attributes.laning).toBe(10)
    expect(result[0].attributes.teamfight).toBe(10)
    expect(result[0].attributes.gameSense).toBe(10)
  })

  it('patch with championPool → replaces the entire pool', () => {
    const player = makePlayer({
      id: 'p1',
      championPool: [{ championId: 'old-champ', masteryLevel: 10 }],
    })
    const newPool = [{ championId: 'new-champ', masteryLevel: 5 }]
    const result = mergePlayers([player], [{ id: 'p1', championPool: newPool }])
    expect(result[0].championPool).toEqual(newPool)
  })

  it('does not mutate the original array', () => {
    const players = [makePlayer({ id: 'p1', name: 'Original' })]
    mergePlayers(players, [{ id: 'p1', name: 'Mutated?' }])
    expect(players[0].name).toBe('Original')
  })

  it('empty patches array returns original players reference', () => {
    const players = [makePlayer({ id: 'p1' })]
    const result = mergePlayers(players, [])
    expect(result).toBe(players)
  })
})

// ---------------------------------------------------------------------------
// mergeTeams
// ---------------------------------------------------------------------------
describe('mergeTeams', () => {
  it('team with patch of name → name updated', () => {
    const team = makeTeam({ id: 'team1', name: 'Old Name' })
    const result = mergeTeams([team], [{ id: 'team1', name: 'New Name' }])
    expect(result[0].name).toBe('New Name')
  })

  it('patch with unknown id → ignored silently', () => {
    const teams = [makeTeam({ id: 'team1' }), makeTeam({ id: 'team2' })]
    const result = mergeTeams(teams, [{ id: 'team-ghost', name: 'Ghost' }])
    expect(result.length).toBe(2)
    expect(result[0].name).toBe(teams[0].name)
  })

  it('does not mutate original array', () => {
    const teams = [makeTeam({ id: 'team1', name: 'Original' })]
    mergeTeams(teams, [{ id: 'team1', name: 'Changed' }])
    expect(teams[0].name).toBe('Original')
  })
})

// ---------------------------------------------------------------------------
// applyDatapack
// ---------------------------------------------------------------------------
describe('applyDatapack', () => {
  it('without patches → players, teams, champions returned unchanged', () => {
    const players = [makePlayer({ id: 'p1' })]
    const teams = [makeTeam({ id: 't1' })]
    const champions = [makeChampion({ id: 'c1' })]
    const dp = createEmptyDatapack('Empty')
    const result = applyDatapack(players, teams, champions, dp)
    expect(result.players).toBe(players)
    expect(result.teams).toBe(teams)
    expect(result.champions).toBe(champions)
  })

  it('with player patches → only players are modified, teams and champions unchanged', () => {
    const players = [makePlayer({ id: 'p1', name: 'Original' })]
    const teams = [makeTeam({ id: 't1', name: 'Same Team' })]
    const champions = [makeChampion({ id: 'c1', name: 'Same Champ' })]
    const dp = {
      ...createEmptyDatapack('Player Only'),
      players: [{ id: 'p1', name: 'Modified' }],
    }
    const result = applyDatapack(players, teams, champions, dp)
    expect(result.players[0].name).toBe('Modified')
    expect(result.teams).toBe(teams)
    expect(result.champions).toBe(champions)
  })

  it('original arrays are not mutated by applyDatapack', () => {
    const players = [makePlayer({ id: 'p1', name: 'Original' })]
    const teams = [makeTeam({ id: 't1' })]
    const champions = [makeChampion({ id: 'c1' })]
    const dp = {
      ...createEmptyDatapack('Mutate Test'),
      players: [{ id: 'p1', name: 'Changed' }],
    }
    applyDatapack(players, teams, champions, dp)
    expect(players[0].name).toBe('Original')
  })
})

// ---------------------------------------------------------------------------
// diffDatapack
// ---------------------------------------------------------------------------
describe('diffDatapack', () => {
  it('identical players → empty array (no differences)', () => {
    const players = [makePlayer({ id: 'p1', name: 'Same' })]
    const result = diffDatapack(players, [...players])
    expect(result).toEqual([])
  })

  it('player with name changed → patch includes only name', () => {
    const base = [makePlayer({ id: 'p1', name: 'Old Name' })]
    const patched = [{ ...base[0], name: 'New Name' }]
    const result = diffDatapack(base, patched)
    expect(result.length).toBe(1)
    expect(result[0].id).toBe('p1')
    expect(result[0].name).toBe('New Name')
    expect(result[0].age).toBeUndefined()
  })

  it('player with attribute changed → patch includes only the changed attribute', () => {
    const base = [makePlayer({
      id: 'p1',
      attributes: {
        mechanics: 10, laning: 10, teamfight: 10, gameSense: 10,
        shotcalling: 10, metaAdaptation: 10, consistency: 10, resilience: 10,
      },
    })]
    const patched = [{
      ...base[0],
      attributes: { ...base[0].attributes, mechanics: 15 },
    }]
    const result = diffDatapack(base, patched)
    expect(result.length).toBe(1)
    expect(result[0].attributes).toBeDefined()
    expect(result[0].attributes!.mechanics).toBe(15)
    expect(result[0].attributes!.laning).toBeUndefined()
  })

  it('player not in base array → skipped in diff output', () => {
    const base: typeof import('@types-app/index').Player[] = []
    const patched = [makePlayer({ id: 'p-new' })]
    // diffDatapack skips players only in patched (no base counterpart)
    const result = diffDatapack(base as any, patched)
    expect(result).toEqual([])
  })
})
