# src/messages/AGENTS.md

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Scope**: This file governs the `src/messages` directory.
2.  **Format**:
    -   All files MUST be valid JSON.
    -   Keys MUST match across all locale files (`en.json`, `it.json`).
3.  **Synchronization**:
    -   If you add a key to one file, you MUST add it to all others.
    -   Use English as the source for keys if in doubt.

## 2. 🗺️ Map of Knowledge

| Path | Content | AI Agent Action |
|------|---------|-----------------|
| `en.json` | English Translations | **Reference for keys** |
| `it.json` | Italian Translations | **Keep in sync with EN** |
