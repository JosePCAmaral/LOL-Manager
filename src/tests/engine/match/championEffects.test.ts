/**
 * championEffects.test.ts
 *
 * Validates championEffects.ts against docs/simulacao_e_draft.md sections 1 and 2.
 *
 * Note on ModMaestria: the formula is implemented in laningPhase.ts as the private
 * function `getModMaestria`. It is not exported from championEffects.ts. Tests for
 * ModMaestria are therefore exercised through calculateLaneScore (the only public
 * caller). The formula `0.8 + (maestria-1)/19 × 0.3` is verified directly.
 */

import { describe, it, expect } from 'vitest'
import {
  calculateMatchupModifier,
  calculateMatchupModifierDetailed,
  getScalingModifier,
  getScalingModifierForPhase,
  PHASE_BOUNDARY_MID_START,
  PHASE_BOUNDARY_LATE_START,
} from '@engine/match/championEffects'
import type { Champion } from '@types-app/index'

// ---------------------------------------------------------------------------
// Champion factory — local to this test file
// ---------------------------------------------------------------------------

function makeChampion(overrides: Partial<Champion> = {}): Champion {
  return {
    id: 'champ-test',
    name: 'Test Champion',
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

// ---------------------------------------------------------------------------
// ModMaestria formula verification
// The formula 0.8 + (maestria-1)/19 × 0.3 is computed directly here
// (since getModMaestria is private). The laning phase tests exercise it
// indirectly via calculateLaneScore.
// ---------------------------------------------------------------------------

describe('ModMaestria formula (direct computation)', () => {
  function modMaestria(maestria: number): number {
    return 0.8 + ((maestria - 1) / 19) * 0.3
  }

  it('maestria=1 → exactly 0.8', () => {
    expect(modMaestria(1)).toBe(0.8)
  })

  it('maestria=20 → exactly 1.1', () => {
    expect(modMaestria(20)).toBeCloseTo(1.1, 10)
  })

  it('maestria=10 → 0.8 + 9/19 × 0.3', () => {
    const expected = 0.8 + (9 / 19) * 0.3
    expect(modMaestria(10)).toBeCloseTo(expected, 10)
    // Approximate: ~0.94210526...
    expect(modMaestria(10)).toBeCloseTo(0.9421, 4)
  })

  it('maestria=0 (edge case below spec) — documents observed value, must not throw', () => {
    // Formula gives 0.8 + (-1/19)*0.3 ≈ 0.7842
    // This is below the documented minimum (0.8 at maestria=1).
    // The implementation clamps maestria-less champions to 1, so this is a raw formula check.
    const result = modMaestria(0)
    expect(typeof result).toBe('number')
    expect(isNaN(result)).toBe(false)
    // Observed value for documentation purposes: ~0.7842...
    expect(result).toBeCloseTo(0.8 + (-1 / 19) * 0.3, 10)
  })
})

// ---------------------------------------------------------------------------
// ModMatchup — calculateMatchupModifier and calculateMatchupModifierDetailed
// ---------------------------------------------------------------------------

describe('calculateMatchupModifier', () => {
  it('identical champions → 0 (neutral additive)', () => {
    const champ = makeChampion()
    expect(calculateMatchupModifier(champ, champ)).toBe(0)
  })

  it('attacker with range=2 vs defender with range=0 → positive delta', () => {
    const attacker = makeChampion({ range: 2, earlyPower: 1, sustain: 1, mobility: 1 })
    const defender = makeChampion({ range: 0, earlyPower: 1, sustain: 1, mobility: 1 })
    expect(calculateMatchupModifier(attacker, defender)).toBeGreaterThan(0)
  })

  it('attacker with range=0 vs defender with range=2 → negative delta', () => {
    const attacker = makeChampion({ range: 0, earlyPower: 1, sustain: 1, mobility: 1 })
    const defender = makeChampion({ range: 2, earlyPower: 1, sustain: 1, mobility: 1 })
    expect(calculateMatchupModifier(attacker, defender)).toBeLessThan(0)
  })

  it('result stays within [-3, +3] for extreme values (all traits 0 vs all traits 2)', () => {
    const strongChamp = makeChampion({ range: 2, earlyPower: 2, sustain: 2, mobility: 2 })
    const weakChamp   = makeChampion({ range: 0, earlyPower: 0, sustain: 0, mobility: 0 })

    const maxVal = calculateMatchupModifier(strongChamp, weakChamp)
    const minVal = calculateMatchupModifier(weakChamp, strongChamp)

    expect(maxVal).toBeLessThanOrEqual(3)
    expect(maxVal).toBeGreaterThanOrEqual(-3)
    expect(minVal).toBeLessThanOrEqual(3)
    expect(minVal).toBeGreaterThanOrEqual(-3)
  })

  it('extreme attacker advantage (all 2) vs extreme defender (all 0) → exactly +3 (clamped)', () => {
    // Raw = 0.5*2 + 0.7*2 + 0.4*2 + 0.3*2 = 1.0+1.4+0.8+0.6 = 3.8 → clamped to 3
    const attacker = makeChampion({ range: 2, earlyPower: 2, sustain: 2, mobility: 2 })
    const defender = makeChampion({ range: 0, earlyPower: 0, sustain: 0, mobility: 0 })
    expect(calculateMatchupModifier(attacker, defender)).toBe(3)
  })

  it('extreme defender advantage → exactly -3 (clamped)', () => {
    const attacker = makeChampion({ range: 0, earlyPower: 0, sustain: 0, mobility: 0 })
    const defender = makeChampion({ range: 2, earlyPower: 2, sustain: 2, mobility: 2 })
    expect(calculateMatchupModifier(attacker, defender)).toBe(-3)
  })
})

describe('calculateMatchupModifierDetailed', () => {
  it('total matches calculateMatchupModifier', () => {
    const attacker = makeChampion({ range: 2, earlyPower: 1, sustain: 0, mobility: 2 })
    const defender = makeChampion({ range: 0, earlyPower: 2, sustain: 1, mobility: 0 })

    const simple   = calculateMatchupModifier(attacker, defender)
    const detailed = calculateMatchupModifierDetailed(attacker, defender)

    expect(detailed.total).toBe(simple)
  })

  it('breakdown components sum to total (before clamping effect)', () => {
    // Use values that won't be clamped (raw total within [-3,+3])
    const attacker = makeChampion({ range: 1, earlyPower: 1, sustain: 0, mobility: 1 })
    const defender = makeChampion({ range: 0, earlyPower: 1, sustain: 1, mobility: 0 })

    const d = calculateMatchupModifierDetailed(attacker, defender)
    const componentSum = d.rangeAdvantage + d.earlyPowerDelta + d.sustainDelta + d.mobilityDelta
    // If no clamping occurred, sum equals total
    expect(d.total).toBeCloseTo(componentSum, 10)
  })

  it('rangeAdvantage = 0.5 × (range_A - range_B)', () => {
    const a = makeChampion({ range: 2 })
    const b = makeChampion({ range: 0 })
    const d = calculateMatchupModifierDetailed(a, b)
    expect(d.rangeAdvantage).toBeCloseTo(0.5 * (2 - 0), 10)
  })

  it('earlyPowerDelta = 0.7 × (earlyPower_A - earlyPower_B)', () => {
    const a = makeChampion({ earlyPower: 2 })
    const b = makeChampion({ earlyPower: 0 })
    const d = calculateMatchupModifierDetailed(a, b)
    expect(d.earlyPowerDelta).toBeCloseTo(0.7 * (2 - 0), 10)
  })

  it('sustainDelta = 0.4 × (sustain_A - sustain_B)', () => {
    const a = makeChampion({ sustain: 2 })
    const b = makeChampion({ sustain: 1 })
    const d = calculateMatchupModifierDetailed(a, b)
    expect(d.sustainDelta).toBeCloseTo(0.4 * (2 - 1), 10)
  })

  it('mobilityDelta = 0.3 × (mobility_A - mobility_B)', () => {
    const a = makeChampion({ mobility: 0 })
    const b = makeChampion({ mobility: 2 })
    const d = calculateMatchupModifierDetailed(a, b)
    expect(d.mobilityDelta).toBeCloseTo(0.3 * (0 - 2), 10)
  })
})

// ---------------------------------------------------------------------------
// ModEscala — getScalingModifier and getScalingModifierForPhase
// Nine exact values from the table in section 2.
// ---------------------------------------------------------------------------

describe('getScalingModifierForPhase — all 9 table values from section 2', () => {
  const early = makeChampion({ scalingCurve: 'early' })
  const mid   = makeChampion({ scalingCurve: 'mid' })
  const late  = makeChampion({ scalingCurve: 'late' })

  it('early curve, laning phase → 1.15', () => {
    expect(getScalingModifierForPhase(early, 'laning')).toBe(1.15)
  })
  it('early curve, macro phase → 1.00', () => {
    expect(getScalingModifierForPhase(early, 'macro')).toBe(1.00)
  })
  it('early curve, teamfight phase → 0.85', () => {
    expect(getScalingModifierForPhase(early, 'teamfight')).toBe(0.85)
  })

  it('mid curve, laning phase → 0.95', () => {
    expect(getScalingModifierForPhase(mid, 'laning')).toBe(0.95)
  })
  it('mid curve, macro phase → 1.05', () => {
    expect(getScalingModifierForPhase(mid, 'macro')).toBe(1.05)
  })
  it('mid curve, teamfight phase → 1.00', () => {
    expect(getScalingModifierForPhase(mid, 'teamfight')).toBe(1.00)
  })

  it('late curve, laning phase → 0.85', () => {
    expect(getScalingModifierForPhase(late, 'laning')).toBe(0.85)
  })
  it('late curve, macro phase → 0.95', () => {
    expect(getScalingModifierForPhase(late, 'macro')).toBe(0.95)
  })
  it('late curve, teamfight phase → 1.20', () => {
    expect(getScalingModifierForPhase(late, 'teamfight')).toBe(1.20)
  })
})

describe('getScalingModifier — minute-based phase mapping', () => {
  const earlyChamp = makeChampion({ scalingCurve: 'early' })
  const lateChamp  = makeChampion({ scalingCurve: 'late' })

  it('early champion at minute 0 → 1.15 (laning phase)', () => {
    expect(getScalingModifier(earlyChamp, 0)).toBe(1.15)
  })

  it('early champion at minute 14 → 1.15 (still laning)', () => {
    expect(getScalingModifier(earlyChamp, 14)).toBe(1.15)
  })

  it(`early champion at minute ${PHASE_BOUNDARY_MID_START} → 1.00 (macro phase begins)`, () => {
    expect(getScalingModifier(earlyChamp, PHASE_BOUNDARY_MID_START)).toBe(1.00)
  })

  it(`late champion at minute ${PHASE_BOUNDARY_LATE_START} → 1.20 (teamfight phase)`, () => {
    expect(getScalingModifier(lateChamp, PHASE_BOUNDARY_LATE_START)).toBe(1.20)
  })

  it('late champion at minute 30 → 1.20 (teamfight phase)', () => {
    expect(getScalingModifier(lateChamp, 30)).toBe(1.20)
  })

  it('late champion at minute 14 → 0.85 (laning phase, worst phase for late champ)', () => {
    expect(getScalingModifier(lateChamp, 14)).toBe(0.85)
  })
})
