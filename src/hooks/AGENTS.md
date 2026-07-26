# src/hooks/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs the `src/hooks` directory (client-side custom React hooks).
2.  **Client Only**:
    -   Hooks here run on the client. Files that use them must be `'use client'`.
    -   ❌ **DO NOT** import these from Server Components.
3.  **SSR-Safe Hydration (STRICT)**:
    -   Any hook touching `localStorage`/`window` MUST avoid SSR hydration mismatches.
    -   ✅ **DO** read browser-only state inside `useEffect` after mount (see `use-tool-state.ts`).
4.  **One persistence hook**: every tool persists through `useToolState`, even one with nothing to share — pass an empty `mappings` array. That keeps the `TOOL_KEYS` registry, the full-wipe reset semantics and the migration slot uniform across tools. There is deliberately no lower-level "just a localStorage key" hook to reach for.
5.  **Changing a tool's stored shape** is a migration, not a rename: pass a `migrate` callback to `useToolState` (it runs inside the hydration effect, before anything is read), register the abandoned key in `LEGACY_KEYS`, and delete it once converted. `use-chlorine-comparison.ts` is the worked example.
4.  **Type Safety**:
    -   Strict TypeScript. Generic hooks should be properly parameterized. No `any` unless unavoidable.

## 2. 🗺️ Map of Knowledge

| Path | Content | AI Agent Action |
|------|---------|-----------------|
| `use-tool-state.ts` | Per-tool persistence, bidirectional shared-key sync (the "shared pool profile" mechanism), and the one-shot `migrate` slot | **The persistence hook. Use it for every tool, shared values or not** |
| `use-chlorine-comparison.ts` | State + debounced API call for the Chlorine Comparison tool; also the legacy-key migration example | **Pattern reference for tool hooks** |
| `use-shock-calculator.ts` | State + debounced API call for the Shock Calculator tool | **Pattern reference for tool hooks** |
