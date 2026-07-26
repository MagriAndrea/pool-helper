/**
 * Shared request-validation helper for the `src/app/api/v1/calculate/**` routes.
 *
 * Every route follows the same shape: parse the JSON body, validate it
 * against its Zod schema from `./schemas`, and either get back typed data or
 * a ready-to-return 400 `NextResponse`. See `AGENTS.md` in this directory for
 * why the schemas (not this file) are the source of truth.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; response: NextResponse };

/**
 * Parses `request`'s JSON body and validates it against `schema`.
 *
 * - Malformed JSON → `{ success: false }` with a 400 `NextResponse`.
 * - Schema validation failure → `{ success: false }` with a 400 `NextResponse`
 *   whose body is `{ error: string, details: <flattened Zod issues> }`. The
 *   `error` key is kept for existing/legacy clients that read a plain error
 *   string; `details` carries the structured, field-level breakdown.
 * - Success → `{ success: true, data }`, `data` typed as `z.infer<typeof schema>`.
 *
 * Callers just do:
 * ```ts
 * const validation = await validateBody(someInputSchema, request);
 * if (!validation.success) return validation.response;
 * const result = computeSomething(validation.data);
 * ```
 */
export async function validateBody<T>(
  schema: z.ZodType<T>,
  request: Request,
): Promise<ValidationResult<T>> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid request body', details: z.flattenError(result.error) },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}
