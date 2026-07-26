# WIP: Docs & Legal (footer, about, disclaimer, tool info pages, API docs, README)

## 1. Initial State

- The site has 3 tools (`chlorine-comparison`, `shock`, `pool-volume`) but only **Shock** has an info page (`/tools/shock/info`) and an `InfoButton`. The info-page toolkit already exists and is reusable: `ToolInfoLayout`, `InfoSection`, `Formula`, `InfoButton` in `src/components/tools/shared/`.
- There is **no global footer** in `src/app/[locale]/layout.tsx`, no `/about` page, no `/disclaimer` page. The only disclaimers are two per-tool footer strings (`Tools.ChlorineComparison.Footer.disclaimer`, `Tools.Shock.Footer.disclaimer`).
- The **API** has 6 endpoints under `src/app/api/v1/calculate/` (`chlorine-target`, `chlorine-dose`, `product-conversion`, `pool-volume`, `shock`, `chlorine`) with **zero public documentation**. Routes validate manually (field-presence checks only — `volume: -5` passes). `zod` v4 is already in `package.json` but unused.
- `README.md` is still the untouched `create-next-app` boilerplate.
- Verified: the site has **no analytics, no cookies, no tracking** — all state lives in the browser's localStorage. This is a selling point to document.

## 2. Objective

Three sub-phases, in order. Decisions agreed with the user (2026-07-19):

### Phase 1 — Legal & identity
- **Global footer** component mounted in `[locale]/layout.tsx`, with links to `/about` and `/disclaimer` and a one-line informational-purpose note.
- **`/about` page**: the project's story — a summer-2026 learning project ("vibe coding"), knowledge sourced from direct experience, YouTube, AI and the web. Honest amateur framing is a *feature* (future SEO: E-E-A-T, first-person Experience). **Also linked from the main navigation menu** (decided 2026-07-19), not just the footer.
- **`/disclaimer` page** with sections:
  - Informational purposes only; not professional advice; always follow chemical product labels and local regulations; author assumes no liability.
  - **Scope**: guidance targets manually chlorinated pools; **salt-water (SWG) pools are out of scope** (their CYA guidance differs, ~70–80 ppm vs 30–50).
  - **Privacy**: no cookies, no tracking, no accounts; all data stays in the user's browser (localStorage).
  - Reserved/placeholder section for a future **Amazon affiliate disclosure** (required by Amazon Associates when links are added — NOT now).

### Phase 2 — Tool info pages
- Replicate the Shock info-page pattern for **chlorine-comparison** and **pool-volume**: `info/page.tsx` using `ToolInfoLayout` + `InfoSection` + `Formula`, reading real constants/logic (never hardcoding numbers), with a sources section; add `InfoButton` to each tool page (pattern: `src/app/[locale]/tools/shock/page.tsx` line ~70).
- Remove the stale `{/* Footer / Disclaimer could go here */}` comment in the comparison page.

### Phase 3 — API documentation (Zod → OpenAPI) & README
- **Zod schemas as single source of truth**: one schema per endpoint input (and output where practical), colocated in a new `src/lib/api/` module. Routes validate with `schema.safeParse` → typed 400 errors.
- **OpenAPI 3.1 spec generated from the Zod schemas** (Zod 4 has native `z.toJSONSchema`; prefer zero extra deps — assemble the spec object by hand around the generated JSON Schemas). Serve it at `/api/v1/openapi.json`.
- **Docs page** at `/[locale]/docs/api` rendering the spec. Preferred viewer: `@scalar/api-reference` React component; fallback if the dependency is too heavy: minimal custom renderer in site style. Page chrome is localized; the spec itself stays English (industry standard).
- **README rewrite**: what Pool Helper is, stack (Next.js 16, Tailwind v4, shadcn, next-intl), architecture pointers (ARCHITECTURE.md, AGENTS.md), tools list, API docs link, scripts. Portfolio-quality.

### Constraints (all phases)
- Every user-visible string in **both** `en.json` and `it.json`; English keys/anchors/identifiers; **no em/en dashes in `it.json` values**.
- Do **not** run `npm run dev` / `npm run build` (user runs dev continuously).
- Update `ARCHITECTURE.md` and the relevant `AGENTS.md` files when each phase lands.
- This WIP is worked in the `pool-helper-docs-tools-66b383` worktree (branch `claude/pool-helper-docs-tools-66b383`).

## 3. Target Files

Phase 1:
- `src/components/Footer.tsx` (new)
- `src/app/[locale]/layout.tsx` (mount footer)
- `src/app/[locale]/about/page.tsx` (new)
- `src/app/[locale]/disclaimer/page.tsx` (new)
- `src/messages/en.json`, `src/messages/it.json` (new `About`, `Disclaimer`, `Footer` namespaces)
- `src/config/nav-items.ts` (add an `about` entry — top-level or under a new/existing group, decide at implementation)

Phase 2:
- `src/app/[locale]/tools/chlorine-comparison/info/page.tsx` (new)
- `src/app/[locale]/tools/pool-volume/info/page.tsx` (new)
- `src/app/[locale]/tools/chlorine-comparison/page.tsx` (add `InfoButton`, drop stale comment)
- `src/app/[locale]/tools/pool-volume/page.tsx` (add `InfoButton`)
- `src/messages/en.json`, `src/messages/it.json` (`Tools.ChlorineComparison.Info.*`, `Tools.PoolVolume.Info.*`)

Phase 3:
- `src/lib/api/` (new: Zod schemas + OpenAPI assembly)
- `src/app/api/v1/calculate/*/route.ts` (all 6: validate via Zod)
- `src/app/api/v1/openapi.json/route.ts` (new: serve generated spec)
- `src/app/[locale]/docs/api/page.tsx` (new: viewer)
- `package.json` (viewer dep, if Scalar chosen)
- `README.md` (rewrite)
- `ARCHITECTURE.md`, `src/lib/AGENTS.md`, `src/app/AGENTS.md` (document the new module/pages)

## 4. Current Situation & Checklist

Planning approved by the user on 2026-07-19. No code written yet.

Phase 1 — Legal & identity:
- ✅ Footer component + mount in layout (`src/components/Footer.tsx`, sticky-to-bottom via flex layout in `[locale]/layout.tsx`)
- ✅ `/about` page — draft content written, **pending user review** of the actual copy/voice
- ✅ `/disclaimer` page — draft content written (purpose, scope/salt-water, chemical safety, liability, privacy, affiliate placeholder), **pending user review**
- ✅ `about` entry added to `nav-items.ts` (nav menu, not just footer)
- ✅ i18n keys (en + it) — JSON validated, key parity confirmed, no em/en dashes in `it.json`
- ✅ `tsc --noEmit` and `npm run lint` clean (no new errors/warnings introduced)
- ✅ Content approved by the user; merged to `main` via [PR #6](https://github.com/MagriAndrea/pool-helper/pull/6) (Vercel preview build succeeded)

**Phase 1 complete.**

Phase 2 — Tool info pages:
- ✅ chlorine-comparison info page + InfoButton (`src/app/[locale]/tools/chlorine-comparison/info/page.tsx`)
- ✅ pool-volume info page + InfoButton (`src/app/[locale]/tools/pool-volume/info/page.tsx`)
- ✅ i18n keys (en + it) — validated: JSON valid, key parity, no em/en dashes in Italian
- ✅ Small DRY fix while grounding the comparison page in real constants: `chlorine-comparison.ts` now imports `DEFAULT_SODIUM_DENSITY` from `constants.ts` instead of a hardcoded `1.2`
- ✅ `tsc --noEmit` and `npm run lint` clean (no new errors/warnings)
- ✅ Content approved by the user; merged to `main` via [PR #7](https://github.com/MagriAndrea/pool-helper/pull/7) (Vercel preview build succeeded)

**Phase 2 complete.** Every tool (`chlorine-comparison`, `shock`, `pool-volume`) now has an `/info` page reachable via `InfoButton`.

Phase 3 — API docs & README:
- ✅ Zod schemas per endpoint in `src/lib/api/schemas.ts` (+ `validate.ts` helper) — written by a Sonnet subagent against a fixed export-name contract
- ✅ Routes migrated to Zod validation (typed 400 `{ error, details }`). Two real bugs closed: negative/zero volumes and dimensions are now rejected, and `pool-volume` can no longer be given circle dimensions for a rectangle (it used to silently compute garbage)
- ✅ OpenAPI 3.1 generation (`openapi.ts`, via `z.toJSONSchema`) + `/api/v1/openapi.json`
- ✅ `/[locale]/docs/api` page — **custom renderer, NOT Scalar**: `@scalar/nextjs-api-reference` loads its UI from `cdn.jsdelivr.net`, a third-party request that would contradict the no-tracking claim on `/disclaimer`. The machine-readable spec is still standard OpenAPI, so anyone can render it with Scalar/Swagger themselves
- ✅ README rewrite
- ✅ ARCHITECTURE.md (§4.5) + `src/lib/api/AGENTS.md` + `src/lib/AGENTS.md` updated
- ✅ Verified: `tsc --noEmit` clean, lint adds nothing, i18n parity + no em/en dashes, 21 runtime schema cases and a generated-spec structural check all pass
- ❌ Pending user review before merge

**Design note for future work:** request bodies are documented with generated schemas; responses are documented with a description + realistic example rather than a hand-written schema. Restating the calculator's return types as Zod would duplicate `src/lib/calculator/types.ts` without buying validation (we never validate our own output) — i.e. it would reintroduce exactly the drift this module prevents. Revisit only if a real consumer needs machine-readable response contracts.

## 5. Success Criteria

- Every page of the site shows the footer; `/about` and `/disclaimer` exist in both locales with all agreed sections.
- All 3 tools have an info page reachable via `InfoButton`, built on the shared toolkit, with cited sources.
- All 6 API endpoints reject malformed input (wrong types, negative/out-of-range values) with a clear 400; `/api/v1/openapi.json` returns a valid OpenAPI 3.1 document generated from the same schemas; `/docs/api` renders it.
- README describes the real project.
- `en.json`/`it.json` in sync; no em dashes in Italian values; ARCHITECTURE.md and AGENTS.md files reflect reality.
- When done: archive this WIP to `changelog/YYYY-MM-DD_DocsAndLegal.md`.
