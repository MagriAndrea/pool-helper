import { NextResponse } from 'next/server';
import { calculateCalciumMetrics, calculateSodiumMetrics, compareChemicals } from '@/lib/calculator';
import { chlorineComparisonInputSchema } from '@/lib/api/schemas';
import { validateBody } from '@/lib/api/validate';

/**
 * POST /api/v1/calculate/chlorine
 * Body: { calciumInput, sodiumInput } → price-per-active-kg comparison between
 * calcium and sodium hypochlorite. Accepts 0 for price/weight/quantity — the
 * comparison tool posts on mount before the user has entered anything.
 */
export async function POST(request: Request) {
  try {
    const validation = await validateBody(chlorineComparisonInputSchema, request);
    if (!validation.success) return validation.response;

    const { calciumInput, sodiumInput } = validation.data;
    const calciumMetrics = calculateCalciumMetrics(calciumInput);
    const sodiumMetrics = calculateSodiumMetrics(sodiumInput);
    const result = compareChemicals(calciumMetrics, sodiumMetrics);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
