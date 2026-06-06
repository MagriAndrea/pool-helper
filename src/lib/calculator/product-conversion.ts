/**
 * Convert pure available chlorine (grams) → amount of a chosen product, plus the
 * side effects that product adds to the water.
 *
 * CALCIUM hypochlorite (solid):
 *   product_g = pure_g / (concentration_pct / 100)
 *   base unit = g, promoted to kg at ≥ 1000 g.
 *
 * SODIUM hypochlorite (liquid): strength stored internally as g/L of available
 * chlorine to avoid the classic trade-% (w/v) vs weight-% (w/w) error.
 *   - trade % (default): g/L = trade_pct × 10
 *   - weight % + density: g/L = weight_pct × density × 10
 *   product_mL = pure_g / gPerL × 1000
 *   base unit = mL, promoted to L at ≥ 1000 mL.
 *
 * Side effects scale linearly with ΔFC (ppm added), independent of product mass.
 */

import { PRODUCT_COEFFICIENTS } from './constants';
import { hi, makeRange, makeValue, round0, round2 } from './range';
import type {
  ProductConversionInput,
  ProductConversionResult,
  ProductId,
  ProductUnit,
  RangeOrValue,
  SideEffects,
} from './types';

/** Grams of available chlorine per litre of solution (sodium only). */
function gramsPerLiter(concentrationPct: number, densityKgL?: number): number {
  return densityKgL && densityKgL > 0
    ? concentrationPct * densityKgL * 10 // weight-% (w/w) path
    : concentrationPct * 10; // trade-% (w/v) path
}

/** Convert pure chlorine grams to the product's BASE amount (mL or g). */
function toBaseAmount(
  pureG: number,
  productId: ProductId,
  concentrationPct: number,
  densityKgL?: number,
): { base: number; baseUnit: ProductUnit } {
  if (productId === 'sodium_hypochlorite') {
    const gPerL = gramsPerLiter(concentrationPct, densityKgL);
    const mL = gPerL > 0 ? (pureG / gPerL) * 1000 : 0;
    return { base: mL, baseUnit: 'mL' };
  }
  const fraction = concentrationPct / 100;
  const grams = fraction > 0 ? pureG / fraction : 0;
  return { base: grams, baseUnit: 'g' };
}

/** Promote mL→L or g→kg when the (larger) bound crosses 1000. */
function formatAmount(
  baseMin: number,
  baseMax: number,
  baseUnit: ProductUnit,
  isRange: boolean,
): RangeOrValue<ProductUnit> {
  const promote = baseMax >= 1000;
  const bigUnit: ProductUnit = baseUnit === 'mL' ? 'L' : 'kg';
  const unit = promote ? bigUnit : baseUnit;
  const scale = promote ? 1 / 1000 : 1;
  const fmt = (n: number) => (promote ? round2(n * scale) : round0(n));

  if (isRange) return makeRange(fmt(baseMin), fmt(baseMax), unit);
  return makeValue(fmt(baseMax), unit);
}

function computeSideEffects(productId: ProductId, deltaFCppm: number): SideEffects {
  const c = PRODUCT_COEFFICIENTS[productId];
  return {
    cyaAddedPpm: round2(c.cyaPerPpm * deltaFCppm),
    hardnessAddedPpm: round2(c.hardnessPerPpm * deltaFCppm),
    saltAddedPpm: round2(c.saltPerPpm * deltaFCppm),
    pHEffect: c.pHEffect,
  };
}

export function convertToProduct(input: ProductConversionInput): ProductConversionResult {
  const { pureChlorineG, productId, concentrationPct, densityKgL, deltaFC } = input;

  const pureMin = pureChlorineG.isRange ? pureChlorineG.min : pureChlorineG.value;
  const pureMax = pureChlorineG.isRange ? pureChlorineG.max : pureChlorineG.value;

  const { base: baseMin, baseUnit } = toBaseAmount(pureMin, productId, concentrationPct, densityKgL);
  const { base: baseMax } = toBaseAmount(pureMax, productId, concentrationPct, densityKgL);

  const amount = formatAmount(baseMin, baseMax, baseUnit, pureChlorineG.isRange);

  // Side effects use the worst-case (upper) ΔFC for a conservative display.
  const sideEffects = computeSideEffects(productId, hi(deltaFC));

  return { amount, sideEffects };
}
