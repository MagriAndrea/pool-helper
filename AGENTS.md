# AGENTS.md

## 🚨 CRITICAL - READ THIS FIRST BEFORE ANY ACTION 🚨

### ⚡ RULE #0: MANDATORY REALITY CHECK - NO EXCEPTIONS ⚡

**YOU MUST CHECK THIS IMMEDIATELY UPON READING ANY `AGENTS.md` FILE:**

✅ **CHECKLIST (Complete this BEFORE asking for permission):**
1. [ ] Do all folder paths mentioned in this file actually exist?
2. [ ] Do all file references point to existing files?
3. [ ] Are the naming conventions described actually being followed in the codebase?
4. [ ] Is the logic/workflow described consistent with the actual code?
5. [ ] Are there deprecated rules that contradict the current state?

**IF YOU FIND A DISCREPANCY:**
- ❌ **DO NOT** ask "should I fix this?"
- ✅ **DO** fix it immediately if you have no doubt, else ask user
- ✅ **DO** document what you fixed in your response

**EXAMPLES OF DISCREPANCIES REQUIRING IMMEDIATE ACTION:**
- 📁 Folder referenced in Map of Knowledge doesn't exist → Remove from table or create folder
- 📄 File path is wrong → Update to correct path
- 🏷️ Naming pattern says `RequiredPrefix_*` but code uses `different_pattern_*` → Update documentation to match reality
- 🔄 Rule says "never do X" but code does X everywhere → Update rule to reflect reality
- 📊 Workflow diagram shows steps that don't exist → Update or remove diagram

---

### 📢 RULE #1: SELF-ENFORCING DOCUMENTATION

**If you (or previous agents) ignore a rule, the rule is TOO WEAK.**

**YOUR REQUIRED ACTION:**
1. Rewrite the rule to be MORE visible (bold, CAPS, emoji)
2. Move it higher up in the document
3. 🚨 Add concrete examples (See "Examples of Discrepancies" above)
4. Add a checklist or Chain-of-Thought questions

**This is not optional. Weak rules are bugs in the documentation.**

---

## 1. 🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Write in English**: The project is in Italian, but AGENTS.md MUST be in English because AI agents are optimized for English.
2.  **Optimize for Attention**: Use `🛑 CRITICAL` for bans and `⚡ QUICK START` for immediate context.
3.  **Chain-of-Thought**: Add questions the agent must answer before acting.
4.  **Define Scope**: This file governs the `/home/andrea/projects/pool-helper` folder.
5.  **Insert a Map of Knowledge**: See section 3.
6.  **🧩 NO DEEP-LINKING (STRICT)**:
    *   **🛑 STOP**: Do NOT link to files deeper than the immediate subdirectory (e.g., `src/app/api/route.ts`).
    *   **✅ ACTION**: Link ONLY to the `AGENTS.md` in the immediate subdirectory (e.g., `src/app/`).
    *   **⚠️ PENALTY**: Ignoring this breaks the "Pyramidal Structure" and will cause hallucinations.
7.  **⚖️ Rule Placement**: Write rules where they belong based on scope:
     - **Specific** → Local `AGENTS.md`.
     - **Category** → Parent `AGENTS.md`.
     - **Global** → Root `AGENTS.md`.

## 2. 🧭 Navigation & Hierarchy

This project uses a **Hierarchical Documentation System**.
- **This File** (`/AGENTS.md`): Root file of the project.
- **Deep Logic**: Look for `AGENTS.md` in subdirectories.
- **Pyramidal Structure**: Top-level AGENTS.md files are general, deeper ones are specific.
- **Fallback**: If no `AGENTS.md` exists, check for `README.md`.

## 3. 🗺️ Map of Knowledge

| Path | Content | AI Agent Action |
|------|---------|-----------------|
| `src/app/` | Application Logic (Next.js App Router) | **SEE `src/app/AGENTS.md`** |
| `src/components/` | UI Components (Shadcn/UI) | **SEE `src/components/AGENTS.md`** |
| `src/lib/` | Utilities and Helpers | **SEE `src/lib/AGENTS.md`** |
| `src/i18n/` | Internationalization Config | **SEE `src/i18n/AGENTS.md`** |
| `src/messages/` | Translation Files (JSON) | **SEE `src/messages/AGENTS.md`** |
| `src/config/` | Configuration Files (Navigation, etc.) | **SEE `src/config/AGENTS.md`** |
| `ARCHITECTURE.md` | Overview of the project's architecture | **SEE `ARCHITECTURE.md`** |