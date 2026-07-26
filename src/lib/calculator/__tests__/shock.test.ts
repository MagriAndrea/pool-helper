import { describe, expect, it } from 'vitest';
import { computeShock } from '../shock';
import { makeRange, makeValue } from '../range';

describe('shock: perfect water needs no shock', () => {
  it('reports isNoShockNeeded and a fully-null target when water is perfect and CC is 0', () => {
    const result = computeShock({
      volume: { value: 10000, unit: 'L' },
      colorLevel: 'perfect',
      cya: { known: true, ppm: 50 },
      chlorine: { known: true, freeFC: 3, combinedCC: 0 },
      product: { id: 'sodium_hypochlorite', concentrationPct: 13 },
    });

    expect(result.isNoShockNeeded).toBe(true);
    expect(result.dose).toBeNull();
    expect(result.product).toBeNull();
    expect(result.warnings).toEqual([]);
    expect(result.breakdown).toEqual({
      cyaUsed: 50,
      cyaAssumed: false,
      colorLevel: 'perfect',
      multiplier: null,
      slamTarget: null,
      breakpointTarget: null,
      floor: null,
      winningStrategy: 'none',
      targetFC: null,
      volumeL: 10000,
      currentFC: 3,
      currentFCAssumed: false,
      gap: null,
      pureChlorine: null,
    });
  });
});

describe('shock: full pipeline (target -> dose -> product)', () => {
  it('composes SLAM target, dose and sodium hypochlorite product amount end to end', () => {
    // target: slam = 0.4*50*1 (light_green) = 20, floor=10 -> slam wins, target=20
    // dose: gap = 20-1 = 19, pureG = round0(10000*19/1000) = 190
    // product: gPerL=130 (trade 13%), mL=190/130*1000=1461.5 -> promote -> 1.46 L
    const result = computeShock({
      volume: { value: 10000, unit: 'L' },
      colorLevel: 'light_green',
      cya: { known: true, ppm: 50 },
      chlorine: { known: true, freeFC: 1 },
      product: { id: 'sodium_hypochlorite', concentrationPct: 13 },
    });

    expect(result.isNoShockNeeded).toBe(false);
    expect(result.target.slamTarget).toBe(20);
    expect(result.target.winningStrategy).toBe('slam');
    expect(result.dose).toEqual({
      gap: makeValue(19, 'ppm'),
      pureChlorine: makeValue(190, 'g'),
      warnings: [],
    });
    expect(result.product).toEqual({
      amount: makeValue(1.46, 'L'),
      sideEffects: {
        cyaAddedPpm: 0,
        hardnessAddedPpm: 0,
        saltAddedPpm: 15.58, // 0.82 * 19
        pHEffect: 'up',
      },
    });
    expect(result.breakdown.gap).toEqual(makeValue(19, 'ppm'));
    expect(result.breakdown.pureChlorine).toEqual(makeValue(190, 'g'));
    expect(result.warnings).toEqual([]);
  });

  it('raises LOW_DOSE when the resulting product amount is impractically small', () => {
    // target: slam = 0.4*25*1 (light_green) = 10, floor=10 (tie, slam wins) -> target=10
    // dose: gap = 10-0 = 10, pureG = round0(3000*10/1000) = 30
    // product (calcium 65%): grams = 30/0.65 = 46.15 -> round0 = 46 (< LOW_DOSE_THRESHOLD of 50)
    const result = computeShock({
      volume: { value: 3000, unit: 'L' },
      colorLevel: 'light_green',
      cya: { known: true, ppm: 25 },
      chlorine: { known: true, freeFC: 0 },
      product: { id: 'calcium_hypochlorite', concentrationPct: 65 },
    });

    expect(result.isNoShockNeeded).toBe(false);
    expect(result.dose?.pureChlorine).toEqual(makeValue(30, 'g'));
    expect(result.product?.amount).toEqual(makeValue(46, 'g'));
    expect(result.product?.sideEffects.hardnessAddedPpm).toBe(7); // 0.7 * 10
    expect(result.warnings).toEqual(['LOW_DOSE']);
  });

  it('stops after the dose step (no product conversion) when current FC already meets target', () => {
    // target = 10 (as above); current FC = 15 > target -> dose.gap floors at 0
    const result = computeShock({
      volume: { value: 3000, unit: 'L' },
      colorLevel: 'light_green',
      cya: { known: true, ppm: 25 },
      chlorine: { known: true, freeFC: 15 },
      product: { id: 'calcium_hypochlorite', concentrationPct: 65 },
    });

    expect(result.isNoShockNeeded).toBe(true);
    expect(result.dose).toEqual({
      gap: makeValue(0, 'ppm'),
      pureChlorine: makeValue(0, 'g'),
      warnings: ['FC_ALREADY_SUFFICIENT'],
    });
    expect(result.product).toBeNull();
    expect(result.warnings).toEqual(['FC_ALREADY_SUFFICIENT']);
  });
});

describe('shock: both CYA and current FC unknown (full range propagation)', () => {
  it('carries the range from target through dose to the final product amount', () => {
    // target: slamMin=12, slamMax=32, floor=10 -> range [12,32], slam wins
    // dose: fcForMaxDose=0 -> maxGap=32; fcForMinDose=2 -> minGap=10 -> gap [10,32]
    // pureChlorine = [round0(10000*10/1000), round0(10000*32/1000)] = [100, 320]
    // product (sodium trade 13%): mLmin=769.23, mLmax=2461.54 -> promote -> [0.77, 2.46] L
    const result = computeShock({
      volume: { value: 10000, unit: 'L' },
      colorLevel: 'light_green',
      cya: { known: false },
      chlorine: { known: false },
      product: { id: 'sodium_hypochlorite', concentrationPct: 13 },
    });

    expect(result.target.targetFC).toEqual(makeRange(12, 32, 'ppm'));
    expect(result.dose?.gap).toEqual(makeRange(10, 32, 'ppm'));
    expect(result.dose?.pureChlorine).toEqual(makeRange(100, 320, 'g'));
    expect(result.product?.amount).toEqual(makeRange(0.77, 2.46, 'L'));
    expect(result.product?.sideEffects.saltAddedPpm).toBe(26.24); // hi(deltaFC)=32 -> 0.82*32
    expect(result.breakdown.cyaUsed).toBeNull();
    expect(result.breakdown.cyaAssumed).toBe(true);
    expect(result.breakdown.currentFC).toBeNull();
    expect(result.breakdown.currentFCAssumed).toBe(true);
    expect(result.warnings).toEqual([]);
  });
});
