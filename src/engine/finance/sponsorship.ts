/**
 * Sponsorship deal generation and revenue application.
 * All randomness passes through the rng parameter — never Math.random().
 * All functions return new objects (immutable).
 */

import type { Team } from '@types-app/index'
import type { SeededRng } from '../core/rng'
import { randomInt, randomFloat } from '../core/rng'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SponsorshipDeal {
  id: string
  teamId: string
  sponsorName: string
  weeklyValue: number
  duration: number
  bonusCondition?: 'win_tournament' | 'top3_league' | 'playoff_qualifier'
  bonusValue?: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fixed pool of sponsor names from spec. */
const SPONSOR_NAMES: readonly string[] = [
  'TechCorp',
  'GG Energy',
  'VisionPC',
  'StreamMax',
  'ArenaGear',
  'CloudNet',
  'PixelWave',
  'IronCore',
  'NexusHub',
  'DataForge',
] as const

const BONUS_CONDITIONS: readonly ('win_tournament' | 'top3_league' | 'playoff_qualifier')[] = [
  'win_tournament',
  'top3_league',
  'playoff_qualifier',
] as const

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a sponsorship offer for a team based on their league position.
 *
 * From spec:
 * - weeklyValue base: team.budget * 0.005
 * - Position multipliers: 1-3 → ×2.0, 4-6 → ×1.3, 7+ → ×0.8
 * - Duration: 8–16 weeks (rng)
 * - 30% chance of a bonus condition
 */
export function generateSponsorshipOffer(
  team: Team,
  leaguePosition: number,
  rng: SeededRng,
): SponsorshipDeal {
  const baseWeeklyValue = team.budget * 0.005

  let positionMultiplier: number
  if (leaguePosition <= 3) {
    positionMultiplier = 2.0
  } else if (leaguePosition <= 6) {
    positionMultiplier = 1.3
  } else {
    positionMultiplier = 0.8
  }

  const weeklyValue = Math.round(baseWeeklyValue * positionMultiplier)
  const duration = randomInt(rng, 8, 16)

  // Sponsor name selection: index by rng
  const sponsorIndex = Math.floor(rng() * SPONSOR_NAMES.length)
  const sponsorName = SPONSOR_NAMES[sponsorIndex]

  // 30% chance of bonus condition
  const hasBonusCondition = rng() < 0.3
  let bonusCondition: SponsorshipDeal['bonusCondition']
  let bonusValue: number | undefined

  if (hasBonusCondition) {
    const conditionIndex = Math.floor(rng() * BONUS_CONDITIONS.length)
    bonusCondition = BONUS_CONDITIONS[conditionIndex]
    bonusValue = Math.round(weeklyValue * duration * 0.5) // 50% of total deal value as bonus
  }

  // Generate a unique-ish id using team and current timestamp-like rng value
  const idSuffix = Math.floor(rng() * 9999).toString().padStart(4, '0')
  const id = `deal-${team.id}-${idSuffix}`

  return {
    id,
    teamId: team.id,
    sponsorName,
    weeklyValue,
    duration,
    ...(bonusCondition !== undefined && { bonusCondition, bonusValue }),
  }
}

/**
 * Applies weekly sponsorship revenue to the team's budget.
 *
 * From spec:
 * - Sum weeklyValue of all deals with duration > 0.
 * - Decrement each deal's duration by 1.
 * - Remove deals with duration <= 0 after decrement.
 */
export function applyWeeklySponsorshipRevenue(
  team: Team,
  deals: SponsorshipDeal[],
): { team: Team; updatedDeals: SponsorshipDeal[] } {
  const activeDeals = deals.filter(d => d.duration > 0)

  const totalRevenue = activeDeals.reduce((sum, d) => sum + d.weeklyValue, 0)

  const updatedDeals = activeDeals
    .map(d => ({ ...d, duration: d.duration - 1 }))
    .filter(d => d.duration > 0)

  return {
    team: { ...team, budget: team.budget + totalRevenue },
    updatedDeals,
  }
}

/**
 * Checks if a bonus condition is met and returns the bonus value.
 *
 * From spec: returns bonusValue if condition matches, otherwise 0.
 */
export function checkSponsorshipBonus(
  deal: SponsorshipDeal,
  achievedCondition: string,
): number {
  if (deal.bonusCondition === achievedCondition) {
    return deal.bonusValue ?? 0
  }
  return 0
}
