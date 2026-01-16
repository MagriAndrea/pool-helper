# src/i18n/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs the `src/i18n` directory.
2.  **Library**: This project uses `next-intl` for internationalization.
3.  **Routing**:
    -   `routing.ts` defines supported locales and default locale.
    -   `request.ts` handles the request configuration.
4.  **No Hardcoded Strings**:
    -   ❌ **DO NOT** hardcode text in components.
    -   ✅ **DO** use the `useTranslations` hook.

## 2. 🗺️ Map of Knowledge

| Path | Content | AI Agent Action |
|------|---------|-----------------|
| `routing.ts` | Locale Routing Config | **Check for supported locales** |
| `request.ts` | Request Config | **Check for message loading logic** |
