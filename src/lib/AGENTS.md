# src/lib/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs the `src/lib` directory.
2.  **Pure Functions**:
    -   Utilities should be pure functions whenever possible (deterministic, no side effects).
3.  **Type Safety**:
    -   Strict TypeScript usage. No `any` unless absolutely unavoidable.
4.  **Testing**:
    -   **`src/lib/calculator/` IS COVERED BY VITEST** (`src/lib/calculator/__tests__/`). Run `npx vitest run` before and after any change here.
    -   These are **characterization tests**: they pin current behaviour so refactors can be proven behaviour-preserving. A failing test after your edit means you changed behaviour — **decide whether you meant to, and tell the human. Never edit a test just to make it pass.**
    -   New pure logic must arrive with tests. New chemistry constants must be added to `constants.test.ts` too (it pins every cited number on purpose).

## 2. 🗺️ Map of Knowledge

| Path | Content | AI Agent Action |
|------|---------|-----------------|
| `utils.ts` | Shared utilities | **Check for `cn` and other helpers** |
| `calculator/` | Modular pool-chemistry engine (pure functions) + its `__tests__/` suite | **SEE `src/lib/calculator/AGENTS.md`; run `npx vitest run`** |
| `api/` | Zod validation schemas for the calculate API (source of truth for runtime validation + generated OpenAPI spec) | **SEE `src/lib/api/AGENTS.md`** |
| `shared-state.ts` | localStorage key registry (`SHARED_KEYS`, `TOOL_KEYS`) | **Use these keys for cross-tool shared state** |
