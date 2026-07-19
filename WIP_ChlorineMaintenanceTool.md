# WIP: Chlorine Maintenance Tool (research → model → tool)

## 1. Initial State

- The calculator models only **unstabilized** products: `PRODUCT_COEFFICIENTS` in `src/lib/calculator/constants.ts` has `sodium_hypochlorite` and `calcium_hypochlorite`, both with `cyaPerPpm: 0`. **Trichlor and dichlor — the products that raise CYA — do not exist in the model**, yet they are the entire reason for the "CYA contraindication" feature.
- `chlorine-target.ts` computes **shock** targets only (SLAM 40% × CYA, breakpoint 10 × CC, color floors). There is no *maintenance* FC target primitive.
- The user's documented real-world pain (`testo.md`, "Stabilizzante"): every year, dichlor-based shocking silently accumulated CYA until chlorine stopped working ("chlorine lock"), fixable only by partial drain. This tool exists to prevent exactly that.
- Existing conventions this WIP must follow: every chemistry number lives in `constants.ts` **with an inline source citation**; calculators return numbers/codes only (i18n stays in the UI); each primitive gets a thin API route; new tools follow the **`add-pool-tool` project skill** (`.claude/skills/add-pool-tool/`) — invoke it before writing tool code.

## 2. Objective

Build `/tools/chlorine-maintenance`: given pool volume, CYA, and the chlorine product used for routine chlorination, tell the user (a) the ideal FC range, (b) the dose to stay in it, (c) stabilized-product contraindications, and (d) a **CYA accumulation projection over time** ("with dichlor, your CYA rises ~X ppm/week; in N weeks chlorine stops working"). Scope agreed with the user (2026-07-19): full version (target + dose + projection).

### Phase A — Documented research (BLOCKING: user validates before any code)
Research with cited sources (candidates: TFP wiki, Orenda blog, PoolMath docs, CDC Healthy Swimming / PHTA, trichlor & dichlor product datasheets). Deliverable: a research summary appended to this WIP (section 4), reviewed and approved by the user. Questions to answer — all candidate numbers below are **TO VERIFY, not facts**:
- **Maintenance FC target as a function of CYA** (candidate: TFP ~7.5% of CYA with an absolute minimum floor; reconcile with the classic 1–3 ppm advice in `testo.md`).
- **CYA added per ppm of FC** for trichlor (candidate ≈ 0.6) and dichlor (candidate ≈ 0.9) — stoichiometric verification like the existing salt/hardness coefficients.
- **Typical daily FC consumption** for the projection (candidate 2–4 ppm/day in summer; factors: sun, heat, bather load — decide what the projection assumes and states).
- **CYA ranges**: ideal = 30–50 ppm for manually chlorinated pools (user experience, matches TFP; salt pools are OUT OF SCOPE, already noted in the disclaimer plan). Decide the relationship with the existing `CYA_UNKNOWN_RANGE` (30–80): "unknown" describes what is *plausibly in the water* (can exceed 100 after years of dichlor), the ideal range is where you *want to be* — likely a new constant, not a change to the existing one. Also decide whether trichlor/dichlor warnings key off `CYA_HIGH_THRESHOLD` (100) or the ideal range's ceiling.
- **⚠️ VERIFY**: `src/messages/{en,it}.json` → `Disclaimer.sections.scope.p1` currently states salt-water pools need CYA "roughly 70-80 ppm". This came from the user's recollection, not a checked source — confirm it during Phase A research; correct the disclaimer copy (both locales) if the real figure differs.

### Phase B — Model extension (`src/lib/calculator/`)
- Extend `ProductId` with `trichlor` and `dichlor`; add their `PRODUCT_COEFFICIENTS` (cyaPerPpm, pH effect, typical strengths) with inline citations from Phase A.
- New primitive `maintenance-target.ts`: CYA → ideal FC range (uses `RangeOrValue`), with warning codes (e.g. `CYA_ABOVE_IDEAL`, `CYA_LOCK_RISK`, reuse `CYA_HIGH`).
- New pure function for the **CYA projection**: (product, assumed FC/day, weeks) → CYA over time + weeks-until-threshold.
- Unit tests for both (Vitest from WIP_ChlorineComparisonRefactor Phase A).

### Phase C — Tool, API, docs
- **Invoke the `add-pool-tool` skill** and follow its recipe: pure lib → public API → i18n → hook → components → page → nav → docs.
- API route `POST /api/v1/calculate/chlorine-maintenance` with Zod schema (infra from WIP_DocsAndLegal Phase 3) → OpenAPI regenerates.
- UI at `/[locale]/tools/chlorine-maintenance`: inputs (volume via shared `ph_pool_*` state, CYA, product picker incl. trichlor/dichlor, optional current FC), outputs (FC range, dose, warnings, projection table/mini-chart). Persist via `TOOL_KEYS` + shared keys convention.
- Info page (shared toolkit) explaining FC/CYA relationship, chlorine lock, why stabilized products are fine in moderation but dangerous as a habit — the user's own story is the narrative hook; full sources list.
- Nav item in `src/config/nav-items.ts` (+ menu image like the other tools), i18n in `en.json` + `it.json` (no em dashes in Italian values).
- Salt-water out-of-scope note on the tool and info page.

### Constraints
- **Dependencies**: WIP_DocsAndLegal Phase 3 (Zod/OpenAPI infra) and WIP_ChlorineComparisonRefactor Phase A (Vitest). Ideally also Phase B of the refactor, so the product model is already generic.
- Phase A is a hard gate: no constants, no code before the user approves the research summary.
- Do **not** run `npm run dev` / `npm run build`; `npx vitest run` is fine.
- New worktree based off `main` once prerequisites merge.

## 3. Target Files

Phase B:
- `src/lib/calculator/constants.ts` (new products + coefficients + ideal-CYA constant, all cited)
- `src/lib/calculator/types.ts` (ProductId, new warning codes, result types)
- `src/lib/calculator/maintenance-target.ts` (new)
- `src/lib/calculator/cya-projection.ts` (new; or folded into maintenance-target — decide at implementation)
- `src/lib/calculator/index.ts` (re-exports)
- `src/lib/calculator/__tests__/` (tests)
- `src/lib/calculator/AGENTS.md` (document new primitives)

Phase C (per `add-pool-tool` recipe):
- `src/lib/api/` (Zod schema)
- `src/app/api/v1/calculate/chlorine-maintenance/route.ts` (new)
- `src/hooks/use-chlorine-maintenance.ts` (new)
- `src/components/tools/chlorine-maintenance/*` (new)
- `src/app/[locale]/tools/chlorine-maintenance/page.tsx` + `info/page.tsx` (new)
- `src/lib/shared-state.ts` (TOOL_KEYS entry)
- `src/config/nav-items.ts` + `public/images/` (nav item + image)
- `src/messages/en.json`, `src/messages/it.json`
- `ARCHITECTURE.md` (§4.4–4.6 updates)

## 4. Current Situation & Checklist

Planning approved by the user on 2026-07-19. No research done yet, no code written. Blocked-by: WIP_DocsAndLegal Phase 3, WIP_ChlorineComparisonRefactor Phase A.

Phase A — Research (gate):
- ❌ Maintenance FC/CYA relationship researched + cited
- ❌ Trichlor/dichlor CYA coefficients verified (stoichiometry + datasheets)
- ❌ Daily FC consumption assumption for projection defined
- ❌ Ideal-CYA vs unknown-range vs high-threshold reconciliation decided
- ❌ Research summary appended below and **approved by the user**

*(Research summary will be appended here.)*

Phase B — Model:
- ❌ Constants + types extended (cited)
- ❌ `maintenance-target` primitive + tests
- ❌ CYA projection function + tests

Phase C — Tool:
- ❌ `add-pool-tool` skill invoked, recipe followed end to end
- ❌ API route + Zod schema + OpenAPI regenerated
- ❌ Tool UI (target, dose, warnings, projection) + shared-state wiring
- ❌ Info page + sources
- ❌ Nav + image + i18n (en + it)
- ❌ ARCHITECTURE.md / AGENTS.md updates

## 5. Success Criteria

- Research summary with citations approved by the user before any constant landed in code.
- With CYA and product selected, the tool shows: ideal FC range, dose for this pool volume, stabilized-product warning when applicable, and a projection answering "when does my CYA leave the ideal range if I keep using this product?" — the user's dichlor story, prevented by software.
- All new numbers live in `constants.ts` with inline citations; calculator stays i18n-free; tests green.
- Endpoint documented automatically in `/docs/api`; both locales complete; salt-water scope note present.
- When done: archive this WIP to `changelog/YYYY-MM-DD_ChlorineMaintenanceTool.md`.
