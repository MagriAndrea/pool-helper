import { NextResponse } from 'next/server';
import { computeChlorineDose } from '@/lib/calculator';
import type { ChlorineDoseInput } from '@/lib/calculator';

/**
 * POST /api/v1/calculate/chlorine-dose
 * Body: { volume, targetFC, currentFC } → grams of pure available chlorine.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChlorineDoseInput>;
    const { volume, targetFC, currentFC } = body;

    if (!volume || !targetFC || !currentFC) {
      return NextResponse.json(
        { error: 'Missing required fields: volume, targetFC, currentFC' },
        { status: 400 },
      );
    }

    const result = computeChlorineDose({ volume, targetFC, currentFC });
    return NextResponse.json(result);
  } catch (error) {
    console.error('chlorine-dose error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
