import { describe, it, expect } from 'vitest'
import {
  generateSponsorshipOffer,
  applyWeeklySponsorshipRevenue,
  checkSponsorshipBonus,
} from '@engine/finance/sponsorship'
import type { SponsorshipDeal } from '@engine/finance/sponsorship'
import { seededRandom } from '@engine/core/rng'
import { makeTeam } from '../helpers'

describe('generateSponsorshipOffer', () => {
  it('returns a deal with weeklyValue > 0', () => {
    const team = makeTeam({ budget: 100_000 })
    const rng = seededRandom('sponsor-value')
    const deal = generateSponsorshipOffer(team, 5, rng)
    expect(deal.weeklyValue).toBeGreaterThan(0)
  })

  it('duration is between 8 and 16', () => {
    const team = makeTeam({ budget: 100_000 })
    for (let i = 0; i < 20; i++) {
      const rng = seededRandom(`sponsor-duration-${i}`)
      const deal = generateSponsorshipOffer(team, 3, rng)
      expect(deal.duration).toBeGreaterThanOrEqual(8)
      expect(deal.duration).toBeLessThanOrEqual(16)
    }
  })

  it('is deterministic: same seed produces same result', () => {
    const team = makeTeam({ budget: 100_000 })
    const deal1 = generateSponsorshipOffer(team, 4, seededRandom('seed-det'))
    const deal2 = generateSponsorshipOffer(team, 4, seededRandom('seed-det'))
    expect(deal1).toEqual(deal2)
  })

  it('leaguePosition=1 generates higher weeklyValue than leaguePosition=8 (same budget, different position multiplier)', () => {
    const team = makeTeam({ budget: 100_000 })
    const deal1 = generateSponsorshipOffer(team, 1, seededRandom('seed-pos'))
    const deal8 = generateSponsorshipOffer(team, 8, seededRandom('seed-pos'))
    expect(deal1.weeklyValue).toBeGreaterThan(deal8.weeklyValue)
  })

  it('teamId matches team.id', () => {
    const team = makeTeam({ id: 'team-xyz', budget: 100_000 })
    const rng = seededRandom('sponsor-team')
    const deal = generateSponsorshipOffer(team, 3, rng)
    expect(deal.teamId).toBe('team-xyz')
  })
})

describe('applyWeeklySponsorshipRevenue', () => {
  function makeDeal(overrides: Partial<SponsorshipDeal> = {}): SponsorshipDeal {
    return {
      id: 'deal-001',
      teamId: 'team1',
      sponsorName: 'TestCorp',
      weeklyValue: 1_000,
      duration: 5,
      ...overrides,
    }
  }

  it('team budget increases by weeklyValue when 1 active deal exists', () => {
    const team = makeTeam({ budget: 100_000 })
    const deal = makeDeal({ weeklyValue: 2_000, duration: 3 })
    const { team: result } = applyWeeklySponsorshipRevenue(team, [deal])
    expect(result.budget).toBe(102_000)
  })

  it('deal with duration=1 is removed from updatedDeals after apply', () => {
    const team = makeTeam({ budget: 100_000 })
    const deal = makeDeal({ duration: 1 })
    const { updatedDeals } = applyWeeklySponsorshipRevenue(team, [deal])
    expect(updatedDeals.length).toBe(0)
  })

  it('deal with duration=5 has duration=4 in result', () => {
    const team = makeTeam({ budget: 100_000 })
    const deal = makeDeal({ id: 'deal-5', duration: 5 })
    const { updatedDeals } = applyWeeklySponsorshipRevenue(team, [deal])
    const updated = updatedDeals.find(d => d.id === 'deal-5')
    expect(updated).toBeDefined()
    expect(updated!.duration).toBe(4)
  })

  it('empty deals array leaves team budget unchanged', () => {
    const team = makeTeam({ budget: 100_000 })
    const { team: result, updatedDeals } = applyWeeklySponsorshipRevenue(team, [])
    expect(result.budget).toBe(100_000)
    expect(updatedDeals).toEqual([])
  })

  it('does not mutate the original team', () => {
    const team = makeTeam({ budget: 100_000 })
    const deal = makeDeal({ weeklyValue: 500, duration: 3 })
    applyWeeklySponsorshipRevenue(team, [deal])
    expect(team.budget).toBe(100_000)
  })

  it('deals with duration=0 are skipped (not counted as revenue)', () => {
    const team = makeTeam({ budget: 100_000 })
    const expiredDeal = makeDeal({ weeklyValue: 5_000, duration: 0 })
    const { team: result } = applyWeeklySponsorshipRevenue(team, [expiredDeal])
    expect(result.budget).toBe(100_000)
  })
})

describe('checkSponsorshipBonus', () => {
  function makeDealWithBonus(condition: SponsorshipDeal['bonusCondition'], value: number): SponsorshipDeal {
    return {
      id: 'deal-bonus',
      teamId: 'team1',
      sponsorName: 'BonusCorp',
      weeklyValue: 1_000,
      duration: 10,
      bonusCondition: condition,
      bonusValue: value,
    }
  }

  it('returns bonusValue when condition matches', () => {
    const deal = makeDealWithBonus('win_tournament', 10_000)
    expect(checkSponsorshipBonus(deal, 'win_tournament')).toBe(10_000)
  })

  it('returns 0 when condition does not match', () => {
    const deal = makeDealWithBonus('win_tournament', 10_000)
    expect(checkSponsorshipBonus(deal, 'top3_league')).toBe(0)
  })

  it('returns 0 when deal has no bonusCondition', () => {
    const deal: SponsorshipDeal = {
      id: 'deal-no-bonus',
      teamId: 'team1',
      sponsorName: 'NoBonusCorp',
      weeklyValue: 1_000,
      duration: 5,
    }
    expect(checkSponsorshipBonus(deal, 'win_tournament')).toBe(0)
  })
})
