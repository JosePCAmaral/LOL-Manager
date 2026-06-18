import type { StateCreator } from 'zustand'
import type { GameStore } from '../useGameStore'
import type { MatchResult, Fixture, Player, Champion } from '@types-app/index'
import type { Role } from '@types-app/index'
import {
  simulateMatch,
  runAutoDraft,
} from '@engine/index'
import {
  applyWinBonus,
  applyLossPenalty,
} from '@engine/index'
import {
  playerRepository,
  matchResultRepository,
  fixtureRepository,
  leagueRepository,
  championRepository,
} from '@persistence/index'
import { seededRandom } from '@engine/core/rng'

export interface MatchSlice {
  currentMatchResult: MatchResult | null
  matchHistory: MatchResult[]
  isSimulating: boolean

  simulateMatch(fixture: Fixture): Promise<void>
  loadMatchHistory(teamId: string): Promise<void>
  clearCurrentMatch(): void
}

const ROLES: Role[] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

function getOrderedPlayers(players: Player[], teamId: string): Player[] {
  const teamPlayers = players.filter(p => p.teamId === teamId && p.isStarter)
  return ROLES.map(role => teamPlayers.find(p => p.role === role)).filter((p): p is Player => p !== undefined)
}

function getChampionsForPlayers(players: Player[], picks: Record<Role, string>, allChampions: Champion[]): Champion[] {
  return ROLES.map(role => {
    const championId = picks[role]
    const player = players.find(p => p.role === role)
    if (!player || !championId) return null
    return allChampions.find(c => c.id === championId) ?? null
  }).filter((c): c is Champion => c !== null)
}

export const createMatchSlice: StateCreator<GameStore, [], [], MatchSlice> = (set, get) => ({
  currentMatchResult: null,
  matchHistory: [],
  isSimulating: false,

  async simulateMatch(fixture: Fixture) {
    set({ isSimulating: true })
    try {
      console.log('[matchSlice] simulateMatch start', fixture.id, fixture.teamA, 'vs', fixture.teamB)
      const { managedTeamId } = get()
      const rng = seededRandom(fixture.id)

      // Fetch players for both teams; fall back to store players if DB returns empty
      const [bluePlayersDb, redPlayersDb, allChampions] = await Promise.all([
        playerRepository.getByTeam(fixture.teamA),
        playerRepository.getByTeam(fixture.teamB),
        championRepository.getAll(),
      ])

      const storePlayers = get().players
      const bluePlayersAll = bluePlayersDb.length > 0
        ? bluePlayersDb
        : storePlayers.filter(p => p.teamId === fixture.teamA)
      const redPlayersAll = redPlayersDb.length > 0
        ? redPlayersDb
        : storePlayers.filter(p => p.teamId === fixture.teamB)

      const bluePlayers = getOrderedPlayers(bluePlayersAll, fixture.teamA)
      const redPlayers = getOrderedPlayers(redPlayersAll, fixture.teamB)

      // Run auto-draft
      const draft = runAutoDraft(
        fixture.teamA,
        fixture.teamB,
        bluePlayers,
        redPlayers,
        allChampions,
        rng,
      )

      const bluePicks = draft.picks[fixture.teamA] as Record<Role, string>
      const redPicks = draft.picks[fixture.teamB] as Record<Role, string>

      const blueChampions = getChampionsForPlayers(bluePlayers, bluePicks, allChampions)
      const redChampions = getChampionsForPlayers(redPlayers, redPicks, allChampions)

      // Simulate match
      const result = simulateMatch(
        {
          matchId: fixture.id,
          leagueId: '',
          date: fixture.date,
          blueTeamId: fixture.teamA,
          redTeamId: fixture.teamB,
          bluePlayers,
          redPlayers,
          blueChampions,
          redChampions,
          draft,
        },
        rng,
      )

      // Save result
      await matchResultRepository.save(result)

      // Mark fixture as played
      const updatedFixture: Fixture = { ...fixture, played: true }
      await fixtureRepository.save(updatedFixture)

      // Update league standings
      const leagues = await leagueRepository.getAll()
      for (const league of leagues) {
        const standings = league.standings.map(entry => {
          if (entry.teamId === result.winner) {
            return { ...entry, wins: entry.wins + 1 }
          }
          const loser = result.winner === result.teamA ? result.teamB : result.teamA
          if (entry.teamId === loser) {
            return { ...entry, losses: entry.losses + 1 }
          }
          return entry
        })
        await leagueRepository.save({ ...league, standings })
      }

      // Apply morale bonuses/penalties to managed team players
      if (managedTeamId) {
        const managedPlayers =
          managedTeamId === fixture.teamA ? bluePlayersAll : redPlayersAll
        const won = result.winner === managedTeamId
        const updatedManaged = managedPlayers.map(p =>
          won ? applyWinBonus(p) : applyLossPenalty(p),
        )
        await playerRepository.saveMany(updatedManaged)

        // Update store players
        const allStorePlayers = get().players
        const newPlayers = allStorePlayers.map(p => {
          const updated = updatedManaged.find(u => u.id === p.id)
          return updated ?? p
        })
        set({ players: newPlayers })
      }

      set(state => ({
        currentMatchResult: result,
        matchHistory: [result, ...state.matchHistory],
      }))
    } catch (err) {
      console.error('[matchSlice] simulateMatch error:', err)
      set({ isSimulating: false })
      throw err
    } finally {
      set({ isSimulating: false })
    }
  },

  async loadMatchHistory(teamId: string) {
    const results = await matchResultRepository.getByTeam(teamId)
    set({ matchHistory: results })
  },

  clearCurrentMatch() {
    set({ currentMatchResult: null })
  },
})
