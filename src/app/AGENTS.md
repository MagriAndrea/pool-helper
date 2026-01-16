# src/app/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs the `src/app` directory (Next.js App Router).
2.  **Server Components Default**: All components are Server Components by default.
    -   ❌ **DO NOT** add `"use client"` unless specifically needed (hooks, event listeners).
    -   ✅ **DO** keep client logical at the leaves of the component tree.
3.  **Routing & File Structure**:
    -   Follow Next.js 14+ App Router conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
    -   Use `route.ts` for API endpoints.
4.  **Data Fetching**:
    -   Fetch data directly in Server Components.
    -   Use `suspense` for streaming.

## 2. 🗺️ Map of Knowledge

| Path | Content | AI Agent Action |
|------|---------|-----------------|
| `api/` | Backend API Routes | **Read `route.ts` files** |
| `layout.tsx` | Root Layouts | **Check for global providers/wrappers** |
| `page.tsx` | Page UI | **Primary entry point for routes** |
