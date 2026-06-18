import { describe, it, expect } from 'vitest'
import {
  generateRoundRobin,
  shuffleFixtures,
  getFixturesForTeam,
  getFixturesByDate,
} from '@engine/calendar/schedule'
import {
  REGULAR_SEASON_START_DAY,
  REGULAR_SEASON_END_DAY,
} from '@engine/calendar/season'
import { seededRandom } from '@engine/core/rng'
import { makeFixture } from '../helpers'

// ---------------------------------------------------------------------------
// generateRoundRobin
// ---------------------------------------------------------------------------

describe('generateRoundRobin', () => {
  const TEAMS_4 = ['t1', 't2', 't3', 't4']
  const TEAMS_6 = ['t1', 't2', 't3', 't4', 't5', 't6']

  it('N=4 teams → 4*(4-1)*2/2 = 12 fixtures (double round-robin)', () => {
    // For N teams double RR = N*(N-1) fixtures
    const fixtures = generateRoundRobin(TEAMS_4, 1)
    expect(fixtures).toHaveLength(4 * (4 - 1))
  })

  it('N=6 teams → 6*5 = 30 fixtures', () => {
    const fixtures = generateRoundRobin(TEAMS_6, 1)
    expect(fixtures).toHaveLength(6 * 5)
  })

  it('each pair of teams plays exactly 2 times (once home, once away)', () => {
    const fixtures = generateRoundRobin(TEAMS_4, 1)
    for (const a of TEAMS_4) {
      for (const b of TEAMS_4) {
        if (a === b) continue
        const homeGames = fixtures.filter(f => f.teamA === a && f.teamB === b)
        expect(homeGames).toHaveLength(1)
      }
    }
  })

  it('no team plays against itself', () => {
    const fixtures = generateRoundRobin(TEAMS_6, 1)
    for (const f of fixtures) {
      expect(f.teamA).not.toBe(f.teamB)
    }
  })

  it('all fixtures have played === false', () => {
    const fixtures = generateRoundRobin(TEAMS_4, 1)
    for (const f of fixtures) {
      expect(f.played).toBe(false)
    }
  })

  it('all fixture dates are within [REGULAR_SEASON_START_DAY, REGULAR_SEASON_END_DAY]', () => {
    const fixtures = generateRoundRobin(TEAMS_4, 1)
    for (const f of fixtures) {
      expect(f.date.dayOfYear).toBeGreaterThanOrEqual(REGULAR_SEASON_START_DAY)
      expect(f.date.dayOfYear).toBeLessThanOrEqual(REGULAR_SEASON_END_DAY)
    }
  })

  it('all fixtures belong to the specified year', () => {
    const fixtures = generateRoundRobin(TEAMS_4, 3)
    for (const f of fixtures) {
      expect(f.date.year).toBe(3)
    }
  })

  it('returns empty array for fewer than 2 teams', () => {
    expect(generateRoundRobin([], 1)).toHaveLength(0)
    expect(generateRoundRobin(['only-one'], 1)).toHaveLength(0)
  })

  it('deterministic: same inputs → same fixtures', () => {
    const r1 = generateRoundRobin(TEAMS_4, 1)
    const r2 = generateRoundRobin(TEAMS_4, 1)
    expect(r1).toEqual(r2)
  })

  it('odd number of teams: each team plays N-1 home and N-1 away games', () => {
    // 5 teams → double RR = 5*4 = 20 fixtures
    const TEAMS_5 = ['t1', 't2', 't3', 't4', 't5']
    const fixtures = generateRoundRobin(TEAMS_5, 1)
    expect(fixtures).toHaveLength(5 * 4)
    for (const team of TEAMS_5) {
      const home = fixtures.filter(f => f.teamA === team).length
      const away = fixtures.filter(f => f.teamB === team).length
      expect(home).toBe(4)
      expect(away).toBe(4)
    }
  })
})

// ---------------------------------------------------------------------------
// getFixturesForTeam
// ---------------------------------------------------------------------------

describe('getFixturesForTeam', () => {
  it('returns only fixtures involving the given team', () => {
    const f1 = makeFixture({ id: 'f1', teamA: 'team1', teamB: 'team2' })
    const f2 = makeFixture({ id: 'f2', teamA: 'team3', teamB: 'team1' })
    const f3 = makeFixture({ id: 'f3', teamA: 'team2', teamB: 'team3' })
    const result = getFixturesForTeam([f1, f2, f3], 'team1')
    expect(result).toHaveLength(2)
    expect(result.map(f => f.id)).toContain('f1')
    expect(result.map(f => f.id)).toContain('f2')
    expect(result.map(f => f.id)).not.toContain('f3')
  })

  it('returns empty array when team has no fixtures', () => {
    const f1 = makeFixture({ teamA: 'team2', teamB: 'team3' })
    expect(getFixturesForTeam([f1], 'team1')).toHaveLength(0)
  })

  it('returns empty array for empty fixture list', () => {
    expect(getFixturesForTeam([], 'team1')).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// getFixturesByDate
// ---------------------------------------------------------------------------

describe('getFixturesByDate', () => {
  it('returns only fixtures on the exact date', () => {
    const f1 = makeFixture({ id: 'f1', date: { year: 1, dayOfYear: 20 } })
    const f2 = makeFixture({ id: 'f2', date: { year: 1, dayOfYear: 21 } })
    const f3 = makeFixture({ id: 'f3', date: { year: 1, dayOfYear: 20 } })

    const result = getFixturesByDate([f1, f2, f3], { year: 1, dayOfYear: 20 })
    expect(result).toHaveLength(2)
    expect(result.map(f => f.id)).toContain('f1')
    expect(result.map(f => f.id)).toContain('f3')
  })

  it('returns empty array when no fixtures are on the date', () => {
    const f1 = makeFixture({ date: { year: 1, dayOfYear: 30 } })
    expect(getFixturesByDate([f1], { year: 1, dayOfYear: 20 })).toHaveLength(0)
  })

  it('distinguishes by year — same dayOfYear different year returns nothing', () => {
    const f1 = makeFixture({ date: { year: 2, dayOfYear: 20 } })
    expect(getFixturesByDate([f1], { year: 1, dayOfYear: 20 })).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// shuffleFixtures
// ---------------------------------------------------------------------------

describe('shuffleFixtures', () => {
  it('output has the same number of fixtures', () => {
    const fixtures = generateRoundRobin(['t1', 't2', 't3', 't4'], 1)
    const rng = seededRandom('shuffle-test')
    const shuffled = shuffleFixtures(fixtures, rng)
    expect(shuffled).toHaveLength(fixtures.length)
  })

  it('all original fixture IDs are present after shuffle (no loss)', () => {
    const fixtures = generateRoundRobin(['t1', 't2', 't3', 't4'], 1)
    const originalIds = new Set(fixtures.map(f => f.id))
    const rng = seededRandom('shuffle-ids')
    const shuffled = shuffleFixtures(fixtures, rng)
    const shuffledIds = new Set(shuffled.map(f => f.id))
    expect(shuffledIds).toEqual(originalIds)
  })

  it('does not mutate the original array', () => {
    const fixtures = generateRoundRobin(['t1', 't2', 't3', 't4'], 1)
    const originalOrder = fixtures.map(f => f.id)
    const rng = seededRandom('shuffle-immut')
    shuffleFixtures(fixtures, rng)
    expect(fixtures.map(f => f.id)).toEqual(originalOrder)
  })

  it('is deterministic with the same seed', () => {
    const fixtures = generateRoundRobin(['t1', 't2', 't3', 't4'], 1)
    const r1 = shuffleFixtures(fixtures, seededRandom('same-seed'))
    const r2 = shuffleFixtures(fixtures, seededRandom('same-seed'))
    expect(r1.map(f => f.id)).toEqual(r2.map(f => f.id))
  })
})
