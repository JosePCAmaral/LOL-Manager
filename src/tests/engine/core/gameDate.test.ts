import { describe, it, expect } from 'vitest';
import {
  advanceDate,
  compareDates,
  isBefore,
  isAfter,
  daysBetween,
  formatDate,
  GameDate,
} from '../../../engine/core/gameDate';

describe('advanceDate', () => {
  it('advances within the same year', () => {
    expect(advanceDate({ year: 1, dayOfYear: 1 }, 10)).toEqual({ year: 1, dayOfYear: 11 });
  });

  it('wraps into the next year', () => {
    expect(advanceDate({ year: 1, dayOfYear: 360 }, 10)).toEqual({ year: 2, dayOfYear: 5 });
  });

  it('advances exactly to the last day', () => {
    expect(advanceDate({ year: 1, dayOfYear: 1 }, 364)).toEqual({ year: 1, dayOfYear: 365 });
  });

  it('wraps on the exact last day', () => {
    expect(advanceDate({ year: 1, dayOfYear: 365 }, 1)).toEqual({ year: 2, dayOfYear: 1 });
  });

  it('handles zero advance', () => {
    const d: GameDate = { year: 2, dayOfYear: 100 };
    expect(advanceDate(d, 0)).toEqual(d);
  });

  it('handles large advances (multiple years)', () => {
    // 365 days from day 1 year 1 = day 1 year 2
    expect(advanceDate({ year: 1, dayOfYear: 1 }, 365)).toEqual({ year: 2, dayOfYear: 1 });
    // 730 days = 2 full years
    expect(advanceDate({ year: 1, dayOfYear: 1 }, 730)).toEqual({ year: 3, dayOfYear: 1 });
  });
});

describe('compareDates', () => {
  it('returns 0 for equal dates', () => {
    expect(compareDates({ year: 2, dayOfYear: 50 }, { year: 2, dayOfYear: 50 })).toBe(0);
  });

  it('returns negative when a < b', () => {
    expect(compareDates({ year: 1, dayOfYear: 1 }, { year: 1, dayOfYear: 2 })).toBeLessThan(0);
    expect(compareDates({ year: 1, dayOfYear: 365 }, { year: 2, dayOfYear: 1 })).toBeLessThan(0);
  });

  it('returns positive when a > b', () => {
    expect(compareDates({ year: 2, dayOfYear: 1 }, { year: 1, dayOfYear: 365 })).toBeGreaterThan(0);
  });
});

describe('isBefore / isAfter', () => {
  const earlier: GameDate = { year: 1, dayOfYear: 10 };
  const later: GameDate = { year: 1, dayOfYear: 20 };

  it('isBefore', () => {
    expect(isBefore(earlier, later)).toBe(true);
    expect(isBefore(later, earlier)).toBe(false);
    expect(isBefore(earlier, earlier)).toBe(false);
  });

  it('isAfter', () => {
    expect(isAfter(later, earlier)).toBe(true);
    expect(isAfter(earlier, later)).toBe(false);
    expect(isAfter(earlier, earlier)).toBe(false);
  });
});

describe('daysBetween', () => {
  it('same date is 0', () => {
    expect(daysBetween({ year: 1, dayOfYear: 1 }, { year: 1, dayOfYear: 1 })).toBe(0);
  });

  it('positive when b is later', () => {
    expect(daysBetween({ year: 1, dayOfYear: 1 }, { year: 1, dayOfYear: 10 })).toBe(9);
  });

  it('negative when b is earlier', () => {
    expect(daysBetween({ year: 1, dayOfYear: 10 }, { year: 1, dayOfYear: 1 })).toBe(-9);
  });

  it('across year boundary', () => {
    expect(daysBetween({ year: 1, dayOfYear: 365 }, { year: 2, dayOfYear: 1 })).toBe(1);
  });
});

describe('formatDate', () => {
  it('formats correctly', () => {
    expect(formatDate({ year: 1, dayOfYear: 45 })).toBe('Dia 45 — Ano 1');
    expect(formatDate({ year: 3, dayOfYear: 1 })).toBe('Dia 1 — Ano 3');
  });
});
