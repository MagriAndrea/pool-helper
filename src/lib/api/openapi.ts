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
 *
 * Note on prose: the human-readable summaries and descriptions are NOT stored
 * here — they live in the `ApiDocs.endpoints.<slug>` i18n namespace, so the
 * `/docs/api` page can render them in the reader's language. This module reads
 * the English ones from `en.json` (an OpenAPI document is English by
 * convention), which keeps a single source for both.
 */

import { z } from 'zod';
import enMessages from '@/messages/en.json';
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
  /** Path segment under `/api/v1/calculate/`, and the i18n key for its prose. */
  slug: keyof typeof enMessages.ApiDocs.endpoints;
  operationId: string;
  schema: z.ZodType;
  requestExample: unknown;
  responseExample: unknown;
}

/** English prose for an endpoint, read from the i18n catalogue. */
function prose(slug: ApiEndpoint['slug']) {
  return enMessages.ApiDocs.endpoints[slug];
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
    schema: chlorineTargetInputSchema,
    requestExample: {
      cya: { known: true, ppm: 40 },
      colorLevel: 'light_green',
      combinedCC: 0.8,
    },
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
    schema: chlorineDoseInputSchema,
    requestExample: {
      volume: { value: 32000, unit: 'L' },
      targetFC: { isRange: false, value: 16, unit: 'ppm' },
      currentFC: { known: true, freeFC: 2 },
    },
    responseExample: {
      gap: { isRange: false, value: 14, unit: 'ppm' },
      pureChlorine: { isRange: false, value: 448, unit: 'g' },
      warnings: [],
    },
  },
  {
    slug: 'product-conversion',
    operationId: 'calculateProductConversion',
    schema: productConversionInputSchema,
    requestExample: {
      pureChlorineG: { isRange: false, value: 448, unit: 'g' },
      productId: 'calcium_hypochlorite',
      concentrationPct: 65,
      deltaFC: { isRange: false, value: 14, unit: 'ppm' },
    },
    responseExample: {
      amount: { isRange: false, value: 689, unit: 'g' },
      sideEffects: { cyaAddedPpm: 0, hardnessAddedPpm: 9.8, saltAddedPpm: 0, pHEffect: 'up' },
    },
  },
  {
    slug: 'pool-volume',
    operationId: 'calculatePoolVolume',
    schema: poolVolumeInputSchema,
    requestExample: {
      shape: 'rectangle',
      dimensions: { length: 8, width: 4, depth: 1.5, unit: 'm' },
    },
    responseExample: { volumeL: 48000, volumeM3: 48, volumeGal: 12681 },
  },
  {
    slug: 'shock',
    operationId: 'calculateShock',
    schema: shockInputSchema,
    requestExample: {
      volume: { value: 32000, unit: 'L' },
      colorLevel: 'light_green',
      cya: { known: true, ppm: 40 },
      chlorine: { known: true, freeFC: 2, combinedCC: 0.8 },
      product: { id: 'calcium_hypochlorite', concentrationPct: 65 },
    },
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
    schema: chlorineComparisonInputSchema,
    requestExample: {
      calciumInput: { price: 50, weight: 10, concentration: 65 },
      sodiumInput: { price: 20, quantity: 20, unit: 'l', density: 1.2, concentration: 14 },
    },
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
    const { summary, description, responseDescription } = prose(endpoint.slug);

    paths[endpointPath(endpoint)] = {
      post: {
        operationId: endpoint.operationId,
        summary,
        description,
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
            description: responseDescription,
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
      { url: 'https://pool-helper-me.vercel.app', description: 'Production' },
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
