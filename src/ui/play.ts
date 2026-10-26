// Player intents: run the action, then add the feel (sound, the departing card with its stamp).
// Input is never blocked by animation; the next case is on the desk immediately.
import { signal } from '@preact/signals';
import type { Case } from '../core/cases/types';
import type { Verdict } from '../core/state';
import { dispatch, game } from './store';
import { sfx } from './sound';

export interface Departing {
  key: number;
  c: Case;
  checked: string[];
  verdict: Verdict;
}

/** The card leaving the desk, shown for a moment with its stamp. */
export const departing = signal<Departing | null>(null);
/** Which case's letter is open (UI state only; reading costs nothing). */
export const openLetter = signal<number | null>(null);

let departKey = 0;
let departTimer: number | undefined;

function afterAction(wasOnShift: boolean): void {
  if (wasOnShift && !game.value.shift) sfx.bell();
}

export function decide(verdict: Verdict): void {
  const shift = game.value.shift;
  const c = shift?.current;
  if (!shift || !c) return;
  departing.value = { key: ++departKey, c, checked: shift.checked, verdict };
  window.clearTimeout(departTimer);
  departTimer = window.setTimeout(() => (departing.value = null), 560);
  sfx.stamp(shift.streak);
  window.setTimeout(() => sfx.swish(), 140);
  if (verdict !== 'deny') window.setTimeout(() => sfx.coin(), 220);
  openLetter.value = null;
  dispatch({ t: 'decide', verdict });
  afterAction(true);
}

export function checkField(field: string): void {
  const shift = game.value.shift;
  if (!shift?.current || shift.checked.includes(field)) return;
  sfx.check();
  dispatch({ t: 'check', field });
  afterAction(true);
}

export function waitForNext(): void {
  dispatch({ t: 'wait' });
  afterAction(true);
}

export function endShift(): void {
  dispatch({ t: 'endShift' });
  sfx.bell();
}

export function startShift(): void {
  departing.value = null;
  dispatch({ t: 'startShift' });
}

export function toggleLetter(no: number): void {
  openLetter.value = openLetter.value === no ? null : no;
}
