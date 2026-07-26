import { NextResponse } from 'next/server';
import { convertToProduct } from '@/lib/calculator';
import { productConversionInputSchema } from '@/lib/api/schemas';
import { validateBody } from '@/lib/api/validate';

/**
 * POST /api/v1/calculate/product-conversion
 * Body: { pureChlorineG, productId, concentrationPct, densityKgL?, deltaFC }
 *   → amount of product to add + side effects.
 */
export async function POST(request: Request) {
  try {
    const validation = await validateBody(productConversionInputSchema, request);
    if (!validation.success) return validation.response;

    const result = convertToProduct(validation.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('product-conversion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
