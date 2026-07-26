import { describe, expect, it } from 'vitest';
import { calculateProductMetrics, compareProducts } from '../chlorine-comparison';
import type { ComparisonProductInput } from '../types';

const solid = (
  overrides: Partial<ComparisonProductInput> = {},
): ComparisonProductInput => ({
  productId: 'calcium_hypochlorite',
  price: 50,
  quantity: 10,
  unit: 'kg',
  concentration: 65,
  ...overrides,
});

const liquid = (
  overrides: Partial<ComparisonProductInput> = {},
): ComparisonProductInput => ({
  productId: 'sodium_hypochlorite',
  price: 20,
  quantity: 20,
  unit: 'l',
  density: 1.2,
  concentration: 14,
  ...overrides,
});

describe('chlorine-comparison: calculateProductMetrics', () => {
  it('weighs a solid product directly (no density involved)', () => {
    // activeMass = 10 * 0.65 = 6.5; pricePerActiveKg = 50 / 6.5 = 7.6923...
    const result = calculateProductMetrics(solid());
    expect(result.productId).toBe('calcium_hypochlorite');
    expect(result.isValid).toBe(true);
    expect(result.grossMass).toBe(10);
    expect(result.activeMass).toBeCloseTo(6.5, 10);
    expect(result.pricePerActiveKg).toBeCloseTo(7.6923076923, 9);
  });

  it('converts litres to kg via density for a liquid product', () => {
    // grossMass = 20 * 1.2 = 24; activeMass = 24 * 0.14 = 3.36; 20/3.36 = 5.9523...
    const result = calculateProductMetrics(liquid());
    expect(result.productId).toBe('sodium_hypochlorite');
    expect(result.isValid).toBe(true);
    expect(result.grossMass).toBeCloseTo(24, 10);
    expect(result.activeMass).toBeCloseTo(3.36, 10);
    expect(result.pricePerActiveKg).toBeCloseTo(5.9523809524, 9);
  });

  it('uses quantity as-is when a liquid is sold by weight (unit "kg")', () => {
    // activeMass = 15 * 0.10 = 1.5; pricePerActiveKg = 20/1.5 = 13.333...
    const result = calculateProductMetrics(
      liquid({ quantity: 15, unit: 'kg', concentration: 10, density: undefined }),
    );
    expect(result.grossMass).toBe(15);
    expect(result.activeMass).toBeCloseTo(1.5, 10);
    expect(result.pricePerActiveKg).toBeCloseTo(13.3333333333, 9);
  });

  it("falls back to the product's typical density (1.2 kg/L) when density is omitted", () => {
    // grossMass = 10 * 1.2 = 12; activeMass = 12 * 0.13 = 1.56
    const result = calculateProductMetrics(
      liquid({ price: 13, quantity: 10, concentration: 13, density: undefined }),
    );
    expect(result.grossMass).toBeCloseTo(12, 10);
    expect(result.activeMass).toBeCloseTo(1.56, 10);
  });

  it("prefers the label's own density over the typical one", () => {
    // Deliberately NOT 1.2: a test that only ever passes the typical density
    // cannot tell "uses the label" apart from "ignores the label".
    // grossMass = 10 * 1.35 = 13.5; activeMass = 13.5 * 0.14 = 1.89
    const result = calculateProductMetrics(liquid({ quantity: 10, density: 1.35 }));
    expect(result.grossMass).toBeCloseTo(13.5, 10);
    expect(result.activeMass).toBeCloseTo(1.89, 10);
    // And it really differs from what the typical density would have given.
    const typical = calculateProductMetrics(liquid({ quantity: 10, density: undefined }));
    expect(result.grossMass).not.toBeCloseTo(typical.grossMass, 5);
  });

  it('falls back to the typical density when density is 0 or negative', () => {
    const zeroDensity = calculateProductMetrics(
      liquid({ price: 13, quantity: 10, concentration: 13, density: 0 }),
    );
    const negativeDensity = calculateProductMetrics(
      liquid({ price: 13, quantity: 10, concentration: 13, density: -2 }),
    );
    // Same result as the "omitted density" case above.
    expect(zeroDensity.grossMass).toBeCloseTo(12, 10);
    expect(negativeDensity.grossMass).toBeCloseTo(12, 10);
  });

  it.each([
    ['price', { price: 0 }],
    ['negative price', { price: -5 }],
    ['quantity', { quantity: 0 }],
    ['concentration', { concentration: 0 }],
  ])('reports the slot incomplete when %s is non-positive', (_label, overrides) => {
    expect(calculateProductMetrics(solid(overrides))).toEqual({
      productId: 'calcium_hypochlorite',
      grossMass: 0,
      activeMass: 0,
      pricePerActiveKg: 0,
      isValid: false,
    });
  });

  it('reports the slot incomplete when a SOLID product is priced by the litre', () => {
    // A solid has no litres. Rejected rather than converted with a borrowed density.
    expect(calculateProductMetrics(solid({ unit: 'l' }))).toEqual({
      productId: 'calcium_hypochlorite',
      grossMass: 0,
      activeMass: 0,
      pricePerActiveKg: 0,
      isValid: false,
    });
  });

  it('still accepts an explicit density for a solid sold by weight (density is simply unused)', () => {
    const withDensity = calculateProductMetrics(solid({ density: 0.8 }));
    const withoutDensity = calculateProductMetrics(solid());
    expect(withDensity).toEqual(withoutDensity);
  });
});

describe('chlorine-comparison: compareProducts', () => {
  it('declares slot A the winner when its cost per active kg is lower', () => {
    const slotA = calculateProductMetrics(solid({ price: 10 })); // 10/6.5 = 1.538/kg
    const slotB = calculateProductMetrics(liquid()); // 5.952/kg
    const result = compareProducts(slotA, slotB);
    expect(result.winner).toBe('A');
    expect(result.savingsPerKg).toBeCloseTo(4.4139194139, 9);
    expect(result.savingsPerKg).toBeGreaterThan(0);
  });

  it('declares slot B the winner when its cost per active kg is lower', () => {
    const slotA = calculateProductMetrics(solid()); // 7.692/kg
    const slotB = calculateProductMetrics(liquid()); // 5.952/kg
    const result = compareProducts(slotA, slotB);
    expect(result.winner).toBe('B');
    expect(result.savingsPerKg).toBeCloseTo(1.7399267399, 9);
  });

  it('declares a DRAW when both costs per active kg are exactly equal', () => {
    const slotA = calculateProductMetrics(solid({ price: 65 })); // 65/6.5 = 10/kg
    const slotB = calculateProductMetrics(
      liquid({ price: 10, quantity: 10, unit: 'kg', concentration: 10, density: undefined }),
    ); // 10/1 = 10/kg
    expect(slotA.pricePerActiveKg).toBe(slotB.pricePerActiveKg);
    const result = compareProducts(slotA, slotB);
    expect(result.winner).toBe('DRAW');
    expect(result.savingsPerKg).toBe(0);
  });

  it('returns winner: null when slot A is incomplete, but passes both metrics through', () => {
    const slotA = calculateProductMetrics(solid({ price: 0 }));
    const slotB = calculateProductMetrics(liquid());
    const result = compareProducts(slotA, slotB);
    expect(result.winner).toBeNull();
    expect(result.savingsPerKg).toBe(0);
    expect(result.slotA).toEqual(slotA);
    expect(result.slotB).toEqual(slotB);
  });

  it('returns winner: null when slot B is incomplete', () => {
    const slotA = calculateProductMetrics(solid());
    const slotB = calculateProductMetrics(liquid({ quantity: 0 }));
    const result = compareProducts(slotA, slotB);
    expect(result.winner).toBeNull();
    expect(result.savingsPerKg).toBe(0);
  });
});

describe('chlorine-comparison: same-type comparisons (the reason for slots)', () => {
  it('compares two sodium hypochlorites and names the winning SLOT, not the chemical', () => {
    // A: 20 L × 1.2 = 24 kg × 14% = 3.36 kg active → 20/3.36 = 5.9523809524
    // B: 25 L × 1.2 = 30 kg × 13% = 3.9 kg active  → 22/3.9  = 5.6410256410
    const slotA = calculateProductMetrics(liquid());
    const slotB = calculateProductMetrics(liquid({ price: 22, quantity: 25, concentration: 13 }));
    expect(slotA.productId).toBe(slotB.productId);

    const result = compareProducts(slotA, slotB);
    expect(result.winner).toBe('B');
    expect(result.savingsPerKg).toBeCloseTo(0.3113553114, 9);
  });

  it('compares two calcium hypochlorites and names the winning SLOT', () => {
    // A: 10 kg × 65% = 6.5 kg active → 50/6.5 = 7.6923076923
    // B:  5 kg × 70% = 3.5 kg active → 20/3.5 = 5.7142857143
    const slotA = calculateProductMetrics(solid());
    const slotB = calculateProductMetrics(solid({ price: 20, quantity: 5, concentration: 70 }));
    expect(slotA.productId).toBe(slotB.productId);

    const result = compareProducts(slotA, slotB);
    expect(result.winner).toBe('B');
    expect(result.savingsPerKg).toBeCloseTo(1.978021978, 9);
  });

  it('lets the cheaper bulk pack lose to a smaller, more concentrated one', () => {
    // The whole point of the tool: 25 kg for 60 EUR at 20% is worse value than
    // 10 kg for 50 EUR at 65%, despite the lower price per gross kg.
    const bulk = calculateProductMetrics(solid({ price: 60, quantity: 25, concentration: 20 }));
    const concentrated = calculateProductMetrics(solid());
    expect(bulk.grossMass).toBeGreaterThan(concentrated.grossMass);

    const result = compareProducts(bulk, concentrated);
    expect(result.winner).toBe('B'); // 60/5 = 12/kg vs 50/6.5 = 7.69/kg
    expect(result.savingsPerKg).toBeCloseTo(4.3076923077, 9);
  });
});

describe('chlorine-comparison: parity with the pre-slot model', () => {
  it('reproduces the pre-refactor worked example to the last bit (calcium 10kg/50e/65% vs sodium 20L/20e/14%/density 1.2)', () => {
    // Frozen by the Phase A characterization suite against the old
    // calculateCalciumMetrics / calculateSodiumMetrics / compareChemicals.
    const slotA = calculateProductMetrics(solid());
    const slotB = calculateProductMetrics(liquid());

    expect(slotA.grossMass).toBe(10);
    expect(slotA.activeMass).toBeCloseTo(6.5, 10);
    expect(slotA.pricePerActiveKg).toBeCloseTo(7.69, 2);

    expect(slotB.grossMass).toBeCloseTo(24, 10);
    expect(slotB.activeMass).toBeCloseTo(3.36, 10);
    expect(slotB.pricePerActiveKg).toBeCloseTo(5.95, 2);

    const comparison = compareProducts(slotA, slotB);
    // Old model said winner: 'SODIUM' — the sodium product now sits in slot B.
    expect(comparison.winner).toBe('B');
    expect(comparison.savingsPerKg).toBeCloseTo(1.74, 2);
    // Exact float recorded before the refactor; must not drift.
    expect(comparison.savingsPerKg).toBe(1.7399267399267409);
  });
});
