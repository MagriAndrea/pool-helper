import { NextResponse } from 'next/server';
import { computeChlorineMaintenance } from '@/lib/calculator';
import { chlorineMaintenanceInputSchema } from '@/lib/api/schemas';
import { validateBody } from '@/lib/api/validate';

/**
 * POST /api/v1/calculate/chlorine-maintenance
 * Routine free-chlorine target for a given CYA, the dose to get there, and a
 * projection of where cyanuric acid is heading with the product in use.
 */
export async function POST(request: Request) {
  try {
    const validation = await validateBody(chlorineMaintenanceInputSchema, request);
    if (!validation.success) return validation.response;

    const result = computeChlorineMaintenance(validation.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('chlorine-maintenance error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
