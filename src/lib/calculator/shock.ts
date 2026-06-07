/**
 * Shock orchestrator — the single entry point used by the `/shock` API and the
 * Shock Calculator UI. It composes the three primitives:
 *
 *   computeChlorineTarget → computeChlorineDose → convertToProduct
 *
 * and assembles a numeric `breakdown` for the transparent always-visible UI.
 * It never produces user-facing prose (i18n rule): the UI formats the numbers.
 */

import { computeChlorineDose } from './chlorine-dose';
import { computeChlorineTarget } from './chlorine-target';
import { COLOR_LEVELS, LOW_DOSE_THRESHOLD } from './constants';
import { convertToProduct } from './product-conversion';
import { hi } from './range';
import { toLiters } from './units';
import type {
  ChlorineInput,
  ShockBreakdown,
  ShockInput,
  ShockResult,
  WarningCode,
} from './types';

function dedupe(warnings: WarningCode[]): WarningCode[] {
  return Array.from(new Set(warnings));
}

export function computeShock(input: ShockInput): ShockResult {
  const { volume, colorLevel, cya, chlorine, product } = input;
  const warnings: WarningCode[] = [];
  const volumeL = toLiters(volume);

  const cyaUsed = cya.known ? cya.ppm : null;
  const currentFC = chlorine.known ? chlorine.freeFC : null;
  const combinedCC = chlorine.known ? chlorine.combinedCC ?? null : null;

  // --- 1. Target -----------------------------------------------------------
  const target = computeChlorineTarget({ cya, colorLevel, combinedCC });
  warnings.push(...target.warnings);

  const baseBreakdown: ShockBreakdown = {
    cyaUsed,
    cyaAssumed: !cya.known,
    colorLevel,
    multiplier: COLOR_LEVELS[colorLevel].multiplier,
    slamTarget: target.slamTarget,
    breakpointTarget: target.breakpointTarget,
    floor: target.floor,
    winningStrategy: target.winningStrategy,
    targetFC: target.targetFC,
    volumeL,
    currentFC,
    currentFCAssumed: !chlorine.known,
    gap: null,
    pureChlorine: null,
  };

  // --- No shock needed (perfect water with no high CC) ---------------------
  if (target.targetFC === null) {
    return {
      isNoShockNeeded: true,
      target,
      dose: null,
      product: null,
      breakdown: baseBreakdown,
      warnings: dedupe(warnings),
    };
  }

  // --- 2. Dose -------------------------------------------------------------
  const currentForDose: ChlorineInput = chlorine.known
    ? { known: true, freeFC: chlorine.freeFC, combinedCC: chlorine.combinedCC }
    : { known: false };

  const dose = computeChlorineDose({
    volume,
    targetFC: target.targetFC,
    currentFC: currentForDose,
  });
  warnings.push(...dose.warnings);

  const breakdown: ShockBreakdown = {
    ...baseBreakdown,
    gap: dose.gap,
    pureChlorine: dose.pureChlorine,
  };

  // --- FC already sufficient → no product needed ---------------------------
  if (hi(dose.gap) <= 0) {
    return {
      isNoShockNeeded: true,
      target,
      dose,
      product: null,
      breakdown,
      warnings: dedupe(warnings),
    };
  }

  // --- 3. Product ----------------------------------------------------------
  const productResult = convertToProduct({
    pureChlorineG: dose.pureChlorine,
    productId: product.id,
    concentrationPct: product.concentrationPct,
    densityKgL: product.densityKgL,
    deltaFC: dose.gap,
  });

  // Base-unit (g/mL) amount drives the impractical-dose hint.
  const amountHi = hi(productResult.amount);
  const amountInBase =
    productResult.amount.unit === 'kg' || productResult.amount.unit === 'L'
      ? amountHi * 1000
      : amountHi;
  if (amountInBase > 0 && amountInBase < LOW_DOSE_THRESHOLD) warnings.push('LOW_DOSE');

  return {
    isNoShockNeeded: false,
    target,
    dose,
    product: productResult,
    breakdown,
    warnings: dedupe(warnings),
  };
}
