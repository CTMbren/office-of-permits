import { describe, expect, it } from 'vitest';
import { newGame, type GameState } from '../src/core/state';
import { reduce, replay } from '../src/core/reduce';
import { BALANCE } from '../src/core/balance';
import { correctVerdict } from '../src/core/rules/run';
import { RULEBOOK } from '../src/core/content';
import { playShifts, stamper, thorough } from '../src/sim/smoke';

const start = (seed = 42) => reduce(newGame(seed), { t: 'startShift' });
const left = (s: GameState) => s.shift!.deskMinutesLeft;

describe('desk actions', () => {
  it('opens shift 1 with Ember on the desk and two waiting', () => {
    const s = start();
    expect(s.shift!.current!.storyId).toBe('ember_thatch_case');
    expect(s.shift!.tray).toHaveLength(BALANCE.shift.initialTray - 1);
  });

  it('checking a field costs 1 desk-minute, once', () => {
    const s0 = start();
    const s1 = reduce(s0, { t: 'check', field: 'dwelling' });
    expect(left(s0) - left(s1)).toBe(1);
    expect(s1.shift!.checked).toEqual(['dwelling']);
    expect(reduce(s1, { t: 'check', field: 'dwelling' })).toBe(s1);
  });

  it('cannot check a field that is not checkable', () => {
    const s0 = start();
    expect(reduce(s0, { t: 'check', field: 'district' })).toBe(s0);
  });

  it('stamp costs 1, approve and deny cost 2', () => {
    const s0 = start();
    expect(left(s0) - left(reduce(s0, { t: 'decide', verdict: 'stamp' }))).toBe(1);
    expect(left(s0) - left(reduce(s0, { t: 'decide', verdict: 'approve' }))).toBe(2);
    expect(left(s0) - left(reduce(s0, { t: 'decide', verdict: 'deny' }))).toBe(2);
  });

  it('denying Ember is correct, pays 40% of the fee and earns Standing at once', () => {
    const s0 = start();
    const s1 = reduce(s0, { t: 'decide', verdict: 'deny' });
    expect(s1.cur.coin).toBe(Math.round(20 * BALANCE.pay.deny));
    expect(s1.cur.standing).toBe(BALANCE.standing.denyRight);
    expect(s1.shift!.decisions[0]).toMatchObject({ correct: true, verdict: 'deny', rule: 'dragon_thatch' });
  });

  it('applicants keep arriving as time passes', () => {
    let s = start();
    for (let i = 0; i < 10; i++) s = reduce(s, { t: 'decide', verdict: 'stamp' });
    expect(s.shift!.spawned).toBeGreaterThan(BALANCE.shift.initialTray);
  });

  it('the candle burning out ends the shift with a report', () => {
    const s = playShifts(3, 1, thorough);
    expect(s.shift).toBeNull();
    expect(s.lastReport?.shiftNo).toBe(1);
    expect(s.lastReport!.cases).toBeGreaterThan(10);
  });
});

describe('end-of-shift report', () => {
  it('a thorough clerk makes no mistakes and pays no fines', () => {
    const s = playShifts(5, 1, thorough);
    expect(s.lastReport!.correct).toBe(s.lastReport!.cases);
    expect(s.lastReport!.fines).toBe(0);
  });

  it('stamping Ember always comes back, by name and case number', () => {
    const s = replay(start(), [{ t: 'decide', verdict: 'stamp' }, { t: 'endShift' }]);
    expect(s.lastReport!.lines[0]).toContain('#0001');
    expect(s.lastReport!.lines[0]).toContain('Ember');
    expect(s.lastReport!.fines).toBeGreaterThan(0);
  });

  it('blind stamping is fined and earns no Standing over five shifts', () => {
    const s = playShifts(9, 5, stamper);
    expect(s.cur.standing).toBe(0);
    expect(s.cur.suspicion).toBeGreaterThan(0);
  });

  it('report lines never show unfilled slots', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = playShifts(seed, 1, stamper);
      for (const line of s.lastReport!.lines) expect(line).not.toMatch(/\{\w+\}/);
    }
  });

  it('the Ledger counts processed cases and bad ones found', () => {
    const s = playShifts(11, 2, thorough);
    const total = Object.values(s.ledger).reduce((n, row) => n + row!.processed, 0);
    expect(total).toBeGreaterThan(20);
    expect(s.ledger.dragon!.bad).toBeGreaterThan(0);
  });

  it('scores the player against the rulebook on the truth', () => {
    const s0 = start();
    const c = s0.shift!.current!;
    const right = correctVerdict(c, RULEBOOK).verdict;
    const s1 = reduce(s0, { t: 'decide', verdict: right });
    expect(s1.shift!.decisions[0]!.correct).toBe(true);
  });
});
