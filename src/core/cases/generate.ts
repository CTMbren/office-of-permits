// Builds cases. Honest applicants' claims equal the truth. Invalid applicants usually hide
// their lie in one checkable field so the card looks fine; a few break a rule in plain sight.
import { BALANCE } from '../balance';
import { CONTENT } from '../content';
import type { PermitId, StoryCase } from '../content/schema';
import type { Roller } from '../rng';
import type { Case, Field, FieldValue } from './types';

const P = CONTENT.pools;
const same = (v: FieldValue): Field => ({ claim: v, truth: v });
const lie = (claim: FieldValue, truth: FieldValue): Field => ({ claim, truth });

type Built = Pick<Case, 'applicant' | 'fields'>;

function bakery(r: Roller, invalid: boolean, honestViolation: boolean): Built {
  const base = { shop: same(r.pick(P.bakeries!)), district: same(r.pick(P.districts!)) };
  const applicant = { name: r.pick(P.bakers!), species: 'human' };
  if (!invalid) {
    const big = r.chance(0.4);
    const seal = big ? 'guild' : r.chance(0.4) ? 'guild' : 'none';
    return { applicant, fields: { ...base, sign_m: same(big ? r.int(4, 6) : r.int(1, 3)), seal: same(seal) } };
  }
  if (honestViolation) return { applicant, fields: { ...base, sign_m: same(r.int(4, 6)), seal: same('none') } };
  const defect = r.weighted(BALANCE.defects.bakery);
  if (defect === 'sign_m') {
    return { applicant, fields: { ...base, sign_m: lie(r.int(2, 3), r.int(4, 6)), seal: same('none') } };
  }
  return { applicant, fields: { ...base, sign_m: same(r.int(1, 6)), seal: lie('guild', 'forged') } };
}

function tower(r: Roller, invalid: boolean, honestViolation: boolean): Built {
  const base = { district: same(r.pick(P.districts!)) };
  const applicant = { name: r.pick(P.wizards!), species: 'wizard' };
  if (!invalid) {
    const tall = r.chance(0.45);
    const seal = tall ? 'guild' : r.chance(0.3) ? 'guild' : 'none';
    return { applicant, fields: { ...base, floors: same(tall ? r.int(6, 9) : r.int(2, 5)), seal: same(seal) } };
  }
  if (honestViolation) return { applicant, fields: { ...base, floors: same(r.int(6, 9)), seal: same('none') } };
  const defect = r.weighted(BALANCE.defects.tower);
  if (defect === 'floors') {
    return { applicant, fields: { ...base, floors: lie(r.int(3, 5), r.int(6, 9)), seal: same('none') } };
  }
  return { applicant, fields: { ...base, floors: same(r.int(2, 9)), seal: lie('guild', 'forged') } };
}

function dragon(r: Roller, invalid: boolean, honestViolation: boolean): Built {
  const home = () => r.pick(P.dwellings!);
  const thatched = () => r.pick(['thatched cottage', 'thatched barn', 'thatched cottage (charming)']);
  const district = same(r.pick(P.districts!));
  const applicant = { name: r.pick(P.dragons!), species: 'dragon' };
  const seal = () => same(r.chance(0.5) ? 'guild' : 'none');
  if (!invalid) return { applicant, fields: { species: same('dragon'), dwelling: same(home()), district, seal: seal() } };
  if (honestViolation) {
    return { applicant, fields: { species: same('dragon'), dwelling: same(thatched()), district, seal: seal() } };
  }
  const defect = r.weighted(BALANCE.defects.dragon);
  if (defect === 'dwelling') {
    return { applicant, fields: { species: same('dragon'), dwelling: lie(home(), thatched()), district, seal: seal() } };
  }
  if (defect === 'species') {
    return { applicant, fields: { species: lie('dragon', 'wyvern'), dwelling: same(home()), district, seal: seal() } };
  }
  return { applicant, fields: { species: same('dragon'), dwelling: same(home()), district, seal: lie('guild', 'forged') } };
}

const BUILDERS = { bakery, tower, dragon } as const;
type Generated = keyof typeof BUILDERS;

export function generateCase(r: Roller, no: number): Case {
  const permit = r.weighted<Generated>({
    bakery: BALANCE.permits.bakery.weight,
    tower: BALANCE.permits.tower.weight,
    dragon: BALANCE.permits.dragon.weight,
  });
  const invalid = r.chance(BALANCE.permits[permit].invalid);
  const honestViolation = invalid && r.chance(BALANCE.honestViolation);
  const built = BUILDERS[permit](r, invalid, honestViolation);
  const letters = CONTENT.letters.filter((l) => l.permit === permit && !l.story);
  const letterId = letters.length > 0 && r.chance(BALANCE.letterChance) ? r.pick(letters).id : undefined;
  return { no, permit, fee: BALANCE.permits[permit].fee, ...built, ...(letterId ? { letterId } : {}) };
}

export function storyCase(s: StoryCase, no: number): Case {
  const fields: Record<string, Field> = {};
  for (const [k, v] of Object.entries(s.fields)) fields[k] = typeof v === 'object' ? { ...v } : same(v);
  return {
    no,
    permit: s.permit as PermitId,
    applicant: { name: s.applicant, species: s.species, ...(s.cast ? { cast: s.cast } : {}) },
    fee: s.fee,
    fields,
    storyId: s.id,
    ...(s.letter ? { letterId: s.letter } : {}),
  };
}

/** The next case for a shift: a story case if one is scheduled at this position, else a generated one. */
export function nextCase(r: Roller, shiftNo: number, position: number, no: number): Case {
  const story = CONTENT.story.find((s) => s.shift === shiftNo && s.position === position);
  return story ? storyCase(story, no) : generateCase(r, no);
}
