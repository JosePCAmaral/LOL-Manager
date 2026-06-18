import type { StateCreator } from 'zustand'
import type { GameStore } from '../useGameStore'
import type { Player, Champion, DraftResult } from '@types-app/index'
import type { DraftState } from '@engine/draft/draftEngine'
import {
  createDraftState,
  applyDraftAction as engineApplyDraftAction,
  runAutoDraft,
  draftStateToResult,
} from '@engine/index'
import { championRepository } from '@persistence/index'
import { seededRandom } from '@engine/core/rng'

export interface DraftSlice {
  draftState: DraftState | null
  draftResult: DraftResult | null
  allChampions: Champion[]

  loadChampions(): Promise<void>
  startDraft(blueTeamPlayers: Player[], redTeamPlayers: Player[]): void
  applyDraftAction(championId: string): void
  runAutoDraft(blueTeamPlayers: Player[], redTeamPlayers: Player[]): void
  resetDraft(): void
}

export const createDraftSlice: StateCreator<GameStore, [], [], DraftSlice> = (set, get) => ({
  draftState: null,
  draftResult: null,
  allChampions: [],

  async loadChampions() {
    const champions = await championRepository.getAll()
    set({ allChampions: champions })
  },

  startDraft(_blueTeamPlayers: Player[], _redTeamPlayers: Player[]) {
    const freshState = createDraftState()
    set({ draftState: freshState, draftResult: null })
  },

  applyDraftAction(championId: string) {
    const { draftState } = get()
    if (!draftState || draftState.finished) return

    const newState = engineApplyDraftAction(draftState, championId)
    set({ draftState: newState })

    if (newState.finished) {
      const result = draftStateToResult(newState)
      set({ draftResult: result })
    }
  },

  runAutoDraft(blueTeamPlayers: Player[], redTeamPlayers: Player[]) {
    const { allChampions, currentYear, currentDay } = get()
    const rng = seededRandom(`auto-draft-${currentYear}-${currentDay}`)

    const result = runAutoDraft(
      'blue',
      'red',
      blueTeamPlayers,
      redTeamPlayers,
      allChampions,
      rng,
    )
    set({ draftResult: result, draftState: null })
  },

  resetDraft() {
    set({ draftState: null, draftResult: null })
  },
})
