# Session log

Newest first. One short entry per session: what changed, what's next.

## 2026-10-25 · M1 Desk slice

- Content (YAML, validated): 5 rules, name pools, 15 letters (incl. Ember, Vane, Grell with the
  ASKIT acrostic), 9 consequence sets with `#{case}` enforced, 3 story cases in shift 1.
- Core: claim/truth case model; generator per permit with hidden lies in checkable fields and ~20%
  open violations; single `run()` evaluator (8 operators, verified flag, trace); shift loop with
  arrivals every 3 desk-minutes, Check 1 / Stamp 1 / Approve 2 / Deny 2, streak, Ledger;
  end-of-shift report (surfacing at lifetime chance, fines, named lines, story lines always).
  Denials get instant feedback; approvals and stamps are judged at the report (no info leak).
- Save v2 with migration from v1 and fixture. 82 tests including 10,000-case solvability.
- UI: tap-to-check fields (strike-through claim, verified truth), free letters, Stamp/Approve/Deny
  bar with costs, stamp drop + card fly/crumple, WebAudio sounds + mute, typewriter report,
  Tray & Ledger panel, map dot after Grell, `?debug` shows hidden truths, keys S/A/D/1-4/Space/M.
- Sim (5 shifts, 50 seeds): thorough ≈ 1,880 coin / 172 Standing; card-reader ≈ 1,930 / 106;
  blind stamper ≈ 445 / 0. Careful play wins Standing, as designed.
- Next: Brendan's M1 playtest, then M2.

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
