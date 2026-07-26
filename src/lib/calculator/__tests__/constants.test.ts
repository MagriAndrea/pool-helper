import { describe, expect, it } from 'vitest';
import {
  BREAKPOINT_MULTIPLIER,
  CC_HIGH_THRESHOLD,
  COLOR_LEVELS,
  CYA_HIGH_THRESHOLD,
  CYA_UNKNOWN_RANGE,
  DEFAULT_CALCIUM_PCT,
  DEFAULT_SODIUM_DENSITY,
  DEFAULT_SODIUM_TRADE_PCT,
  FC_UNKNOWN_RANGE,
  LITERS_PER_CUBIC_FOOT,
  LITERS_PER_GALLON,
  LOW_DOSE_THRESHOLD,
  METERS_PER_FOOT,
  PRODUCT_COEFFICIENTS,
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
    });
  });
});
