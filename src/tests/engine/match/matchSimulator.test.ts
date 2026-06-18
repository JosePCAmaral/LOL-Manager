/**
 * matchSimulator.test.ts
 *
 * Validates matchSimulator.ts against docs/simulacao_e_draft.md sections 3–7.
 * This is the critical integration test: it exercises the full simulation pipeline.
 */

import { describe, it, expect } from 'vitest'
import { simulateMatch, determineWinner } from '@engine/match/matchSimulator'
import { seededRandom } from '@engine/core/rng'
import type { Player, Champion, Role, DraftResult } from '@types-app/index'
import type { SimulateMatchParams } from '@engine/match/matchSimulator'
import type { LaneResult } from '@engine/match/phases/laningPhase'
import type { MidGameResult } from '@engine/match/phases/midGamePhase'
import type { TeamfightResult } from '@engine/match/phases/teamfightPhase'

// ---------------------------------------------------------------------------
// Local factories
// ---------------------------------------------------------------------------

function makeChampion(id: string, scalingCurve: Champion['scalingCurve'] = 'mid', overrides: Partial<Champion> = {}): Champion {
  return {
    id,
    name: `Champ-${id}`,
    eligibleRoles: ['MID'],
    damageType: 'magic',
    range: 1,
    earlyPower: 1,
    sustain: 1,
    mobility: 1,
    scalingCurve,
    compTags: { engage: 1, peel: 1, waveClear: 1, ccChain: 1 },
    ...overrides,
  }
}

function makePlayer(role: Role, attrs: Partial<Player['attributes']> = {}, id?: string): Player {
  return {
    id: id ?? `p-${role}`,
    name: `Player-${role}`,
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
    championPool: [
      { championId: 'champ-0', masteryLevel: 10 },
      { championId: 'champ-1', masteryLevel: 10 },
      { championId: 'champ-2', masteryLevel: 10 },
      { championId: 'champ-3', masteryLevel: 10 },
      { championId: 'champ-4', masteryLevel: 10 },
    ],
    potential: 80,
    morale: 70,
    stamina: 80,
    burnoutRisk: 10,
    contract: null,
    teamId: 'team-a',
    isStarter: true,
  }
}

const ROLES: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

function makeLineup(attrs: Partial<Player['attributes']> = {}, teamPrefix = 'blue'): Player[] {
  return ROLES.map((r, i) => makePlayer(r, attrs, `${teamPrefix}-p${i}`))
}

function makeChampionLineup(scalingCurve: Champion['scalingCurve'] = 'mid'): Champion[] {
  return Array.from({ length: 5 }, (_, i) => makeChampion(`champ-${i}`, scalingCurve))
}

const DRAFT: DraftResult = {
  bans: { blue: ['ban1', 'ban2', 'ban3'], red: ['ban4', 'ban5', 'ban6'] },
  picks: {
    blue: { TOP: 'champ-0', JUNGLE: 'champ-1', MID: 'champ-2', ADC: 'champ-3', SUPPORT: 'champ-4' },
    red:  { TOP: 'champ-0', JUNGLE: 'champ-1', MID: 'champ-2', ADC: 'champ-3', SUPPORT: 'champ-4' },
  },
}

function makeParams(overrides: Partial<SimulateMatchParams> = {}): SimulateMatchParams {
  return {
    matchId:      'match-001',
    leagueId:     'league-001',
    date:         { year: 1, dayOfYear: 10 },
    blueTeamId:   'team-blue',
    redTeamId:    'team-red',
    bluePlayers:  makeLineup({}, 'blue'),
    redPlayers:   makeLineup({}, 'red'),
    blueChampions: makeChampionLineup(),
    redChampions:  makeChampionLineup(),
    draft:        DRAFT,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Determinism — core requirement
// ---------------------------------------------------------------------------

describe('simulateMatch — determinism', () => {
  it('same seed produces identical result (winner, timeline length, first 5 events)', () => {
    const params = makeParams()
    const rng1 = seededRandom('determinism-seed-42')
    const rng2 = seededRandom('determinism-seed-42')

    const result1 = simulateMatch(params, rng1)
    const result2 = simulateMatch(params, rng2)

    expect(result1.winner).toBe(result2.winner)
    expect(result1.timeline.length).toBe(result2.timeline.length)

    const first5 = Math.min(5, result1.timeline.length)
    for (let i = 0; i < first5; i++) {
      expect(result1.timeline[i]).toEqual(result2.timeline[i])
    }
  })
})

// ---------------------------------------------------------------------------
// MatchResult structural properties
// ---------------------------------------------------------------------------

describe('simulateMatch — MatchResult properties', () => {
  it('winner is always blueTeamId or redTeamId', () => {
    const params = makeParams()
    const rng = seededRandom('winner-type')
    const result = simulateMatch(params, rng)

    expect([params.blueTeamId, params.redTeamId]).toContain(result.winner)
  })

  it('timeline is sorted by time ascending', () => {
    const params = makeParams()
    const rng = seededRandom('timeline-sorted')
    const result = simulateMatch(params, rng)

    for (let i = 1; i < result.timeline.length; i++) {
      expect(result.timeline[i].time).toBeGreaterThanOrEqual(result.timeline[i - 1].time)
    }
  })

  it('timeline contains at least 1 event', () => {
    const params = makeParams()
    const rng = seededRandom('timeline-not-empty')
    const result = simulateMatch(params, rng)

    expect(result.timeline.length).toBeGreaterThan(0)
  })

  it('result.draft reflects the DraftResult passed as input', () => {
    const params = makeParams()
    const rng = seededRandom('draft-reflected')
    const result = simulateMatch(params, rng)

    expect(result.draft).toEqual(DRAFT)
  })

  it('result.teamA === blueTeamId and result.teamB === redTeamId', () => {
    const params = makeParams()
    const rng = seededRandom('team-ids')
    const result = simulateMatch(params, rng)

    expect(result.teamA).toBe(params.blueTeamId)
    expect(result.teamB).toBe(params.redTeamId)
  })

  it('result.id and result.leagueId match input', () => {
    const params = makeParams()
    const rng = seededRandom('ids-match')
    const result = simulateMatch(params, rng)

    expect(result.id).toBe(params.matchId)
    expect(result.leagueId).toBe(params.leagueId)
  })
})

// ---------------------------------------------------------------------------
// determineWinner — phase weight logic (section 6 + 7)
// ---------------------------------------------------------------------------

describe('determineWinner — phase weight invariants', () => {
  /** Creates lane results that give a specific team a guaranteed advantage. */
  function makeLaneResults(blueDominates: boolean): LaneResult[] {
    return ROLES.map(role => {
      const blueScore = blueDominates ? 20 : 1
      const redScore  = blueDominates ? 1  : 20
      return {
        role,
        blueScore,
        redScore,
        winner: (blueDominates ? 'blue' : 'red') as 'blue' | 'red',
        goldDiff: (blueScore - redScore) * 15,
      }
    })
  }

  function makeMidResult(blueDominates: boolean): MidGameResult {
    return {
      blueObjectives: blueDominates ? 4 : 0,
      redObjectives:  blueDominates ? 0 : 4,
      blueGoldLead:   blueDominates ? 1200 : 0,
      redGoldLead:    blueDominates ? 0    : 1200,
      winner:         blueDominates ? 'blue' : 'red',
      blueMacroScore: blueDominates ? 20 : 1,
      redMacroScore:  blueDominates ? 1  : 20,
    }
  }

  function makeTfResult(blueDominates: boolean): TeamfightResult {
    return {
      blueWins: blueDominates ? 5 : 0,
      redWins:  blueDominates ? 0 : 5,
      winner:   blueDominates ? 'blue' : 'red',
      damageDealt: { blue: blueDominates ? 2000 : 100, red: blueDominates ? 100 : 2000 },
      blueTeamfightScore: blueDominates ? 20 : 1,
      redTeamfightScore:  blueDominates ? 1  : 20,
    }
  }

  it('blue with overwhelming advantage in all 3 phases wins 100/100 times', () => {
    const lanes = makeLaneResults(true)
    const mid   = makeMidResult(true)
    const tf    = makeTfResult(true)

    let blueWins = 0
    for (let i = 0; i < 100; i++) {
      const rng = seededRandom(`blue-dominant-${i}`)
      const winner = determineWinner('team-blue', 'team-red', lanes, mid, tf, rng)
      if (winner === 'team-blue') blueWins++
    }
    expect(blueWins).toBe(100)
  })

  it('red with overwhelming advantage in all 3 phases wins 100/100 times', () => {
    const lanes = makeLaneResults(false)
    const mid   = makeMidResult(false)
    const tf    = makeTfResult(false)

    let redWins = 0
    for (let i = 0; i < 100; i++) {
      const rng = seededRandom(`red-dominant-${i}`)
      const winner = determineWinner('team-blue', 'team-red', lanes, mid, tf, rng)
      if (winner === 'team-red') redWins++
    }
    expect(redWins).toBe(100)
  })

  it('balanced teams produce 40–60% win rate for blue across 200 seeds', () => {
    const neutralLanes: LaneResult[] = ROLES.map(role => ({
      role, blueScore: 10, redScore: 10, winner: 'draw', goldDiff: 0,
    }))
    const neutralMid: MidGameResult = {
      blueObjectives: 2, redObjectives: 2,
      blueGoldLead: 0, redGoldLead: 0,
      winner: 'draw', blueMacroScore: 10, redMacroScore: 10,
    }
    const neutralTf: TeamfightResult = {
      blueWins: 2, redWins: 3,
      winner: 'red',
      damageDealt: { blue: 500, red: 500 },
      blueTeamfightScore: 10,
      redTeamfightScore: 10,
    }

    let blueWins = 0
    for (let i = 0; i < 200; i++) {
      const rng = seededRandom(`balanced-${i}`)
      const winner = determineWinner('team-blue', 'team-red', neutralLanes, neutralMid, neutralTf, rng)
      if (winner === 'team-blue') blueWins++
    }

    const blueWinRate = blueWins / 200
    expect(blueWinRate).toBeGreaterThan(0.3)
    expect(blueWinRate).toBeLessThan(0.7)
  })
})

// ---------------------------------------------------------------------------
// Different seeds produce different results
// ---------------------------------------------------------------------------

describe('simulateMatch — seed variance', () => {
  it('50 different seeds produce at least 2 different outcomes', () => {
    const params = makeParams()
    const outcomes = new Set<string>()

    for (let i = 0; i < 50; i++) {
      const rng = seededRandom(`varied-seed-${i}`)
      const result = simulateMatch(params, rng)
      outcomes.add(result.winner)
    }

    expect(outcomes.size).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// Immutability
// ---------------------------------------------------------------------------

describe('simulateMatch — immutability', () => {
  it('bluePlayers are not mutated', () => {
    const params = makeParams()
    const blueOriginal = JSON.stringify(params.bluePlayers)
    const rng = seededRandom('immutability-blue')
    simulateMatch(params, rng)
    expect(JSON.stringify(params.bluePlayers)).toBe(blueOriginal)
  })

  it('redPlayers are not mutated', () => {
    const params = makeParams()
    const redOriginal = JSON.stringify(params.redPlayers)
    const rng = seededRandom('immutability-red')
    simulateMatch(params, rng)
    expect(JSON.stringify(params.redPlayers)).toBe(redOriginal)
  })

  it('blueChampions are not mutated', () => {
    const params = makeParams()
    const blueChampOriginal = JSON.stringify(params.blueChampions)
    const rng = seededRandom('immutability-blue-champ')
    simulateMatch(params, rng)
    expect(JSON.stringify(params.blueChampions)).toBe(blueChampOriginal)
  })

  it('redChampions are not mutated', () => {
    const params = makeParams()
    const redChampOriginal = JSON.stringify(params.redChampions)
    const rng = seededRandom('immutability-red-champ')
    simulateMatch(params, rng)
    expect(JSON.stringify(params.redChampions)).toBe(redChampOriginal)
  })
})

// ---------------------------------------------------------------------------
// Logistic probability formula — section 6
// ---------------------------------------------------------------------------

describe('logistic probability formula — section 6', () => {
  it('VantagemTotal=0 → ProbVitoria_A ≈ 0.5 (symmetric)', () => {
    // With equal scores, VantagemTotal = 0 → prob = 1/(1+e^0) = 0.5
    // Over many seeds blue and red should each win ~50% of matches.
    const params = makeParams({
      bluePlayers:  makeLineup({ mechanics: 10, laning: 10, gameSense: 10, teamfight: 10, shotcalling: 10 }, 'blue'),
      redPlayers:   makeLineup({ mechanics: 10, laning: 10, gameSense: 10, teamfight: 10, shotcalling: 10 }, 'red'),
      blueChampions: makeChampionLineup('mid'),
      redChampions:  makeChampionLineup('mid'),
    })

    let blueWins = 0
    for (let i = 0; i < 200; i++) {
      const rng = seededRandom(`logistic-equal-${i}`)
      const result = simulateMatch(params, rng)
      if (result.winner === params.blueTeamId) blueWins++
    }

    const rate = blueWins / 200
    expect(rate).toBeGreaterThan(0.35)
    expect(rate).toBeLessThan(0.65)
  })
})
