// Zod schemas for everything authored in content/*.yaml.
// The build script validates YAML against these and writes src/generated/content.json.
import { z } from 'zod';

const id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'ids are snake_case');

export const PERMITS = ['bakery', 'tower', 'dragon', 'basement'] as const;
export const FIELD_OPS = ['eq', 'neq', 'in', 'lt', 'gt', 'has', 'lacks', 'matches'] as const;
export const CHIP_ACTIONS = ['approve', 'deny', 'stamp', 'check', 'escalate', 'request'] as const;

export const CondSchema = z.object({
  field: id,
  op: z.enum(FIELD_OPS),
  value: z.unknown().optional(),
  verified: z.boolean().optional(),
});

/**
 * A rule in the player's rulebook is a chip whose action is the verdict it enforces.
 * Official rules may combine up to 3 conditions; player-written chips are limited separately.
 */
export const RuleSchema = z.object({
  id,
  glyph: z.string().min(1).max(60),
  text: z.string().min(1).max(120),
  if: z.array(CondSchema).min(1).max(3),
  then: z.enum(CHIP_ACTIONS),
});

const wordCount = (s: string) => s.trim().split(/\s+/).length;

/** Letters: at most 80 words. `{name}` and other slots are filled when shown. */
export const LetterSchema = z
  .object({
    id,
    permit: z.enum(PERMITS).optional(),
    story: z.boolean().default(false),
    acrostic: z.string().regex(/^[A-Z ]+$/).optional(),
    text: z.string().min(1),
  })
  .refine((l) => wordCount(l.text) <= 80, { message: 'letters must be 80 words or fewer' })
  .refine(
    (l) =>
      !l.acrostic ||
      l.text
        .trim()
        .split('\n')
        .map((line) => line.trim()[0] ?? '')
        .join('')
        .toUpperCase()
        .startsWith(l.acrostic.replace(/ /g, '')),
    { message: 'acrostic does not match the first letters of the lines' },
  );

export const CONSEQUENCE_KINDS = ['passed_invalid', 'denied_valid', 'denied_invalid', 'story'] as const;

/** Report lines. Every line names the case, so a delayed consequence can be traced. */
export const ConsequenceSchema = z.object({
  id,
  when: z.object({
    kind: z.enum(CONSEQUENCE_KINDS),
    permit: z.enum(PERMITS).optional(),
    rule: id.optional(),
    story: id.optional(),
  }),
  lines: z
    .array(
      z
        .string()
        .max(90, 'consequence lines are 90 characters or fewer')
        .refine((s) => s.includes('#{case}'), { message: 'every consequence line names #{case}' }),
    )
    .min(1),
});

const fieldValue = z.union([z.string(), z.number()]);

/** A hand-written case placed at a fixed spot in a given shift. */
export const StoryCaseSchema = z.object({
  id,
  shift: z.number().int().positive(),
  position: z.number().int().positive(),
  permit: z.enum(PERMITS),
  applicant: z.string().min(1),
  species: z.string().min(1),
  cast: id.optional(),
  fee: z.number().positive(),
  fields: z.record(id, z.union([fieldValue, z.object({ claim: fieldValue, truth: fieldValue })])),
  letter: id.optional(),
});

export const ContentSchema = z.object({
  rules: z.array(RuleSchema),
  pools: z.record(id, z.array(z.string().min(1)).min(1)),
  letters: z.array(LetterSchema),
  consequences: z.array(ConsequenceSchema),
  story: z.array(StoryCaseSchema),
});

export type Cond = z.infer<typeof CondSchema>;
export type Rule = z.infer<typeof RuleSchema>;
export type Letter = z.infer<typeof LetterSchema>;
export type Consequence = z.infer<typeof ConsequenceSchema>;
export type StoryCase = z.infer<typeof StoryCaseSchema>;
export type Content = z.infer<typeof ContentSchema>;
export type PermitId = (typeof PERMITS)[number];
