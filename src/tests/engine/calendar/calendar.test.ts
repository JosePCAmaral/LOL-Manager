import { describe, it, expect } from 'vitest'
import {
  createEmptyCalendar,
  setActivity,
  getActivitiesInRange,
  countActivityType,
  getNextMatch,
  type CalendarDay,
} from '@engine/calendar/calendar'
import type { GameDate } from '@types-app/index'

describe('createEmptyCalendar', () => {
  it('creates an array of the correct length', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 365)
    expect(cal).toHaveLength(365)
  })

  it('all days default to type offseason', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 30)
    for (const day of cal) {
      expect(day.activity.type).toBe('offseason')
    }
  })

  it('first day has the correct date', () => {
    const start: GameDate = { year: 2, dayOfYear: 50 }
    const cal = createEmptyCalendar(start, 10)
    expect(cal[0].date).toEqual({ year: 2, dayOfYear: 50 })
  })

  it('dates are sequential and correct across year boundary', () => {
    // Start at day 364 of year 1 — wraps into year 2
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 364 }, 5)
    expect(cal[0].date).toEqual({ year: 1, dayOfYear: 364 })
    expect(cal[1].date).toEqual({ year: 1, dayOfYear: 365 })
    expect(cal[2].date).toEqual({ year: 2, dayOfYear: 1 })
    expect(cal[3].date).toEqual({ year: 2, dayOfYear: 2 })
  })

  it('length=0 returns empty array', () => {
    expect(createEmptyCalendar({ year: 1, dayOfYear: 1 }, 0)).toHaveLength(0)
  })
})

describe('setActivity', () => {
  it('updates the activity on the matching date', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 10)
    const target: GameDate = { year: 1, dayOfYear: 5 }
    const result = setActivity(cal, target, { type: 'rest' })
    const updated = result.find(d => d.date.dayOfYear === 5 && d.date.year === 1)
    expect(updated?.activity.type).toBe('rest')
  })

  it('does not modify other days', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 10)
    const result = setActivity(cal, { year: 1, dayOfYear: 5 }, { type: 'rest' })
    const others = result.filter(d => d.date.dayOfYear !== 5)
    for (const d of others) {
      expect(d.activity.type).toBe('offseason')
    }
  })

  it('returns a copy with same length when date is not found', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 5)
    const result = setActivity(cal, { year: 99, dayOfYear: 100 }, { type: 'rest' })
    expect(result).toHaveLength(5)
    for (const d of result) {
      expect(d.activity.type).toBe('offseason')
    }
  })

  it('does not mutate the original calendar array', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 5)
    const clone = JSON.parse(JSON.stringify(cal))
    setActivity(cal, { year: 1, dayOfYear: 3 }, { type: 'match', fixtureId: 'f1' })
    expect(cal).toEqual(clone)
  })

  it('sets fixtureId on a match activity', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 5)
    const result = setActivity(cal, { year: 1, dayOfYear: 2 }, { type: 'match', fixtureId: 'fix-001' })
    const matchDay = result.find(d => d.date.dayOfYear === 2)
    expect(matchDay?.activity.fixtureId).toBe('fix-001')
  })
})

describe('getActivitiesInRange', () => {
  it('returns days within [from, to] inclusive', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 20)
    const range = getActivitiesInRange(
      cal,
      { year: 1, dayOfYear: 5 },
      { year: 1, dayOfYear: 10 },
    )
    expect(range).toHaveLength(6)
    expect(range[0].date.dayOfYear).toBe(5)
    expect(range[range.length - 1].date.dayOfYear).toBe(10)
  })

  it('returns empty array when range is outside the calendar', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 10)
    const range = getActivitiesInRange(
      cal,
      { year: 2, dayOfYear: 1 },
      { year: 2, dayOfYear: 10 },
    )
    expect(range).toHaveLength(0)
  })

  it('returns a single day when from === to', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 10)
    const range = getActivitiesInRange(
      cal,
      { year: 1, dayOfYear: 3 },
      { year: 1, dayOfYear: 3 },
    )
    expect(range).toHaveLength(1)
    expect(range[0].date.dayOfYear).toBe(3)
  })
})

describe('countActivityType', () => {
  it('counts correctly when all days are offseason', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 10)
    expect(countActivityType(cal, 'offseason')).toBe(10)
    expect(countActivityType(cal, 'rest')).toBe(0)
    expect(countActivityType(cal, 'match')).toBe(0)
  })

  it('counts match days after stamping them', () => {
    let cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 10)
    cal = setActivity(cal, { year: 1, dayOfYear: 2 }, { type: 'match', fixtureId: 'f1' })
    cal = setActivity(cal, { year: 1, dayOfYear: 5 }, { type: 'match', fixtureId: 'f2' })
    expect(countActivityType(cal, 'match')).toBe(2)
    expect(countActivityType(cal, 'offseason')).toBe(8)
  })
})

describe('getNextMatch', () => {
  it('returns null when there are no match days', () => {
    const cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 10)
    expect(getNextMatch(cal, { year: 1, dayOfYear: 1 })).toBeNull()
  })

  it('returns the first match on or after the given date', () => {
    let cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 20)
    cal = setActivity(cal, { year: 1, dayOfYear: 10 }, { type: 'match', fixtureId: 'f10' })
    cal = setActivity(cal, { year: 1, dayOfYear: 15 }, { type: 'match', fixtureId: 'f15' })

    const next = getNextMatch(cal, { year: 1, dayOfYear: 1 })
    expect(next?.activity.fixtureId).toBe('f10')
  })

  it('returns null when all matches are before the given date', () => {
    let cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 20)
    cal = setActivity(cal, { year: 1, dayOfYear: 5 }, { type: 'match', fixtureId: 'past' })

    expect(getNextMatch(cal, { year: 1, dayOfYear: 10 })).toBeNull()
  })

  it('returns the match ON the given date (inclusive)', () => {
    let cal = createEmptyCalendar({ year: 1, dayOfYear: 1 }, 20)
    cal = setActivity(cal, { year: 1, dayOfYear: 7 }, { type: 'match', fixtureId: 'exact' })

    const next = getNextMatch(cal, { year: 1, dayOfYear: 7 })
    expect(next?.activity.fixtureId).toBe('exact')
  })
})
