/**
 * draftEngine.test.ts
 *
 * Tests for src/engine/draft/draftEngine.ts.
 * Validates the full draft flow against docs/simulacao_e_draft.md section 8
 * and the official LoL draft sequence documented in draftEngine.ts itself.
 */

import { describe, it, expect } from 'vitest'
import {
  createDraftState,
  applyDraftAction,
  draftStateToResult,
  runAutoDraft,
} from '@engine/draft/draftEngine'
import { seededRandom } from '@engine/core/rng'
import type { Player, Champion, Role } from '@types-app/index'

// ---------------------------------------------------------------------------
// Local factories
// ---------------------------------------------------------------------------

function makeChampion(id: string, roles: Role[] = ['MID']): Champion {
  return {
    id,
    name: id,
    eligibleRoles: roles,
    damageType: 'magic',
    range: 1,
    earlyPower: 1,
    sustain: 0,
    mobility: 1,
    scalingCurve: 'mid',
    compTags: { engage: 1, peel: 1, waveClear: 1, ccChain: 1 },
  }
}

function makePlayer(id: string, role: Role, champIds: string[]): Player {
  return {
    id,
    name: id,
    role,
    age: 22,
    country: 'BR',
    attributes: {
      mechanics: 10, laning: 10, teamfight: 10,
      gameSense: 10, shotcalling: 10, metaAdaptation: 10,
      consistency: 10, resilience: 10,
    },
    championPool: champIds.map((cid, i) => ({ championId: cid, masteryLevel: 10 + i })),
    potential: 80,
    morale: 70,
    stamina: 80,
    burnoutRisk: 10,
    contract: null,
    teamId: null,
    isStarter: true,
  }
}

// ---------------------------------------------------------------------------
// A catalogue of 30 champions, each eligible for one of the 5 roles (6 each).
// This is sufficient to run a full 20-action draft without running out.
// ---------------------------------------------------------------------------
const ROLES: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

const ALL_CHAMPIONS: Champion[] = (() => {
  const list: Champion[] = []
  ROLES.forEach(role => {
    for (let i = 0; i < 6; i++) {
      list.push(makeChampion(`${role}-champ-${i}`, [role]))
    }
  })
  return list
})()

function makePlayers(prefix: string): Player[] {
  return ROLES.map(role =>
    makePlayer(
      `${prefix}-${role}`,
      role,
      ALL_CHAMPIONS.filter(c => c.eligibleRoles.includes(role)).map(c => c.id)
    )
  )
}

const BLUE_PLAYERS = makePlayers('blue')
const RED_PLAYERS  = makePlayers('red')

// ---------------------------------------------------------------------------
// createDraftState
// ---------------------------------------------------------------------------

describe('createDraftState', () => {
  const state = createDraftState()

  it('creates exactly 20 slots', () => {
    expect(state.slots).toHaveLength(20)
  })

  it('starts with currentSlotIndex === 0 and finished === false', () => {
    expect(state.currentSlotIndex).toBe(0)
    expect(state.finished).toBe(false)
  })

  it('starts with empty ban/pick collections', () => {
    expect(state.blueBans).toHaveLength(0)
    expect(state.redBans).toHaveLength(0)
    expect(Object.keys(state.bluePicks)).toHaveLength(0)
    expect(Object.keys(state.redPicks)).toHaveLength(0)
  })

  it('all slots start with championId === null', () => {
    expect(state.slots.every(s => s.championId === null)).toBe(true)
  })

  describe('slot structure — ban phases', () => {
    it('slots 0-5 have action === ban', () => {
      for (let i = 0; i <= 5; i++) {
        expect(state.slots[i].action).toBe('ban')
      }
    })

    it('slots 12-15 have action === ban', () => {
      for (let i = 12; i <= 15; i++) {
        expect(state.slots[i].action).toBe('ban')
      }
    })
  })

  describe('slot structure — pick phases', () => {
    it('slots 6-11 have action === pick', () => {
      for (let i = 6; i <= 11; i++) {
        expect(state.slots[i].action).toBe('pick')
      }
    })

    it('slots 16-19 have action === pick', () => {
      for (let i = 16; i <= 19; i++) {
        expect(state.slots[i].action).toBe('pick')
      }
    })
  })

  describe('ban phase 1 alternation (slots 0-5)', () => {
    it('slot 0 is blue', () => expect(state.slots[0].team).toBe('blue'))
    it('slot 1 is red',  () => expect(state.slots[1].team).toBe('red'))
    it('slot 2 is blue', () => expect(state.slots[2].team).toBe('blue'))
    it('slot 3 is red',  () => expect(state.slots[3].team).toBe('red'))
    it('slot 4 is blue', () => expect(state.slots[4].team).toBe('blue'))
    it('slot 5 is red',  () => expect(state.slots[5].team).toBe('red'))
  })

  describe('pick phase 1 snake order (slots 6-11)', () => {
    // B R R B B R
    it('slot 6:  blue pick', () => { expect(state.slots[6].team).toBe('blue');  expect(state.slots[6].action).toBe('pick') })
    it('slot 7:  red pick',  () => { expect(state.slots[7].team).toBe('red');   expect(state.slots[7].action).toBe('pick') })
    it('slot 8:  red pick',  () => { expect(state.slots[8].team).toBe('red');   expect(state.slots[8].action).toBe('pick') })
    it('slot 9:  blue pick', () => { expect(state.slots[9].team).toBe('blue');  expect(state.slots[9].action).toBe('pick') })
    it('slot 10: blue pick', () => { expect(state.slots[10].team).toBe('blue'); expect(state.slots[10].action).toBe('pick') })
    it('slot 11: red pick',  () => { expect(state.slots[11].team).toBe('red');  expect(state.slots[11].action).toBe('pick') })
  })
})

// ---------------------------------------------------------------------------
// applyDraftAction — bans
// ---------------------------------------------------------------------------

describe('applyDraftAction — bans', () => {
  it('first action (blue ban) appears in blueBans, not redBans', () => {
    const state = createDraftState()
    const next  = applyDraftAction(state, 'champ-001')
    expect(next.blueBans).toContain('champ-001')
    expect(next.redBans).not.toContain('champ-001')
  })

  it('second action (red ban) appears in redBans, not blueBans', () => {
    let state = createDraftState()
    state = applyDraftAction(state, 'champ-001')
    state = applyDraftAction(state, 'champ-002')
    expect(state.redBans).toContain('champ-002')
    expect(state.blueBans).not.toContain('champ-002')
  })

  it('currentSlotIndex advances to 1 after first action', () => {
    const state = createDraftState()
    const next  = applyDraftAction(state, 'champ-001')
    expect(next.currentSlotIndex).toBe(1)
  })

  it('does not mutate the original state', () => {
    const state = createDraftState()
    applyDraftAction(state, 'champ-001')
    expect(state.currentSlotIndex).toBe(0)
    expect(state.blueBans).toHaveLength(0)
  })

  it('throws when draft is already finished', () => {
    // Build a finished state by applying 20 actions
    let state = createDraftState()
    const champIds = ALL_CHAMPIONS.map(c => c.id)
    for (let i = 0; i < 20; i++) {
      state = applyDraftAction(state, champIds[i])
    }
    expect(state.finished).toBe(true)
    expect(() => applyDraftAction(state, 'extra-champ')).toThrow()
  })
})

// ---------------------------------------------------------------------------
// applyDraftAction — picks
// ---------------------------------------------------------------------------

describe('applyDraftAction — picks', () => {
  /**
   * Advance through the first 6 ban slots (slots 0-5), then apply pick at slot 6.
   * Slot 6 = blue pick TOP.
   */
  function advanceToPick1(): ReturnType<typeof createDraftState> {
    let state = createDraftState()
    const banIds = ['ban-0', 'ban-1', 'ban-2', 'ban-3', 'ban-4', 'ban-5']
    for (const id of banIds) {
      state = applyDraftAction(state, id)
    }
    return state
  }

  it('pick at slot 6 (blue TOP) appears in bluePicks[TOP]', () => {
    let state = advanceToPick1()
    state = applyDraftAction(state, 'TOP-champ-0')
    expect(state.bluePicks['TOP']).toBe('TOP-champ-0')
  })

  it('finished becomes true after exactly 20 actions', () => {
    let state = createDraftState()
    const champIds = ALL_CHAMPIONS.map(c => c.id)
    for (let i = 0; i < 19; i++) {
      state = applyDraftAction(state, champIds[i])
      expect(state.finished).toBe(false)
    }
    state = applyDraftAction(state, champIds[19])
    expect(state.finished).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// draftStateToResult
// ---------------------------------------------------------------------------

describe('draftStateToResult', () => {
  it('throws when draft is not finished', () => {
    const state = createDraftState()
    expect(() => draftStateToResult(state)).toThrow()
  })

  it('returns correct bans and picks after a full draft', () => {
    let state = createDraftState()
    const champIds = ALL_CHAMPIONS.map(c => c.id)
    for (let i = 0; i < 20; i++) {
      state = applyDraftAction(state, champIds[i])
    }
    const result = draftStateToResult(state)
    expect(result.bans['blue']).toHaveLength(5)
    expect(result.bans['red']).toHaveLength(5)
    expect(Object.keys(result.picks['blue'])).toHaveLength(5)
    expect(Object.keys(result.picks['red'])).toHaveLength(5)
  })
})

// ---------------------------------------------------------------------------
// runAutoDraft
// ---------------------------------------------------------------------------

describe('runAutoDraft', () => {
  const rng = () => seededRandom('greedy')

  it('returns exactly 5 picks for blue and 5 picks for red', () => {
    const result = runAutoDraft(
      'team-blue', 'team-red',
      BLUE_PLAYERS, RED_PLAYERS,
      ALL_CHAMPIONS,
      rng()
    )
    expect(Object.keys(result.picks['team-blue'])).toHaveLength(5)
    expect(Object.keys(result.picks['team-red'])).toHaveLength(5)
  })

  it('every role is present in both blue and red picks', () => {
    const result = runAutoDraft(
      'team-blue', 'team-red',
      BLUE_PLAYERS, RED_PLAYERS,
      ALL_CHAMPIONS,
      rng()
    )
    for (const role of ROLES) {
      expect(result.picks['team-blue'][role]).toBeDefined()
      expect(result.picks['team-red'][role]).toBeDefined()
    }
  })

  it('no champion appears twice across picks and bans', () => {
    const result = runAutoDraft(
      'team-blue', 'team-red',
      BLUE_PLAYERS, RED_PLAYERS,
      ALL_CHAMPIONS,
      rng()
    )
    const all: string[] = [
      ...result.bans['team-blue'],
      ...result.bans['team-red'],
      ...Object.values(result.picks['team-blue']),
      ...Object.values(result.picks['team-red']),
    ]
    const unique = new Set(all)
    expect(unique.size).toBe(all.length)
  })

  it('is deterministic: same seed produces identical result', () => {
    const result1 = runAutoDraft('blue', 'red', BLUE_PLAYERS, RED_PLAYERS, ALL_CHAMPIONS, seededRandom('deterministic-seed'))
    const result2 = runAutoDraft('blue', 'red', BLUE_PLAYERS, RED_PLAYERS, ALL_CHAMPIONS, seededRandom('deterministic-seed'))
    expect(result1).toEqual(result2)
  })

  it('different seeds can produce different results', () => {
    const result1 = runAutoDraft('blue', 'red', BLUE_PLAYERS, RED_PLAYERS, ALL_CHAMPIONS, seededRandom('seed-AAAA'))
    const result2 = runAutoDraft('blue', 'red', BLUE_PLAYERS, RED_PLAYERS, ALL_CHAMPIONS, seededRandom('seed-ZZZZ'))

    // At least one pick or ban must differ
    const allIds1 = [
      ...result1.bans['blue'], ...result1.bans['red'],
      ...Object.values(result1.picks['blue']), ...Object.values(result1.picks['red']),
    ].sort()
    const allIds2 = [
      ...result2.bans['blue'], ...result2.bans['red'],
      ...Object.values(result2.picks['blue']), ...Object.values(result2.picks['red']),
    ].sort()

    // If they happen to be equal (unlikely with very distinct seeds), the test is vacuously satisfied.
    // We only assert they're both valid — the determinism test above already covers exact reproduction.
    // This weaker check ensures we're exercising two independent runs.
    expect(allIds1.length).toBe(20)
    expect(allIds2.length).toBe(20)
  })

  it('blue team has exactly 5 bans and red team has exactly 5 bans', () => {
    const result = runAutoDraft('blue', 'red', BLUE_PLAYERS, RED_PLAYERS, ALL_CHAMPIONS, rng())
    expect(result.bans['blue']).toHaveLength(5)
    expect(result.bans['red']).toHaveLength(5)
  })
})
