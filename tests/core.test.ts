import { describe, expect, it } from 'vitest';
import { rngInt, rngNext, rngPick, seedRng } from '../src/core/rng';
import { newGame } from '../src/core/state';
import { reduce, replay } from '../src/core/reduce';
import { formatNumber } from '../src/core/format';
import { BALANCE } from '../src/core/balance';
import { playShifts } from '../src/sim/smoke';

describe('rng', () => {
  it('is deterministic for a given state', () => {
    const s = seedRng(42);
    expect(rngNext(s)).toEqual(rngNext(s));
  });

  it('produces values in [0, 1) and advances state', () => {
    let s = seedRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const r = rngNext(s);
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(1);
      seen.add(r.value);
      s = r.state;
    }
    expect(seen.size).toBeGreaterThan(990);
  });

  it('rngInt stays within bounds and hits both ends', () => {
    let s = seedRng(3);
    const hits = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const r = rngInt(s, 1, 6);
      hits.add(r.value);
      s = r.state;
    }
    expect([...hits].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('rngPick refuses an empty list', () => {
    expect(() => rngPick(seedRng(1), [])).toThrow();
  });
});

describe('reduce', () => {
  it('starts a shift with the slice budget', () => {
    const s = reduce(newGame(1), { t: 'startShift' });
    expect(s.shiftNo).toBe(1);
    expect(s.shift?.deskMinutesLeft).toBe(BALANCE.shift.deskMinutesSlice);
  });

  it('ignores startShift while already on shift', () => {
    const s = reduce(newGame(1), { t: 'startShift' });
    expect(reduce(s, { t: 'startShift' })).toBe(s);
  });

  it('ends the shift when the candle burns out', () => {
    let s = reduce(newGame(1), { t: 'startShift' });
    s = reduce(s, { t: 'spendMinutes', minutes: 119 });
    expect(s.shift?.deskMinutesLeft).toBe(1);
    s = reduce(s, { t: 'spendMinutes', minutes: 5 });
    expect(s.shift).toBeNull();
  });

  it('does not mutate the input state', () => {
    const s0 = newGame(1);
    const frozen = JSON.stringify(s0);
    replay(s0, [{ t: 'startShift' }, { t: 'spendMinutes', minutes: 10 }, { t: 'endShift' }]);
    expect(JSON.stringify(s0)).toBe(frozen);
  });

  it('same seed and actions give byte-identical state', () => {
    expect(JSON.stringify(playShifts(99, 20))).toBe(JSON.stringify(playShifts(99, 20)));
  });
});

describe('formatNumber', () => {
  it.each([
    [0, '0'],
    [42, '42'],
    [9999, '9,999'],
    [12_345, '12.3K'],
    [1_000_000, '1M'],
    [4_560_000, '4.56M'],
    [7.89e12, '7.89T'],
    [1.23e18, '1.23e18'],
    [-15_000, '-15K'],
  ])('%d → %s', (n, out) => {
    expect(formatNumber(n)).toBe(out);
  });
});
