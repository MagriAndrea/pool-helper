import { NextResponse } from 'next/server';
import { computeChlorineTarget } from '@/lib/calculator';
import type { ChlorineTargetInput } from '@/lib/calculator';

/**
 * POST /api/v1/calculate/chlorine-target
 * Body: { cya, colorLevel, combinedCC? } → target FC (SLAM / breakpoint / floor).
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChlorineTargetInput>;
    const { cya, colorLevel, combinedCC } = body;

    if (!cya || !colorLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: cya, colorLevel' },
        { status: 400 },
      );
    }

    const result = computeChlorineTarget({ cya, colorLevel, combinedCC });
    return NextResponse.json(result);
  } catch (error) {
    console.error('chlorine-target error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
