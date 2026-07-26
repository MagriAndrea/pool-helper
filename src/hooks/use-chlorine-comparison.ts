import { useEffect, useState } from 'react';
import {
  PRODUCT_RETAIL_FORMS,
  type ComparisonProductInput,
  type ComparisonResult,
  type ComparisonSlotId,
  type ProductId,
} from '@/lib/calculator';
import { LEGACY_KEYS, TOOL_KEYS } from '@/lib/shared-state';
import { useToolState, type SharedMapping } from './use-tool-state';

export interface ComparisonState {
  slotA: ComparisonProductInput;
  slotB: ComparisonProductInput;
}

/** An empty slot holding a product, prefilled with that product's typical label values. */
export function emptySlot(productId: ProductId): ComparisonProductInput {
  const retail = PRODUCT_RETAIL_FORMS[productId];
  return {
    productId,
    price: 0,
    quantity: 0,
    concentration: retail.typicalConcentrationPct,
    ...(retail.form === 'liquid'
      ? { unit: 'l' as const, density: retail.typicalDensityKgL }
      : { unit: 'kg' as const }),
  };
}

/** Defaults reproduce the pre-slot layout: solid on the left, liquid on the right. */
const DEFAULT_STATE: ComparisonState = {
  slotA: emptySlot('calcium_hypochlorite'),
  slotB: emptySlot('sodium_hypochlorite'),
};

/** Nothing here is pool *reality*, so no value is mirrored to the shared keys. */
const NO_SHARED_MAPPINGS: SharedMapping<ComparisonState>[] = [];

function readLegacy(key: string): Record<string, unknown> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch (error) {
    console.warn(`Error reading legacy localStorage key "${key}":`, error);
    return null;
  }
}

const num = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/**
 * One-shot migration off the pre-slot storage layout (`ph_calcium_input` +
 * `ph_sodium_input`) onto `TOOL_KEYS.comparison`.
 *
 * The old calcium side was solid-only and stored `weight`; the old sodium side
 * stored `quantity` + `unit` + `density`. Both become ordinary slots — calcium
 * in A and sodium in B, matching where they used to sit on screen. The legacy
 * keys are removed afterwards so this runs at most once per browser.
 *
 * Exported for `use-chlorine-comparison.test.ts`: this silently rewrites data a
 * user typed months ago, and there is no way to notice it going wrong in a
 * browser that has already been migrated.
 */
export function migrateLegacyKeys(): void {
  if (window.localStorage.getItem(TOOL_KEYS.comparison)) return;

  const legacyCalcium = readLegacy(LEGACY_KEYS.comparisonCalcium);
  const legacySodium = readLegacy(LEGACY_KEYS.comparisonSodium);
  if (!legacyCalcium && !legacySodium) return;

  const migrated: ComparisonState = {
    slotA: emptySlot('calcium_hypochlorite'),
    slotB: emptySlot('sodium_hypochlorite'),
  };

  if (legacyCalcium) {
    migrated.slotA = {
      ...migrated.slotA,
      price: num(legacyCalcium.price, migrated.slotA.price),
      quantity: num(legacyCalcium.weight, migrated.slotA.quantity),
      concentration: num(legacyCalcium.concentration, migrated.slotA.concentration),
    };
  }

  if (legacySodium) {
    const legacyDensity = num(legacySodium.density, 0);
    migrated.slotB = {
      ...migrated.slotB,
      price: num(legacySodium.price, migrated.slotB.price),
      quantity: num(legacySodium.quantity, migrated.slotB.quantity),
      unit: legacySodium.unit === 'kg' ? 'kg' : 'l',
      density: legacyDensity > 0 ? legacyDensity : migrated.slotB.density,
      concentration: num(legacySodium.concentration, migrated.slotB.concentration),
    };
  }

  try {
    window.localStorage.setItem(TOOL_KEYS.comparison, JSON.stringify(migrated));
    window.localStorage.removeItem(LEGACY_KEYS.comparisonCalcium);
    window.localStorage.removeItem(LEGACY_KEYS.comparisonSodium);
  } catch (error) {
    console.warn('Error migrating the chlorine-comparison storage keys:', error);
  }
}

export function useChlorineComparison() {
  const { state, setState, reset } = useToolState<ComparisonState>(
    TOOL_KEYS.comparison,
    DEFAULT_STATE,
    NO_SHARED_MAPPINGS,
    migrateLegacyKeys,
  );

  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSlot = (slot: ComparisonSlotId, input: ComparisonProductInput) => {
    setState((prev) => ({ ...prev, [slot === 'A' ? 'slotA' : 'slotB']: input }));
  };

  /**
   * Switching a slot's product keeps what the user typed about the package
   * (price, size) and resets what belongs to the product itself: concentration,
   * and the unit/density a solid cannot have.
   */
  const setSlotProduct = (slot: ComparisonSlotId, productId: ProductId) => {
    setState((prev) => {
      const key = slot === 'A' ? 'slotA' : 'slotB';
      const current = prev[key];
      return {
        ...prev,
        [key]: { ...emptySlot(productId), price: current.price, quantity: current.quantity },
      };
    });
  };

  useEffect(() => {
    // Debounce the API call
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/v1/calculate/chlorine', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(state),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch calculation results');
        }

        const result: ComparisonResult = await response.json();
        setComparison(result);
      } catch (err) {
        console.error(err);
        setError('Failed to calculate results');
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [state]);

  const resetValues = () => {
    reset();
    setComparison(null);
  };

  return {
    slots: state,
    setSlot,
    setSlotProduct,
    comparison,
    isLoading,
    error,
    resetValues,
  };
}
