/**
 * GameDate — in-game calendar type and pure utility functions.
 *
 * The in-game year has exactly 365 days (dayOfYear is 1-based: 1..365).
 */

export interface GameDate {
  year: number;
  dayOfYear: number; // 1-based, range [1, 365]
}

const DAYS_PER_YEAR = 365;

/**
 * Advances a GameDate by `days` days (may be negative, which moves backwards).
 * Year wraps correctly in both directions.
 */
export function advanceDate(date: GameDate, days: number): GameDate {
  // Convert to a zero-based absolute day count to simplify arithmetic
  const absoluteDay = (date.year - 1) * DAYS_PER_YEAR + (date.dayOfYear - 1) + days;

  // Handle negative absolute days (going before the epoch)
  // Using Math.floor ensures correct floor-division for negative numbers
  const newYear = Math.floor(absoluteDay / DAYS_PER_YEAR) + 1;
  const newDayOfYear = ((absoluteDay % DAYS_PER_YEAR) + DAYS_PER_YEAR) % DAYS_PER_YEAR + 1;

  return { year: newYear, dayOfYear: newDayOfYear };
}

/**
 * Comparator compatible with Array.prototype.sort.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareDates(a: GameDate, b: GameDate): number {
  if (a.year !== b.year) return a.year - b.year;
  return a.dayOfYear - b.dayOfYear;
}

/** Returns true if a comes strictly before b on the calendar. */
export function isBefore(a: GameDate, b: GameDate): boolean {
  return compareDates(a, b) < 0;
}

/** Returns true if a comes strictly after b on the calendar. */
export function isAfter(a: GameDate, b: GameDate): boolean {
  return compareDates(a, b) > 0;
}

/**
 * Number of days from a to b (positive if b is later, negative if b is earlier).
 */
export function daysBetween(a: GameDate, b: GameDate): number {
  const absA = (a.year - 1) * DAYS_PER_YEAR + (a.dayOfYear - 1);
  const absB = (b.year - 1) * DAYS_PER_YEAR + (b.dayOfYear - 1);
  return absB - absA;
}

/**
 * Human-readable string for display in the UI.
 * Example: "Dia 45 — Ano 1"
 */
export function formatDate(date: GameDate): string {
  return `Dia ${date.dayOfYear} — Ano ${date.year}`;
}
