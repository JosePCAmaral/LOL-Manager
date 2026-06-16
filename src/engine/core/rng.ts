/**
 * Seeded PRNG for the game engine.
 * ALL randomness in engine/ must go through here — never use Math.random() directly.
 *
 * Algorithm: mulberry32 (32-bit, fast, good statistical quality for simulation use).
 * Seed string is converted to uint32 via djb2 hash.
 */

// djb2 hash: converts an arbitrary string to a uint32
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // Bitwise ops in JS work on signed 32-bit integers; >>> 0 coerces to uint32
    hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * Returns a stateful PRNG function seeded from the given string.
 * Each call to the returned function advances the internal state and produces
 * a float in [0, 1).
 *
 * The generator is NOT globally shared — every call to seededRandom() creates
 * an independent sequence. This is intentional: callers own their own RNG state.
 */
export function seededRandom(seed: string): () => number {
  // mulberry32 state — one uint32
  let state = djb2Hash(seed);
  // Avoid a zero seed (would produce a degenerate sequence)
  if (state === 0) state = 1;

  return function (): number {
    // mulberry32 step
    state = (state + 0x6d2b79f5) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    z = ((z ^ (z >>> 14)) >>> 0);
    // Map uint32 to [0, 1)
    return z / 0x100000000;
  };
}

/**
 * Returns a random integer in the closed range [min, max] (both inclusive).
 */
export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Returns a random float in [min, max).
 */
export function randomFloat(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

/**
 * Returns a uniformly random element from the array.
 * Throws if the array is empty.
 */
export function randomChoice<T>(rng: () => number, arr: readonly T[]): T {
  if (arr.length === 0) throw new RangeError('randomChoice: array must not be empty');
  return arr[Math.floor(rng() * arr.length)];
}
