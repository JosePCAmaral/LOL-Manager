import { create } from 'zustand'
import type { CalendarSlice } from './slices/calendarSlice'
import { createCalendarSlice } from './slices/calendarSlice'
import type { SquadSlice } from './slices/squadSlice'
import { createSquadSlice } from './slices/squadSlice'
import type { FinanceSlice } from './slices/financeSlice'
import { createFinanceSlice } from './slices/financeSlice'
import type { DraftSlice } from './slices/draftSlice'
import { createDraftSlice } from './slices/draftSlice'
import type { MatchSlice } from './slices/matchSlice'
import { createMatchSlice } from './slices/matchSlice'
import type { ScoutingSlice } from './slices/scoutingSlice'
import { createScoutingSlice } from './slices/scoutingSlice'

import { SEED_PLAYERS } from '../data/seed/players'
import { SEED_TEAMS } from '../data/seed/teams'
import { SEED_LEAGUES } from '../data/seed/leagues'
import { CHAMPIONS as seedChampions } from '../data/champions'
import {
  saveRepository,
  playerRepository,
  teamRepository,
  leagueRepository,
  staffRepository,
  fixtureRepository,
  championRepository,
  matchResultRepository,
} from '../persistence'
import type { StaffRecord } from '../persistence/db'
import type { SaveSlot, GameState } from '../persistence/db'
import { generateRoundRobin } from '../engine/calendar/schedule'
import { buildSeasonCalendar, getSeasonPhase } from '../engine/calendar/season'
import { seededRandom } from '../engine/core/rng'

// ---------------------------------------------------------------------------
// Root store interface
// ---------------------------------------------------------------------------

export type View = 'home' | 'saves' | 'newgame' | 'dashboard' | 'squad' | 'calendar' | 'draft' | 'match' | 'finance' | 'scouting' | 'transfers' | 'standings'

interface RootSlice {
  isLoading: boolean
  error: string | null
  managedTeamId: string | null
  currentDay: number
  currentYear: number
  currentView: View

  setError(msg: string | null): void
  setLoading(v: boolean): void
  navigateTo(view: View): void
  initNewGame(teamId: string, difficulty?: 'easy' | 'normal' | 'hard'): Promise<void>
  loadGame(slotId: string): Promise<void>
  saveGame(slotId: string, slotName: string): Promise<void>
}

export type GameStore = RootSlice & CalendarSlice & SquadSlice & FinanceSlice & DraftSlice & MatchSlice & ScoutingSlice

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------

export const useGameStore = create<GameStore>()((...a) => {
  const [set, get] = a
  return {
    // Root state
    isLoading: false,
    error: null,
    managedTeamId: null,
    currentDay: 1,
    currentYear: 1,
    currentView: 'home' as View,

    setError(msg) {
      set({ error: msg })
    },

    setLoading(v) {
      set({ isLoading: v })
    },

    navigateTo(view: View) {
      set({ currentView: view })
    },

    async initNewGame(teamId: string, difficulty: 'easy' | 'normal' | 'hard' = 'normal') {
      set({ isLoading: true, error: null })
      try {
        const year = 1
        const rng = seededRandom(`new-game-${teamId}-${year}`)

        // Generate fixtures for all leagues — prefix IDs with league.id to avoid
        // collisions (each generateRoundRobin call resets its own fixtureIndex).
        const allFixtures = SEED_LEAGUES.flatMap(league =>
          generateRoundRobin(league.teamIds, year).map(f => ({
            ...f,
            id: `${league.id}-${f.id}`,
          })),
        )

        // Build season calendar for year 1
        const seasonCalendar = buildSeasonCalendar(year, allFixtures)

        // Apply difficulty budget multiplier
        const difficultyMultiplier = difficulty === 'easy' ? 1.5 : difficulty === 'hard' ? 0.7 : 1.0

        // Prepare leagues with schedule and standings
        const leagues = SEED_LEAGUES.map(league => {
          const leagueFixtures = allFixtures.filter(f =>
            league.teamIds.some(tid => f.teamA === tid || f.teamB === tid),
          )
          return {
            ...league,
            schedule: leagueFixtures,
            standings: league.teamIds.map(tid => ({ teamId: tid, wins: 0, losses: 0 })),
          }
        })

        // Prepare staff records (flatten staff from teams)
        const staffRecords: StaffRecord[] = SEED_TEAMS.flatMap(team =>
          team.staff.map(s => ({ ...s, teamId: team.id })),
        )

        // Build slot metadata
        const managedTeam = SEED_TEAMS.find(t => t.id === teamId)
        const managedLeague = leagues.find(l => l.teamIds.includes(teamId))

        const slot: SaveSlot = {
          id: 'save-1',
          name: `${managedTeam?.name ?? teamId} — Ano ${year}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          seasonYear: year,
          dayOfYear: 1,
          managedTeamId: teamId,
          teamName: managedTeam?.name ?? teamId,
          leagueName: managedLeague?.name ?? '',
          wins: 0,
          losses: 0,
        }

        const gameState: GameState = {
          id: 'current',
          saveSlotId: 'save-1',
          seasonYear: year,
          dayOfYear: 1,
          managedTeamId: teamId,
          rngSeed: `new-game-${teamId}-${year}`,
          activeDatapackIds: [],
          difficulty,
        }

        await saveRepository.initNewGame(
          slot,
          gameState,
          SEED_PLAYERS,
          SEED_TEAMS,
          leagues,
          staffRecords,
          seedChampions,
          allFixtures,
        )

        // Determine initial nextMatchFixture — find the managed team's first unplayed fixture
        let nextMatchFixture = null
        {
          const managed = allFixtures
            .filter(f => !f.played && (f.teamA === teamId || f.teamB === teamId))
            .sort((a, b) => a.date.year !== b.date.year ? a.date.year - b.date.year : a.date.dayOfYear - b.date.dayOfYear)
          nextMatchFixture = managed[0] ?? null
        }

        const initialPhase = getSeasonPhase({ year, dayOfYear: 1 })

        // Load managed team's players and staff into store
        const managedPlayers = SEED_PLAYERS.filter(p => p.teamId === teamId)
        const managedStaff = staffRecords.filter(s => s.teamId === teamId)

        void rng // seed used, rng consumed in fixture generation context

        const adjustedBudget = Math.floor((managedTeam?.budget ?? 0) * difficultyMultiplier)

        set({
          managedTeamId: teamId,
          currentDay: 1,
          currentYear: year,
          calendar: seasonCalendar,
          seasonPhase: initialPhase,
          nextMatchFixture,
          players: managedPlayers,
          staff: managedStaff,
          budget: adjustedBudget,
          allChampions: seedChampions,
        })
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Erro ao inicializar jogo' })
        throw err
      } finally {
        set({ isLoading: false })
      }
    },

    async loadGame(slotId: string) {
      set({ isLoading: true, error: null })
      try {
        const gameState = await saveRepository.loadGame(slotId)
        if (!gameState) throw new Error(`Save slot "${slotId}" not found`)

        const { managedTeamId, seasonYear, dayOfYear } = gameState
        const teamId = managedTeamId

        // Load all game data from DB
        const [players, staffRecords, allFixtures, champions, team] = await Promise.all([
          playerRepository.getByTeam(teamId),
          staffRepository.getByTeam(teamId),
          fixtureRepository.getAll(),
          championRepository.getAll(),
          teamRepository.getById(teamId),
        ])

        const seasonCalendar = buildSeasonCalendar(seasonYear, allFixtures)
        const currentDate = { year: seasonYear, dayOfYear }
        const phase = getSeasonPhase(currentDate)

        // Find managed team's next unplayed fixture after current day
        let nextMatchFixture = null
        {
          const managed = allFixtures
            .filter(f =>
              !f.played &&
              (f.teamA === teamId || f.teamB === teamId) &&
              (f.date.year > seasonYear || (f.date.year === seasonYear && f.date.dayOfYear > dayOfYear)),
            )
            .sort((a, b) => a.date.year !== b.date.year ? a.date.year - b.date.year : a.date.dayOfYear - b.date.dayOfYear)
          nextMatchFixture = managed[0] ?? null
        }

        // Load match history
        const matchHistory = await matchResultRepository.getByTeam(teamId)

        set({
          managedTeamId: teamId,
          currentDay: dayOfYear,
          currentYear: seasonYear,
          calendar: seasonCalendar,
          seasonPhase: phase,
          nextMatchFixture,
          players,
          staff: staffRecords,
          budget: team?.budget ?? 0,
          allChampions: champions,
          matchHistory,
        })
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Erro ao carregar jogo' })
        throw err
      } finally {
        set({ isLoading: false })
      }
    },

    async saveGame(slotId: string, slotName: string) {
      set({ isLoading: true, error: null })
      try {
        const { managedTeamId, currentDay, currentYear, matchHistory } = get()
        if (!managedTeamId) throw new Error('Nenhum jogo activo')

        const [team, leagues] = await Promise.all([
          teamRepository.getById(managedTeamId),
          leagueRepository.getAll(),
        ])

        const managedLeague = leagues.find(l => l.teamIds.includes(managedTeamId))
        const standing = managedLeague?.standings.find(s => s.teamId === managedTeamId)

        const slot: SaveSlot = {
          id: slotId,
          name: slotName,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          seasonYear: currentYear,
          dayOfYear: currentDay,
          managedTeamId,
          teamName: team?.name ?? managedTeamId,
          leagueName: managedLeague?.name ?? '',
          wins: standing?.wins ?? matchHistory.filter(m => m.winner === managedTeamId).length,
          losses: standing?.losses ?? matchHistory.filter(m => m.winner !== managedTeamId && (m.teamA === managedTeamId || m.teamB === managedTeamId)).length,
        }

        const gameState: GameState = {
          id: 'current',
          saveSlotId: slotId,
          seasonYear: currentYear,
          dayOfYear: currentDay,
          managedTeamId,
          rngSeed: `save-${managedTeamId}-${currentYear}-${currentDay}`,
          activeDatapackIds: [],
        }

        await saveRepository.saveGame(slot, gameState)
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Erro ao guardar jogo' })
        throw err
      } finally {
        set({ isLoading: false })
      }
    },

    // Slice compositions
    ...createCalendarSlice(...a),
    ...createSquadSlice(...a),
    ...createFinanceSlice(...a),
    ...createDraftSlice(...a),
    ...createMatchSlice(...a),
    ...createScoutingSlice(...a),
  }
})
