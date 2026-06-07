/**
 * Compute the pure available chlorine (grams) needed to raise FC to target.
 *
 *   gap_ppm             = max(0, target_FC − current_FC)
 *   pure_chlorine_grams = volume_L × gap_ppm / 1000      (1 ppm = 1 mg/L)
 *
 * Range handling:
 *   - target may be a range (CYA unknown).
 *   - current FC may be unknown → assume FC_UNKNOWN_RANGE.
 *   - The MAX dose uses the highest target and lowest current FC; the MIN dose
 *     uses the lowest target and highest current FC.
 */

import { FC_UNKNOWN_RANGE } from './constants';
import { hi, lo, makeRange, makeValue, round0, round1 } from './range';
import { toLiters } from './units';
import type { ChlorineDoseInput, ChlorineDoseResult, WarningCode } from './types';

export function computeChlorineDose(input: ChlorineDoseInput): ChlorineDoseResult {
  const { volume, targetFC, currentFC } = input;
  const volumeL = toLiters(volume);
  const warnings: WarningCode[] = [];

  const targetLow = lo(targetFC);
  const targetHigh = hi(targetFC);

  const fcKnown = currentFC.known;
  // For the MAX dose we assume the lowest current FC; for the MIN dose the highest.
  const fcForMaxDose = fcKnown ? currentFC.freeFC : FC_UNKNOWN_RANGE.min;
  const fcForMinDose = fcKnown ? currentFC.freeFC : FC_UNKNOWN_RANGE.max;

  const maxGap = Math.max(0, round1(targetHigh - fcForMaxDose));
  const minGap = Math.max(0, round1(targetLow - fcForMinDose));

  const isRange = targetFC.isRange || !fcKnown;

  if (maxGap <= 0) warnings.push('FC_ALREADY_SUFFICIENT');

  const pureMax = round0((volumeL * maxGap) / 1000);
  const pureMin = round0((volumeL * minGap) / 1000);

  if (isRange) {
    return {
      gap: makeRange(minGap, maxGap, 'ppm'),
      pureChlorine: makeRange(pureMin, pureMax, 'g'),
      warnings,
    };
  }

  return {
    gap: makeValue(maxGap, 'ppm'),
    pureChlorine: makeValue(pureMax, 'g'),
    warnings,
  };
}
