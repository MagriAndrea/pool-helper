/**
 * Compute the target Free Chlorine (FC) for a shock.
 *
 * target_FC = max( SLAM(0.40 × CYA × colorMultiplier), breakpoint(10 × CC), floor )
 *
 * - `perfect` water has no SLAM target and no floor; only a high CC can force a
 *   (breakpoint) shock.
 * - When CYA is unknown, the SLAM term is evaluated at both ends of
 *   CYA_UNKNOWN_RANGE, producing a target range.
 */

import {
  BREAKPOINT_MULTIPLIER,
  CC_HIGH_THRESHOLD,
  COLOR_LEVELS,
  CYA_HIGH_THRESHOLD,
  CYA_UNKNOWN_RANGE,
  SLAM_CYA_RATIO,
} from './constants';
import { makeRange, makeValue, round1 } from './range';
import type {
  ChlorineTargetInput,
  ChlorineTargetResult,
  TargetStrategy,
  WarningCode,
} from './types';

export function computeChlorineTarget(input: ChlorineTargetInput): ChlorineTargetResult {
  const { cya, colorLevel, combinedCC } = input;
  const warnings: WarningCode[] = [];

  const cc = typeof combinedCC === 'number' && combinedCC > 0 ? combinedCC : null;
  const breakpointTarget = cc !== null ? round1(BREAKPOINT_MULTIPLIER * cc) : null;

  if (cc !== null && cc > CC_HIGH_THRESHOLD) warnings.push('CC_HIGH');
  if (cya.known && cya.ppm > CYA_HIGH_THRESHOLD) warnings.push('CYA_HIGH');

  const { multiplier, floor } = COLOR_LEVELS[colorLevel];

  // --- Perfect water: no algae shock; only breakpoint can require chlorine ---
  if (multiplier === null) {
    if (breakpointTarget !== null && breakpointTarget > 0) {
      return {
        slamTarget: null,
        breakpointTarget,
        floor: null,
        winningStrategy: 'breakpoint',
        targetFC: makeValue(breakpointTarget, 'ppm'),
        warnings,
      };
    }
    return {
      slamTarget: null,
      breakpointTarget,
      floor: null,
      winningStrategy: 'none',
      targetFC: null,
      warnings,
    };
  }

  const slamAt = (cyaPpm: number) => SLAM_CYA_RATIO * cyaPpm * multiplier;

  // --- CYA known: single deterministic target ---
  if (cya.known) {
    const slamTarget = round1(slamAt(cya.ppm));
    const candidates: Array<[number, TargetStrategy]> = [[slamTarget, 'slam']];
    if (breakpointTarget !== null) candidates.push([breakpointTarget, 'breakpoint']);
    if (floor !== null) candidates.push([floor, 'floor']);

    const [best, strategy] = candidates.reduce((a, b) => (b[0] > a[0] ? b : a));

    return {
      slamTarget,
      breakpointTarget,
      floor,
      winningStrategy: strategy,
      targetFC: makeValue(round1(best), 'ppm'),
      warnings,
    };
  }

  // --- CYA unknown: evaluate SLAM at both ends → range ---
  const slamMin = slamAt(CYA_UNKNOWN_RANGE.min);
  const slamMax = slamAt(CYA_UNKNOWN_RANGE.max);
  const bp = breakpointTarget ?? 0;
  const fl = floor ?? 0;

  const targetLow = round1(Math.max(slamMin, bp, fl));
  const targetHigh = round1(Math.max(slamMax, bp, fl));

  // Report which candidate dominates the upper bound.
  let strategy: TargetStrategy = 'slam';
  if (slamMax >= bp && slamMax >= fl) strategy = 'slam';
  else if (bp >= fl) strategy = 'breakpoint';
  else strategy = 'floor';

  return {
    slamTarget: round1(slamMax),
    breakpointTarget,
    floor,
    winningStrategy: strategy,
    targetFC: makeRange(targetLow, targetHigh, 'ppm'),
    warnings,
  };
}
