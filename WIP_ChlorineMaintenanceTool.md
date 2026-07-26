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

Planning approved by the user on 2026-07-19. Phase A research completed and documented in section 6 below; no code written yet (Phase A is a hard gate). Blocked-by: WIP_DocsAndLegal Phase 3, WIP_ChlorineComparisonRefactor Phase A.

Phase A — Research (gate):
- ✅ Maintenance FC/CYA relationship researched + cited (Q1)
- ✅ Trichlor/dichlor CYA coefficients verified (stoichiometry + datasheets) (Q2)
- ✅ Daily FC consumption assumption for projection defined (Q3)
- ✅ Ideal-CYA vs unknown-range vs high-threshold reconciliation decided (Q4)
- ✅ Research summary appended below and **APPROVED BY THE USER on 2026-07-26** (after the orchestrator verification pass in section 7). **The Phase A gate is now open: Phase B may write code.**

*(See section 6 for the full research summary, including Q5 — the salt-water CYA disclaimer verification — and Q6 — the chlorine-lock mechanism. Section 7 is the primary-source verification pass and CORRECTS section 6 in three places: read it before using any number from section 6.)*

### Decisions the user made when approving (2026-07-26)

1. **The CYA projection SUBTRACTS degradation.** Chosen over the simpler accumulation-only worst case. So the projection is a net balance: `CYA(t) = CYA₀ + (accumulation from the product) − (sunlight degradation)`. Degradation is the 2-10 ppm/month figure from section 7 (TFP's CYA page); Phase B must pick and cite a default within that range, expose the assumption on screen, and handle the case where degradation ≥ accumulation (an unstabilized product, or light dichlor use, means CYA never reaches the ceiling — the tool must say "at this rate your CYA is stable / falling", not divide by zero or project a nonsense date).
2. **Daily FC consumption: 3 ppm/day as the default, but the field is user-editable** — because the user can measure their own (test FC, add nothing, retest 24 h later; the difference is the real consumption). Phase B should say exactly that next to the field, so the number can graduate from a generic assumption to the user's own measurement. Pending final confirmation from the user, who asked what this parameter meant before deciding.
3. **The salt-water disclaimer stays as it is** (70-80 ppm), per section 7: it is TFP-sourced and correct. Section 6's proposed "50-80" rewrite is rejected — no `it.json`/`en.json` change needed.

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

## 6. Phase A Research (complete, pending user approval)

> All six research questions (Q1-Q6) are answered below with cited sources. Every candidate number from section 2 was checked against at least one source; most against two or more independent sources. Confidence levels and open gaps are stated explicitly per question rather than smoothed over — see "Open questions for the owner" at the end. **This section is a research deliverable, not yet an approval**: per section 4's checklist, the final gate ("approved by the user") is still open.

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

**Answer: candidate 2-4 ppm/day is supported. Recommend a conservative single default of ~3 ppm/day for the projection (mid-range, summer/sunny assumption), but the tool MUST tell the user this is a rough planning estimate, not a substitute for testing — daily loss varies enormously by pool.**

**What drives it, in rough order of importance for a typical outdoor residential pool:**
1. **UV/sunlight** — the dominant factor. Unstabilized chlorine loses up to ~75-90% in 2 hours of direct sun; this is precisely why CYA exists. — [search-aggregated from TFP CYA wiki summaries](https://www.troublefreepool.com/wiki/index.php?title=CYA).
2. **CYA level itself** — counterintuitively, *raising* CYA *reduces* daily UV-driven ppm loss (that's its entire purpose): "CYA keeps chlorine in the water roughly eight times longer... a pool with CYA of 60 will use less chlorine daily than a pool at CYA of 30" (search-aggregated, TFP). This means a single flat ppm/day default is an approximation that technically should decrease somewhat as CYA rises — **but** the CYA-maintenance tool's whole point is to flag CYA *rising toward/past the ideal ceiling*, at which point the pool is also losing the disinfection benefit (see Q1/Q6), so treating the daily-loss assumption as roughly CYA-independent within the 30-50 ppm "ideal" band is a reasonable simplification, and should be stated as such.
3. **Temperature/heat** — heat accelerates both organic (algae/bacteria) growth, raising chlorine demand, and evaporation. `testo.md`'s own "Circolazione" section already notes summer needs roughly double the pump run-time of winter for the same reason (heat-driven demand).
4. **Bather load** — real but secondary for a typical residential pool: roughly 4 g chlorine demand per bather-hour, which for a 10,000-gallon (~38,000 L) pool is about **0.1 ppm FC per bather-hour** — "very minor... unless you have a large pool party" (search-aggregated, TFP chlorine-loss-calculator blog). Only becomes significant with heavy/prolonged bather traffic.
5. **Baseline organic demand** — TFP's own chlorine-loss calculator describes "1-1.5 ppm/day... typical for a clean pool's measured organic demand" as the idle/no-bather, non-peak-sun baseline; this is a *floor*, not the summer figure.
6. **Combined summer estimate** — "the average pool in most areas will lose 2-4 ppm FC per day" in season, with "more sun and bather load resulting in higher usage." — [TFP "How Much Chlorine Does Your Pool Lose Per Day? FC Demand Calculator"](https://www.troublefreepool.com/blog/2026/07/06/chlorine-loss-calculator/) (title/summary via search; TFP's own site 403s to direct fetch, so this is read via search-engine summary, not independently re-verified against the primary page text).

**Recommended default and required caveats:**
- Use **3 ppm/day** as the single conservative default for the projection (middle of the cited 2-4 ppm/day summer range) — conservative in the sense of erring toward "CYA rises to the ceiling sooner than the user might expect," which matches the tool's prevention goal (better to warn early than late).
- The tool **must** explicitly tell the user: (a) this is a rough planning assumption, not measured from their pool; (b) actual daily loss depends on sun exposure, bather load, temperature, and pool cover, and can reasonably range roughly 1-5+ ppm/day; (c) the projection is only meant to answer "roughly how many weeks/months until CYA leaves the ideal range if I keep dosing this product this way," not to replace regular FC/CYA testing; (d) users should re-run the projection after they actually test CYA, since the projection's chlorine-demand assumption compounds error over many weeks.

**Confidence:** The 2-4 ppm/day summer range is **medium confidence** — cited consistently across TFP-derived sources, consistent with the separately-cited 1-1.5 ppm/day baseline + sun/heat/bather additions, but ultimately traceable to community/forum consensus rather than a single peer-reviewed figure; no CDC/PHTA numeric daily-loss figure was found (they set FC *minimums*, not consumption *rates*). Treat the 3 ppm/day default as a **defensible planning assumption**, explicitly disclosed as such, not a "fact."

### Q4 — CYA ranges reconciliation (ideal vs `CYA_UNKNOWN_RANGE` vs `CYA_HIGH_THRESHOLD`)

**Answer: add a NEW constant `CYA_IDEAL_RANGE = { min: 30, max: 50 }` (do not touch `CYA_UNKNOWN_RANGE` or `CYA_HIGH_THRESHOLD`). Key the maintenance tool's early/soft warning off the new ideal range's ceiling (50), and reuse the existing `CYA_HIGH_THRESHOLD` (100) / `CYA_HIGH` code for the severe/dilution-recommended warning — a two-tier system.**

**Reasoning:**
- **30-50 ppm is independently confirmed by three separate source types**, which is unusually strong agreement for pool chemistry:
  1. The owner's own field notes (`testo.md`, "Stabilizzante"): "Il valore dell'acido cianurico deve stare tra 30 e 50 ppm" — exactly 30-50.
  2. **PHTA/APSP-11** (ANSI-recognized industry standard, the closest thing pool chemistry has to a formal standard): "ideal range between 30-50 ppm," maximum 100 ppm — [PHTA APSP-11 Cyanuric Acid Fact Sheet, via search summary](https://www.phta.org/pub/?id=0838089d-1866-daac-99fb-d64ee07ea13f) (attempted a direct fetch of this PDF; the extraction tool could not reliably pull text from it, so this is via search-engine summary of the standard, not a verbatim primary quote — **flagged as not fully independently verified**, though the 30-50/100 figures recur consistently across multiple secondary citations of APSP-11).
  3. TFP's practical range for liquid/tablet-chlorinated pools is usually cited as "30-50" or sometimes "30-60" depending on the specific TFP page (see disagreement note below).
  - This convergence is exactly why **100** is already `CYA_HIGH_THRESHOLD` in the codebase (it equals PHTA's hard max) — Q4 doesn't change that, it just adds the *lower*, "where you want to be" band underneath it.
- **Sources disagree on the exact ceiling** — reported honestly rather than picked silently:
  - TFP: some pages say up to 40-50 ppm for tablets/liquid, others extend the "practical target range" to 60 ppm.
  - **Orenda is more conservative than everyone else**: recommends "30 ppm and below" as ideal, and "not exceeding 50 ppm" as a hard residential ceiling — i.e., Orenda's *ceiling* (50) matches the consensus ideal-range ceiling, but Orenda's *ideal target* is the *bottom* of what TFP/PHTA/the owner call the ideal band. Orenda's philosophy is explicitly "minimal CYA" (title of their own article: "Minimal CYA | Pillar 4").
  - Given this spread, **30-50 ppm as the constant's range is the safe, well-corroborated choice**: it's the owner's own number, matches the ANSI-adjacent standard, sits within every TFP citation found, and its ceiling matches Orenda's hard cap. It intentionally does *not* adopt TFP's looser "up to 60" reading, since that isn't independently corroborated and 50 is the figure with the broadest agreement.
- **Relationship between the three constants (recommended, none of the existing two change value):**
  - `CYA_UNKNOWN_RANGE = { min: 30, max: 80 }` — unchanged. This describes what's *plausibly already in the water* when the user doesn't know their CYA (a distribution/prior, used as a fallback input), not a target. Correctly stays wider than "ideal" since real pools — including, demonstrably, the owner's own — drift above 50 for years via repeated dichlor shocking.
  - **NEW** `CYA_IDEAL_RANGE = { min: 30, max: 50 }` — where the maintenance tool tells the user they *want* to be. Used only by the new `maintenance-target` primitive, not by the existing shock calculator.
  - `CYA_HIGH_THRESHOLD = 100` — unchanged. Stays the hard "TFP recommends dilution" ceiling shared with the existing shock tool, and happens to equal PHTA's own stated maximum, which is a nice independent cross-check that the existing constant was already right.
- **Should trichlor/dichlor warnings key off `CYA_HIGH_THRESHOLD` (100) or the ideal range's ceiling (50)? Recommend both, as two tiers, not an either/or:**
  - **Soft/early warning** (new code, e.g. `CYA_ABOVE_IDEAL`) fires once CYA > `CYA_IDEAL_RANGE.max` (50). This is the tool's *entire reason to exist* — the owner's dichlor problem was invisible for years precisely because nothing flagged CYA climbing past 50 while it was still well under the old shock-tool's 100 threshold. A tool that only warns at 100 would reproduce the exact failure mode `testo.md` describes.
  - **Severe warning** (reuse existing `CYA_HIGH` code) fires at `CYA_HIGH_THRESHOLD` (100), same semantics as today's shock tool: dilution strongly recommended, stabilized products should stop entirely. Reusing the code (rather than inventing a second "high" concept) keeps the two tools' vocabulary consistent, per `AGENTS.md`'s general preference for not introducing parallel naming for the same underlying idea.
  - A third, narrower warning code the WIP already anticipated, `CYA_LOCK_RISK`, is a reasonable name for "you are using a stabilized product (trichlor/dichlor) AND CYA is already above ideal" — i.e., a *product-choice*-aware warning distinct from a pure CYA-level warning. Recommend keeping it as a separate code from `CYA_ABOVE_IDEAL` (which could equally apply to a pool that got there via imported tap-water CYA or over-shocking with dichlor even once), since `CYA_LOCK_RISK` is specifically actionable ("switch products"), whereas `CYA_ABOVE_IDEAL` is not necessarily.

**Confidence:** High confidence that 30-50 is the right ideal-range constant (three independent-ish sources converge). Medium confidence on the exact PHTA maximum text (search-summary only, PDF text extraction failed — worth a follow-up direct read in Phase B if the exact standard wording needs to be quoted publicly). High confidence on the two-tier warning design as sound *product* reasoning, though it is a recommendation for Phase B to implement, not a fact to verify.

### Q5 — Verify live disclaimer claim: salt-water CYA "70-80 ppm"

**Answer: the DIRECTION of the claim is correct and well-supported (SWG pools do typically run higher CYA than manually-chlorinated pools). The specific "70-80 ppm" figure is real and citable, but it is only one point within a genuinely wide spread across manufacturers — sources disagree by a factor of ~2-3x on the low end. Recommend widening the disclaimer's range rather than treating 70-80 as settled fact. Not edited (per instructions); proposed replacement text below for the owner to approve separately.**

**Current live text (quoted exactly):**
- EN (`src/messages/en.json` → `Disclaimer.sections.scope.p1`): *"This site's chlorine and stabilizer (CYA) guidance is meant for pools maintained with manually dosed chlorine (tablets, granules, liquid). Saltwater pools (salt chlorine generators) need a higher CYA range (roughly 70-80 ppm) and are outside the scope of this guide — if you have a salt generator, these tools aren't for you."*
- IT (`src/messages/it.json` → `Disclaimer.sections.scope.p1`): *"Le indicazioni su cloro e stabilizzante (CYA) di questo sito sono pensate per piscine mantenute con cloro dosato manualmente (pastiglie, granuli, liquido). Le piscine con elettrolisi salina (generatore di cloro a sale) richiedono un range di CYA più alto (indicativamente 70-80 ppm) e non sono l'obiettivo di questa guida: se hai un generatore a sale, questi strumenti non fanno per te."*

**What sources actually say (genuinely conflicting — reported honestly, not resolved by picking one):**
- **TFP (community consensus, via search summaries of multiple TFP wiki/blog/thread pages):** "target range for a Salt Water (SWG) pool is 60-90 CYA"; "70-80 ppm" specifically described as the "optimal"/settled target once past the initial learning period, with 60 as a reasonable starting minimum for new SWG users. — [TFP Salt Water Chlorine Generators](https://www.troublefreepool.com/blog/2019/01/18/salt-water-chlorine-generators/), [TFP Water Balance for SWGs](https://www.troublefreepool.com/blog/2019/01/18/water-balance-for-swgs/) (TFP's own site 403s direct fetch; read via search-engine summaries only).
- **Hayward AquaRite owner's manuals** (multiple product-line versions, via search summary of manual text — not independently re-verified with a direct PDF text pull, since the fetched Hayward PDF could not be extracted as text by available tooling): consistently state a recommended stabilizer level of **60-80 ppm**. This is the manufacturer-primary source closest to corroborating the live disclaimer's "70-80" — it overlaps but is centered slightly lower.
- **Pentair IntelliChlor manuals — notably different:** the current Plus/LT product line manual states CYA should be **0-50 ppm "when permitted by local regulations,"** and the older/original IntelliChlor SCG manual states **30-50 ppm** — i.e., **the same band as a manually-chlorinated pool**, not higher. — [Pentair IntelliChlor Plus/LT Installation and Maintenance Guide](https://www.pentair.com/content/dam/extranet/nam/pentair-pool/residential/sanitizers/intellichlor-plus-lt/user-documents/intellichlor-ltplus-manual-en-fr-523854.pdf) (URL found via search; not independently re-fetched as text, so treat the exact wording as a search-summary paraphrase, though the "0-50" / "30-50" figures are specific enough to be a genuine finding, not a vague aggregation artifact). This most likely reflects newer/more conservative regulatory guidance (many health codes cap CYA regardless of chlorination method) rather than a chemistry disagreement — but from a "what should this site tell a reader" standpoint, it directly contradicts "SWG pools need 70-80."
- **No CDC/PHTA-specific SWG CYA figure was found** — the CDC MAHC and PHTA APSP-11 max (100 ppm) apply regardless of chlorination method; neither body was found publishing a SWG-specific *recommended* range the way TFP and the equipment manufacturers do.

**Assessment:** The claim "salt pools need a higher CYA range than manually-dosed pools" is well-supported and should stay. The specific number "70-80 ppm" is a real, citable figure (TFP's "optimal," roughly the top of Hayward's manual range) but presenting it as *the* figure overstates consensus — Pentair's own current manual recommends the same 0-50 range as a manual pool. Given this is a **scope-boundary disclaimer**, not a dosing instruction, precision is less important than not overclaiming; a widened, hedged range is more defensible than a narrow one that happens to match only some sources.

**Proposed replacement text (not applied — separate approved step per task instructions):**
- EN: *"This site's chlorine and stabilizer (CYA) guidance is meant for pools maintained with manually dosed chlorine (tablets, granules, liquid). Saltwater pools (salt chlorine generators) typically need a higher CYA range than that — commonly 50-80 ppm depending on the generator manufacturer — and are outside the scope of this guide. Check your salt system's manual for its specific recommendation; if you have a salt generator, these tools aren't for you."*
- IT (no em/en dashes, per `AGENTS.md` rule #13): *"Le indicazioni su cloro e stabilizzante (CYA) di questo sito sono pensate per piscine mantenute con cloro dosato manualmente (pastiglie, granuli, liquido). Le piscine con elettrolisi salina (generatore di cloro a sale) richiedono in genere un range di CYA più alto, indicativamente tra 50 e 80 ppm a seconda del produttore del generatore, e non sono l'obiettivo di questa guida. Controlla il manuale del tuo sistema a sale per l'indicazione specifica: se hai un generatore a sale, questi strumenti non fanno per te."*

**Confidence:** Medium-high confidence that "70-80" alone is too narrow/overconfident given a real manufacturer (Pentair) publishes 0-50/30-50. Medium confidence in the proposed "50-80" replacement — it's a defensible summary of the spread found, not itself a single-sourced fact. **This is flagged as an open question for the owner** (see end of section) because it's partly an editorial/product judgment call (how hedged should a scope-disclaimer be?) rather than a pure fact-check.

### Q6 — Chlorine lock: real mechanism or misnomer?

**Answer: "chlorine lock" as literally named (chlorine irreversibly trapped/deactivated by CYA) is a myth/misnomer. The underlying phenomenon the owner actually experienced — CYA over-stabilization reducing the *active* fraction of chlorine even though *total* FC reads normal — is real chemistry, well documented since 1965, and is exactly what this tool should explain. Get the wording right on the info page: explain the real reversible-equilibrium mechanism, explicitly debunk the "trapped chlorine" framing, and separately note that some sources use "chlorine lock" as a sloppy synonym for a totally different, unrelated problem (organic/algae chlorine demand) — don't conflate the two on the info page.**

**The real mechanism:**
- CYA in water does not "trap" chlorine. Free chlorine exists in a **continuous, reversible chemical equilibrium** between hypochlorous acid (HOCl, the actual disinfecting species), hypochlorite ion (OCl⁻), and chlorinated-cyanurate complexes formed with CYA. The cyanurate-bound chlorine acts as a **reservoir**, releasing HOCl back into solution as it's consumed — it is not a one-way, permanent binding. — [CPO Class, "Does Chlorine Lock Exist?"](https://cpoclass.com/chlorine-lock/): *"Chlorine is not chemically locked. It is buffered and constantly cycling between stabilized and active forms."*
- As CYA rises, the equilibrium shifts so that the **fraction** of total FC present as active HOCl at any instant gets very small — at high CYA, "the instantaneous concentration of hypochlorous acid becomes extremely small relative to total free chlorine" (same source). This means a test kit can report a FC number that "looks fine" by old CYA-agnostic standards (e.g. the classic 1-3 ppm rule from `testo.md`) while the pool is functionally under-chlorinated, because most of that FC is parked in the reservoir, not active as HOCl. **This is precisely the owner's described experience**: the pool's "cloro presente... ha smesso di funzionare" despite chlorine being present — consistent with over-stabilization, not with a literal lock.
- **Origin of the myth:** John R. Anderson's 1965 paper "A Study of the Influence of Cyanuric Acid on the Bactericidal Effectiveness of Chlorine" is widely credited as the root of the "chlorine lock" idea — but the paper itself only showed that **higher chlorine concentrations or longer contact times are needed** to achieve equivalent disinfection when CYA is present (i.e., reduced efficiency, a continuous/graded effect), **not** that chlorine becomes chemically trapped. The "lock" framing is a later industry/retail simplification of that finding. — same CPO Class source, and independently corroborated by [SwimUniversity, "How to Cure Chlorine Lock and Chlorine Demand"](https://www.swimuniversity.com/chlorine-lock/): *"This is not a real thing... cyanuric acid actually does the opposite [of locking]—it stabilizes chlorine."*
- **TFP's own position, matching the above:** "there is no such thing as 'chlorine lock' as many pool stores like to talk about" (search-aggregated summary of TFP forum consensus).

**Important terminology trap for the info page (this is a "get it right or it's published wrong" item):** multiple retail-facing sources (SwimUniversity, and others surfaced in search) use "chlorine lock" loosely as a **catch-all label that conflates two genuinely different problems**:
1. **CYA over-stabilization** (the real mechanism above, and the owner's actual problem) — fixed only by diluting/partially draining, since CYA cannot be chemically lowered. This is what this tool is about.
2. **"Chlorine demand"** — a *different, unrelated* phenomenon where organic contaminants/algae consume chlorine faster than it's added (nothing to do with CYA), typically fixed by shocking/breakpoint chlorination, not dilution. `testo.md`'s own "Clorammine" section already describes this correctly as a separate issue (chloramines from organic matter, fixed by adding more chlorine).

The fact that the *cure* differs completely (dilution vs. shocking) is the clearest evidence these are different problems that happen to share a popular but misleading nickname. **The info page must use the mechanism-accurate language** ("over-stabilization" / "CYA is too high relative to FC, reducing active chlorine") and explicitly note that "chlorine lock" is a common but imprecise term for this, rather than presenting "chlorine lock" itself as a mechanism.

**Confidence:** High confidence. Multiple independent sources (CPO Class/CPO training content, SwimUniversity, TFP community consensus, and the underlying chemistry of isocyanurate equilibria) agree on both the "myth as literally stated" verdict and the real reversible-equilibrium mechanism. The Anderson 1965 paper's existence and rough conclusion is corroborated by two independent secondary sources, though the paper itself was not directly read (not fetchable via available tools) — the claim about what it did/didn't show is second-hand, flagged accordingly.

## 7. Orchestrator verification pass (primary sources, browser)

> The research above was produced by a Sonnet subagent whose HTTP fetches were blocked by TFP (403). Those pages **are** readable with a real browser, so the load-bearing claims were re-checked directly against the primary TFP wiki. Two of the "open questions" are now closed, one secondary-source table turned out to be **wrong**, and one factor the research never considered came to light.

**Stoichiometry (Q2) — independently recomputed, matches to 4 decimal places.** CYA 129.075 g/mol; trichlor 232.41 g/mol → 91.53 % available chlorine → **0.6068** ppm CYA per ppm FC; dichlor dihydrate 255.98 g/mol → 55.40 % → **0.9102**. Both round to the candidate values (0.6 / 0.9) and the computed label percentages match the commercial specs (≥90 % / 56 %). Nothing to revise.

**Q1 CLOSED — the "target" multiplier is 11.5 %, and it is published, not inferred.** [TFP wiki, CYA Chlorine Relationship](https://www.troublefreepool.com/wiki/index.php?title=CYA_Chlorine_Relationship), read directly, states the whole ladder as percentages of CYA:

| TFP quantity | % of CYA |
|---|---|
| Min FC | **7.5 %** |
| Target FC | **11.5 %** |
| Yellow/mustard algae min | 15 % |
| Shock (SLAM) FC | **40 %** |
| Yellow/mustard shock | 60 % |

- The 40 % figure is an **independent primary-source confirmation of the existing `SLAM_CYA_RATIO = 0.4`** already in `constants.ts`. That constant is correct.
- The same page confirms the SWG variant: the table "is for tablet or liquid chlorination at a 7.5 % minimum FC/CYA ratio. SWG chlorination can be maintained at a 5 % minimum FC/CYA ratio."

**⚠️ The reconstructed table in Q1 is WRONG — do not use it.** It came from secondary aggregators and disagrees with TFP's actual published table. Real values (primary):

| CYA | Min FC | Target FC range | SLAM |
|---|---|---|---|
| 20 | 2 | 3-5 | 8 |
| 30 | 2 | 4-6 | 12 |
| 40 | 3 | 5-7 | 16 |
| 50 | 4 | 6-8 | 20 |
| 80 | 6 | 9-11 | 31 |
| 100 | 8 | 11-13 | 39 |

Q1's reconstruction claimed e.g. "CYA 30 → min 2.2, target 3.5"; the real table says **min 2, target 4-6**. The direction of Q1's reasoning survives, its numbers do not.

- **The 2 ppm floor is confirmed by TFP's own rounding**, which is a stronger result than the research claimed: at CYA 20 *and* 30 the published Min FC is 2, i.e. TFP itself does not go below 2 ppm even where 7.5 % would give 1.5. So `max(0.075 × CYA, 2)` reproduces TFP's table rather than merely approximating it.
- Phase B should therefore encode **three** cited constants, not an invented band: `MAINTENANCE_FC_MIN_RATIO = 0.075`, `MAINTENANCE_FC_TARGET_RATIO = 0.115`, `MAINTENANCE_FC_ABSOLUTE_MIN = 2`.

**Q5 CLOSED — the owner's own recollection was right, and the disclaimer should keep 70-80.** [TFP wiki, CYA](https://www.troublefreepool.com/wiki/index.php?title=CYA), read directly: *"Saltwater chlorine Generation (SWG) pools require a higher level of CYA, about 70-80 ppm, to operate efficiently."* The same page adds that an SWG in a desert climate benefits from around 80 ppm. Pentair's 0-50 manual figure is a real disagreement and worth knowing, but it does not make the live text wrong: **the published sentence is TFP-backed and can stay as it is.** Q5's proposed "50-80" rewrite is therefore *not* recommended — it would replace a sourced figure with a hedge. Optionally add "check your generator's manual", nothing more.

**🆕 A factor the research missed, and it materially affects the projection.** The same TFP CYA page documents that **CYA is not permanent**: chlorine breakdown in sunlight degrades it via hydroxyl radicals, losing **2 to 10 ppm per month** depending on sun exposure (10+ ppm/month in extreme heat and sun). Q3 modelled only how fast CYA *accumulates* from stabilized products. A projection that ignores degradation will **overstate** how quickly CYA leaves the ideal range, in a hot Italian summer possibly by a lot. Phase B must decide explicitly: model degradation as a subtracted term, or state clearly that the projection is a worst case that ignores it. Either is defensible; silently ignoring it is not.

**🆕 TFP explicitly rejects the classic "1-3 ppm" rule, in unusually blunt terms** — quotable on the info page, and directly relevant to `testo.md`: *"The pool industry gets this concept wrong when they state that a 1-3ppm Free Chlorine is all you need. THAT. IS. WRONG! Your Free Chlorine level is determined by your CYA level."*

**Open question #1 is resolved**: the TFP pages are fully readable with browser tooling; the 403 was a limitation of HTTP-fetch tools, not of the source. Anything else in this document still sourced only to a search summary can be verified the same way.

### Open questions for the owner

1. ~~**TFP's own site returned HTTP 403 to every direct fetch attempt in this session**~~ — **RESOLVED in section 7**: the pages were read directly with browser tooling and the key figures confirmed (with one secondary-source table found to be wrong). Original note kept for the record: **TFP's own site returned HTTP 403 to every direct fetch attempt in this session** (wiki pages and blog posts alike; `web.archive.org` was also unreachable from this tool). Every TFP citation above (which is most of them — TFP is the single most-cited source in this research) was read via search-engine-generated summaries of TFP pages, not a verbatim primary-source pull. The specific numbers converge tightly across independent secondary confirmations (Orenda, PHTA, CDC, manufacturer manuals) almost everywhere, which is reassuring, but **if any of this content ships as a public "sources" list, someone with a real browser should open the TFP wiki pages directly at least once** (a human, or an agent with browser tooling) to confirm the exact wording before quoting TFP verbatim on the info page.
2. ~~**Q1 — the exact "target" (not minimum) FC multiplier is unsettled.**~~ — **RESOLVED in section 7**: TFP publishes it as **11.5 % of CYA**, alongside Min 7.5 % and Shock 40 %. The tool should show a floor *and* a target, both cited, with no invented multiplier. Original note: the upper edge of a "target" band (candidates seen: ~12% to ~18% of CYA depending on source) was not pinned to one canonical formula.
3. **Q2 — which dichlor hydration form is typical in Italian retail (dihydrate ~56% vs. anhydrous ~62% available chlorine)?** Not verified — no Italian product datasheet was checked. Doesn't affect the CYA-per-ppm-FC ratio (0.9 either way) but does affect any future dose-conversion default strength if Phase B adds one. Also, the `pHEffect` bucket recommendations (`'down'` for trichlor, `'neutral'` for dichlor) are directionally solid but not confirmed against a single primary manufacturer SDS.
4. **Q4 — PHTA/APSP-11's exact standard wording could not be extracted from the fact-sheet PDF** (tooling limitation, not a source-availability problem); the 30-50 ideal / 100 max figures are corroborated by several independent secondary citations of the standard, but if this needs to be quoted verbatim publicly, re-pull that PDF with better extraction (or read it as an image) first.
5. ~~**Q5 — the salt-water CYA disclaimer figure is a product/editorial decision.**~~ — **LARGELY RESOLVED in section 7**: TFP's primary CYA page states "about 70-80 ppm" for SWG pools, so the live disclaimer is sourced and correct as written; **no edit is needed**. Pentair's 0-50 manual figure remains a genuine industry disagreement worth knowing, but hedging a sourced figure into a vaguer one would be a downgrade. Only remaining decision: whether to append "check your generator's manual" to the sentence. Original note: manufacturer guidance genuinely spans 0-50 ppm (Pentair) to 60-90 ppm (TFP/Hayward).
6. **All sources found are US-centric** (TFP, CDC, PHTA, Hayward, Pentair, Orenda — all American organizations/companies). No Italian or EU standard, and no Italian product datasheet, was located or checked for any of the six questions, despite the tool being aimed at an Italian-language audience (`testo.md`, `it.json`). The chemistry itself is universal (stoichiometry doesn't care about geography), and the owner's own field notes independently match the US figures closely (30-50 ppm CYA, 1-3 ppm FC), which is reassuring — but if EU/Italian pool-industry guidance exists and differs, it wasn't found because it wasn't specifically searched for in Italian.
7. **Q3's 3 ppm/day default is an explicit judgment call**, not a fact — flagged as such in Q3, but worth the owner's sign-off specifically since it directly drives the headline "N weeks until CYA leaves the ideal range" number the whole tool is built around.
8. **🆕 Does the projection subtract CYA degradation?** Section 7 found that CYA is lost to sunlight at 2-10 ppm/month (10+ in extreme sun), which Q3 never accounted for. An accumulation-only projection is a worst case and will warn earlier than reality, sometimes much earlier in an Italian summer. Product decision for Phase B: model the loss, or keep the projection accumulation-only and say plainly on screen that it ignores degradation. The second option is simpler and errs toward warning; the first is more honest about a hot-climate pool. Either needs to be a stated choice, not a silent omission.
