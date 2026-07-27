import { useEffect, useState } from 'react';
import {
  DEFAULT_DAILY_FC_PPM,
  PRODUCT_RETAIL_FORMS,
  type ChlorineMaintenanceInput,
  type ChlorineMaintenanceResult,
  type ProductId,
  type VolumeInput,
} from '@/lib/calculator';
import { SHARED_KEYS, TOOL_KEYS } from '@/lib/shared-state';
import { useToolState, type SharedMapping } from './use-tool-state';

/** A season's worth of weeks — long enough to show a habit's consequences. */
export const PROJECTION_WEEKS = 12;

export interface MaintenanceState {
  volume: VolumeInput | null;
  cyaKnown: boolean;
  cyaPpm: number | null;
  fcKnown: boolean;
  freeFC: number | null;
  /** The product used for ROUTINE chlorination, stabilized ones included. */
  productId: ProductId;
  concentrationPct: number;
  densityKgL: number | null;
  /** ppm of FC the pool consumes per day. Measurable, hence editable. */
  dailyFcPpm: number;
}

export const DEFAULT_MAINTENANCE_STATE: MaintenanceState = {
  volume: null,
  cyaKnown: true,
  cyaPpm: null,
  fcKnown: true,
  freeFC: null,
  productId: 'sodium_hypochlorite',
  concentrationPct: PRODUCT_RETAIL_FORMS.sodium_hypochlorite.typicalConcentrationPct,
  densityKgL: null,
  dailyFcPpm: DEFAULT_DAILY_FC_PPM,
};

/** Volume, CYA and FC describe the pool itself, so they travel between tools. */
const MAPPINGS: SharedMapping<MaintenanceState>[] = [
  {
    sharedKey: SHARED_KEYS.poolVolume,
    has: (s) => s.volume != null,
    get: (s) => s.volume ?? undefined,
    embed: (s, v) => ({ ...s, volume: v as VolumeInput }),
  },
  {
    sharedKey: SHARED_KEYS.poolCYA,
    has: (s) => s.cyaPpm != null,
    get: (s) => (s.cyaKnown && s.cyaPpm != null ? s.cyaPpm : undefined),
    embed: (s, v) => ({ ...s, cyaPpm: v as number }),
  },
  {
    sharedKey: SHARED_KEYS.poolFC,
    has: (s) => s.freeFC != null,
    get: (s) => (s.fcKnown && s.freeFC != null ? s.freeFC : undefined),
    embed: (s, v) => ({ ...s, freeFC: v as number }),
  },
];

/** Build the API input, or null while the form cannot be computed yet. */
export function buildMaintenanceInput(s: MaintenanceState): ChlorineMaintenanceInput | null {
  if (!s.volume || s.volume.value <= 0) return null;
  if (s.concentrationPct <= 0 || s.dailyFcPpm <= 0) return null;
  // "I know my CYA" with no number yet is an incomplete form, not an unknown.
  if (s.cyaKnown && s.cyaPpm == null) return null;

  return {
    volume: s.volume,
    cya: s.cyaKnown && s.cyaPpm != null ? { known: true, ppm: s.cyaPpm } : { known: false },
    currentFC:
      s.fcKnown && s.freeFC != null ? { known: true, freeFC: s.freeFC } : { known: false },
    product: {
      id: s.productId,
      concentrationPct: s.concentrationPct,
      ...(s.densityKgL != null && s.densityKgL > 0 ? { densityKgL: s.densityKgL } : {}),
    },
    dailyFcPpm: s.dailyFcPpm,
    projectionWeeks: PROJECTION_WEEKS,
  };
}

export function useChlorineMaintenance() {
  const { state, setState, reset, isHydrated } = useToolState<MaintenanceState>(
    TOOL_KEYS.maintenance,
    DEFAULT_MAINTENANCE_STATE,
    MAPPINGS,
  );

  const [result, setResult] = useState<ChlorineMaintenanceResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (patch: Partial<MaintenanceState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  };

  /**
   * Switching product resets what belongs to the product: its typical strength,
   * and the density only a liquid has. What the user measured about the pool
   * (volume, CYA, FC) is untouched.
   */
  const selectProduct = (productId: ProductId) => {
    const retail = PRODUCT_RETAIL_FORMS[productId];
    update({
      productId,
      concentrationPct: retail.typicalConcentrationPct,
      densityKgL: null,
    });
  };

  const input = buildMaintenanceInput(state);
  const inputKey = input ? JSON.stringify(input) : null;

  useEffect(() => {
    if (!inputKey) {
      setResult(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/v1/calculate/chlorine-maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: inputKey,
        });
        if (!response.ok) throw new Error('Failed to fetch maintenance results');
        setResult((await response.json()) as ChlorineMaintenanceResult);
      } catch (err) {
        console.error(err);
        setError('Failed to calculate results');
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [inputKey]);

  const resetValues = () => {
    reset();
    setResult(null);
  };

  return {
    state,
    update,
    selectProduct,
    result,
    isLoading,
    error,
    isHydrated,
    resetValues,
  };
}
