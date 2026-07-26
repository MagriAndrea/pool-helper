import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { emptySlot, migrateLegacyKeys, type ComparisonState } from './use-chlorine-comparison';
import { LEGACY_KEYS, TOOL_KEYS } from '@/lib/shared-state';

/**
 * The migration rewrites data the user typed before the A/B slot refactor. It
 * runs once and then deletes its own inputs, so a mistake here is invisible
 * afterwards — hence tests rather than a manual browser check.
 */

/** Minimal localStorage stand-in; the suite runs in the `node` environment. */
function fakeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    has: (key: string) => store.has(key),
  };
}

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
  storage = fakeStorage();
  vi.stubGlobal('window', { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const readMigrated = (): ComparisonState => {
  const raw = storage.getItem(TOOL_KEYS.comparison);
  if (!raw) throw new Error('nothing was written to the tool key');
  return JSON.parse(raw) as ComparisonState;
};

describe('use-chlorine-comparison: emptySlot', () => {
  it('prefills a solid product with its typical concentration and no density', () => {
    expect(emptySlot('calcium_hypochlorite')).toEqual({
      productId: 'calcium_hypochlorite',
      price: 0,
      quantity: 0,
      unit: 'kg',
      concentration: 65,
    });
  });

  it('prefills a liquid product by the litre, with its typical density', () => {
    expect(emptySlot('sodium_hypochlorite')).toEqual({
      productId: 'sodium_hypochlorite',
      price: 0,
      quantity: 0,
      unit: 'l',
      density: 1.2,
      concentration: 13,
    });
  });
});

describe('use-chlorine-comparison: migrateLegacyKeys', () => {
  it('does nothing when there is no legacy data at all', () => {
    migrateLegacyKeys();
    expect(storage.has(TOOL_KEYS.comparison)).toBe(false);
  });

  it('converts both legacy keys into slot A (calcium) and slot B (sodium)', () => {
    storage.setItem(
      LEGACY_KEYS.comparisonCalcium,
      JSON.stringify({ price: 50, weight: 10, concentration: 65 }),
    );
    storage.setItem(
      LEGACY_KEYS.comparisonSodium,
      JSON.stringify({ price: 20, quantity: 20, unit: 'l', density: 1.2, concentration: 14 }),
    );

    migrateLegacyKeys();

    expect(readMigrated()).toEqual({
      slotA: {
        productId: 'calcium_hypochlorite',
        price: 50,
        quantity: 10, // the old `weight` field
        unit: 'kg',
        concentration: 65,
      },
      slotB: {
        productId: 'sodium_hypochlorite',
        price: 20,
        quantity: 20,
        unit: 'l',
        density: 1.2,
        concentration: 14,
      },
    });
  });

  it('deletes the legacy keys so it never runs twice', () => {
    storage.setItem(LEGACY_KEYS.comparisonCalcium, JSON.stringify({ price: 1, weight: 2 }));
    storage.setItem(LEGACY_KEYS.comparisonSodium, JSON.stringify({ price: 3, quantity: 4 }));

    migrateLegacyKeys();

    expect(storage.has(LEGACY_KEYS.comparisonCalcium)).toBe(false);
    expect(storage.has(LEGACY_KEYS.comparisonSodium)).toBe(false);
  });

  it('migrates one side alone, leaving the other as a fresh empty slot', () => {
    storage.setItem(
      LEGACY_KEYS.comparisonSodium,
      JSON.stringify({ price: 18, quantity: 25, unit: 'kg', concentration: 15 }),
    );

    migrateLegacyKeys();

    const migrated = readMigrated();
    expect(migrated.slotB.quantity).toBe(25);
    expect(migrated.slotB.unit).toBe('kg');
    expect(migrated.slotA).toEqual(emptySlot('calcium_hypochlorite'));
  });

  it('never overwrites state the user already has under the new key', () => {
    const existing: ComparisonState = {
      slotA: { ...emptySlot('sodium_hypochlorite'), price: 999 },
      slotB: emptySlot('sodium_hypochlorite'),
    };
    storage.setItem(TOOL_KEYS.comparison, JSON.stringify(existing));
    storage.setItem(
      LEGACY_KEYS.comparisonCalcium,
      JSON.stringify({ price: 1, weight: 1, concentration: 50 }),
    );

    migrateLegacyKeys();

    expect(readMigrated()).toEqual(existing);
    // Legacy data is left in place rather than silently discarded.
    expect(storage.has(LEGACY_KEYS.comparisonCalcium)).toBe(true);
  });

  it('falls back to defaults for missing or non-numeric legacy fields', () => {
    storage.setItem(
      LEGACY_KEYS.comparisonCalcium,
      JSON.stringify({ price: 'not a number', concentration: null }),
    );

    migrateLegacyKeys();

    const fresh = emptySlot('calcium_hypochlorite');
    expect(readMigrated().slotA).toEqual(fresh);
  });

  it('replaces a non-positive legacy density with the typical one', () => {
    storage.setItem(
      LEGACY_KEYS.comparisonSodium,
      JSON.stringify({ price: 10, quantity: 5, unit: 'l', density: 0, concentration: 14 }),
    );

    migrateLegacyKeys();

    expect(readMigrated().slotB.density).toBe(1.2);
  });

  it('survives corrupted legacy JSON without throwing', () => {
    storage.setItem(LEGACY_KEYS.comparisonCalcium, '{not json at all');
    storage.setItem(
      LEGACY_KEYS.comparisonSodium,
      JSON.stringify({ price: 7, quantity: 3, unit: 'l', concentration: 12 }),
    );

    expect(() => migrateLegacyKeys()).not.toThrow();
    // The readable side still migrates.
    expect(readMigrated().slotB.quantity).toBe(3);
  });
});
