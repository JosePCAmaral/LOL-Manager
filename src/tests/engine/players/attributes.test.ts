import { describe, it, expect } from 'vitest'
import {
  applyAttributeCap,
  calculateAttributeGrowth,
  applyTrainingBonus,
} from '@engine/players/attributes'
import { seededRandom } from '@engine/core/rng'
import { makePlayer } from '../helpers'

describe('applyAttributeCap', () => {
  it('clamps value 0 to 1 (minimum)', () => {
    expect(applyAttributeCap(0)).toBe(1)
  })

  it('clamps negative values to 1', () => {
    expect(applyAttributeCap(-5)).toBe(1)
  })

  it('clamps value 21 to 20 (maximum)', () => {
    expect(applyAttributeCap(21)).toBe(20)
  })

  it('clamps very high values to 20', () => {
    expect(applyAttributeCap(999)).toBe(20)
  })

  it('returns 10 unchanged (mid-range)', () => {
    expect(applyAttributeCap(10)).toBe(10)
  })

  it('returns 1 unchanged (boundary minimum)', () => {
    expect(applyAttributeCap(1)).toBe(1)
  })

  it('returns 20 unchanged (boundary maximum)', () => {
    expect(applyAttributeCap(20)).toBe(20)
  })
})

describe('calculateAttributeGrowth', () => {
  it('always returns 0, 1, or 2', () => {
    const rng = seededRandom('growth-test')
    for (let i = 0; i < 500; i++) {
      const delta = calculateAttributeGrowth(10, 50, rng)
      expect([0, 1, 2]).toContain(delta)
    }
  })

  it('returns 0 when attribute is already at cap (20)', () => {
    // proximityPenalty = 20/20 = 1 → growthChance = 0 → always returns 0
    const rng = seededRandom('cap-test')
    for (let i = 0; i < 100; i++) {
      expect(calculateAttributeGrowth(20, 100, rng)).toBe(0)
    }
  })

  it('returns 0 when potential is 0', () => {
    const rng = seededRandom('zero-potential')
    for (let i = 0; i < 100; i++) {
      expect(calculateAttributeGrowth(5, 0, rng)).toBe(0)
    }
  })

  it('with potential=20 and attr=1, grows more often than with potential=1 (1000 samples)', () => {
    const seed = 'growth-comparison'
    const rng1 = seededRandom(seed)
    const rng2 = seededRandom(seed)

    let growthHighPotential = 0
    let growthLowPotential = 0
    const N = 1000

    for (let i = 0; i < N; i++) {
      if (calculateAttributeGrowth(1, 20, rng1) > 0) growthHighPotential++
    }
    for (let i = 0; i < N; i++) {
      if (calculateAttributeGrowth(1, 1, rng2) > 0) growthLowPotential++
    }

    expect(growthHighPotential).toBeGreaterThan(growthLowPotential)
  })
})

describe('applyTrainingBonus', () => {
  it('TOP: laning and resilience increase with intensity=1', () => {
    const p = makePlayer({ role: 'TOP' })
    const before = { ...p.attributes }
    const after = applyTrainingBonus(p.attributes, 'TOP', 1)
    expect(after.laning).toBeGreaterThan(before.laning)
    expect(after.resilience).toBeGreaterThan(before.resilience)
  })

  it('TOP with intensity=1: other attributes do not change', () => {
    const p = makePlayer({ role: 'TOP' })
    const before = p.attributes
    const after = applyTrainingBonus(before, 'TOP', 1)
    expect(after.mechanics).toBe(before.mechanics)
    expect(after.teamfight).toBe(before.teamfight)
    expect(after.gameSense).toBe(before.gameSense)
    expect(after.shotcalling).toBe(before.shotcalling)
    expect(after.metaAdaptation).toBe(before.metaAdaptation)
    expect(after.consistency).toBe(before.consistency)
  })

  it('JUNGLE: gameSense and mechanics increase with intensity=1', () => {
    const attrs = { mechanics: 10, laning: 10, teamfight: 10, gameSense: 10, shotcalling: 10, metaAdaptation: 10, consistency: 10, resilience: 10 }
    const after = applyTrainingBonus(attrs, 'JUNGLE', 1)
    expect(after.gameSense).toBeGreaterThan(attrs.gameSense)
    expect(after.mechanics).toBeGreaterThan(attrs.mechanics)
  })

  it('all attributes remain in [1,20] after training', () => {
    const highAttrs = { mechanics: 20, laning: 20, teamfight: 20, gameSense: 20, shotcalling: 20, metaAdaptation: 20, consistency: 20, resilience: 20 }
    const roles: Array<'TOP' | 'JUNGLE' | 'MID' | 'ADC' | 'SUPPORT'> = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']
    for (const role of roles) {
      const after = applyTrainingBonus(highAttrs, role, 1)
      for (const val of Object.values(after)) {
        expect(val).toBeGreaterThanOrEqual(1)
        expect(val).toBeLessThanOrEqual(20)
      }
    }
  })

  it('intensity=0 leaves all attributes unchanged', () => {
    const attrs = { mechanics: 10, laning: 10, teamfight: 10, gameSense: 10, shotcalling: 10, metaAdaptation: 10, consistency: 10, resilience: 10 }
    const after = applyTrainingBonus(attrs, 'TOP', 0)
    expect(after).toEqual(attrs)
  })

  it('does not mutate the original attributes object', () => {
    const attrs = { mechanics: 10, laning: 10, teamfight: 10, gameSense: 10, shotcalling: 10, metaAdaptation: 10, consistency: 10, resilience: 10 }
    const clone = { ...attrs }
    applyTrainingBonus(attrs, 'TOP', 1)
    expect(attrs).toEqual(clone)
  })
})
