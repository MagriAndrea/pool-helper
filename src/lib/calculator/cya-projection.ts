/**
 * Where your CYA is heading, week by week, if you keep chlorinating the way you
 * are chlorinating now.
 *
 * This is the primitive the whole maintenance tool exists for. Stabilized
 * products carry cyanuric acid in with every dose, and nothing removes it fast
 * enough to matter — so CYA creeps up silently for a whole season while every
 * test you run still shows chlorine in the water.
 *
 *   added    = dailyFC × cyaPerPpm × 7          (ppm CYA per week)
 *   degraded = monthlyDegradation × 7 / 30      (ppm CYA per week)
 *   net      = added − degraded
 *
 * The net can be zero or negative — with liquid chlorine or cal-hypo nothing is
 * added at all — and then there is no date to project. Saying so is the point:
 * the answer "your CYA is stable" is as useful as a countdown.
 */

import {
  CYA_IDEAL_RANGE,
  DAYS_PER_MONTH,
  DAYS_PER_WEEK,
  DEFAULT_CYA_DEGRADATION_PPM_PER_MONTH,
  isStabilizedProduct,
  PRODUCT_COEFFICIENTS,
} from './constants';
import { round1 } from './range';
import type {
  CyaProjectionInput,
  CyaProjectionPoint,
  CyaProjectionResult,
  CyaTrend,
  WarningCode,
} from './types';

/** Below this weekly drift, the projection reports "stable" instead of a date. */
const STABLE_EPSILON_PPM_PER_WEEK = 0.01;

export function projectCya(input: CyaProjectionInput): CyaProjectionResult {
  const {
    currentCyaPpm,
    productId,
    dailyFcPpm,
    degradationPpmPerMonth = DEFAULT_CYA_DEGRADATION_PPM_PER_MONTH,
    weeks,
    ceilingPpm = CYA_IDEAL_RANGE.max,
  } = input;

  const cyaPerPpm = PRODUCT_COEFFICIENTS[productId].cyaPerPpm;

  const addedPpmPerWeek = Math.max(0, dailyFcPpm) * cyaPerPpm * DAYS_PER_WEEK;
  const degradedPpmPerWeek =
    (Math.max(0, degradationPpmPerMonth) * DAYS_PER_WEEK) / DAYS_PER_MONTH;
  const netPpmPerWeek = addedPpmPerWeek - degradedPpmPerWeek;

  let trend: CyaTrend = 'stable';
  if (netPpmPerWeek > STABLE_EPSILON_PPM_PER_WEEK) trend = 'rising';
  else if (netPpmPerWeek < -STABLE_EPSILON_PPM_PER_WEEK) trend = 'falling';

  // CYA cannot go below zero: degradation needs CYA to act on.
  const points: CyaProjectionPoint[] = [];
  for (let week = 0; week <= Math.max(0, Math.floor(weeks)); week++) {
    points.push({
      week,
      cyaPpm: round1(Math.max(0, currentCyaPpm + netPpmPerWeek * week)),
    });
  }

  let weeksToCeiling: number | null = null;
  if (currentCyaPpm >= ceilingPpm) {
    weeksToCeiling = 0; // already there — no waiting involved
  } else if (trend === 'rising') {
    weeksToCeiling = round1((ceilingPpm - currentCyaPpm) / netPpmPerWeek);
  }
  // Stable or falling below the ceiling: deliberately null, never Infinity.

  const warnings: WarningCode[] = [];
  if (isStabilizedProduct(productId) && currentCyaPpm >= ceilingPpm) {
    // Still dosing cyanuric acid into a pool that already has too much.
    warnings.push('CYA_LOCK_RISK');
  }

  return {
    netPpmPerWeek: round1(netPpmPerWeek),
    addedPpmPerWeek: round1(addedPpmPerWeek),
    degradedPpmPerWeek: round1(degradedPpmPerWeek),
    points,
    weeksToCeiling,
    trend,
    warnings,
  };
}
