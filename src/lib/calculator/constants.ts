/**
 * Chemistry constants — the single source of truth.
 *
 * 🛑 DO NOT change any number here without consulting the cited source.
 * Every value is cross-checked against TFP / Orenda / PHTA / AQUA Magazine and,
 * where applicable, verified against theoretical stoichiometry.
 */

import type { ColorLevel, ProductId, SideEffects } from './types';

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

// --- Side effects per 1 ppm FC added (verified stoichiometrically) ----------
// Calcium hardness: 100.09 (CaCO₃) ÷ (2 × 70.906 av Cl₂) = 0.706
// Salt (NaCl):      58.44 (NaCl)  ÷ 70.906 (Cl₂ equiv)   = 0.824
export interface ProductCoefficients {
  cyaPerPpm: number;
  hardnessPerPpm: number;
  saltPerPpm: number;
  pHEffect: SideEffects['pHEffect'];
}

export const PRODUCT_COEFFICIENTS: Record<ProductId, ProductCoefficients> = {
  sodium_hypochlorite: { cyaPerPpm: 0, hardnessPerPpm: 0, saltPerPpm: 0.82, pHEffect: 'up' },
  calcium_hypochlorite: { cyaPerPpm: 0, hardnessPerPpm: 0.7, saltPerPpm: 0, pHEffect: 'up' },
};
