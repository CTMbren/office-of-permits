// The desk during a shift: arrivals, checking fields, and decisions.
// Feedback is asymmetric on purpose: a denial gets an immediate reaction from the applicant,
// while approvals and stamps are only judged at the end-of-shift report.
import { BALANCE } from '../balance';
import { RULEBOOK } from '../content';
import { checkableFields, type Case } from '../cases/types';
import { nextCase } from '../cases/generate';
import { correctVerdict } from '../rules/run';
import { roller, type Roller } from '../rng';
import type { Decision, GameState, ShiftState, Verdict } from '../state';
import { endShift } from './report';

function spawn(s: GameState, shift: ShiftState, r: Roller): { s: GameState; shift: ShiftState; c: Case } {
  const no = s.caseNo + 1;
  const c = nextCase(r, shift.no, shift.spawned + 1, no);
  return { s: { ...s, caseNo: no }, shift: { ...shift, spawned: shift.spawned + 1 }, c };
}

/** Moves the next waiting case onto the desk if the desk is clear. */
function promote(shift: ShiftState): ShiftState {
  if (shift.current || shift.tray.length === 0) return shift;
  const [first, ...rest] = shift.tray;
  return { ...shift, current: first ?? null, tray: rest, checked: [] };
}

export function startShift(s: GameState): GameState {
  if (s.shift) return s;
  const r = roller(s.rng);
  const no = s.shiftNo + 1;
  const deskMinutes = BALANCE.shift.deskMinutesSlice;
  let shift: ShiftState = {
    no,
    deskMinutes,
    deskMinutesLeft: deskMinutes,
    elapsed: 0,
    nextArrivalAt: BALANCE.shift.arrivalEvery,
    spawned: 0,
    current: null,
    checked: [],
    tray: [],
    streak: 0,
    streakPeak: 0,
    coinEarned: 0,
    standingEarned: 0,
    decisions: [],
  };
  let state: GameState = { ...s, shiftNo: no, lastReport: null };
  for (let i = 0; i < BALANCE.shift.initialTray; i++) {
    const out = spawn(state, shift, r);
    state = out.s;
    shift = { ...out.shift, tray: [...out.shift.tray, out.c] };
  }
  return { ...state, rng: r.state, shift: promote(shift) };
}

/** Spends desk-minutes: applicants arrive as time passes, and the candle burning out ends the shift. */
export function advance(s: GameState, minutes: number): GameState {
  if (!s.shift || minutes <= 0) return s;
  const r = roller(s.rng);
  const spend = Math.min(minutes, s.shift.deskMinutesLeft);
  let state = s;
  let shift: ShiftState = {
    ...s.shift,
    elapsed: s.shift.elapsed + spend,
    deskMinutesLeft: s.shift.deskMinutesLeft - spend,
  };
  while (shift.nextArrivalAt <= shift.elapsed && shift.tray.length < BALANCE.shift.maxTray) {
    const out = spawn(state, shift, r);
    state = out.s;
    shift = { ...out.shift, tray: [...out.shift.tray, out.c], nextArrivalAt: out.shift.nextArrivalAt + BALANCE.shift.arrivalEvery };
  }
  // A full tray stops the queue; the next arrival waits for room.
  if (shift.nextArrivalAt <= shift.elapsed) shift = { ...shift, nextArrivalAt: shift.elapsed + BALANCE.shift.arrivalEvery };
  state = { ...state, rng: r.state, shift: promote(shift) };
  return shift.deskMinutesLeft === 0 ? endShift(state) : state;
}

export function check(s: GameState, field: string): GameState {
  const shift = s.shift;
  if (!shift?.current || shift.checked.includes(field)) return s;
  if (!checkableFields(shift.current).includes(field)) return s;
  return advance({ ...s, shift: { ...shift, checked: [...shift.checked, field] } }, BALANCE.actionMinutes.check);
}

export function wait(s: GameState): GameState {
  const shift = s.shift;
  if (!shift || shift.current || shift.tray.length > 0) return s;
  return advance(s, Math.max(1, shift.nextArrivalAt - shift.elapsed));
}

export function decide(s: GameState, verdict: Verdict): GameState {
  const shift = s.shift;
  const c = shift?.current;
  if (!shift || !c) return s;

  const truth = correctVerdict(c, RULEBOOK);
  const valid = truth.verdict === 'approve';
  const correct = verdict === 'deny' ? !valid : valid;
  const bonus = 1 + shift.streak * BALANCE.streak.perCorrect;
  let coin: number;
  let standing = 0;
  let streak = shift.streak;

  if (verdict === 'stamp') {
    coin = Math.round(c.fee * BALANCE.pay.stamp);
  } else if (verdict === 'approve') {
    coin = Math.round(c.fee * BALANCE.pay.approve * bonus);
    // Judged at the report; the streak only grows on a correct signature.
    if (valid) streak = Math.min(streak + 1, BALANCE.streak.cap / BALANCE.streak.perCorrect);
  } else {
    coin = Math.round(c.fee * BALANCE.pay.deny * bonus);
    standing = valid ? BALANCE.standing.deniedValid : BALANCE.standing.denyRight;
    streak = valid ? 0 : Math.min(streak + 1, BALANCE.streak.cap / BALANCE.streak.perCorrect);
  }

  const decision: Decision = {
    no: c.no,
    name: c.applicant.name,
    permit: c.permit,
    verdict,
    correct,
    ...(c.fields.district ? { district: String(c.fields.district.truth) } : {}),
    ...(truth.rule ? { rule: truth.rule } : {}),
    ...(c.storyId ? { storyId: c.storyId } : {}),
  };
  const row = s.ledger[c.permit] ?? { processed: 0, bad: 0 };
  const caught = verdict === 'deny' && !valid;

  const nextShift: ShiftState = promote({
    ...shift,
    current: null,
    checked: [],
    streak,
    streakPeak: Math.max(shift.streakPeak, streak),
    coinEarned: shift.coinEarned + coin,
    standingEarned: shift.standingEarned + standing,
    decisions: [...shift.decisions, decision],
  });
  const next: GameState = {
    ...s,
    cur: { ...s.cur, coin: s.cur.coin + coin, standing: Math.max(0, s.cur.standing + standing) },
    ledger: { ...s.ledger, [c.permit]: { processed: row.processed + 1, bad: row.bad + (caught ? 1 : 0) } },
    flags: c.storyId ? { ...s.flags, [`story.${c.storyId}`]: verdict === 'deny' ? 0 : 1 } : s.flags,
    shift: nextShift,
  };
  const cost = BALANCE.actionMinutes[verdict];
  return advance(next, cost);
}
