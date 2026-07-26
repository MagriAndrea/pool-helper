import { describe, expect, it } from 'vitest';
import { computePoolVolume } from '../pool-volume';

describe('pool-volume: rectangle', () => {
  it('computes volume in L/m3/gal for a 4x3x1.5m rectangle', () => {
    // m3 = 4 * 3 * 1.5 = 18 -> 18000 L -> 18000 / 3.78541 gal
    const result = computePoolVolume('rectangle', {
      length: 4,
      width: 3,
      depth: 1.5,
      unit: 'm',
    });
    expect(result).toEqual({ volumeL: 18000, volumeM3: 18, volumeGal: 4755 });
  });

  it('converts feet dimensions to metres before computing volume', () => {
    // l=w=10ft=3.048m, d=5ft=1.524m -> m3 = 3.048 * 3.048 * 1.524 = 14.1584233 m3
    const result = computePoolVolume('rectangle', {
      length: 10,
      width: 10,
      depth: 5,
      unit: 'ft',
    });
    expect(result).toEqual({ volumeL: 14158, volumeM3: 14.16, volumeGal: 3740 });
  });

  it('returns all zeros when a dimension is zero (guarded, does not crash)', () => {
    const result = computePoolVolume('rectangle', { length: 4, width: 3, depth: 0, unit: 'm' });
    expect(result).toEqual({ volumeL: 0, volumeM3: 0, volumeGal: 0 });
  });
});

describe('pool-volume: circle', () => {
  it('computes volume for a 4m-diameter, 1.2m-deep circular pool', () => {
    // radius = 2, m3 = pi * 2^2 * 1.2 = 15.0796447...
    const result = computePoolVolume('circle', { diameter: 4, depth: 1.2, unit: 'm' });
    expect(result).toEqual({ volumeL: 15080, volumeM3: 15.08, volumeGal: 3984 });
  });

  it('returns all zeros for a zero diameter', () => {
    const result = computePoolVolume('circle', { diameter: 0, depth: 1.2, unit: 'm' });
    expect(result).toEqual({ volumeL: 0, volumeM3: 0, volumeGal: 0 });
  });
});
