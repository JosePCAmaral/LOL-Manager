import { describe, it, expect } from 'vitest'
import {
  calculateWeeklyFinances,
  applyWeeklyFinances,
  canAffordSigning,
  getBudgetWarning,
} from '@engine/finance/finance'
import { makePlayer, makeTeam, makeStaff } from '../helpers'

describe('calculateWeeklyFinances', () => {
  it('returns FinancialSummary with balance = revenue - expenses', () => {
    const team = makeTeam({ weeklyRevenue: 20_000, budget: 100_000 })
    const summary = calculateWeeklyFinances(team, [], [])
    expect(summary.balance).toBe(summary.revenue - summary.expenses)
  })

  it('expenses includes staffSalaries + playerSalaries + facilities', () => {
    const staff = [makeStaff({ salary: 3_000 })]
    const team = makeTeam({ budget: 100_000, weeklyRevenue: 0 })
    const summary = calculateWeeklyFinances(team, [], staff)
    const expectedStaff = 3_000
    const expectedFacilities = 100_000 * 0.02
    expect(summary.breakdown.staffSalaries).toBe(expectedStaff)
    expect(summary.breakdown.facilities).toBe(expectedFacilities)
    expect(summary.expenses).toBeGreaterThanOrEqual(expectedStaff + expectedFacilities)
  })

  it('team without starters → playerSalaries = 0', () => {
    const team = makeTeam({
      roster: { starters: {}, reserves: {} },
      weeklyRevenue: 0,
    })
    const summary = calculateWeeklyFinances(team, [], [])
    expect(summary.breakdown.playerSalaries).toBe(0)
  })

  it('revenue equals team.weeklyRevenue when set', () => {
    const team = makeTeam({ weeklyRevenue: 15_000, budget: 100_000 })
    const summary = calculateWeeklyFinances(team, [], [])
    expect(summary.revenue).toBe(15_000)
  })

  it('revenue is 0 when weeklyRevenue is undefined', () => {
    const team = makeTeam({ budget: 100_000 })
    const { weeklyRevenue: _, ...teamWithoutRevenue } = team
    const summary = calculateWeeklyFinances(teamWithoutRevenue as typeof team, [], [])
    expect(summary.revenue).toBe(0)
  })

  it('includes playerSalaries from starters via contract salary', () => {
    // Use a player whose id matches the team's MID starter
    const player = makePlayer({ id: 'p-mid', role: 'MID', contract: { playerId: 'p-mid', teamId: 'team1', salary: 5_000, startDate: { year: 1, dayOfYear: 1 }, endDate: { year: 2, dayOfYear: 1 }, buyoutClause: 10_000 } })
    const team = makeTeam({
      roster: { starters: { MID: 'p-mid' }, reserves: {} },
      budget: 50_000,
      weeklyRevenue: 0,
    })
    const summary = calculateWeeklyFinances(team, [player], [])
    expect(summary.breakdown.playerSalaries).toBe(5_000)
  })

  it('teamId in summary matches team.id', () => {
    const team = makeTeam({ id: 'my-team' })
    const summary = calculateWeeklyFinances(team, [], [])
    expect(summary.teamId).toBe('my-team')
  })

  it('period is weekly', () => {
    const team = makeTeam()
    const summary = calculateWeeklyFinances(team, [], [])
    expect(summary.period).toBe('weekly')
  })
})

describe('applyWeeklyFinances', () => {
  it('does not mutate the original team', () => {
    const team = makeTeam({ budget: 100_000 })
    const summary = calculateWeeklyFinances(team, [], [])
    applyWeeklyFinances(team, summary)
    expect(team.budget).toBe(100_000)
  })

  it('budget decreases when expenses > revenue', () => {
    const team = makeTeam({ budget: 100_000, weeklyRevenue: 0 })
    const summary = calculateWeeklyFinances(team, [], [makeStaff({ salary: 5_000 })])
    const result = applyWeeklyFinances(team, summary)
    expect(result.budget).toBeLessThan(100_000)
  })

  it('budget increases when revenue > expenses', () => {
    const team = makeTeam({ budget: 100_000, weeklyRevenue: 1_000_000 })
    const summary = calculateWeeklyFinances(team, [], [])
    const result = applyWeeklyFinances(team, summary)
    expect(result.budget).toBeGreaterThan(100_000)
  })

  it('budget change equals balance from summary', () => {
    const team = makeTeam({ budget: 100_000, weeklyRevenue: 5_000 })
    const summary = calculateWeeklyFinances(team, [], [makeStaff({ salary: 2_000 })])
    const result = applyWeeklyFinances(team, summary)
    expect(result.budget).toBe(team.budget + summary.balance)
  })
})

describe('canAffordSigning', () => {
  it('returns true for a team with high budget and low salary', () => {
    const team = makeTeam({ budget: 1_000_000, weeklyRevenue: 0 })
    expect(canAffordSigning(team, 100)).toBe(true)
  })

  it('returns false when budget is 0 and any salary is positive', () => {
    const team = makeTeam({ budget: 0, weeklyRevenue: 0 })
    expect(canAffordSigning(team, 1)).toBe(false)
  })

  it('returns false when projected 12-week cash flow is negative', () => {
    // Very large salary drains budget immediately
    const team = makeTeam({ budget: 1_000, weeklyRevenue: 0 })
    expect(canAffordSigning(team, 100_000)).toBe(false)
  })
})

describe('getBudgetWarning', () => {
  it('returns critical when budget is negative', () => {
    const team = makeTeam({ budget: -1_000, initialBudget: 100_000 })
    expect(getBudgetWarning(team)).toBe('critical')
  })

  it('returns healthy when budget is well above initial threshold', () => {
    const team = makeTeam({ budget: 100_000, initialBudget: 100_000 })
    expect(getBudgetWarning(team)).toBe('healthy')
  })

  it('returns low when budget < 10% of initialBudget', () => {
    const team = makeTeam({ budget: 5_000, initialBudget: 100_000 })
    expect(getBudgetWarning(team)).toBe('low')
  })

  it('returns ok when budget is between 10% and 40% of initialBudget', () => {
    const team = makeTeam({ budget: 25_000, initialBudget: 100_000 })
    expect(getBudgetWarning(team)).toBe('ok')
  })
})
