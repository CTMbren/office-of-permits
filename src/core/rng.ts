// Seeded, pure random numbers (mulberry32). The RNG state lives inside GameState so that
// the same seed plus the same actions always produce the same game.

export type RngState = number;

/** Returns a float in [0, 1) and the next state. */
export function rngNext(state: RngState): { value: number; state: RngState } {
  let t = (state + 0x6d2b79f5) >>> 0;
  const next = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: next };
}

/** Integer in [min, max] inclusive. */
export function rngInt(state: RngState, min: number, max: number): { value: number; state: RngState } {
  const r = rngNext(state);
  return { value: min + Math.floor(r.value * (max - min + 1)), state: r.state };
}

/** One item from a non-empty list. */
export function rngPick<T>(state: RngState, items: readonly T[]): { value: T; state: RngState } {
  if (items.length === 0) throw new Error('rngPick: empty list');
  const r = rngInt(state, 0, items.length - 1);
  return { value: items[r.value] as T, state: r.state };
}

/**
 * A convenience wrapper for code that draws many numbers in a row. It starts from a state,
 * and `.state` gives the state to store back. Callers stay pure from the outside.
 */
export function roller(start: RngState) {
  let s = start;
  const next = () => {
    const r = rngNext(s);
    s = r.state;
    return r.value;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    chance: (p: number) => next() < p,
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('pick: empty list');
      return items[int(0, items.length - 1)] as T;
    },
    /** Picks a key with probability proportional to its weight. */
    weighted: <K extends string>(weights: Readonly<Record<K, number>>): K => {
      const entries = Object.entries(weights) as [K, number][];
      const total = entries.reduce((sum, [, w]) => sum + w, 0);
      let r = next() * total;
      for (const [k, w] of entries) {
        r -= w;
        if (r < 0) return k;
      }
      return entries[entries.length - 1]![0];
    },
    get state() {
      return s;
    },
  };
}

export type Roller = ReturnType<typeof roller>;

/** Turns any integer seed into a well-mixed starting state. */
export function seedRng(seed: number): RngState {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
