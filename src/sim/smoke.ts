// Headless runs through the real reducer. Checks determinism and prints how simple strategies
// fare, as an early read on balance. Grows into the M2 simulator with CI assertions.
import { reduce } from '../core/reduce';
import { newGame, type GameState } from '../core/state';
import { checkableFields } from '../core/cases/types';
import { correctVerdict, run } from '../core/rules/run';
import { RULEBOOK } from '../core/content';
import type { Action } from '../core/actions';

export type Bot = (s: GameState) => Action;

/** Checks every checkable field, then judges what it has seen (which is then the truth). */
export const thorough: Bot = (s) => {
  const c = s.shift!.current!;
  const unchecked = checkableFields(c).filter((f) => !s.shift!.checked.includes(f));
  if (unchecked.length > 0) return { t: 'check', field: unchecked[0]! };
  return { t: 'decide', verdict: correctVerdict(c, RULEBOOK).verdict };
};

/** Stamps everything without looking. */
export const stamper: Bot = () => ({ t: 'decide', verdict: 'stamp' });

/** Reads the card only: denies what visibly breaks a rule, approves the rest. */
export const reader: Bot = (s) => {
  const c = s.shift!.current!;
  return { t: 'decide', verdict: run(c, RULEBOOK, 'claim', 'approve').action === 'deny' ? 'deny' : 'approve' };
};

export function playShifts(seed: number, shifts: number, bot: Bot = thorough): GameState {
  let s = newGame(seed);
  for (let i = 0; i < shifts; i++) {
    s = reduce(s, { t: 'startShift' });
    let guard = 0;
    while (s.shift && guard++ < 10_000) {
      s = reduce(s, s.shift.current ? bot(s) : { t: 'wait' });
    }
  }
  return s;
}

const isMain = process.argv[1]?.endsWith('smoke.ts');
if (isMain) {
  const t0 = performance.now();
  const a = JSON.stringify(playShifts(1337, 20));
  const b = JSON.stringify(playShifts(1337, 20));
  const ms = performance.now() - t0;
  if (a !== b) {
    console.error('✗ sim smoke: same seed produced different states');
    process.exit(1);
  }
  if (ms > 2000) {
    console.error(`✗ sim smoke: 40 shifts took ${ms.toFixed(0)} ms (limit 2000)`);
    process.exit(1);
  }
  console.log(`✓ sim smoke: 20 shifts × 2 runs deterministic in ${ms.toFixed(0)} ms`);
  for (const [name, bot] of [['thorough', thorough], ['stamper', stamper], ['reader', reader]] as const) {
    let coin = 0;
    let standing = 0;
    const seeds = 50;
    for (let seed = 1; seed <= seeds; seed++) {
      const s = playShifts(seed, 5, bot);
      coin += s.cur.coin;
      standing += s.cur.standing;
    }
    console.log(`  ${name.padEnd(9)} 5 shifts: coin ${(coin / seeds).toFixed(0)}, standing ${(standing / seeds).toFixed(0)}`);
  }
}
