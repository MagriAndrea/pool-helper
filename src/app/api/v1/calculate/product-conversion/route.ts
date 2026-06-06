import { NextResponse } from 'next/server';
import { convertToProduct } from '@/lib/calculator';
import type { ProductConversionInput } from '@/lib/calculator';

/**
 * POST /api/v1/calculate/product-conversion
 * Body: { pureChlorineG, productId, concentrationPct, densityKgL?, deltaFC }
 *   → amount of product to add + side effects.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ProductConversionInput>;
    const { pureChlorineG, productId, concentrationPct, densityKgL, deltaFC } = body;

    if (!pureChlorineG || !productId || concentrationPct == null || !deltaFC) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: pureChlorineG, productId, concentrationPct, deltaFC',
        },
        { status: 400 },
      );
    }

    const result = convertToProduct({
      pureChlorineG,
      productId,
      concentrationPct,
      densityKgL,
      deltaFC,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('product-conversion error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
