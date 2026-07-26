import { describe, expect, it } from 'vitest';
import { hi, lo, makeRange, makeValue, round, round0, round1, round2 } from '../range';

describe('range: RangeOrValue constructors', () => {
  it('builds a deterministic value', () => {
    expect(makeValue(5, 'ppm')).toEqual({ isRange: false, value: 5, unit: 'ppm' });
  });

  it('builds a min-max range when bounds differ', () => {
    expect(makeRange(2, 8, 'ppm')).toEqual({ isRange: true, min: 2, max: 8, unit: 'ppm' });
  });

  it('swaps inverted bounds instead of producing a backwards range', () => {
    expect(makeRange(8, 2, 'ppm')).toEqual({ isRange: true, min: 2, max: 8, unit: 'ppm' });
  });

  it('collapses to a single value when min equals max', () => {
    expect(makeRange(5, 5, 'ppm')).toEqual({ isRange: false, value: 5, unit: 'ppm' });
  });
});

describe('range: lo/hi accessors', () => {
  it('reads the bound from a deterministic value (both lo and hi return the value)', () => {
    const v = makeValue(7, 'ppm');
    expect(lo(v)).toBe(7);
    expect(hi(v)).toBe(7);
  });

  it('reads min for lo and max for hi on a real range', () => {
    const r = makeRange(3, 9, 'ppm');
    expect(lo(r)).toBe(3);
    expect(hi(r)).toBe(9);
  });
});

describe('range: rounding helpers', () => {
  it('rounds half-up at the requested precision (avoids banker\'s rounding surprises)', () => {
    expect(round1(1.44)).toBe(1.4);
    expect(round1(1.45)).toBe(1.5);
    expect(round0(4.5)).toBe(5);
    expect(round0(4.4)).toBe(4);
  });

  it('defaults to 0 decimals when no precision is given', () => {
    expect(round(4.6)).toBe(5);
  });

  it('rounds to 2 decimals, including the classic 1.005 floating-point edge case', () => {
    expect(round2(2.345)).toBe(2.35);
    // Naive `Math.round(1.005 * 100) / 100` gives 1 because 1.005 is stored as
    // 1.00499999999999989...; the `+ Number.EPSILON` nudge here corrects it to 1.01.
    expect(round2(1.005)).toBe(1.01);
  });
});
