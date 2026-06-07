import { useEffect, useMemo, useState } from 'react';
import type {
  CircleDims,
  LengthUnit,
  PoolShape,
  PoolVolumeResult,
  RectangleDims,
} from '@/lib/calculator';
import { SHARED_KEYS, TOOL_KEYS } from '@/lib/shared-state';
import { useToolState } from './use-tool-state';

export interface PoolVolumeState {
  shape: PoolShape;
  unit: LengthUnit;
  length: number | null; // rectangle
  width: number | null; // rectangle
  diameter: number | null; // circle
  depth: number | null; // shared (uniform depth)
}

export const DEFAULT_POOL_VOLUME_STATE: PoolVolumeState = {
  shape: 'rectangle',
  unit: 'm',
  length: null,
  width: null,
  diameter: null,
  depth: null,
};

/** Build the API request, or null when the form isn't computable yet. */
export function buildVolumeInput(
  s: PoolVolumeState,
): { shape: PoolShape; dimensions: RectangleDims | CircleDims } | null {
  if (s.depth == null || s.depth <= 0) return null;

  if (s.shape === 'rectangle') {
    if (s.length == null || s.length <= 0 || s.width == null || s.width <= 0) return null;
    return {
      shape: 'rectangle',
      dimensions: { length: s.length, width: s.width, depth: s.depth, unit: s.unit },
    };
  }

  if (s.diameter == null || s.diameter <= 0) return null;
  return { shape: 'circle', dimensions: { diameter: s.diameter, depth: s.depth, unit: s.unit } };
}

export function usePoolVolume() {
  // No shared mappings: the shared value is the OUTPUT (volume), written below.
  const { state, setState, reset: resetState, isHydrated } = useToolState<PoolVolumeState>(
    TOOL_KEYS.volume,
    DEFAULT_POOL_VOLUME_STATE,
  );

  const [result, setResult] = useState<PoolVolumeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input = useMemo(() => buildVolumeInput(state), [state]);

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
        const response = await fetch('/api/v1/calculate/pool-volume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });
        if (!response.ok) throw new Error('Failed to calculate volume');
        const data = (await response.json()) as PoolVolumeResult;
        setResult(data);
        // Publish to the shared pool profile so other tools (e.g. Shock) reuse it.
        if (data.volumeL > 0) {
          try {
            window.localStorage.setItem(
              SHARED_KEYS.poolVolume,
              JSON.stringify({ value: data.volumeL, unit: 'L' }),
            );
          } catch {
            /* ignore quota/availability errors */
          }
        }
      } catch (err) {
        console.error(err);
        setError('calculation_failed');
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [input, isHydrated]);

  /** Full wipe: clears the tool inputs AND the shared volume. */
  const reset = () => {
    resetState();
    try {
      window.localStorage.removeItem(SHARED_KEYS.poolVolume);
    } catch {
      /* ignore */
    }
    setResult(null);
  };

  return { state, setState, reset, result, isLoading, error, isHydrated };
}
