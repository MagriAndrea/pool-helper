import { NextResponse } from 'next/server';
import { computeChlorineTarget } from '@/lib/calculator';
import { chlorineTargetInputSchema } from '@/lib/api/schemas';
import { validateBody } from '@/lib/api/validate';

/**
 * POST /api/v1/calculate/chlorine-target
 * Body: { cya, colorLevel, combinedCC? } → target FC (SLAM / breakpoint / floor).
 */
export async function POST(request: Request) {
  try {
    const validation = await validateBody(chlorineTargetInputSchema, request);
    if (!validation.success) return validation.response;

    const result = computeChlorineTarget(validation.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('chlorine-target error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
