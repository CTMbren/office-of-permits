// The case model. Every field holds what the applicant CLAIMS and what is TRUE.
// Checking a field reveals its truth; the rulebook judges the truth.
import type { PermitId } from '../content/schema';

export type FieldValue = string | number;
export type Seal = 'guild' | 'none' | 'forged';

export interface Field {
  claim: FieldValue;
  truth: FieldValue;
}

export interface Case {
  /** Global case number, shown as No. 0042. */
  no: number;
  permit: PermitId;
  applicant: { name: string; species: string; cast?: string };
  fee: number;
  fields: Record<string, Field>;
  letterId?: string;
  storyId?: string;
}

export interface FieldMeta {
  key: string;
  label: string;
  checkable: boolean;
  unit?: string;
}

/** What each permit shows on its card, in order. Only checkable fields can hide a lie. */
export const PERMIT_INFO: Record<PermitId, { title: string; fields: FieldMeta[] }> = {
  bakery: {
    title: 'Bakery Signage',
    fields: [
      { key: 'shop', label: 'Bakery', checkable: false },
      { key: 'district', label: 'District', checkable: false },
      { key: 'sign_m', label: 'Sign width', checkable: true, unit: 'm' },
      { key: 'seal', label: 'Seal', checkable: true },
    ],
  },
  tower: {
    title: 'Tower Expansion',
    fields: [
      { key: 'district', label: 'District', checkable: false },
      { key: 'floors', label: 'Floors', checkable: true },
      { key: 'seal', label: 'Seal', checkable: true },
    ],
  },
  dragon: {
    title: 'Dragon Residency',
    fields: [
      { key: 'species', label: 'Species', checkable: true },
      { key: 'dwelling', label: 'Dwelling', checkable: true },
      { key: 'district', label: 'District', checkable: false },
      { key: 'seal', label: 'Seal', checkable: true },
    ],
  },
  basement: {
    title: 'Basement Extension',
    fields: [
      { key: 'address', label: 'Address', checkable: false },
      { key: 'depth', label: 'Depth', checkable: true, unit: 'storey' },
      { key: 'use', label: 'Use', checkable: true },
    ],
  },
};

export function checkableFields(c: Case): string[] {
  return PERMIT_INFO[c.permit].fields.filter((f) => f.checkable).map((f) => f.key);
}

/** Field values as one view: what the applicant says, or what is true. */
export function view(c: Case, which: 'claim' | 'truth'): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = { permit: c.permit, species: c.applicant.species };
  for (const [k, f] of Object.entries(c.fields)) out[k] = f[which];
  return out;
}
