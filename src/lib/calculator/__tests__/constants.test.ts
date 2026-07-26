import { describe, expect, it } from 'vitest';
import {
  BREAKPOINT_MULTIPLIER,
  CC_HIGH_THRESHOLD,
  COLOR_LEVELS,
  CYA_DEGRADATION_RANGE_PPM_PER_MONTH,
  CYA_HIGH_THRESHOLD,
  CYA_IDEAL_RANGE,
  CYA_UNKNOWN_RANGE,
  DAILY_FC_DEMAND_RANGE_PPM,
  DEFAULT_CALCIUM_PCT,
  DEFAULT_CYA_DEGRADATION_PPM_PER_MONTH,
  DEFAULT_DAILY_FC_PPM,
  DEFAULT_DICHLOR_PCT,
  DEFAULT_SODIUM_DENSITY,
  DEFAULT_SODIUM_TRADE_PCT,
  DEFAULT_TRICHLOR_PCT,
  FC_UNKNOWN_RANGE,
  isStabilizedProduct,
  LITERS_PER_CUBIC_FOOT,
  LITERS_PER_GALLON,
  LOW_DOSE_THRESHOLD,
  MAINTENANCE_FC_ABSOLUTE_MIN,
  MAINTENANCE_FC_MIN_RATIO,
  MAINTENANCE_FC_TARGET_RATIO,
  METERS_PER_FOOT,
  PRODUCT_COEFFICIENTS,
  PRODUCT_IDS,
  PRODUCT_RETAIL_FORMS,
  SHOCK_PRODUCT_IDS,
  SLAM_CYA_RATIO,
} from '../constants';

/**
 * Pins the cited chemistry constants so a silent edit fails a test.
 * See `src/lib/calculator/constants.ts` for the sources (TFP / Orenda / PHTA / AQUA Magazine).
 */
describe('constants: cited chemistry values stay pinned', () => {
  it('keeps the SLAM ratio at 0.40 x CYA (TroubleFreePool)', () => {
    expect(SLAM_CYA_RATIO).toBe(0.4);
  });

  it('keeps the breakpoint multiplier at 10x combined chlorine (Orenda)', () => {
    expect(BREAKPOINT_MULTIPLIER).toBe(10);
  });

  it('keeps the color-level multiplier and floor table intact', () => {
    expect(COLOR_LEVELS).toEqual({
      perfect: { multiplier: null, floor: null },
      light_green: { multiplier: 1.0, floor: 10 },
      green_brown: { multiplier: 1.5, floor: 15 },
      dark_green: { multiplier: 2.5, floor: 20 },
    });
  });

  it('keeps the "don\'t know" fallback ranges', () => {
    expect(CYA_UNKNOWN_RANGE).toEqual({ min: 30, max: 80 });
    expect(FC_UNKNOWN_RANGE).toEqual({ min: 0, max: 2 });
  });

  it('keeps the warning thresholds', () => {
    expect(CYA_HIGH_THRESHOLD).toBe(100);
    expect(CC_HIGH_THRESHOLD).toBe(0.5);
    expect(LOW_DOSE_THRESHOLD).toBe(50);
  });

  it('keeps the unit conversion factors', () => {
    expect(LITERS_PER_GALLON).toBe(3.78541);
    expect(LITERS_PER_CUBIC_FOOT).toBe(28.3168);
    expect(METERS_PER_FOOT).toBe(0.3048);
  });

  it('keeps the product defaults', () => {
    expect(DEFAULT_SODIUM_TRADE_PCT).toBe(13);
    expect(DEFAULT_CALCIUM_PCT).toBe(65);
    expect(DEFAULT_SODIUM_DENSITY).toBe(1.2);
  });

  it('keeps the stoichiometric side-effect coefficients per product', () => {
    expect(PRODUCT_COEFFICIENTS).toEqual({
      sodium_hypochlorite: { cyaPerPpm: 0, hardnessPerPpm: 0, saltPerPpm: 0.82, pHEffect: 'up' },
      calcium_hypochlorite: { cyaPerPpm: 0, hardnessPerPpm: 0.7, saltPerPpm: 0, pHEffect: 'up' },
      trichlor: { cyaPerPpm: 0.6, hardnessPerPpm: 0, saltPerPpm: 0, pHEffect: 'down' },
      dichlor: { cyaPerPpm: 0.9, hardnessPerPpm: 0, saltPerPpm: 0, pHEffect: 'neutral' },
    });
  });

  it('keeps the stabilized products stabilized, and the others not', () => {
    // The whole maintenance tool hangs off this distinction: a cyaPerPpm that
    // silently went to 0 would make a dichlor habit look harmless.
    expect(isStabilizedProduct('trichlor')).toBe(true);
    expect(isStabilizedProduct('dichlor')).toBe(true);
    expect(isStabilizedProduct('sodium_hypochlorite')).toBe(false);
    expect(isStabilizedProduct('calcium_hypochlorite')).toBe(false);
  });

  it('never offers a stabilized product for shocking', () => {
    // A shock dose of trichlor or dichlor delivers tens of ppm of CYA at once.
    // `ShockProductId` blocks it at compile time; this catches the LIST drifting.
    expect(SHOCK_PRODUCT_IDS.some(isStabilizedProduct)).toBe(false);
    expect([...SHOCK_PRODUCT_IDS].sort()).toEqual(
      PRODUCT_IDS.filter((id) => !isStabilizedProduct(id)).sort(),
    );
  });

  it('keeps the routine-chlorine ratios and the absolute floor (TFP / CDC)', () => {
    expect(MAINTENANCE_FC_MIN_RATIO).toBe(0.075);
    expect(MAINTENANCE_FC_TARGET_RATIO).toBe(0.115);
    expect(MAINTENANCE_FC_ABSOLUTE_MIN).toBe(2);
  });

  it('keeps the ideal CYA band distinct from the unknown range and the high threshold', () => {
    expect(CYA_IDEAL_RANGE).toEqual({ min: 30, max: 50 });
    // Three different ideas that must never collapse into one another: where you
    // want to be, what might already be in the water, and when to dilute.
    expect(CYA_IDEAL_RANGE.max).toBeLessThan(CYA_UNKNOWN_RANGE.max);
    expect(CYA_UNKNOWN_RANGE.max).toBeLessThan(CYA_HIGH_THRESHOLD);
  });

  it('keeps the CYA degradation and daily-demand figures', () => {
    expect(CYA_DEGRADATION_RANGE_PPM_PER_MONTH).toEqual({ min: 2, max: 10 });
    expect(DAILY_FC_DEMAND_RANGE_PPM).toEqual({ min: 2, max: 4 });
    expect(DEFAULT_DAILY_FC_PPM).toBe(3);
    // The default degradation is the LOW end on purpose: under-estimating how
    // much CYA leaves makes the projection warn early rather than late.
    expect(DEFAULT_CYA_DEGRADATION_PPM_PER_MONTH).toBe(CYA_DEGRADATION_RANGE_PPM_PER_MONTH.min);
  });

  it('keeps the retail form of each product (drives the L/kg choice in the comparison tool)', () => {
    expect(PRODUCT_RETAIL_FORMS).toEqual({
      sodium_hypochlorite: {
        form: 'liquid',
        typicalConcentrationPct: 13,
        typicalDensityKgL: 1.2,
      },
      calcium_hypochlorite: {
        form: 'solid',
        typicalConcentrationPct: 65,
      },
      trichlor: {
        form: 'solid',
        typicalConcentrationPct: 90,
      },
      dichlor: {
        form: 'solid',
        typicalConcentrationPct: 56,
      },
    });
  });

  it('keeps the stabilized product strengths (theory agrees with the labels)', () => {
    // Trichlor: 3 x 70.906 / 232.41 = 91.5%, sold as ">= 90%".
    // Dichlor dihydrate: 2 x 70.906 / 255.98 = 55.4%, sold as "56%".
    expect(DEFAULT_TRICHLOR_PCT).toBe(90);
    expect(DEFAULT_DICHLOR_PCT).toBe(56);
  });

  it('lists every product in PRODUCT_IDS (the picker order the type system cannot check)', () => {
    // Guards the one place adding a product can silently go unnoticed: a missing
    // entry here hides the product from every picker without failing the build.
    expect([...PRODUCT_IDS].sort()).toEqual(Object.keys(PRODUCT_RETAIL_FORMS).sort());
    expect([...PRODUCT_IDS].sort()).toEqual(Object.keys(PRODUCT_COEFFICIENTS).sort());
  });

  it('derives the retail prefill hints from the cited product defaults, not from fresh numbers', () => {
    expect(PRODUCT_RETAIL_FORMS.sodium_hypochlorite.typicalConcentrationPct).toBe(
      DEFAULT_SODIUM_TRADE_PCT,
    );
    expect(PRODUCT_RETAIL_FORMS.calcium_hypochlorite.typicalConcentrationPct).toBe(
      DEFAULT_CALCIUM_PCT,
    );
    const sodium = PRODUCT_RETAIL_FORMS.sodium_hypochlorite;
    if (sodium.form !== 'liquid') throw new Error('sodium hypochlorite must stay a liquid');
    expect(sodium.typicalDensityKgL).toBe(DEFAULT_SODIUM_DENSITY);
  });
});
