/**
 * Chlorine maintenance orchestrator — the entry point for the
 * `/chlorine-maintenance` API and the tool UI. It composes:
 *
 *   computeMaintenanceTarget → computeChlorineDose → convertToProduct
 *                            ↘ projectCya
 *
 * Same shape as `shock.ts`, different question. Shock asks "how do I recover
 * this pool once"; this asks "where do I keep it every day, and where is my
 * stabilizer heading if I keep dosing the way I am".
 *
 * Returns numbers and codes only — the UI does the prose (i18n rule).
 */

import { computeChlorineDose } from './chlorine-dose';
import { LOW_DOSE_THRESHOLD } from './constants';
import { projectCya } from './cya-projection';
import { computeMaintenanceTarget } from './maintenance-target';
import { convertToProduct } from './product-conversion';
import { hi } from './range';
import { toLiters } from './units';
import type {
  ChlorineMaintenanceInput,
  ChlorineMaintenanceResult,
  MaintenanceBreakdown,
  WarningCode,
} from './types';

function dedupe(warnings: WarningCode[]): WarningCode[] {
  return Array.from(new Set(warnings));
}

export function computeChlorineMaintenance(
  input: ChlorineMaintenanceInput,
): ChlorineMaintenanceResult {
  const { volume, cya, currentFC, product, dailyFcPpm, projectionWeeks } = input;
  const warnings: WarningCode[] = [];
  const volumeL = toLiters(volume);

  const cyaUsed = cya.known ? cya.ppm : null;
  const currentFcPpm = currentFC.known ? currentFC.freeFC : null;

  // --- 1. Where should FC sit? ---------------------------------------------
  const target = computeMaintenanceTarget({ cya });
  warnings.push(...target.warnings);

  // --- 2. Where is CYA heading? --------------------------------------------
  // Only with a measured CYA: projecting from the "I don't know" range would
  // dress a guess up as a countdown.
  const projection = cyaUsed !== null
    ? projectCya({
        currentCyaPpm: cyaUsed,
        productId: product.id,
        dailyFcPpm,
        weeks: projectionWeeks,
      })
    : null;
  if (projection) warnings.push(...projection.warnings);

  // --- 3. What do I add today? ---------------------------------------------
  const dose = computeChlorineDose({
    volume,
    targetFC: target.targetFC,
    currentFC,
  });
  warnings.push(...dose.warnings);

  const breakdown: MaintenanceBreakdown = {
    volumeL,
    cyaUsed,
    cyaAssumed: !cya.known,
    currentFC: currentFcPpm,
    currentFCAssumed: !currentFC.known,
    gap: dose.gap,
    pureChlorine: dose.pureChlorine,
    dailyFcPpm,
  };

  // Already at target: the answer is "add nothing", which is a real answer.
  if (hi(dose.gap) <= 0) {
    return {
      target,
      dose,
      product: null,
      projection,
      isAtTarget: true,
      breakdown,
      warnings: dedupe(warnings),
    };
  }

  const productResult = convertToProduct({
    pureChlorineG: dose.pureChlorine,
    productId: product.id,
    concentrationPct: product.concentrationPct,
    densityKgL: product.densityKgL,
    deltaFC: dose.gap,
  });

  const amountHi = hi(productResult.amount);
  const amountInBase =
    productResult.amount.unit === 'kg' || productResult.amount.unit === 'L'
      ? amountHi * 1000
      : amountHi;
  if (amountInBase > 0 && amountInBase < LOW_DOSE_THRESHOLD) warnings.push('LOW_DOSE');

  return {
    target,
    dose,
    product: productResult,
    projection,
    isAtTarget: false,
    breakdown,
    warnings: dedupe(warnings),
  };
}
