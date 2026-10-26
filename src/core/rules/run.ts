// The single rule evaluator. The rulebook, clerk chips (M3), player scoring, trace logs and
// backtests all go through run(). First matching chip wins; no match gives the default action.
import type { Cond } from '../content/schema';
import { view, type Case, type FieldValue } from '../cases/types';

export interface Chip {
  id: string;
  if: Cond[];
  then: 'approve' | 'deny' | 'stamp' | 'check' | 'escalate' | 'request';
}

export interface RunResult {
  action: Chip['then'];
  firedChip?: string;
  trace: string[];
}

type Values = Record<string, FieldValue>;

/** Evaluates one condition. `values` is the view being judged; `truth` serves verified conditions. */
export function test(cond: Cond, values: Values, truth: Values): boolean {
  const source = cond.verified ? truth : values;
  const actual = source[cond.field];
  const expected = cond.value;
  switch (cond.op) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'lt':
      return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
    case 'gt':
      return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
    case 'in':
      return Array.isArray(expected) && expected.includes(actual);
    case 'has':
      // Substring for text ("thatched cottage" has "thatch"); presence when no value is given.
      if (expected === undefined) return actual !== undefined && actual !== '' && actual !== 'none';
      return typeof actual === 'string' && actual.toLowerCase().includes(String(expected).toLowerCase());
    case 'lacks':
      return !test({ ...cond, op: 'has' }, values, truth);
    case 'matches':
      // Cross-document check: this field equals another named field (Act 2's two-document cases).
      return typeof expected === 'string' && actual === source[expected];
  }
}

export function run(
  c: Case,
  chips: readonly Chip[],
  which: 'claim' | 'truth',
  fallback: Chip['then'],
): RunResult {
  const values = view(c, which);
  const truth = view(c, 'truth');
  const trace: string[] = [];
  for (const chip of chips) {
    if (chip.if.every((cond) => test(cond, values, truth))) {
      trace.push(`${chip.id} matched (${which}) → ${chip.then}`);
      return { action: chip.then, firedChip: chip.id, trace };
    }
  }
  trace.push(`no chip matched (${which}) → ${fallback}`);
  return { action: fallback, trace };
}

/** The verdict the rulebook demands, judged on the truth. */
export function correctVerdict(c: Case, rulebook: readonly Chip[]): { verdict: 'approve' | 'deny'; rule?: string } {
  const r = run(c, rulebook, 'truth', 'approve');
  return { verdict: r.action === 'deny' ? 'deny' : 'approve', rule: r.firedChip };
}
