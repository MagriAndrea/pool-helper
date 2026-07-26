import { NextResponse } from 'next/server';
import { computePoolVolume } from '@/lib/calculator';
import { poolVolumeInputSchema } from '@/lib/api/schemas';
import { validateBody } from '@/lib/api/validate';

/**
 * POST /api/v1/calculate/pool-volume
 * Body: { shape: 'rectangle' | 'circle', dimensions } → volume in L, m³, gal.
 * `dimensions` shape is validated against the matching `shape` (rectangle vs.
 * circle dimensions can't be mismatched).
 */
export async function POST(request: Request) {
  try {
    const validation = await validateBody(poolVolumeInputSchema, request);
    if (!validation.success) return validation.response;

    const { shape, dimensions } = validation.data;
    const result = computePoolVolume(shape, dimensions);
    return NextResponse.json(result);
  } catch (error) {
    console.error('pool-volume error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
