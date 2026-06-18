/**
 * aiSuggestion.test.ts
 *
 * Tests for src/engine/draft/aiSuggestion.ts.
 * Validates suggestBan and suggestPick against docs/simulacao_e_draft.md section 8.
 *
 * RNG seeds used:
 *   'greedy' → first call produces 0.267 (< 0.7 and < 0.8 → greedy for both ban and pick)
 *   'seed-b' → first call produces 0.909 (>= 0.8 → random for ban)
 */

import { describe, it, expect } from 'vitest'
import { suggestBan, suggestPick } from '@engine/draft/aiSuggestion'
import { createDraftState, applyDraftAction } from '@engine/draft/draftEngine'
import { seededRandom } from '@engine/core/rng'
import type { Player, Champion } from '@types-app/index'

// ---------------------------------------------------------------------------
// Local factories
// ---------------------------------------------------------------------------

function makeChampion(overrides: Partial<Champion> = {}): Champion {
  return {
    id: 'champ-default',
    name: 'Default Champion',
    eligibleRoles: ['MID'],
    damageType: 'magic',
    range: 1,
    earlyPower: 1,
    sustain: 0,
    mobility: 1,
    scalingCurve: 'mid',
    compTags: { engage: 0, peel: 0, waveClear: 0, ccChain: 0 },
    ...overrides,
  }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Test Player',
    role: 'MID',
    age: 22,
    country: 'BR',
    attributes: {
      mechanics: 10,
      laning: 10,
      teamfight: 10,
      gameSense: 10,
      shotcalling: 10,
      metaAdaptation: 10,
      consistency: 10,
      resilience: 10,
    },
    championPool: [],
    potential: 80,
    morale: 70,
    stamina: 80,
    burnoutRisk: 10,
    contract: null,
    teamId: null,
    isStarter: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// suggestBan
// ---------------------------------------------------------------------------

describe('suggestBan', () => {
  // Three champions: A (enemy mastery 18), B (mastery 10), C (mastery 4)
  const champA = makeChampion({ id: 'champ-a', name: 'Champion A' })
  const champB = makeChampion({ id: 'champ-b', name: 'Champion B' })
  const champC = makeChampion({ id: 'champ-c', name: 'Champion C' })
  const allChampions = [champA, champB, champC]

  // Enemy player pool: masteries 18 / 10 / 4 for A / B / C
  const enemyPlayer = makePlayer({
    id: 'enemy',
    championPool: [
      { championId: 'champ-a', masteryLevel: 18 },
      { championId: 'champ-b', masteryLevel: 10 },
      { championId: 'champ-c', masteryLevel: 4 },
    ],
  })
  const enemyPlayers = [enemyPlayer]

  it('greedy mode: bans champion A (highest enemy mastery)', () => {
    // seed 'greedy' → first rng() = 0.267 < 0.8 → greedy path
    const rng = seededRandom('greedy')
    const state = createDraftState()
    const result = suggestBan('blue', state, enemyPlayers, allChampions, rng)
    expect(result).toBe('champ-a')
  })

  it('random mode: ban is one of the top 3 champions', () => {
    // seed 'seed-b' → first rng() = 0.909 >= 0.8 → random path among top 3
    const rng = seededRandom('seed-b')
    const state = createDraftState()
    const result = suggestBan('blue', state, enemyPlayers, allChampions, rng)
    expect(['champ-a', 'champ-b', 'champ-c']).toContain(result)
  })

  it('does not ban an already-banned champion', () => {
    const rng = seededRandom('greedy')
    // Pre-ban champ-a in state
    let state = createDraftState()
    // Manually inject champ-a as already banned via applyDraftAction
    state = applyDraftAction(state, 'champ-a') // slot 0: blue ban
    // Now only B and C remain; greedy should pick B (mastery 10 > 4)
    const rng2 = seededRandom('greedy')
    const result = suggestBan('red', state, enemyPlayers, [champA, champB, champC], rng2)
    // champ-a is already in blueBans so should not be returned
    expect(result).not.toBe('champ-a')
  })

  it('throws when no champions are available', () => {
    const rng = seededRandom('greedy')
    const state = createDraftState()
    expect(() => suggestBan('blue', state, enemyPlayers, [], rng)).toThrow()
  })
})

// ---------------------------------------------------------------------------
// suggestPick
// ---------------------------------------------------------------------------

describe('suggestPick', () => {
  describe('scenario 1: fills engage gap', () => {
    // Teammates have waveClear + peel saturated; engage = 0 → lacuna
    const teammateChampions: Champion[] = [
      makeChampion({ id: 't1', compTags: { engage: 0, peel: 2, waveClear: 2, ccChain: 0 } }),
      makeChampion({ id: 't2', compTags: { engage: 0, peel: 2, waveClear: 2, ccChain: 0 } }),
      makeChampion({ id: 't3', compTags: { engage: 0, peel: 2, waveClear: 2, ccChain: 0 } }),
      makeChampion({ id: 't4', compTags: { engage: 0, peel: 2, waveClear: 2, ccChain: 0 } }),
    ]

    const champX = makeChampion({ id: 'champ-x', eligibleRoles: ['SUPPORT'], compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } })
    const champY = makeChampion({ id: 'champ-y', eligibleRoles: ['SUPPORT'], compTags: { engage: 0, peel: 2, waveClear: 0, ccChain: 0 } })
    const allChampions = [champX, champY]

    const supportPlayer = makePlayer({
      id: 'support',
      role: 'SUPPORT',
      // Both in pool with equal mastery so only composition differentiates
      championPool: [
        { championId: 'champ-x', masteryLevel: 10 },
        { championId: 'champ-y', masteryLevel: 10 },
      ],
    })

    it('with greedy seed: picks champ-x (fills engage gap)', () => {
      const rng = seededRandom('greedy')
      const state = createDraftState()
      const result = suggestPick(
        'blue', 'SUPPORT', state,
        [supportPlayer], teammateChampions,
        allChampions, [], [], rng
      )
      expect(result).toBe('champ-x')
    })
  })

  describe('scenario 2: picks waveClear when engage is saturated', () => {
    const engageSaturated: Champion[] = [
      makeChampion({ id: 's1', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
      makeChampion({ id: 's2', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
      makeChampion({ id: 's3', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
      makeChampion({ id: 's4', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
    ]

    const champX = makeChampion({ id: 'champ-x', eligibleRoles: ['SUPPORT'], compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } })
    const champY = makeChampion({ id: 'champ-y', eligibleRoles: ['SUPPORT'], compTags: { engage: 0, peel: 0, waveClear: 2, ccChain: 0 } })
    const allChampions = [champX, champY]

    const supportPlayer = makePlayer({
      id: 'support',
      role: 'SUPPORT',
      championPool: [
        { championId: 'champ-x', masteryLevel: 10 },
        { championId: 'champ-y', masteryLevel: 10 },
      ],
    })

    it('with greedy seed: picks champ-y (waveClear gap > engage gap)', () => {
      const rng = seededRandom('greedy')
      const state = createDraftState()
      const result = suggestPick(
        'blue', 'SUPPORT', state,
        [supportPlayer], engageSaturated,
        allChampions, [], [], rng
      )
      expect(result).toBe('champ-y')
    })
  })

  describe('scenario 3: mastery decides when composition is equal', () => {
    // Both champions have identical compTags; only mastery differs
    const champZ = makeChampion({ id: 'champ-z', eligibleRoles: ['MID'], compTags: { engage: 1, peel: 1, waveClear: 1, ccChain: 1 } })
    const champW = makeChampion({ id: 'champ-w', eligibleRoles: ['MID'], compTags: { engage: 1, peel: 1, waveClear: 1, ccChain: 1 } })
    const allChampions = [champZ, champW]

    const midPlayer = makePlayer({
      id: 'mid',
      role: 'MID',
      championPool: [
        { championId: 'champ-z', masteryLevel: 18 },
        { championId: 'champ-w', masteryLevel: 2 },
      ],
    })

    it('with greedy seed + empty comp: picks champ-z (higher mastery)', () => {
      const rng = seededRandom('greedy')
      const state = createDraftState()
      const result = suggestPick(
        'blue', 'MID', state,
        [midPlayer], [], // no teammates
        allChampions, [], [], rng
      )
      expect(result).toBe('champ-z')
    })
  })

  it('throws when no champions are available for role', () => {
    const rng = seededRandom('greedy')
    const state = createDraftState()
    const player = makePlayer({ role: 'ADC' })
    // allChampions is empty
    expect(() =>
      suggestPick('blue', 'ADC', state, [player], [], [], [], [], rng)
    ).toThrow()
  })
})
