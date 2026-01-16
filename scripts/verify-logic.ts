
import { calculateCalciumMetrics, calculateSodiumMetrics, compareChemicals } from '../src/lib/calculator';

const testCase = {
    calcium: {
        weight: 10,
        price: 50,
        concentration: 65
    },
    sodium: {
        quantity: 20,
        unit: 'l',
        density: 1.2,
        price: 20,
        concentration: 14
    }
};

console.log('--- VERIFICATION START ---');

// Calcium Calculation
const caMetrics = calculateCalciumMetrics({
    weight: testCase.calcium.weight,
    price: testCase.calcium.price,
    concentration: testCase.calcium.concentration
});

console.log('Calcium Metrics:', {
    grossMass: caMetrics.grossMass, // Expected 10
    activeMass: caMetrics.activeMass, // Expected 6.5
    pricePerActive: caMetrics.pricePerActiveKg.toFixed(2) // Expected ~7.69
});

// Sodium Calculation
const naMetrics = calculateSodiumMetrics({
    quantity: testCase.sodium.quantity, // 20
    unit: 'l',
    price: testCase.sodium.price,
    concentration: testCase.sodium.concentration,
    density: testCase.sodium.density
});

console.log('Sodium Metrics:', {
    grossMass: naMetrics.grossMass, // Expected 24 (20 * 1.2)
    activeMass: naMetrics.activeMass, // Expected 3.36 (24 * 0.14)
    pricePerActive: naMetrics.pricePerActiveKg.toFixed(2) // Expected ~5.95
});

// Comparison
const comparison = compareChemicals(caMetrics, naMetrics);

console.log('Comparison Result:', {
    winner: comparison.winner, // Expected SODIUM
    savings: comparison.savingsPerKg.toFixed(2) // Expected ~1.74 (7.69 - 5.95)
});

if (comparison.winner === 'SODIUM' && Math.abs(comparison.savingsPerKg - 1.74) < 0.1) {
    console.log('✅ TEST PASSED');
} else {
    console.error('❌ TEST FAILED');
    process.exit(1);
}
