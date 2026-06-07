# src/lib/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs the `src/lib` directory.
2.  **Pure Functions**:
    -   Utilities should be pure functions whenever possible (deterministic, no side effects).
3.  **Type Safety**:
    -   Strict TypeScript usage. No `any` unless absolutely unavoidable.
4.  **Testing**:
    -   Logic here is a prime candidate for unit tests.

## 2. 🗺️ Map of Knowledge

| Path | Content | AI Agent Action |
|------|---------|-----------------|
| `utils.ts` | Shared utilities | **Check for `cn` and other helpers** |
| `calculator/` | Modular pool-chemistry engine (pure functions) | **SEE `src/lib/calculator/AGENTS.md`** |
| `shared-state.ts` | localStorage key registry (`SHARED_KEYS`, `TOOL_KEYS`) | **Use these keys for cross-tool shared state** |
