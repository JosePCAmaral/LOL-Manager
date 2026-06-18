import type { StateCreator } from 'zustand'
import type { GameStore } from '../useGameStore'
import type { Player, StaffMember, Role, Contract } from '@types-app/index'
import {
  applyGeneralTraining,
  applyChampionTraining,
  applyScrimTraining,
} from '@engine/index'
import {
  playerRepository,
  staffRepository,
  teamRepository,
} from '@persistence/index'
import { seededRandom } from '@engine/core/rng'

export interface ContractOffer {
  salary: number
  durationDays: number
  buyoutClause: number
}

export interface SquadSlice {
  players: Player[]
  staff: StaffMember[]
  selectedPlayerId: string | null

  loadSquad(teamId: string): Promise<void>
  selectPlayer(id: string | null): void
  trainPlayer(playerId: string, type: 'general' | 'champion_focus', championId?: string): Promise<void>
  runScrim(): Promise<void>
  swapRoles(role: Role): void
  signPlayer(player: Player, offer: ContractOffer): Promise<void>
  releasePlayer(playerId: string): Promise<void>
}

export const createSquadSlice: StateCreator<GameStore, [], [], SquadSlice> = (set, get) => ({
  players: [],
  staff: [],
  selectedPlayerId: null,

  async loadSquad(teamId: string) {
    const [players, staffRecords] = await Promise.all([
      playerRepository.getByTeam(teamId),
      staffRepository.getByTeam(teamId),
    ])
    set({ players, staff: staffRecords })
  },

  selectPlayer(id: string | null) {
    set({ selectedPlayerId: id })
  },

  async trainPlayer(playerId: string, type: 'general' | 'champion_focus', championId?: string) {
    const { players, staff, currentDay, currentYear, allChampions } = get()
    const player = players.find(p => p.id === playerId)
    if (!player) return

    const rng = seededRandom(`train-${playerId}-${currentYear}-${currentDay}`)

    let updatedPlayer: Player
    if (type === 'general') {
      const result = applyGeneralTraining(player, staff, rng)
      updatedPlayer = result.player
    } else if (type === 'champion_focus' && championId) {
      const result = applyChampionTraining(player, championId, allChampions, staff, rng)
      updatedPlayer = result.player
    } else {
      return
    }

    await playerRepository.save(updatedPlayer)
    set({ players: players.map(p => (p.id === playerId ? updatedPlayer : p)) })
  },

  async runScrim() {
    const { players, staff, managedTeamId, currentDay, currentYear } = get()
    if (!managedTeamId) return

    const starters = players.filter(p => p.teamId === managedTeamId && p.isStarter)
    const rng = seededRandom(`scrim-${managedTeamId}-${currentYear}-${currentDay}`)

    const { players: updatedStarters } = applyScrimTraining(starters, staff, rng)
    await playerRepository.saveMany(updatedStarters)

    const updatedAll = players.map(p => {
      const updated = updatedStarters.find(u => u.id === p.id)
      return updated ?? p
    })
    set({ players: updatedAll })
  },

  swapRoles(role: Role) {
    const { players, managedTeamId } = get()
    if (!managedTeamId) return

    const starter = players.find(
      p => p.teamId === managedTeamId && p.role === role && p.isStarter,
    )
    const reserve = players.find(
      p => p.teamId === managedTeamId && p.role === role && !p.isStarter,
    )

    if (!starter || !reserve) return

    const newStarter = { ...reserve, isStarter: true }
    const newReserve = { ...starter, isStarter: false }

    void playerRepository.saveMany([newStarter, newReserve])
    set({
      players: players.map(p => {
        if (p.id === starter.id) return newReserve
        if (p.id === reserve.id) return newStarter
        return p
      }),
    })
  },

  async signPlayer(player: Player, offer: ContractOffer) {
    const { players, managedTeamId, currentDay, currentYear } = get()
    if (!managedTeamId) return

    const contract: Contract = {
      playerId: player.id,
      teamId: managedTeamId,
      salary: offer.salary,
      startDate: { year: currentYear, dayOfYear: currentDay },
      endDate: {
        year: currentYear + Math.floor(offer.durationDays / 365),
        dayOfYear: ((currentDay + offer.durationDays - 1) % 365) + 1,
      },
      buyoutClause: offer.buyoutClause,
    }

    const signedPlayer: Player = {
      ...player,
      teamId: managedTeamId,
      contract,
      isStarter: false,
    }

    await playerRepository.save(signedPlayer)

    const existing = players.find(p => p.id === signedPlayer.id)
    if (existing) {
      set({ players: players.map(p => (p.id === signedPlayer.id ? signedPlayer : p)) })
    } else {
      set({ players: [...players, signedPlayer] })
    }

    // Update team roster in DB
    const team = await teamRepository.getById(managedTeamId)
    if (team) {
      const role = signedPlayer.role
      const updatedTeam = {
        ...team,
        roster: {
          ...team.roster,
          reserves: { ...team.roster.reserves, [role]: signedPlayer.id },
        },
      }
      await teamRepository.save(updatedTeam)
    }
  },

  async releasePlayer(playerId: string) {
    const { players } = get()
    const player = players.find(p => p.id === playerId)
    if (!player) return

    const releasedPlayer: Player = { ...player, teamId: null, contract: null, isStarter: false }
    await playerRepository.save(releasedPlayer)
    set({ players: players.filter(p => p.id !== playerId) })
  },
})
