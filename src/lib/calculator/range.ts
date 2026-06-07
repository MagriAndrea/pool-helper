/**
 * Helpers for the `RangeOrValue` type and numeric rounding.
 *
 * A `RangeOrValue` is either a single deterministic value or a min–max range.
 * Ranges propagate through the calculation whenever the user answered
 * "I don't know" to CYA and/or current chlorine.
 */

import type { RangeOrValue } from './types';

export function makeValue<T extends string>(value: number, unit: T): RangeOrValue<T> {
  return { isRange: false, value, unit };
}

export function makeRange<T extends string>(min: number, max: number, unit: T): RangeOrValue<T> {
  // Guard against inverted bounds from rounding noise.
  if (min > max) [min, max] = [max, min];
  // Collapse to a single value when the bounds coincide.
  if (min === max) return { isRange: false, value: min, unit };
  return { isRange: true, min, max, unit };
}

/** Lower bound (min for ranges, the value otherwise). */
export function lo<T extends string>(r: RangeOrValue<T>): number {
  return r.isRange ? r.min : r.value;
}

/** Upper bound (max for ranges, the value otherwise). */
export function hi<T extends string>(r: RangeOrValue<T>): number {
  return r.isRange ? r.max : r.value;
}

/** Round to `decimals` decimal places (default 0). Avoids FP noise. */
export function round(n: number, decimals = 0): number {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

export const round0 = (n: number) => round(n, 0);
export const round1 = (n: number) => round(n, 1);
export const round2 = (n: number) => round(n, 2);
