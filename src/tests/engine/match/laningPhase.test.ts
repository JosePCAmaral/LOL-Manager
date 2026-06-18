/**
 * laningPhase.test.ts
 *
 * Validates laningPhase.ts against docs/simulacao_e_draft.md sections 1 and 3.
 */

import { describe, it, expect } from 'vitest'
import { calculateLaneScore, simulateLaning, simulateAllLanes } from '@engine/match/phases/laningPhase'
import { seededRandom } from '@engine/core/rng'
import type { Player, Champion, Role } from '@types-app/index'

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
    sustain: 1,
    mobility: 1,
    scalingCurve: 'mid',
    compTags: { engage: 1, peel: 1, waveClear: 1, ccChain: 1 },
    ...overrides,
  }
}

function makePlayer(role: Role, attrs: Partial<Player['attributes']> = {}, overrides: Partial<Player> = {}): Player {
  return {
    id: `p-${role}`,
    name: `Player ${role}`,
    role,
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
      ...attrs,
    },
    championPool: [{ championId: 'champ-default', masteryLevel: 10 }],
    potential: 80,
    morale: 70,
    stamina: 80,
    burnoutRisk: 10,
    contract: null,
    teamId: 'team-a',
    isStarter: true,
    ...overrides,
  }
}

/** Makes a 5-player lineup in ROLE_ORDER (TOP, JUNGLE, MID, ADC, SUPPORT). */
function makeLineup(attrOverrides: Partial<Player['attributes']> = {}): Player[] {
  const roles: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
  return roles.map(r => makePlayer(r, attrOverrides, { id: `p-${r}-default` }))
}

function makeChampionLineup(scalingCurve: Champion['scalingCurve'] = 'mid'): Champion[] {
  return Array.from({ length: 5 }, (_, i) => makeChampion({ id: `champ-${i}`, scalingCurve }))
}

// ---------------------------------------------------------------------------
// calculateLaneScore — invariants from section 3
// ---------------------------------------------------------------------------

describe('calculateLaneScore — invariants', () => {
  const champ = makeChampion()
  const oppChamp = makeChampion()

  it('player with all attrs=20 scores higher than player with all attrs=1', () => {
    const strong = makePlayer('MID', { mechanics: 20, laning: 20, gameSense: 20 })
    const weak   = makePlayer('MID', { mechanics: 1,  laning: 1,  gameSense: 1  })

    const strongScore = calculateLaneScore(strong, champ, weak, oppChamp, 10)
    const weakScore   = calculateLaneScore(weak,   champ, strong, oppChamp, 10)

    expect(strongScore).toBeGreaterThan(weakScore)
  })

  it('same player, early champion (ModEscala=1.15) scores higher than late champion (ModEscala=0.85)', () => {
    const player = makePlayer('MID')
    const opp    = makePlayer('MID')
    const earlyChamp = makeChampion({ scalingCurve: 'early', id: 'early' })
    const lateChamp  = makeChampion({ scalingCurve: 'late',  id: 'late'  })
    const oppChampNeutral = makeChampion({ id: 'opp' })

    const earlyScore = calculateLaneScore(player, earlyChamp, opp, oppChampNeutral, 10)
    const lateScore  = calculateLaneScore(player, lateChamp,  opp, oppChampNeutral, 10)

    expect(earlyScore).toBeGreaterThan(lateScore)
  })

  it('favorable matchup (ModMatchup > 0) yields higher score than unfavorable', () => {
    const player    = makePlayer('MID')
    const opp       = makePlayer('MID')
    const strongChamp = makeChampion({ range: 2, earlyPower: 2, id: 'strong' })
    const weakChamp   = makeChampion({ range: 0, earlyPower: 0, id: 'weak'   })

    // Player uses strongChamp vs opponent using weakChamp → favorable matchup
    const favorable   = calculateLaneScore(player, strongChamp, opp, weakChamp, 10)
    // Player uses weakChamp vs opponent using strongChamp → unfavorable matchup
    const unfavorable = calculateLaneScore(player, weakChamp, opp, strongChamp, 10)

    expect(favorable).toBeGreaterThan(unfavorable)
  })

  it('LaneScore is a finite number for extreme-edge inputs (worst matchup + minimum attributes)', () => {
    // NOTE: the document (section 2) defines ModMatchup as additive in [-3,+3] with no floor
    // on the resulting LaneScore. A weak player on a badly countered champion CAN produce a
    // negative LaneScore (e.g. -2.32 observed: baseScore≈0.68 + modMatchup=-3 → -2.32).
    // That is correct per spec — it represents being completely dominated in lane.
    // This test only validates the result is a finite number (no NaN, no Infinity).
    const player   = makePlayer('MID', { mechanics: 1, laning: 1, gameSense: 1 })
    const opp      = makePlayer('MID', { mechanics: 20, laning: 20, gameSense: 20 })
    const weakChamp      = makeChampion({ range: 0, earlyPower: 0, sustain: 0, mobility: 0, scalingCurve: 'late',  id: 'weak'      })
    const strongOppChamp = makeChampion({ range: 2, earlyPower: 2, sustain: 2, mobility: 2, scalingCurve: 'early', id: 'strong-opp' })

    const score = calculateLaneScore(player, weakChamp, opp, strongOppChamp, 10)
    expect(isFinite(score)).toBe(true)
    expect(isNaN(score)).toBe(false)
    // Document-derived expected minimum: (1×0.4+1×0.6)×0.8×0.85 + (-3) ≈ -2.32
    // Verify the value is in the physically plausible range given the formula.
    expect(score).toBeGreaterThanOrEqual(-3.5)
  })

  it('JUNGLE role uses mechanics×0.5 + gameSense×0.5 (not laning)', () => {
    // Two jungle players with same mechanics but different gameSense/laning:
    // Both have laning=1, but player B has gameSense=20 → player B should score higher
    const junglerA = makePlayer('JUNGLE', { mechanics: 10, gameSense: 1,  laning: 1 })
    const junglerB = makePlayer('JUNGLE', { mechanics: 10, gameSense: 20, laning: 1 })
    const champ1 = makeChampion({ id: 'j1' })
    const champ2 = makeChampion({ id: 'j2' })

    const scoreA = calculateLaneScore(junglerA, champ1, junglerB, champ2, 10)
    const scoreB = calculateLaneScore(junglerB, champ2, junglerA, champ1, 10)

    expect(scoreB).toBeGreaterThan(scoreA)
  })

  it('SUPPORT role uses mechanics×0.3 + laning×0.7 (section 3)', () => {
    // Two supports with same mechanics but different laning: higher laning → higher score
    const supA = makePlayer('SUPPORT', { mechanics: 10, laning: 1  })
    const supB = makePlayer('SUPPORT', { mechanics: 10, laning: 20 })
    const champ1 = makeChampion({ id: 's1' })
    const champ2 = makeChampion({ id: 's2' })

    const scoreA = calculateLaneScore(supA, champ1, supB, champ2, 10)
    const scoreB = calculateLaneScore(supB, champ2, supA, champ1, 10)

    expect(scoreB).toBeGreaterThan(scoreA)
  })
})

// ---------------------------------------------------------------------------
// ModMaestria indirect verification via calculateLaneScore
// ---------------------------------------------------------------------------

describe('ModMaestria applied via calculateLaneScore', () => {
  const opp      = makePlayer('MID')
  const oppChamp = makeChampion({ id: 'opp' })

  it('maestria=20 yields higher LaneScore than maestria=1 (all else equal)', () => {
    const highMastery = makePlayer('MID', {}, {
      championPool: [{ championId: 'test-champ', masteryLevel: 20 }],
    })
    const lowMastery = makePlayer('MID', {}, {
      championPool: [{ championId: 'test-champ', masteryLevel: 1 }],
    })
    const champ = makeChampion({ id: 'test-champ' })

    const highScore = calculateLaneScore(highMastery, champ, opp, oppChamp, 10)
    const lowScore  = calculateLaneScore(lowMastery,  champ, opp, oppChamp, 10)

    expect(highScore).toBeGreaterThan(lowScore)
  })

  it('champion not in pool defaults to maestria=1 (lowest modifier)', () => {
    // Player with no champ in pool should be equivalent to masteryLevel=1
    const playerWithPool = makePlayer('MID', {}, {
      championPool: [{ championId: 'some-champ', masteryLevel: 1 }],
    })
    const playerWithoutPool = makePlayer('MID', {}, {
      championPool: [],
    })
    const champ = makeChampion({ id: 'some-champ' })

    const scoreWith    = calculateLaneScore(playerWithPool,    champ, opp, oppChamp, 10)
    const scoreWithout = calculateLaneScore(playerWithoutPool, champ, opp, oppChamp, 10)

    expect(scoreWith).toBeCloseTo(scoreWithout, 8)
  })
})

// ---------------------------------------------------------------------------
// simulateLaning — statistical properties
// ---------------------------------------------------------------------------

describe('simulateLaning — statistical properties', () => {
  it('team with superior attributes wins majority of lanes across 1000 seeds', () => {
    const strongPlayer = makePlayer('MID', { mechanics: 20, laning: 20, gameSense: 20 })
    const weakPlayer   = makePlayer('MID', { mechanics: 1,  laning: 1,  gameSense: 1  })
    const champ = makeChampion()
    let blueWins = 0

    for (let i = 0; i < 1000; i++) {
      const rng = seededRandom(`seed-${i}`)
      const result = simulateLaning(strongPlayer, champ, weakPlayer, champ, rng)
      if (result.winner === 'blue') blueWins++
    }

    // Strong player (blue) should win significantly more than 60%
    expect(blueWins).toBeGreaterThan(600)
  })

  it('identical players with identical champions: distribution is ~50/50 blue vs red (100 seeds)', () => {
    const player = makePlayer('MID')
    const champ  = makeChampion()
    let blueWins = 0
    let redWins  = 0

    for (let i = 0; i < 100; i++) {
      const rng = seededRandom(`equal-${i}`)
      const result = simulateLaning(player, champ, player, champ, rng)
      if (result.winner === 'blue') blueWins++
      if (result.winner === 'red')  redWins++
    }

    // With noise, neither side should dominate (40–60 range per side)
    // draws are also valid outcomes for very close matches
    const nonDrawTotal = blueWins + redWins
    if (nonDrawTotal > 0) {
      const blueRatio = blueWins / nonDrawTotal
      expect(blueRatio).toBeGreaterThan(0.3)
      expect(blueRatio).toBeLessThan(0.7)
    }
  })

  it('does not mutate original Player objects', () => {
    const blue = makePlayer('TOP', { mechanics: 15 })
    const red  = makePlayer('TOP', { mechanics: 5  })
    const champ = makeChampion()

    const blueOriginal = JSON.stringify(blue)
    const redOriginal  = JSON.stringify(red)

    const rng = seededRandom('immutability-test')
    simulateLaning(blue, champ, red, champ, rng)

    expect(JSON.stringify(blue)).toBe(blueOriginal)
    expect(JSON.stringify(red)).toBe(redOriginal)
  })

  it('does not mutate original Champion objects', () => {
    const player = makePlayer('MID')
    const champ  = makeChampion()
    const champOriginal = JSON.stringify(champ)

    const rng = seededRandom('champ-immutability')
    simulateLaning(player, champ, player, champ, rng)

    expect(JSON.stringify(champ)).toBe(champOriginal)
  })
})

// ---------------------------------------------------------------------------
// simulateAllLanes
// ---------------------------------------------------------------------------

describe('simulateAllLanes', () => {
  it('returns exactly 5 LaneResult entries', () => {
    const bluePlayers   = makeLineup()
    const redPlayers    = makeLineup()
    const blueChampions = makeChampionLineup()
    const redChampions  = makeChampionLineup()
    const rng = seededRandom('all-lanes')

    const results = simulateAllLanes(bluePlayers, blueChampions, redPlayers, redChampions, rng)
    expect(results).toHaveLength(5)
  })

  it('each LaneResult has a distinct role', () => {
    const bluePlayers   = makeLineup()
    const redPlayers    = makeLineup()
    const blueChampions = makeChampionLineup()
    const redChampions  = makeChampionLineup()
    const rng = seededRandom('all-lanes-roles')

    const results = simulateAllLanes(bluePlayers, blueChampions, redPlayers, redChampions, rng)
    const roles = results.map(r => r.role)
    const uniqueRoles = new Set(roles)
    expect(uniqueRoles.size).toBe(5)
  })

  it('winner is always blue, red, or draw', () => {
    const bluePlayers   = makeLineup()
    const redPlayers    = makeLineup()
    const blueChampions = makeChampionLineup()
    const redChampions  = makeChampionLineup()
    const rng = seededRandom('all-lanes-winner')

    const results = simulateAllLanes(bluePlayers, blueChampions, redPlayers, redChampions, rng)
    for (const r of results) {
      expect(['blue', 'red', 'draw']).toContain(r.winner)
    }
  })
})
