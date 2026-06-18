import { describe, it, expect } from 'vitest';
import { seededRandom, randomInt, randomFloat, randomChoice } from '../../../engine/core/rng';

describe('seededRandom', () => {
  it('produces values in [0, 1)', () => {
    const rng = seededRandom('test-seed');
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('is deterministic: same seed produces the same sequence', () => {
    const a = seededRandom('abc');
    const b = seededRandom('abc');
    for (let i = 0; i < 50; i++) {
      expect(a()).toBe(b());
    }
  });

  it('different seeds produce different sequences', () => {
    const a = seededRandom('seed-1');
    const b = seededRandom('seed-2');
    const seqA = Array.from({ length: 10 }, () => a());
    const seqB = Array.from({ length: 10 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it('each seededRandom() call is an independent generator', () => {
    const rng1 = seededRandom('x');
    rng1(); // advance rng1
    const rng2 = seededRandom('x'); // fresh generator, same seed
    expect(rng2()).toBe(seededRandom('x')()); // first value of fresh
  });
});

describe('randomInt', () => {
  it('always returns an integer within [min, max]', () => {
    const rng = seededRandom('int-test');
    for (let i = 0; i < 500; i++) {
      const v = randomInt(rng, 3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('can return both boundary values', () => {
    const rng = seededRandom('boundary');
    const values = new Set<number>();
    for (let i = 0; i < 200; i++) values.add(randomInt(rng, 0, 1));
    expect(values.has(0)).toBe(true);
    expect(values.has(1)).toBe(true);
  });
});

describe('randomFloat', () => {
  it('returns values in [min, max)', () => {
    const rng = seededRandom('float-test');
    for (let i = 0; i < 500; i++) {
      const v = randomFloat(rng, -1, 1);
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('randomChoice', () => {
  it('returns an element from the array', () => {
    const arr = ['a', 'b', 'c'];
    const rng = seededRandom('choice-test');
    for (let i = 0; i < 100; i++) {
      expect(arr).toContain(randomChoice(rng, arr));
    }
  });

  it('throws on empty array', () => {
    const rng = seededRandom('empty');
    expect(() => randomChoice(rng, [])).toThrow(RangeError);
  });
});
