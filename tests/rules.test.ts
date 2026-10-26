import { describe, expect, it } from 'vitest';
import { correctVerdict, run, test as cond, type Chip } from '../src/core/rules/run';
import { RULEBOOK } from '../src/core/content';
import type { Case, FieldValue } from '../src/core/cases/types';

const truthy: Record<string, FieldValue> = {};

function mk(permit: Case['permit'], fields: Record<string, FieldValue | [FieldValue, FieldValue]>, species = 'human'): Case {
  const f: Case['fields'] = {};
  for (const [k, v] of Object.entries(fields)) {
    f[k] = Array.isArray(v) ? { claim: v[0], truth: v[1] } : { claim: v, truth: v };
  }
  return { no: 1, permit, applicant: { name: 'Test', species }, fee: 10, fields: f };
}

describe('conditions', () => {
  const v = { floors: 7, dwelling: 'thatched cottage', seal: 'guild', a: 'x', b: 'x', c: 'y' };
  it.each([
    [{ field: 'floors', op: 'gt', value: 5 }, true],
    [{ field: 'floors', op: 'gt', value: 7 }, false],
    [{ field: 'floors', op: 'lt', value: 8 }, true],
    [{ field: 'floors', op: 'lt', value: 'eight' }, false],
    [{ field: 'seal', op: 'eq', value: 'guild' }, true],
    [{ field: 'seal', op: 'neq', value: 'guild' }, false],
    [{ field: 'seal', op: 'in', value: ['guild', 'forged'] }, true],
    [{ field: 'seal', op: 'in', value: ['none'] }, false],
    [{ field: 'dwelling', op: 'has', value: 'THATCH' }, true],
    [{ field: 'dwelling', op: 'has', value: 'slate' }, false],
    [{ field: 'dwelling', op: 'lacks', value: 'slate' }, true],
    [{ field: 'seal', op: 'has' }, true],
    [{ field: 'missing', op: 'has' }, false],
    [{ field: 'a', op: 'matches', value: 'b' }, true],
    [{ field: 'a', op: 'matches', value: 'c' }, false],
  ] as const)('%o → %s', (c, expected) => {
    expect(cond(c as never, v, truthy)).toBe(expected);
  });

  it('a verified condition reads the truth, not the claim', () => {
    const claim = { floors: 4 };
    const truth = { floors: 8 };
    expect(cond({ field: 'floors', op: 'gt', value: 5 }, claim, truth)).toBe(false);
    expect(cond({ field: 'floors', op: 'gt', value: 5, verified: true }, claim, truth)).toBe(true);
  });
});

describe('run', () => {
  const chips: Chip[] = [
    { id: 'tall', if: [{ field: 'floors', op: 'gt', value: 5 }], then: 'deny' },
    { id: 'any_tower', if: [{ field: 'permit', op: 'eq', value: 'tower' }], then: 'approve' },
  ];
  it('first matching chip wins and is traced', () => {
    const r = run(mk('tower', { floors: 7, seal: 'none' }), chips, 'truth', 'escalate');
    expect(r).toMatchObject({ action: 'deny', firedChip: 'tall' });
    expect(r.trace[0]).toContain('tall');
  });
  it('falls back when nothing matches', () => {
    expect(run(mk('bakery', { sign_m: 2 }), chips, 'truth', 'escalate').action).toBe('escalate');
  });
  it('judges claims and truth separately (the clerk literalism)', () => {
    const liar = mk('tower', { floors: [4, 8], seal: 'none' });
    expect(run(liar, chips, 'claim', 'escalate').action).toBe('approve');
    expect(run(liar, chips, 'truth', 'escalate').action).toBe('deny');
  });
});

describe('the M1 rulebook', () => {
  it.each([
    ['short tower, no seal', mk('tower', { floors: 4, seal: 'none', district: 'Elm Ward' }), 'approve', undefined],
    ['tall tower with Guild seal', mk('tower', { floors: 8, seal: 'guild' }), 'approve', undefined],
    ['tall tower, no seal', mk('tower', { floors: 8, seal: 'none' }), 'deny', 'tower_guild_seal'],
    ['tall tower, forged seal', mk('tower', { floors: 8, seal: 'forged' }), 'deny', 'tower_guild_seal'],
    ['short tower, forged seal', mk('tower', { floors: 3, seal: 'forged' }), 'deny', 'forged_seal'],
    ['small sign', mk('bakery', { sign_m: 3, seal: 'none' }), 'approve', undefined],
    ['big sign, no seal', mk('bakery', { sign_m: 5, seal: 'none' }), 'deny', 'bakery_guild_seal'],
    ['big sign, Guild seal', mk('bakery', { sign_m: 5, seal: 'guild' }), 'approve', undefined],
    ['dragon in slate', mk('dragon', { species: 'dragon', dwelling: 'slate cottage', seal: 'none' }, 'dragon'), 'approve', undefined],
    ['dragon in thatch', mk('dragon', { species: 'dragon', dwelling: 'thatched barn', seal: 'none' }, 'dragon'), 'deny', 'dragon_thatch'],
    ['wyvern', mk('dragon', { species: 'wyvern', dwelling: 'stone tower', seal: 'none' }, 'dragon'), 'deny', 'dragon_species'],
    ['basement', mk('basement', { depth: 1, use: 'storage' }), 'approve', undefined],
  ])('%s → %s', (_, c, verdict, rule) => {
    expect(correctVerdict(c, RULEBOOK)).toEqual({ verdict, ...(rule ? { rule } : {}) });
  });
});
