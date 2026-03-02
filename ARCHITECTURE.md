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
    theme-provider.tsx  # Next-themes wrapper for standardizing context.
    
  /lib                  # Pure business logic and utilities.
    calculator.ts       # Core chemical calculation algorithms (Pure functions).
    utils.ts            # Tailwind class merging (cn helper).
    use-local-storage.ts # Custom hook for client-side persistence.

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

### 4.4 Calculator Logic (Architecture)
Calculation logic is decoupled from UI components.
- **Location**: `src/lib/calculator.ts`.
- **Design**: Pure functions accepting input parameters and returning typed result objects. This facilitates easier unit testing and potential reuse in API routes.
