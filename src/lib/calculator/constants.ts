/**
 * Chemistry constants — the single source of truth.
 *
 * 🛑 DO NOT change any number here without consulting the cited source.
 * Every value is cross-checked against TFP / Orenda / PHTA / AQUA Magazine and,
 * where applicable, verified against theoretical stoichiometry.
 */

import type {
  ColorLevel,
  ProductForm,
  ProductId,
  ShockProductId,
  SideEffects,
} from './types';

// --- SLAM (TroubleFreePool) -------------------------------------------------
// Shock FC target ≈ 40% of CYA.
// https://www.troublefreepool.com/wiki/index.php?title=CYA_Chlorine_Relationship
export const SLAM_CYA_RATIO = 0.4;

// --- Breakpoint chlorination (Orenda / industry standard) -------------------
// Raise FC to ~10× combined chlorine to oxidize chloramines past breakpoint.
// Labeled a rule-of-thumb (Falk argues true demand is ~0.5–3× CC).
// https://blog.orendatech.com/breakpoint-chlorination-explained
export const BREAKPOINT_MULTIPLIER = 10;

// --- Color level multipliers + floors ---------------------------------------
// Tuned to combine SLAM with the retail "lbs per 10k gal" severity tradition.
export const COLOR_LEVELS: Record<
  ColorLevel,
  { multiplier: number | null; floor: number | null }
> = {
  perfect: { multiplier: null, floor: null }, // no algae shock
  light_green: { multiplier: 1.0, floor: 10 },
  green_brown: { multiplier: 1.5, floor: 15 },
  dark_green: { multiplier: 2.5, floor: 20 },
};

// --- "Don't know" fallback ranges -------------------------------------------
export const CYA_UNKNOWN_RANGE = { min: 30, max: 80 }; // typical pool population
export const FC_UNKNOWN_RANGE = { min: 0, max: 2 }; // 0 = worst case, 2 = normal

// --- Routine (non-shock) chlorine, as a fraction of CYA ----------------------
// TFP publishes the whole ladder as percentages of CYA. Read from the primary
// wiki page, which also states the 40% shock figure SLAM_CYA_RATIO encodes:
//   "Min FC" is 7.5% of the CYA level / "Target FC" is 11.5% of the CYA level
// https://www.troublefreepool.com/wiki/index.php?title=CYA_Chlorine_Relationship
export const MAINTENANCE_FC_MIN_RATIO = 0.075;
export const MAINTENANCE_FC_TARGET_RATIO = 0.115;
// TFP's published table never drops below 2 ppm, even at CYA 20-30 where 7.5%
// would give 1.5-2.25: sub-2 targets are impractical to test and hold. The CDC
// Model Aquatic Health Code independently sets a flat 2.0 ppm minimum for
// venues using CYA. https://www.cdc.gov/healthy-swimming/
export const MAINTENANCE_FC_ABSOLUTE_MIN = 2;

// --- CYA: where you want to be ----------------------------------------------
// Ideal band for a MANUALLY chlorinated pool: PHTA/APSP-11 gives 30-50 ppm ideal
// (100 max), TFP recommends 30-50 for liquid/tablet chlorination. Salt-water
// pools want ~70-80 and are out of scope — see the disclaimer.
// https://www.troublefreepool.com/wiki/index.php?title=CYA
// 🛑 NOT the same thing as CYA_UNKNOWN_RANGE, which describes what is plausibly
// ALREADY in the water (it can far exceed this) rather than where you want it.
export const CYA_IDEAL_RANGE = { min: 30, max: 50 };

// --- CYA loss ----------------------------------------------------------------
// CYA is NOT destroyed by the sun directly — it is destroyed by CHLORINE, and
// sun and heat only set the pace. UV breaks chlorine down and the hydroxyl
// radicals released attack the CYA: 2 to 10 ppm/month depending on exposure.
// (Heat adds a second path, chlorine oxidizing CYA directly, roughly doubling
// per +10°F, but only evident above ~90°F/32°C — above typical Italian pool
// water, so it is deliberately not modelled.)
// https://www.troublefreepool.com/wiki/index.php?title=CYA
export const CYA_DEGRADATION_RANGE_PPM_PER_MONTH = { min: 2, max: 10 };
// The LOW end is the default on purpose: under-estimating how much CYA leaves
// makes the projection warn early rather than late, the safe direction for a
// tool whose whole job is catching silent CYA creep.
export const DEFAULT_CYA_DEGRADATION_PPM_PER_MONTH = CYA_DEGRADATION_RANGE_PPM_PER_MONTH.min;

// --- Daily chlorine demand (drives the CYA projection) -----------------------
// "the average pool in most areas will lose 2-4 ppm FC per day" in season,
// driven mainly by UV, then heat and bather load.
// https://www.troublefreepool.com/wiki/index.php?title=CYA
// The midpoint is a PLANNING ASSUMPTION, not a measurement: a user can measure
// their own (test FC, add nothing, retest 24h later) and the tool must let them.
export const DAILY_FC_DEMAND_RANGE_PPM = { min: 2, max: 4 };
export const DEFAULT_DAILY_FC_PPM = 3;

/** Calendar conversions for the projection. Arithmetic, not chemistry. */
export const DAYS_PER_WEEK = 7;
export const DAYS_PER_MONTH = 30;

// --- Warning thresholds ------------------------------------------------------
export const CYA_HIGH_THRESHOLD = 100; // above this, TFP recommends dilution
export const CC_HIGH_THRESHOLD = 0.5; // above this you have a chloramine problem
export const LOW_DOSE_THRESHOLD = 50; // grams/mL below which a dose is impractical

// --- Unit conversions --------------------------------------------------------
export const LITERS_PER_GALLON = 3.78541; // US liquid gallon
export const LITERS_PER_CUBIC_FOOT = 28.3168;
export const METERS_PER_FOOT = 0.3048;

// --- Product defaults --------------------------------------------------------
export const DEFAULT_SODIUM_TRADE_PCT = 13; // typical Italian pool-grade liquid
export const DEFAULT_CALCIUM_PCT = 65; // typical retail cal-hypo
export const DEFAULT_SODIUM_DENSITY = 1.2; // kg/L, only used for weight-% input
// Trichlor tablets: theory gives 212.72 g available Cl₂ / 232.41 g/mol = 91.5%,
// and the label spec is "at least 0.90 pounds of available chlorine per pound".
// https://www.phta.org/ (PHTA "Trichlor: The Dependable Pool Performer")
export const DEFAULT_TRICHLOR_PCT = 90;
// Dichlor granules, dihydrate (the common retail form): 141.81 / 255.98 = 55.4%,
// sold as "56% available chlorine". Anhydrous grades run ~62% — same CYA ratio,
// different strength, so a user must read their own label.
export const DEFAULT_DICHLOR_PCT = 56;

// --- Side effects per 1 ppm FC added (verified stoichiometrically) ----------
// Calcium hardness: 100.09 (CaCO₃) ÷ (2 × 70.906 av Cl₂) = 0.706
// Salt (NaCl):      58.44 (NaCl)  ÷ 70.906 (Cl₂ equiv)   = 0.824
export interface ProductCoefficients {
  cyaPerPpm: number;
  hardnessPerPpm: number;
  saltPerPpm: number;
  pHEffect: SideEffects['pHEffect'];
}

// Stabilized products, verified stoichiometrically by the same method. Each
// active N–Cl bond is equivalent to one whole Cl₂ (70.906 g) of available
// chlorine — the industry definition behind every "% available chlorine" label,
// which makes both figures checkable against any datasheet:
//   Trichlor (C₃Cl₃N₃O₃, 232.41): 129.075 (CYA) ÷ (3 × 70.906) = 0.607
//   Dichlor  (SDIC·2H₂O, 255.98): 129.075 (CYA) ÷ (2 × 70.906) = 0.910
// The trichlor figure is also published directly by PHTA ("adds 0.6 ppm of
// cyanuric acid for each ppm of available chlorine added"), agreeing with the
// derivation to 3 significant figures. https://www.phta.org/
// Dichlor's ratio is the same for the anhydrous form: the water of
// crystallization dilutes the strength, not the CYA:Cl₂ molar relationship.
export const PRODUCT_COEFFICIENTS: Record<ProductId, ProductCoefficients> = {
  sodium_hypochlorite: { cyaPerPpm: 0, hardnessPerPpm: 0, saltPerPpm: 0.82, pHEffect: 'up' },
  calcium_hypochlorite: { cyaPerPpm: 0, hardnessPerPpm: 0.7, saltPerPpm: 0, pHEffect: 'up' },
  // Trichlor dissolves strongly acidic (pH ≈ 2.8-3.0) and pulls pH and TA down.
  trichlor: { cyaPerPpm: 0.6, hardnessPerPpm: 0, saltPerPpm: 0, pHEffect: 'down' },
  // Dichlor dissolves near-neutral (pH ≈ 6-7) with no noticeable TA impact.
  dichlor: { cyaPerPpm: 0.9, hardnessPerPpm: 0, saltPerPpm: 0, pHEffect: 'neutral' },
};

// --- How each product is sold in shops --------------------------------------
// Physical form decides whether a volume price is even meaningful: a solid has
// no litres. `typicalConcentrationPct` / `typicalDensityKgL` are prefill hints
// for the UI — the user must always read their own label. Both reuse the cited
// product defaults above; no new numbers are introduced here.
//
// A discriminated union, not an optional field: `typicalDensityKgL` exists only
// where a density means something, so consumers narrow instead of asserting.
export type ProductRetailForm =
  | { form: Extract<ProductForm, 'solid'>; typicalConcentrationPct: number }
  | {
      form: Extract<ProductForm, 'liquid'>;
      typicalConcentrationPct: number;
      typicalDensityKgL: number;
    };

// Canonical display order for product pickers. TypeScript cannot check that this
// list is complete, so `constants.test.ts` asserts it covers every product —
// add new products here as well as to the records above.
export const PRODUCT_IDS: readonly ProductId[] = [
  'calcium_hypochlorite',
  'sodium_hypochlorite',
  'trichlor',
  'dichlor',
];

/**
 * Products the shock calculator offers. Stabilized chlorine is excluded on
 * purpose: a shock dose of trichlor or dichlor delivers tens of ppm of CYA in
 * one go. `ShockProductId` makes the exclusion a compile error rather than a
 * convention, and `constants.test.ts` checks this list against that type.
 */
export const SHOCK_PRODUCT_IDS: readonly ShockProductId[] = [
  'calcium_hypochlorite',
  'sodium_hypochlorite',
];

export const PRODUCT_RETAIL_FORMS: Record<ProductId, ProductRetailForm> = {
  sodium_hypochlorite: {
    form: 'liquid',
    typicalConcentrationPct: DEFAULT_SODIUM_TRADE_PCT,
    typicalDensityKgL: DEFAULT_SODIUM_DENSITY,
  },
  calcium_hypochlorite: {
    form: 'solid',
    typicalConcentrationPct: DEFAULT_CALCIUM_PCT,
  },
  trichlor: {
    form: 'solid',
    typicalConcentrationPct: DEFAULT_TRICHLOR_PCT,
  },
  dichlor: {
    form: 'solid',
    typicalConcentrationPct: DEFAULT_DICHLOR_PCT,
  },
};

/** Does this product carry cyanuric acid into the water with every dose? */
export function isStabilizedProduct(productId: ProductId): boolean {
  return PRODUCT_COEFFICIENTS[productId].cyaPerPpm > 0;
}
