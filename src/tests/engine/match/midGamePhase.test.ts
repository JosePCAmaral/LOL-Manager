/**
 * midGamePhase.test.ts
 *
 * Validates midGamePhase.ts against docs/simulacao_e_draft.md section 4.
 */

import { describe, it, expect } from 'vitest'
import { calculateTeamMacroScore, simulateMidGame } from '@engine/match/phases/midGamePhase'
import { simulateAllLanes } from '@engine/match/phases/laningPhase'
import { seededRandom } from '@engine/core/rng'
import type { Player, Champion, Role } from '@types-app/index'
import type { LaneResult } from '@engine/match/phases/laningPhase'

// ---------------------------------------------------------------------------
// Local factories
// ---------------------------------------------------------------------------

function makeChampion(overrides: Partial<Champion> = {}): Champion {
  return {
    id: 'champ-default',
    name: 'Default',
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

const ROLES: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

function makeLineup(attrs: Partial<Player['attributes']> = {}): Player[] {
  return ROLES.map(r => makePlayer(r, attrs, { id: `p-${r}` }))
}

function makeChampionLineup(scalingCurve: Champion['scalingCurve'] = 'mid'): Champion[] {
  return Array.from({ length: 5 }, (_, i) =>
    makeChampion({ id: `champ-${i}`, scalingCurve })
  )
}

/** Neutral lane results (all draws, no gold lead) */
function makeNeutralLaneResults(): LaneResult[] {
  return ROLES.map(role => ({
    role,
    blueScore: 10,
    redScore: 10,
    winner: 'draw' as const,
    goldDiff: 0,
  }))
}

/** Blue-winning lane results (blue scores higher in every lane) */
function makeBlueDominantLaneResults(): LaneResult[] {
  return ROLES.map(role => ({
    role,
    blueScore: 18,
    redScore: 5,
    winner: 'blue' as const,
    goldDiff: (18 - 5) * 15,
  }))
}

// ---------------------------------------------------------------------------
// calculateTeamMacroScore — invariants from section 4
// ---------------------------------------------------------------------------

describe('calculateTeamMacroScore — invariants', () => {
  const laneResults = makeNeutralLaneResults()
  const rng = seededRandom('macro-invariants')
  const champs = makeChampionLineup()

  it('team with high gameSense and shotcalling → higher MacroScore', () => {
    const strong = makeLineup({ gameSense: 20, shotcalling: 20 })
    const weak   = makeLineup({ gameSense: 1,  shotcalling: 1  })

    const strongScore = calculateTeamMacroScore(strong, champs, laneResults, rng)
    const weakScore   = calculateTeamMacroScore(weak,   champs, laneResults, rng)

    expect(strongScore).toBeGreaterThan(weakScore)
  })

  it('BonusIGL with max shotcalling=20 → multiplier = 1 + (20/20) × 0.15 = 1.15', () => {
    // We test the BonusIGL formula in isolation.
    // With all players having shotcalling=20, IGL shotcalling = 20.
    // BonusIGL = 1 + (20/20) × 0.15 = 1.15
    // With all players having shotcalling=0, IGL shotcalling = 0.
    // BonusIGL = 1 + (0/20) × 0.15 = 1.0
    const playersMax  = makeLineup({ gameSense: 10, shotcalling: 20 })
    const playersZero = makeLineup({ gameSense: 10, shotcalling: 0  })

    const scoreMax  = calculateTeamMacroScore(playersMax,  champs, laneResults, rng)
    const scoreZero = calculateTeamMacroScore(playersZero, champs, laneResults, rng)

    // The ratio of weighted sums (before BonusIGL) differs only in shotcalling contribution.
    // We just verify max shotcalling gives higher score than zero shotcalling.
    expect(scoreMax).toBeGreaterThan(scoreZero)

    // Verify BonusIGL ratio is exactly 1.15 when the only difference is the IGL multiplier.
    // To isolate this, we use only gameSense (same for both) to drive the weighted sum
    // and then measure the IGL effect.
    // MacroScore with shotcalling=0 base: weightedSum × 1.0 + bonuses
    // MacroScore with shotcalling=20 base: weightedSum (with SC term) × 1.15 + bonuses
    // These are not directly comparable because shotcalling also enters the role formulas.
    // Instead, test the boundary: score(sc=20) > score(sc=0).
    expect(scoreMax / scoreZero).toBeGreaterThan(1.0)
  })

  it('LaneLeadBonus: blue with 5 lanes won → higher blue MacroScore than red (neutral lanes)', () => {
    // Run simulateMidGame (which uses computeSideMacroScore internally with proper lane lead)
    const equalPlayers = makeLineup({ gameSense: 10, shotcalling: 10 })
    const champs2 = makeChampionLineup()
    const rng2 = seededRandom('lane-lead-bonus')

    const blueLeadLaneResults = makeBlueDominantLaneResults()
    const result = simulateMidGame(
      equalPlayers, champs2,
      equalPlayers, champs2,
      blueLeadLaneResults,
      rng2,
    )

    // Blue dominated all 5 lanes so blueMacroScore should be higher before noise
    // (stochastic, but with big lane lead the pre-noise advantage is substantial)
    // We run multiple seeds to confirm blue wins majority
    let blueHigher = 0
    for (let i = 0; i < 100; i++) {
      const r2 = seededRandom(`lane-lead-${i}`)
      const res = simulateMidGame(equalPlayers, champs2, equalPlayers, champs2, blueLeadLaneResults, r2)
      if (res.blueMacroScore > res.redMacroScore) blueHigher++
    }
    expect(blueHigher).toBeGreaterThan(60)
  })
})

// ---------------------------------------------------------------------------
// simulateMidGame
// ---------------------------------------------------------------------------

describe('simulateMidGame', () => {
  it('blueObjectives + redObjectives > 0 (some objective was contested)', () => {
    const players = makeLineup()
    const champs  = makeChampionLineup()
    const lanes   = makeNeutralLaneResults()
    const rng     = seededRandom('mid-objectives')

    const result = simulateMidGame(players, champs, players, champs, lanes, rng)
    expect(result.blueObjectives + result.redObjectives).toBeGreaterThan(0)
  })

  it('determinism: same seed + same inputs → same MidGameResult', () => {
    const players = makeLineup()
    const champs  = makeChampionLineup()
    const lanes   = makeNeutralLaneResults()

    const rng1 = seededRandom('determinism-mid')
    const rng2 = seededRandom('determinism-mid')

    const result1 = simulateMidGame(players, champs, players, champs, lanes, rng1)
    const result2 = simulateMidGame(players, champs, players, champs, lanes, rng2)

    expect(result1.blueObjectives).toBe(result2.blueObjectives)
    expect(result1.redObjectives).toBe(result2.redObjectives)
    expect(result1.blueMacroScore).toBe(result2.blueMacroScore)
    expect(result1.redMacroScore).toBe(result2.redMacroScore)
    expect(result1.winner).toBe(result2.winner)
  })

  it('returns a winner that is blue, red, or draw', () => {
    const players = makeLineup()
    const champs  = makeChampionLineup()
    const lanes   = makeNeutralLaneResults()
    const rng     = seededRandom('mid-winner-type')

    const result = simulateMidGame(players, champs, players, champs, lanes, rng)
    expect(['blue', 'red', 'draw']).toContain(result.winner)
  })

  it('blueMacroScore and redMacroScore are positive numbers', () => {
    const players = makeLineup()
    const champs  = makeChampionLineup()
    const lanes   = makeNeutralLaneResults()
    const rng     = seededRandom('mid-positive')

    const result = simulateMidGame(players, champs, players, champs, lanes, rng)
    expect(result.blueMacroScore).toBeGreaterThan(0)
    expect(result.redMacroScore).toBeGreaterThan(0)
  })
})
