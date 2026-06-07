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
    /home               # Home page sections.
    theme-provider.tsx  # Next-themes wrapper for standardizing context.

  /lib                  # Pure business logic and utilities.
    /calculator         # Modular chemical calculation algorithms (Pure functions).
    utils.ts            # Tailwind class merging (cn helper).
    shared-state.ts     # Shared localStorage key constants across tools.

  /hooks                # Custom React hooks (client-side).
    use-local-storage.ts        # localStorage persistence with SSR-safe hydration.
    use-tool-state.ts           # Per-tool state + bidirectional shared-key sync.
    use-chlorine-comparison.ts  # State + debounced API for the comparison tool.
    use-shock-calculator.ts     # State + debounced API for the shock tool.

  /config               # Static configuration.
    nav-items.ts        # Navigation menu structure (tools, guide).

  /messages             # Translation dictionaries.
    it.json
    en.json

  /i18n                 # i18n Configuration.
    request.ts          # Server-side request config (locale validation).
    routing.ts          # Navigation wrappers (Link, useRouter) with locale context.

  middleware.ts         # Edge middleware for locale detection and redirection.
```

## 4. Core Patterns & Implementation Details

### 4.1 Internationalization (i18n)
The application utilizes a **sub-path routing strategy** (`/it/...`, `/en/...`).
- **Middleware**: Intercepts requests to ensure usage of a valid locale. Redirects root (`/`) to the default locale (`/it`).
- **Routing**: Internal navigation uses `src/i18n/pathnames.ts` (or standard Next.js Link wrapped by `next-intl`) to preserve the current locale automatically.

### 4.2 Theming Implementation
Theming is handled via `next-themes` interacting with Tailwind CSS variables.
- **Definition**: Variables are defined in `src/app/globals.css` using the `@theme` directive (Tailwind v4) and CSS `:root` / `.dark` pseudo-classes.
- **Color Space**: We utilize **OKLCH** colors for superior perceptual uniformity and gamut support in modern browsers.
- **Behavior**: The `ThemeProvider` component mounts in `layout.tsx` and injects the `class="dark"` attribute onto the `<html>` element based on user preference or system settings.

### 4.3 Client-Side Persistence
To respect user privacy and allow offline usage without authentication:
- **Storage**: Browser `localStorage` is used to persist calculator state.
- **Implementation**: A custom React hook (`useLocalStorage`) handles hydration to prevent Server-Side Rendering (SSR) mismatches (hydration errors), ensuring data is only read after the component mounts on the client.
- **Shared pool profile (cross-tool)**: `useToolState` (in `src/hooks`) layers a "per-tool key with bidirectional shared references" model on top. Each tool persists its full state under a `TOOL_KEYS` entry, while values that describe the pool itself (volume, CYA, FC, CC) are mirrored to `SHARED_KEYS` (`ph_pool_*`, defined in `src/lib/shared-state.ts`). Writing tool state updates both, so values entered in one tool are reused by another while you work. A tool's **reset is a full wipe** — it clears the tool key *and* the mapped shared keys — so every field is cleared and stays cleared after a reload.

### 4.4 Calculator Logic (Architecture)
Calculation logic is decoupled from UI components and lives in `src/lib/calculator/` as a **module of pure functions** (see its `AGENTS.md`).
- **Primitives**: `chlorine-target.ts` (target FC from CYA + water color + breakpoint), `chlorine-dose.ts` (pure chlorine grams from volume × gap), `product-conversion.ts` (product amount + side effects), `pool-volume.ts` (volume from shape + dimensions). Each is independently callable and exposed via its own API route.
- **Orchestrator**: `shock.ts` composes the primitives into a single `computeShock` used by the Shock Calculator.
- **Constants**: all chemistry numbers live in `constants.ts` with inline source citations (TFP / Orenda / PHTA). **Do not change them without consulting the source.**
- **Ranges**: results use a `RangeOrValue` type (`range.ts`) so "I don't know" answers (CYA → 30–80 ppm, FC → 0–2 ppm) propagate as min–max ranges.
- **i18n boundary**: the calculator returns numbers and codes only — never localized prose. The UI formats numbers via next-intl. This keeps all translations in one place.
- **Backward compatibility**: `index.ts` re-exports everything, so `@/lib/calculator` keeps resolving for the existing Chlorine Comparison tool (`chlorine-comparison.ts`).

### 4.5 Public Calculation API (Modular)
Calculation endpoints live under `src/app/api/v1/calculate/`. Each primitive has a thin POST route that validates input and calls the matching pure function, so calculations are reusable by any client (and future tools):
- `chlorine-target/`, `chlorine-dose/`, `product-conversion/`, `pool-volume/` — individual primitives.
- `shock/` — a wrapper that orchestrates the primitives in one call (what the Shock Calculator UI uses).
- `chlorine/` — the pre-existing Chlorine Comparison endpoint.

### 4.6 Tools
Tools live at `/[locale]/tools/<slug>`: `chlorine-comparison`, `shock`, and `pool-volume`. Tool components are **location-agnostic** — the `PoolVolumeCalculator` is used both as the standalone `/tools/pool-volume` page and embedded inside the Shock tool's volume modal, sharing state through the `ph_pool_*` localStorage keys. **To add a new tool, follow the `add-pool-tool` project skill** (`.claude/skills/add-pool-tool/`), which encodes the full file-by-file recipe and conventions.
