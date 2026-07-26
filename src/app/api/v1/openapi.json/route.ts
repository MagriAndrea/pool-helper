import { NextResponse } from 'next/server';
import { buildOpenApiDocument } from '@/lib/api/openapi';

/**
 * GET /api/v1/openapi.json
 *
 * The machine-readable OpenAPI 3.1 description of the calculation API,
 * generated from the Zod schemas that validate the requests. Feed it to
 * Swagger UI, Scalar, a client generator, or anything else that speaks
 * OpenAPI. The human-readable version lives at `/docs/api`.
 */
export function GET() {
  return NextResponse.json(buildOpenApiDocument(), {
    headers: {
      // Public, cacheable, and safe to fetch cross-origin: it's a spec, not data.
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
