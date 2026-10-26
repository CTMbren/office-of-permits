import { describe, expect, it } from 'vitest';
import { generateCase, nextCase } from '../src/core/cases/generate';
import { checkableFields, PERMIT_INFO } from '../src/core/cases/types';
import { correctVerdict, run } from '../src/core/rules/run';
import { RULEBOOK, CONTENT } from '../src/core/content';
import { roller } from '../src/core/rng';
import { fill } from '../src/core/text';

const N = 10_000;
const r = roller(12345);
const cases = Array.from({ length: N }, (_, i) => generateCase(r, i + 1));

describe('case generator (10,000 cases)', () => {
  it('only lies in checkable fields', () => {
    for (const c of cases) {
      const checkable = new Set(checkableFields(c));
      for (const [k, f] of Object.entries(c.fields)) {
        if (f.claim !== f.truth) expect(checkable.has(k), `${c.permit}.${k}`).toBe(true);
      }
    }
  });

  it('every case can be decided correctly by checking fields', () => {
    for (const c of cases) {
      // Checking every checkable field turns the claim view into the truth.
      const revealed = { ...c, fields: Object.fromEntries(Object.entries(c.fields).map(([k, f]) => [k, { claim: f.truth, truth: f.truth }])) };
      expect(run(revealed, RULEBOOK, 'claim', 'approve').action).toBe(correctVerdict(c, RULEBOOK).verdict);
    }
  });

  it('honest applicants never lie, and most liars look fine on the card', () => {
    let hidden = 0;
    let invalid = 0;
    for (const c of cases) {
      const lied = Object.values(c.fields).some((f) => f.claim !== f.truth);
      const valid = correctVerdict(c, RULEBOOK).verdict === 'approve';
      if (valid) expect(lied).toBe(false);
      else {
        invalid++;
        if (run(c, RULEBOOK, 'claim', 'approve').action === 'approve') hidden++;
      }
    }
    expect(hidden / invalid).toBeGreaterThan(0.7);
  });

  it('invalid rates track the balance targets per permit', () => {
    const rate = (p: string) => {
      const of = cases.filter((c) => c.permit === p);
      return of.filter((c) => correctVerdict(c, RULEBOOK).verdict === 'deny').length / of.length;
    };
    expect(rate('bakery')).toBeCloseTo(0.05, 1);
    expect(rate('tower')).toBeCloseTo(0.25, 1);
    expect(rate('dragon')).toBeCloseTo(0.45, 1);
  });

  it('every card field has a value and letters fill without leftover slots', () => {
    for (const c of cases.slice(0, 500)) {
      for (const f of PERMIT_INFO[c.permit].fields) expect(c.fields[f.key], `${c.permit}.${f.key}`).toBeDefined();
      if (c.letterId) {
        const letter = CONTENT.letters.find((l) => l.id === c.letterId)!;
        expect(fill(letter.text, { name: c.applicant.name })).not.toMatch(/\{\w+\}/);
      }
    }
  });
});

describe('story cases', () => {
  it('appear at their scheduled positions in shift 1', () => {
    const rr = roller(1);
    expect(nextCase(rr, 1, 1, 1).storyId).toBe('ember_thatch_case');
    expect(nextCase(rr, 1, 6, 6).storyId).toBe('vane_tower_case');
    expect(nextCase(rr, 1, 11, 11).storyId).toBe('grell_basement_case');
    expect(nextCase(rr, 2, 1, 50).storyId).toBeUndefined();
  });

  it('Ember breaks a rule in plain sight, Vane hides one, Grell is flawless', () => {
    const rr = roller(1);
    const ember = nextCase(rr, 1, 1, 1);
    const vane = nextCase(rr, 1, 6, 6);
    const grell = nextCase(rr, 1, 11, 11);
    expect(run(ember, RULEBOOK, 'claim', 'approve').action).toBe('deny');
    expect(run(vane, RULEBOOK, 'claim', 'approve').action).toBe('approve');
    expect(correctVerdict(vane, RULEBOOK).verdict).toBe('deny');
    expect(correctVerdict(grell, RULEBOOK).verdict).toBe('approve');
    expect(Object.values(grell.fields).every((f) => f.claim === f.truth)).toBe(true);
  });
});
