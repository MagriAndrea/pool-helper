import { describe, expect, it } from 'vitest';
import { computeMaintenanceTarget, minFcFor, targetFcFor } from '../maintenance-target';

/**
 * The numeric expectations below are TFP's own published Chlorine/CYA table,
 * read from the primary wiki page — not values produced by this code.
 * https://www.troublefreepool.com/wiki/index.php?title=CYA_Chlorine_Relationship
 *
 * Two different strengths of claim on purpose, because the source supports two
 * different strengths of claim. TFP presents the percentages as "a reasonable
 * approximation to the table", and the table itself is integer-rounded from HOCl
 * equivalence rather than generated from the ratios:
 *
 *  - the MINIMUM column, the safety-critical one, comes out exactly right;
 *  - the TARGET column lands within 1 ppm (it differs at CYA 20, 30 and 100).
 *
 * A ratio is nevertheless the right model here: users type CYA 47, not table
 * rows, so interpolation would be needed anyway. What must not happen is the
 * ratio drifting away from the published table unnoticed — hence both checks.
 */
const TFP_TABLE: ReadonlyArray<[cya: number, min: number, target: number]> = [
  [20, 2, 3],
  [30, 2, 4],
  [40, 3, 5],
  [50, 4, 6],
  [60, 5, 7],
  [70, 5, 8],
  [80, 6, 9],
  [90, 7, 10],
  [100, 8, 11],
];

describe('maintenance-target: agrees with TFP\'s published table', () => {
  it.each(TFP_TABLE)('CYA %i -> minimum %i ppm exactly', (cya, tfpMin) => {
    expect(Math.round(minFcFor(cya))).toBe(tfpMin);
  });

  it.each(TFP_TABLE)('CYA %i -> target within 1 ppm of the published %i', (cya, _min, tfpTarget) => {
    expect(Math.abs(targetFcFor(cya) - tfpTarget)).toBeLessThanOrEqual(1);
  });

  it('would catch a target ratio that drifted away from the table', () => {
    // Sanity check on the tolerance above: it is tight enough to matter. A 15%
    // target ratio (TFP's yellow-algae minimum, a plausible mix-up) breaks it.
    const wrong = (cya: number) => cya * 0.15;
    const worst = Math.max(...TFP_TABLE.map(([cya, , t]) => Math.abs(wrong(cya) - t)));
    expect(worst).toBeGreaterThan(1);
  });
});

describe('maintenance-target: the ratios and the floor', () => {
  it('uses 7.5% of CYA for the minimum once that clears the floor', () => {
    expect(minFcFor(40)).toBeCloseTo(3, 10); // 0.075 * 40
    expect(minFcFor(100)).toBeCloseTo(7.5, 10);
  });

  it('uses 11.5% of CYA for the target', () => {
    expect(targetFcFor(40)).toBeCloseTo(4.6, 10); // 0.115 * 40
    expect(targetFcFor(100)).toBeCloseTo(11.5, 10);
  });

  it('holds the 2 ppm floor where the ratio alone would go lower', () => {
    // 0.075 * 20 = 1.5, below the floor; TFP's table says 2.
    expect(minFcFor(20)).toBe(2);
    expect(minFcFor(0)).toBe(2);
    expect(minFcFor(26)).toBe(2); // 1.95, just under
    expect(minFcFor(27)).toBeCloseTo(2.025, 10); // just over: ratio takes back over
  });

  it('never lets the target fall below the minimum', () => {
    // At low CYA the floor lifts the minimum above 11.5% of CYA.
    expect(targetFcFor(10)).toBe(minFcFor(10));
    expect(targetFcFor(10)).toBe(2);
  });

  it('reports whether the floor or the ratio decided the minimum', () => {
    expect(computeMaintenanceTarget({ cya: { known: true, ppm: 20 } }).floorApplied).toBe(true);
    expect(computeMaintenanceTarget({ cya: { known: true, ppm: 50 } }).floorApplied).toBe(false);
  });
});

describe('maintenance-target: warnings', () => {
  it('stays silent inside the ideal band', () => {
    expect(computeMaintenanceTarget({ cya: { known: true, ppm: 40 } }).warnings).toEqual([]);
    expect(computeMaintenanceTarget({ cya: { known: true, ppm: 50 } }).warnings).toEqual([]);
  });

  it('warns CYA_ABOVE_IDEAL just past the ideal ceiling — the gap this tool exists to close', () => {
    // 51 ppm is fine by the shock tool's 100 threshold, and is exactly where a
    // dichlor habit starts going unnoticed.
    expect(computeMaintenanceTarget({ cya: { known: true, ppm: 51 } }).warnings).toEqual([
      'CYA_ABOVE_IDEAL',
    ]);
    expect(computeMaintenanceTarget({ cya: { known: true, ppm: 99 } }).warnings).toEqual([
      'CYA_ABOVE_IDEAL',
    ]);
  });

  it('escalates to the existing CYA_HIGH code at the dilution threshold', () => {
    expect(computeMaintenanceTarget({ cya: { known: true, ppm: 100 } }).warnings).toEqual([
      'CYA_HIGH',
    ]);
    expect(computeMaintenanceTarget({ cya: { known: true, ppm: 180 } }).warnings).toEqual([
      'CYA_HIGH',
    ]);
  });

  it('flags that the answer was assumed when CYA is unknown', () => {
    const result = computeMaintenanceTarget({ cya: { known: false } });
    expect(result.warnings).toEqual(['CYA_UNKNOWN_ASSUMED']);
    expect(result.cyaUsed).toBeNull();
  });
});

describe('maintenance-target: unknown CYA propagates as a range', () => {
  it('spans the fallback CYA range instead of inventing a single number', () => {
    const result = computeMaintenanceTarget({ cya: { known: false } });
    // CYA_UNKNOWN_RANGE is 30-80: min FC 2.25 to 6, target 3.45 to 9.2.
    expect(result.minFC).toEqual({ isRange: true, min: 2.3, max: 6, unit: 'ppm' });
    expect(result.targetFC).toEqual({ isRange: true, min: 3.5, max: 9.2, unit: 'ppm' });
  });

  it('returns a single value, not a range, when CYA is known', () => {
    const result = computeMaintenanceTarget({ cya: { known: true, ppm: 40 } });
    expect(result.minFC).toEqual({ isRange: false, value: 3, unit: 'ppm' });
    expect(result.targetFC).toEqual({ isRange: false, value: 4.6, unit: 'ppm' });
    expect(result.cyaUsed).toBe(40);
  });
});

describe('maintenance-target: the classic "1-3 ppm" rule is wrong at high CYA', () => {
  it('demands more than 3 ppm well before the CYA high threshold', () => {
    // The owner's pool ran on "1-3 ppm" while CYA drifted up. At CYA 60 the
    // real minimum is already above the top of that advice.
    expect(minFcFor(60)).toBeGreaterThan(3);
    // And by the dilution threshold the old rule is off by more than 2x.
    expect(minFcFor(100)).toBeGreaterThan(3 * 2);
  });
});
