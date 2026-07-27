import { describe, expect, it } from 'vitest';
import {
  buildMaintenanceInput,
  DEFAULT_MAINTENANCE_STATE,
  PROJECTION_WEEKS,
  type MaintenanceState,
} from './use-chlorine-maintenance';
import { chlorineMaintenanceInputSchema } from '@/lib/api/schemas';

const state = (overrides: Partial<MaintenanceState> = {}): MaintenanceState => ({
  ...DEFAULT_MAINTENANCE_STATE,
  volume: { value: 50000, unit: 'L' },
  cyaPpm: 40,
  freeFC: 2,
  ...overrides,
});

/**
 * The hook builds the request body and the Zod schema validates it. Nothing in
 * TypeScript forces those two to agree at runtime — a `.positive()` added to a
 * field the hook can legitimately leave at 0 would 400 the tool on page load
 * without failing the build. So the contract is asserted here directly.
 */
describe('use-chlorine-maintenance: the hook and the API schema agree', () => {
  it('produces a body the endpoint accepts', () => {
    const body = buildMaintenanceInput(state());
    expect(body).not.toBeNull();
    expect(chlorineMaintenanceInputSchema.safeParse(body).success).toBe(true);
  });

  it('still agrees when both "I don\'t know" answers are used', () => {
    const body = buildMaintenanceInput(state({ cyaKnown: false, fcKnown: false }));
    expect(chlorineMaintenanceInputSchema.safeParse(body).success).toBe(true);
  });

  it('agrees for every product, liquid density included', () => {
    for (const productId of ['sodium_hypochlorite', 'calcium_hypochlorite', 'trichlor', 'dichlor'] as const) {
      const body = buildMaintenanceInput(state({ productId, concentrationPct: 50, densityKgL: 1.2 }));
      expect(chlorineMaintenanceInputSchema.safeParse(body).success).toBe(true);
    }
  });

  it('sends the projection horizon the schema allows', () => {
    const body = buildMaintenanceInput(state());
    expect(body?.projectionWeeks).toBe(PROJECTION_WEEKS);
    expect(PROJECTION_WEEKS).toBeGreaterThan(0);
    expect(Number.isInteger(PROJECTION_WEEKS)).toBe(true);
  });
});

describe('use-chlorine-maintenance: refuses to build an incomplete request', () => {
  it.each([
    ['no volume yet', { volume: null }],
    ['a zero volume', { volume: { value: 0, unit: 'L' as const } }],
    ['no concentration', { concentrationPct: 0 }],
    ['no daily demand', { dailyFcPpm: 0 }],
    ['"I know my CYA" but no number typed yet', { cyaKnown: true, cyaPpm: null }],
  ])('returns null for %s', (_label, overrides) => {
    expect(buildMaintenanceInput(state(overrides))).toBeNull();
  });

  it('does build when CYA is explicitly unknown', () => {
    // "I don't know" is an answer; an empty field is not.
    expect(buildMaintenanceInput(state({ cyaKnown: false, cyaPpm: null }))).not.toBeNull();
  });

  it('omits density entirely rather than sending a zero', () => {
    const body = buildMaintenanceInput(state({ densityKgL: 0 }));
    expect(body?.product).not.toHaveProperty('densityKgL');
    expect(chlorineMaintenanceInputSchema.safeParse(body).success).toBe(true);
  });
});

describe('use-chlorine-maintenance: defaults', () => {
  it('starts from the cited daily demand, and starts empty otherwise', () => {
    expect(DEFAULT_MAINTENANCE_STATE.dailyFcPpm).toBe(3);
    expect(DEFAULT_MAINTENANCE_STATE.volume).toBeNull();
    expect(DEFAULT_MAINTENANCE_STATE.cyaPpm).toBeNull();
    // Defaults to an unstabilized product: the tool should not nudge anyone
    // toward the stabilized ones it exists to warn about.
    expect(DEFAULT_MAINTENANCE_STATE.productId).toBe('sodium_hypochlorite');
  });
});
