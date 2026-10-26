import { CONTENT } from '../../core/content';
import { PERMIT_INFO, type Case, type FieldMeta, type FieldValue } from '../../core/cases/types';
import { caseNo, fill } from '../../core/text';
import type { Verdict } from '../../core/state';
import { checkField, openLetter, toggleLetter } from '../play';
import { Seal } from '../icons';

const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');

const SEAL_TEXT: Record<string, string> = { guild: 'Guild of Masons', none: 'None', forged: 'Forged' };

function show(meta: FieldMeta, v: FieldValue): string {
  if (meta.key === 'seal') return SEAL_TEXT[String(v)] ?? String(v);
  if (meta.unit === 'storey') return `${v} ${Number(v) === 1 ? 'storey' : 'storeys'}`;
  return meta.unit ? `${v} ${meta.unit}` : String(v);
}

function FieldRow({ c, meta, checked, index, live }: { c: Case; meta: FieldMeta; checked: boolean; index: number; live: boolean }) {
  const f = c.fields[meta.key];
  if (!f) return null;
  const claim = show(meta, f.claim);
  const truth = show(meta, f.truth);
  const lied = f.claim !== f.truth;
  const isSeal = meta.key === 'seal' && f.claim !== 'none';

  const value = checked ? (
    <span class="field__value">
      {lied && <s class="field__claim">{claim}</s>}
      <span class={lied ? 'field__truth field__truth--lie' : 'field__truth'}>{truth}</span>
      <span class="field__mark">{lied ? 'false claim' : 'verified'}</span>
    </span>
  ) : (
    <span class="field__value">
      {isSeal && <Seal />}
      {claim}
      {DEBUG && lied && <span class="field__debug">truth: {truth}</span>}
    </span>
  );

  if (!meta.checkable || !live || checked) {
    return (
      <div class={`field${checked ? ' field--checked' : ''}`}>
        <span class="field__label">{meta.label}</span>
        {value}
      </div>
    );
  }
  return (
    <button type="button" class="field field--checkable" onClick={() => checkField(meta.key)}>
      <span class="field__label">{meta.label}</span>
      {value}
      <span class="field__check">
        Check · 1 min<span class="field__key"> {index}</span>
      </span>
    </button>
  );
}

const STAMP_TEXT: Record<Verdict, string> = { approve: 'APPROVED', deny: 'DENIED', stamp: 'STAMPED' };

export function CaseCard({ c, checked, live, stamp, extraClass = '' }: { c: Case; checked: string[]; live: boolean; stamp?: Verdict; extraClass?: string }) {
  const info = PERMIT_INFO[c.permit];
  const letter = c.letterId ? CONTENT.letters.find((l) => l.id === c.letterId) : undefined;
  const letterOpen = openLetter.value === c.no;
  let checkIndex = 0;

  return (
    <article class={`card case ${extraClass}`} aria-label={`${info.title}, case ${caseNo(c.no)}`}>
      <div class="card__head">
        <span class="card__title">{info.title}</span>
        <span class="card__no">No. {caseNo(c.no)}</span>
      </div>
      <div class="field">
        <span class="field__label">Applicant</span>
        <span class="field__value">
          {c.applicant.name}
          {c.permit !== 'dragon' && <span class="badge">{c.applicant.species}</span>}
        </span>
      </div>
      {info.fields.map((meta) => {
        if (meta.checkable) checkIndex++;
        return (
          <FieldRow key={meta.key} c={c} meta={meta} checked={checked.includes(meta.key)} index={checkIndex} live={live} />
        );
      })}
      <div class="field">
        <span class="field__label">Fee</span>
        <span class="field__value">{c.fee} coin</span>
      </div>
      {letter && (
        <div class="letter">
          <button type="button" class="letter__toggle" aria-expanded={letterOpen} onClick={() => toggleLetter(c.no)} disabled={!live}>
            {letterOpen ? 'Fold the letter' : 'Read the letter'}
            <span class="letter__free">free</span>
          </button>
          {letterOpen && <p class="letter__text">{fill(letter.text.trim(), { name: c.applicant.name })}</p>}
        </div>
      )}
      {stamp && (
        <div class={`stamp stamp--${stamp}`} style={{ transform: `rotate(${((c.no * 37) % 17) - 8 - 6}deg)` }} aria-hidden="true">
          {STAMP_TEXT[stamp]}
        </div>
      )}
    </article>
  );
}
