// Ends a shift: bad cases you let through may surface (named, with a fine), honest applicants
// you denied complain, correct approvals are credited, and everything becomes the report.
import { BALANCE } from '../balance';
import { CONTENT } from '../content';
import type { Consequence } from '../content/schema';
import { roller, type Roller } from '../rng';
import { caseNo, fill } from '../text';
import type { Decision, GameState, ShiftReport } from '../state';

const MAX_LINES = 7;
const MAX_CAUGHT_LINES = 2;

function consequenceFor(kind: Consequence['when']['kind'], d: Decision): Consequence | undefined {
  return CONTENT.consequences.find(
    (q) =>
      q.when.kind === kind &&
      (q.when.rule === undefined || q.when.rule === d.rule) &&
      (q.when.permit === undefined || q.when.permit === d.permit) &&
      (q.when.story === undefined || q.when.story === d.storyId),
  );
}

function line(r: Roller, q: Consequence | undefined, d: Decision): string | null {
  if (!q) return null;
  return fill(r.pick(q.lines), {
    case: caseNo(d.no),
    name: d.name,
    district: d.district ?? 'the city',
    victim: r.pick(CONTENT.pools.victims!),
  });
}

export function endShift(s: GameState): GameState {
  const shift = s.shift;
  if (!shift) return s;
  const r = roller(s.rng);

  const surfacedLines: string[] = [];
  const complaintLines: string[] = [];
  const storyLines: string[] = [];
  const caughtLines: string[] = [];
  let fines = 0;
  let standing = 0;
  let suspicion = 0;
  const ledger = { ...s.ledger };

  for (const d of shift.decisions) {
    const passed = d.verdict !== 'deny';
    const storyLine = d.storyId ? consequenceFor('story', d) : undefined;

    if (passed && !d.correct) {
      // Story cases always come back; others surface by chance.
      const chance = d.verdict === 'stamp' ? BALANCE.surface.stamped : BALANCE.surface.signed;
      if (storyLine || r.chance(chance)) {
        fines += BALANCE.permits[d.permit].fee * BALANCE.permits[d.permit].fineMult;
        standing += BALANCE.standing.surfaced;
        suspicion += BALANCE.suspicion.surfaced;
        const row = ledger[d.permit] ?? { processed: 0, bad: 0 };
        ledger[d.permit] = { ...row, bad: row.bad + 1 };
        const text = line(r, storyLine ?? consequenceFor('passed_invalid', d), d);
        if (text) surfacedLines.push(text);
      }
    } else if (passed && d.correct) {
      if (d.verdict === 'approve') standing += BALANCE.standing.approveRight;
      const text = storyLine ? line(r, storyLine, d) : null;
      if (text) storyLines.push(text);
    } else if (!d.correct) {
      const text = line(r, consequenceFor('denied_valid', d), d);
      if (text) complaintLines.push(text);
    } else if (caughtLines.length < MAX_CAUGHT_LINES && r.chance(0.5)) {
      const text = line(r, consequenceFor('denied_invalid', d), d);
      if (text) caughtLines.push(text);
    }
  }

  const finesPaid = Math.min(fines, s.cur.coin);
  const report: ShiftReport = {
    shiftNo: shift.no,
    cases: shift.decisions.length,
    correct: shift.decisions.filter((d) => d.correct).length,
    stamped: shift.decisions.filter((d) => d.verdict === 'stamp').length,
    coinEarned: shift.coinEarned,
    fines: finesPaid,
    standingChange: shift.standingEarned + standing,
    streakPeak: shift.streakPeak,
    lines: [...surfacedLines, ...complaintLines, ...storyLines, ...caughtLines].slice(0, MAX_LINES),
  };

  return {
    ...s,
    rng: r.state,
    shift: null,
    lastReport: report,
    ledger,
    cur: {
      ...s.cur,
      coin: s.cur.coin - finesPaid,
      standing: Math.max(0, s.cur.standing + standing),
      suspicion: Math.min(100, s.cur.suspicion + suspicion),
    },
  };
}
