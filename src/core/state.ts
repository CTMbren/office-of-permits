// GameState is serializable game truth only. UI concerns (animations, selection, open panels)
// live in UI signals and never enter this object.
import { seedRng, type RngState } from './rng';
import type { Case } from './cases/types';
import type { PermitId } from './content/schema';

export const SAVE_VERSION = 2;

export type CastId = 'grell' | 'vane' | 'thrumm' | 'hask' | 'ember' | 'nibb' | 'quill';
export type CastStance = 'honest' | 'corrupt' | 'neglected';
export type Verdict = 'stamp' | 'approve' | 'deny';

export interface CastState {
  stance: CastStance;
  /** Relationship score; positive means they owe you. */
  rel: number;
}

export interface Currencies {
  coin: number;
  standing: number;
  /** Hidden until Request Documents unlocks in M2; present from v1 to avoid a migration. */
  favours: number;
  suspicion: number;
}

/** One decision, kept for the end-of-shift report. */
export interface Decision {
  no: number;
  name: string;
  permit: PermitId;
  district?: string;
  verdict: Verdict;
  correct: boolean;
  /** The rule the case truly broke, if any. */
  rule?: string;
  storyId?: string;
}

export interface ShiftState {
  no: number;
  deskMinutes: number;
  deskMinutesLeft: number;
  /** Desk-minutes spent so far; drives arrivals. */
  elapsed: number;
  nextArrivalAt: number;
  /** Cases generated this shift (story cases are placed by this count). */
  spawned: number;
  current: Case | null;
  /** Fields of the current case already checked. */
  checked: string[];
  tray: Case[];
  streak: number;
  streakPeak: number;
  coinEarned: number;
  standingEarned: number;
  decisions: Decision[];
}

export interface ShiftReport {
  shiftNo: number;
  cases: number;
  correct: number;
  stamped: number;
  coinEarned: number;
  fines: number;
  standingChange: number;
  streakPeak: number;
  lines: string[];
}

export interface LedgerRow {
  processed: number;
  /** Bad applications you found out about: caught by you, or surfaced later. */
  bad: number;
}

export interface GameState {
  v: number;
  seed: number;
  rng: RngState;
  act: 1 | 2 | 3 | 4 | 5;
  shiftNo: number;
  /** Global case counter for case numbers. */
  caseNo: number;
  cur: Currencies;
  shift: ShiftState | null;
  lastReport: ShiftReport | null;
  ledger: Partial<Record<PermitId, LedgerRow>>;
  /** Hidden in M0-M1; drives epilogues and endings later. */
  cast: Record<CastId, CastState>;
  flags: Record<string, number | boolean>;
  meta: { transfers: number };
}

const CAST: CastId[] = ['grell', 'vane', 'thrumm', 'hask', 'ember', 'nibb', 'quill'];

export function newGame(seed: number): GameState {
  return {
    v: SAVE_VERSION,
    seed,
    rng: seedRng(seed),
    act: 1,
    shiftNo: 0,
    caseNo: 0,
    cur: { coin: 0, standing: 0, favours: 0, suspicion: 0 },
    shift: null,
    lastReport: null,
    ledger: {},
    cast: Object.fromEntries(CAST.map((id) => [id, { stance: 'neglected', rel: 0 }])) as Record<
      CastId,
      CastState
    >,
    flags: {},
    meta: { transfers: 0 },
  };
}
