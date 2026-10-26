// Zod schema for the current save format. A loaded save is validated against this after
// migrations run; anything that fails is refused rather than half-loaded.
import { z } from 'zod';

const stance = z.enum(['honest', 'corrupt', 'neglected']);
const castState = z.object({ stance, rel: z.number() });

export const GameStateSchema = z.object({
  v: z.number().int(),
  seed: z.number().int(),
  rng: z.number().int().nonnegative(),
  act: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  shiftNo: z.number().int().nonnegative(),
  cur: z.object({
    coin: z.number(),
    standing: z.number(),
    favours: z.number(),
    suspicion: z.number(),
  }),
  shift: z
    .object({
      no: z.number().int(),
      deskMinutes: z.number(),
      deskMinutesLeft: z.number(),
      processed: z.number().int(),
    })
    .nullable(),
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
