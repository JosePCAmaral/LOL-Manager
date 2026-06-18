import type { StateCreator } from 'zustand'
import type { GameStore } from '../useGameStore'
import type { FinancialSummary } from '@engine/finance/finance'
import type { SponsorshipDeal } from '@engine/finance/sponsorship'
import { calculateWeeklyFinances } from '@engine/index'
import {
  playerRepository,
  teamRepository,
  staffRepository,
} from '@persistence/index'

export interface FinanceSlice {
  weeklyFinanceSummary: FinancialSummary | null
  sponsorshipDeals: SponsorshipDeal[]
  budget: number

  loadFinances(teamId: string): Promise<void>
  acceptSponsorshipDeal(deal: SponsorshipDeal): void
  rejectSponsorshipDeal(dealId: string): void
  processWeeklyFinances(): Promise<void>
}

export const createFinanceSlice: StateCreator<GameStore, [], [], FinanceSlice> = (set, get) => ({
  weeklyFinanceSummary: null,
  sponsorshipDeals: [],
  budget: 0,

  async loadFinances(teamId: string) {
    const team = await teamRepository.getById(teamId)
    if (!team) return
    set({ budget: team.budget })
  },

  acceptSponsorshipDeal(deal: SponsorshipDeal) {
    set(state => ({
      sponsorshipDeals: [...state.sponsorshipDeals, deal],
    }))
  },

  rejectSponsorshipDeal(dealId: string) {
    set(state => ({
      sponsorshipDeals: state.sponsorshipDeals.filter(d => d.id !== dealId),
    }))
  },

  async processWeeklyFinances() {
    const { managedTeamId, sponsorshipDeals } = get()
    if (!managedTeamId) return

    const [team, players, staffRecords] = await Promise.all([
      teamRepository.getById(managedTeamId),
      playerRepository.getByTeam(managedTeamId),
      staffRepository.getByTeam(managedTeamId),
    ])
    if (!team) return

    // Add weekly sponsorship revenue to team's weeklyRevenue
    const weeklySponsorship = sponsorshipDeals
      .filter(d => d.teamId === managedTeamId)
      .reduce((sum, d) => sum + d.weeklyValue, 0)

    const teamWithRevenue = {
      ...team,
      weeklyRevenue: (team.weeklyRevenue ?? 0) + weeklySponsorship,
    }

    const summary = calculateWeeklyFinances(teamWithRevenue, players, staffRecords)

    // Apply balance to team budget
    const newBudget = team.budget + summary.balance
    const updatedTeam = { ...team, budget: newBudget, weeklyRevenue: teamWithRevenue.weeklyRevenue }
    await teamRepository.save(updatedTeam)

    set({ weeklyFinanceSummary: summary, budget: newBudget })
  },
})
