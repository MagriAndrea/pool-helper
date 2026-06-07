# WIP — Pool Shock Calculator

> **Status**: ✅ DONE — implemented, statically verified, FE-confirmed by Andrea, and archived.
> **Owner**: Andrea + Claude (collaborative).
> **Created**: 2026-06-06.
> **Estimated phases**: 11 (housekeeping → library → API → state → UI → polish → QA).

## ✅ Implementation Status (updated 2026-06-06)

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Housekeeping (AGENTS.md fixes) | ✅ Done | MobileMenu desc, ARCHITECTURE dirs, root map, new `src/hooks/AGENTS.md` |
| 1 — Pure library | ✅ Done & runtime-tested | 8 worked examples match research exactly (592 g → 911 g calcium / 4.55 L sodium) |
| 2 — Public API (5 routes) | ✅ Done | tsc-clean thin wrappers |
| 3 — i18n (EN+IT) | ✅ Done | 214 keys each, **parity verified**, all `t()` keys (literal + dynamic) resolve |
| 4 — State hooks | ✅ Done | `useToolState` (shared-key sync) + `useShockCalculator` |
| 5 — Shared UI components | ✅ Done | + added `StepCard` (not in original plan) |
| 6 — Step components | ✅ Done | Intro/Volume/Color/Cya/Chlorine/Result/Modal |
| 7 — Page + reveal logic | ✅ Done | progressive reveal + scroll-on-first-reveal |
| 8 — Navigation + assets | ✅ Done | nav entry added; **no binary assets** (see deviations) |
| 9 — Documentation | ✅ Done | ARCHITECTURE §4.3/4.4/4.5, lib & app AGENTS.md |
| 10 — Manual QA | 🟡 Partial | Static QA done (tsc 0, eslint 0 on new code, key parity, calc runtime). **In-browser QA pending** (can't run dev server per rule #9). |
| 11 — Archive | ⏳ Pending | After Andrea confirms in-browser QA → move to `changelog/`. |

### 🔀 Deviations from the original plan (all intentional)
- **No binary image assets.** Pool color cards use CSS gradient swatches (`PoolColorCard`), and the nav/feature card uses the `Zap` lucide icon. This avoids broken-asset references and keeps the feature code-only & dark-mode-safe. Photos/SVGs can be dropped in later by swapping the `swatch` prop and adding an `image` to the nav item. (Originally Phase 8 listed PNG/SVG files.)
- **Added helper modules** not in the original file list: `src/lib/calculator/range.ts` (RangeOrValue + rounding) and `units.ts` (volume/length conversions).
- **Added `src/components/tools/shock/shared/StepCard.tsx`** to DRY the numbered step header.
- **VolumeModal uses raw `@radix-ui/react-dialog`** (same pattern as `MobileMenu`) instead of a new `ui/dialog.tsx`.
- **`ShockResult.formula` → `ShockResult.breakdown`**: the library returns a numeric breakdown object (not prose) so the UI composes localized sentences via next-intl — honoring the "no user-facing text in lib" rule.
- **Static verification used in place of `npm run build`** (forbidden by rule #9): `tsc --noEmit` (0 errors), `eslint` (0 problems on new code), JSON key-parity, i18n key-existence, and a standalone compile+run of the calculator against the research worked examples.

### 🩹 Post-review refinements (round 2, after Andrea's feedback)
- **Removed all "weekly shock" wording** (title, description, explanation) — it contradicted the "no shock if water is blue" rule. Safety warnings (pH disclaimer, mixing, high-CYA) are kept.
- **CYA step links to `/#chemistry`** ("Learn more about cyanuric acid") via `AnchorLink`.
- **"Start over" button is now red/`text-destructive` and centered** (matches Chlorine Comparison).
- **Range display reworked** (was confusing — `30 – 80 − 1` mixed range dashes with the minus):
  - Big numbers (pure chlorine + final product) now show the **mean** with `≈`.
  - The range moved into a **prominent amber warning**, worded "from {min} to {max}" / "da {min} a {max}" — **no dashes at all**.
  - Breakdown formulas use **single mean values** (e.g. `Obiettivo ≈ 55 ppm`, `72.000 L × (55 − 1 ppm) ÷ 1000`), so the only `−` is the genuine subtraction. Title gets a "· average estimate / · stima media" tag when approximate.
- **`Target` → `Obiettivo`** fixed in the Italian breakdown values (was wrongly left as "Target").
- i18n now **220 keys each, parity verified**; new keys: `Cya.learnMore`, `Result.breakdownApproxTag`, `Result.rangeWarningPure/Product`, `Result.missingCya/Chlorine/Joiner`; removed `Result.rangeChip`.

### 🩹 Post-review refinements (round 3)
- **Reset semantics reversed (decision #12).** The user clarified: "Start over" must reset **every field, none excluded**. The surgical `resetFlow` (which kept the pool profile) is gone; `useToolState.reset` now also removes the mapped `ph_pool_*` shared keys, and the hook export is renamed `resetFlow` → `reset`. Docs (`ARCHITECTURE.md` §4.3, `shared-state.ts`, `use-tool-state.ts`) updated to match. No i18n changes (still 220/220).

---

## 1. Initial State

### 1.1 What the user asked for
Andrea requested a new tool for `pool-helper`: a guided single-page calculator that tells a **non-technical user** how much chlorine product to add to perform a "shock" of their pool.

The user explicitly requested:
- A second tool to compute pool **volume** (modular, callable from the shock tool but also standalone).
- Research-grounded chemistry (no hand-waving): real formulas, real product percentages, real CYA/breakpoint behaviour.
- Full alignment with the existing project architecture: dark/light mode, desktop/mobile, EN/IT i18n, localStorage persistence, transparent calculations, public API.

### 1.2 What already exists in the codebase
- **Working vertical slice template**: `chlorine-comparison` tool (price-per-active-chlorine comparator). It defines the canonical pattern this WIP follows.
  - Library: [src/lib/calculator.ts](src/lib/calculator.ts) — pure functions.
  - API: [src/app/api/v1/calculate/chlorine/route.ts](src/app/api/v1/calculate/chlorine/route.ts) — POST endpoint that calls the library.
  - Hook: [src/hooks/use-chlorine-comparison.ts](src/hooks/use-chlorine-comparison.ts) — debounced POST with localStorage persistence.
  - Page: [src/app/[locale]/tools/chlorine-comparison/page.tsx](src/app/[locale]/tools/chlorine-comparison/page.tsx) — client component using the hook + Shadcn cards.
  - Cards: [src/components/tools/chlorine-comparison/](src/components/tools/chlorine-comparison/) — input cards + verdict.
  - Nav: [src/config/nav-items.ts](src/config/nav-items.ts) — `tools.chlorineComparison` entry.
  - i18n: namespace `Tools.ChlorineComparison` in [src/messages/en.json](src/messages/en.json) and [src/messages/it.json](src/messages/it.json).
- **Project knowledge**: [testo.md](testo.md) holds Andrea's domain knowledge (in IT), including the historical incident where dichlor-based shocking accumulated CYA and locked the chlorine. This drove some of the product-list decisions.
- **Design handoff**: `~/Downloads/design_handoff_pool_shock_calculator/README.md` + `wireframe_riferimento.html` (Variant A — "Segmentato" — is the chosen variant).

### 1.3 Research completed (background subagents)
Two background research subagents have produced the source-of-truth chemistry documents (cached in this session context). All numeric constants in §4.1 below are sourced from:
- **TroubleFreePool** (TFP) — SLAM method, CYA/FC chart, breakpoint discussion.
- **Orenda Technologies** — breakpoint chlorination science.
- **PHTA / AQUA Magazine** — official fact sheets per product.
- **In The Swim**, **Montana DPHHS**, **Wojtowicz JSPSI** — cross-checks.
Every constant is double-checked: published value vs theoretical stoichiometry from molecular weights. **Do not change these constants without consulting the cited sources.**

---

## 2. Objective

### 2.1 Goal (one paragraph)
Ship a new **Pool Shock Calculator** tool at `/[locale]/tools/shock`, scientifically grounded on the TFP/SLAM method, that:
- Walks an Italian-or-English speaking pool owner through 5 reveal-progressive steps (volume → water color → CYA → current chlorine → product choice).
- Produces a **single big number** (or a range, when the user has unknowns): how many kg/L of product to add.
- Shows transparent breakdown of the calculation (always-visible concise summary).
- Persists everything to `localStorage` with **bidirectional shared-key references**, so the same volume/CYA/FC are reused across future tools (volume calculator, future tools).
- Exposes a **modular public API** at `/api/v1/calculate/*` where each calculation primitive is independently callable, and `/api/v1/calculate/shock` is a 1-call wrapper that orchestrates them.

### 2.2 Non-goals (out of scope for this WIP)
- The actual pool-volume calculator UI/logic (shell modal only — designed separately later).
- Tablet-pool/saltwater-pool support (saltwater pools have different CYA dynamics).
- Test-strip OCR / camera input.
- Multi-pool profiles (single shared profile suffices for MVP).
- Account/auth.
- PWA installability (already covered by the framework, no new work).

### 2.3 Architectural decisions (agreed)
The following 14 decisions are **frozen** for this WIP. Any change requires re-opening the conversation with Andrea.

| # | Area | Decision |
|---|---|---|
| 1 | Shock product list | **Only sodium hypochlorite (liquid) and calcium hypochlorite (granular)**. Trichlor/dichlor are explicitly excluded — they accumulate CYA per ppm FC (+0.61 and +0.91 respectively) and the historical pool incident in `testo.md` confirms this risk. |
| 2 | Target FC formula | `target_FC = max(0.40 × CYA × color_multiplier, 10 × CC)`. The first term is SLAM (TFP standard); the second is breakpoint chlorination for chloramines. The system picks whichever is higher and shows the user which one "won" and why. |
| 3 | Step 2 color cards | **4 cards**: Perfect water (blue) / Light green / Green-brown / Dark green-black. Layout: 4 cols desktop, 2×2 mobile. |
| 4 | Color multipliers | Perfect: null (no shock). Light green: ×1.0 + floor 10 ppm. Green-brown: ×1.5 + floor 15 ppm. Dark green: ×2.5 + floor 20 ppm. |
| 5 | CYA "don't know" fallback | Range **30–80 ppm** → output computed as a range. |
| 6 | Free chlorine "don't know" fallback | Range **0–2 ppm**: MAX dose assumes FC=0 (worst case), MIN dose assumes FC=2 (best case). |
| 7 | CC field | **Optional** with a friendly nudge ("also tell us combined chlorine for a more precise calculation"). FC is required. |
| 8 | Breakpoint UX | **Automatic + transparency**: system picks `max(SLAM, 10×CC)` and explains which one won in the breakdown text. |
| 9 | Volume units | Switch **Liters / Gallons** with always-visible hint "or m³ × 1000". Default by locale (IT→L, EN→gal). |
| 10 | Volume modal | Modal with empty shell (shell-only for MVP). When the future Volume Calculator is added, it will write to a shared localStorage key, and the modal's "Apply" button updates the Step 1 volume field + closes the modal. |
| 11 | localStorage architecture | **Per-tool keys with bidirectional shared references**. Each tool has its own state key; values that represent "pool reality" (volume, CYA, FC, CC) also live in shared keys (`ph_pool_*`). Writing to either updates both. |
| 12 | Reset behaviour | **Full wipe (updated after review): clears EVERY field, none excluded** — including the shared pool profile (volume, CYA, FC, CC). The reset also removes the `ph_pool_*` shared keys so it sticks across reloads. (Superseded the original "keep the profile" choice, which confused the user.) |
| 13 | "Perfect water" handling | When user selects the blue card, skip steps 3-4 and show an educational result: "✅ No shock needed. Check that CC < 0.5 ppm." If user later inputs CC > 0.5, compute the breakpoint shock (`10 × CC`) and display it as the "shock for chloramines" suggestion. |
| 14 | Calculation transparency | **Always visible**, concise format: "Target FC 30 ppm × 32,000 L = 1.4 kg of pure chlorine → 2.2 kg of calcium hypochlorite (65%)". No hidden accordion. |

### 2.4 Edge cases (agreed defaults)
- **A. FC already ≥ target**: show "✅ You already have enough free chlorine for this shock level!" + if CC>0.5, separately show the breakpoint result.
- **B. CYA > 100 ppm (user-entered)**: red warning on Step 3 — "Your CYA is very high. Even with shock, chlorine struggles to work. Consider partially draining and refilling your pool first." Calculation proceeds with the warning attached to the result.
- **C. Product amount < 50 g (impractical)**: no special handling for MVP — show the value as-is.

---

## 3. Target Files

> Legend: `[NEW]` = create, `[MOD]` = modify existing, `[FIX]` = housekeeping (out-of-scope but mandatory per AGENTS.md rule #0).

### 3.1 Pure library (chemistry)

```
[FIX] src/lib/calculator.ts                       → DELETE (content moves to calculator/chlorine-comparison.ts)
[NEW] src/lib/calculator/index.ts                 → re-exports everything (backward-compat barrel)
[NEW] src/lib/calculator/chlorine-comparison.ts   → existing comparison logic, moved here verbatim
[NEW] src/lib/calculator/types.ts                 → all shared types & enums
[NEW] src/lib/calculator/constants.ts             → all chemistry constants (sourced & cited in comments)
[NEW] src/lib/calculator/chlorine-target.ts       → computes target FC from (CYA, color, CC)
[NEW] src/lib/calculator/chlorine-dose.ts         → computes pure chlorine grams from (volume, target FC, current FC)
[NEW] src/lib/calculator/product-conversion.ts    → converts pure chlorine to product amount + side-effects
[NEW] src/lib/calculator/pool-volume.ts           → computes pool volume from shape + dimensions (rectangle, round)
[NEW] src/lib/calculator/shock.ts                 → wrapper orchestrating chlorine-target + chlorine-dose + product-conversion
[NEW] src/lib/calculator/AGENTS.md                → documents the modular structure & per-file scope
```

### 3.2 Public API

```
[NEW] src/app/api/v1/calculate/chlorine-target/route.ts        → POST: { cya, colorLevel, currentCC? } → target FC
[NEW] src/app/api/v1/calculate/chlorine-dose/route.ts          → POST: { volumeL, targetFC, currentFC } → grams pure
[NEW] src/app/api/v1/calculate/product-conversion/route.ts     → POST: { pureChlorineG, productType, concentration } → amount + side effects
[NEW] src/app/api/v1/calculate/pool-volume/route.ts            → POST: { shape, dimensions, unit } → volume in litres
[NEW] src/app/api/v1/calculate/shock/route.ts                  → POST: { volume, color, cya, chlorine, product } → full result
```

The existing `src/app/api/v1/calculate/chlorine/route.ts` (for chlorine-comparison) is **untouched** — it imports from `@/lib/calculator` which still re-exports the same symbols thanks to the new `index.ts`.

### 3.3 State management

```
[NEW] src/hooks/use-tool-state.ts             → generic hook: per-tool key + bidirectional shared keys
[NEW] src/hooks/use-shock-calculator.ts       → wraps use-tool-state for the shock flow
[NEW] src/lib/shared-state.ts                 → constants for shared localStorage keys + JSON shape
```

### 3.4 UI components

```
[NEW] src/app/[locale]/tools/shock/page.tsx                 → page entry, 'use client'
[NEW] src/components/tools/shock/IntroStep.tsx              → Step 0 (intro + pH disclaimer)
[NEW] src/components/tools/shock/VolumeStep.tsx             → Step 1 (volume input + unit switch + modal trigger)
[NEW] src/components/tools/shock/ColorStep.tsx              → Step 2 (4 pool color cards)
[NEW] src/components/tools/shock/CyaStep.tsx                → Step 3 (CYA + "don't know" segmented)
[NEW] src/components/tools/shock/ChlorineStep.tsx           → Step 4 (FC + CC + auto TC + "don't know" segmented)
[NEW] src/components/tools/shock/ResultStep.tsx             → Result block (big number, breakdown, product list, final number)
[NEW] src/components/tools/shock/VolumeModal.tsx            → empty-shell modal (Radix Dialog)
[NEW] src/components/tools/shock/shared/DontKnowToggle.tsx  → segmented "Inserisco / Non lo so" reusable
[NEW] src/components/tools/shock/shared/NumberInput.tsx     → validated number input with unit suffix
[NEW] src/components/tools/shock/shared/ReassureNote.tsx    → green reassuring "don't know" note
[NEW] src/components/tools/shock/shared/PoolColorCard.tsx   → single pool color selectable card
[NEW] src/components/tools/shock/shared/ProductCard.tsx     → single radio-style product card
```

### 3.5 Configuration & navigation

```
[MOD] src/config/nav-items.ts                       → add 'shock' under tools.children
[MOD] public/images/                                → add shock_calculator.png (nav menu icon)
[NEW] public/images/pool-perfect.svg                → Step 2 card image (blue)
[NEW] public/images/pool-light-green.svg            → Step 2 card image
[NEW] public/images/pool-green-brown.svg            → Step 2 card image
[NEW] public/images/pool-dark-green.svg             → Step 2 card image
```

> Image format: SVG is preferred (smaller, scalable, dark-mode-friendly via currentColor). If Andrea provides PNG/JPG photos, use those instead.

### 3.6 Internationalization

```
[MOD] src/messages/en.json                          → add Tools.Shock namespace + Navigation.shock label
[MOD] src/messages/it.json                          → mirror EN keys with IT values
```

### 3.7 Housekeeping (RULE #0 fixes, mandatory)

```
[FIX] src/components/AGENTS.md                      → MobileMenu.tsx is now Radix Dialog, not "FAB + Sheet" (commit 0517da7)
[FIX] ARCHITECTURE.md                               → use-local-storage.ts lives in src/hooks/, not src/lib/. Also: document src/hooks/ and src/config/ directories which are missing entirely.
[FIX] AGENTS.md (root)                              → Map of Knowledge: add `src/hooks/` row
[MOD] src/lib/AGENTS.md                             → reference new calculator/ subdirectory after creation
```

---

## 4. Architecture & Implementation Details

### 4.1 Chemistry foundation (the source of truth)

All formulas below are verified against TFP / Orenda / PHTA / AQUA Magazine + theoretical stoichiometry. **Numbers in code must match this section exactly.**

#### 4.1.1 Target Free Chlorine (FC)

The system computes two candidate targets and takes the higher one:

```
slam_target      = 0.40 × CYA × color_multiplier
breakpoint_target = 10 × CC          (only if CC is provided and > 0)
target_FC        = max(slam_target, breakpoint_target, floor_for_color)
```

Where `color_multiplier` and `floor_for_color`:

| colorLevel    | multiplier | floor (ppm) |
|---------------|-----------:|------------:|
| `perfect`     |       null |        null |
| `light_green` |        1.0 |          10 |
| `green_brown` |        1.5 |          15 |
| `dark_green`  |        2.5 |          20 |

**Sources**:
- SLAM 40% × CYA: https://www.troublefreepool.com/wiki/index.php?title=CYA_Chlorine_Relationship
- Breakpoint 10×: https://blog.orendatech.com/breakpoint-chlorination-explained
- Multipliers are tuned by us to combine SLAM with retail "lbs per 10k gal" tradition.

**Worked example**: pool with CYA = 50 ppm, water = light green, CC = 0.4 ppm.
- slam_target = 0.40 × 50 × 1.0 = 20 ppm
- breakpoint_target = 10 × 0.4 = 4 ppm
- floor = 10 ppm
- **target_FC = max(20, 4, 10) = 20 ppm** → slam wins.

#### 4.1.2 Pure chlorine dose

Universal formula, unit-verified:

```
gap_ppm                    = max(0, target_FC - current_FC)
pure_chlorine_grams        = volume_L × gap_ppm ÷ 1000
```

Reasoning: 1 ppm = 1 mg/L, so 1 ppm × 1 L = 1 mg ; ÷ 1000 = 1 g per m³.

**Worked example**: volume = 32 m³ = 32,000 L, target_FC = 20 ppm, current_FC = 1.5 ppm.
- gap = 20 − 1.5 = 18.5 ppm
- pure = 32,000 × 18.5 ÷ 1000 = **592 g** of pure available chlorine.

#### 4.1.3 Product conversion

For **calcium hypochlorite (granular solid)**:
```
product_grams = pure_chlorine_grams ÷ (concentration_pct ÷ 100)
```

Default concentration = 65% (configurable).

**Worked example continued**: 592 g pure ÷ 0.65 = **911 g of calcium hypochlorite**.

For **sodium hypochlorite (liquid)**: the industry-standard "trade %" is **weight-per-volume** (grams of available chlorine per 100 mL of solution). This is the critical distinction:
- Trade % × 10 = g/L of available chlorine. (e.g. 13 trade % = 130 g/L)
- Formula:
```
product_mL = (volume_L × gap_ppm) ÷ (trade_pct × 10)
        = (volume_L × gap_ppm) ÷ g_per_L
```

Default trade % = 13% (typical Italian pool-grade liquid). If product is weight % + density:
```
g_per_L = weight_pct × density × 10
```

**Worked example continued**: 32,000 L × 18.5 ppm ÷ (13 × 10) = 32,000 × 18.5 ÷ 130 = **4,554 mL = ~4.55 L of sodium hypochlorite at 13%**.

**Source for trade-% (w/v) convention**: https://www.troublefreepool.com/wiki/index.php?title=Weight_Verses_Trade-_Understanding_Chlorine_Concentrations_in_Different_Sources — this is the #1 source of dosing errors; our internal storage **must** use g/L of available chlorine to avoid w/w-vs-w/v confusion.

#### 4.1.4 Side-effects per ppm FC added

| Product                | CYA added | Calcium hardness | Salt (NaCl)       | pH effect           |
|------------------------|-----------|------------------|-------------------|---------------------|
| Sodium hypochlorite    | 0         | 0                | +0.82 ppm         | up (transient)      |
| Calcium hypochlorite   | 0         | +0.7 ppm         | 0                 | up (alkaline ~11)   |

Values from stoichiometry, double-checked against PHTA. (Trichlor and dichlor side-effects are documented in the research but unused — those products are excluded from the shock tool.)

#### 4.1.5 Warnings

- `CYA_HIGH`: triggers when CYA > 100 ppm. Warning attached to result.
- `FC_ALREADY_SUFFICIENT`: triggers when `current_FC ≥ target_FC` (gap ≤ 0). Result is "no shock needed for current target".
- `CC_HIGH`: triggers when CC > 0.5 ppm. Surfaces the breakpoint reasoning.
- `LOW_DOSE`: triggers when `product_amount < 50 g` (or < 50 mL for liquid). MVP: no warning shown; just leave the hook in code.

### 4.2 Module decomposition

#### 4.2.1 `src/lib/calculator/types.ts`

```typescript
// Shared input/output types
export type Unit = 'L' | 'gal';
export type ColorLevel = 'perfect' | 'light_green' | 'green_brown' | 'dark_green';
export type ProductId = 'sodium_hypochlorite' | 'calcium_hypochlorite';

export interface VolumeInput { value: number; unit: Unit; }

export type CyaInput =
  | { known: false }
  | { known: true; ppm: number };

export type ChlorineInput =
  | { known: false }
  | { known: true; freeFC: number; combinedCC?: number };

// Output: either a deterministic value or a range
export type RangeOrValue<T extends string = string> =
  | { isRange: false; value: number; unit: T }
  | { isRange: true; min: number; max: number; unit: T };

export type WarningCode =
  | 'CYA_HIGH'
  | 'FC_ALREADY_SUFFICIENT'
  | 'CC_HIGH'
  | 'LOW_DOSE';

export interface ChlorineTargetResult {
  slamTarget: number | null;
  breakpointTarget: number | null;
  floor: number | null;
  winningStrategy: 'slam' | 'breakpoint' | 'floor' | 'none';
  targetFC: RangeOrValue<'ppm'> | null;   // null if colorLevel === 'perfect' && no CC
  warnings: WarningCode[];
}

export interface ChlorineDoseResult {
  pureChlorine: RangeOrValue<'g'>;
  gap: RangeOrValue<'ppm'>;
  warnings: WarningCode[];
}

export interface ProductConversionInput {
  pureChlorineG: RangeOrValue<'g'>;
  productId: ProductId;
  concentrationPct: number;   // for calcium: weight %, for sodium: trade %
  densityKgL?: number;         // optional, only for sodium when given as weight %
}

export interface ProductConversionResult {
  amount: RangeOrValue<'g' | 'kg' | 'mL' | 'L'>;
  sideEffects: {
    cyaAddedPpm: number;
    hardnessAddedPpm: number;
    saltAddedPpm: number;
    pHEffect: 'up' | 'down' | 'neutral';
  };
}

export interface ShockInput {
  volume: VolumeInput;
  colorLevel: ColorLevel;
  cya: CyaInput;
  chlorine: ChlorineInput;
  product: { id: ProductId; concentrationPct: number; densityKgL?: number };
}

export interface ShockResult {
  isNoShockNeeded: boolean;
  target: ChlorineTargetResult;
  dose: ChlorineDoseResult | null;
  product: ProductConversionResult | null;
  formula: {
    plainText: string;        // "Target FC = 0.40 × 50 (CYA) × 1.0 (light green) = 20 ppm"
    structured: {
      step1: string;          // target FC reasoning
      step2: string;          // gap reasoning
      step3: string;          // product reasoning
    };
  };
  warnings: WarningCode[];
}
```

#### 4.2.2 `src/lib/calculator/constants.ts`

```typescript
// All numbers cited inline. Do not change without consulting the source.

// SLAM (TroubleFreePool / TFP)
// https://www.troublefreepool.com/wiki/index.php?title=CYA_Chlorine_Relationship
export const SLAM_CYA_RATIO = 0.40;

// Breakpoint chlorination (Orenda / industry standard)
// https://blog.orendatech.com/breakpoint-chlorination-explained
export const BREAKPOINT_MULTIPLIER = 10;

// Color level multipliers (tuned: combines SLAM with retail "lbs per 10k gal" tradition)
export const COLOR_LEVELS = {
  perfect:     { multiplier: null, floor: null }, // no shock
  light_green: { multiplier: 1.0,  floor: 10 },
  green_brown: { multiplier: 1.5,  floor: 15 },
  dark_green:  { multiplier: 2.5,  floor: 20 },
} as const;

// Fallback ranges when user selects "don't know"
export const CYA_UNKNOWN_RANGE = { min: 30, max: 80 };       // typical pool population
export const FC_UNKNOWN_RANGE = { min: 0, max: 2 };          // 0=worst case, 2=normal

// Warning thresholds
export const CYA_HIGH_THRESHOLD = 100;                         // TFP: above this, dilute
export const CC_HIGH_THRESHOLD = 0.5;                          // TFP: above this you have a problem
export const LOW_DOSE_GRAMS_THRESHOLD = 50;                    // impractical to weigh

// Unit conversions
export const LITERS_PER_GALLON = 3.78541;                      // US liquid gallon

// Product defaults
export const DEFAULT_SODIUM_TRADE_PCT = 13;                    // Italian pool grade
export const DEFAULT_CALCIUM_PCT = 65;                         // typical retail

// Side effects per ppm FC added (verified stoichiometrically)
// Calcium hypochlorite: 100.09 (CaCO3) ÷ (2 × 70.906 av Cl2) = 0.706
// Sodium hypochlorite: 58.44 (NaCl) ÷ 70.906 (Cl2 equiv) = 0.824
export const SIDE_EFFECTS = {
  sodium_hypochlorite: {
    cyaAddedPerPpm: 0,
    hardnessAddedPerPpm: 0,
    saltAddedPerPpm: 0.82,
    pHEffect: 'up' as const,
  },
  calcium_hypochlorite: {
    cyaAddedPerPpm: 0,
    hardnessAddedPerPpm: 0.7,
    saltAddedPerPpm: 0,
    pHEffect: 'up' as const,
  },
} as const;
```

#### 4.2.3 `src/lib/calculator/chlorine-target.ts`

```typescript
/**
 * Compute the target Free Chlorine (FC) for a shock.
 *
 * Strategy:
 * 1. If colorLevel === 'perfect' AND no high CC → no shock needed.
 * 2. Compute slamTarget = SLAM_CYA_RATIO × CYA × colorMultiplier
 *    - If CYA is unknown → produce a range using CYA_UNKNOWN_RANGE.
 * 3. Compute breakpointTarget = BREAKPOINT_MULTIPLIER × CC (if CC provided).
 * 4. Apply floor for the color level.
 * 5. Return max(slamTarget, breakpointTarget, floor) and the winning strategy.
 */
export function computeChlorineTarget(input: {
  cya: CyaInput;
  colorLevel: ColorLevel;
  combinedCC?: number;
}): ChlorineTargetResult { /* ... */ }
```

(Full implementation in code review; signatures here for documentation.)

#### 4.2.4 `src/lib/calculator/chlorine-dose.ts`

```typescript
/**
 * Compute the pure available chlorine (in grams) needed to raise FC.
 *
 * grams = volume_L × gap_ppm / 1000
 *
 * If volume.unit === 'gal', convert to L first.
 * If chlorine.known is false, produce a range using FC_UNKNOWN_RANGE.
 * If target is a range (from chlorine-target), propagate the range.
 */
export function computeChlorineDose(input: {
  volume: VolumeInput;
  targetFC: RangeOrValue<'ppm'>;
  currentFC: ChlorineInput;
}): ChlorineDoseResult { /* ... */ }
```

#### 4.2.5 `src/lib/calculator/product-conversion.ts`

```typescript
/**
 * Convert pure chlorine grams → product amount + side effects.
 *
 * For sodium_hypochlorite: mL = pure_g / (trade_pct × 10 / 1000)
 *   - Stored internally as g/L of available chlorine.
 *   - If user gives weight % + density: g/L = weight_pct × density × 10
 *
 * For calcium_hypochlorite: g_product = pure_g / (concentration_pct / 100)
 *
 * Side effects scale linearly with the gap_ppm (not with product mass).
 * Auto-select display unit:
 *   - solids: g if < 1000, else kg
 *   - liquids: mL if < 1000, else L
 */
export function convertToProduct(input: ProductConversionInput): ProductConversionResult { /* ... */ }
```

#### 4.2.6 `src/lib/calculator/pool-volume.ts`

```typescript
export type PoolShape = 'rectangle' | 'circle';

export interface RectangleDims { length: number; width: number; depth: number; unit: 'm' | 'ft'; }
export interface CircleDims   { diameter: number; depth: number; unit: 'm' | 'ft'; }

/**
 * Compute pool volume in litres.
 *   rectangle: length × width × depth
 *   circle:    π × (diameter/2)² × depth
 * Convert ft³ → L if needed (1 ft³ = 28.3168 L).
 */
export function computePoolVolume(
  shape: PoolShape,
  dims: RectangleDims | CircleDims
): { volumeL: number; volumeM3: number; volumeGal: number } { /* ... */ }
```

(Note: pool-volume.ts is **created with logic** in this WIP — the modal **UI** is shell-only for now. The logic is exported so other tools can call it, and is callable via `/api/v1/calculate/pool-volume`.)

#### 4.2.7 `src/lib/calculator/shock.ts`

```typescript
/**
 * Orchestrator. Calls chlorine-target → chlorine-dose → product-conversion in sequence.
 * Handles:
 *   - colorLevel === 'perfect': return isNoShockNeeded=true unless CC>0.5
 *   - gap ≤ 0: return isNoShockNeeded=true with FC_ALREADY_SUFFICIENT warning
 *   - assembles formula.plainText + structured for transparency display
 */
export function computeShock(input: ShockInput): ShockResult { /* ... */ }
```

### 4.3 State management (the localStorage strategy)

#### 4.3.1 Shared keys (pool reality)

```typescript
// src/lib/shared-state.ts
export const SHARED_KEYS = {
  poolVolume: 'ph_pool_volume',   // { value: number, unit: 'L' | 'gal' }
  poolCYA:    'ph_pool_cya',      // { ppm: number } | null
  poolFC:     'ph_pool_fc',       // { ppm: number } | null
  poolCC:     'ph_pool_cc',       // { ppm: number } | null
} as const;
```

#### 4.3.2 Per-tool keys

```typescript
export const TOOL_KEYS = {
  shock:               'ph_tool_shock',
  volume:              'ph_tool_volume',     // for the future volume calculator
  chlorineComparison:  'ph_calcium_input',   // existing — KEEP unchanged for backward compat
} as const;
```

#### 4.3.3 The `useToolState` hook

```typescript
/**
 * Generic per-tool state hook with bidirectional shared-key sync.
 *
 * @param toolKey     localStorage key for this tool's full state
 * @param mappings    array of {toolField, sharedKey, extract, embed} entries:
 *                      - extract(toolState): reads the value out of tool state
 *                      - embed(sharedValue, toolState): writes shared value into tool state
 *
 * Behavior:
 *  - On mount: hydrate tool state from toolKey. For each mapping, if toolKey is empty/missing
 *    for that field but sharedKey has a value, embed it.
 *  - On set: writes new state to toolKey AND to each mapped sharedKey.
 *  - On reset: clears toolKey only. Shared keys persist (so reopening the tool repopulates).
 */
export function useToolState<T>(
  toolKey: string,
  defaultValue: T,
  mappings?: SharedMapping<T>[]
): [T, (next: T | ((prev: T) => T)) => void, () => void] { /* ... */ }
```

**Example wiring for shock tool**:
```typescript
const [state, setState, reset] = useToolState<ShockState>(
  TOOL_KEYS.shock,
  defaultShockState,
  [
    { toolField: 'volume',     sharedKey: SHARED_KEYS.poolVolume,
      extract: s => s.volume,
      embed: (v, s) => ({ ...s, volume: v }) },
    { toolField: 'cyaPpm',     sharedKey: SHARED_KEYS.poolCYA, /* ... */ },
    { toolField: 'freeFC',     sharedKey: SHARED_KEYS.poolFC, /* ... */ },
    { toolField: 'combinedCC', sharedKey: SHARED_KEYS.poolCC, /* ... */ },
  ]
);
```

This gives us:
- While working, values entered in one tool flow to the shared keys and are reused by others.
- When the future volume calculator writes to `ph_pool_volume`, the next time the shock tool mounts it sees the new value automatically.
- **Reset is a full wipe**: it clears `ph_tool_shock` AND every mapped `ph_pool_*` shared key, so all fields are cleared and stay cleared after a reload (per the updated decision #12).

#### 4.3.4 `useShockCalculator` shape

```typescript
export interface ShockState {
  // Step 1
  volume: { value: number; unit: 'L' | 'gal' } | null;
  // Step 2
  colorLevel: ColorLevel | null;
  // Step 3
  cyaKnown: boolean;
  cyaPpm: number | null;
  // Step 4
  chlorineKnown: boolean;
  freeFC: number | null;
  combinedCC: number | null;
  // Final
  selectedProduct: ProductId | null;
  productConcentration: number;
  productDensity?: number;
}
```

The hook computes `derivedTotalCC` (auto = freeFC + combinedCC). When the user manually overrides the auto field, store it but on next change to FC or CC, re-derive.

The hook debounces (500ms) the POST to `/api/v1/calculate/shock` like the chlorine-comparison hook does.

### 4.4 UX flow (single page, progressive reveal)

#### 4.4.1 Reveal logic

A step is **active** (visible) when **all previous steps are valid**. "Valid" means:
- Step 0: always valid.
- Step 1: `volume.value > 0`.
- Step 2: `colorLevel !== null`. If `colorLevel === 'perfect'`, **skip to result** (steps 3-4 hidden, result shows educational state).
- Step 3 (segmented A): toggle is `true` after explicit click; if `cyaKnown && cyaPpm > 0` OR `!cyaKnown` → valid.
- Step 4 (segmented A): similarly, if `chlorineKnown && freeFC ≥ 0` OR `!chlorineKnown` → valid.
- Result: shown when step 4 valid (or step 2 with `colorLevel === 'perfect'`).

Implementation: each step component checks the predicate and renders `null` when not yet revealed. A subtle hint (`— gli step si rivelano man mano che compili —`) sits between Step 0 and Step 1, like the wireframe.

**Accessibility**: when a step is revealed, scroll to it smoothly **only on initial reveal** (not on subsequent value changes). Manage focus carefully to avoid trapping screen readers.

#### 4.4.2 Step 1 — Volume

```
┌─────────────────────────────────────────┐
│ 1 │ Quanta acqua ha la tua piscina?      │
├───┴──────────────────────────────────────┤
│ Volume         │ Unit                    │
│ [   32000   ]  │ [Litri][Galloni]        │
│ "or m³ × 1000"                            │
│                                           │
│ Non sai quanti litri? [📐 Calcola]       │
└──────────────────────────────────────────┘
```

- Unit switch default by locale: IT → L, EN → gal.
- On unit toggle: convert the displayed value (don't reset).
- Hint "or m³ × 1000" only when unit === 'L'.
- "Calcola" button opens `VolumeModal` (shell only).

#### 4.4.3 Step 2 — Water color

```
┌─────────────────────────────────────────────┐
│ 2 │ Di che colore è la tua acqua?            │
├───┴──────────────────────────────────────────┤
│ [Perfetta] [Verdina] [Verde/marrone] [Nera]  │
│  (4 cards, desktop) / 2×2 mobile             │
└──────────────────────────────────────────────┘
```

Each card = image + label + small description ("manutenzione" / "leggero" / "torbida" / "critica").

Selected state: thick border + accent background.

#### 4.4.4 Step 3 — CYA (Variant A: Segmentato)

```
┌─────────────────────────────────────────────┐
│ 3 │ Quanto acido cianurico (CYA)?            │
├───┴──────────────────────────────────────────┤
│ [Inserisco il valore][Non lo so]             │
│                                              │
│ (if Inserisco) [   30   ] ppm                │
│ (if Non lo so) ✓ Useremo un range prudente   │
└──────────────────────────────────────────────┘
```

- Segmented control toggles two mutually-exclusive views.
- Default: "Inserisco il valore" selected, input empty.
- If `cyaPpm > CYA_HIGH_THRESHOLD` (100): red warning below input.

#### 4.4.5 Step 4 — Current chlorine (Variant A)

```
┌─────────────────────────────────────────────┐
│ 4 │ Quanto cloro c'è ora in acqua?           │
├───┴──────────────────────────────────────────┤
│ [Inserisco i valori][Non lo so]              │
│                                              │
│ (Inserisco)                                   │
│ ┌────────┐ ┌────────┐ ┌─[auto]──┐            │
│ │ Libero │ │Combinat│ │ Totale  │            │
│ │  1.5   │ │  0.8   │ │  2.3    │            │
│ │  ppm   │ │  ppm   │ │  ppm    │            │
│ └────────┘ └────────┘ └─────────┘            │
│   (nudge: "anche il CC = calcolo + preciso") │
└──────────────────────────────────────────────┘
```

- Auto-populate: TC = FC + CC; CC = TC - FC; FC = TC - CC. Whenever 2 of 3 are filled, the third auto-fills with the "auto" pill.
- If the user types into the auto field, it becomes manual; the next change to either of the other two re-locks it as auto.
- Nudge text under the row: "Inserisci anche il cloro combinato per un calcolo più preciso" — visible whenever `combinedCC === null`.

#### 4.4.6 Result — Main result

```
┌─────────────────────────────────────────────┐
│ RISULTATO · quanto cloro serve               │
│                                              │
│      ≈ 1,4 kg di cloro puro                  │
│      [↔ range: 1,1 – 1,8 kg]    (if range)   │
│                                              │
│ Target FC 30 ppm × 32.000 L = 1,4 kg di      │
│ cloro puro                                   │
│                                              │
│ ─────────────────                             │
│                                              │
│ Che cloro hai a disposizione?                │
│ [○ Ipoclorito di sodio (liquido)]            │
│ [○ Ipoclorito di calcio (granulare)]         │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │  Quindi devi usare                      │  │
│ │       ≈ 1,9 kg di prodotto              │  │
│ │  +0.7 ppm durezza · pH ↑                │  │
│ │                                          │  │
│ │            [↺ Ricomincia]                │  │
│ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

- Big number on top: pure chlorine grams/kg.
- Concise formula breakdown below — always visible (per decision #14).
- Range chip shown if `isRange === true` (CYA unknown or FC unknown).
- Product list: 2 options (sodium, calcium). No warning pills (no stabilized products in the list).
- Final big number: product amount in auto-selected unit.
- Side effects line: small text under final number.
- Reset button at the bottom right of the final box.

#### 4.4.7 Result — "Perfect water" branch

When `colorLevel === 'perfect'`:
- Steps 3-4 are hidden.
- Result block shows:
  ```
  ✅ Non serve shockare!
  
  L'acqua sembra in ottimo stato. Controlla solo che il
  Cloro Combinato sia sotto 0.5 ppm.
  
  [Inserisco il CC ora]  (button reveals an inline input)
  
  (If user inputs CC > 0.5):
  ⚠ CC alto: serve uno shock di breakpoint.
  Target FC = 10 × {CC} = {10×CC} ppm
  → ≈ {grams} g di cloro puro
  → ≈ {amount} {unit} di ipoclorito di sodio/calcio
  ```

### 4.5 Internationalization keys

Full namespace **`Tools.Shock`** to be added to both `en.json` and `it.json`. Skeleton (English values, IT equivalents will mirror):

```jsonc
{
  "Tools": {
    "Shock": {
      "title": "Pool Shock Calculator",
      "description": "Find out exactly how much chlorine to add for your weekly shock.",
      "reset": "Start over",

      "Intro": {
        "title": "Shock your pool, every week",
        "subtitle": "2 minutes · we guide you step by step",
        "explanation": "Did you know? Your pool should be shocked about once a week to stay in great disinfection condition. This tool tells you how much product to add and which one to use.",
        "phWarning": "First: your water needs balanced pH. If pH is out of range, the shock might not work.",
        "phLink": "Learn how to balance pH",
        "callToAction": "Fill in the data below and we'll guide you through each step. 👇",
        "revealHint": "— steps appear as you fill them in —"
      },

      "Volume": {
        "title": "How much water is in your pool?",
        "label": "Water volume",
        "placeholder": "e.g. 32000",
        "unitLabel": "Unit",
        "liters": "Liters",
        "gallons": "Gallons",
        "litersHint": "or m³ × 1000",
        "helpText": "Don't know how many liters your pool has?",
        "calculateButton": "📐 Calculate volume",
        "modalTitle": "Calculate pool volume",
        "modalPlaceholder": "Volume calculator tool — coming soon",
        "modalClose": "Close"
      },

      "Color": {
        "title": "What does your water look like?",
        "subtitle": "Tap the pool most similar to yours — it sets the shock intensity",
        "perfectLabel": "Perfect water",
        "perfectDescription": "blue, clear",
        "lightGreenLabel": "Light shock",
        "lightGreenDescription": "slightly green",
        "greenBrownLabel": "Heavy shock",
        "greenBrownDescription": "cloudy / brownish",
        "darkGreenLabel": "Extra shock",
        "darkGreenDescription": "critical / very dark"
      },

      "Cya": {
        "title": "How much cyanuric acid (CYA)?",
        "subtitle": "It's the 'stabilizer' already in the water",
        "knowOption": "I'll enter the value",
        "dontKnowOption": "I don't know",
        "label": "Cyanuric acid",
        "placeholder": "e.g. 30",
        "unit": "ppm",
        "reassure": "No problem: we'll use a prudent value and the result will be a slightly wider range.",
        "highWarning": "⚠ Your CYA is very high. Even with shock, chlorine struggles to work. Consider partially draining and refilling your pool before shocking."
      },

      "Chlorine": {
        "title": "How much chlorine is in the water now?",
        "subtitle": "Fill 2 of 3: the third will be calculated",
        "knowOption": "I'll enter the values",
        "dontKnowOption": "I don't know",
        "freeLabel": "Free chlorine",
        "freePlaceholder": "e.g. 1.5",
        "combinedLabel": "Combined chlorine",
        "combinedPlaceholder": "e.g. 0.8",
        "totalLabel": "Total chlorine",
        "totalPlaceholder": "e.g. 2.3",
        "unit": "ppm",
        "autoTag": "auto",
        "combinedNudge": "Also enter combined chlorine for a more precise calculation",
        "reassure": "No problem: we'll use a prudent chlorine estimate and the result will be a slightly wider range."
      },

      "Result": {
        "noShockTitle": "✅ No shock needed!",
        "noShockBody": "Your water looks great. Just check that Combined Chlorine is below 0.5 ppm.",
        "ccCheckButton": "I'll enter the CC now",
        "noShockCcHighBody": "Combined Chlorine ({cc} ppm) is high. A breakpoint shock is needed:",

        "kicker": "Result · how much chlorine you need",
        "pureKgUnit": "kg of pure chlorine",
        "pureGUnit": "g of pure chlorine",
        "rangeChip": "↔ with 'don't know': range {min} – {max} {unit}",
        "explanation": "Chlorine quantity to bring the water to the chosen shock level.",

        "breakdownSlam": "Target FC = 0.40 × {cya} (CYA) × {multiplier} ({color}) = {target} ppm",
        "breakdownBreakpoint": "Your combined chlorine ({cc} ppm) requires 10 × {cc} = {target} ppm to burn chloramines.",
        "breakdownFloor": "Floor for {color} = {floor} ppm.",
        "breakdownWinner": "{strategy} wins.",
        "breakdownDose": "Volume {volume} L × ({target} − {currentFC}) ÷ 1000 = {pureGrams} g of pure chlorine",

        "productSection": "Which chlorine do you have available?",
        "productSubtitle": "Your choice changes the amount of product to add.",
        "sodiumName": "Sodium hypochlorite",
        "sodiumDescription": "liquid · raises pH temporarily",
        "calciumName": "Calcium hypochlorite",
        "calciumDescription": "granular · adds calcium hardness",
        "concentrationLabel": "Concentration (%)",
        "densityLabel": "Density (kg/L) — default 1.2",

        "finalKicker": "So you need to use",
        "finalUnitKg": "kg of product",
        "finalUnitL": "L of product",
        "finalUnitMl": "mL of product",
        "finalUnitG": "g of product",

        "sideEffectsTitle": "Effects on water:",
        "sideEffectSalt": "+{value} ppm salt (NaCl)",
        "sideEffectHardness": "+{value} ppm calcium hardness",
        "sideEffectPhUp": "pH rises temporarily",
        "sideEffectPhNeutral": "pH practically unchanged",

        "restartButton": "↺ Start over"
      },

      "Footer": {
        "disclaimer": "Calculations based on the SLAM method (TroubleFreePool) and breakpoint chlorination.\nAlways test the water after circulating and follow product instructions."
      },

      "Warnings": {
        "highCya": "Your CYA ({value} ppm) is very high. Consider partial drain before shocking.",
        "alreadyEnough": "You already have enough free chlorine for this shock level.",
        "lowDose": "The calculated amount is very small. Consider waiting until shock is actually needed."
      }
    }
  },

  "Navigation": {
    "shock": "Shock Calculator",
    "shockDesc": "Calculate exactly how much shock your pool needs."
  }
}
```

Italian values (high-level only — the implementing agent must produce a careful Italian translation that respects pool-owner vernacular):
- title → "Calcolatore Shock Piscina"
- description → "Scopri esattamente quanto cloro versare per lo shock settimanale."
- Intro.title → "Shocka la tua piscina, ogni settimana"
- Intro.subtitle → "2 minuti · ti guidiamo passo dopo passo"
- ... etc.

### 4.6 Public API contracts

#### POST `/api/v1/calculate/chlorine-target`

```jsonc
// Request
{
  "cya": { "known": true, "ppm": 50 },          // or { "known": false }
  "colorLevel": "light_green",
  "combinedCC": 0.4                              // optional
}

// Response (200)
{
  "slamTarget": 20,
  "breakpointTarget": 4,
  "floor": 10,
  "winningStrategy": "slam",
  "targetFC": { "isRange": false, "value": 20, "unit": "ppm" },
  "warnings": []
}
```

#### POST `/api/v1/calculate/chlorine-dose`

```jsonc
// Request
{
  "volume": { "value": 32, "unit": "L" },
  "targetFC": { "isRange": false, "value": 20, "unit": "ppm" },
  "currentFC": { "known": true, "freeFC": 1.5 }
}

// Response
{
  "pureChlorine": { "isRange": false, "value": 592, "unit": "g" },
  "gap": { "isRange": false, "value": 18.5, "unit": "ppm" },
  "warnings": []
}
```

#### POST `/api/v1/calculate/product-conversion`

```jsonc
// Request
{
  "pureChlorineG": { "isRange": false, "value": 592, "unit": "g" },
  "productId": "calcium_hypochlorite",
  "concentrationPct": 65
}

// Response
{
  "amount": { "isRange": false, "value": 0.91, "unit": "kg" },
  "sideEffects": {
    "cyaAddedPpm": 0,
    "hardnessAddedPpm": 13.0,
    "saltAddedPpm": 0,
    "pHEffect": "up"
  }
}
```

#### POST `/api/v1/calculate/pool-volume`

```jsonc
// Request
{
  "shape": "rectangle",
  "dimensions": { "length": 8, "width": 4, "depth": 1.5, "unit": "m" }
}

// Response
{
  "volumeL": 48000,
  "volumeM3": 48,
  "volumeGal": 12680
}
```

#### POST `/api/v1/calculate/shock`

Full input/output as per `ShockInput` / `ShockResult` types in §4.2.1. This is what the frontend calls.

### 4.7 Component-level details

#### `IntroStep.tsx`
- Pure presentational. Reads from `useTranslations('Tools.Shock.Intro')`.
- pH disclaimer in a `Card` with destructive border (`border-l-4 border-l-destructive`).
- pH link target: TBD (probably `/#chemistry`). For MVP: `<Link href="/#chemistry">`.

#### `VolumeStep.tsx`
- Props: `{ volume, onVolumeChange, onUnitChange, onOpenModal }`.
- `NumberInput` from shared/ with placeholder + unit suffix badge.
- Unit toggle uses a Shadcn `ToggleGroup` (or a simple custom segmented like in `chlorine-comparison`).
- "Calcola volume" button → calls `onOpenModal`.

#### `ColorStep.tsx`
- Renders 4 `PoolColorCard` components in a `grid grid-cols-4 md:grid-cols-4 grid-cols-2` (2x2 mobile).
- Cards use `aria-pressed`, fully keyboard-navigable (arrow keys move focus; Enter selects).

#### `PoolColorCard.tsx`
- Props: `{ id, image, label, description, isSelected, onClick }`.
- Uses Tailwind ring/border to indicate selection. Honors dark mode automatically (via CSS vars).

#### `CyaStep.tsx`
- Uses `DontKnowToggle` (segmented control).
- When "I'll enter": shows `NumberInput`. If `value > 100`: red `Warning` block below.
- When "I don't know": shows `ReassureNote`.

#### `ChlorineStep.tsx`
- Uses `DontKnowToggle`.
- When "I'll enter": shows 3 `NumberInput`s. Implements the auto-fill logic locally (or via the hook).
- Auto field has an `auto` Badge in the top-right corner.
- Nudge for CC: when `combinedCC === null`, show a small `<p>` below the row.

#### `ResultStep.tsx`
- Top: pure chlorine big number + range chip if range.
- Middle: concise breakdown text from `t('breakdownSlam'|'breakpoint'|'floor'|'dose')`.
- Then divider.
- Product selector: 2 `ProductCard` radios. Each shows name, description, concentration input (collapsible).
- Bottom card (dark background, primary accent): final product amount + side effects + reset button.
- Handles the "perfect water" branch as a separate render path.

#### `VolumeModal.tsx`
- Wraps `Dialog` from `@/components/ui/dialog` (Radix).
- Header: title + close X.
- Body: placeholder `<div className="h-50 border-dashed">{t('modalPlaceholder')}</div>`.
- Esc, click-outside, X all close.

### 4.8 Navigation entry

```typescript
// src/config/nav-items.ts — add inside tools.children
{
  href: '/tools/shock',
  labelKey: 'shock',
  descriptionKey: 'shockDesc',
  image: '/images/shock_calculator.png',
  icon: Zap,   // import from lucide-react
}
```

---

## 5. Current Situation & Checklist

> Phases are sequential. Inside each phase, sub-tasks can be parallelised.

### Phase 0 — Housekeeping (RULE #0 fixes, mandatory) — ❌

- [ ] **Fix [src/components/AGENTS.md](src/components/AGENTS.md)** Map of Knowledge: `MobileMenu.tsx` description "FAB + Sheet" → "Radix Dialog" (commit `0517da7`).
- [ ] **Fix [ARCHITECTURE.md](ARCHITECTURE.md)**: move `use-local-storage.ts` reference from `/lib` to `/hooks`.
- [ ] **Fix [ARCHITECTURE.md](ARCHITECTURE.md)**: add `/hooks` and `/config` sections to the directory tree.
- [ ] **Fix [AGENTS.md](AGENTS.md)** (root) Map of Knowledge: add `src/hooks/` row pointing to `src/hooks/AGENTS.md` (create that file too — minimal content: scope + map).
- [ ] **Create [src/hooks/AGENTS.md](src/hooks/AGENTS.md)** — minimal: scope, "Hooks live here", map.

### Phase 1 — Pure library (chemistry) — ❌

- [ ] **Create directory** `src/lib/calculator/`.
- [ ] **Move** `src/lib/calculator.ts` content into `src/lib/calculator/chlorine-comparison.ts` (verbatim copy, no logic change).
- [ ] **Delete** `src/lib/calculator.ts`.
- [ ] **Create** `src/lib/calculator/types.ts` per §4.2.1.
- [ ] **Create** `src/lib/calculator/constants.ts` per §4.2.2.
- [ ] **Create** `src/lib/calculator/chlorine-target.ts` — implementation per §4.2.3 + §4.1.1.
- [ ] **Create** `src/lib/calculator/chlorine-dose.ts` — implementation per §4.2.4 + §4.1.2.
- [ ] **Create** `src/lib/calculator/product-conversion.ts` — implementation per §4.2.5 + §4.1.3 + §4.1.4. **Critical**: liquid path uses g/L of available chlorine internally (avoid w/w-vs-w/v confusion).
- [ ] **Create** `src/lib/calculator/pool-volume.ts` — implementation per §4.2.6.
- [ ] **Create** `src/lib/calculator/shock.ts` — implementation per §4.2.7.
- [ ] **Create** `src/lib/calculator/index.ts` — re-exports everything (`export * from './chlorine-comparison'; export * from './chlorine-target'; ...`).
- [ ] **Create** `src/lib/calculator/AGENTS.md` — documents the per-file scope, source citations, and the rule "do not change constants without consulting cited sources".
- [ ] **Verify**: `src/app/api/v1/calculate/chlorine/route.ts` and `src/hooks/use-chlorine-comparison.ts` still import correctly from `@/lib/calculator` (re-export via `index.ts`).

### Phase 2 — Public API endpoints — ❌

- [ ] **Create** `src/app/api/v1/calculate/chlorine-target/route.ts` — POST handler.
- [ ] **Create** `src/app/api/v1/calculate/chlorine-dose/route.ts` — POST handler.
- [ ] **Create** `src/app/api/v1/calculate/product-conversion/route.ts` — POST handler.
- [ ] **Create** `src/app/api/v1/calculate/pool-volume/route.ts` — POST handler.
- [ ] **Create** `src/app/api/v1/calculate/shock/route.ts` — POST wrapper.
- [ ] **Verify** each endpoint with `curl` examples from §4.6.

### Phase 3 — i18n keys — ❌

- [ ] **Add** `Tools.Shock` namespace to `src/messages/en.json` per §4.5.
- [ ] **Add** `Tools.Shock` namespace to `src/messages/it.json` (Italian values, careful pool-owner vernacular).
- [ ] **Add** `Navigation.shock` and `Navigation.shockDesc` to both files.
- [ ] **Verify**: keys parity between en.json and it.json (Andrea may have a `npm` script or check manually).

### Phase 4 — State hook — ❌

- [ ] **Create** `src/lib/shared-state.ts` — exports `SHARED_KEYS` and `TOOL_KEYS` constants.
- [ ] **Create** `src/hooks/use-tool-state.ts` — generic per-tool state hook with bidirectional shared-key sync per §4.3.3.
- [ ] **Create** `src/hooks/use-shock-calculator.ts` — wraps `useToolState` for the shock state shape per §4.3.4. Includes debounced POST to `/api/v1/calculate/shock`.

### Phase 5 — UI shared components — ❌

- [ ] **Create** `src/components/tools/shock/shared/DontKnowToggle.tsx` — segmented control.
- [ ] **Create** `src/components/tools/shock/shared/NumberInput.tsx` — validated input with unit suffix.
- [ ] **Create** `src/components/tools/shock/shared/ReassureNote.tsx` — green "don't know" notice.
- [ ] **Create** `src/components/tools/shock/shared/PoolColorCard.tsx` — selectable card with image.
- [ ] **Create** `src/components/tools/shock/shared/ProductCard.tsx` — radio-style product card.

### Phase 6 — UI step components — ❌

- [ ] **Create** `src/components/tools/shock/IntroStep.tsx`.
- [ ] **Create** `src/components/tools/shock/VolumeStep.tsx`.
- [ ] **Create** `src/components/tools/shock/ColorStep.tsx`.
- [ ] **Create** `src/components/tools/shock/CyaStep.tsx`.
- [ ] **Create** `src/components/tools/shock/ChlorineStep.tsx`.
- [ ] **Create** `src/components/tools/shock/ResultStep.tsx` (handles both normal and "perfect water" branches).
- [ ] **Create** `src/components/tools/shock/VolumeModal.tsx` — empty shell with `Dialog`.

### Phase 7 — Page assembly + reveal logic — ❌

- [ ] **Create** `src/app/[locale]/tools/shock/page.tsx` — `'use client'`, wires the hook to the components, implements reveal predicates.
- [ ] **Implement** smooth scroll-to on initial reveal only (not on every value change).
- [ ] **Implement** "perfect water" branch: skips steps 3-4, shows educational result with optional inline CC input.

### Phase 8 — Navigation + assets — ❌

- [ ] **Add** shock entry to `src/config/nav-items.ts`.
- [ ] **Add** `public/images/shock_calculator.png` (icon for nav menu).
- [ ] **Add** 4 pool color SVGs (or PNGs if Andrea provides photos): `pool-perfect`, `pool-light-green`, `pool-green-brown`, `pool-dark-green`.

### Phase 9 — Documentation update — ❌

- [ ] **Update** `ARCHITECTURE.md` to document the new `src/lib/calculator/` modular structure, the shared localStorage architecture, and the API hierarchy.
- [ ] **Update** `src/lib/AGENTS.md` to reference the `calculator/` subdirectory.
- [ ] **Update** `src/app/AGENTS.md` to mention the modular API pattern under `api/v1/calculate/`.

### Phase 10 — Manual QA — ❌

- [ ] **Volume Step**: enter value, toggle units → value converts. Open modal → opens. Close X/Esc/click-outside → closes.
- [ ] **Color Step**: select Perfect → steps 3-4 hidden, result shows "no shock needed". Select Light green → steps 3-4 appear.
- [ ] **CYA Step (Variant A)**: toggle "Inserisco" → input visible. Toggle "Non lo so" → input hidden, reassure visible. Enter 120 → red warning.
- [ ] **Chlorine Step**: enter FC + CC → TC auto-computes with auto pill. Enter FC + TC → CC auto-computes. Type into TC → it unlocks; next change to FC or CC re-locks it.
- [ ] **Result**: pure chlorine number is correct against the worked examples in §4.1. Range chip appears when any "don't know" is set.
- [ ] **Result**: select Sodium → mL/L unit. Select Calcium → g/kg unit.
- [ ] **Reset**: clears color, "don't know" flags, selected product. Volume, CYA, FC, CC persist (re-load page → values are there).
- [ ] **i18n**: switch locale IT ↔ EN → all visible strings update.
- [ ] **Theme**: dark mode → all components readable, no contrast issues.
- [ ] **Mobile**: pool color cards become 2×2; chlorine row stacks if necessary; volume unit switch remains ergonomic.
- [ ] **A11y**: tab order, screen reader landmarks, ARIA states on segmented controls and selected cards.
- [ ] **API**: `curl` each endpoint, verify shape matches §4.6.

### Phase 11 — Archive — ❌

- [ ] When all success criteria met: move this WIP file to `changelog/2026-06-XX_PoolShockCalculator.md`.
- [ ] Delete the WIP from root.
- [ ] Final pass on `ARCHITECTURE.md` to ensure the new tool is documented.

---

## 6. Success Criteria

The task is considered **DONE** when all of the following hold:

1. ✅ A user can navigate to `/it/tools/shock` (or `/en/tools/shock`) from the main menu.
2. ✅ All 5 visual steps from the wireframe (Variant A) are implemented and revealed progressively.
3. ✅ The "Perfetta" card correctly skips steps 3-4 and shows the educational result; with CC>0.5, the breakpoint suggestion appears.
4. ✅ The CYA "non lo so" toggle and chlorine "non lo so" toggle (Variant A) work end-to-end and switch the result to a range.
5. ✅ Chlorine auto-fill (TC = FC + CC) works in all 3 directions; the auto field is visually marked.
6. ✅ The big numbers (pure chlorine + final product amount) match the worked examples in §4.1 (within ±2% rounding).
7. ✅ Switching between sodium and calcium hypochlorite recomputes correctly using the correct trade-% (w/v) vs weight-% paths.
8. ✅ Side-effects line shows the correct values per §4.1.4.
9. ✅ The breakdown text is always visible and matches the actual computation (no stale UI).
10. ✅ The "Calcola volume" modal opens, displays placeholder, closes via X / Esc / backdrop click.
11. ✅ Reset is a full wipe: clears every field including the shared pool profile (volume, CYA, FC, CC).
12. ✅ After reset + cold reload, all fields stay empty (shared `ph_pool_*` keys were removed too).
13. ✅ All 5 public API endpoints respond with the documented JSON shape and pass spot-check curls.
14. ✅ EN ↔ IT toggle swaps all visible strings; no hardcoded text anywhere in the new components.
15. ✅ Dark mode + mobile breakpoints look correct (no visual regressions).
16. ✅ Existing tools (chlorine-comparison) still work: navigate to `/it/tools/chlorine-comparison`, compute a comparison, verify result is correct (regression check after the calculator.ts refactor).
17. ✅ AGENTS.md housekeeping fixes (§Phase 0) are committed.
18. ✅ `ARCHITECTURE.md`, `src/lib/AGENTS.md`, `src/app/AGENTS.md` updated to reflect the new structure.
19. ✅ This WIP file is moved to `changelog/2026-MM-DD_PoolShockCalculator.md` and deleted from root.

---

## 7. Risks & Open Questions

### Risks
- **R1 — Liquid concentration confusion**: trade % (w/v) vs weight % (w/w) is the #1 dosing-error source in the industry. Mitigated by §4.1.3 explicit guidance and internal g/L storage. The implementing agent must read this section before writing `product-conversion.ts`.
- **R2 — Auto-fill cycle**: the FC/CC/TC auto-fill must not create render loops. Implementation should be careful with `useEffect` dependencies; consider deriving the third value during render rather than in an effect.
- **R3 — Reveal scroll thrashing**: scrolling on every state change makes the tool unusable. Scroll only on **first reveal** of each step (track which steps have been revealed in component state).
- **R4 — localStorage SSR mismatch**: as the existing `useLocalStorage` already handles. The new `useToolState` must preserve this guarantee.
- **R5 — Existing chlorine-comparison breakage**: the calculator.ts → calculator/ refactor must not break imports. Mitigated by the barrel re-export in `index.ts`. **MUST verify** the existing tool still works as part of Phase 10 (success criterion #16).

### Open questions (deferred to implementation time, not blocking)
- **OQ1 — Image format for pool color cards**: SVG (preferred, dark-mode friendly via currentColor) vs Andrea-provided photos (more realistic but heavier). For MVP: use simple SVG illustrations or solid color blocks with a label, photos can come later.
- **OQ2 — pH guide link target**: Currently `/#chemistry`. If a dedicated pH section/page exists later, update the link.
- **OQ3 — When to show the "low dose" warning**: defer to user feedback after MVP ships.
- **OQ4 — Range display strategy**: currently we show both min and max. Should we lead with max ("safest") and offer min as a hover? Defer to user feedback.

---

## 8. References

### Chemistry (consult before changing any constant)
- TFP CYA/FC chart: https://www.troublefreepool.com/blog/2019/01/18/chlorine-cya-chart/
- TFP SLAM method: https://www.troublefreepool.com/blog/2018/12/12/slam-shock-level-and-maintain/
- TFP trade-% vs weight-%: https://www.troublefreepool.com/wiki/index.php?title=Weight_Verses_Trade-_Understanding_Chlorine_Concentrations_in_Different_Sources
- Orenda breakpoint chlorination: https://blog.orendatech.com/breakpoint-chlorination-explained
- PHTA Calcium Hypochlorite: https://www.phta.org/pub/?id=07fd3498-1866-daac-99fb-8824a8f3147b
- PHTA / AQUA Sodium Hypochlorite: https://www.aquamagazine.com/retail/article/15122551/sodium-hypochlorite-aka-liquid-chlorine

### Project artifacts
- Design handoff: `~/Downloads/design_handoff_pool_shock_calculator/` (Variant A).
- Domain knowledge: [testo.md](testo.md).
- Template tool: [chlorine-comparison](src/app/[locale]/tools/chlorine-comparison/page.tsx).

---

*End of WIP — comprehensive. The implementing agent should read this entire document before starting Phase 0.*
