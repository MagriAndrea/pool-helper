# src/config/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs the `src/config` directory.
2.  **Single Source of Truth**: This folder contains static configuration files that drive logic across the application (e.g., Navigation, Constants).
3.  **Type Safety**: All configs MUST export strongly typed objects/constants.

## 2. 🗺️ Map of Knowledge

| File | Purpose | AI Agent Action |
|------|---------|-----------------|
| `nav-items.ts` | Navigation Structure (Menu items, hierarchy) | **Modify to add pages/links** |
