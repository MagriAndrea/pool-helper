import { describe, expect, it } from 'vitest';
import { computeChlorineDose } from '../chlorine-dose';
import { makeRange, makeValue } from '../range';

describe('chlorine-dose: deterministic target + known current FC', () => {
  it('computes the gap and pure chlorine grams for a simple raise', () => {
    // gap = 5 - 2 = 3 ppm; pure_g = 10000 L * 3 / 1000 = 30 g
    const result = computeChlorineDose({
      volume: { value: 10000, unit: 'L' },
      targetFC: makeValue(5, 'ppm'),
      currentFC: { known: true, freeFC: 2 },
    });
    expect(result.gap).toEqual(makeValue(3, 'ppm'));
    expect(result.pureChlorine).toEqual(makeValue(30, 'g'));
    expect(result.warnings).toEqual([]);
  });

  it('floors the gap at 0 and raises FC_ALREADY_SUFFICIENT when current FC exceeds target', () => {
    const result = computeChlorineDose({
      volume: { value: 10000, unit: 'L' },
      targetFC: makeValue(5, 'ppm'),
      currentFC: { known: true, freeFC: 8 },
    });
    expect(result.gap).toEqual(makeValue(0, 'ppm'));
    expect(result.pureChlorine).toEqual(makeValue(0, 'g'));
    expect(result.warnings).toEqual(['FC_ALREADY_SUFFICIENT']);
  });

  it('converts gallon volumes to litres before computing the dose', () => {
    // volumeL = 1000 * 3.78541 = 3785.41; gap = 10; pure_g = round0(3785.41 * 10 / 1000) = 38
    const result = computeChlorineDose({
      volume: { value: 1000, unit: 'gal' },
      targetFC: makeValue(10, 'ppm'),
      currentFC: { known: true, freeFC: 0 },
    });
    expect(result.gap).toEqual(makeValue(10, 'ppm'));
    expect(result.pureChlorine).toEqual(makeValue(38, 'g'));
  });
});

describe('chlorine-dose: range propagation', () => {
  it('produces a dose range when the target is a range (CYA unknown) but current FC is known', () => {
    // targetLow=12, targetHigh=32, current=2 (both bounds use the same known FC)
    // minGap = 12-2 = 10, maxGap = 32-2 = 30
    const result = computeChlorineDose({
      volume: { value: 10000, unit: 'L' },
      targetFC: makeRange(12, 32, 'ppm'),
      currentFC: { known: true, freeFC: 2 },
    });
    expect(result.gap).toEqual(makeRange(10, 30, 'ppm'));
    expect(result.pureChlorine).toEqual(makeRange(100, 300, 'g'));
  });

  it('produces a dose range when the target is deterministic but current FC is unknown', () => {
    // fcForMaxDose=FC_UNKNOWN_RANGE.min=0 -> maxGap=20-0=20
    // fcForMinDose=FC_UNKNOWN_RANGE.max=2 -> minGap=20-2=18
    const result = computeChlorineDose({
      volume: { value: 10000, unit: 'L' },
      targetFC: makeValue(20, 'ppm'),
      currentFC: { known: false },
    });
    expect(result.gap).toEqual(makeRange(18, 20, 'ppm'));
    expect(result.pureChlorine).toEqual(makeRange(180, 200, 'g'));
    expect(result.warnings).toEqual([]);
  });

  it('combines both sources of range: unknown target and unknown current FC', () => {
    // targetLow=12,targetHigh=32; fcForMaxDose=0 -> maxGap=32; fcForMinDose=2 -> minGap=10
    const result = computeChlorineDose({
      volume: { value: 10000, unit: 'L' },
      targetFC: makeRange(12, 32, 'ppm'),
      currentFC: { known: false },
    });
    expect(result.gap).toEqual(makeRange(10, 32, 'ppm'));
    expect(result.pureChlorine).toEqual(makeRange(100, 320, 'g'));
  });
});
