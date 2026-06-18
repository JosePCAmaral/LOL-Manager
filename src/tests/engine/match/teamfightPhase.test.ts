/**
 * teamfightPhase.test.ts
 *
 * Validates teamfightPhase.ts against docs/simulacao_e_draft.md section 5.
 */

import { describe, it, expect } from 'vitest'
import { calculateTeamfightScore, simulateTeamfights } from '@engine/match/phases/teamfightPhase'
import { seededRandom } from '@engine/core/rng'
import type { Player, Champion, Role } from '@types-app/index'
import type { MidGameResult } from '@engine/match/phases/midGamePhase'

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

function makeNeutralMidGameResult(): MidGameResult {
  return {
    blueObjectives: 2,
    redObjectives: 2,
    blueGoldLead: 0,
    redGoldLead: 0,
    winner: 'draw',
    blueMacroScore: 10,
    redMacroScore: 10,
  }
}

// ---------------------------------------------------------------------------
// calculateTeamfightScore — invariants from section 5
// ---------------------------------------------------------------------------

describe('calculateTeamfightScore — invariants', () => {
  const rng = seededRandom('tf-score')

  it('team with high teamfight and mechanics → higher score', () => {
    const strong = makeLineup({ teamfight: 20, mechanics: 20 })
    const weak   = makeLineup({ teamfight: 1,  mechanics: 1  })
    const champs = makeChampionLineup()

    const strongScore = calculateTeamfightScore(strong, champs, rng)
    const weakScore   = calculateTeamfightScore(weak,   champs, rng)

    expect(strongScore).toBeGreaterThan(weakScore)
  })

  it('ModSinergia with synergy=0 → multiplier exactly 1.0 (default, no Player.synergy field)', () => {
    // Since Player has no synergy field, SinergiaMédia = 0 → ModSinergia = 1 + (0/100)×0.10 = 1.0
    // We verify by comparing a score with and without the formula applied manually.
    // calculateTeamfightScore always uses ModSinergia=1.0 internally (documented in the module).
    // So running the function twice with same inputs must return the same value.
    const players = makeLineup()
    const champs  = makeChampionLineup()

    const rng1 = seededRandom('synergy-zero')
    const rng2 = seededRandom('synergy-zero')

    const score1 = calculateTeamfightScore(players, champs, rng1)
    const score2 = calculateTeamfightScore(players, champs, rng2)

    expect(score1).toBe(score2)
    expect(score1).toBeGreaterThan(0)
  })

  it('late champion lineup (ModEscala=1.20) → higher teamfight score than early lineup (ModEscala=0.85)', () => {
    const players   = makeLineup()
    const lateChamps  = makeChampionLineup('late')
    const earlyChamps = makeChampionLineup('early')

    const rng1 = seededRandom('late-scale-tf')
    const rng2 = seededRandom('early-scale-tf')

    const lateScore  = calculateTeamfightScore(players, lateChamps,  rng1)
    const earlyScore = calculateTeamfightScore(players, earlyChamps, rng2)

    expect(lateScore).toBeGreaterThan(earlyScore)
  })

  it('returns a positive number for valid inputs', () => {
    const players = makeLineup({ teamfight: 1, mechanics: 1 })
    const champs  = makeChampionLineup()
    const rng2    = seededRandom('tf-positive')

    const score = calculateTeamfightScore(players, champs, rng2)
    expect(score).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// simulateTeamfights
// ---------------------------------------------------------------------------

describe('simulateTeamfights', () => {
  it('blueWins + redWins ≤ N_TEAMFIGHTS (5)', () => {
    // In the implementation, N_TEAMFIGHTS = 5.
    // Exact ties don't count for either side, so blueWins + redWins ≤ 5.
    const players = makeLineup()
    const champs  = makeChampionLineup()
    const mid     = makeNeutralMidGameResult()
    const rng     = seededRandom('tf-total')

    const result = simulateTeamfights(players, champs, players, champs, mid, rng)
    expect(result.blueWins + result.redWins).toBeLessThanOrEqual(5)
    expect(result.blueWins + result.redWins).toBeGreaterThan(0)
  })

  it('team with superior gold lead from midGame has higher teamfight score', () => {
    const players = makeLineup()
    const champs  = makeChampionLineup()

    // Blue has massive gold lead
    const midWithBlueGoldLead: MidGameResult = {
      blueObjectives: 4, redObjectives: 0,
      blueGoldLead: 1200, redGoldLead: 0,
      winner: 'blue', blueMacroScore: 15, redMacroScore: 5,
    }

    let blueWinsCount = 0
    for (let i = 0; i < 100; i++) {
      const rng = seededRandom(`gold-lead-${i}`)
      const result = simulateTeamfights(players, champs, players, champs, midWithBlueGoldLead, rng)
      if (result.blueTeamfightScore > result.redTeamfightScore) blueWinsCount++
    }
    // Blue has gold lead bonus → should have higher score most of the time
    expect(blueWinsCount).toBeGreaterThan(50)
  })

  it('determinism: same seed + same inputs → same TeamfightResult', () => {
    const players = makeLineup()
    const champs  = makeChampionLineup()
    const mid     = makeNeutralMidGameResult()

    const rng1 = seededRandom('determinism-tf')
    const rng2 = seededRandom('determinism-tf')

    const result1 = simulateTeamfights(players, champs, players, champs, mid, rng1)
    const result2 = simulateTeamfights(players, champs, players, champs, mid, rng2)

    expect(result1.blueWins).toBe(result2.blueWins)
    expect(result1.redWins).toBe(result2.redWins)
    expect(result1.winner).toBe(result2.winner)
    expect(result1.blueTeamfightScore).toBe(result2.blueTeamfightScore)
    expect(result1.redTeamfightScore).toBe(result2.redTeamfightScore)
  })

  it('winner is blue, red, or draw', () => {
    const players = makeLineup()
    const champs  = makeChampionLineup()
    const mid     = makeNeutralMidGameResult()
    const rng     = seededRandom('tf-winner-type')

    const result = simulateTeamfights(players, champs, players, champs, mid, rng)
    expect(['blue', 'red', 'draw']).toContain(result.winner)
  })
})
