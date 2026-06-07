# src/lib/calculator/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs `src/lib/calculator` — the modular pool-chemistry engine.
2.  **🛑 PURE FUNCTIONS ONLY**: every export is deterministic, no side effects, no I/O, no `Date.now()`. This makes each primitive testable and safe to expose via the API.
3.  **🧪 CONSTANTS ARE SACRED**: all chemistry numbers live in `constants.ts`, each with an inline source citation. **DO NOT** change a constant without consulting the cited source (TFP / Orenda / PHTA / AQUA Magazine). Magic numbers in other files are forbidden — import from `constants.ts`.
4.  **🌍 NO USER-FACING TEXT**: this layer returns **numbers and codes** (e.g. `WarningCode`, `winningStrategy`). It never returns localized prose. The UI formats numbers via next-intl. This keeps i18n in one place.
5.  **📏 UNITS**: internally everything is metric (litres, grams, ppm). Liquid chlorine strength is stored as **g/L of available chlorine** to avoid the trade-% (w/v) vs weight-% (w/w) trap. Conversions live in `units.ts`.
6.  **Composition**: `shock.ts` is the only orchestrator. New tools should reuse the primitives, not duplicate math.

## 2. 🧠 The model (quick reference)

```
target_FC = max( SLAM(0.40 × CYA × colorMultiplier), breakpoint(10 × CC), colorFloor )
gap       = max(0, target_FC − current_FC)
pure_g    = volume_L × gap / 1000           // 1 ppm = 1 mg/L
product   = pure_g / availableChlorineFraction   (solid)
          = pure_g / (g/L) × 1000 mL             (liquid)
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
| `shock.ts` | Orchestrator (target→dose→product) | **Entry point for the shock tool** |
| `chlorine-comparison.ts` | Legacy price comparison (moved here) | **Do not break — chlorine-comparison tool depends on it** |
| `index.ts` | Barrel re-export | **`@/lib/calculator` resolves here** |
