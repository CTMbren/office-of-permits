// Every change to GameState is an Action passed through reduce(). M0 has only the shift
// lifecycle; M1 adds the desk actions (stamp, check, approve, deny).

export type Action =
  | { t: 'startShift' }
  | { t: 'spendMinutes'; minutes: number }
  | { t: 'endShift' }
  | { t: 'newGame'; seed: number };

export type ActionType = Action['t'];
