/**
 * Chlorine product comparison — cost per kilogram of ACTIVE chlorine.
 *
 * Two generic slots (A and B), each holding any supported product. One metrics
 * function serves every product; the winner is identified by *slot*, which is
 * what makes same-type comparisons (two sodium hypochlorites, two calcium
 * hypochlorites) possible at all.
 */

import { PRODUCT_RETAIL_FORMS } from './constants';
import type {
  ComparisonProductInput,
  ComparisonProductMetrics,
  ComparisonResult,
  ComparisonSlotId,
} from './types';

/**
 * Converts one product into comparable metrics.
 *
 * Liquids priced by the litre are weighed via density (the label's, or the
 * product's typical one). Anything priced by the kilogram is already a weight.
 */
export function calculateProductMetrics(
  input: ComparisonProductInput,
): ComparisonProductMetrics {
  const { productId, price, quantity, unit, concentration } = input;
  const retail = PRODUCT_RETAIL_FORMS[productId];

  const incomplete: ComparisonProductMetrics = {
    productId,
    grossMass: 0,
    activeMass: 0,
    pricePerActiveKg: 0,
    isValid: false,
  };

  // Zeros are not an error: the tool posts empty slots on mount.
  if (price <= 0 || quantity <= 0 || concentration <= 0) return incomplete;

  let grossMass = quantity;
  if (unit === 'l') {
    // A solid has no litres. Rather than silently converting nonsense with some
    // borrowed density, the slot is reported incomplete.
    if (retail.form !== 'liquid') return incomplete;
    const density = input.density && input.density > 0 ? input.density : retail.typicalDensityKgL;
    grossMass = quantity * density;
  }

  const activeMass = grossMass * (concentration / 100);

  return {
    productId,
    grossMass,
    activeMass,
    pricePerActiveKg: price / activeMass,
    isValid: true,
  };
}

/**
 * Compares two slots. The cheaper cost per active kilogram wins; `savingsPerKg`
 * is what the winner saves you on every kilogram of usable chlorine.
 */
export function compareProducts(
  slotA: ComparisonProductMetrics,
  slotB: ComparisonProductMetrics,
): ComparisonResult {
  if (!slotA.isValid || !slotB.isValid) {
    return { winner: null, savingsPerKg: 0, slotA, slotB };
  }

  let winner: ComparisonSlotId | 'DRAW' = 'DRAW';
  let savingsPerKg = 0;

  if (slotA.pricePerActiveKg < slotB.pricePerActiveKg) {
    winner = 'A';
    savingsPerKg = slotB.pricePerActiveKg - slotA.pricePerActiveKg;
  } else if (slotB.pricePerActiveKg < slotA.pricePerActiveKg) {
    winner = 'B';
    savingsPerKg = slotA.pricePerActiveKg - slotB.pricePerActiveKg;
  }

  return { winner, savingsPerKg, slotA, slotB };
}
