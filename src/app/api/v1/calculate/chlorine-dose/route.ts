import { NextResponse } from 'next/server';
import { computeChlorineDose } from '@/lib/calculator';
import { chlorineDoseInputSchema } from '@/lib/api/schemas';
import { validateBody } from '@/lib/api/validate';

/**
 * POST /api/v1/calculate/chlorine-dose
 * Body: { volume, targetFC, currentFC } → grams of pure available chlorine.
 */
export async function POST(request: Request) {
  try {
    const validation = await validateBody(chlorineDoseInputSchema, request);
    if (!validation.success) return validation.response;

    const result = computeChlorineDose(validation.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('chlorine-dose error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
