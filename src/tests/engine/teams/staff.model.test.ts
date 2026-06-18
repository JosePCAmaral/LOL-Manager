import { describe, it, expect } from 'vitest'
import {
  getHeadCoach,
  getStaffBonus,
  calculateTotalStaffSalary,
} from '@engine/teams/staff.model'
import { makeStaff } from '../helpers'
import type { StaffMember } from '@types-app/index'

describe('getHeadCoach', () => {
  it('returns null when staff array is empty', () => {
    expect(getHeadCoach([])).toBeNull()
  })

  it('returns null when no COACH is present', () => {
    const staff: StaffMember[] = [
      makeStaff({ role: 'ANALYST' }),
      makeStaff({ role: 'PSYCHOLOGIST' }),
    ]
    expect(getHeadCoach(staff)).toBeNull()
  })

  it('returns the COACH member when present', () => {
    const coach = makeStaff({ id: 'coach-1', role: 'COACH', name: 'Head Coach' })
    const staff = [makeStaff({ role: 'ANALYST' }), coach]
    expect(getHeadCoach(staff)).toBe(coach)
  })

  it('returns the first COACH when multiple are present', () => {
    const coach1 = makeStaff({ id: 'c1', role: 'COACH' })
    const coach2 = makeStaff({ id: 'c2', role: 'COACH' })
    expect(getHeadCoach([coach1, coach2])).toBe(coach1)
  })
})

describe('getStaffBonus', () => {
  it('category morale: returns 0 when no PSYCHOLOGIST', () => {
    const staff = [makeStaff({ role: 'COACH' }), makeStaff({ role: 'ANALYST' })]
    expect(getStaffBonus(staff, 'morale')).toBe(0)
  })

  it('category morale: PSYCHOLOGIST with competence=10 → bonus = 0.5 (10/20)', () => {
    const staff = [makeStaff({ role: 'PSYCHOLOGIST', competence: 10 })]
    expect(getStaffBonus(staff, 'morale')).toBeCloseTo(0.5)
  })

  it('category morale: PSYCHOLOGIST with competence=20 → bonus = 1.0 (max)', () => {
    const staff = [makeStaff({ role: 'PSYCHOLOGIST', competence: 20 })]
    expect(getStaffBonus(staff, 'morale')).toBeCloseTo(1.0)
  })

  it('category training: sums COACH + ANALYST competences / 20', () => {
    const staff = [
      makeStaff({ role: 'COACH', competence: 10 }),
      makeStaff({ role: 'ANALYST', competence: 6 }),
    ]
    // (10 + 6) / 20 = 16/20 = 0.8 → clamped to 0.8
    expect(getStaffBonus(staff, 'training')).toBeCloseTo(0.8)
  })

  it('category training: total competence > 20 is clamped to 1.0', () => {
    const staff = [
      makeStaff({ role: 'COACH', competence: 15 }),
      makeStaff({ role: 'ANALYST', competence: 15 }),
    ]
    // (15 + 15) / 20 = 1.5 → clamped to 1.0
    expect(getStaffBonus(staff, 'training')).toBe(1.0)
  })

  it('category scouting: returns 0 when no SCOUT', () => {
    const staff = [makeStaff({ role: 'COACH' })]
    expect(getStaffBonus(staff, 'scouting')).toBe(0)
  })

  it('category scouting: SCOUT with competence=14 → 14/20 = 0.7', () => {
    const staff = [makeStaff({ role: 'SCOUT', competence: 14 })]
    expect(getStaffBonus(staff, 'scouting')).toBeCloseTo(0.7)
  })

  it('returns 0 for empty staff', () => {
    expect(getStaffBonus([], 'training')).toBe(0)
    expect(getStaffBonus([], 'morale')).toBe(0)
    expect(getStaffBonus([], 'scouting')).toBe(0)
  })
})

describe('calculateTotalStaffSalary', () => {
  it('returns 0 for empty staff', () => {
    expect(calculateTotalStaffSalary([])).toBe(0)
  })

  it('returns the single salary for one staff member', () => {
    const staff = [makeStaff({ salary: 4000 })]
    expect(calculateTotalStaffSalary(staff)).toBe(4000)
  })

  it('sums salaries correctly for multiple members', () => {
    const staff = [
      makeStaff({ salary: 3000 }),
      makeStaff({ salary: 2000 }),
      makeStaff({ salary: 1500 }),
    ]
    expect(calculateTotalStaffSalary(staff)).toBe(6500)
  })
})
