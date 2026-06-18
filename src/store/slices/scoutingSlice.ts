import type { StateCreator } from 'zustand'
import type { GameStore } from '../useGameStore'
import type { ScoutingProspect } from '@types-app/index'
import { generateSoloQueuePool, refineProspectEstimate } from '@engine/scouting/soloQueueGenerator'
import { generateScoutReport } from '@engine/scouting/scoutReport'
import type { ScoutReport } from '@engine/scouting/scoutReport'
import { seededRandom } from '@engine/core/rng'
import { teamRepository, playerRepository } from '@persistence/index'

export type { ScoutReport }

export interface ScoutingSlice {
  prospects: ScoutingProspect[]
  scoutReports: Record<string, ScoutReport>   // prospectId → relatório
  scoutedRegion: string | null
  dismissedProspectIds: string[]

  discoverProspects(region: string, count?: number): void
  scoutProspect(prospectId: string): Promise<void>
  dismissProspect(prospectId: string): void
}

export const createScoutingSlice: StateCreator<GameStore, [], [], ScoutingSlice> = (set, get) => ({
  prospects: [],
  scoutReports: {},
  scoutedRegion: null,
  dismissedProspectIds: [],

  discoverProspects(region: string, count = 5) {
    const { currentDay, currentYear } = get()
    // Seed is mostly deterministic per day/region; Date.now() % 1000 adds variance
    // within the same day so repeated calls don't return identical prospect lists.
    const seed = `scout-${currentYear}-${currentDay}-${region}-${Date.now() % 1000}`
    const rng = seededRandom(seed)

    const newProspects = generateSoloQueuePool(region, count, rng).map(p => ({
      ...p,
      trackedSince: { year: currentYear, dayOfYear: currentDay },
    }))

    set(state => ({
      scoutedRegion: region,
      prospects: [...state.prospects, ...newProspects],
    }))
  },

  async scoutProspect(prospectId: string) {
    const { prospects, managedTeamId, currentDay, currentYear } = get()
    const prospect = prospects.find(p => p.id === prospectId)
    if (!prospect || !managedTeamId) return

    // Determine staffBonus from scout on managed team
    let staffBonus = 0.3
    try {
      const team = await teamRepository.getById(managedTeamId)
      if (team) {
        const scout = team.staff.find(s => s.role === 'SCOUT')
        if (scout) {
          staffBonus = scout.competence / 20  // competence 1-20 → bonus 0.05-1.0
        }
      }
    } catch {
      // fallback to 0.3 if DB unavailable
    }

    const rng = seededRandom(`scout-${prospectId}-${currentYear}-${currentDay}`)

    // Refine the estimate
    const refined = refineProspectEstimate(prospect, staffBonus, rng)
    const refinedWithDiscovered: ScoutingProspect = { ...refined, discovered: true }

    // Generate scout report — need team and current players
    let report: ScoutReport | null = null
    try {
      const team = await teamRepository.getById(managedTeamId)
      const players = await playerRepository.getByTeam(managedTeamId)
      if (team) {
        report = generateScoutReport(
          refinedWithDiscovered,
          team,
          players,
          staffBonus,
          { year: currentYear, dayOfYear: currentDay },
          rng,
        )
      }
    } catch {
      // report stays null — UI handles missing report gracefully
    }

    set(state => ({
      prospects: state.prospects.map(p =>
        p.id === prospectId ? refinedWithDiscovered : p,
      ),
      scoutReports: report
        ? { ...state.scoutReports, [prospectId]: report }
        : state.scoutReports,
    }))
  },

  dismissProspect(prospectId: string) {
    set(state => ({
      dismissedProspectIds: [...state.dismissedProspectIds, prospectId],
    }))
  },
})
