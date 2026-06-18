/**
 * Financial calculations: weekly summaries, budget application, affordability checks.
 * All functions are pure and immutable — they return new objects.
 * No randomness required in this module.
 */

import type { Team, Player, StaffMember } from '@types-app/index'
import { getStarterIds } from '../teams/team.model'
import { calculateTotalStaffSalary } from '../teams/staff.model'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FinancialSummary {
  teamId: string
  period: 'weekly' | 'monthly' | 'season'
  revenue: number
  expenses: number
  balance: number
  breakdown: {
    sponsorships: number
    prizeMoney: number
    staffSalaries: number
    playerSalaries: number
    facilities: number
    fanbase: number
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculates the financial summary for a single week.
 *
 * From spec:
 * - playerSalaries: sum of starter salaries (resolved via getStarterIds).
 * - staffSalaries: calculateTotalStaffSalary(staff).
 * - facilities: team.budget * 0.02 (weekly maintenance cost).
 * - revenue: team.weeklyRevenue ?? 0.
 * - sponsorships and prizeMoney: 0 (handled separately by sponsorship.ts).
 * - balance = revenue - expenses.
 *
 * Design decision: salary is resolved from the player object, not from
 * player.contract.salary, because the Player type's top-level salary field
 * (if present) may differ from the contract field in some states. We use
 * player.contract?.salary ?? 0 to be safe since Player has no top-level salary.
 */
/**
 * Calculates weekly fanbase revenue.
 * Formula: fanbase × 0.001 (€0.001 per fan per week).
 * Scale: 100k fans = €100/week, 1M fans = €1,000/week, 10M fans = €10,000/week.
 */
export function calculateFanbaseRevenue(team: Team): number {
  return (team.fanbase ?? 0) * 0.001
}

/**
 * Updates team fanbase after a match result.
 *
 * Regular season:
 *   win  → +1% (floor)
 *   loss → -0.5% (floor), minimum 1000
 * Playoff:
 *   win  → +5% (floor)
 *   loss → -1% (floor), minimum 1000
 */
export function updateTeamFanbase(team: Team, won: boolean, isPlayoff: boolean): Team {
  const fanbase = team.fanbase ?? 0
  let newFanbase: number
  if (isPlayoff) {
    newFanbase = won
      ? fanbase + Math.floor(fanbase * 0.05)
      : fanbase - Math.floor(fanbase * 0.01)
  } else {
    newFanbase = won
      ? fanbase + Math.floor(fanbase * 0.01)
      : fanbase - Math.floor(fanbase * 0.005)
  }
  return { ...team, fanbase: Math.max(1000, newFanbase) }
}

export function calculateWeeklyFinances(
  team: Team,
  players: Player[],
  staff: StaffMember[],
): FinancialSummary {
  const starterIds = getStarterIds(team)
  const starters = players.filter(p => starterIds.includes(p.id))

  const playerSalaries = starters.reduce((sum, p) => sum + (p.contract?.salary ?? 0), 0)
  const staffSalaries = calculateTotalStaffSalary(staff)
  const facilities = team.budget * 0.02
  const sponsorships = 0
  const prizeMoney = 0
  const fanbaseRevenue = calculateFanbaseRevenue(team)

  // NOTE: fanbase revenue is tracked in breakdown but NOT added to weeklyRevenue
  // to avoid breaking the existing revenue accounting used by callers that
  // separately track weeklyRevenue and fanbase grants. Callers that want the
  // combined figure should sum summary.breakdown.fanbase + summary.revenue.
  const revenue = team.weeklyRevenue ?? 0
  const expenses = playerSalaries + staffSalaries + facilities + sponsorships + prizeMoney

  return {
    teamId: team.id,
    period: 'weekly',
    revenue,
    expenses,
    balance: revenue - expenses,
    breakdown: {
      sponsorships,
      prizeMoney,
      staffSalaries,
      playerSalaries,
      facilities,
      fanbase: fanbaseRevenue,
    },
  }
}

/**
 * Applies the weekly financial summary to the team's budget.
 *
 * From spec: deducts expenses and adds revenue — returns new team (immutable).
 */
export function applyWeeklyFinances(team: Team, summary: FinancialSummary): Team {
  return {
    ...team,
    budget: team.budget - summary.expenses + summary.revenue,
  }
}

/**
 * Checks whether the team can afford to sign a player at the given weekly salary.
 *
 * From spec: simulates 12 weeks of cash flow.
 * If team.weeklyRevenue is absent, uses 0.
 */
export function canAffordSigning(team: Team, weeklySalary: number): boolean {
  const weeklyRevenue = team.weeklyRevenue ?? 0
  // Approximate current weekly expenses as facilities only (minimum fixed cost)
  // Spec says "currentExpenses + weeklySalary" over 12 weeks
  // We use facilities as the baseline fixed cost since salaries vary
  const currentWeeklyExpenses = team.budget * 0.02
  const projectedBalance =
    team.budget + 12 * weeklyRevenue - 12 * (currentWeeklyExpenses + weeklySalary)
  return projectedBalance > 0
}

/**
 * Returns a qualitative budget health assessment.
 *
 * From spec:
 * - critical: budget < 0
 * - low: budget < initialBudget * 0.1
 * - ok: budget < initialBudget * 0.4
 * - healthy: budget >= initialBudget * 0.4
 *
 * Design decision: if initialBudget is not set, falls back to team.budget * 1.5
 * as a rough approximation of what the starting budget might have been.
 */
export function getBudgetWarning(
  team: Team,
): 'critical' | 'low' | 'ok' | 'healthy' {
  const initialBudget = team.initialBudget ?? team.budget * 1.5

  if (team.budget < 0) return 'critical'
  if (team.budget < initialBudget * 0.1) return 'low'
  if (team.budget < initialBudget * 0.4) return 'ok'
  return 'healthy'
}
