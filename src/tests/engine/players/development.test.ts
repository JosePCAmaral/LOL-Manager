import { describe, it, expect } from 'vitest'
import { developPlayer, calculateBurnoutRisk, applyBurnout } from '@engine/players/development'
import { seededRandom } from '@engine/core/rng'
import { makePlayer } from '../helpers'

describe('developPlayer', () => {
  it('increments age by 1', () => {
    const p = makePlayer({ age: 22 })
    const rng = seededRandom('dev-age')
    const result = developPlayer(p, rng)
    expect(result.age).toBe(23)
  })

  it('all attributes remain in [1, 20] after development', () => {
    const rng = seededRandom('dev-attrs')
    // test with min attributes
    const pMin = makePlayer({
      attributes: { mechanics: 1, laning: 1, teamfight: 1, gameSense: 1, shotcalling: 1, metaAdaptation: 1, consistency: 1, resilience: 1 },
    })
    const resultMin = developPlayer(pMin, rng)
    for (const val of Object.values(resultMin.attributes)) {
      expect(val).toBeGreaterThanOrEqual(1)
      expect(val).toBeLessThanOrEqual(20)
    }
    // test with max attributes
    const rng2 = seededRandom('dev-attrs-max')
    const pMax = makePlayer({
      attributes: { mechanics: 20, laning: 20, teamfight: 20, gameSense: 20, shotcalling: 20, metaAdaptation: 20, consistency: 20, resilience: 20 },
    })
    const resultMax = developPlayer(pMax, rng2)
    for (const val of Object.values(resultMax.attributes)) {
      expect(val).toBeGreaterThanOrEqual(1)
      expect(val).toBeLessThanOrEqual(20)
    }
  })

  it('does not mutate the original player', () => {
    const p = makePlayer({ age: 22 })
    const clone = JSON.parse(JSON.stringify(p))
    const rng = seededRandom('dev-immut')
    developPlayer(p, rng)
    expect(p).toEqual(clone)
  })

  it('potential of player with age < 26 never decreases', () => {
    // After development age becomes 25 (24+1) — still below threshold, no decay
    const p = makePlayer({ age: 24, potential: 70 })
    for (let seed = 0; seed < 50; seed++) {
      const rng = seededRandom(`no-decay-${seed}`)
      const result = developPlayer(p, rng)
      expect(result.potential).toBe(70)
    }
  })

  it('potential of player with age=27 stays >= 0 after development', () => {
    // age=27 → newAge=28, which is >= 26, so decay may happen
    const p = makePlayer({ age: 27, potential: 0 })
    for (let seed = 0; seed < 50; seed++) {
      const rng = seededRandom(`decay-floor-${seed}`)
      const result = developPlayer(p, rng)
      expect(result.potential).toBeGreaterThanOrEqual(0)
    }
  })

  it('deterministic: same seed + same player → same result', () => {
    const p = makePlayer({ age: 20, potential: 80 })
    const r1 = developPlayer(p, seededRandom('det-test'))
    const r2 = developPlayer(p, seededRandom('det-test'))
    expect(r1).toEqual(r2)
  })
})

describe('calculateBurnoutRisk', () => {
  it('exact formula: burnoutRisk + (100-stamina)*0.3 - morale*0.1, clamped [0,100]', () => {
    const p = makePlayer({ burnoutRisk: 20, stamina: 60, morale: 50 })
    // 20 + (100-60)*0.3 - 50*0.1 = 20 + 12 - 5 = 27
    expect(calculateBurnoutRisk(p)).toBeCloseTo(27)
  })

  it('stamina=100, morale=100 decreases burnout risk below starting value', () => {
    const p = makePlayer({ burnoutRisk: 50, stamina: 100, morale: 100 })
    // 50 + (100-100)*0.3 - 100*0.1 = 50 + 0 - 10 = 40
    const result = calculateBurnoutRisk(p)
    expect(result).toBeCloseTo(40)
    expect(result).toBeLessThan(50)
  })

  it('stamina=0, morale=0 increases burnout risk aggressively', () => {
    const p = makePlayer({ burnoutRisk: 20, stamina: 0, morale: 0 })
    // 20 + 100*0.3 - 0 = 20 + 30 = 50
    expect(calculateBurnoutRisk(p)).toBeCloseTo(50)
  })

  it('clamps result at 0 (floor)', () => {
    const p = makePlayer({ burnoutRisk: 0, stamina: 100, morale: 100 })
    // 0 + 0 - 10 = -10 → clamped to 0
    expect(calculateBurnoutRisk(p)).toBe(0)
  })

  it('clamps result at 100 (ceiling)', () => {
    const p = makePlayer({ burnoutRisk: 100, stamina: 0, morale: 0 })
    // 100 + 30 - 0 = 130 → clamped to 100
    expect(calculateBurnoutRisk(p)).toBe(100)
  })
})

describe('applyBurnout', () => {
  it('returns player unchanged when burnoutRisk <= 70', () => {
    const p = makePlayer({ burnoutRisk: 30 })
    const rng = seededRandom('burnout-safe')
    const result = applyBurnout(p, rng)
    expect(result).toBe(p) // same reference — no new object
  })

  it('returns player unchanged when burnoutRisk = 70 (boundary)', () => {
    const p = makePlayer({ burnoutRisk: 70 })
    const rng = seededRandom('burnout-boundary')
    expect(applyBurnout(p, rng)).toBe(p)
  })

  it('with burnoutRisk=100 and first rng value < triggerChance → attributes reduce and burnoutRisk rises by 5', () => {
    // triggerChance = (100-70)/100 = 0.30
    // We need rng() to return a value < 0.30 on the first call.
    // seededRandom('burnout-trigger') — find a seed that gives first value < 0.30.
    // We'll iterate seeds until we find one deterministically.
    const p = makePlayer({
      burnoutRisk: 100,
      attributes: { mechanics: 10, laning: 10, teamfight: 10, gameSense: 10, shotcalling: 10, metaAdaptation: 10, consistency: 10, resilience: 10 },
    })
    let triggered = false
    for (let i = 0; i < 200; i++) {
      const rng = seededRandom(`burnout-trigger-${i}`)
      const firstVal = rng()
      if (firstVal < 0.30) {
        // This rng should trigger burnout. Create a fresh rng with same seed.
        const rng2 = seededRandom(`burnout-trigger-${i}`)
        const result = applyBurnout(p, rng2)
        // burnoutRisk must rise by 5
        expect(result.burnoutRisk).toBe(100) // clamped to 100 (already at 100)
        // All attributes must have reduced by 1 or 2
        for (const key of Object.keys(p.attributes) as Array<keyof typeof p.attributes>) {
          expect(result.attributes[key]).toBeLessThan(p.attributes[key])
        }
        triggered = true
        break
      }
    }
    expect(triggered).toBe(true)
  })

  it('does not mutate the original player', () => {
    const p = makePlayer({ burnoutRisk: 100 })
    const clone = JSON.parse(JSON.stringify(p))
    // Find a seed that triggers burnout
    for (let i = 0; i < 200; i++) {
      const rng = seededRandom(`immut-${i}`)
      const firstVal = rng()
      if (firstVal < 0.30) {
        const rng2 = seededRandom(`immut-${i}`)
        applyBurnout(p, rng2)
        expect(p).toEqual(clone)
        return
      }
    }
  })
})
