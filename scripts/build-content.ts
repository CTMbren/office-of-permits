// Compiles content/**/*.yaml into src/generated/content.json after validating it.
// `--check` validates only and writes nothing.
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { ContentSchema, type Content } from '../src/core/content/schema';

const CONTENT_DIR = 'content';
const OUT = 'src/generated/content.json';
const checkOnly = process.argv.includes('--check');

function yamlFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return yamlFiles(path);
    return /\.ya?ml$/.test(name) ? [path] : [];
  });
}

// Each YAML file is a map of section -> list, e.g. { rules: [...], letters: [...] }.
const merged: Record<keyof Content, unknown[]> = { rules: [], templates: [], letters: [] };
for (const file of yamlFiles(CONTENT_DIR)) {
  const doc = parse(readFileSync(file, 'utf8')) as Record<string, unknown[]> | null;
  for (const [section, items] of Object.entries(doc ?? {})) {
    if (!(section in merged)) throw new Error(`${file}: unknown section "${section}"`);
    merged[section as keyof Content].push(...(items ?? []));
  }
}

const result = ContentSchema.safeParse(merged);
if (!result.success) {
  console.error('✗ content is invalid:');
  for (const issue of result.error.issues) console.error(`  ${issue.path.join('.')}: ${issue.message}`);
  process.exit(1);
}

// Cross-reference checks the schema alone cannot express.
const errors: string[] = [];
const letterIds = new Set(result.data.letters.map((l) => l.id));
const seen = new Set<string>();
for (const item of [...result.data.rules, ...result.data.templates, ...result.data.letters]) {
  if (seen.has(item.id)) errors.push(`duplicate id: ${item.id}`);
  seen.add(item.id);
}
for (const t of result.data.templates) {
  for (const l of t.letters) if (!letterIds.has(l)) errors.push(`${t.id}: unknown letter "${l}"`);
}
if (errors.length > 0) {
  for (const e of errors) console.error(`✗ ${e}`);
  process.exit(1);
}

const { rules, templates, letters } = result.data;
const summary = `${rules.length} rules, ${templates.length} templates, ${letters.length} letters`;
if (checkOnly) {
  console.log(`✓ content valid (${summary})`);
} else {
  mkdirSync('src/generated', { recursive: true });
  writeFileSync(OUT, JSON.stringify(result.data, null, 2));
  console.log(`✓ wrote ${OUT} (${summary})`);
}
