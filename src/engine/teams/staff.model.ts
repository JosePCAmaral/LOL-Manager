/**
 * Pure functions over StaffMember[].
 */

import type { StaffMember } from '@types-app/index'

/**
 * Returns the first staff member with role 'COACH', or null if none.
 */
export function getHeadCoach(staff: StaffMember[]): StaffMember | null {
  return staff.find(s => s.role === 'COACH') ?? null
}

/**
 * Returns a multiplier in [0, 1] representing the staff bonus for a given category.
 *
 * Relevant roles per category (from task spec):
 *   training  → COACH + ANALYST
 *   morale    → PSYCHOLOGIST
 *   scouting  → SCOUT
 *
 * Formula: sum of competence of relevant members / 20.
 * Clamped to [0, 1] to guard against abnormal data.
 */
export function getStaffBonus(
  staff: StaffMember[],
  category: 'training' | 'morale' | 'scouting',
): number {
  const RELEVANT_ROLES: Record<typeof category, StaffMember['role'][]> = {
    training: ['COACH', 'ANALYST'],
    morale: ['PSYCHOLOGIST'],
    scouting: ['SCOUT'],
  }

  const relevant = staff.filter(s => RELEVANT_ROLES[category].includes(s.role))
  const totalCompetence = relevant.reduce((sum, s) => sum + s.competence, 0)
  const multiplier = totalCompetence / 20

  return Math.max(0, Math.min(1, multiplier))
}

/**
 * Returns the sum of salaries across all staff members.
 */
export function calculateTotalStaffSalary(staff: StaffMember[]): number {
  return staff.reduce((sum, s) => sum + s.salary, 0)
}
