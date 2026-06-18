import { describe, it, expect } from 'vitest'
import {
  generateSoloQueuePool,
  refineProspectEstimate,
} from '@engine/scouting/soloQueueGenerator'
import { seededRandom } from '@engine/core/rng'

describe('generateSoloQueuePool', () => {
  it('returns array with count elements', () => {
    const rng = seededRandom('test-pool')
    const result = generateSoloQueuePool('BR', 10, rng)
    expect(result.length).toBe(10)
  })

  it('count=0 returns empty array', () => {
    const rng = seededRandom('test-pool-empty')
    const result = generateSoloQueuePool('BR', 0, rng)
    expect(result).toEqual([])
  })

  it('all prospects have region equal to the parameter', () => {
    const rng = seededRandom('test-pool-region')
    const result = generateSoloQueuePool('KR', 5, rng)
    for (const p of result) {
      expect(p.region).toBe('KR')
    }
  })

  it('all prospects have age between 16 and 21', () => {
    const rng = seededRandom('test-pool-age')
    const result = generateSoloQueuePool('BR', 20, rng)
    for (const p of result) {
      expect(p.age).toBeGreaterThanOrEqual(16)
      expect(p.age).toBeLessThanOrEqual(21)
    }
  })

  it('all prospects have estimatedRating in [5, 15]', () => {
    const rng = seededRandom('test-pool-estimated')
    const result = generateSoloQueuePool('BR', 20, rng)
    for (const p of result) {
      expect(p.estimatedRating).toBeGreaterThanOrEqual(5)
      expect(p.estimatedRating).toBeLessThanOrEqual(15)
    }
  })

  it('all prospects have trueRating in [3, 18]', () => {
    const rng = seededRandom('test-pool-true')
    const result = generateSoloQueuePool('BR', 20, rng)
    for (const p of result) {
      expect(p.trueRating).toBeGreaterThanOrEqual(3)
      expect(p.trueRating).toBeLessThanOrEqual(18)
    }
  })

  it('discovered is false on all generated prospects', () => {
    const rng = seededRandom('test-pool-discovered')
    const result = generateSoloQueuePool('EU', 10, rng)
    for (const p of result) {
      expect(p.discovered).toBe(false)
    }
  })

  it('is deterministic: same seed and input always produce same output', () => {
    const result1 = generateSoloQueuePool('BR', 5, seededRandom('seed-42'))
    const result2 = generateSoloQueuePool('BR', 5, seededRandom('seed-42'))
    expect(result1).toEqual(result2)
  })

  it('different seeds produce different results', () => {
    const result1 = generateSoloQueuePool('BR', 5, seededRandom('seed-A'))
    const result2 = generateSoloQueuePool('BR', 5, seededRandom('seed-B'))
    expect(result1).not.toEqual(result2)
  })

  it('all prospects have contractStatus free_agent', () => {
    const rng = seededRandom('test-pool-contract')
    const result = generateSoloQueuePool('NA', 5, rng)
    for (const p of result) {
      expect(p.contractStatus).toBe('free_agent')
    }
  })
})

describe('refineProspectEstimate', () => {
  const baseProspect = {
    id: 'p-1',
    name: 'Test Prospect',
    region: 'BR',
    estimatedRole: 'MID' as const,
    observedAttributes: {},
    confidence: 0,
    trackedSince: { year: 1, dayOfYear: 1 },
    trueRating: 12.5,
    estimatedRating: 8.0,
    potential: 75,
    scoutedBy: null,
    contractStatus: 'free_agent' as const,
    salary: 0,
    discovered: false,
  }

  it('staffBonus > 0.8: estimatedRating equals trueRating exactly', () => {
    const rng = seededRandom('refine-exact')
    const result = refineProspectEstimate(baseProspect, 0.9, rng)
    expect(result.estimatedRating).toBe(baseProspect.trueRating)
  })

  it('staffBonus <= 0.5: estimatedRating differs from trueRating (noise applied)', () => {
    // Use fixed rng that returns 0.99 → error = randomFloat(rng, -3, 3) = -3 + 0.99*6 = 2.94
    // With trueRating 12.5, estimate will differ
    const rng = seededRandom('refine-noise')
    const result = refineProspectEstimate(baseProspect, 0.3, rng)
    // Because error is in [-3, +3] and trueRating is 12.5, very unlikely to be exactly equal
    // The test verifies noise is applied rather than exact equality
    expect(result.estimatedRating).not.toBe(baseProspect.trueRating)
  })

  it('does not mutate the original prospect', () => {
    const rng = seededRandom('refine-immut')
    const original = { ...baseProspect }
    refineProspectEstimate(baseProspect, 0.3, rng)
    expect(baseProspect.estimatedRating).toBe(original.estimatedRating)
  })

  it('result estimatedRating is clamped to [1, 20]', () => {
    const rng = seededRandom('refine-clamp')
    const lowRatingProspect = { ...baseProspect, trueRating: 1.0 }
    const result = refineProspectEstimate(lowRatingProspect, 0.0, rng)
    expect(result.estimatedRating).toBeGreaterThanOrEqual(1)
    expect(result.estimatedRating).toBeLessThanOrEqual(20)
  })

  it('staffBonus > 0.5 but <= 0.8: applies reduced noise (max ±1.5)', () => {
    // Run many times and verify all results are within trueRating ± 1.5
    // Because error is clamped via randomFloat(rng, -1.5, 1.5)
    const trueRating = 10.0
    const prospect = { ...baseProspect, trueRating }
    for (let seed = 0; seed < 50; seed++) {
      const rng = seededRandom(`refine-reduced-${seed}`)
      const result = refineProspectEstimate(prospect, 0.6, rng)
      // Allow for floating point rounding
      expect(result.estimatedRating).toBeGreaterThanOrEqual(Math.max(1, trueRating - 1.6))
      expect(result.estimatedRating).toBeLessThanOrEqual(Math.min(20, trueRating + 1.6))
    }
  })
})
