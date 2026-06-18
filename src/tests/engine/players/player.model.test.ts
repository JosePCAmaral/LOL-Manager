import { describe, it, expect } from 'vitest'
import {
  getPlayerOverallRating,
  getPlayerRoleScore,
  isPlayerAvailable,
  getTopChampion,
} from '@engine/players/player.model'
import { makePlayer } from '../helpers'

describe('getPlayerOverallRating', () => {
  it('returns a value in [1, 20] for default player', () => {
    const p = makePlayer()
    const rating = getPlayerOverallRating(p)
    expect(rating).toBeGreaterThanOrEqual(1)
    expect(rating).toBeLessThanOrEqual(20)
  })

  it('returns 1 when all attributes are at minimum', () => {
    const p = makePlayer({
      attributes: {
        mechanics: 1, laning: 1, teamfight: 1, gameSense: 1,
        shotcalling: 1, metaAdaptation: 1, consistency: 1, resilience: 1,
      },
    })
    expect(getPlayerOverallRating(p)).toBe(1)
  })

  it('returns 20 when all attributes are at maximum', () => {
    const p = makePlayer({
      attributes: {
        mechanics: 20, laning: 20, teamfight: 20, gameSense: 20,
        shotcalling: 20, metaAdaptation: 20, consistency: 20, resilience: 20,
      },
    })
    expect(getPlayerOverallRating(p)).toBe(20)
  })

  it('mechanics and gameSense weigh more than laning — overall > simple mean when only those are high', () => {
    // mechanics=15, gameSense=15, all others=1
    // Simple mean = (15+1+1+15+1+1+1+1)/8 = 36/8 = 4.5
    // Weighted (mechanics×1.5, gameSense×1.5, others×1.0):
    //   numerator = 15×1.5 + 1×1.0 + 1×1.0 + 15×1.5 + 1×1.0 + 1×1.0 + 1×1.0 + 1×1.0
    //             = 22.5 + 1 + 1 + 22.5 + 1 + 1 + 1 + 1 = 51
    //   denominator = 1.5+1+1+1.5+1+1+1+1 = 9
    //   weighted avg = 51/9 ≈ 5.667
    // 5.667 > 4.5 — heavier weight lifts the overall above the simple mean
    const p = makePlayer({
      attributes: {
        mechanics: 15, laning: 1, teamfight: 1, gameSense: 15,
        shotcalling: 1, metaAdaptation: 1, consistency: 1, resilience: 1,
      },
    })
    const simpleMean = (15 + 1 + 1 + 15 + 1 + 1 + 1 + 1) / 8
    const overall = getPlayerOverallRating(p)
    expect(overall).toBeGreaterThan(simpleMean)
  })

  it('result is rounded to 1 decimal place', () => {
    const p = makePlayer()
    const rating = getPlayerOverallRating(p)
    // Check that rounding to 1 decimal doesn't change it
    expect(rating).toBe(Math.round(rating * 10) / 10)
  })
})

describe('getPlayerRoleScore', () => {
  it('TOP: high resilience+laning scores higher than high mechanics+gameSense', () => {
    const focal = makePlayer({
      role: 'TOP',
      attributes: {
        mechanics: 1, laning: 20, teamfight: 1, gameSense: 1,
        shotcalling: 1, metaAdaptation: 1, consistency: 1, resilience: 20,
      },
    })
    const nonFocal = makePlayer({
      role: 'TOP',
      attributes: {
        mechanics: 20, laning: 1, teamfight: 20, gameSense: 1,
        shotcalling: 1, metaAdaptation: 1, consistency: 1, resilience: 1,
      },
    })
    expect(getPlayerRoleScore(focal)).toBeGreaterThan(getPlayerRoleScore(nonFocal))
  })

  it('JUNGLE: high gameSense+mechanics scores higher than laning+teamfight', () => {
    const focal = makePlayer({
      role: 'JUNGLE',
      attributes: {
        mechanics: 20, laning: 1, teamfight: 1, gameSense: 20,
        shotcalling: 1, metaAdaptation: 1, consistency: 1, resilience: 1,
      },
    })
    const nonFocal = makePlayer({
      role: 'JUNGLE',
      attributes: {
        mechanics: 1, laning: 20, teamfight: 20, gameSense: 1,
        shotcalling: 1, metaAdaptation: 1, consistency: 1, resilience: 1,
      },
    })
    expect(getPlayerRoleScore(focal)).toBeGreaterThan(getPlayerRoleScore(nonFocal))
  })

  it('MID: high mechanics+metaAdaptation scores higher than laning+teamfight', () => {
    const focal = makePlayer({
      role: 'MID',
      attributes: {
        mechanics: 20, laning: 1, teamfight: 1, gameSense: 1,
        shotcalling: 1, metaAdaptation: 20, consistency: 1, resilience: 1,
      },
    })
    const nonFocal = makePlayer({
      role: 'MID',
      attributes: {
        mechanics: 1, laning: 20, teamfight: 20, gameSense: 1,
        shotcalling: 1, metaAdaptation: 1, consistency: 1, resilience: 1,
      },
    })
    expect(getPlayerRoleScore(focal)).toBeGreaterThan(getPlayerRoleScore(nonFocal))
  })

  it('ADC: high mechanics+consistency scores higher than gameSense+shotcalling', () => {
    const focal = makePlayer({
      role: 'ADC',
      attributes: {
        mechanics: 20, laning: 1, teamfight: 1, gameSense: 1,
        shotcalling: 1, metaAdaptation: 1, consistency: 20, resilience: 1,
      },
    })
    const nonFocal = makePlayer({
      role: 'ADC',
      attributes: {
        mechanics: 1, laning: 1, teamfight: 1, gameSense: 20,
        shotcalling: 20, metaAdaptation: 1, consistency: 1, resilience: 1,
      },
    })
    expect(getPlayerRoleScore(focal)).toBeGreaterThan(getPlayerRoleScore(nonFocal))
  })

  it('SUPPORT: high shotcalling+gameSense scores higher than mechanics+laning', () => {
    const focal = makePlayer({
      role: 'SUPPORT',
      attributes: {
        mechanics: 1, laning: 1, teamfight: 1, gameSense: 20,
        shotcalling: 20, metaAdaptation: 1, consistency: 1, resilience: 1,
      },
    })
    const nonFocal = makePlayer({
      role: 'SUPPORT',
      attributes: {
        mechanics: 20, laning: 20, teamfight: 1, gameSense: 1,
        shotcalling: 1, metaAdaptation: 1, consistency: 1, resilience: 1,
      },
    })
    expect(getPlayerRoleScore(focal)).toBeGreaterThan(getPlayerRoleScore(nonFocal))
  })
})

describe('isPlayerAvailable', () => {
  it('returns true when player has a contract and is a starter', () => {
    const p = makePlayer({ contract: { playerId: 'p1', teamId: 'team1', salary: 5000, startDate: { year: 1, dayOfYear: 1 }, endDate: { year: 2, dayOfYear: 1 }, buyoutClause: 0 }, isStarter: true })
    expect(isPlayerAvailable(p)).toBe(true)
  })

  it('returns false when contract is null', () => {
    const p = makePlayer({ contract: null, isStarter: true })
    expect(isPlayerAvailable(p)).toBe(false)
  })

  it('returns false when isStarter is false', () => {
    const p = makePlayer({ isStarter: false })
    expect(isPlayerAvailable(p)).toBe(false)
  })

  it('returns false when both contract is null and not a starter', () => {
    const p = makePlayer({ contract: null, isStarter: false })
    expect(isPlayerAvailable(p)).toBe(false)
  })
})

describe('getTopChampion', () => {
  it('returns null for an empty champion pool', () => {
    const p = makePlayer({ championPool: [] })
    expect(getTopChampion(p)).toBeNull()
  })

  it('returns the championId with the highest masteryLevel', () => {
    const p = makePlayer({
      championPool: [
        { championId: 'c1', masteryLevel: 5 },
        { championId: 'c2', masteryLevel: 18 },
        { championId: 'c3', masteryLevel: 12 },
      ],
    })
    expect(getTopChampion(p)).toBe('c2')
  })

  it('returns the only champion when pool has one entry', () => {
    const p = makePlayer({
      championPool: [{ championId: 'only', masteryLevel: 7 }],
    })
    expect(getTopChampion(p)).toBe('only')
  })

  it('returns first encountered when masteryLevels are tied', () => {
    // With equal mastery, the first one in the array wins (stable comparison)
    const p = makePlayer({
      championPool: [
        { championId: 'first', masteryLevel: 10 },
        { championId: 'second', masteryLevel: 10 },
      ],
    })
    expect(getTopChampion(p)).toBe('first')
  })
})
