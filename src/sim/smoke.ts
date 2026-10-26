// Headless smoke run: plays 20 shifts through the real reducer and checks determinism.
// Grows into the balance simulator (bots + CI assertions) in M2.
import { reduce } from '../core/reduce';
import { newGame, type GameState } from '../core/state';
import { BALANCE } from '../core/balance';

export function playShifts(seed: number, shifts: number): GameState {
  let s = newGame(seed);
  for (let i = 0; i < shifts; i++) {
    s = reduce(s, { t: 'startShift' });
    while (s.shift) s = reduce(s, { t: 'spendMinutes', minutes: BALANCE.actionMinutes.approve });
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
  if (ms > 1000) {
    console.error(`✗ sim smoke: 40 shifts took ${ms.toFixed(0)} ms (limit 1000)`);
    process.exit(1);
  }
  console.log(`✓ sim smoke: 20 shifts × 2 runs deterministic in ${ms.toFixed(1)} ms`);
}
