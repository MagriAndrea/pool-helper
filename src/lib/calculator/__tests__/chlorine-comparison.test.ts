import { describe, expect, it } from 'vitest';
import {
  calculateCalciumMetrics,
  calculateSodiumMetrics,
  compareChemicals,
} from '../chlorine-comparison';

describe('chlorine-comparison: calculateCalciumMetrics', () => {
  it('computes active mass and price per active kg for a valid input', () => {
    // activeMass = 10 * 0.65 = 6.5; pricePerActiveKg = 50 / 6.5 = 7.6923...
    const result = calculateCalciumMetrics({ price: 50, weight: 10, concentration: 65 });
    expect(result.type).toBe('CALCIUM');
    expect(result.isValid).toBe(true);
    expect(result.grossMass).toBe(10);
    expect(result.activeMass).toBeCloseTo(6.5, 10);
    expect(result.pricePerActiveKg).toBeCloseTo(7.6923076923, 9);
  });

  it.each([
    ['price', { price: 0, weight: 10, concentration: 65 }],
    ['negative price', { price: -5, weight: 10, concentration: 65 }],
    ['weight', { price: 50, weight: 0, concentration: 65 }],
    ['concentration', { price: 50, weight: 10, concentration: 0 }],
  ])('returns isValid: false with zeroed metrics when %s is non-positive', (_label, input) => {
    const result = calculateCalciumMetrics(input);
    expect(result).toEqual({
      type: 'CALCIUM',
      grossMass: 0,
      activeMass: 0,
      pricePerActiveKg: 0,
      isValid: false,
    });
  });
});

describe('chlorine-comparison: calculateSodiumMetrics', () => {
  it('converts litres to kg via density when unit is "l"', () => {
    // grossMass = 20 * 1.2 = 24; activeMass = 24 * 0.14 = 3.36; price/active = 20/3.36 = 5.9523...
    const result = calculateSodiumMetrics({
      price: 20,
      quantity: 20,
      unit: 'l',
      density: 1.2,
      concentration: 14,
    });
    expect(result.type).toBe('SODIUM');
    expect(result.isValid).toBe(true);
    expect(result.grossMass).toBeCloseTo(24, 10);
    expect(result.activeMass).toBeCloseTo(3.36, 10);
    expect(result.pricePerActiveKg).toBeCloseTo(5.9523809524, 9);
  });

  it('uses grossMass = quantity directly when unit is "kg" (no density conversion)', () => {
    // activeMass = 15 * 0.10 = 1.5; pricePerActiveKg = 20/1.5 = 13.333...
    const result = calculateSodiumMetrics({
      price: 20,
      quantity: 15,
      unit: 'kg',
      concentration: 10,
    });
    expect(result.grossMass).toBe(15);
    expect(result.activeMass).toBeCloseTo(1.5, 10);
    expect(result.pricePerActiveKg).toBeCloseTo(13.3333333333, 9);
  });

  it('falls back to DEFAULT_SODIUM_DENSITY (1.2) when density is omitted for a liquid', () => {
    // grossMass = 10 * 1.2 = 12; activeMass = 12 * 0.13 = 1.56
    const result = calculateSodiumMetrics({
      price: 13,
      quantity: 10,
      unit: 'l',
      concentration: 13,
    });
    expect(result.grossMass).toBeCloseTo(12, 10);
    expect(result.activeMass).toBeCloseTo(1.56, 10);
  });

  it('falls back to DEFAULT_SODIUM_DENSITY when density is 0 or negative (both are falsy/invalid)', () => {
    const zeroDensity = calculateSodiumMetrics({
      price: 13,
      quantity: 10,
      unit: 'l',
      density: 0,
      concentration: 13,
    });
    const negativeDensity = calculateSodiumMetrics({
      price: 13,
      quantity: 10,
      unit: 'l',
      density: -2,
      concentration: 13,
    });
    // Same result as the "omitted density" case above (falls back to 1.2).
    expect(zeroDensity.grossMass).toBeCloseTo(12, 10);
    expect(negativeDensity.grossMass).toBeCloseTo(12, 10);
  });

  it.each([
    ['price', { price: 0, quantity: 10, unit: 'l' as const, concentration: 13 }],
    ['quantity', { price: 13, quantity: 0, unit: 'l' as const, concentration: 13 }],
    ['concentration', { price: 13, quantity: 10, unit: 'l' as const, concentration: 0 }],
  ])('returns isValid: false with zeroed metrics when %s is non-positive', (_label, input) => {
    const result = calculateSodiumMetrics(input);
    expect(result).toEqual({
      type: 'SODIUM',
      grossMass: 0,
      activeMass: 0,
      pricePerActiveKg: 0,
      isValid: false,
    });
  });
});

describe('chlorine-comparison: compareChemicals', () => {
  it('declares calcium the winner when its price per active kg is lower', () => {
    const calcium = calculateCalciumMetrics({ price: 10, weight: 10, concentration: 65 }); // 1.538/kg
    const sodium = calculateSodiumMetrics({ price: 20, quantity: 20, unit: 'l', density: 1.2, concentration: 14 }); // 5.952/kg
    const result = compareChemicals(calcium, sodium);
    expect(result.winner).toBe('CALCIUM');
    expect(result.savingsPerKg).toBeCloseTo(sodium.pricePerActiveKg - calcium.pricePerActiveKg, 9);
    expect(result.savingsPerKg).toBeGreaterThan(0);
  });

  it('declares sodium the winner when its price per active kg is lower', () => {
    const calcium = calculateCalciumMetrics({ price: 50, weight: 10, concentration: 65 }); // 7.692/kg
    const sodium = calculateSodiumMetrics({ price: 20, quantity: 20, unit: 'l', density: 1.2, concentration: 14 }); // 5.952/kg
    const result = compareChemicals(calcium, sodium);
    expect(result.winner).toBe('SODIUM');
    expect(result.savingsPerKg).toBeCloseTo(calcium.pricePerActiveKg - sodium.pricePerActiveKg, 9);
  });

  it('declares a DRAW when both price per active kg values are exactly equal', () => {
    const calcium = calculateCalciumMetrics({ price: 65, weight: 10, concentration: 65 }); // 10/kg
    const sodium = calculateSodiumMetrics({ price: 10, quantity: 10, unit: 'kg', concentration: 10 }); // 10/kg
    expect(calcium.pricePerActiveKg).toBe(sodium.pricePerActiveKg);
    const result = compareChemicals(calcium, sodium);
    expect(result.winner).toBe('DRAW');
    expect(result.savingsPerKg).toBe(0);
  });

  it('returns winner: null when the calcium side is invalid, but still passes both metrics through', () => {
    const calcium = calculateCalciumMetrics({ price: 0, weight: 10, concentration: 65 });
    const sodium = calculateSodiumMetrics({ price: 20, quantity: 20, unit: 'l', density: 1.2, concentration: 14 });
    const result = compareChemicals(calcium, sodium);
    expect(result.winner).toBeNull();
    expect(result.savingsPerKg).toBe(0);
    expect(result.calcium).toEqual(calcium);
    expect(result.sodium).toEqual(sodium);
  });

  it('returns winner: null when the sodium side is invalid, but still passes both metrics through', () => {
    const calcium = calculateCalciumMetrics({ price: 50, weight: 10, concentration: 65 });
    const sodium = calculateSodiumMetrics({ price: 20, quantity: 0, unit: 'l', concentration: 14 });
    const result = compareChemicals(calcium, sodium);
    expect(result.winner).toBeNull();
    expect(result.savingsPerKg).toBe(0);
  });

  it('reproduces the worked example from scripts/verify-logic.ts exactly (calcium 10kg/50e/65% vs sodium 20L/20e/14%/density 1.2)', () => {
    const calcium = calculateCalciumMetrics({ weight: 10, price: 50, concentration: 65 });
    const sodium = calculateSodiumMetrics({
      quantity: 20,
      unit: 'l',
      price: 20,
      concentration: 14,
      density: 1.2,
    });

    expect(calcium.grossMass).toBe(10);
    expect(calcium.activeMass).toBeCloseTo(6.5, 10);
    expect(calcium.pricePerActiveKg).toBeCloseTo(7.69, 2);

    expect(sodium.grossMass).toBeCloseTo(24, 10);
    expect(sodium.activeMass).toBeCloseTo(3.36, 10);
    expect(sodium.pricePerActiveKg).toBeCloseTo(5.95, 2);

    const comparison = compareChemicals(calcium, sodium);
    expect(comparison.winner).toBe('SODIUM');
    // 7.6923076923... - 5.9523809524... = 1.7399267399...
    expect(comparison.savingsPerKg).toBeCloseTo(1.74, 2);
    // Full precision, reproducible exactly by the Phase B refactor:
    expect(comparison.savingsPerKg).toBeCloseTo(1.7399267399267409, 12);
  });
});
