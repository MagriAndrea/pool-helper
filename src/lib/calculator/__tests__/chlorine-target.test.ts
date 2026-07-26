import { describe, expect, it } from 'vitest';
import { computeChlorineTarget } from '../chlorine-target';

describe('chlorine-target: perfect water (no algae shock)', () => {
  it('needs no shock when there is no combined chlorine reading', () => {
    const result = computeChlorineTarget({
      cya: { known: true, ppm: 50 },
      colorLevel: 'perfect',
      combinedCC: null,
    });
    expect(result).toEqual({
      slamTarget: null,
      breakpointTarget: null,
      floor: null,
      winningStrategy: 'none',
      targetFC: null,
      warnings: [],
    });
  });

  it('treats a combined chlorine of exactly 0 the same as "not provided" (0 is not > 0)', () => {
    const result = computeChlorineTarget({
      cya: { known: false },
      colorLevel: 'perfect',
      combinedCC: 0,
    });
    expect(result.winningStrategy).toBe('none');
    expect(result.targetFC).toBeNull();
  });

  it('requires a breakpoint shock when combined chlorine is present, even in perfect water', () => {
    const result = computeChlorineTarget({
      cya: { known: true, ppm: 20 },
      colorLevel: 'perfect',
      combinedCC: 0.3,
    });
    expect(result.breakpointTarget).toBe(3.0);
    expect(result.winningStrategy).toBe('breakpoint');
    expect(result.targetFC).toEqual({ isRange: false, value: 3, unit: 'ppm' });
    expect(result.warnings).toEqual([]); // 0.3 is below CC_HIGH_THRESHOLD (0.5)
  });

  it('raises CC_HIGH when combined chlorine exceeds the threshold, even in perfect water', () => {
    const result = computeChlorineTarget({
      cya: { known: true, ppm: 20 },
      colorLevel: 'perfect',
      combinedCC: 0.6,
    });
    expect(result.breakpointTarget).toBe(6.0);
    expect(result.warnings).toContain('CC_HIGH');
  });
});

describe('chlorine-target: CYA known, single deterministic target', () => {
  it('picks SLAM as the winner when it is the largest candidate', () => {
    // slam = 0.4 * 50 * 1.0 (light_green) = 20; floor = 10 -> slam wins
    const result = computeChlorineTarget({
      cya: { known: true, ppm: 50 },
      colorLevel: 'light_green',
      combinedCC: null,
    });
    expect(result.slamTarget).toBe(20);
    expect(result.floor).toBe(10);
    expect(result.breakpointTarget).toBeNull();
    expect(result.winningStrategy).toBe('slam');
    expect(result.targetFC).toEqual({ isRange: false, value: 20, unit: 'ppm' });
  });

  it('picks the color floor as the winner when SLAM undershoots it', () => {
    // slam = 0.4 * 5 * 2.5 (dark_green) = 5; floor = 20 -> floor wins
    const result = computeChlorineTarget({
      cya: { known: true, ppm: 5 },
      colorLevel: 'dark_green',
      combinedCC: null,
    });
    expect(result.slamTarget).toBe(5);
    expect(result.floor).toBe(20);
    expect(result.winningStrategy).toBe('floor');
    expect(result.targetFC).toEqual({ isRange: false, value: 20, unit: 'ppm' });
  });

  it('picks breakpoint as the winner when combined chlorine demands the largest target', () => {
    // slam = 0.4 * 5 * 1.0 (light_green) = 2; breakpoint = 10 * 5 = 50; floor = 10
    const result = computeChlorineTarget({
      cya: { known: true, ppm: 5 },
      colorLevel: 'light_green',
      combinedCC: 5,
    });
    expect(result.slamTarget).toBe(2);
    expect(result.breakpointTarget).toBe(50);
    expect(result.floor).toBe(10);
    expect(result.winningStrategy).toBe('breakpoint');
    expect(result.targetFC).toEqual({ isRange: false, value: 50, unit: 'ppm' });
    expect(result.warnings).toContain('CC_HIGH'); // 5 > 0.5
  });

  it('raises CYA_HIGH when CYA exceeds the threshold', () => {
    const result = computeChlorineTarget({
      cya: { known: true, ppm: 150 },
      colorLevel: 'light_green',
      combinedCC: null,
    });
    expect(result.slamTarget).toBe(60); // 0.4 * 150 * 1.0
    expect(result.warnings).toContain('CYA_HIGH');
  });

  it('breaks a tie between SLAM and floor in favor of SLAM (first candidate in the list wins ties)', () => {
    // slam = 0.4 * 25 * 1.0 (light_green) = 10, floor = 10 -> exact tie
    const result = computeChlorineTarget({
      cya: { known: true, ppm: 25 },
      colorLevel: 'light_green',
      combinedCC: null,
    });
    expect(result.slamTarget).toBe(10);
    expect(result.floor).toBe(10);
    expect(result.winningStrategy).toBe('slam');
    expect(result.targetFC).toEqual({ isRange: false, value: 10, unit: 'ppm' });
  });
});

describe('chlorine-target: CYA unknown, evaluated as a range', () => {
  it('produces a SLAM-dominated range spanning the CYA_UNKNOWN_RANGE bounds', () => {
    // slamAt(30) = 0.4*30*1 = 12, slamAt(80) = 0.4*80*1 = 32; floor = 10 -> slam dominates both ends
    const result = computeChlorineTarget({
      cya: { known: false },
      colorLevel: 'light_green',
      combinedCC: null,
    });
    expect(result.slamTarget).toBe(32); // reports slamMax regardless of who ends up winning
    expect(result.floor).toBe(10);
    expect(result.breakpointTarget).toBeNull();
    expect(result.winningStrategy).toBe('slam');
    expect(result.targetFC).toEqual({ isRange: true, min: 12, max: 32, unit: 'ppm' });
  });

  it('lets a large combined-chlorine breakpoint dominate both ends of the range (collapses to a point)', () => {
    // slamAt(30)=12, slamAt(80)=32; breakpoint = 10*6 = 60 dominates both bounds
    const result = computeChlorineTarget({
      cya: { known: false },
      colorLevel: 'light_green',
      combinedCC: 6,
    });
    expect(result.breakpointTarget).toBe(60);
    expect(result.winningStrategy).toBe('breakpoint');
    // Both bounds equal 60, so makeRange collapses this to a single value.
    expect(result.targetFC).toEqual({ isRange: false, value: 60, unit: 'ppm' });
    expect(result.warnings).toContain('CC_HIGH');
  });
});
