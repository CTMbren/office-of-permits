# Session log

Newest first. One short entry per session: what changed, what's next.

## 2026-10-25 · M0 Skeleton

- Scaffolded Vite + Preact + TypeScript (strict), Vitest, ESLint with core-purity rules, Prettier,
  single-file build, line-count and `npm run check` scripts.
- Core spine: seeded RNG, `GameState` (with hidden favours/cast/flags), actions + pure reducer,
  number formatter, saves (backup slot, migrations, Zod validation, export/import text with checksum),
  content schemas and YAML → JSON build. 30 tests; save fixture v1.
- Mobile-first Parchment Desk shell for iPhone: safe areas, bottom action bar, tabbed drawers on
  phones, three columns from 900px, home-screen icons and manifest, saves sheet (export/import/reset).
  Shift lifecycle works (begin, burn the candle, end); the in-tray is empty until M1.
- Next: M1 desk slice. Start with the case model and generator, then the `run()` evaluator.
- CI workflow is in `.github/workflows/check.yml`; it runs once the project is pushed to GitHub.
- Not yet done (planned): offline service worker. The single-file build is ~137 KB, about 90 KB
  of it Zod; consider `zod/mini` for the runtime save schema if size matters later.
