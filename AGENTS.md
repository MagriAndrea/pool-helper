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
- 🔄 Rule says "never do X" but code does X everywhere → Notify user of discrepancy
- 📊 Workflow diagram shows steps that don't exist → Notify user of discrepancy

---

### 📢 RULE #1: SELF-ENFORCING DOCUMENTATION

**If you (or previous agents) ignores a rule, the rule is TOO WEAK.**

**YOUR REQUIRED ACTION:**
0. Notify the user that a rule was ignored
1. Rewrite the rule to be MORE visible (bold, CAPS, emoji)
2. Move it higher up in the document
3. 🚨 Add concrete examples (See "Examples of Discrepancies" above)
4. Add a checklist or Chain-of-Thought questions

**This is not optional. Weak rules are bugs in the documentation.**

---

## 2. 📝 MANDATORY WIP (WORK IN PROGRESS) TRACKING

The WIP protocol is used for **complex tasks requiring multiple steps**. It acts as a **Handoff Document** to provide absolute context across different chats or agents, preventing context overload.

### 🚦 WHEN TO USE WIP (Decision Tree)

**DO NOT** use a WIP for simple tasks (e.g., creating a simple UI component, a quick bug fix, modifying 1-2 files).

**HOW TO IDENTIFY A COMPLEX TASK (Requires WIP):**
- 📏 **Long/Multi-topic prompt**: The user gives a very long prompt touching multiple architectural areas (Note: pasting a long React component with a simple question does NOT count as complex).
- ⚠️ **Explicit difficulty**: The user explicitly tells you the task is difficult.
- 🤖 **Agent Autonomy**: If you (the agent) realize the request is too complex for a couple shots, **you must proactively propose creating a WIP**.

### 📁 FILE NAMING & MULTIPLE WIPS

- **The user works alone on this project**, but **multiple concurrent WIPs are allowed** (the user or agents might be working on different features simultaneously).
- **Naming Convention**: `WIP_ShortDescriptiveName.md` (e.g., `WIP_FeatureCardRefactor.md`, `WIP_TranslationSystem.md`).

### 🔄 NEW CHATS & EXISTING WIPS ALGORITHM

When starting a **NEW CHAT**, always check the root folder for existing `WIP_*.md` files.
1. **IF** the user's prompt matches an open task (`❌`) in an existing WIP:
   - 🛑 **ASK FIRST**: "I see this relates to `WIP_xyz.md`, should I proceed with this task and update the WIP?"
   - Wait for confirmation.
2. **IF** the user's prompt is completely unrelated to any open WIP (e.g., request for an unrelated bug fix):
   - 📢 **NOTIFY**: Briefly state "I will proceed with this task without touching the existing WIPs to avoid altering them."
   - Proceed normally without updating any WIP file.

### 🏗️ REQUIRED WIP STRUCTURE

When creating or updating a `WIP_*.md` file, it MUST contain exactly these sections:
- **1. Initial State**: What was the starting point or context? (e.g., "The user requested to transition `FeatureCard.tsx` from a Client Component to a Server Component...").
- **2. Objective**: The exact goal, including architectural decisions and constraints agreed upon with the user (e.g., "Refactor the component to fetch data server-side while keeping the interactive parts in a smaller client component...").
- **3. Target Files**: A list of the specific files/paths being modified or created for this task (e.g., `src/components/home/FeatureCard.tsx`, `src/components/home/FeatureCardInteractive.tsx`).
- **4. Current Situation & Checklist**: What has been done and what is left. Use ✅ and ❌ to clearly mark status.
- **5. Success Criteria**: How do we know the task is complete? (So the agent knows when to archive it).

### 💾 ARCHIVING TO CHANGELOG & UPDATING DOCS

Once the task is fully completed (Success Criteria met):
1. **Move** the `WIP_*.md` file into the `changelog/` directory.
2. **Rename** it to `changelog/YYYY-MM-DD_ShortDescriptiveName.md`.
3. **Delete** the original `WIP_*.md` from the root.
4. **UPDATE DOCUMENTATION**: Automatically update `ARCHITECTURE.md` (or any other relevant documentation) to reflect the changes introduced by the completed WIP.

---

## 3. �🛡️ Operational Rules (NON-NEGOTIABLE)

1.  **Write in English**: The project is in Italian, but AGENTS.md MUST be in English because AI agents are optimized for English.
2.  **Optimize for Attention**: Use `🛑 CRITICAL` for bans and `⚡ QUICK START` for immediate context.
3.  **Chain-of-Thought**: Add questions the agent must answer before acting.
4.  **Define Scope**: This file governs the `pool-helper/` folder.
5.  **Insert a Map of Knowledge**: See section "Map of Knowledge".
6.  **🧩 NO DEEP-LINKING (STRICT)**:
    *   **🛑 STOP**: Do NOT link to files deeper than the immediate subdirectory (e.g., `src/app/api/route.ts`).
    *   **✅ ACTION**: Link ONLY to the `AGENTS.md` in the immediate subdirectory (e.g., `src/app/`).
    *   **⚠️ PENALTY**: Ignoring this breaks the "Pyramidal Structure" and will cause hallucinations.
7.  **⚖️ Rule Placement**: Write rules where they belong based on scope:
     - **Specific** → Local `AGENTS.md`.
     - **Category** → Parent `AGENTS.md`.
     - **Global** → Root `AGENTS.md`.
8.  **🌍 TRANSLATION CHECK (STRICT)**:
    *   **ALWAYS** verify that text visible to the user is properly translated using `next-intl`.
    *   **NEVER** leave hardcoded text in components. If you add a string, you must add it to both `en.json` and `it.json`.
9.  **🚫 DO NOT RUN DEV/BUILD SERVERS (STRICT)**:
    *   **NEVER** run commands like `npm run dev` or `npm run build` in the terminal.
    *   The human user already has `npm run dev` running continuously and can see the changes live. Running these commands will cause port conflicts or unnecessary processing.
10. **🦾 USE SKILLS / SUB-AGENTS ON DEMAND**:
    *   If the user prompts you to "act like X", "use skill X", or asks for specialized help (e.g., UI Design, Shadcn components), **YOU MUST FIRST READ the matching `.md` file in `.agent/skills/`** before executing any coding tasks.
    *   **✅ EXAMPLES**:
        *   User: "Use the UI Designer skill to improve this page." → Action: `view_file` on `.agent/skills/ui-ux-pro-max/SKILL.md`, then apply those rules.
        *   User: "Add a Shadcn list component here." → Action: `view_file` on `.agent/skills/shadcn-pro.md`, then proceed.
11. **🧹 AGGRESSIVE HOUSEKEEPING (STRICT)**:
    *   **ALWAYS** ask the user to delete any temporary scripts, files, texts, or assets that were created or used temporarily during a task (e.g., a script to convert one format to another).
    *   This is to ensure the project remains clean and free of leftover files that "who knows who made" or "who knows if they are needed".

## 4. 🧭 Navigation & Hierarchy

This project uses a **Hierarchical Documentation System**.
- **This File** (`/AGENTS.md`): Root file of the project.
- **Deep Logic**: Look for `AGENTS.md` in subdirectories.
- **Pyramidal Structure**: Top-level AGENTS.md files are general, deeper ones are specific.
- **Fallback**: If no `AGENTS.md` exists, check for `README.md`.

## 5. 🗺️ Map of Knowledge

| Path | Content | AI Agent Action |
|------|---------|-----------------|
| `.agent/skills/` | Specialized Sub-agents & AI Skills | **READ matching skill when acting as an expert** |
| `src/app/` | Application Logic (Next.js App Router) | **SEE `src/app/AGENTS.md`** |
| `src/components/` | UI Components (Shadcn/UI) | **SEE `src/components/AGENTS.md`** |
| `src/lib/` | Utilities and Helpers | **SEE `src/lib/AGENTS.md`** |
| `src/i18n/` | Internationalization Config | **SEE `src/i18n/AGENTS.md`** |
| `src/messages/` | Translation Files (JSON) | **SEE `src/messages/AGENTS.md`** |
| `src/config/` | Configuration Files (Navigation, etc.) | **SEE `src/config/AGENTS.md`** |
| `ARCHITECTURE.md` | Overview of the project's architecture | **SEE `ARCHITECTURE.md`** |
| `changelog/` | Archive of completed WIP tasks | **Store finished WIP files here** |