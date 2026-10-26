// GameState is serializable game truth only. UI concerns (animations, selection, open panels)
// live in UI signals and never enter this object.
import { seedRng, type RngState } from './rng';
import { BALANCE } from './balance';

export const SAVE_VERSION = 1;

export type CastId = 'grell' | 'vane' | 'thrumm' | 'hask' | 'ember' | 'nibb' | 'quill';
export type CastStance = 'honest' | 'corrupt' | 'neglected';

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

export interface ShiftState {
  no: number;
  deskMinutes: number;
  deskMinutesLeft: number;
  processed: number;
}

export interface GameState {
  v: number;
  seed: number;
  rng: RngState;
  act: 1 | 2 | 3 | 4 | 5;
  shiftNo: number;
  cur: Currencies;
  shift: ShiftState | null;
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
    cur: { coin: 0, standing: 0, favours: 0, suspicion: 0 },
    shift: null,
    cast: Object.fromEntries(CAST.map((id) => [id, { stance: 'neglected', rel: 0 }])) as Record<
      CastId,
      CastState
    >,
    flags: {},
    meta: { transfers: 0 },
  };
}

export function newShift(no: number): ShiftState {
  const deskMinutes = BALANCE.shift.deskMinutesSlice;
  return { no, deskMinutes, deskMinutesLeft: deskMinutes, processed: 0 };
}
