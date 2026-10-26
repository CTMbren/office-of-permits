// The one place game state changes. Pure: same state + same action = same result.
import type { Action } from './actions';
import { newGame, type GameState } from './state';
import { check, decide, startShift, wait } from './shift/shift';
import { endShift } from './shift/report';

export function reduce(s: GameState, a: Action): GameState {
  switch (a.t) {
    case 'newGame':
      return newGame(a.seed);
    case 'startShift':
      return startShift(s);
    case 'endShift':
      return endShift(s);
    case 'wait':
      return wait(s);
    case 'check':
      return check(s, a.field);
    case 'decide':
      return decide(s, a.verdict);
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
