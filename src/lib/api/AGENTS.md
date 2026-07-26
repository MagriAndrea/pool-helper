# src/lib/api/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs `src/lib/api` — Zod request-validation schemas for the calculation API, and the OpenAPI document generated from them.
2.  **🚨 SINGLE SOURCE OF TRUTH (STRICT)**: `schemas.ts` is consumed by TWO things:
    -   **Runtime validation** in every `src/app/api/v1/calculate/**/route.ts` (via `validateBody` from `validate.ts`).
    -   **The OpenAPI 3.1 spec**, generated FROM these schemas in `openapi.ts` via `z.toJSONSchema()`.
    -   **⚠️ CHANGING ONE CHANGES BOTH.** Editing a field's type/bounds here immediately changes what the live API accepts AND what the published API contract documents. There is no "just for docs" or "just for validation" edit — treat every change here as a public API change.
3.  **🔒 EXPORT NAMES ARE A HARD CONTRACT**: `openapi.ts` imports these schemas by name. Do **NOT** rename an existing exported schema without also updating that import. Adding new exports is safe; renaming/removing is a breaking change.
4.  **⚠️ `.refine()` IS INVISIBLE TO THE SPEC**: JSON Schema has no equivalent for a Zod refinement, so any `.refine()`/`.superRefine()` rule is enforced at runtime but **silently absent from the generated OpenAPI document**. If you add one, document it in prose in that endpoint's `description` in `openapi.ts`, or API consumers will not know the rule exists. (Current case: `max >= min` on range inputs.)
5.  **Types mirror `src/lib/calculator/types.ts` exactly**: every schema here must structurally match the hand-written TS interface/type it validates (checked by `npx tsc --noEmit` — routes pass `z.infer<typeof schema>` straight into the calculator functions with no `as` casts). If a schema and its TS type drift apart, fix the schema, don't cast.
6.  **Zero vs. positive is a deliberate, per-field decision, not a default**: ppm readings (CYA, free/combined chlorine) and computed ranges use `.nonnegative()` because 0 is a real reading. Physical setup quantities (pool volume, dimensions, concentration %, density) use `.positive()` because 0 is nonsensical AND no client sends 0 for them during normal use. **Before tightening a field, grep the consuming hook** (`src/hooks/use-*.ts`) to confirm nothing legitimately sends 0/undefined for it — see the inline comments in `schemas.ts` for the specific hooks already checked.
7.  **`/api/v1/calculate/chlorine` (chlorine-comparison) MUST accept 0** for `price`/`quantity`: `src/hooks/use-chlorine-comparison.ts` posts both slots with `{ price: 0, quantity: 0 }` on mount, and `calculateProductMetrics` already handles `<= 0` gracefully via `isValid: false`. The same reasoning covers a solid product sent with `unit: 'l'` — the calculator reports it incomplete, so the schema does not reject it. Never make this schema stricter than that without re-reading the hook.

## 2. 🗺️ Map of Knowledge

| File | Content | AI Agent Action |
|------|---------|-----------------|
| `schemas.ts` | All input schemas for the 6 calculate endpoints, mirroring `src/lib/calculator/types.ts` | **The source of truth — edit here, not in route files** |
| `validate.ts` | `validateBody(schema, request)` — parses JSON + `safeParse`s it, returns typed data or a ready 400 `NextResponse` | **Use this in every route; don't hand-roll field checks** |
| `openapi.ts` | `API_ENDPOINTS` registry + `buildOpenApiDocument()`, generating request schemas from `schemas.ts` | **Add an entry when adding an endpoint; served at `/api/v1/openapi.json`, rendered at `/[locale]/docs/api`** |

## 3. Adding a 7th endpoint

1. Add the input schema to `schemas.ts`, matching the calculator's TS input type exactly.
2. Use `validateBody` in the new route — keep the route thin, logic stays in `src/lib/calculator`.
3. Add an `API_ENDPOINTS` entry in `openapi.ts` (slug, operationId, summary, description, schema, request/response examples). The spec at `/api/v1/openapi.json` and the `/docs/api` page both pick it up automatically — they read the same registry.
