/**
 * composition.test.ts
 *
 * Tests for src/engine/draft/composition.ts.
 * Validates conformance with docs/simulacao_e_draft.md section 8.
 */

import { describe, it, expect } from 'vitest'
import {
  getMaestriaNormalizada,
  getChampionScore,
  getCompositionStrength,
  getPickableChampions,
} from '@engine/draft/composition'
import type { Player, Champion } from '@types-app/index'

// ---------------------------------------------------------------------------
// Local factories (not touching helpers.ts)
// ---------------------------------------------------------------------------

function makeChampion(overrides: Partial<Champion> = {}): Champion {
  return {
    id: 'champ-default',
    name: 'Default Champion',
    eligibleRoles: ['MID'],
    damageType: 'magic',
    range: 1,
    earlyPower: 1,
    sustain: 0,
    mobility: 1,
    scalingCurve: 'mid',
    compTags: { engage: 0, peel: 0, waveClear: 0, ccChain: 0 },
    ...overrides,
  }
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Test Player',
    role: 'MID',
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
    },
    championPool: [],
    potential: 80,
    morale: 70,
    stamina: 80,
    burnoutRisk: 10,
    contract: null,
    teamId: null,
    isStarter: true,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// getMaestriaNormalizada
// ---------------------------------------------------------------------------

describe('getMaestriaNormalizada', () => {
  it('returns exactly 1.0 when masteryLevel is 20 (champion in pool)', () => {
    const player = makePlayer({
      championPool: [{ championId: 'champ-a', masteryLevel: 20 }],
    })
    expect(getMaestriaNormalizada(player, 'champ-a')).toBe(1.0)
  })

  it('returns exactly 0.5 when masteryLevel is 10 (champion in pool)', () => {
    const player = makePlayer({
      championPool: [{ championId: 'champ-a', masteryLevel: 10 }],
    })
    expect(getMaestriaNormalizada(player, 'champ-a')).toBe(0.5)
  })

  it('returns exactly 0.05 when masteryLevel is 1 (champion in pool)', () => {
    const player = makePlayer({
      championPool: [{ championId: 'champ-a', masteryLevel: 1 }],
    })
    expect(getMaestriaNormalizada(player, 'champ-a')).toBe(0.05)
  })

  it('returns 0.05 as floor penalty when champion is not in pool', () => {
    const player = makePlayer({ championPool: [] })
    expect(getMaestriaNormalizada(player, 'champ-unknown')).toBe(0.05)
  })

  it('returns 0.05 for a player with an empty championPool', () => {
    const player = makePlayer({ championPool: [] })
    expect(getMaestriaNormalizada(player, 'any-champ')).toBe(0.05)
  })

  describe('penalty invariant: out-of-pool (0.05) is always worse than any pooled champion', () => {
    // Any masteryLevel ≥ 1 → normalised ≥ 0.05 → always at least as good as out-of-pool
    it('masteryLevel=14 (0.7) is better than out-of-pool (0.05)', () => {
      const player = makePlayer({
        championPool: [{ championId: 'champ-a', masteryLevel: 14 }],
      })
      expect(getMaestriaNormalizada(player, 'champ-a')).toBeGreaterThan(0.05)
    })

    // Even the minimum pooled mastery (1) equals the out-of-pool floor
    it('masteryLevel=1 (0.05) equals the out-of-pool floor', () => {
      const player = makePlayer({
        championPool: [{ championId: 'champ-a', masteryLevel: 1 }],
      })
      expect(getMaestriaNormalizada(player, 'champ-a')).toBe(0.05)
    })
  })
})

// ---------------------------------------------------------------------------
// getChampionScore
// ---------------------------------------------------------------------------

describe('getChampionScore', () => {
  it('mastery dominates when composition gap is equal for all champions', () => {
    // No teammates → ContribuicaoComp is equal for any champion with same tags.
    // Only mastery differs.
    const champion = makeChampion({ id: 'champ-x', compTags: { engage: 1, peel: 1, waveClear: 1, ccChain: 1 } })

    const playerHigh = makePlayer({ championPool: [{ championId: 'champ-x', masteryLevel: 18 }] })
    const playerLow  = makePlayer({ championPool: [{ championId: 'champ-x', masteryLevel: 6 }] })

    const scoreHigh = getChampionScore(playerHigh, champion, [])
    const scoreLow  = getChampionScore(playerLow,  champion, [])

    expect(scoreHigh).toBeGreaterThan(scoreLow)
  })

  describe('composition gap amplification (ContribuicaoComp)', () => {
    const engageChamp = makeChampion({
      id: 'engage-champ',
      compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 },
    })

    const player = makePlayer({ championPool: [{ championId: 'engage-champ', masteryLevel: 10 }] })

    it('scenario A: empty comp → engage champion has high ContribuicaoComp', () => {
      // No teammates: full gap on all tags
      const scoreA = getChampionScore(player, engageChamp, [])
      // ContribuicaoComp = (2×1)/8 = 0.25; Score = 0.6×0.5 + 0.4×0.25 = 0.4
      expect(scoreA).toBeCloseTo(0.4, 5)
    })

    it('scenario B: saturated engage → engage champion has lower ContribuicaoComp', () => {
      // 4 teammates each contributing engage=2 → currentSum engage = 8
      const saturatedTeammates: Champion[] = [
        makeChampion({ id: 't1', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
        makeChampion({ id: 't2', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
        makeChampion({ id: 't3', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
        makeChampion({ id: 't4', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
      ]
      const scoreB = getChampionScore(player, engageChamp, saturatedTeammates)
      expect(scoreB).toBeLessThan(0.4) // less than scenario A
    })

    it('score(engage, scenarioA) > score(engage, scenarioB)', () => {
      const scoreA = getChampionScore(player, engageChamp, [])

      const saturatedTeammates: Champion[] = [
        makeChampion({ id: 't1', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
        makeChampion({ id: 't2', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
        makeChampion({ id: 't3', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
        makeChampion({ id: 't4', compTags: { engage: 2, peel: 0, waveClear: 0, ccChain: 0 } }),
      ]
      const scoreB = getChampionScore(player, engageChamp, saturatedTeammates)

      expect(scoreA).toBeGreaterThan(scoreB)
    })
  })

  it('out-of-pool champion (0.05 mastery floor) has non-zero score', () => {
    const champ = makeChampion({ id: 'offpool', compTags: { engage: 1, peel: 1, waveClear: 1, ccChain: 1 } })
    const player = makePlayer({ championPool: [] }) // off pool → 0.05
    const score = getChampionScore(player, champ, [])
    expect(score).toBeGreaterThan(0)
  })

  it('out-of-pool champion scores lower than masteryLevel=16 on same champion', () => {
    const champ = makeChampion({ id: 'champ-x', compTags: { engage: 1, peel: 1, waveClear: 1, ccChain: 1 } })
    const playerOffPool = makePlayer({ championPool: [] })
    const playerHigh    = makePlayer({ championPool: [{ championId: 'champ-x', masteryLevel: 16 }] })

    expect(getChampionScore(playerOffPool, champ, [])).toBeLessThan(
      getChampionScore(playerHigh, champ, [])
    )
  })
})

// ---------------------------------------------------------------------------
// getCompositionStrength
// ---------------------------------------------------------------------------

describe('getCompositionStrength', () => {
  const allChampions: Champion[] = [
    makeChampion({ id: 'c-full', compTags: { engage: 2, peel: 2, waveClear: 2, ccChain: 2 } }),
    makeChampion({ id: 'c-zero', compTags: { engage: 0, peel: 0, waveClear: 0, ccChain: 0 } }),
  ]

  it('returns 0 for empty picks', () => {
    expect(getCompositionStrength({}, allChampions)).toBe(0)
  })

  it('returns 8/40 = 0.2 for 1 champion with all tags at 2', () => {
    // 1 champ × 4 tags × 2 = 8; theoretical max = 40
    expect(getCompositionStrength({ TOP: 'c-full' }, allChampions)).toBeCloseTo(8 / 40, 10)
  })

  it('returns 1.0 for 5 champions each with all tags at 2', () => {
    // Need 5 distinct champion ids in allChampions
    const champions5: Champion[] = Array.from({ length: 5 }, (_, i) =>
      makeChampion({ id: `c-full-${i}`, compTags: { engage: 2, peel: 2, waveClear: 2, ccChain: 2 } })
    )
    const picks: Partial<Record<import('@types-app/index').Role, string>> = {
      TOP: 'c-full-0',
      JUNGLE: 'c-full-1',
      MID: 'c-full-2',
      ADC: 'c-full-3',
      SUPPORT: 'c-full-4',
    }
    expect(getCompositionStrength(picks, champions5)).toBeCloseTo(1.0, 10)
  })

  it('result is always in [0, 1]', () => {
    const str = getCompositionStrength({ TOP: 'c-full', JUNGLE: 'c-zero' }, allChampions)
    expect(str).toBeGreaterThanOrEqual(0)
    expect(str).toBeLessThanOrEqual(1)
  })

  it('ignores invalid champion ids without throwing', () => {
    expect(() =>
      getCompositionStrength({ TOP: 'nonexistent-id' }, allChampions)
    ).not.toThrow()
    expect(getCompositionStrength({ TOP: 'nonexistent-id' }, allChampions)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getPickableChampions
// ---------------------------------------------------------------------------

describe('getPickableChampions', () => {
  const topChamp    = makeChampion({ id: 'top-champ',    eligibleRoles: ['TOP'] })
  const midChamp    = makeChampion({ id: 'mid-champ',    eligibleRoles: ['MID'] })
  const multiChamp  = makeChampion({ id: 'multi-champ',  eligibleRoles: ['TOP', 'JUNGLE'] })
  const allChampions = [topChamp, midChamp, multiChamp]

  it('excludes banned champions', () => {
    const result = getPickableChampions(allChampions, ['top-champ'], [], 'TOP')
    expect(result.map(c => c.id)).not.toContain('top-champ')
  })

  it('excludes already-picked champions', () => {
    const result = getPickableChampions(allChampions, [], ['top-champ'], 'TOP')
    expect(result.map(c => c.id)).not.toContain('top-champ')
  })

  it('excludes champions whose eligibleRoles does not include the requested role', () => {
    const result = getPickableChampions(allChampions, [], [], 'TOP')
    expect(result.map(c => c.id)).not.toContain('mid-champ')
  })

  it('includes all remaining eligible champions', () => {
    const result = getPickableChampions(allChampions, [], [], 'TOP')
    const ids = result.map(c => c.id)
    expect(ids).toContain('top-champ')
    expect(ids).toContain('multi-champ')
  })

  it('returns empty array when all champions are banned/picked', () => {
    const result = getPickableChampions(
      allChampions,
      ['top-champ', 'multi-champ'],
      ['mid-champ'],
      'TOP'
    )
    expect(result).toHaveLength(0)
  })

  it('returns empty array when allChampions is empty', () => {
    const result = getPickableChampions([], [], [], 'SUPPORT')
    expect(result).toHaveLength(0)
  })
})
