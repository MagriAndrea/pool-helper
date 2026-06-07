/**
 * Unit conversion helpers (volume + length).
 */

import { LITERS_PER_GALLON, METERS_PER_FOOT } from './constants';
import type { LengthUnit, Unit, VolumeInput } from './types';

/** Convert a volume input to litres. */
export function toLiters(volume: VolumeInput): number {
  return volume.unit === 'gal' ? volume.value * LITERS_PER_GALLON : volume.value;
}

export function litersToGallons(liters: number): number {
  return liters / LITERS_PER_GALLON;
}

export function litersToCubicMeters(liters: number): number {
  return liters / 1000;
}

/** Convert a length in the given unit to metres. */
export function lengthToMeters(value: number, unit: LengthUnit): number {
  return unit === 'ft' ? value * METERS_PER_FOOT : value;
}

/** Cubic metres → litres. */
export function cubicMetersToLiters(m3: number): number {
  return m3 * 1000;
}

export function convertVolume(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;
  const liters = from === 'gal' ? value * LITERS_PER_GALLON : value;
  return to === 'gal' ? liters / LITERS_PER_GALLON : liters;
}
