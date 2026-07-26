import { describe, expect, it } from 'vitest';
import { convertToProduct } from '../product-conversion';
import { makeRange, makeValue } from '../range';

describe('product-conversion: calcium hypochlorite (solid, weight %)', () => {
  it('converts pure chlorine grams to product grams below the kg promotion threshold', () => {
    // grams = 200 / 0.65 = 307.69... -> round0 = 308 (no promotion, base stays g)
    const result = convertToProduct({
      pureChlorineG: makeValue(200, 'g'),
      productId: 'calcium_hypochlorite',
      concentrationPct: 65,
      deltaFC: makeValue(10, 'ppm'),
    });
    expect(result.amount).toEqual(makeValue(308, 'g'));
    expect(result.sideEffects).toEqual({
      cyaAddedPpm: 0,
      hardnessAddedPpm: 7, // 0.7 * 10
      saltAddedPpm: 0,
      pHEffect: 'up',
    });
  });

  it('promotes g to kg once the amount reaches 1000g', () => {
    // grams = 1000 / 0.65 = 1538.46... >= 1000 -> promote to kg, round2(1.53846) = 1.54
    const result = convertToProduct({
      pureChlorineG: makeValue(1000, 'g'),
      productId: 'calcium_hypochlorite',
      concentrationPct: 65,
      deltaFC: makeValue(50, 'ppm'),
    });
    expect(result.amount).toEqual(makeValue(1.54, 'kg'));
  });

  it('returns a zero amount instead of dividing by zero when concentration is 0', () => {
    const result = convertToProduct({
      pureChlorineG: makeValue(100, 'g'),
      productId: 'calcium_hypochlorite',
      concentrationPct: 0,
      deltaFC: makeValue(5, 'ppm'),
    });
    expect(result.amount).toEqual(makeValue(0, 'g'));
  });
});

describe('product-conversion: sodium hypochlorite (liquid)', () => {
  it('uses the trade-% (w/v) path when no density is given: gPerL = pct * 10', () => {
    // gPerL = 13*10 = 130; mL = 100/130*1000 = 769.23 -> round0 = 769
    const result = convertToProduct({
      pureChlorineG: makeValue(100, 'g'),
      productId: 'sodium_hypochlorite',
      concentrationPct: 13,
      deltaFC: makeValue(5, 'ppm'),
    });
    expect(result.amount).toEqual(makeValue(769, 'mL'));
    expect(result.sideEffects).toEqual({
      cyaAddedPpm: 0,
      hardnessAddedPpm: 0,
      saltAddedPpm: 4.1, // 0.82 * 5
      pHEffect: 'up',
    });
  });

  it('uses the weight-% (w/w) path when density is given: gPerL = pct * density * 10, and promotes mL to L', () => {
    // gPerL = 14 * 1.2 * 10 = 168; mL = 2000/168*1000 = 11904.76 -> promote, round2(11.9047..) = 11.9
    const result = convertToProduct({
      pureChlorineG: makeValue(2000, 'g'),
      productId: 'sodium_hypochlorite',
      concentrationPct: 14,
      densityKgL: 1.2,
      deltaFC: makeValue(100, 'ppm'),
    });
    expect(result.amount).toEqual(makeValue(11.9, 'L'));
  });

  it('returns a zero amount instead of dividing by zero when concentration is 0 and no density', () => {
    const result = convertToProduct({
      pureChlorineG: makeValue(100, 'g'),
      productId: 'sodium_hypochlorite',
      concentrationPct: 0,
      deltaFC: makeValue(5, 'ppm'),
    });
    expect(result.amount).toEqual(makeValue(0, 'mL'));
  });
});

describe('product-conversion: range propagation', () => {
  it('converts a pure-chlorine range to a product amount range and promotes on the upper bound', () => {
    // trade 13%: gPerL=130; baseMin=100/130*1000=769.23, baseMax=300/130*1000=2307.69 -> promote (>=1000)
    // fmtMin=round2(0.76923)=0.77, fmtMax=round2(2.30769)=2.31
    const result = convertToProduct({
      pureChlorineG: makeRange(100, 300, 'g'),
      productId: 'sodium_hypochlorite',
      concentrationPct: 13,
      deltaFC: makeRange(10, 30, 'ppm'),
    });
    expect(result.amount).toEqual(makeRange(0.77, 2.31, 'L'));
  });

  it('computes side effects from the worst-case (upper) end of the deltaFC range', () => {
    const result = convertToProduct({
      pureChlorineG: makeRange(100, 300, 'g'),
      productId: 'sodium_hypochlorite',
      concentrationPct: 13,
      deltaFC: makeRange(10, 30, 'ppm'),
    });
    // deltaFC hi = 30 -> saltAddedPpm = round2(0.82 * 30) = 24.6
    expect(result.sideEffects.saltAddedPpm).toBe(24.6);
  });
});
