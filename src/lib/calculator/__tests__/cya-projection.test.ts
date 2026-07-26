import { describe, expect, it } from 'vitest';
import { projectCya } from '../cya-projection';
import { CYA_IDEAL_RANGE } from '../constants';

const base = {
  currentCyaPpm: 40,
  dailyFcPpm: 3,
  weeks: 8,
};

describe('cya-projection: accumulation from stabilized products', () => {
  it('adds 0.9 ppm CYA per ppm FC for dichlor', () => {
    // 3 ppm/day * 0.9 * 7 days = 18.9 ppm CYA per week
    const result = projectCya({ ...base, productId: 'dichlor' });
    expect(result.addedPpmPerWeek).toBeCloseTo(18.9, 10);
  });

  it('adds 0.6 ppm CYA per ppm FC for trichlor', () => {
    // 3 * 0.6 * 7 = 12.6
    const result = projectCya({ ...base, productId: 'trichlor' });
    expect(result.addedPpmPerWeek).toBeCloseTo(12.6, 10);
  });

  it('adds nothing for unstabilized products', () => {
    for (const productId of ['sodium_hypochlorite', 'calcium_hypochlorite'] as const) {
      expect(projectCya({ ...base, productId }).addedPpmPerWeek).toBe(0);
    }
  });
});

describe('cya-projection: degradation is subtracted', () => {
  it('converts the monthly degradation figure to a weekly one', () => {
    // Default is 2 ppm/month -> 2 * 7 / 30 = 0.4667 -> 0.5 rounded
    const result = projectCya({ ...base, productId: 'dichlor' });
    expect(result.degradedPpmPerWeek).toBeCloseTo(0.5, 10);
    expect(result.netPpmPerWeek).toBeCloseTo(18.4, 1);
  });

  it('honours an explicit degradation rate', () => {
    // 10 ppm/month -> 2.333/week
    const result = projectCya({
      ...base,
      productId: 'dichlor',
      degradationPpmPerMonth: 10,
    });
    expect(result.degradedPpmPerWeek).toBeCloseTo(2.3, 10);
  });

  it('makes the net NEGATIVE for an unstabilized product — nothing added, something lost', () => {
    const result = projectCya({ ...base, productId: 'sodium_hypochlorite' });
    expect(result.netPpmPerWeek).toBeLessThan(0);
    expect(result.trend).toBe('falling');
  });
});

describe('cya-projection: the "when do I leave the range" answer', () => {
  it('projects the weeks to the ceiling for a rising pool', () => {
    // From CYA 40 to the ideal ceiling 50 = 10 ppm, at ~18.4 ppm/week.
    const result = projectCya({ ...base, productId: 'dichlor' });
    expect(result.trend).toBe('rising');
    expect(result.weeksToCeiling).toBeCloseTo(0.5, 1);
  });

  it('returns null — never Infinity — when CYA is falling', () => {
    const result = projectCya({ ...base, productId: 'calcium_hypochlorite' });
    expect(result.weeksToCeiling).toBeNull();
    expect(Number.isFinite(result.netPpmPerWeek)).toBe(true);
  });

  it('returns null when accumulation and degradation cancel out', () => {
    // Choose a daily FC so that added == degraded exactly:
    // added = fc * 0.9 * 7, degraded = 2 * 7 / 30 -> fc = 2/(30*0.9)
    const result = projectCya({
      ...base,
      productId: 'dichlor',
      dailyFcPpm: 2 / (30 * 0.9),
    });
    expect(result.trend).toBe('stable');
    expect(result.weeksToCeiling).toBeNull();
  });

  it('reports 0 weeks when the pool is already over the ceiling', () => {
    const result = projectCya({ ...base, currentCyaPpm: 70, productId: 'dichlor' });
    expect(result.weeksToCeiling).toBe(0);
  });

  it('defaults the ceiling to the ideal band, and accepts an explicit one', () => {
    const toIdeal = projectCya({ ...base, productId: 'trichlor' });
    const toHigh = projectCya({ ...base, productId: 'trichlor', ceilingPpm: 100 });
    expect(CYA_IDEAL_RANGE.max).toBe(50);
    expect(toHigh.weeksToCeiling).toBeGreaterThan(toIdeal.weeksToCeiling ?? 0);
  });
});

describe('cya-projection: the owner\'s story, in numbers', () => {
  it('takes about three weeks of dichlor to go from in-range to the dilution threshold', () => {
    // CYA 40 -> 100 at 3 ppm FC/day of dichlor. The problem that felt like it
    // took years actually builds in a month of season.
    const result = projectCya({
      currentCyaPpm: 40,
      productId: 'dichlor',
      dailyFcPpm: 3,
      weeks: 12,
      ceilingPpm: 100,
    });
    expect(result.weeksToCeiling).toBeGreaterThan(3);
    expect(result.weeksToCeiling).toBeLessThan(3.5);
  });

  it('warns CYA_LOCK_RISK when a stabilized product is still in use past the ceiling', () => {
    const result = projectCya({ ...base, currentCyaPpm: 90, productId: 'dichlor' });
    expect(result.warnings).toContain('CYA_LOCK_RISK');
  });

  it('does NOT warn when the pool is past the ceiling but on unstabilized chlorine', () => {
    // High CYA is a problem, but this projection is about what the PRODUCT does,
    // and liquid chlorine is the way out rather than the cause.
    const result = projectCya({ ...base, currentCyaPpm: 90, productId: 'sodium_hypochlorite' });
    expect(result.warnings).toEqual([]);
  });
});

describe('cya-projection: the week-by-week points', () => {
  it('starts at today\'s CYA and walks forward one week at a time', () => {
    const result = projectCya({ ...base, productId: 'dichlor', weeks: 3 });
    expect(result.points).toHaveLength(4); // week 0 through 3
    expect(result.points[0]).toEqual({ week: 0, cyaPpm: 40 });
    expect(result.points[3].cyaPpm).toBeCloseTo(40 + result.netPpmPerWeek * 3, 0);
  });

  it('never projects CYA below zero', () => {
    // Falling fast from an almost-empty pool.
    const result = projectCya({
      currentCyaPpm: 1,
      productId: 'sodium_hypochlorite',
      dailyFcPpm: 3,
      degradationPpmPerMonth: 10,
      weeks: 12,
    });
    expect(Math.min(...result.points.map((p) => p.cyaPpm))).toBe(0);
  });

  it('handles a zero-week horizon without producing an empty projection', () => {
    const result = projectCya({ ...base, productId: 'dichlor', weeks: 0 });
    expect(result.points).toEqual([{ week: 0, cyaPpm: 40 }]);
  });
});
