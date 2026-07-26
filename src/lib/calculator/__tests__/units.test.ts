import { describe, expect, it } from 'vitest';
import {
  convertVolume,
  cubicMetersToLiters,
  lengthToMeters,
  litersToCubicMeters,
  litersToGallons,
  toLiters,
} from '../units';

describe('units: toLiters', () => {
  it('passes litres through unchanged', () => {
    expect(toLiters({ value: 10, unit: 'L' })).toBe(10);
  });

  it('converts US gallons to litres using LITERS_PER_GALLON', () => {
    expect(toLiters({ value: 10, unit: 'gal' })).toBeCloseTo(37.8541, 4);
  });
});

describe('units: litersToGallons / litersToCubicMeters / cubicMetersToLiters', () => {
  it('round-trips litres to gallons', () => {
    expect(litersToGallons(37.8541)).toBeCloseTo(10, 5);
  });

  it('converts litres to cubic metres', () => {
    expect(litersToCubicMeters(1000)).toBe(1);
  });

  it('converts cubic metres to litres', () => {
    expect(cubicMetersToLiters(1)).toBe(1000);
  });
});

describe('units: lengthToMeters', () => {
  it('passes metres through unchanged', () => {
    expect(lengthToMeters(10, 'm')).toBe(10);
  });

  it('converts feet to metres using METERS_PER_FOOT', () => {
    expect(lengthToMeters(10, 'ft')).toBeCloseTo(3.048, 5);
  });
});

describe('units: convertVolume', () => {
  it('returns the same value when source and target unit match', () => {
    expect(convertVolume(10, 'L', 'L')).toBe(10);
    expect(convertVolume(10, 'gal', 'gal')).toBe(10);
  });

  it('converts litres to gallons', () => {
    expect(convertVolume(10, 'L', 'gal')).toBeCloseTo(2.64172, 5);
  });

  it('converts gallons to litres', () => {
    expect(convertVolume(10, 'gal', 'L')).toBeCloseTo(37.8541, 4);
  });
});
