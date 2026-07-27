# src/lib/calculator/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs `src/lib/calculator` — the modular pool-chemistry engine.
2.  **🛑 PURE FUNCTIONS ONLY**: every export is deterministic, no side effects, no I/O, no `Date.now()`. This makes each primitive testable and safe to expose via the API.
3.  **🧪 CONSTANTS ARE SACRED**: all chemistry numbers live in `constants.ts`, each with an inline source citation. **DO NOT** change a constant without consulting the cited source (TFP / Orenda / PHTA / AQUA Magazine). Magic numbers in other files are forbidden — import from `constants.ts`.
4.  **🌍 NO USER-FACING TEXT**: this layer returns **numbers and codes** (e.g. `WarningCode`, `winningStrategy`). It never returns localized prose. The UI formats numbers via next-intl. This keeps i18n in one place.
5.  **📏 UNITS**: internally everything is metric (litres, grams, ppm). Liquid chlorine strength is stored as **g/L of available chlorine** to avoid the trade-% (w/v) vs weight-% (w/w) trap. Conversions live in `units.ts`.
6.  **Composition**: `shock.ts` is the only orchestrator. New tools should reuse the primitives, not duplicate math.
7.  **➕ ADDING A PRODUCT** means four edits, and TypeScript only catches three of them: `ProductId` in `types.ts`, then `PRODUCT_COEFFICIENTS` and `PRODUCT_RETAIL_FORMS` in `constants.ts` (both exhaustive `Record`s, so the compiler will demand them), and finally `PRODUCT_IDS` — the picker order, which the compiler **cannot** check. A test in `constants.test.ts` guards that last one; if it fails, you forgot the list, not the test. A product carrying cyanuric acid also belongs in `StabilizedProductId`, which then removes it from `ShockProductId` automatically (rule #9).
8.  **🎰 THE COMPARISON IS SLOT-KEYED, NOT PRODUCT-KEYED**: `chlorine-comparison.ts` compares slot A against slot B, each holding any product, and reports the winner as `'A' | 'B' | 'DRAW' | null`. Never reintroduce a winner identified by chemical — the whole point is that both slots may hold the *same* product, where a chemical name answers nothing.
9.  **🧨 STABILIZED CHLORINE MUST NEVER REACH THE SHOCK CALCULATOR.** A shock dose of trichlor or dichlor delivers *tens* of ppm of cyanuric acid in one go — the exact failure this project exists to prevent (`testo.md`, "Stabilizzante"). Three layers enforce it and none is redundant: the `ShockProductId` type (derived by exclusion, so future stabilized products are locked out automatically), `shockProductIdSchema` at the public API boundary, and a `constants.test.ts` check that `SHOCK_PRODUCT_IDS` never contains a product with `cyaPerPpm > 0`. **Do not "simplify" any of them into `ProductId`/`productIdSchema`.**
10. **🌞 CYA IS DESTROYED BY CHLORINE, NOT BY THE SUN.** Sun and heat only set the pace: UV breaks chlorine down, and the hydroxyl radicals released attack the CYA. Any user-facing copy must say it that way — "the sun eats your stabilizer" is wrong and would be published as fact. And however it is worded, a reader must never conclude they can wait a high CYA out: at 3 ppm FC/day dichlor adds **~81 ppm CYA per month** against **2-10 ppm/month** of loss.
11. **📉 A PROJECTION THAT CANNOT HAPPEN RETURNS `null`, NEVER `Infinity`.** `cya-projection.ts` subtracts degradation, so the net is zero or negative for unstabilized products — there is genuinely no date to project. `weeksToCeiling: null` plus `trend: 'stable' | 'falling'` is the answer, and it is a useful one.

## 2. 🧠 The model (quick reference)

Shock (one-off recovery):

```
target_FC = max( SLAM(0.40 × CYA × colorMultiplier), breakpoint(10 × CC), colorFloor )
gap       = max(0, target_FC − current_FC)
pure_g    = volume_L × gap / 1000           // 1 ppm = 1 mg/L
product   = pure_g / availableChlorineFraction   (solid)
          = pure_g / (g/L) × 1000 mL             (liquid)
```

Maintenance (every day), all three ratios from the same TFP table as the 0.40 above:

```
min_FC    = max(0.075 × CYA, 2 ppm)         // below this, algae outpaces chlorine
target_FC = max(0.115 × CYA, min_FC)        // where you actually aim
cya_week  = dailyFC × cyaPerPpm × 7 − monthlyDegradation × 7/30
```

Ranges appear when the user answers "I don't know" to CYA (→ 30–80 ppm) and/or
current chlorine (→ FC 0–2 ppm). See `range.ts`.

## 3. 🗺️ Map of Knowledge

| File | Content | AI Agent Action |
|------|---------|-----------------|
| `types.ts` | All shared types/enums | **Import types from here** |
| `constants.ts` | Cited chemistry constants | **Never hardcode numbers elsewhere** |
| `range.ts` | `RangeOrValue` helpers + rounding | **Use `makeRange`/`makeValue`/`lo`/`hi`** |
| `units.ts` | Volume/length conversions | **Use `toLiters`, `convertVolume`** |
| `chlorine-target.ts` | Target FC from CYA + color + CC | Primitive #1 |
| `chlorine-dose.ts` | Pure chlorine grams from gap × volume | Primitive #2 |
| `product-conversion.ts` | Product amount + side effects | Primitive #3 |
| `pool-volume.ts` | Volume from shape + dimensions | Standalone primitive |
| `maintenance-target.ts` | Routine FC from CYA (7.5% floor, 11.5% target) + the two-tier CYA warnings | Primitive #4 |
| `cya-projection.ts` | Where CYA is heading: accumulation − degradation, week by week | **See rules #10 and #11** |
| `shock.ts` | Orchestrator (target→dose→product) | **Entry point for the shock tool** |
| `chlorine-maintenance.ts` | Orchestrator (maintenance-target→dose→product, + projection) | **Entry point for the maintenance tool** |
| `chlorine-comparison.ts` | Cost per kg of active chlorine, two generic A/B slots | **See rule #8 — slot-keyed, never product-keyed** |
| `index.ts` | Barrel re-export | **`@/lib/calculator` resolves here** |
| `__tests__/` | Vitest characterization suite | **Run `npx vitest run` before AND after any change here** |
