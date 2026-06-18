import type { StateCreator } from 'zustand'
import type { GameStore } from '../useGameStore'
import type { Fixture } from '@types-app/index'
import type { CalendarDay, DayActivity } from '@engine/calendar/calendar'
import type { SeasonPhase } from '@engine/calendar/season'
import {
  getSeasonPhase,
  buildSeasonCalendar,
  setActivity,
  getNextMatch,
} from '@engine/index'
import {
  applyMoraleDecay,
  recoverStamina,
  applyGeneralTraining,
} from '@engine/index'
import {
  playerRepository,
  fixtureRepository,
} from '@persistence/index'
import { seededRandom } from '@engine/core/rng'

export interface CalendarSlice {
  calendar: CalendarDay[]
  seasonPhase: SeasonPhase
  nextMatchFixture: Fixture | null

  advanceDay(): Promise<void>
  advanceToNextMatch(): Promise<void>
  setDayActivity(day: number, activity: DayActivity): void
}

export const createCalendarSlice: StateCreator<GameStore, [], [], CalendarSlice> = (set, get) => ({
  calendar: [],
  seasonPhase: 'preseason',
  nextMatchFixture: null,

  async advanceDay() {
    const { currentDay, currentYear, managedTeamId, players, staff, calendar } = get()

    const newDay = currentDay + 1
    const newDate = { year: currentYear, dayOfYear: newDay }
    const newPhase = getSeasonPhase(newDate)

    let updatedPlayers = [...players]

    // Weekly morale decay
    if (newDay % 7 === 0) {
      updatedPlayers = updatedPlayers.map(p => applyMoraleDecay(p))
    }

    // Apply daily activity effects for managed team starters
    const todayCalendarEntry = calendar.find(
      c => c.date.year === currentYear && c.date.dayOfYear === newDay,
    )
    const todayActivity = todayCalendarEntry?.activity

    if (todayActivity && managedTeamId) {
      const rng = seededRandom(`${managedTeamId}-day-${newDay}`)
      const starters = updatedPlayers.filter(p => p.teamId === managedTeamId && p.isStarter)

      if (todayActivity.type === 'general_training') {
        const trainedPlayers = starters.map(p => {
          const { player } = applyGeneralTraining(p, staff, rng)
          return player
        })
        updatedPlayers = updatedPlayers.map(p => {
          const trained = trainedPlayers.find(t => t.id === p.id)
          return trained ?? p
        })
      } else if (todayActivity.type === 'rest') {
        updatedPlayers = updatedPlayers.map(p => {
          if (p.teamId === managedTeamId && p.isStarter) {
            return recoverStamina(p, newPhase === 'offseason' ? 'offseason' : 'regular')
          }
          return p
        })
      }
    }

    // Persist updated players
    const managedPlayers = updatedPlayers.filter(p => p.teamId === managedTeamId)
    if (managedPlayers.length > 0) {
      await playerRepository.saveMany(managedPlayers)
    }

    // Find managed team's next unplayed fixture after the new day
    let nextMatchFixture: Fixture | null = null
    if (managedTeamId) {
      const allFixtures = await fixtureRepository.getAll()
      const managed = allFixtures
        .filter(f =>
          !f.played &&
          (f.teamA === managedTeamId || f.teamB === managedTeamId) &&
          (f.date.year > currentYear || (f.date.year === currentYear && f.date.dayOfYear > newDay)),
        )
        .sort((a, b) =>
          a.date.year !== b.date.year ? a.date.year - b.date.year : a.date.dayOfYear - b.date.dayOfYear,
        )
      nextMatchFixture = managed[0] ?? null
    }

    set({
      currentDay: newDay,
      seasonPhase: newPhase,
      players: updatedPlayers,
      nextMatchFixture,
    })
  },

  async advanceToNextMatch() {
    const { calendar, currentDay, currentYear, nextMatchFixture } = get()
    if (!nextMatchFixture) return

    // Find the day of the next match
    const nextMatchDay = getNextMatch(calendar, { year: currentYear, dayOfYear: currentDay + 1 })
    if (!nextMatchDay) return

    const targetDay = nextMatchDay.date.dayOfYear
    const daysToAdvance = targetDay - currentDay

    for (let i = 0; i < daysToAdvance; i++) {
      await get().advanceDay()
    }
  },

  setDayActivity(day: number, activity: DayActivity) {
    const { calendar, currentYear } = get()
    const newCalendar = setActivity(calendar, { year: currentYear, dayOfYear: day }, activity)
    set({ calendar: newCalendar })
  },
})
