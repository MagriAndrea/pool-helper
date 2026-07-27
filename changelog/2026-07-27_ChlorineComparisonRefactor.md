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

Phase B — Refactor: ✅ **COMPLETE**
- ✅ Slot-based types (`ComparisonProductInput`/`ComparisonProductMetrics`/`ComparisonSlotId`, moved into `types.ts` with the other primitives' types) + single `calculateProductMetrics` + `compareProducts` returning `winner: 'A' | 'B' | 'DRAW' | null`
- ✅ **Parity proven exactly, not approximately**: the pre-refactor worked example now asserts `toBe(1.7399267399267409)` — bit-for-bit identical, because the arithmetic order was preserved
- ✅ Tests extended to 21 in that file (96 total): two-sodiums, two-calciums, "cheap bulk pack loses to concentrated one", solid-priced-by-the-litre, per-product density fallback, label-density-beats-typical
- ✅ **Net re-proven by mutation testing** (8 mutations, each applied then reverted): `<`→`<=` (1 failure), dropped solid-in-litres guard (1), swapped winner labels (1), migration reading `quantity` instead of the old `weight` (1), dropped already-migrated guard (1), migration not deleting legacy keys (1), `PRODUCT_IDS` losing a product (1). One mutation **survived at first** — "ignore the label density, always use the typical one" — because every test happened to pass 1.2, which *is* the typical density; a test with 1.35 closed the hole and the mutation is now caught
- ✅ Generic `ProductCard` with a product `Select` + slot-keyed accent; `CalciumCard`/`SodiumCard` deleted. The card now calls `calculateProductMetrics` instead of re-deriving the math inline, so what it shows cannot drift from what the API returns
- ✅ Hook on `TOOL_KEYS.comparison` with a one-shot `migrate` (new optional `useToolState` param, running inside the hydration effect — the only point where a rewrite is still visible to that render). Legacy keys registered in a new `LEGACY_KEYS` map and deleted after conversion
- ✅ API route + Zod schema on `{ slotA, slotB }`; OpenAPI request schema regenerates from Zod, examples and both-locale prose updated
- ✅ i18n: `Labels`/`Verdict` moved to slot wording, new `Info.slots` section, en/it at 398 keys each, zero em/en dashes in Italian
- ✅ Docs updated: `ARCHITECTURE.md` (§4.3 persistence + migrations, §4.4 slot model, §4.5 endpoint body), `src/lib/calculator/AGENTS.md` (new rules #7 adding-a-product and #8 slot-keyed), `src/lib/api/AGENTS.md` (rule 7), `src/hooks/AGENTS.md`, root `AGENTS.md` (lint baseline), and the `add-pool-tool` skill

**Beyond the original scope, deliberately** (all reported to the user):
- A shared top-level `Products` i18n namespace keyed by `ProductId` now holds the product names. The Shock tool was migrated onto it and its duplicate `Result.calciumName`/`sodiumName` keys deleted, so product names have exactly one source. WIP 3 gets trichlor/dichlor names for free by adding two keys.
- `PRODUCT_RETAIL_FORMS` + `PRODUCT_IDS` added to `constants.ts` (no new uncited numbers — the retail hints reuse `DEFAULT_CALCIUM_PCT` / `DEFAULT_SODIUM_TRADE_PCT` / `DEFAULT_SODIUM_DENSITY`, and a test asserts they do).
- `src/hooks/use-local-storage.ts` **deleted**: the comparison hook was its last consumer, so the refactor orphaned it. Lint debt therefore dropped from 4 errors / 2 warnings to 3 / 1; the baseline note in `AGENTS.md` was updated so the next agent is not misled.
- `scripts/verify-logic.ts` **deleted**: a hand-rolled console-log check of the exact example the Vitest suite now pins, importing an API that no longer exists.

**Not verified by me**: anything visual. The product `Select`, the slot badges, the reset button and the verdict banner were never rendered in a browser — the human needs to look, including dark mode and mobile.

## 5. Success Criteria

- `npx vitest run` green: baseline tests prove mixed comparison gives identical numbers pre/post refactor; new tests cover same-type comparison (two sodiums, two calciums) with slot-identified winner.
- UI allows choosing the product type per slot; comparing two sodium hypochlorites (or two calcium ones) shows a meaningful winner.
- Old localStorage data migrates silently; reset wipes `ph_tool_comparison`.
- No dead files (`CalciumCard`/`SodiumCard` removed), no legacy keys written anymore.
- When done: archive this WIP to `changelog/YYYY-MM-DD_ChlorineComparisonRefactor.md`.
