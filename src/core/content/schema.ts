// Zod schemas for everything authored in content/*.yaml.
// The build script validates YAML against these and writes src/generated/content.json.
import { z } from 'zod';

const id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'ids are snake_case');

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

const range = z.tuple([z.number(), z.number()]);

export const TemplateSchema = z.object({
  id,
  permit: z.string().min(1),
  species: id,
  acts: z.array(z.number().int().min(1).max(5)).min(1),
  weight: z.number().positive(),
  tags: z.array(id).default([]),
  fields: z.record(id, z.union([range, z.array(z.string()), z.string()])),
  truths: z.record(id, z.number().min(0).max(1)),
  letters: z.array(id).default([]),
});

/** Letters: at most 80 words, per the content style guide. */
export const LetterSchema = z
  .object({
    id,
    requires: z.record(z.string(), z.unknown()).optional(),
    acrostic: z.string().regex(/^[A-Z ]+$/).optional(),
    text: z.string().min(1),
  })
  .refine((l) => l.text.trim().split(/\s+/).length <= 80, {
    message: 'letters must be 80 words or fewer',
  })
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

export const ContentSchema = z.object({
  rules: z.array(RuleSchema),
  templates: z.array(TemplateSchema),
  letters: z.array(LetterSchema),
});

export type Rule = z.infer<typeof RuleSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type Letter = z.infer<typeof LetterSchema>;
export type Content = z.infer<typeof ContentSchema>;
