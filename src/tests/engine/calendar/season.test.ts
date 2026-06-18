import { describe, it, expect } from 'vitest'
import {
  getSeasonPhase,
  buildSeasonCalendar,
  REGULAR_SEASON_START_DAY,
  REGULAR_SEASON_END_DAY,
  PLAYOFFS_START_DAY,
  PLAYOFFS_END_DAY,
  OFFSEASON_START_DAY,
  SEASON_LENGTH_DAYS,
} from '@engine/calendar/season'
import { makeFixture } from '../helpers'
import type { GameDate } from '@types-app/index'

// ---------------------------------------------------------------------------
// getSeasonPhase
// ---------------------------------------------------------------------------

describe('getSeasonPhase', () => {
  it('day=1 → preseason', () => {
    expect(getSeasonPhase({ year: 1, dayOfYear: 1 })).toBe('preseason')
  })

  it('day=14 → preseason (last day before regular season)', () => {
    expect(getSeasonPhase({ year: 1, dayOfYear: 14 })).toBe('preseason')
  })

  it('day=15 → regularSeason (first day of regular season)', () => {
    expect(getSeasonPhase({ year: 1, dayOfYear: 15 })).toBe('regularSeason')
  })

  it('day=270 → regularSeason (last day of regular season)', () => {
    expect(getSeasonPhase({ year: 1, dayOfYear: 270 })).toBe('regularSeason')
  })

  it('days 271-279 → offseason (inter-phase rest)', () => {
    for (let d = 271; d <= 279; d++) {
      expect(getSeasonPhase({ year: 1, dayOfYear: d })).toBe('offseason')
    }
  })

  it('day=280 → playoffs (first day of playoffs)', () => {
    expect(getSeasonPhase({ year: 1, dayOfYear: 280 })).toBe('playoffs')
  })

  it('day=320 → playoffs (last day of playoffs)', () => {
    expect(getSeasonPhase({ year: 1, dayOfYear: 320 })).toBe('playoffs')
  })

  it('day=321 → offseason (first day of off-season)', () => {
    expect(getSeasonPhase({ year: 1, dayOfYear: 321 })).toBe('offseason')
  })

  it('day=365 → offseason (last day of the year)', () => {
    expect(getSeasonPhase({ year: 1, dayOfYear: 365 })).toBe('offseason')
  })
})

// ---------------------------------------------------------------------------
// buildSeasonCalendar
// ---------------------------------------------------------------------------

describe('buildSeasonCalendar', () => {
  it('calendar has exactly 365 days', () => {
    const cal = buildSeasonCalendar(1, [])
    expect(cal).toHaveLength(365)
  })

  it('days 1-14 are all offseason', () => {
    const cal = buildSeasonCalendar(1, [])
    for (let d = 1; d <= 14; d++) {
      expect(cal[d - 1].activity.type).toBe('offseason')
    }
  })

  it('days 321-365 are all offseason', () => {
    const cal = buildSeasonCalendar(1, [])
    for (let d = 321; d <= 365; d++) {
      expect(cal[d - 1].activity.type).toBe('offseason')
    }
  })

  it('days 271-279 are all rest (inter-phase break)', () => {
    const cal = buildSeasonCalendar(1, [])
    for (let d = 271; d <= 279; d++) {
      expect(cal[d - 1].activity.type).toBe('rest')
    }
  })

  it('training/rest pattern for a fixture-free week in regular season: 4 general_training + 3 rest', () => {
    // Find a 7-consecutive-day block in regular season with no fixtures:
    // days 15-21 (no fixtures passed)
    const cal = buildSeasonCalendar(1, [])

    let trainingCount = 0
    let restCount = 0
    for (let d = 15; d <= 21; d++) {
      const type = cal[d - 1].activity.type
      if (type === 'general_training') trainingCount++
      else if (type === 'rest') restCount++
    }
    expect(trainingCount).toBe(4)
    expect(restCount).toBe(3)
  })

  it('day with a fixture gets type=match and correct fixtureId', () => {
    const fixture = makeFixture({
      id: 'fix-1-0000',
      date: { year: 1, dayOfYear: 20 },
      teamA: 'ta',
      teamB: 'tb',
    })
    const cal = buildSeasonCalendar(1, [fixture])
    const matchDay = cal[19] // dayOfYear 20 is index 19
    expect(matchDay.activity.type).toBe('match')
    expect(matchDay.activity.fixtureId).toBe('fix-1-0000')
  })

  it('fixtures from a different year are ignored', () => {
    const fixture = makeFixture({
      id: 'fix-2-0000',
      date: { year: 2, dayOfYear: 20 },
    })
    const cal = buildSeasonCalendar(1, [fixture])
    // day 20 should not be a match
    expect(cal[19].activity.type).not.toBe('match')
  })

  it('every CalendarDay has the correct date (year=1, sequential dayOfYear)', () => {
    const cal = buildSeasonCalendar(1, [])
    for (let i = 0; i < 365; i++) {
      expect(cal[i].date.year).toBe(1)
      expect(cal[i].date.dayOfYear).toBe(i + 1)
    }
  })
})
