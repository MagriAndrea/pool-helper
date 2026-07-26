import { NextResponse } from 'next/server';
import { computeShock } from '@/lib/calculator';
import { shockInputSchema } from '@/lib/api/schemas';
import { validateBody } from '@/lib/api/validate';

/**
 * POST /api/v1/calculate/shock
 *
 * Single-call wrapper that orchestrates the chlorine-target → chlorine-dose →
 * product-conversion primitives. This is what the Shock Calculator UI calls.
 */
export async function POST(request: Request) {
  try {
    const validation = await validateBody(shockInputSchema, request);
    if (!validation.success) return validation.response;

    const result = computeShock(validation.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Shock calculation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
