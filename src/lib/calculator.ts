export type ChemicalType = 'CALCIUM' | 'SODIUM';

export interface CalciumInput {
  price: number;
  weight: number; // in kg
  concentration: number; // percentage 0-100
}

export interface SodiumInput {
  price: number;
  quantity: number; // Volume in L or Weight in Kg
  unit: 'l' | 'kg';
  density?: number; // default 1.2 for liquids
  concentration: number; // percentage 0-100
}

export interface ChemicalMetrics {
  type: ChemicalType;
  grossMass: number; // kg
  activeMass: number; // kg of pure chlorine
  pricePerActiveKg: number; // €/kg
  isValid: boolean;
}

export interface ComparisonResult {
  winner: ChemicalType | 'DRAW' | null;
  savingsPerKg: number;
  calcium: ChemicalMetrics;
  sodium: ChemicalMetrics;
}

/**
 * Calculates metrics for Calcium Hypochlorite (Solid)
 * Always valid if inputs are positive numbers
 */
export function calculateCalciumMetrics(input: CalciumInput): ChemicalMetrics {
  const { price, weight, concentration } = input;

  if (price <= 0 || weight <= 0 || concentration <= 0) {
    return {
      type: 'CALCIUM',
      grossMass: 0,
      activeMass: 0,
      pricePerActiveKg: 0,
      isValid: false,
    };
  }

  const activeMass = weight * (concentration / 100);
  const pricePerActiveKg = price / activeMass;

  return {
    type: 'CALCIUM',
    grossMass: weight,
    activeMass,
    pricePerActiveKg,
    isValid: true,
  };
}

/**
 * Calculates metrics for Sodium Hypochlorite (Liquid)
 * Handles conversion from Liters to Kg if necessary
 */
export function calculateSodiumMetrics(input: SodiumInput): ChemicalMetrics {
  const { price, quantity, unit, concentration } = input;
  // Default density to 1.2 if not provided or invalid, but only relevant for 'l'
  const density = input.density && input.density > 0 ? input.density : 1.2;

  if (price <= 0 || quantity <= 0 || concentration <= 0) {
    return {
      type: 'SODIUM',
      grossMass: 0,
      activeMass: 0,
      pricePerActiveKg: 0,
      isValid: false,
    };
  }

  let grossMass = quantity;
  if (unit === 'l') {
    grossMass = quantity * density;
  }

  const activeMass = grossMass * (concentration / 100);
  const pricePerActiveKg = price / activeMass;

  return {
    type: 'SODIUM',
    grossMass,
    activeMass,
    pricePerActiveKg,
    isValid: true,
  };
}

/**
 * Compares two results and determines the winner
 */
export function compareChemicals(
  calcium: ChemicalMetrics,
  sodium: ChemicalMetrics
): ComparisonResult {
  if (!calcium.isValid || !sodium.isValid) {
    return {
      winner: null,
      savingsPerKg: 0,
      calcium,
      sodium,
    };
  }

  let winner: ChemicalType | 'DRAW' = 'DRAW';
  let savingsPerKg = 0;

  if (calcium.pricePerActiveKg < sodium.pricePerActiveKg) {
    winner = 'CALCIUM';
    savingsPerKg = sodium.pricePerActiveKg - calcium.pricePerActiveKg;
  } else if (sodium.pricePerActiveKg < calcium.pricePerActiveKg) {
    winner = 'SODIUM';
    savingsPerKg = calcium.pricePerActiveKg - sodium.pricePerActiveKg;
  }

  return {
    winner,
    savingsPerKg,
    calcium,
    sodium,
  };
}
