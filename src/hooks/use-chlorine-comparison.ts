import { useState, useEffect } from 'react';
import { 
  CalciumInput, 
  SodiumInput, 
  ComparisonResult, 
} from '@/lib/calculator';
import { useLocalStorage } from './use-local-storage';

const DEFAULT_CALCIUM: CalciumInput = {
  price: 0,
  weight: 0,
  concentration: 67.5,
};

const DEFAULT_SODIUM: SodiumInput = {
  price: 0,
  quantity: 0,
  unit: 'l',
  density: 1.2,
  concentration: 14.5,
};

export function useChlorineComparison() {
  const [calciumInput, setCalciumInput] = useLocalStorage<CalciumInput>('ph_calcium_input', DEFAULT_CALCIUM);
  const [sodiumInput, setSodiumInput] = useLocalStorage<SodiumInput>('ph_sodium_input', DEFAULT_SODIUM);

  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          body: JSON.stringify({
            calciumInput,
            sodiumInput,
          }),
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
  }, [calciumInput, sodiumInput]);

  const resetValues = () => {
    setCalciumInput(DEFAULT_CALCIUM);
    setSodiumInput(DEFAULT_SODIUM);
    setComparison(null);
  };

  return {
    calciumInput,
    setCalciumInput,
    sodiumInput,
    setSodiumInput,
    comparison,
    isLoading,
    error,
    resetValues,
  };
}
