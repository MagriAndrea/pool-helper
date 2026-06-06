/**
 * Compute pool water volume from shape + dimensions.
 *
 *   rectangle: length × width × depth
 *   circle:    π × (diameter / 2)² × depth
 *
 * Dimensions may be in metres or feet; the result is returned in L, m³ and US gal.
 * (Only common shapes are supported — no kidney/freeform pools.)
 */

import { round0, round2 } from './range';
import { cubicMetersToLiters, lengthToMeters, litersToGallons } from './units';
import type {
  CircleDims,
  PoolShape,
  PoolVolumeResult,
  RectangleDims,
} from './types';

function rectangleM3(dims: RectangleDims): number {
  const l = lengthToMeters(dims.length, dims.unit);
  const w = lengthToMeters(dims.width, dims.unit);
  const d = lengthToMeters(dims.depth, dims.unit);
  return l * w * d;
}

function circleM3(dims: CircleDims): number {
  const diameter = lengthToMeters(dims.diameter, dims.unit);
  const depth = lengthToMeters(dims.depth, dims.unit);
  const radius = diameter / 2;
  return Math.PI * radius * radius * depth;
}

export function computePoolVolume(
  shape: PoolShape,
  dims: RectangleDims | CircleDims,
): PoolVolumeResult {
  const m3 =
    shape === 'rectangle'
      ? rectangleM3(dims as RectangleDims)
      : circleM3(dims as CircleDims);

  const safeM3 = Number.isFinite(m3) && m3 > 0 ? m3 : 0;
  const liters = cubicMetersToLiters(safeM3);

  return {
    volumeL: round0(liters),
    volumeM3: round2(safeM3),
    volumeGal: round0(litersToGallons(liters)),
  };
}
