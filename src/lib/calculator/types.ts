/**
 * Shared types for the modular pool-chemistry calculator.
 *
 * Every calculation primitive (chlorine-target, chlorine-dose,
 * product-conversion, pool-volume) consumes/produces these types so they can be
 * composed by the `shock` orchestrator and exposed individually via the API.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export type Unit = 'L' | 'gal';
export type LengthUnit = 'm' | 'ft';

/** Water condition tiers (Step 2). `perfect` means no algae shock is needed. */
export type ColorLevel = 'perfect' | 'light_green' | 'green_brown' | 'dark_green';

/** Every chlorine product the calculator knows about. */
export type ProductId =
  | 'sodium_hypochlorite'
  | 'calcium_hypochlorite'
  | 'trichlor'
  | 'dichlor';

/**
 * Products that carry cyanuric acid into the water with every dose. They are the
 * reason the maintenance tool exists, and the reason they must never reach the
 * shock calculator: shock doses are large enough to wreck a pool's CYA in one
 * afternoon.
 */
export type StabilizedProductId = 'trichlor' | 'dichlor';

/**
 * Products the shock calculator accepts. Derived by exclusion rather than listed,
 * so a future stabilized product is locked out of shocking the moment it joins
 * `StabilizedProductId` — no second edit to remember, no way to forget.
 */
export type ShockProductId = Exclude<ProductId, StabilizedProductId>;

/** Physical form a product is sold in. Liquids need a density to be weighed. */
export type ProductForm = 'solid' | 'liquid';

export interface VolumeInput {
  value: number;
  unit: Unit;
}

/** Cyanuric acid input — either a measured value or "I don't know". */
export type CyaInput = { known: false } | { known: true; ppm: number };

/**
 * Current chlorine input — either measured (free + optional combined) or
 * "I don't know". Free chlorine is required when known; combined is optional.
 */
export type ChlorineInput =
  | { known: false }
  | { known: true; freeFC: number; combinedCC?: number | null };

// ---------------------------------------------------------------------------
// Range-or-value
// ---------------------------------------------------------------------------

/**
 * A result that is either a single deterministic value or a min–max range.
 * Ranges appear whenever the user answered "I don't know" to CYA and/or chlorine.
 */
export type RangeOrValue<TUnit extends string = string> =
  | { isRange: false; value: number; unit: TUnit }
  | { isRange: true; min: number; max: number; unit: TUnit };

export type MassUnit = 'g' | 'kg';
export type LiquidUnit = 'mL' | 'L';
export type ProductUnit = MassUnit | LiquidUnit;

// ---------------------------------------------------------------------------
// Warnings
// ---------------------------------------------------------------------------

export type WarningCode =
  | 'CYA_HIGH' // CYA > threshold: dilution recommended before shocking
  | 'FC_ALREADY_SUFFICIENT' // current FC already >= target, no shock needed
  | 'CC_HIGH' // combined chlorine > 0.5 ppm: breakpoint reasoning surfaced
  | 'LOW_DOSE' // computed product amount impractically small
  | 'CYA_ABOVE_IDEAL' // CYA past the ideal ceiling but below CYA_HIGH_THRESHOLD
  | 'CYA_LOCK_RISK' // a stabilized product is in use while CYA is already too high
  | 'CYA_UNKNOWN_ASSUMED'; // the maintenance target was computed from the fallback range

// ---------------------------------------------------------------------------
// chlorine-target
// ---------------------------------------------------------------------------

export type TargetStrategy = 'slam' | 'breakpoint' | 'floor' | 'none';

export interface ChlorineTargetInput {
  cya: CyaInput;
  colorLevel: ColorLevel;
  /** Combined chlorine (ppm); enables the breakpoint candidate when > 0. */
  combinedCC?: number | null;
}

export interface ChlorineTargetResult {
  /** SLAM candidate (0.40 × CYA × colorMultiplier). null for `perfect`. */
  slamTarget: number | null;
  /** Breakpoint candidate (10 × CC). null when CC not provided. */
  breakpointTarget: number | null;
  /** Minimum floor for the color level. null for `perfect`. */
  floor: number | null;
  /** Which candidate produced the final target. */
  winningStrategy: TargetStrategy;
  /** Final target FC. null when no shock is needed (perfect water, no high CC). */
  targetFC: RangeOrValue<'ppm'> | null;
  warnings: WarningCode[];
}

// ---------------------------------------------------------------------------
// chlorine-dose
// ---------------------------------------------------------------------------

export interface ChlorineDoseInput {
  volume: VolumeInput;
  targetFC: RangeOrValue<'ppm'>;
  currentFC: ChlorineInput;
}

export interface ChlorineDoseResult {
  /** ppm of FC to add (target − current), floored at 0. */
  gap: RangeOrValue<'ppm'>;
  /** grams of pure available chlorine needed. */
  pureChlorine: RangeOrValue<'g'>;
  warnings: WarningCode[];
}

// ---------------------------------------------------------------------------
// product-conversion
// ---------------------------------------------------------------------------

export interface ProductConversionInput {
  pureChlorineG: RangeOrValue<'g'>;
  productId: ProductId;
  /** For calcium: weight %. For sodium: trade % (w/v) unless densityKgL is set. */
  concentrationPct: number;
  /** Only for sodium when concentration is given as weight % (w/w). */
  densityKgL?: number;
  /** ppm of FC being added — drives the side-effect coefficients. */
  deltaFC: RangeOrValue<'ppm'>;
}

export interface SideEffects {
  cyaAddedPpm: number;
  hardnessAddedPpm: number;
  saltAddedPpm: number;
  pHEffect: 'up' | 'down' | 'neutral';
}

export interface ProductConversionResult {
  amount: RangeOrValue<ProductUnit>;
  sideEffects: SideEffects;
}

// ---------------------------------------------------------------------------
// pool-volume
// ---------------------------------------------------------------------------

export type PoolShape = 'rectangle' | 'circle';

export interface RectangleDims {
  length: number;
  width: number;
  depth: number;
  unit: LengthUnit;
}

export interface CircleDims {
  diameter: number;
  depth: number;
  unit: LengthUnit;
}

export interface PoolVolumeResult {
  volumeL: number;
  volumeM3: number;
  volumeGal: number;
}

// ---------------------------------------------------------------------------
// shock (orchestrator)
// ---------------------------------------------------------------------------

export interface ShockInput {
  volume: VolumeInput;
  colorLevel: ColorLevel;
  cya: CyaInput;
  chlorine: ChlorineInput;
  product: {
    /** Unstabilized only — see `ShockProductId`. */
    id: ShockProductId;
    concentrationPct: number;
    densityKgL?: number;
  };
}

/**
 * Numeric breakdown for the always-visible "transparency" UI. The UI formats
 * these numbers into localized sentences via next-intl placeholders — the
 * library never produces user-facing prose (i18n rule).
 */
export interface ShockBreakdown {
  /** CYA value actually used (point estimate); null if perfect or unknown-range. */
  cyaUsed: number | null;
  cyaAssumed: boolean;
  colorLevel: ColorLevel;
  multiplier: number | null;
  slamTarget: number | null;
  breakpointTarget: number | null;
  floor: number | null;
  winningStrategy: TargetStrategy;
  targetFC: RangeOrValue<'ppm'> | null;
  volumeL: number;
  /** point estimate of current free chlorine, or null if unknown. */
  currentFC: number | null;
  currentFCAssumed: boolean;
  gap: RangeOrValue<'ppm'> | null;
  pureChlorine: RangeOrValue<'g'> | null;
}

export interface ShockResult {
  isNoShockNeeded: boolean;
  target: ChlorineTargetResult;
  dose: ChlorineDoseResult | null;
  product: ProductConversionResult | null;
  breakdown: ShockBreakdown;
  warnings: WarningCode[];
}

// ---------------------------------------------------------------------------
// maintenance-target
// ---------------------------------------------------------------------------

export interface MaintenanceTargetInput {
  cya: CyaInput;
}

/**
 * Routine (non-shock) chlorine levels for a given CYA. Two numbers, not one:
 * `minFC` is where chlorine starts losing to algae, `targetFC` is where you aim
 * so that a hot day or a pool party does not push you under it.
 */
export interface MaintenanceTargetResult {
  /** Never go below this. `max(ratio × CYA, absolute floor)`. */
  minFC: RangeOrValue<'ppm'>;
  /** What to actually aim for day to day. Always >= `minFC`. */
  targetFC: RangeOrValue<'ppm'>;
  /** True when the absolute floor decided `minFC`, not the CYA ratio. */
  floorApplied: boolean;
  /** CYA actually used; null when the user did not know it. */
  cyaUsed: number | null;
  warnings: WarningCode[];
}

// ---------------------------------------------------------------------------
// cya-projection
// ---------------------------------------------------------------------------

/** Which way CYA is heading under the current habits. */
export type CyaTrend = 'rising' | 'stable' | 'falling';

export interface CyaProjectionInput {
  /** Where CYA is today (ppm). */
  currentCyaPpm: number;
  /** The product used for routine chlorination. */
  productId: ProductId;
  /** Free chlorine the pool consumes per day (ppm). */
  dailyFcPpm: number;
  /** Sunlight-driven CYA loss (ppm/month). Defaults to the cited conservative value. */
  degradationPpmPerMonth?: number;
  /** How far ahead to project. */
  weeks: number;
  /** Level treated as "out of range". Defaults to the ideal band's ceiling. */
  ceilingPpm?: number;
}

export interface CyaProjectionPoint {
  week: number;
  cyaPpm: number;
}

export interface CyaProjectionResult {
  /** Net change per week: accumulation minus degradation. Can be negative. */
  netPpmPerWeek: number;
  /** CYA gained per week from the product alone, before degradation. */
  addedPpmPerWeek: number;
  /** CYA lost per week to sunlight. */
  degradedPpmPerWeek: number;
  points: CyaProjectionPoint[];
  /**
   * Weeks until `ceilingPpm` is crossed. `null` when CYA is stable or falling —
   * an unstabilized product adds none, so there is no date to project.
   */
  weeksToCeiling: number | null;
  trend: CyaTrend;
  warnings: WarningCode[];
}

// ---------------------------------------------------------------------------
// chlorine-maintenance (orchestrator)
// ---------------------------------------------------------------------------

export interface ChlorineMaintenanceInput {
  volume: VolumeInput;
  cya: CyaInput;
  currentFC: ChlorineInput;
  product: {
    /** Any product, stabilized included — routine dosing is where they belong. */
    id: ProductId;
    concentrationPct: number;
    densityKgL?: number;
  };
  /** Free chlorine the pool consumes per day (ppm). Drives the projection. */
  dailyFcPpm: number;
  /** How far ahead to project CYA. */
  projectionWeeks: number;
}

/** Numbers for the always-visible "how we got here" panel. */
export interface MaintenanceBreakdown {
  volumeL: number;
  cyaUsed: number | null;
  cyaAssumed: boolean;
  currentFC: number | null;
  currentFCAssumed: boolean;
  gap: RangeOrValue<'ppm'> | null;
  pureChlorine: RangeOrValue<'g'> | null;
  dailyFcPpm: number;
}

export interface ChlorineMaintenanceResult {
  target: MaintenanceTargetResult;
  /** null when free chlorine is already at or above target. */
  dose: ChlorineDoseResult | null;
  product: ProductConversionResult | null;
  /**
   * null when CYA is unknown. A projection needs a measured starting point —
   * running it on the fallback range would invent a countdown out of a guess.
   */
  projection: CyaProjectionResult | null;
  /** True when current FC already clears the target: nothing to add today. */
  isAtTarget: boolean;
  breakdown: MaintenanceBreakdown;
  warnings: WarningCode[];
}

// ---------------------------------------------------------------------------
// chlorine-comparison
// ---------------------------------------------------------------------------

/**
 * Which of the two comparison slots is being referred to.
 *
 * The comparison is deliberately slot-keyed, not product-keyed: identifying the
 * winner as `'A'`/`'B'` is the only way to compare two products of the *same*
 * type (two sodium hypochlorites, two calcium hypochlorites).
 */
export type ComparisonSlotId = 'A' | 'B';

/** Unit a product is sold in, as printed on the shop label. */
export type ProductSaleUnit = 'l' | 'kg';

/** One side of the comparison: a product as it appears on a shop shelf. */
export interface ComparisonProductInput {
  productId: ProductId;
  price: number;
  /** Package size: litres when `unit` is `'l'`, kilograms when `'kg'`. */
  quantity: number;
  unit: ProductSaleUnit;
  /** kg/L, liquids only. Falls back to the product's typical density. */
  density?: number;
  /** Active chlorine on the label, as a percentage 0-100. */
  concentration: number;
}

export interface ComparisonProductMetrics {
  productId: ProductId;
  grossMass: number; // kg
  activeMass: number; // kg of pure available chlorine
  pricePerActiveKg: number; // currency per kg of active chlorine
  isValid: boolean;
}

export interface ComparisonResult {
  /** `null` while either slot is incomplete. */
  winner: ComparisonSlotId | 'DRAW' | null;
  savingsPerKg: number;
  slotA: ComparisonProductMetrics;
  slotB: ComparisonProductMetrics;
}
