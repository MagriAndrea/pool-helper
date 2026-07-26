# WIP: Chlorine Comparison Refactor (tests first, then generic A/B slots)

## 1. Initial State

- The comparison tool (`/tools/chlorine-comparison`) is **structurally asymmetric**: `CalciumInput` (kg only) vs `SodiumInput` (L/kg + density), two separate functions (`calculateCalciumMetrics`, `calculateSodiumMetrics`), and `compareChemicals(calcium, sodium)` whose result identifies the winner **by chemical type** (`winner: 'CALCIUM' | 'SODIUM' | 'DRAW' | null`). Comparing two products of the *same* type is impossible: `winner: 'SODIUM'` cannot say *which* sodium product won. Logic: `src/lib/calculator/chlorine-comparison.ts`.
- UI hardwires `CalciumCard` + `SodiumCard` side by side; API endpoint is `POST /api/v1/calculate/chlorine` (body `{ calciumInput, sodiumInput }`).
- The hook `use-chlorine-comparison.ts` **predates the storage convention**: it persists under legacy keys `ph_calcium_input` / `ph_sodium_input` with raw `useLocalStorage`, instead of a `TOOL_KEYS` entry (see `src/lib/shared-state.ts`).
- Found in passing: stale comment in `src/lib/shared-state.ts` — `volume: 'ph_tool_volume' // reserved for the future standalone volume tool` — but the standalone volume tool **exists now**. Fix the comment while touching the file.
- The repo has **no test framework and zero tests**. All calculator logic is pure functions — the ideal unit-test target.

## 2. Objective

Two sub-phases, strictly in order. Decisions agreed with the user (2026-07-19):

### Phase A — Safety net first (Vitest)
- Add **Vitest** (devDependency + `npm test` script + config). No UI testing scope here — pure function tests only.
- Write unit tests for the **current behavior** of every pure module in `src/lib/calculator/`: `chlorine-comparison`, `chlorine-target`, `chlorine-dose`, `product-conversion`, `pool-volume`, `shock`, `range`, `units`. These tests freeze today's behavior so the refactor has a regression net.

### Phase B — Generic A/B slots
- Replace the type-keyed model with **two generic slots**: each slot is a product input with a **selectable type** (`sodium_hypochlorite` | `calcium_hypochlorite`; extensible later to stabilized products from WIP_ChlorineMaintenanceTool). One metrics function handles any product (solid → kg; liquid → L/kg + density).
- Comparison returns `winner: 'A' | 'B' | 'DRAW' | null` (slot-identified, not type-identified) + per-slot metrics. Same-type AND mixed comparisons both work — one tool, one UI.
- UI: one generic `ProductCard` rendered twice (replaces `CalciumCard`/`SodiumCard`), with a type selector per card. URL stays `/tools/chlorine-comparison`.
- **Storage migration**: move persistence to the `TOOL_KEYS` convention (`comparison: 'ph_tool_comparison'`). One-shot migration: if legacy `ph_calcium_input`/`ph_sodium_input` exist, convert them into slot A (calcium) / slot B (sodium) then remove legacy keys.
- Update `POST /api/v1/calculate/chlorine` to the slot model (breaking change is acceptable: the API is v1 and consumed only by our UI; the OpenAPI docs from WIP_DocsAndLegal must be regenerated).
- i18n: keys move from calcium/sodium-specific labels to slot/product labels; update `en.json` + `it.json` (no em dashes in Italian values).

### Constraints
- **Dependencies**: WIP_DocsAndLegal Phase 3 should land first (the endpoint refactor then updates a Zod schema and the OpenAPI regenerates for free). Vitest (Phase A) is a hard prerequisite of Phase B.
- Behavior parity for the existing mixed comparison must be proven by the Phase A tests (same inputs → same numbers).
- Keep `src/lib/calculator/index.ts` re-exports coherent; the calculator stays i18n-free (numbers and codes only).
- Do **not** run `npm run dev` / `npm run build`. Running `npm test` / `npx vitest run` is fine and expected.
- New worktree based off `main` after WIP_DocsAndLegal merges (per user's worktree-per-feature workflow).

## 3. Target Files

Phase A:
- `package.json` (vitest devDep, `test` script)
- `vitest.config.ts` (new)
- `src/lib/calculator/__tests__/*.test.ts` (new, one file per module)

Phase B:
- `src/lib/calculator/chlorine-comparison.ts` (slot model, single metrics function)
- `src/lib/calculator/types.ts` / `index.ts` (types + re-exports)
- `src/lib/shared-state.ts` (add `TOOL_KEYS.comparison`; fix stale volume comment)
- `src/hooks/use-chlorine-comparison.ts` (slot state, TOOL_KEYS storage, legacy migration)
- `src/components/tools/chlorine-comparison/ProductCard.tsx` (new, replaces `CalciumCard.tsx` + `SodiumCard.tsx` — delete those)
- `src/components/tools/chlorine-comparison/ComparisonVerdict.tsx` (slot-based winner)
- `src/app/[locale]/tools/chlorine-comparison/page.tsx`
- `src/app/api/v1/calculate/chlorine/route.ts` (+ its Zod schema in `src/lib/api/`)
- `src/messages/en.json`, `src/messages/it.json`
- `src/lib/calculator/AGENTS.md`, `ARCHITECTURE.md` (document slot model + testing convention)
- Info page from WIP_DocsAndLegal Phase 2 (`tools/chlorine-comparison/info/`) — update wording if it describes the old two-type layout

## 4. Current Situation & Checklist

Planning approved by the user on 2026-07-19. WIP_DocsAndLegal dependency satisfied (merged in PRs #6/#7/#8/#9/#10).

Phase A — Vitest: ✅ **COMPLETE** (written by a Sonnet subagent, verified by the orchestrator)
- ✅ Vitest 4.1.10 installed + `vitest.config.ts` (node env, `@`→`src` alias) + `test` / `test:run` scripts
- ✅ 80 characterization tests across 9 files in `src/lib/calculator/__tests__/`, all passing — numeric expectations hand-derived from the formulas, not snapshotted
- ✅ `constants.test.ts` pins every cited chemistry constant, so an unsourced edit fails the suite
- ✅ `chlorine-comparison.test.ts` covers the exact worked example from `scripts/verify-logic.ts` — this is the parity baseline Phase B must reproduce
- ✅ **Net proven by mutation testing**, not just by being green. Four deliberate mutations were each caught, then reverted: SLAM ratio 0.4→0.5 (10 failures), comparison `<`→`<=` (1), sodium density 1.2→1.0 (3), breakpoint 10→8 (5)
- ✅ `tsc --noEmit` clean; lint adds zero new problems
- ✅ Calculator sources untouched — verified via `git diff`, so the baseline records real current behaviour

**Documented quirks** (deliberately pinned as current behaviour, NOT bugs — do not "fix" them without deciding to): `combinedCC: 0` is treated as "not provided"; a SLAM-vs-floor tie favours SLAM (reduce order); non-positive `density` falls back to `DEFAULT_SODIUM_DENSITY`. Also noted: the `floor` strategy is structurally unreachable in the CYA-unknown branch under current constants, since `0.4 × 30` already exceeds every colour floor.

Phase B — Refactor:
- ❌ Slot-based types + single metrics function + slot-based compare
- ❌ Tests updated/extended: same-type comparison, mixed comparison parity with baseline
- ❌ `ProductCard` UI + type selector; delete `CalciumCard`/`SodiumCard`
- ❌ Hook on `TOOL_KEYS.comparison` + legacy key migration (verify with old keys present in localStorage)
- ❌ API route + Zod schema updated; OpenAPI regenerated
- ❌ i18n keys updated (en + it)
- ❌ Docs updated (AGENTS.md, ARCHITECTURE.md, info page wording)

## 5. Success Criteria

- `npx vitest run` green: baseline tests prove mixed comparison gives identical numbers pre/post refactor; new tests cover same-type comparison (two sodiums, two calciums) with slot-identified winner.
- UI allows choosing the product type per slot; comparing two sodium hypochlorites (or two calcium ones) shows a meaningful winner.
- Old localStorage data migrates silently; reset wipes `ph_tool_comparison`.
- No dead files (`CalciumCard`/`SodiumCard` removed), no legacy keys written anymore.
- When done: archive this WIP to `changelog/YYYY-MM-DD_ChlorineComparisonRefactor.md`.
