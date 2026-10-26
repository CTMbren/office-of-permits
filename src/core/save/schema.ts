// Zod schema for the current save format. A loaded save is validated against this after
// migrations run; anything that fails is refused rather than half-loaded.
import { z } from 'zod';
import { PERMITS } from '../content/schema';

const stance = z.enum(['honest', 'corrupt', 'neglected']);
const castState = z.object({ stance, rel: z.number() });
const permit = z.enum(PERMITS);
const value = z.union([z.string(), z.number()]);
const verdict = z.enum(['stamp', 'approve', 'deny']);

const CaseSchema = z.object({
  no: z.number().int(),
  permit,
  applicant: z.object({ name: z.string(), species: z.string(), cast: z.string().optional() }),
  fee: z.number(),
  fields: z.record(z.string(), z.object({ claim: value, truth: value })),
  letterId: z.string().optional(),
  storyId: z.string().optional(),
});

const DecisionSchema = z.object({
  no: z.number().int(),
  name: z.string(),
  permit,
  district: z.string().optional(),
  verdict,
  correct: z.boolean(),
  rule: z.string().optional(),
  storyId: z.string().optional(),
});

const ShiftSchema = z.object({
  no: z.number().int(),
  deskMinutes: z.number(),
  deskMinutesLeft: z.number(),
  elapsed: z.number(),
  nextArrivalAt: z.number(),
  spawned: z.number().int(),
  current: CaseSchema.nullable(),
  checked: z.array(z.string()),
  tray: z.array(CaseSchema),
  streak: z.number(),
  streakPeak: z.number(),
  coinEarned: z.number(),
  standingEarned: z.number(),
  decisions: z.array(DecisionSchema),
});

const ReportSchema = z.object({
  shiftNo: z.number().int(),
  cases: z.number().int(),
  correct: z.number().int(),
  stamped: z.number().int(),
  coinEarned: z.number(),
  fines: z.number(),
  standingChange: z.number(),
  streakPeak: z.number(),
  lines: z.array(z.string()),
});

export const GameStateSchema = z.object({
  v: z.number().int(),
  seed: z.number().int(),
  rng: z.number().int().nonnegative(),
  act: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  shiftNo: z.number().int().nonnegative(),
  caseNo: z.number().int().nonnegative(),
  cur: z.object({
    coin: z.number(),
    standing: z.number(),
    favours: z.number(),
    suspicion: z.number(),
  }),
  shift: ShiftSchema.nullable(),
  lastReport: ReportSchema.nullable(),
  ledger: z.partialRecord(permit, z.object({ processed: z.number(), bad: z.number() })),
  cast: z.object({
    grell: castState,
    vane: castState,
    thrumm: castState,
    hask: castState,
    ember: castState,
    nibb: castState,
    quill: castState,
  }),
  flags: z.record(z.string(), z.union([z.number(), z.boolean()])),
  meta: z.object({ transfers: z.number().int() }),
});

export const SaveFileSchema = z.object({
  v: z.number().int().positive(),
  savedAt: z.number(),
  state: z.unknown(),
});
