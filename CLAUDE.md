# Office of Permits: working notes for Claude

A text-first fantasy incremental web game. Papers, Please–style desk play (check applicants'
claims, stamp, approve, deny) that turns into an automation puzzle (teach clerks rule chips).
Design doc: https://claude.ai/artifact/5XETEML427kbEjegKu5QwJ
Project plan: https://claude.ai/artifact/9QHhXdEZTx5T3BMoAWbTox

## Current milestone

**M1 Desk slice: done, awaiting Brendan's playtest.** One 120 desk-minute shift with Bakery,
Tower and Dragon cases (claims vs truth), Ember/Vane/Grell story cases, Stamp/Check/Approve/Deny,
named end-of-shift report, Ledger, sound and card animation.
Next: **M2 Act 1 loop** (ranks + upgrade shop, bribes + Suspicion + audit, Request Documents +
named Favours, multi-shift surfacing, Gazette decrees, `balance.yaml`, simulator CI assertions).
Tune M1 from the playtest first if needed (order: invalid-rate gap, defect concentration, dragon fine).
Update this section at the end of every session, and add an entry to `docs/log.md`.

## Platform

Mobile-first web app that must work well on iPhone Safari and as a home-screen app.
Desktop gets the three-column Parchment Desk from 900px wide.
- Touch targets ≥ 48px (`--tap`); inputs ≥ 16px font (stops iOS zoom).
- Respect safe areas (`--safe-*` tokens); the action bar is fixed to the bottom on phones.
- Use `100dvh`, never `100vh`. No hover-only affordances. Keyboard shortcuts are a bonus, not required.
- Save on `visibilitychange`/`pagehide`: iOS can kill a background tab without warning.

## Commands

- `npm run dev`: dev server on the LAN (`--host`), open it on a phone on the same Wi-Fi
- `npm run check`: content build, typecheck, lint, tests, line count, sim smoke. **Must pass before finishing.**
- `npm run build:single`: one self-contained `dist-single/index.html`
- `npm run build`: normal multi-file build in `dist/` (with icons and manifest for home-screen install)

## Module map

| Path | What lives there |
| --- | --- |
| `src/core/` | Pure game logic. No DOM, no Preact, no `Math.random`, no `Date.now` (lint enforces). |
| `src/core/state.ts` | `GameState` type, `newGame(seed)`, `newShift()` |
| `src/core/actions.ts`, `reduce.ts` | Action union; the pure reducer, the only place state changes |
| `src/core/rng.ts` | Seeded RNG (mulberry32); its state lives in `GameState.rng` |
| `src/core/balance.ts` | All tunable numbers (moves to `content/balance.yaml` in M2) |
| `src/core/cases/` | Case model (claim/truth fields, `PERMIT_INFO`) and the generator |
| `src/core/rules/run.ts` | The single evaluator: `run()`, `test()`, `correctVerdict()` |
| `src/core/shift/` | Shift loop (`shift.ts`: arrivals, check, decide) and `report.ts` (end of shift) |
| `src/core/content/index.ts` | Validated content (`CONTENT`, `RULEBOOK`) |
| `src/core/format.ts` | Number formatter |
| `src/core/save/` | Save schema (Zod), codec + migrations + export/import, slot store with backup |
| `src/core/content/schema.ts` | Zod schemas for authored content |
| `src/ui/` | Preact components, signals store, CSS. Reads state, dispatches actions. |
| `src/sim/` | Headless runs through the real reducer (balance bots arrive in M2) |
| `content/` | YAML only: rules, templates, letters. Compiled to `src/generated/content.json` (git-ignored). |
| `scripts/` | `build-content.ts` (validate + compile), `linecount.ts` |
| `tests/` | Vitest; `tests/fixtures/saves/` holds every past save version |

## Invariants

1. `GameState` is serializable game truth only. Animation, selection and open panels live in UI state.
2. All state changes go through `reduce()`. Same seed + same actions = byte-identical state.
3. Any change to the save shape: bump `SAVE_VERSION`, add a migration in `core/save/codec.ts`,
   add a fixture `tests/fixtures/saves/save_vN.json`, and keep old fixtures loading.
4. Content never lives in code; numbers never live outside `balance.ts` (later `balance.yaml`).
5. One evaluator: rules, clerk chips, scoring, trace logs and backtests all use the same `run()` (M1).
6. Files stay under 300 lines (`npm run linecount`). Split by responsibility when close.

## Content conventions

- ids are `snake_case`; slots in text are `{name}`.
- Letters ≤ 80 words, notices ≤ 60 words, consequence lines ≤ 90 characters and always name the case `#{case}`.
- Letters are never required to decide a case correctly.
- Deadpan voice: the Office never admits anything is strange. One joke per line at most.
- Grell's claims always verify. Grell, Venn and Freeholder words stay out of generic pools.
- Grell letters with acrostics are hand-written; the schema checks the `acrostic` field.

## Design tokens (Parchment Desk)

Desk `#2E231C` (glow `#4A3829`) · Paper `#F3EAD3` · Ink `#2A1E14` · Red ink `#9E2B25` ·
Blue ink `#1F3F73` · Gold `#C9A04E`. Fonts: IM Fell English (headings only), Courier Prime
(fields, numbers, buttons), Crimson Pro (letters, body). Defined as CSS variables in `src/ui/theme.css`.
Icons are inline SVG in `src/ui/icons.tsx`; no emoji in the UI.
