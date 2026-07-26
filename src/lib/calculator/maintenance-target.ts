/**
 * Routine (non-shock) free-chlorine levels for a given CYA.
 *
 * The single most misunderstood number in pool care. The classic "keep it at
 * 1-3 ppm" is CYA-agnostic and therefore wrong: cyanuric acid holds chlorine in
 * reserve, so the higher the CYA, the more total FC you need to keep the same
 * amount of *active* chlorine in the water. A pool at CYA 100 sitting at 2 ppm
 * looks chlorinated on a test strip and is losing to algae.
 *
 *   minFC    = max(0.075 × CYA, 2 ppm)
 *   targetFC = max(0.115 × CYA, minFC)
 *
 * Both ratios are TFP's published figures; the 2 ppm floor is where TFP's own
 * table stops following the ratio down. See `constants.ts` for the citations.
 */

import {
  CYA_HIGH_THRESHOLD,
  CYA_IDEAL_RANGE,
  CYA_UNKNOWN_RANGE,
  MAINTENANCE_FC_ABSOLUTE_MIN,
  MAINTENANCE_FC_MIN_RATIO,
  MAINTENANCE_FC_TARGET_RATIO,
} from './constants';
import { makeRange, makeValue, round1 } from './range';
import type {
  MaintenanceTargetInput,
  MaintenanceTargetResult,
  RangeOrValue,
  WarningCode,
} from './types';

/** Minimum FC for one CYA value: the ratio, but never under the absolute floor. */
export function minFcFor(cyaPpm: number): number {
  return Math.max(cyaPpm * MAINTENANCE_FC_MIN_RATIO, MAINTENANCE_FC_ABSOLUTE_MIN);
}

/** Target FC for one CYA value. Never below the minimum it must clear. */
export function targetFcFor(cyaPpm: number): number {
  return Math.max(cyaPpm * MAINTENANCE_FC_TARGET_RATIO, minFcFor(cyaPpm));
}

/** Apply `fn` to a single CYA value or across the unknown-CYA range. */
function overCya(
  cyaPpm: number | null,
  fn: (cya: number) => number,
): RangeOrValue<'ppm'> {
  if (cyaPpm !== null) return makeValue(round1(fn(cyaPpm)), 'ppm');
  return makeRange(
    round1(fn(CYA_UNKNOWN_RANGE.min)),
    round1(fn(CYA_UNKNOWN_RANGE.max)),
    'ppm',
  );
}

export function computeMaintenanceTarget(
  input: MaintenanceTargetInput,
): MaintenanceTargetResult {
  const cyaUsed = input.cya.known ? input.cya.ppm : null;
  const warnings: WarningCode[] = [];

  if (cyaUsed === null) {
    warnings.push('CYA_UNKNOWN_ASSUMED');
  } else if (cyaUsed >= CYA_HIGH_THRESHOLD) {
    // The severe tier the shock tool already speaks: dilution territory.
    warnings.push('CYA_HIGH');
  } else if (cyaUsed > CYA_IDEAL_RANGE.max) {
    // The early tier, and the reason this tool exists. Nothing warned here
    // before, which is exactly how CYA creeps past 50 unnoticed for years.
    warnings.push('CYA_ABOVE_IDEAL');
  }

  // The floor bites when the ratio alone would ask for less than it.
  const floorApplied =
    cyaUsed !== null
      ? cyaUsed * MAINTENANCE_FC_MIN_RATIO < MAINTENANCE_FC_ABSOLUTE_MIN
      : CYA_UNKNOWN_RANGE.min * MAINTENANCE_FC_MIN_RATIO < MAINTENANCE_FC_ABSOLUTE_MIN;

  return {
    minFC: overCya(cyaUsed, minFcFor),
    targetFC: overCya(cyaUsed, targetFcFor),
    floorApplied,
    cyaUsed,
    warnings,
  };
}
