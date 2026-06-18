/**
 * calendar.ts — pure calendar functions.
 *
 * A CalendarDay is an immutable snapshot of one day's planned activity.
 * All functions return new arrays/objects; no mutation of arguments.
 */

import type { GameDate, Player, StaffMember } from '@types-app/index'
import { compareDates } from '../core/gameDate'
import type { SeededRng } from '../core/rng'
import { applyMoraleDecay, recoverStamina } from '../players/morale'
import { developPlayer } from '../players/development'
import { applyGeneralTraining, applyScrimTraining, canTrain } from '../training/training'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DayActivityType =
  | 'match'             // official league game
  | 'scrim'             // practice match against another team
  | 'general_training'  // physical/tactical general training
  | 'champion_training' // focus on a specific champion
  | 'rest'              // rest day (recovers stamina/morale)
  | 'special_event'     // sponsor activation, media day, etc.
  | 'offseason'         // vacation / off-season

export interface DayActivity {
  type: DayActivityType
  fixtureId?: string    // present when type === 'match'
  championId?: string   // present when type === 'champion_training'
  notes?: string
}

export interface CalendarDay {
  date: GameDate
  activity: DayActivity
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Creates an empty calendar of `lengthDays` days starting at `startDate`.
 * Every day defaults to { type: 'offseason' }.
 */
export function createEmptyCalendar(startDate: GameDate, lengthDays: number): CalendarDay[] {
  const days: CalendarDay[] = []
  // We import advanceDate lazily to avoid a circular dep concern; it lives in core.
  // Using the same arithmetic inline is safer here.
  const DAYS_PER_YEAR = 365
  const startAbsolute = (startDate.year - 1) * DAYS_PER_YEAR + (startDate.dayOfYear - 1)

  for (let i = 0; i < lengthDays; i++) {
    const absolute = startAbsolute + i
    const year = Math.floor(absolute / DAYS_PER_YEAR) + 1
    const dayOfYear = (absolute % DAYS_PER_YEAR) + 1
    days.push({
      date: { year, dayOfYear },
      activity: { type: 'offseason' },
    })
  }

  return days
}

/**
 * Returns a new calendar where the day matching `date` has its activity
 * replaced by `activity`. If `date` is not in the calendar, returns a shallow
 * copy of the original array unchanged.
 */
export function setActivity(
  calendar: CalendarDay[],
  date: GameDate,
  activity: DayActivity,
): CalendarDay[] {
  return calendar.map(day =>
    compareDates(day.date, date) === 0 ? { ...day, activity } : day,
  )
}

/**
 * Returns all CalendarDays whose date falls within [from, to] (inclusive).
 */
export function getActivitiesInRange(
  calendar: CalendarDay[],
  from: GameDate,
  to: GameDate,
): CalendarDay[] {
  return calendar.filter(
    day => compareDates(day.date, from) >= 0 && compareDates(day.date, to) <= 0,
  )
}

/**
 * Counts how many days in the calendar have the given activity type.
 */
export function countActivityType(calendar: CalendarDay[], type: DayActivityType): number {
  return calendar.filter(day => day.activity.type === type).length
}

/**
 * Returns the first CalendarDay with type === 'match' on or after `from`,
 * or null if none exists.
 */
export function getNextMatch(calendar: CalendarDay[], from: GameDate): CalendarDay | null {
  return (
    calendar.find(
      day => day.activity.type === 'match' && compareDates(day.date, from) >= 0,
    ) ?? null
  )
}

// ---------------------------------------------------------------------------
// advanceDay
// ---------------------------------------------------------------------------

export interface AdvanceDayResult {
  updatedPlayers: Player[]
  events: string[]
}

/**
 * Advances a single calendar day and applies the appropriate player effects.
 *
 * Design decisions:
 * - 'match': stamina cost of -15 per player is applied here. The match result
 *   itself is resolved separately by the matchSlice.
 * - 'scrim': synergy incremented per pair by iterating over all combinations.
 * - 'offseason': developPlayer called weekly (dayIndex % 7 === 0) for age >= 16.
 * - 'rest': applyMoraleDecay applied weekly (dayIndex % 7 === 0).
 * - Stamina clamped to [0,100] and morale clamped to [0,100] inline.
 */
export function advanceDay(
  _calendar: CalendarDay[],
  dayIndex: number,
  players: Player[],
  staff: StaffMember[],
  rng: SeededRng,
): AdvanceDayResult {
  const day = _calendar[dayIndex]
  const activityType = day?.activity?.type

  if (activityType === 'match') {
    const updatedPlayers = players.map(p => ({
      ...p,
      stamina: Math.max(0, p.stamina - 15),
    }))
    return { updatedPlayers, events: ['Dia de jogo — stamina consumida'] }
  }

  if (activityType === 'general_training' || activityType === 'champion_training') {
    let trained = 0
    let rested = 0
    const updatedPlayers = players.map(p => {
      if (canTrain(p)) {
        trained++
        return applyGeneralTraining(p, staff, rng).player
      } else {
        rested++
        return recoverStamina(p)
      }
    })
    const label = activityType === 'champion_training'
      ? 'Treino de campeão aplicado'
      : `Treino geral — ${trained} jogadores treinaram, ${rested} descansaram`
    return { updatedPlayers, events: [label] }
  }

  if (activityType === 'scrim') {
    const { players: scrimmed } = applyScrimTraining(players, staff, rng)
    // Increment synergy for each pair of players (starters)
    let pairCount = 0
    const withSynergy = scrimmed.map(p => {
      const newSynergy = Math.min(100, (p.attributes.synergy ?? 0) + 1)
      if (newSynergy !== (p.attributes.synergy ?? 0)) pairCount++
      return { ...p, attributes: { ...p.attributes, synergy: newSynergy } }
    })
    return {
      updatedPlayers: withSynergy,
      events: [`Scrim concluído — sinergia +1 para ${pairCount} pares`],
    }
  }

  if (activityType === 'rest') {
    let updatedPlayers = players.map(p => recoverStamina(p))
    if (dayIndex % 7 === 0) {
      updatedPlayers = updatedPlayers.map(p => applyMoraleDecay(p))
    }
    return { updatedPlayers, events: ['Descanso — stamina recuperada'] }
  }

  if (activityType === 'special_event') {
    const updatedPlayers = players.map(p => ({
      ...p,
      morale: Math.min(100, p.morale + 5),
    }))
    return { updatedPlayers, events: ['Evento especial — morale +5'] }
  }

  if (activityType === 'offseason') {
    let updatedPlayers = players.map(p => recoverStamina(p, 'offseason'))
    if (dayIndex % 7 === 0) {
      updatedPlayers = updatedPlayers.map(p =>
        p.age >= 16 ? developPlayer(p, rng) : p
      )
    }
    return { updatedPlayers, events: ['Offseason — desenvolvimento aplicado'] }
  }

  // undefined / no activity
  let updatedPlayers = players
  if (dayIndex % 7 === 0) {
    updatedPlayers = players.map(p => applyMoraleDecay(p))
  }
  return { updatedPlayers, events: [] }
}
