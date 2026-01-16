import { useState, useEffect } from 'react';
import { 
  CalciumInput, 
  SodiumInput, 
  ComparisonResult, 
  calculateCalciumMetrics, 
  calculateSodiumMetrics, 
  compareChemicals 
} from '@/lib/calculator';
import { useLocalStorage } from './use-local-storage';

const DEFAULT_CALCIUM: CalciumInput = {
  price: 0,
  weight: 0,
  concentration: 65,
};

const DEFAULT_SODIUM: SodiumInput = {
  price: 0,
  quantity: 0,
  unit: 'l',
  density: 1.2,
  concentration: 14,
};

export function useChlorineComparison() {
  const [calciumInput, setCalciumInput] = useLocalStorage<CalciumInput>('ph_calcium_input', DEFAULT_CALCIUM);
  const [sodiumInput, setSodiumInput] = useLocalStorage<SodiumInput>('ph_sodium_input', DEFAULT_SODIUM);

  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    const calciumMetrics = calculateCalciumMetrics(calciumInput);
    const sodiumMetrics = calculateSodiumMetrics(sodiumInput);
    
    // Only run comparison if we have valid inputs (at least partially)
    // Actually our calculator returns isValid: false if incomplete.
    // Let's run comparison anyway to get the empty state or partial state.
    
    const result = compareChemicals(calciumMetrics, sodiumMetrics);
    setComparison(result);

  }, [calciumInput, sodiumInput]);

  return {
    calciumInput,
    setCalciumInput,
    sodiumInput,
    setSodiumInput,
    comparison,
  };
}
