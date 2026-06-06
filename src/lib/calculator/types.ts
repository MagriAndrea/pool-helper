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

/** Shock products. Stabilized chlorine (trichlor/dichlor) is intentionally excluded. */
export type ProductId = 'sodium_hypochlorite' | 'calcium_hypochlorite';

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
  | 'LOW_DOSE'; // computed product amount impractically small

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
    id: ProductId;
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
