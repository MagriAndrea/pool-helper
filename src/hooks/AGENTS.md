# src/hooks/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs the `src/hooks` directory (client-side custom React hooks).
2.  **Client Only**:
    -   Hooks here run on the client. Files that use them must be `'use client'`.
    -   ❌ **DO NOT** import these from Server Components.
3.  **SSR-Safe Hydration (STRICT)**:
    -   Any hook touching `localStorage`/`window` MUST avoid SSR hydration mismatches.
    -   ✅ **DO** read browser-only state inside `useEffect` after mount (see `use-local-storage.ts`).
4.  **Type Safety**:
    -   Strict TypeScript. Generic hooks should be properly parameterized. No `any` unless unavoidable.

## 2. 🗺️ Map of Knowledge

| Path | Content | AI Agent Action |
|------|---------|-----------------|
| `use-local-storage.ts` | Low-level localStorage persistence with SSR-safe hydration | **Base building block for persistence** |
| `use-tool-state.ts` | Per-tool state + bidirectional shared-key sync (the "shared pool profile" mechanism) | **Use for any tool that shares values (volume, CYA, FC...) with other tools** |
| `use-chlorine-comparison.ts` | State + debounced API call for the Chlorine Comparison tool | **Pattern reference for tool hooks** |
| `use-shock-calculator.ts` | State + debounced API call for the Shock Calculator tool | **Pattern reference for tool hooks** |
