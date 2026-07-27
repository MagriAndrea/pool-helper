# Architecture Documentation

## 1. Project Overview
**Pool Helper** is a Progressive Web Application (PWA) designed to assist pool owners with chemical maintenance and calculation.
The project is built emphasizing **maintainability**, **scalability**, and **offline-first capabilities** where possible.

## 2. Technology Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
  - Uses React Server Components (RSC) by default for performance.
  - API Routes integration for backend logic.
- **Language**: TypeScript (Strict Mode).
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
  - CSS Variables based theming (OKLCH color space) for high-fidelity dark mode support.
  - Typography utilizes **Fira Sans** for UI elements and **Fira Code** for monospace/technical data.
  - Color palette focuses on fresh cyan and clean green for a modern, playful aesthetic.
- **UI Library**: [Shadcn/UI](https://ui.shadcn.com/)
  - Headless components (Radix UI) styled with Tailwind.
  - Custom "Data-Dense Dashboard" aesthetic, replacing default Shadcn styles.
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
  - Middleware-based routing for `/[locale]/` segments.
  - JSON-based message catalogues.

## 3. Directory Structure

The project follows a standard Next.js `src` directory pattern.

```text
/src
  /app
    /[locale]           # Root of the i18n application. Keys off 'en' | 'it'.
      layout.tsx        # Server Component. Wraps providers (Theme, i18n).
      page.tsx          # Home page.
    /api                # Backend endpoints (Next.js internals).
    globals.css         # Global styles & CSS Variables definition.

  /components
    /ui                 # Reusable Shadcn primitives (Button, Card, Input).
    /tools              # Tool-specific UI components (calculators).
      /shared           # Cross-tool building blocks: ToolInfoLayout, InfoSection,
                        # Formula, InfoButton — the "tool info page" toolkit.
    /home               # Home page sections.
    Footer.tsx          # Global footer (About/Disclaimer links, privacy tagline).
    theme-provider.tsx  # Next-themes wrapper for standardizing context.

  /lib                  # Pure business logic and utilities.
    /calculator         # Modular chemical calculation algorithms (Pure functions).
    utils.ts            # Tailwind class merging (cn helper).
    shared-state.ts     # Shared localStorage key constants across tools.

  /hooks                # Custom React hooks (client-side).
    use-tool-state.ts           # THE persistence hook: per-tool key, bidirectional
                                # shared-key sync, SSR-safe hydration, migrations.
    use-chlorine-comparison.ts  # State + debounced API for the comparison tool.
    use-shock-calculator.ts     # State + debounced API for the shock tool.
    use-pool-volume.ts          # State + debounced API for the pool volume tool.

  /config               # Static configuration.
    nav-items.ts        # Navigation menu structure (tools, guide).

  /messages             # Translation dictionaries.
    it.json
    en.json

  /i18n                 # i18n Configuration.
    request.ts          # Server-side request config (locale validation).
    routing.ts          # Navigation wrappers (Link, useRouter) with locale context.

  proxy.ts              # Edge middleware for locale detection and redirection.
                        # (Next.js 16 renamed `middleware.ts` → `proxy.ts`.)
```

## 4. Core Patterns & Implementation Details

### 4.1 Internationalization (i18n)
The application utilizes a **sub-path routing strategy** (`/it/...`, `/en/...`).
- **Middleware**: Intercepts requests to ensure usage of a valid locale. Redirects root (`/`) to the default locale (`/it`).
- **Routing**: Internal navigation uses the `Link` / `redirect` / `usePathname` / `useRouter` wrappers exported by `src/i18n/routing.ts` (created via `createNavigation`) to preserve the current locale automatically.

### 4.2 Theming Implementation
Theming is handled via `next-themes` interacting with Tailwind CSS variables.
- **Definition**: Variables are defined in `src/app/globals.css` using the `@theme` directive (Tailwind v4) and CSS `:root` / `.dark` pseudo-classes.
- **Color Space**: We utilize **OKLCH** colors for superior perceptual uniformity and gamut support in modern browsers.
- **Behavior**: The `ThemeProvider` component mounts in `layout.tsx` and injects the `class="dark"` attribute onto the `<html>` element based on user preference or system settings.

### 4.3 Client-Side Persistence
To respect user privacy and allow offline usage without authentication:
- **Storage**: Browser `localStorage` is used to persist calculator state.
- **Implementation**: A single custom React hook, `useToolState` (in `src/hooks`), handles all of it. It reads storage inside `useEffect` to prevent Server-Side Rendering (SSR) mismatches (hydration errors), so data is only read after the component mounts on the client. Every tool goes through it, including tools that share nothing.
- **Shared pool profile (cross-tool)**: the hook implements a "per-tool key with bidirectional shared references" model. Each tool persists its full state under a `TOOL_KEYS` entry, while values that describe the pool itself (volume, CYA, FC, CC) are mirrored to `SHARED_KEYS` (`ph_pool_*`, defined in `src/lib/shared-state.ts`). Writing tool state updates both, so values entered in one tool are reused by another while you work. A tool's **reset is a full wipe** — it clears the tool key *and* the mapped shared keys — so every field is cleared and stays cleared after a reload.
- **Migrations**: when a tool's stored shape changes, `useToolState` takes an optional `migrate` callback that runs inside the hydration effect *before* anything is read — the only point where a rewrite can still be seen by the same render. Abandoned keys are listed in `LEGACY_KEYS` (`src/lib/shared-state.ts`) and deleted once converted; `use-chlorine-comparison.ts` is the worked example (it folded `ph_calcium_input` + `ph_sodium_input` into `ph_tool_comparison`).

### 4.4 Calculator Logic (Architecture)
Calculation logic is decoupled from UI components and lives in `src/lib/calculator/` as a **module of pure functions** (see its `AGENTS.md`).
- **Primitives**: `chlorine-target.ts` (shock FC from CYA + water color + breakpoint), `chlorine-dose.ts` (pure chlorine grams from volume × gap), `product-conversion.ts` (product amount + side effects), `pool-volume.ts` (volume from shape + dimensions), `maintenance-target.ts` (routine FC from CYA), `cya-projection.ts` (where CYA is heading over time). Each is independently callable and exposed via its own API route.
- **Shock vs maintenance are two different questions**, and deliberately two different primitives: `chlorine-target` answers "how high do I push FC *once*, to recover this pool", `maintenance-target` answers "where do I keep FC *every day*". Both read their ratios from the same published TFP table — 40% of CYA to shock, 7.5% minimum, 11.5% target.
- **Stabilized chlorine is fenced off from shocking**: `ProductId` covers every product the model knows, but the shock calculator and `shockProductIdSchema` accept only `ShockProductId` (`Exclude<ProductId, StabilizedProductId>`). A shock dose of trichlor or dichlor delivers tens of ppm of cyanuric acid at once — the very failure `cya-projection.ts` exists to warn about.
- **Orchestrators**: `shock.ts` composes the primitives into `computeShock` for the Shock Calculator; `chlorine-maintenance.ts` composes `maintenance-target → chlorine-dose → product-conversion` plus `cya-projection` into `computeChlorineMaintenance` for the Maintenance tool. The projection is returned as `null` when CYA is unknown, because projecting from the fallback range would present a guess as a countdown.
- **Product comparison**: `chlorine-comparison.ts` is built on **two generic slots (A and B)**, each holding any `ProductId`. A single `calculateProductMetrics` serves every product — solids are weighed directly, liquids priced by the litre are converted via density — and `compareProducts` returns the winner as a *slot* (`'A' | 'B' | 'DRAW' | null`), never as a chemical. That is what makes comparing two products of the same type possible; naming the chemical would say nothing when both sides hold it. Which products are solid vs liquid, and their typical label values, live in `PRODUCT_RETAIL_FORMS` (`constants.ts`).
- **Constants**: all chemistry numbers live in `constants.ts` with inline source citations (TFP / Orenda / PHTA). **Do not change them without consulting the source.**
- **Ranges**: results use a `RangeOrValue` type (`range.ts`) so "I don't know" answers (CYA → 30–80 ppm, FC → 0–2 ppm) propagate as min–max ranges.
- **i18n boundary**: the calculator returns numbers and codes only — never localized prose. The UI formats numbers via next-intl. This keeps all translations in one place.
- **Barrel**: `index.ts` re-exports everything, so every consumer imports from `@/lib/calculator`.
- **Tests**: `__tests__/` holds a Vitest suite (`npx vitest run`) of characterization tests that pin current behaviour, so refactors can be *proven* behaviour-preserving. `constants.test.ts` additionally pins every cited chemistry number, so an unsourced edit fails the build.

### 4.5 Public Calculation API (Modular)
Calculation endpoints live under `src/app/api/v1/calculate/`. Each primitive has a thin POST route that validates input and calls the matching pure function, so calculations are reusable by any client (and future tools):
- `chlorine-target/`, `chlorine-dose/`, `product-conversion/`, `pool-volume/` — individual primitives.
- `chlorine-maintenance/` — a wrapper orchestrating the routine-dosing question (target + dose + CYA projection). Unlike `/shock`, it accepts stabilized products: routine dosing is exactly what it measures.
- `shock/` — a wrapper that orchestrates the primitives in one call (what the Shock Calculator UI uses).
- `chlorine/` — the Chlorine Comparison endpoint (body `{ slotA, slotB }`).

**Validation & documentation share one source of truth** (`src/lib/api/`, see its `AGENTS.md`):
- `schemas.ts` — a Zod schema per endpoint. Routes validate through `validate.ts`'s `validateBody`, returning `400 { error, details }` on failure.
- `openapi.ts` — builds the OpenAPI 3.1 document, **generating each request schema from those same Zod schemas** via `z.toJSONSchema()`. A schema change therefore updates validation and documentation together; they cannot drift.
- Served at `/api/v1/openapi.json` (machine-readable) and rendered at `/[locale]/docs/api` (human-readable, in the site's own style).
- Caveat: Zod `.refine()` rules have no JSON Schema equivalent, so they are enforced at runtime but stated in prose in the spec (currently only `max >= min` on range inputs).

### 4.6 Tools
Tools live at `/[locale]/tools/<slug>`: `chlorine-comparison`, `chlorine-maintenance`, `shock`, and `pool-volume`. Each has a companion `/[slug]/info` page (linked via an `InfoButton`) built on the shared toolkit (`ToolInfoLayout` / `InfoSection` / `Formula` in `src/components/tools/shared/`), explaining the formulas and assumptions behind that tool's numbers. Tool components are **location-agnostic** — the `PoolVolumeCalculator` is used both as the standalone `/tools/pool-volume` page and embedded inside the Shock tool's volume modal, sharing state through the `ph_pool_*` localStorage keys. **To add a new tool, follow the `add-pool-tool` project skill** (`.claude/skills/add-pool-tool/`), which encodes the full file-by-file recipe and conventions.
