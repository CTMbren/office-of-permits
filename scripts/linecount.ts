// Fails if any source file grows past the limit. Small files keep each Claude session's edits safe.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const LIMIT = 300;
const ROOTS = ['src', 'scripts', 'tests'];
const SKIP = new Set(['generated', 'node_modules']);
const EXT = /\.(ts|tsx|css)$/;

function walk(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (EXT.test(name)) out.push(path);
  }
}

const files: string[] = [];
for (const root of ROOTS) if (existsSync(root)) walk(root, files);

const over = files
  .map((f) => ({ f, n: readFileSync(f, 'utf8').split('\n').length }))
  .filter(({ n }) => n > LIMIT);

if (over.length > 0) {
  for (const { f, n } of over) console.error(`✗ ${relative('.', f)}: ${n} lines (limit ${LIMIT})`);
  process.exit(1);
}
console.log(`✓ ${files.length} files within ${LIMIT} lines`);
