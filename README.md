# Pool Helper

**[pool-helper-me.vercel.app](https://pool-helper-me.vercel.app)**

Calculators and a maintenance guide for swimming pool owners — how much chlorine to add, which product is actually cheaper, and how many liters your pool really holds.

Built as a summer 2026 learning project: a real application developed alongside AI, with a deliberate emphasis on clean architecture, pure calculation logic, and documenting every number back to its source.

**Bilingual** (Italian / English) · **No accounts, no cookies, no tracking** — all state lives in the browser's `localStorage`.

## Tools

| Tool | Route | What it answers |
|------|-------|-----------------|
| Chlorine Comparison | `/tools/chlorine-comparison` | Which chlorine product is cheaper *per kilogram of active chlorine* — not per package |
| Shock Calculator | `/tools/shock` | How much product to add to shock the pool, based on volume, water color, CYA and current FC |
| Pool Volume | `/tools/pool-volume` | How many liters/m³/gallons the pool holds, from its shape and dimensions |

Every tool has a companion `/info` page documenting its formulas, constants and assumptions, with citations.

## Tech stack

- **[Next.js 16](https://nextjs.org/)** (App Router, React Server Components by default)
- **TypeScript** (strict mode)
- **[Tailwind CSS v4](https://tailwindcss.com/)** — OKLCH color space, CSS-variable theming, dark mode via `next-themes`
- **[shadcn/ui](https://ui.shadcn.com/)** — Radix primitives, restyled into a data-dense dashboard aesthetic
- **[next-intl](https://next-intl-docs.vercel.app/)** — sub-path routing (`/it/…`, `/en/…`), JSON message catalogues
- **[Zod](https://zod.dev/)** — API input validation

## Getting started

```bash
npm install
```

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) — the root redirects to the default locale (`/it`).

### Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run setup:agents` | Link the `agency-agents` submodule into `.claude/agents/` |

## Architecture at a glance

```text
src/
  app/[locale]/     # Pages (i18n sub-path routing)
  app/api/v1/       # Calculation API — thin routes over the pure functions
  components/       # UI (shadcn primitives, tool components, home sections)
  lib/calculator/   # Pure calculation logic — no React, no i18n, no side effects
  hooks/            # Client state + localStorage persistence
  messages/         # en.json / it.json translation catalogues
```

Two rules shape most of the codebase:

1. **Calculation logic is pure and UI-free.** Everything in `src/lib/calculator/` is a plain function taking numbers and returning numbers or codes — never localized prose. The UI formats those numbers via `next-intl`, which keeps all translation in one place and makes the logic trivially testable and reusable.
2. **Chemistry constants live in exactly one file.** `src/lib/calculator/constants.ts` holds every threshold, ratio and coefficient, each with an inline citation to its source (TroubleFreePool, Orenda, PHTA). Nothing downstream restates a number — the tool info pages read the same constants they document.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the full picture, and [`AGENTS.md`](AGENTS.md) for the conventions that AI agents (and humans) must follow when contributing.

## Calculation API

The calculators are exposed as public POST endpoints under `/api/v1/calculate/`, so the logic is reusable outside this UI:

| Endpoint | Returns |
|----------|---------|
| `chlorine-target` | Target free chlorine (SLAM / breakpoint / floor) |
| `chlorine-dose` | Grams of pure available chlorine needed |
| `product-conversion` | Amount of a specific product + its side effects |
| `pool-volume` | Volume in L, m³ and US gallons |
| `shock` | The three primitives above, orchestrated in one call |
| `chlorine` | Cost comparison between two chlorine products |

Requests are validated with Zod schemas that double as the source for the OpenAPI specification.

## Disclaimer

Pool Helper is an educational project, not professional advice. The guidance targets **manually chlorinated pools** — saltwater pools (salt chlorine generators) are out of scope. Always follow the instructions on your chemical products' labels, and never mix different chlorine products.

Full text: [`/disclaimer`](https://pool-helper-me.vercel.app/it/disclaimer) · Project story: [`/about`](https://pool-helper-me.vercel.app/it/about)

## License

Not currently licensed for reuse. The source is public so anyone can verify the privacy claims above and learn from the implementation.
