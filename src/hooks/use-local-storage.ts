import { useState, useEffect } from 'react';

/**
 * Hook to manage a value in localStorage.
 * It ensures the value is only read after mounting to avoid hydration errors.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Use state to store the value. Initialize with initialValue to avoid hydration mismatch.
  // The actual localStorage value will be read in useEffect.
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        // If not found, use initialValue (which is already set)
        // Optionally save the initial value to LS
        // window.localStorage.setItem(key, JSON.stringify(initialValue));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    setIsHydrated(true);
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Return storedValue only if hydrated, otherwise initialValue (though they are same initially)
  // This prevents flash of content if initialValue differs from LS but ensures consistency
  return [storedValue, setValue];
}
