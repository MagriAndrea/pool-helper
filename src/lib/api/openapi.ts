/**
 * OpenAPI 3.1 document for the public calculation API.
 *
 * The request schemas are NOT written by hand here — they are generated from
 * the Zod schemas in `./schemas.ts` via `z.toJSONSchema()`. That module is the
 * single source of truth: the same schema object validates the incoming
 * request at runtime AND describes it in this document, so the two cannot
 * drift apart.
 *
 * OpenAPI 3.1 is a superset of JSON Schema draft 2020-12, so the generated
 * schemas are embedded directly with no translation layer.
 *
 * Note on responses: response bodies are documented with a description and a
 * realistic example rather than a schema. The calculators' return types live
 * in `src/lib/calculator/types.ts`; restating them as Zod here would duplicate
 * the definition without buying any validation (we never validate our own
 * output), which is exactly the drift this module exists to prevent.
 */

import { z } from 'zod';
import {
  chlorineComparisonInputSchema,
  chlorineDoseInputSchema,
  chlorineTargetInputSchema,
  poolVolumeInputSchema,
  productConversionInputSchema,
  shockInputSchema,
} from './schemas';

/** A documented POST endpoint, wired to the Zod schema that validates it. */
export interface ApiEndpoint {
  /** Path segment under `/api/v1/calculate/`. */
  slug: string;
  operationId: string;
  summary: string;
  description: string;
  schema: z.ZodType;
  requestExample: unknown;
  responseDescription: string;
  responseExample: unknown;
}

/** Full request path for an endpoint. */
export function endpointPath(endpoint: ApiEndpoint): string {
  return `/api/v1/calculate/${endpoint.slug}`;
}

/**
 * The endpoint registry — consumed both by this OpenAPI generator and by the
 * `/docs/api` page, so the documentation renders exactly what is specified.
 */
export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    slug: 'chlorine-target',
    operationId: 'calculateChlorineTarget',
    summary: 'Target free chlorine for a shock',
    description:
      'Computes the free chlorine (FC) level to aim for, taking the highest of three candidates: the SLAM target (a ratio of the CYA level, scaled by how bad the water looks), breakpoint chlorination (a multiple of combined chlorine), and a per-water-condition floor. When CYA is unknown the target is returned as a min-max range instead of a single value.',
    schema: chlorineTargetInputSchema,
    requestExample: {
      cya: { known: true, ppm: 40 },
      colorLevel: 'light_green',
      combinedCC: 0.8,
    },
    responseDescription:
      'The winning target plus each candidate that was considered, and any warnings raised (for example a CYA level high enough that dilution is advised).',
    responseExample: {
      slamTarget: 16,
      breakpointTarget: 8,
      floor: 10,
      winningStrategy: 'slam',
      targetFC: { isRange: false, value: 16, unit: 'ppm' },
      warnings: ['CC_HIGH'],
    },
  },
  {
    slug: 'chlorine-dose',
    operationId: 'calculateChlorineDose',
    summary: 'Grams of pure chlorine needed',
    description:
      'Converts the gap between the target and current free chlorine into grams of pure available chlorine for a given water volume. Ranges propagate: an unknown current FC produces a range instead of a single figure.',
    schema: chlorineDoseInputSchema,
    requestExample: {
      volume: { value: 32000, unit: 'L' },
      targetFC: { isRange: false, value: 16, unit: 'ppm' },
      currentFC: { known: true, freeFC: 2 },
    },
    responseDescription: 'The FC gap to close and the corresponding mass of pure available chlorine.',
    responseExample: {
      gap: { isRange: false, value: 14, unit: 'ppm' },
      pureChlorine: { isRange: false, value: 448, unit: 'g' },
      warnings: [],
    },
  },
  {
    slug: 'product-conversion',
    operationId: 'calculateProductConversion',
    summary: 'Convert pure chlorine into a real product amount',
    description:
      'Turns a mass of pure available chlorine into how much of an actual product to add, given its concentration, and reports the side effects that product has on the water (calcium hardness, salt, pH direction).',
    schema: productConversionInputSchema,
    requestExample: {
      pureChlorineG: { isRange: false, value: 448, unit: 'g' },
      productId: 'calcium_hypochlorite',
      concentrationPct: 65,
      deltaFC: { isRange: false, value: 14, unit: 'ppm' },
    },
    responseDescription: 'The amount of product to add, in the unit appropriate to its physical form, plus its side effects.',
    responseExample: {
      amount: { isRange: false, value: 689, unit: 'g' },
      sideEffects: { cyaAddedPpm: 0, hardnessAddedPpm: 9.8, saltAddedPpm: 0, pHEffect: 'up' },
    },
  },
  {
    slug: 'pool-volume',
    operationId: 'calculatePoolVolume',
    summary: 'Pool water volume from shape and dimensions',
    description:
      'Computes water volume for a rectangular or round pool. The accepted dimensions depend on the shape: a rectangle takes length, width and depth, a circle takes diameter and depth. Use the average depth, not the maximum, or the volume will be overestimated.',
    schema: poolVolumeInputSchema,
    requestExample: {
      shape: 'rectangle',
      dimensions: { length: 8, width: 4, depth: 1.5, unit: 'm' },
    },
    responseDescription: 'The same volume expressed in liters, cubic meters and US gallons.',
    responseExample: { volumeL: 48000, volumeM3: 48, volumeGal: 12681 },
  },
  {
    slug: 'shock',
    operationId: 'calculateShock',
    summary: 'Full shock calculation (orchestrator)',
    description:
      'Runs chlorine-target, chlorine-dose and product-conversion in a single call and returns a numeric breakdown of every intermediate step. This is what the Shock Calculator UI uses. Answering "unknown" for CYA or current chlorine is supported and turns the result into a range.',
    schema: shockInputSchema,
    requestExample: {
      volume: { value: 32000, unit: 'L' },
      colorLevel: 'light_green',
      cya: { known: true, ppm: 40 },
      chlorine: { known: true, freeFC: 2, combinedCC: 0.8 },
      product: { id: 'calcium_hypochlorite', concentrationPct: 65 },
    },
    responseDescription:
      'The target, dose and product results together, plus a breakdown of every value used to reach them and any warnings. When the water needs no shock, isNoShockNeeded is true and the dose and product fields are null.',
    responseExample: {
      isNoShockNeeded: false,
      target: { winningStrategy: 'slam', targetFC: { isRange: false, value: 16, unit: 'ppm' } },
      dose: { gap: { isRange: false, value: 14, unit: 'ppm' } },
      product: { amount: { isRange: false, value: 689, unit: 'g' } },
      warnings: ['CC_HIGH'],
    },
  },
  {
    slug: 'chlorine',
    operationId: 'compareChlorineProducts',
    summary: 'Compare the real cost of two chlorine products',
    description:
      'Compares calcium hypochlorite (sold by weight) against sodium hypochlorite (sold by volume or weight) on cost per kilogram of ACTIVE chlorine, which is the only fair basis for comparison. Zero values are accepted and simply mark that side as incomplete rather than being an error.',
    schema: chlorineComparisonInputSchema,
    requestExample: {
      calciumInput: { price: 50, weight: 10, concentration: 65 },
      sodiumInput: { price: 20, quantity: 20, unit: 'l', density: 1.2, concentration: 14 },
    },
    responseDescription:
      'Per-product metrics (gross mass, active chlorine mass, cost per active kg) and the winner. When either side is incomplete, winner is null.',
    responseExample: {
      winner: 'SODIUM',
      savingsPerKg: 1.75,
      calcium: { type: 'CALCIUM', grossMass: 10, activeMass: 6.5, pricePerActiveKg: 7.69, isValid: true },
      sodium: { type: 'SODIUM', grossMass: 24, activeMass: 3.36, pricePerActiveKg: 5.95, isValid: true },
    },
  },
];

/** Minimal shape of the documents this module produces. */
export type OpenApiDocument = Record<string, unknown>;

/**
 * Assembles the OpenAPI 3.1 document, generating each request-body schema from
 * its Zod counterpart.
 *
 * Caveat worth knowing: a Zod `.refine()` has no JSON Schema equivalent, so
 * refinement-only rules are enforced at runtime but cannot appear here. The
 * one case in this API is `max >= min` on a range input; it is stated in the
 * endpoint descriptions instead.
 */
export function buildOpenApiDocument(): OpenApiDocument {
  const paths: Record<string, unknown> = {};

  for (const endpoint of API_ENDPOINTS) {
    paths[endpointPath(endpoint)] = {
      post: {
        operationId: endpoint.operationId,
        summary: endpoint.summary,
        description: endpoint.description,
        tags: ['calculate'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: toRequestSchema(endpoint.schema),
              example: endpoint.requestExample,
            },
          },
        },
        responses: {
          '200': {
            description: endpoint.responseDescription,
            content: { 'application/json': { example: endpoint.responseExample } },
          },
          '400': {
            description: 'The request body is missing, is not valid JSON, or fails schema validation.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ValidationError' },
                example: {
                  error: 'Invalid request body',
                  details: { formErrors: [], fieldErrors: { volume: ['Invalid input'] } },
                },
              },
            },
          },
          '500': {
            description: 'Unexpected server error.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ServerError' },
                example: { error: 'Internal Server Error' },
              },
            },
          },
        },
      },
    };
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'Pool Helper Calculation API',
      version: '1.0.0',
      description:
        'Pool chemistry calculations: chlorine targets and doses, product conversion, pool volume, and product cost comparison. No authentication is required and no request data is stored. Every schema below is generated from the same Zod definitions the server validates against.',
      license: { name: 'Source available', url: 'https://github.com/MagriAndrea/pool-helper' },
    },
    servers: [
      { url: 'https://pool-helper-mu.vercel.app', description: 'Production' },
      { url: 'http://localhost:3000', description: 'Local development' },
    ],
    tags: [
      { name: 'calculate', description: 'Pool chemistry and geometry calculations.' },
    ],
    paths,
    components: {
      schemas: {
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Human-readable summary of what went wrong.' },
            details: {
              type: 'object',
              description: 'Field-level breakdown of the validation failures.',
              properties: {
                formErrors: { type: 'array', items: { type: 'string' } },
                fieldErrors: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
              },
            },
          },
          required: ['error'],
        },
        ServerError: {
          type: 'object',
          properties: { error: { type: 'string' } },
          required: ['error'],
        },
      },
    },
  };
}

/**
 * Generates a JSON Schema for a request body and strips the `$schema` key,
 * which belongs on a standalone JSON Schema document but not on an inline
 * schema object inside an OpenAPI document.
 */
function toRequestSchema(schema: z.ZodType): Record<string, unknown> {
  const generated = z.toJSONSchema(schema, { target: 'draft-2020-12' }) as Record<string, unknown>;
  delete generated.$schema;
  return generated;
}
