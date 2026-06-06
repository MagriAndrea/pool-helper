import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_CALCIUM_PCT,
  DEFAULT_SODIUM_TRADE_PCT,
} from '@/lib/calculator';
import type {
  ChlorineInput,
  ColorLevel,
  CyaInput,
  ProductId,
  ShockInput,
  ShockResult,
  Unit,
} from '@/lib/calculator';
import { SHARED_KEYS, TOOL_KEYS } from '@/lib/shared-state';
import { SharedMapping, useToolState } from './use-tool-state';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export interface ShockVolume {
  value: number;
  unit: Unit;
}

export interface ShockState {
  // Step 1 — volume (shared)
  volume: ShockVolume | null;
  // Step 2 — water color
  colorLevel: ColorLevel | null;
  // Step 3 — cyanuric acid (cyaPpm shared)
  cyaKnown: boolean;
  cyaPpm: number | null;
  // Step 4 — current chlorine (freeFC, combinedCC shared)
  chlorineKnown: boolean;
  freeFC: number | null;
  combinedCC: number | null;
  // Result — product choice
  selectedProduct: ProductId | null;
  sodiumConcentration: number;
  calciumConcentration: number;
}

export const DEFAULT_SHOCK_STATE: ShockState = {
  volume: null,
  colorLevel: null,
  cyaKnown: true,
  cyaPpm: null,
  chlorineKnown: true,
  freeFC: null,
  combinedCC: null,
  selectedProduct: null,
  sodiumConcentration: DEFAULT_SODIUM_TRADE_PCT,
  calciumConcentration: DEFAULT_CALCIUM_PCT,
};

// ---------------------------------------------------------------------------
// Shared-key mappings (the "pool profile" sync)
// ---------------------------------------------------------------------------

const MAPPINGS: SharedMapping<ShockState>[] = [
  {
    sharedKey: SHARED_KEYS.poolVolume,
    has: (s) => s.volume != null,
    get: (s) => s.volume ?? undefined,
    embed: (s, v) => ({ ...s, volume: v as ShockVolume }),
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
    get: (s) => (s.chlorineKnown && s.freeFC != null ? s.freeFC : undefined),
    embed: (s, v) => ({ ...s, freeFC: v as number }),
  },
  {
    sharedKey: SHARED_KEYS.poolCC,
    has: (s) => s.combinedCC != null,
    get: (s) => (s.chlorineKnown && s.combinedCC != null ? s.combinedCC : undefined),
    embed: (s, v) => ({ ...s, combinedCC: v as number }),
  },
];

// ---------------------------------------------------------------------------
// State → API input
// ---------------------------------------------------------------------------

function buildProduct(s: ShockState): ShockInput['product'] {
  if (s.selectedProduct === 'calcium_hypochlorite') {
    return { id: 'calcium_hypochlorite', concentrationPct: s.calciumConcentration };
  }
  // Default to sodium (also used as a placeholder before the user picks one).
  return { id: 'sodium_hypochlorite', concentrationPct: s.sodiumConcentration };
}

/** Build the API input, or null when the form isn't computable yet. */
export function buildShockInput(s: ShockState): ShockInput | null {
  if (!s.volume || s.volume.value <= 0 || !s.colorLevel) return null;

  // Perfect water skips steps 3-4; only the (optional) combined chlorine matters.
  if (s.colorLevel === 'perfect') {
    const chlorine: ChlorineInput =
      s.combinedCC != null
        ? { known: true, freeFC: 0, combinedCC: s.combinedCC }
        : { known: true, freeFC: 0, combinedCC: 0 };
    return {
      volume: s.volume,
      colorLevel: 'perfect',
      cya: { known: false },
      chlorine,
      product: buildProduct(s),
    };
  }

  if (s.cyaKnown && s.cyaPpm == null) return null;
  if (s.chlorineKnown && s.freeFC == null) return null;

  const cya: CyaInput = s.cyaKnown ? { known: true, ppm: s.cyaPpm as number } : { known: false };
  const chlorine: ChlorineInput = s.chlorineKnown
    ? { known: true, freeFC: s.freeFC as number, combinedCC: s.combinedCC ?? undefined }
    : { known: false };

  return { volume: s.volume, colorLevel: s.colorLevel, cya, chlorine, product: buildProduct(s) };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useShockCalculator() {
  const { state, setState, reset: resetState, isHydrated } = useToolState<ShockState>(
    TOOL_KEYS.shock,
    DEFAULT_SHOCK_STATE,
    MAPPINGS,
  );

  const [result, setResult] = useState<ShockResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo(() => buildShockInput(state), [state]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!input) {
      setResult(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/v1/calculate/shock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!response.ok) throw new Error('Failed to calculate shock');
        setResult((await response.json()) as ShockResult);
      } catch (err) {
        console.error(err);
        setError('calculation_failed');
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [input, isHydrated]);

  /**
   * "Start over" — full wipe: clears every field of the tool, including the
   * shared pool profile (volume, CYA, FC, CC), so nothing is kept and the reset
   * sticks across reloads.
   */
  const reset = () => {
    resetState();
    setResult(null);
  };

  return { state, setState, reset, result, isLoading, error, isHydrated, input };
}
