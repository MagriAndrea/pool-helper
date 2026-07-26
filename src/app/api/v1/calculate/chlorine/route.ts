import { NextResponse } from 'next/server';
import { calculateProductMetrics, compareProducts } from '@/lib/calculator';
import { chlorineComparisonInputSchema } from '@/lib/api/schemas';
import { validateBody } from '@/lib/api/validate';

/**
 * POST /api/v1/calculate/chlorine
 * Body: { slotA, slotB } → cost-per-active-kg comparison between any two
 * chlorine products, same type or not. Accepts 0 for price/quantity — the
 * comparison tool posts on mount before the user has entered anything.
 */
export async function POST(request: Request) {
  try {
    const validation = await validateBody(chlorineComparisonInputSchema, request);
    if (!validation.success) return validation.response;

    const { slotA, slotB } = validation.data;
    const result = compareProducts(
      calculateProductMetrics(slotA),
      calculateProductMetrics(slotB),
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
