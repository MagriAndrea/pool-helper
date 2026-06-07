import { NextResponse } from 'next/server';
import { computePoolVolume } from '@/lib/calculator';
import type { CircleDims, PoolShape, RectangleDims } from '@/lib/calculator';

/**
 * POST /api/v1/calculate/pool-volume
 * Body: { shape: 'rectangle' | 'circle', dimensions } → volume in L, m³, gal.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      shape?: PoolShape;
      dimensions?: RectangleDims | CircleDims;
    };
    const { shape, dimensions } = body;

    if (!shape || !dimensions) {
      return NextResponse.json(
        { error: 'Missing required fields: shape, dimensions' },
        { status: 400 },
      );
    }

    if (shape !== 'rectangle' && shape !== 'circle') {
      return NextResponse.json(
        { error: "Invalid shape: must be 'rectangle' or 'circle'" },
        { status: 400 },
      );
    }

    const result = computePoolVolume(shape, dimensions);
    return NextResponse.json(result);
  } catch (error) {
    console.error('pool-volume error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
