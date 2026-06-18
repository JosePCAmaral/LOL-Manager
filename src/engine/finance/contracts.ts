/**
 * Player contract generation, acceptance, and termination.
 * All randomness passes through the rng parameter — never Math.random().
 * All functions return new objects (immutable).
 */

import type { Player, Team, Contract, GameDate } from '@types-app/index'
import type { SeededRng } from '../core/rng'
import { randomChoice } from '../core/rng'
import { getPlayerOverallRating } from '../players/player.model'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContractOffer {
  playerId: string
  teamId: string
  weeklySalary: number
  durationWeeks: number
  signingBonus: number
  buyoutClause: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTRACT_DURATIONS: readonly number[] = [26, 52, 78] as const

/**
 * Rating-to-salary multipliers from spec:
 * 1-5  → ×1.0
 * 6-10 → ×1.5
 * 11-15 → ×2.5
 * 16-20 → ×4.0
 */
function getSalaryMultiplier(rating: number): number {
  if (rating <= 5) return 1.0
  if (rating <= 10) return 1.5
  if (rating <= 15) return 2.5
  return 4.0
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a contract offer for a player based on their rating.
 *
 * From spec:
 * - weeklySalary = rating × 500 × salaryMultiplier
 * - durationWeeks: random among [26, 52, 78]
 * - signingBonus: 0 if rating < 12; weeklySalary × 2 if rating >= 12
 * - buyoutClause: weeklySalary × 8
 */
export function generateContractOffer(
  player: Player,
  team: Team,
  rng: SeededRng,
): ContractOffer {
  const rating = getPlayerOverallRating(player)
  const multiplier = getSalaryMultiplier(rating)
  const weeklySalary = Math.round(rating * 500 * multiplier)

  const durationWeeks = randomChoice(rng, CONTRACT_DURATIONS)
  const signingBonus = rating >= 12 ? weeklySalary * 2 : 0
  const buyoutClause = weeklySalary * 8

  return {
    playerId: player.id,
    teamId: team.id,
    weeklySalary,
    durationWeeks,
    signingBonus,
    buyoutClause,
  }
}

/**
 * Accepts a contract offer and returns an updated player with the new contract.
 *
 * From spec:
 * - Updates player.salary (via contract.salary) and player.contract.
 *
 * Design decision: GameDate for startDate and endDate cannot be computed
 * without the current game date. The function accepts a startDate parameter;
 * endDate is computed by adding durationWeeks as dayOfYear offset. Callers
 * must pass the current game date.
 */
export function acceptContractOffer(
  player: Player,
  offer: ContractOffer,
  startDate: GameDate = { year: 1, dayOfYear: 1 },
): Player {
  // Convert weeks to approximate days (7 days/week)
  const durationDays = offer.durationWeeks * 7
  const endDayOfYear = startDate.dayOfYear + durationDays
  const extraYears = Math.floor(endDayOfYear / 365)
  const endDate: GameDate = {
    year: startDate.year + extraYears,
    dayOfYear: endDayOfYear % 365 || 365,
  }

  const contract: Contract = {
    playerId: player.id,
    teamId: offer.teamId,
    salary: offer.weeklySalary,
    startDate,
    endDate,
    buyoutClause: offer.buyoutClause,
  }

  return {
    ...player,
    contract,
    teamId: offer.teamId,
  }
}

/**
 * Terminates a player's contract.
 *
 * From spec:
 * - earlyTermination: deducts buyoutClause (or salary × 8) from team budget.
 * - Sets player.contract to null.
 */
export function terminateContract(
  player: Player,
  team: Team,
  earlyTermination: boolean,
): { player: Player; team: Team; penaltyCost: number } {
  let penaltyCost = 0
  let newTeam = team

  if (earlyTermination) {
    penaltyCost = player.contract?.buyoutClause ?? (player.contract?.salary ?? 0) * 8
    newTeam = { ...team, budget: team.budget - penaltyCost }
  }

  const newPlayer: Player = {
    ...player,
    contract: null,
    teamId: null,
    isStarter: false,
  }

  return { player: newPlayer, team: newTeam, penaltyCost }
}

// ---------------------------------------------------------------------------
// Transfer market
// ---------------------------------------------------------------------------

export interface TransferMarketPlayer {
  player: Player
  askingWeeklySalary: number
  availableUntilDay: number
  interestedTeams: string[]
}

/**
 * Generates a list of available players in the transfer market.
 *
 * Includes:
 * - Free agents (contract === null)
 * - Players whose contract expires within the next 14 days of currentDay
 *
 * Salary logic:
 * - Contracted: askingWeeklySalary = contract.salary × (0.9 + rng() × 0.3)
 * - Free agent: askingWeeklySalary = overallRating × 400 × (0.8 + rng() × 0.4)
 *
 * Returns at most 10 players (market visibility cap).
 */
export function generateTransferMarket(
  allPlayers: Player[],
  currentDay: number,
  rng: SeededRng,
): TransferMarketPlayer[] {
  const available = allPlayers.filter(p => {
    if (p.contract === null) return true
    const endTotal = (p.contract.endDate.year - 1) * 365 + p.contract.endDate.dayOfYear
    return endTotal - currentDay <= 14
  })

  return available.slice(0, 10).map(p => {
    let askingWeeklySalary: number
    if (p.contract === null) {
      const rating = getPlayerOverallRating(p)
      askingWeeklySalary = Math.round(rating * 400 * (0.8 + rng() * 0.4))
    } else {
      askingWeeklySalary = Math.round((p.contract.salary) * (0.9 + rng() * 0.3))
    }

    const availableUntilDay = currentDay + 7 + Math.floor(rng() * 14)

    const interestedTeams: string[] = []
    if (rng() > 0.5) interestedTeams.push('team-ai-1')
    if (rng() > 0.5) interestedTeams.push('team-ai-2')

    return { player: p, askingWeeklySalary, availableUntilDay, interestedTeams }
  })
}

/**
 * Creates a ContractOffer for a player in the transfer market.
 *
 * Returns null if weeklySalary < askingSalary × 0.8 (too low to be considered).
 */
export function makeTransferOffer(
  player: Player,
  team: Team,
  weeklySalary: number,
  durationWeeks: 26 | 52 | 78,
  askingSalary: number,
): ContractOffer | null {
  if (weeklySalary < askingSalary * 0.8) return null

  const signingBonus = getPlayerOverallRating(player) >= 12 ? weeklySalary * 2 : 0
  const buyoutClause = weeklySalary * 8

  return {
    playerId: player.id,
    teamId: team.id,
    weeklySalary,
    durationWeeks,
    signingBonus,
    buyoutClause,
  }
}

/**
 * Evaluates a transfer offer against the player's asking salary.
 *
 * - offer >= askingSalary × 1.0 → 'accepted' (with 10% ego chance of 'counter')
 * - offer >= askingSalary × 0.85 → 'counter'
 * - below → 'rejected'
 */
export function evaluateTransferOffer(
  offer: ContractOffer,
  askingSalary: number,
  rng: SeededRng,
): 'accepted' | 'rejected' | 'counter' {
  if (offer.weeklySalary >= askingSalary) {
    // 10% ego chance of counter even with a good offer
    return rng() < 0.10 ? 'counter' : 'accepted'
  }
  if (offer.weeklySalary >= askingSalary * 0.85) {
    return 'counter'
  }
  return 'rejected'
}

/**
 * Returns true if the player's contract expires within the next 8 weeks (56 days).
 *
 * From spec: if contract is null → false.
 */
export function isContractExpiringSoon(player: Player, currentWeek: number): boolean {
  if (!player.contract) return false

  // Convert currentWeek to approximate dayOfYear for comparison
  // We compare using a simple week-based offset against contract endDate
  // endDate is stored as GameDate; convert to "total days" for comparison
  const endDate = player.contract.endDate
  const endTotalDays = (endDate.year - 1) * 365 + endDate.dayOfYear
  const currentTotalDays = currentWeek * 7

  return endTotalDays - currentTotalDays <= 56 // 8 weeks = 56 days
}
