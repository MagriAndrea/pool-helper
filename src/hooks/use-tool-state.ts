import { useEffect, useState } from 'react';

/**
 * Describes how one field of a tool's state mirrors to/from a shared
 * localStorage key (the "shared pool profile" mechanism).
 */
export interface SharedMapping<T> {
  /** localStorage key holding the shared value. */
  sharedKey: string;
  /** Does the tool state already hold this field? (decides hydrate fallback). */
  has: (state: T) => boolean;
  /** Value to persist to the shared key; return `undefined` to skip writing. */
  get: (state: T) => unknown;
  /** Embed a value read from the shared key into the tool state. */
  embed: (state: T, sharedValue: unknown) => T;
}

function readJSON<V>(key: string): V | undefined {
  try {
    const item = window.localStorage.getItem(key);
    return item ? (JSON.parse(item) as V) : undefined;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return undefined;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error writing localStorage key "${key}":`, error);
  }
}

export interface UseToolState<T> {
  state: T;
  setState: (next: T | ((prev: T) => T)) => void;
  /** Full wipe: clears the tool key AND all mapped shared keys, then restores defaults. */
  reset: () => void;
  /** True once the client has hydrated from localStorage (avoids SSR mismatch). */
  isHydrated: boolean;
}

/**
 * Per-tool persisted state with bidirectional shared-key sync.
 *
 * - On mount: hydrate from the tool key; for any mapped field the tool key does
 *   NOT already hold, fall back to the shared key.
 * - On set: write the tool key AND every mapped shared key.
 * - On reset: FULL wipe — remove the tool key AND every mapped shared key, then
 *   restore defaults, so a reset clears all fields and stays cleared on reload.
 *
 * `defaultValue` and `mappings` must be stable (module-scope) references.
 */
export function useToolState<T>(
  toolKey: string,
  defaultValue: T,
  mappings: SharedMapping<T>[] = [],
): UseToolState<T> {
  const [state, setStateInternal] = useState<T>(defaultValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let base = readJSON<T>(toolKey) ?? defaultValue;
    for (const m of mappings) {
      if (!m.has(base)) {
        const shared = readJSON(m.sharedKey);
        if (shared !== undefined && shared !== null) {
          base = m.embed(base, shared);
        }
      }
    }
    setStateInternal(base);
    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolKey]);

  const persist = (next: T) => {
    writeJSON(toolKey, next);
    for (const m of mappings) {
      const value = m.get(next);
      if (value !== undefined && value !== null) writeJSON(m.sharedKey, value);
    }
  };

  const setState = (next: T | ((prev: T) => T)) => {
    setStateInternal((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      persist(resolved);
      return resolved;
    });
  };

  const reset = () => {
    try {
      window.localStorage.removeItem(toolKey);
      for (const m of mappings) {
        window.localStorage.removeItem(m.sharedKey);
      }
    } catch (error) {
      console.warn(`Error clearing localStorage for "${toolKey}":`, error);
    }
    setStateInternal(defaultValue);
  };

  return { state, setState, reset, isHydrated };
}
