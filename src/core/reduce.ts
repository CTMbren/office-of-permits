// The one place game state changes. Pure: same state + same action = same result.
import type { Action } from './actions';
import { newGame, newShift, type GameState } from './state';

export function reduce(s: GameState, a: Action): GameState {
  switch (a.t) {
    case 'newGame':
      return newGame(a.seed);

    case 'startShift': {
      if (s.shift) return s; // already on shift
      const no = s.shiftNo + 1;
      return { ...s, shiftNo: no, shift: newShift(no) };
    }

    case 'spendMinutes': {
      if (!s.shift || a.minutes <= 0) return s;
      const left = Math.max(0, s.shift.deskMinutesLeft - a.minutes);
      const shift = { ...s.shift, deskMinutesLeft: left };
      // The candle burning out ends the shift.
      return left === 0 ? { ...s, shift: null } : { ...s, shift };
    }

    case 'endShift':
      return s.shift ? { ...s, shift: null } : s;

    default: {
      const never: never = a;
      return never;
    }
  }
}

/** Applies a list of actions in order; used by tests and the simulator. */
export function replay(s: GameState, actions: readonly Action[]): GameState {
  return actions.reduce(reduce, s);
}
