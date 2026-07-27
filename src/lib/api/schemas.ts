/**
 * Zod validation schemas for the pool-chemistry calculation API
 * (`src/app/api/v1/calculate/**`).
 *
 * SINGLE SOURCE OF TRUTH for two consumers:
 *   1. Runtime request validation in the route handlers (via `src/lib/api/validate.ts`).
 *   2. The generated OpenAPI 3.1 spec, derived FROM these schemas.
 *
 * Changing a schema here changes both the runtime behaviour and the public
 * API contract — treat edits accordingly (see `src/lib/api/AGENTS.md`).
 *
 * Every literal/enum and object shape mirrors `src/lib/calculator/types.ts`
 * and `src/lib/calculator/chlorine-comparison.ts` exactly. Route handlers
 * pass `z.infer<typeof someSchema>` straight into the calculator functions —
 * `npx tsc --noEmit` will fail if a schema and its matching TS type drift
 * apart.
 *
 * Export names are a hard contract consumed by the OpenAPI generator — do
 * not rename them without updating that generator too.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Literal / enum schemas (mirror src/lib/calculator/types.ts exactly)
// ---------------------------------------------------------------------------

/** `Unit` — volume unit. */
export const unitSchema = z.enum(['L', 'gal']);

/** `LengthUnit` — pool-dimension unit. */
export const lengthUnitSchema = z.enum(['m', 'ft']);

/** `ColorLevel` — Step 2 water-condition tiers. `perfect` needs no algae shock. */
export const colorLevelSchema = z.enum(['perfect', 'light_green', 'green_brown', 'dark_green']);

/** `ProductId` — every product the calculator knows, stabilized ones included. */
export const productIdSchema = z.enum([
  'sodium_hypochlorite',
  'calcium_hypochlorite',
  'trichlor',
  'dichlor',
]);

/**
 * `ShockProductId` — deliberately NARROWER than `productIdSchema`.
 *
 * 🛑 Do not "simplify" this into `productIdSchema`. A shock dose of trichlor or
 * dichlor delivers tens of ppm of cyanuric acid in a single go, which is the
 * exact failure this project exists to prevent. The `ShockProductId` type blocks
 * it inside our code; this schema blocks it at the public API boundary.
 */
export const shockProductIdSchema = z.enum(['sodium_hypochlorite', 'calcium_hypochlorite']);

/** `PoolShape`. */
export const poolShapeSchema = z.enum(['rectangle', 'circle']);

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * `VolumeInput`. `value` is strictly positive: a zero/negative pool volume is
 * physically meaningless and no client (`use-pool-volume.ts`, `use-shock-calculator.ts`)
 * ever submits one — both guard with `value <= 0` before building the request.
 */
export const volumeInputSchema = z.object({
  value: z.number().positive(),
  unit: unitSchema,
});

/**
 * `CyaInput` — either "I don't know" or a measured ppm reading. 0 ppm is a
 * legitimate real-world CYA reading, so `ppm` is `.nonnegative()`, not `.positive()`.
 */
export const cyaInputSchema = z.discriminatedUnion('known', [
  z.object({ known: z.literal(false) }),
  z.object({ known: z.literal(true), ppm: z.number().nonnegative() }),
]);

/**
 * `ChlorineInput` — either "I don't know" or measured free (+ optional combined)
 * chlorine. Both are `.nonnegative()` (0 ppm is a valid reading). `combinedCC`
 * mirrors the TS type exactly: optional AND nullable (`number | null`, and the
 * key may be absent entirely).
 */
export const chlorineInputSchema = z.discriminatedUnion('known', [
  z.object({ known: z.literal(false) }),
  z.object({
    known: z.literal(true),
    freeFC: z.number().nonnegative(),
    combinedCC: z.number().nonnegative().nullable().optional(),
  }),
]);

// ---------------------------------------------------------------------------
// Range-or-value
// ---------------------------------------------------------------------------

/**
 * `RangeOrValue<TUnit>` — a deterministic value or a min/max range,
 * discriminated on `isRange`, parameterised over a unit literal/enum schema
 * (e.g. `z.literal('ppm')`, `z.literal('g')`, a product-unit enum, ...).
 *
 * All quantities modelled here (ppm gaps, grams of pure chlorine, product
 * amounts) are physical amounts that can legitimately be zero (e.g. "no
 * chlorine needed"), so bounds use `.nonnegative()` rather than `.positive()`.
 *
 * Adds one check beyond the bare TS type: for a range, `max` must be >= `min`
 * (a reasonable correctness constraint the hand-written type doesn't encode).
 */
export function rangeOrValueSchema<TUnitSchema extends z.ZodTypeAny>(unit: TUnitSchema) {
  return z.discriminatedUnion('isRange', [
    z.object({
      isRange: z.literal(false),
      value: z.number().nonnegative(),
      unit,
    }),
    // The `max >= min` check lives on the range branch itself, where TS already
    // knows `min`/`max` exist — refining the whole union instead would need a
    // cast, because a generic unit schema shared by both branches stops TS
    // distributing the discriminated union through the mapped output type.
    z
      .object({
        isRange: z.literal(true),
        min: z.number().nonnegative(),
        max: z.number().nonnegative(),
        unit,
      })
      .refine((range) => range.max >= range.min, {
        message: '`max` must be >= `min`',
        path: ['max'],
      }),
  ]);
}

// ---------------------------------------------------------------------------
// chlorine-target
// ---------------------------------------------------------------------------

/** `ChlorineTargetInput`. */
export const chlorineTargetInputSchema = z.object({
  cya: cyaInputSchema,
  colorLevel: colorLevelSchema,
  combinedCC: z.number().nonnegative().nullable().optional(),
});

// ---------------------------------------------------------------------------
// chlorine-dose
// ---------------------------------------------------------------------------

/** `ChlorineDoseInput`. No client calls this route directly today (only the
 * `shock` orchestrator uses the underlying primitive internally); it's
 * validated the same way for direct API consumers. */
export const chlorineDoseInputSchema = z.object({
  volume: volumeInputSchema,
  targetFC: rangeOrValueSchema(z.literal('ppm')),
  currentFC: chlorineInputSchema,
});

// ---------------------------------------------------------------------------
// product-conversion
// ---------------------------------------------------------------------------

/**
 * `ProductConversionInput`. `concentrationPct` and `densityKgL` are tightened
 * to strictly positive: a 0%/negative concentration or density is physically
 * meaningless, `concentrationPct` is capped at 100 (it's a percentage), and no
 * client sends 0/undefined for either during normal use — `densityKgL` isn't
 * sent by any client at all (see `src/hooks/use-shock-calculator.ts`'s
 * `buildProduct`, which omits it), and `concentrationPct` defaults to the
 * positive `DEFAULT_SODIUM_TRADE_PCT` / `DEFAULT_CALCIUM_PCT` constants.
 */
export const productConversionInputSchema = z.object({
  pureChlorineG: rangeOrValueSchema(z.literal('g')),
  productId: productIdSchema,
  concentrationPct: z.number().positive().max(100),
  densityKgL: z.number().positive().optional(),
  deltaFC: rangeOrValueSchema(z.literal('ppm')),
});

// ---------------------------------------------------------------------------
// pool-volume
// ---------------------------------------------------------------------------

const rectangleDimsSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  depth: z.number().positive(),
  unit: lengthUnitSchema,
});

const circleDimsSchema = z.object({
  diameter: z.number().positive(),
  depth: z.number().positive(),
  unit: lengthUnitSchema,
});

/**
 * `PoolVolumeInput`. Discriminated on `shape` so a `circle` payload cannot be
 * validated with rectangle dimensions (or vice versa) — previously the route
 * accepted any dims for any shape and silently computed garbage. All
 * dimensions are strictly positive: `use-pool-volume.ts`'s `buildVolumeInput`
 * already guards every dimension with `<= 0` before sending a request.
 */
export const poolVolumeInputSchema = z.discriminatedUnion('shape', [
  z.object({ shape: z.literal('rectangle'), dimensions: rectangleDimsSchema }),
  z.object({ shape: z.literal('circle'), dimensions: circleDimsSchema }),
]);

// ---------------------------------------------------------------------------
// shock (orchestrator)
// ---------------------------------------------------------------------------

/** `ShockInput`. */
export const shockInputSchema = z.object({
  volume: volumeInputSchema,
  colorLevel: colorLevelSchema,
  cya: cyaInputSchema,
  chlorine: chlorineInputSchema,
  product: z.object({
    id: shockProductIdSchema, // narrower than productIdSchema on purpose
    concentrationPct: z.number().positive().max(100),
    densityKgL: z.number().positive().optional(),
  }),
});

// ---------------------------------------------------------------------------
// chlorine-maintenance
// ---------------------------------------------------------------------------

/**
 * `ChlorineMaintenanceInput`.
 *
 * `product.id` is the FULL `productIdSchema`, unlike the shock endpoint: routine
 * dosing with trichlor or dichlor is exactly the habit this tool is built to
 * measure, so refusing it here would refuse the question.
 *
 * `dailyFcPpm` is `.positive()`: a pool consuming 0 ppm/day does not exist, and
 * the projection divides by the resulting rate. `projectionWeeks` is capped so a
 * caller cannot ask for a million-row response.
 */
export const chlorineMaintenanceInputSchema = z.object({
  volume: volumeInputSchema,
  cya: cyaInputSchema,
  currentFC: chlorineInputSchema,
  product: z.object({
    id: productIdSchema,
    concentrationPct: z.number().positive().max(100),
    densityKgL: z.number().positive().optional(),
  }),
  dailyFcPpm: z.number().positive().max(20),
  projectionWeeks: z.number().int().positive().max(104),
});

// ---------------------------------------------------------------------------
// chlorine-comparison
// ---------------------------------------------------------------------------

/**
 * `ComparisonProductInput` (from `src/lib/calculator/chlorine-comparison.ts`) —
 * one of the two comparison slots.
 *
 * 🛑 MUST accept 0 for `price`/`quantity`: `use-chlorine-comparison.ts`
 * initialises both slots to `{ price: 0, quantity: 0 }` and fires a debounced
 * POST to this endpoint immediately on mount. `calculateProductMetrics` already
 * handles `<= 0` gracefully by returning `isValid: false` — the schema must not
 * 400 what the calculator is designed to accept. `density` follows the same
 * reasoning (`<= 0` falls back to the product's typical density inside the
 * calculator, it is never a validation error). `concentration` is capped at 100
 * (it's a percentage) but otherwise nonnegative for the same zero-on-mount reason.
 *
 * A solid product priced by the litre is accepted here too, and reported
 * `isValid: false` by the calculator rather than rejected: same zero-on-mount
 * reasoning, plus the UI may briefly hold a stale unit while the user switches
 * a slot's product type.
 */
const comparisonSlotSchema = z.object({
  productId: productIdSchema,
  price: z.number().nonnegative(),
  quantity: z.number().nonnegative(),
  unit: z.enum(['l', 'kg']),
  density: z.number().nonnegative().optional(),
  concentration: z.number().nonnegative().max(100),
});

/** `{ slotA, slotB }` — the `/chlorine` comparison endpoint. */
export const chlorineComparisonInputSchema = z.object({
  slotA: comparisonSlotSchema,
  slotB: comparisonSlotSchema,
});
