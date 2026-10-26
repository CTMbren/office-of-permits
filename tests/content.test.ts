import { describe, expect, it } from 'vitest';
import content from '../src/generated/content.json';
import { ContentSchema, LetterSchema } from '../src/core/content/schema';

describe('content', () => {
  it('generated content matches the schema', () => {
    expect(ContentSchema.safeParse(content).success).toBe(true);
  });

  it('rejects letters over 80 words', () => {
    const text = Array.from({ length: 81 }, () => 'word').join(' ');
    expect(LetterSchema.safeParse({ id: 'long_letter', text }).success).toBe(false);
  });

  it('checks acrostics against the first letters of each line', () => {
    const text = 'A small cellar.\nStone from the quarry.\nKindly ignore the humming.';
    expect(LetterSchema.safeParse({ id: 'grell_a', acrostic: 'ASK', text }).success).toBe(true);
    expect(LetterSchema.safeParse({ id: 'grell_b', acrostic: 'ASH', text }).success).toBe(false);
  });
});
