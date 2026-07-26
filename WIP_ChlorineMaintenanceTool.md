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

## 6. Phase A Research (in progress)

> Working notes. Each question is answered and committed individually, in order, so partial progress survives a session cutoff. All candidate numbers from section 2 are treated as unverified until a question below confirms or corrects them.

### Q1 — Maintenance FC target as a function of CYA

**Answer: use `minFC = 0.075 × CYA` (7.5%) as the floor of the ideal range, with an absolute practical floor of 2 ppm FC regardless of how low CYA is. A reasonable "target" band is roughly `0.075×CYA` to `~0.12–0.15×CYA`, i.e. noticeably above the bare minimum, not a single point value.**

**Reasoning / sources:**
- TFP's Pool School states the widely-cited rule directly: for tablet/liquid-chlorinated pools, **minimum FC/CYA ratio is 7.5%**; for SWG pools TFP recommends a lower 5% minimum (the generator replenishes continuously, so it can run leaner). 7.5% is explained as "the level at which chlorine kills algae faster than it can reproduce" in an otherwise balanced pool. — [CYA Chlorine Relationship (TFP wiki, via search)](https://www.troublefreepool.com/wiki/index.php?title=CYA_Chlorine_Relationship), [Chlorine/CYA chart vs 7.5% of CYA (TFP thread)](https://www.troublefreepool.com/threads/chlorine-cya-chart-vs-7-5-of-cya.184210/) — note: TFP's own site returns HTTP 403 to automated fetches, so these are read via search-engine snippets/summaries of the TFP page, not a direct fetch of the primary page. Treat as "very likely accurate, not independently re-verified word-for-word."
- Orenda Technologies independently corroborates the same figure without referencing TFP: "If you maintain a free chlorine to cyanuric acid ratio (FC:CYA) of 0.075:1 ppm, chlorine should be able to stay ahead of algae" — [Chlorine, pH and Cyanuric Acid Relationships](https://blog.orendatech.com/chlorine-ph-and-cya-relationships). Two independent authorities converging on 7.5% is reasonably strong evidence the ratio itself is solid.
- TFP's actual published FC/CYA table is **not perfectly linear at 7.5%** — it's derived from constant-%HOCl equivalence, not a flat multiplier. Reconstructed table values (via search snippets, unverified against the primary source):

  | CYA (ppm) | Min FC (TFP table) | 7.5%×CYA (linear approx.) | Target FC (TFP table) |
  |---|---|---|---|
  | 0 | ~0.07 (practically: use floor, see below) | 0 | ~0.11 (practically: use floor) |
  | 10 | 0.81 | 0.75 | 1.21 |
  | 20 | 1.51 | 1.5 | 2.4 |
  | 30 | 2.2 | 2.25 | 3.5 |
  | 40 | 2.9 | 3.0 | 4.6 |
  | 50 | 3.75* | 3.75 | 5–7* |
  | 80 | 6* | 6.0 | 7–9* |

  (*Rows for 50/80 come from a second, coarser aggregator table — [PoolChemTracker FC/CYA chart](https://www.poolchemtracker.com/blog/fc-cya-chart-chlorine-levels) — that is internally consistent with 7.5%/target-band framing but is a third-party reproduction, not the primary TFP table; the two sources agree closely at 30/40 ppm CYA where they overlap.) **The 7.5% linear rule is an excellent practical approximation of the real (slightly curved) TFP table across the 20–50 ppm CYA band this tool actually targets** — the two diverge more at very low CYA, which is exactly where the absolute floor below takes over.
- **Absolute floor.** TFP explicitly does not recommend using the raw 7.5% formula at very low CYA: "with little or no CYA, 2 to 4 ppm free chlorine is the target" (via search summary of TFP guidance) — because sub-1-ppm FC targets are impractical to test/maintain and unstabilized chlorine at any level degrades in hours of sun. Independently, the **CDC Model Aquatic Health Code** sets a flat minimum FAC of **1.0 ppm for venues not using CYA and 2.0 ppm for venues using CYA** — no continuous CYA scaling at all, just a step function — [CDC Healthy Swimming / MAHC, via search summary](https://www.cdc.gov/healthy-swimming/about/home-pool-and-hot-tub-water-treatment-and-testing.html). These two independent sources bracket the same idea: **a floor around 2 ppm FC is the right absolute minimum** to encode, below the point where `0.075×CYA` alone would produce an impractically small number.
- **Reconciling with `testo.md`'s classic "1-3 ppm" advice.** That range is the old CYA-agnostic industry rule of thumb (matches the CDC's flat ≥1 ppm floor reasonably well at the low end). It is a fine approximation exactly in the CYA band the owner has historically run (30-50 ppm): 7.5%×30=2.25, 7.5%×50=3.75 — both land inside or just above "1-3". It **breaks down** as CYA rises toward/past `CYA_HIGH_THRESHOLD` (100): 7.5%×100=7.5 ppm, more than double the top of the classic range — at that point "1-3 ppm" is dangerously low and chlorine will not keep ahead of algae even though the pool "shows" chlorine on a basic test strip. This is the mechanism (see Q6) behind the owner's chlorine-lock experience: they were dosing to the classic 1-3 ppm range while CYA had silently drifted up from repeated dichlor use, so the same FC number that used to be enough stopped being enough.
- **Recommendation for the model:** `idealFC.min = max(0.075 × CYA, 2)` ppm, `idealFC.max` = something above that floor (candidate: `0.12–0.15 × CYA`, or reuse the existing target-band shape from the table above) — **not settled to a specific multiplier; flagged as an open question below** since Phase A could not pull the primary TFP table verbatim (403) to pin the exact target-band formula, only its shape via secondary sources.

**Confidence:** The 7.5% minimum ratio is solid (two independent primary-ish sources agree, TFP's own table is consistent with it in the 20-50 ppm band). The ~2 ppm absolute floor is solid (CDC MAHC + TFP low-CYA guidance agree). The exact "target" (not just minimum) multiplier is **uncertain** — secondary sources gave inconsistent bands (12% at low CYA rising toward ~15-18% at higher CYA in the table above) and TFP's primary wiki page could not be fetched directly to confirm the canonical formula.

### Q2 — CYA added per ppm of FC (trichlor / dichlor)

**Answer: trichlor ≈ 0.6 ppm CYA per ppm FC added; dichlor ≈ 0.9 ppm CYA per ppm FC added. Both candidates confirmed, by independent stoichiometric derivation AND by citation.**

**Stoichiometric derivation (same method as the existing `hardnessPerPpm`/`saltPerPpm` comment block in `constants.ts`, so a reader can check it the same way):**

The pool-industry convention defines "1 ppm of available/free chlorine" as 1 mg/L measured in **Cl₂-equivalent oxidizing power**. Cl₂ (MW 70.906 g/mol) hydrolyzes as `Cl₂ + H₂O → HOCl + HCl`, releasing one HOCl per Cl₂. An isocyanurate N–Cl bond hydrolyzes the same way per bond (`R₂N–Cl + H₂O → R₂N–H + HOCl`), so **each active N–Cl group is chemically equivalent to one whole Cl₂ molecule (70.906 g) of available chlorine** — this is the standard industry definition used to rate "% available chlorine" on every chlorine product label, and it is what makes the arithmetic below checkable against any datasheet's stated %.

*Trichlor = trichloroisocyanuric acid (TCCA), C₃Cl₃N₃O₃:*
- Molar mass: 3×12.011 (C) + 3×35.453 (Cl) + 3×14.007 (N) + 3×15.999 (O) = 36.03 + 106.36 + 42.02 + 48.00 = **232.41 g/mol**.
- 3 active N–Cl groups → available chlorine mass = 3 × 70.906 = **212.72 g per mole**.
- % available chlorine = 212.72 / 232.41 = **91.5%** — matches the commercial trichlor tablet spec of "≥90% available chlorine" almost exactly. [ICC / AQUA Magazine, "Trichlor: The Dependable Pool Performer"](https://www.iccsafe.org/building-safety-journal/bsj-technical/trichlor-the-dependable-pool-performer-2/): "contain at least 0.90 pounds of available chlorine per pound of product... the label indicates the product contains 90 percent available chlorine."
- 1 mole TCCA also releases 1 mole cyanuric acid (C₃H₃N₃O₃, MW = 3×12.011+3×1.008+3×14.007+3×15.999 = 36.03+3.02+42.02+48.00 = **129.07 g/mol**).
- **CYA added per unit of available chlorine (≈ ppm FC) = 129.07 / 212.72 = 0.6068 ≈ 0.6.** ✅ matches candidate.
- Cited directly (not just derived) by the industry standards body: **PHTA** states trichlor "adds 0.6 ppm of cyanuric acid... for each ppm of available chlorine added" — [PHTA, "Trichlor: The Dependable Pool Performer" fact sheet](https://www.phta.org/pub/?id=5455e441-1866-daac-99fb-87202d0dada9) (also reproduced at [AQUA Magazine](https://www.aquamagazine.com/service/article/15121898/trichlor-the-dependable-pool-performer) and [ICC](https://www.iccsafe.org/building-safety-journal/bsj-technical/trichlor-the-dependable-pool-performer-2/)). Two independent methods (theory + published industry figure) agree to 3 significant figures.

*Dichlor = sodium dichloroisocyanurate dihydrate (SDIC·2H₂O), C₃Cl₂N₃NaO₃·2H₂O — this is the commercial "granular dichlor" pool owners actually buy:*
- Molar mass: C₃Cl₂N₃NaO₃ (36.03 + 70.91 + 42.02 + 22.99 + 48.00 = 219.95) + 2×H₂O (2×18.015=36.03) = **255.98 g/mol**. — [Wikipedia, Sodium dichloroisocyanurate dihydrate](https://en.wikipedia.org/wiki/Sodium_dichloroisocyanurate_dihydrate) (MW cross-checked, formula confirmed).
- 2 active N–Cl groups → available chlorine mass = 2 × 70.906 = **141.81 g per mole**.
- % available chlorine = 141.81 / 255.98 = **55.4%** — matches the commercial dichlor spec of "56% available chlorine" (dihydrate form) cited on multiple retail datasheets, e.g. [In The Swim Sodium Dichlor product listing](https://www.amazon.com/Swim-Granular-Pool-Chlorine-lbs/dp/B002WKQ23A): "56% Available Chlorine, 99% Sodium-Dichlor."
- 1 mole SDIC·2H₂O also releases 1 mole cyanuric acid (129.07 g/mol, same CYA as above — hydration water doesn't affect this).
- **CYA added per unit of available chlorine (≈ ppm FC) = 129.07 / 141.81 = 0.9101 ≈ 0.91.** ✅ matches candidate (0.9).
- Note: the *anhydrous* SDIC form (no water of crystallization, MW 219.95) would compute to 141.81/219.95 = 64.5% available chlorine (commercially marketed as "~62% dichlor") — **a higher available-chlorine % than the dihydrate**, but the **same CYA-per-ppm-FC ratio (0.91)**, because the hydration water is inert mass that dilutes the % concentration without changing the CYA:Cl₂ molar relationship. This matters for Phase B: `cyaPerPpm` for dichlor should be ~0.9 regardless of which hydrate form is assumed; only the product's `%availableChlorine` (dose-mass conversion) depends on hydration.

**Typical commercial strengths (for Phase B's `PRODUCT_COEFFICIENTS`/dose conversion, gathered from datasheets/retail specs):**
- Trichlor: tablets/sticks, **~90% available chlorine** (highest of any solid pool chlorine except gas). [ICC/AQUA Magazine](https://www.iccsafe.org/building-safety-journal/bsj-technical/trichlor-the-dependable-pool-performer-2/).
- Dichlor: granular, **~56% available chlorine** (dihydrate, the common retail product) — some anhydrous/higher-purity grades marketed near 62-63%; **uncertain** which is more common in Italian retail (not verified — flagged below).

**pH effect (for the `pHEffect` field):**
- Trichlor: strongly acidic in solution (dissolved pH ≈ 2.8–3.0); consistently lowers pool pH **and** total alkalinity (its acidity consumes bicarbonate). Recommend `pHEffect: 'down'`. — search-aggregated from multiple retail/technical sources; not yet cross-checked against a single primary datasheet with a direct quote (**uncertain / worth a direct SDS pull in Phase B**).
- Dichlor: near-neutral in solution (dissolved pH ≈ 6.0–7.0); "will slightly reduce pH... but will not have a noticeable impact on total alkalinity." Recommend `pHEffect: 'neutral'` (closest fit to the existing `'up' | 'down' | 'neutral'` enum, since dichlor's effect is explicitly described as not noticeable in practice, unlike trichlor's clearly-down effect). — same caveat as above.

**Confidence:** The 0.6 / 0.9 CYA-per-ppm-FC coefficients are **high confidence** — independently derived from first-principles stoichiometry using standard, checkable molar masses, and matching a named industry-standards citation (PHTA) for trichlor to 1 decimal place. The %available-chlorine product-strength figures are **high confidence** for trichlor (90%, converges from theory + citation) and **medium confidence** for dichlor (55-56% from theory + retail listings, but not a manufacturer SDS in hand). The `pHEffect` classification is **medium confidence** (directionally certain, magnitude and "which enum bucket" not confirmed against a primary SDS).

### Q3 — Typical daily FC consumption (projection driver)

*(pending)*

### Q4 — CYA ranges reconciliation (ideal vs `CYA_UNKNOWN_RANGE` vs `CYA_HIGH_THRESHOLD`)

*(pending)*

### Q5 — Verify live disclaimer claim: salt-water CYA "70-80 ppm"

*(pending)*

### Q6 — Chlorine lock: real mechanism or misnomer?

*(pending)*

### Open questions for the owner

*(pending — filled in after all questions above are answered)*
