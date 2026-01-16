# src/components/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs the `src/components` directory.
2.  **Shadcn/UI Authority**:
    -   This project uses Shadcn/UI.
    -   ❌ **DO NOT** reinvent standard components (Button, Input, Card).
    -   ✅ **DO** use the CLI or copy properly from Shadcn documentation if strictly necessary and requested.
3.  **Component Design**:
    -   **Atomic**: Components should be small and focused.
    -   **Reusability**: Avoid hardcoding business logic inside generic UI components.
    -   **Props**: Define clear interfaces for all props.
4.  **Styling**:
    -   Use `Tailwind CSS` utility classes.
    -   Use `cn()` utility for class merging.

## 2. 🗺️ Map of Knowledge

| Path | Content | AI Agent Action |
|------|---------|-----------------|
| `ui/` | Shadcn Primitives | **Use these as building blocks** |
