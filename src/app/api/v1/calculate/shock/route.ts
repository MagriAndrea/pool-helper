import { NextResponse } from 'next/server';
import { computeShock } from '@/lib/calculator';
import type { ShockInput } from '@/lib/calculator';

/**
 * POST /api/v1/calculate/shock
 *
 * Single-call wrapper that orchestrates the chlorine-target → chlorine-dose →
 * product-conversion primitives. This is what the Shock Calculator UI calls.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ShockInput>;
    const { volume, colorLevel, cya, chlorine, product } = body;

    if (!volume || !colorLevel || !cya || !chlorine || !product) {
      return NextResponse.json(
        { error: 'Missing required fields: volume, colorLevel, cya, chlorine, product' },
        { status: 400 },
      );
    }

    const result = computeShock({ volume, colorLevel, cya, chlorine, product });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Shock calculation error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
