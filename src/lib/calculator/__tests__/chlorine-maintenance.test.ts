import { describe, expect, it } from 'vitest';
import { computeChlorineMaintenance } from '../chlorine-maintenance';
import type { ChlorineMaintenanceInput } from '../types';

const input = (overrides: Partial<ChlorineMaintenanceInput> = {}): ChlorineMaintenanceInput => ({
  volume: { value: 50000, unit: 'L' },
  cya: { known: true, ppm: 40 },
  currentFC: { known: true, freeFC: 2 },
  product: { id: 'sodium_hypochlorite', concentrationPct: 13 },
  dailyFcPpm: 3,
  projectionWeeks: 12,
  ...overrides,
});

describe('chlorine-maintenance: composes the primitives', () => {
  it('reports the target band for the given CYA', () => {
    const result = computeChlorineMaintenance(input());
    // CYA 40 -> min 7.5% = 3, target 11.5% = 4.6
    expect(result.target.minFC).toEqual({ isRange: false, value: 3, unit: 'ppm' });
    expect(result.target.targetFC).toEqual({ isRange: false, value: 4.6, unit: 'ppm' });
  });

  it('doses the gap between current FC and the target', () => {
    const result = computeChlorineMaintenance(input());
    // 4.6 target - 2 current = 2.6 ppm over 50000 L = 130 g of pure chlorine
    expect(result.dose?.gap).toEqual({ isRange: false, value: 2.6, unit: 'ppm' });
    expect(result.dose?.pureChlorine).toEqual({ isRange: false, value: 130, unit: 'g' });
    expect(result.isAtTarget).toBe(false);
    expect(result.product).not.toBeNull();
  });

  it('says "add nothing" when free chlorine already clears the target', () => {
    const result = computeChlorineMaintenance(input({ currentFC: { known: true, freeFC: 6 } }));
    expect(result.isAtTarget).toBe(true);
    expect(result.product).toBeNull();
  });

  it('keeps the breakdown numbers the UI shows', () => {
    const result = computeChlorineMaintenance(input());
    expect(result.breakdown.volumeL).toBe(50000);
    expect(result.breakdown.cyaUsed).toBe(40);
    expect(result.breakdown.cyaAssumed).toBe(false);
    expect(result.breakdown.currentFC).toBe(2);
    expect(result.breakdown.dailyFcPpm).toBe(3);
  });
});

describe('chlorine-maintenance: the projection is only offered when it is honest', () => {
  it('projects when CYA was measured', () => {
    const result = computeChlorineMaintenance(input({ product: { id: 'dichlor', concentrationPct: 56 } }));
    expect(result.projection).not.toBeNull();
    expect(result.projection?.trend).toBe('rising');
  });

  it('returns null when CYA is unknown, rather than projecting from a guess', () => {
    const result = computeChlorineMaintenance(
      input({ cya: { known: false }, product: { id: 'dichlor', concentrationPct: 56 } }),
    );
    expect(result.projection).toBeNull();
    expect(result.warnings).toContain('CYA_UNKNOWN_ASSUMED');
    // The target still works — it just comes back as a range.
    expect(result.target.minFC.isRange).toBe(true);
  });

  it('reports a falling trend for an unstabilized product', () => {
    const result = computeChlorineMaintenance(input());
    expect(result.projection?.trend).toBe('falling');
    expect(result.projection?.weeksToCeiling).toBeNull();
  });
});

describe('chlorine-maintenance: warnings from every layer reach the caller', () => {
  it('surfaces CYA_ABOVE_IDEAL from the target primitive', () => {
    const result = computeChlorineMaintenance(input({ cya: { known: true, ppm: 60 } }));
    expect(result.warnings).toContain('CYA_ABOVE_IDEAL');
  });

  it('surfaces CYA_LOCK_RISK from the projection when still dosing stabilized chlorine', () => {
    const result = computeChlorineMaintenance(
      input({ cya: { known: true, ppm: 90 }, product: { id: 'trichlor', concentrationPct: 90 } }),
    );
    expect(result.warnings).toContain('CYA_LOCK_RISK');
  });

  it('does not warn about lock risk when the same pool uses unstabilized chlorine', () => {
    const result = computeChlorineMaintenance(input({ cya: { known: true, ppm: 90 } }));
    expect(result.warnings).not.toContain('CYA_LOCK_RISK');
  });

  it('hands the caller a duplicate-free list', () => {
    // Honest scope: the orchestrator dedupes, but today no duplicate is even
    // reachable — maintenance-target, chlorine-dose and cya-projection raise
    // disjoint sets of codes. A mutation removing the dedupe therefore does NOT
    // fail this test, and that is correct rather than a gap to paper over.
    // It stands as a regression guard for the day those sets start to overlap.
    const result = computeChlorineMaintenance(input({ cya: { known: true, ppm: 120 } }));
    expect(new Set(result.warnings).size).toBe(result.warnings.length);
  });

  it('collects warnings from every primitive into one list', () => {
    // The union is the property that actually matters: a UI reading only
    // `result.warnings` must not miss anything a sub-result raised.
    const result = computeChlorineMaintenance(
      input({ cya: { known: true, ppm: 120 }, product: { id: 'dichlor', concentrationPct: 56 } }),
    );
    for (const code of result.target.warnings) expect(result.warnings).toContain(code);
    for (const code of result.projection?.warnings ?? []) expect(result.warnings).toContain(code);
    for (const code of result.dose?.warnings ?? []) expect(result.warnings).toContain(code);
  });
});

describe('chlorine-maintenance: the owner\'s scenario', () => {
  it('shows a dichlor habit crossing the ideal ceiling within weeks', () => {
    // A pool that looks fine today: CYA 40, in range, chlorine at target.
    const result = computeChlorineMaintenance(
      input({ cya: { known: true, ppm: 40 }, product: { id: 'dichlor', concentrationPct: 56 } }),
    );
    expect(result.warnings).not.toContain('CYA_ABOVE_IDEAL'); // nothing wrong yet
    expect(result.projection?.trend).toBe('rising');
    // ...and yet it leaves the ideal band in well under a month.
    expect(result.projection?.weeksToCeiling).toBeLessThan(1);
  });

  it('tells the user their dose is also delivering stabilizer', () => {
    const result = computeChlorineMaintenance(
      input({ product: { id: 'dichlor', concentrationPct: 56 } }),
    );
    expect(result.product?.sideEffects.cyaAddedPpm).toBeGreaterThan(0);
  });
});
