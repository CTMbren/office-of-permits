// Every change to GameState is an Action passed through reduce(). Reading a letter or the
// rulebook is free and never an action; only things that spend desk-minutes are.

export type Action =
  | { t: 'newGame'; seed: number }
  | { t: 'startShift' }
  | { t: 'endShift' }
  /** Pass time until the next applicant arrives (when the tray is empty). */
  | { t: 'wait' }
  | { t: 'check'; field: string }
  | { t: 'decide'; verdict: 'stamp' | 'approve' | 'deny' };

export type ActionType = Action['t'];
