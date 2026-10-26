// Compiles content/**/*.yaml into src/generated/content.json after validating it.
// `--check` validates only and writes nothing.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ContentSchema } from '../src/core/content/schema';

const CONTENT_DIR = 'content';
const OUT = 'src/generated/content.json';
const checkOnly = process.argv.includes('--check');

/** Pools the case generator reads; each must exist and be non-empty. */
const REQUIRED_POOLS = [
  'bakers',
  'bakeries',
  'wizards',
  'dragons',
  'districts',
  'dwellings',
  'victims',
];
/** Words that would spoil the mystery if they leaked into generic text. */
const SPOILERS = /freehold|o\.v\.|venn|grell/i;

function yamlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return yamlFiles(path);
    return /\.ya?ml$/.test(name) ? [path] : [];
  });
}

const lists = ['rules', 'letters', 'consequences', 'story'] as const;
const merged = {
  rules: [] as unknown[],
  letters: [] as unknown[],
  consequences: [] as unknown[],
  story: [] as unknown[],
  pools: {} as Record<string, unknown>,
};

for (const file of yamlFiles(CONTENT_DIR)) {
  const doc = (parse(readFileSync(file, 'utf8')) ?? {}) as Record<string, unknown>;
  for (const [section, value] of Object.entries(doc)) {
    if (section === 'pools') Object.assign(merged.pools, value);
    else if ((lists as readonly string[]).includes(section))
      merged[section as (typeof lists)[number]].push(...((value as unknown[]) ?? []));
    else throw new Error(`${file}: unknown section "${section}"`);
  }
}

const result = ContentSchema.safeParse(merged);
if (!result.success) {
  console.error('✗ content is invalid:');
  for (const issue of result.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

// Cross-reference checks the schema alone cannot express.
const c = result.data;
const errors: string[] = [];
const ids = new Set<string>();
for (const item of [...c.rules, ...c.letters, ...c.consequences, ...c.story]) {
  if (ids.has(item.id)) errors.push(`duplicate id: ${item.id}`);
  ids.add(item.id);
}
const letterIds = new Set(c.letters.map((l) => l.id));
const ruleIds = new Set(c.rules.map((r) => r.id));
const storyIds = new Set(c.story.map((s) => s.id));
for (const s of c.story) {
  if (s.letter && !letterIds.has(s.letter)) errors.push(`${s.id}: unknown letter "${s.letter}"`);
}
for (const q of c.consequences) {
  if (q.when.rule && !ruleIds.has(q.when.rule)) errors.push(`${q.id}: unknown rule "${q.when.rule}"`);
  if (q.when.story && !storyIds.has(q.when.story)) errors.push(`${q.id}: unknown story "${q.when.story}"`);
}
for (const pool of REQUIRED_POOLS) if (!c.pools[pool]) errors.push(`missing pool "${pool}"`);
for (const [name, items] of Object.entries(c.pools)) {
  for (const item of items) if (SPOILERS.test(item)) errors.push(`pool ${name}: spoiler in "${item}"`);
}
for (const l of c.letters) {
  if (!l.story && SPOILERS.test(l.text)) errors.push(`${l.id}: spoiler words outside a story letter`);
}
if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}

const summary = `${c.rules.length} rules, ${c.letters.length} letters, ${c.consequences.length} consequence sets, ${c.story.length} story cases`;
if (checkOnly) {
  console.log(`✓ content valid (${summary})`);
} else {
  mkdirSync('src/generated', { recursive: true });
  writeFileSync(OUT, JSON.stringify(c, null, 2));
  console.log(`✓ wrote ${OUT} (${summary})`);
}
