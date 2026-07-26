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
6. [ ] 🎓 **Do the `.claude/skills/` recipes still teach the CURRENT pattern?** (See RULE #0b.)

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

### ⚡ RULE #0b: SKILLS ARE CODE-COUPLED DOCUMENTATION ⚡

**🛑 A stale skill is WORSE than no skill: it actively teaches the next agent to reintroduce a pattern you just removed.**

**WHEN YOU CHANGE AN ESTABLISHED PATTERN** (how a route validates input, where state is persisted, how a page is structured, which helper is canonical), **you MUST grep `.claude/skills/` for the old pattern and update every recipe that teaches it — in the SAME change.**

**Chain-of-Thought before you finish any pattern change:**
1. Did I change *how something is done*, not just *what it does*?
2. Would someone copying `.claude/skills/add-pool-tool/SKILL.md` today produce code that matches the codebase, or code that matches the codebase as it was BEFORE my change?
3. Did I update the skill's step-by-step, its copy-paste stubs, AND its final checklist? (All three drift independently.)

**REAL EXAMPLE (2026-07-26):** the calculate routes moved to Zod validation, but `add-pool-tool`'s "Step 2" still showed hand-rolled field-presence checks. Any agent following it would have shipped an unvalidated route, absent from the OpenAPI spec, reintroducing the exact bug class that change had just fixed. It was caught by the human, not by the agent.

---

### ⚡ RULE #0c: NEVER PUBLISH AN EXTERNAL FACT YOU HAVE NOT TESTED ⚡

**🛑 Metadata is a claim, not a fact.** A URL in `package.json`, a GitHub repo's `homepage` field, a link in an old doc, a badge — all of these go stale silently and NOTHING warns you.

**✅ BEFORE writing any external URL / endpoint / host into code, docs, a README, or an API spec:**
```bash
curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" -L --max-time 10 "https://<the-url>"
```
Expect `200` **and** confirm the final URL is the page you meant.

**⚠️ WHY THIS IS NOT PEDANTRY (REAL EXAMPLE, 2026-07-26):** the repo's GitHub `homepage` field pointed at `pool-helper-mu.vercel.app`, a dead deploy (404). It was copied into the README and the public OpenAPI `servers` block on trust. The near-miss: `pool-helper.vercel.app` — the obvious "tidier" guess — belongs to **an unrelated third party's site**. Publishing a link to a stranger's site from your own README is a reputational bug, not a typo.

**Canonical production URL: `https://pool-helper-me.vercel.app`** (verified 2026-07-26).

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

### 🔀 SHIPPING A WIP PHASE (GIT WORKFLOW)

A WIP is usually delivered as **several sequential PRs from the same branch**, one per phase. This repo **squash-merges**, which has a consequence that WILL bite you:

**🛑 A squash merge rewrites your commit into a NEW commit on `main`.** Your branch still holds the original, so the next PR from that same branch opens as `CONFLICTING` even though nothing really conflicts.

**✅ THE FIX — do this before opening each follow-up PR:**
```bash
git add -A && git commit   # commit your work FIRST, so the rebase cannot lose it
git fetch origin main
git rebase origin/main     # git recognises the squashed phase and skips it ("skipped previously applied commit")
npx tsc --noEmit           # re-verify AFTER the rebase, not only before
git push --force-with-lease
```
Use `--force-with-lease`, never plain `--force`. If `git rebase` refuses because of unstaged changes, commit them — do **not** stash-and-hope, and never `reset`/`checkout` over uncommitted work.

**⚠️ Before merging, wait for the Vercel check** (`gh pr checks <n>`); `MERGEABLE` alone is not enough.

---

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
    *   **🛑 ADDING THE KEY IS NOT ENOUGH IF THE RENDERER LISTS ITS KEYS.** Some components iterate an **explicit** list rather than everything in the namespace, so a new key is silently never rendered. Known case: `src/components/home/GuideScrolling.tsx` declares `paragraphs: ['p1', 'p2']` per section — adding `p3` to the JSON shows nothing until it is added there too. **After adding a key, grep for where its siblings are consumed.**
    *   **✅ VERIFY PARITY + THE ITALIAN DASH BAN IN ONE GO:**
        ```bash
        node -e 'const en=require("./src/messages/en.json"),it=require("./src/messages/it.json");const k=(o,p="")=>Object.entries(o).flatMap(([x,v])=>v&&typeof v=="object"&&!Array.isArray(v)?k(v,p+x+"."):[p+x]);const E=new Set(k(en)),I=new Set(k(it));const a=[...E].filter(x=>!I.has(x)),b=[...I].filter(x=>!E.has(x));const d=[...JSON.stringify(it)].filter(c=>c==="—"||c==="–").length;console.log(a.length||b.length?{missingInIt:a,missingInEn:b}:"PARITY OK","| em/en dashes in it.json:",d)'
        ```
        Expect `PARITY OK` and `0` dashes (see rule #13).
9.  **🚫 DO NOT RUN DEV/BUILD SERVERS (STRICT) — BUT DO VERIFY**:
    *   **NEVER** run commands like `npm run dev` or `npm run build` in the terminal.
    *   The human user already has `npm run dev` running continuously and can see the changes live. Running these commands will cause port conflicts or unnecessary processing.
    *   **✅ RUN THESE INSTEAD — "it compiles" is NOT verification:**
        ```bash
        npx tsc --noEmit      # expect zero output
        npm run lint          # expect exactly the pre-existing 4 errors / 2 warnings, ZERO new ones
        ```
    *   **⚠️ KNOWN PRE-EXISTING LINT DEBT** (do NOT "fix" it as a drive-by, and do NOT let it hide YOUR new problems): `chemicals.js`, `src/app/[locale]/layout.tsx`, `src/components/Navbar.tsx`, `src/hooks/use-local-storage.ts`, `src/i18n/request.ts`. If the totals change, the new one is yours.
    *   **🧪 EXERCISE PURE LOGIC DIRECTLY.** There is no test runner yet, but Node ≥ 22 strips TypeScript natively, so a pure module can be imported and driven from a scratch script. Note `node_modules` lives in the **main repo**, not in a worktree, and raw Node needs explicit `.ts`/`.json` extensions and `with { type: 'json' }` where the bundler does not — use a small resolve hook if you hit that. Delete the script afterwards (rule #11).
    *   **👀 THE HUMAN IS YOUR BROWSER.** You cannot see the rendered page. For anything visual (layout, dark mode, mobile), state plainly that you could not verify it visually and ask the user to look.
10. **🦾 USE SUB-AGENTS ON DEMAND (CLAUDE CODE NATIVE)**:
    *   The `agency-agents` submodule (`.agents/agency-agents/`) is exposed to Claude Code as **native subagents** via symlinks in `.claude/agents/` (gitignored). Setup: `npm run setup:agents`.
    *   **🛑 DO NOT manually `Read` the agent `.md` files.** They are invocable via the `Agent`/`Task` tool, which runs them in an isolated context window. Reading them inline wastes context and bypasses the subagent sandbox.
    *   **✅ WHEN TO INVOKE A SUBAGENT**: When the user says "act as X", "use the X subagent", "use the X skill", or explicitly names an agent from the roster → call the `Agent` tool with `subagent_type` matching the agent name.
        *   Example: User says "Use the UI Designer to improve this page" → `Agent(subagent_type="UI Designer", prompt="...")`.
    *   **⚠️ DO NOT spawn subagents proactively for generic tasks** — only when the user explicitly requests one, or when the task genuinely matches an agent's specialty AND would benefit from an isolated context (see the `Agent` tool guidance in the system prompt).
    *   **🔄 UPDATING**: To pull new agents from upstream: `git submodule update --remote .agents/agency-agents && npm run setup:agents`.
    *   **🧰 OTHER IDEs**: If using Cursor/Aider/Windsurf/etc., run the upstream converter: `cd .agents/agency-agents && ./scripts/convert.sh && ./scripts/install.sh --tool <name>`.
11. **🧹 AGGRESSIVE HOUSEKEEPING (STRICT)**:
    *   **ALWAYS** ask the user to delete any temporary scripts, files, texts, or assets that were created or used temporarily during a task (e.g., a script to convert one format to another).
    *   This is to ensure the project remains clean and free of leftover files that "who knows who made" or "who knows if they are needed".
12. **🇬🇧 LANGUAGE SPLIT: EVERYTHING IS ENGLISH EXCEPT TRANSLATION VALUES (STRICT)**:
    *   **✅ CODE is ENGLISH — NO EXCEPTIONS**: every identifier, file name, variable, component, type, i18n key, route segment, CSS class, comment, AND **URL fragment / anchor ID** MUST be in English (e.g. `GuideSection`, `chemistry`, `cleaning`, `actions`, `sections.chemistry.title`, `<section id="chemistry">`, `href="/#chemistry"`).
    *   **✅ ITALIAN LIVES ONLY IN `src/messages/it.json`**: Italian is confined to the **values** of the Italian translation file. Everything else — including keys in `it.json` — stays English.
    *   **⚓ ANCHORS ARE ENGLISH**: URL fragments that appear in the address bar are part of the code layer, not the UX layer. Keep them English for total project consistency.
        *   **✅ DO**: `<section id="chemistry">`, `href="/#chemistry"`, nav label key `chemistry` → translation value `"Chimica"` (in `it.json`) / `"Chemistry"` (in `en.json`).
        *   **🛑 DO NOT**: `<section id="chimica">`, `href="/#chimica"`, Italian variable names, Italian comments, Italian keys.
    *   **⚠️ PENALTY**: Mixing Italian into code produces inconsistent identifiers that make refactors and searches painful. The only Italian strings in the repo should be translation values inside `it.json`.
13. **➖ NO EM/EN DASHES IN ITALIAN VALUES (STRICT)**:
    *   **🛑 NEVER** use `—` (em dash) or `–` (en dash) inside `src/messages/it.json` **values**. Italian typography does not use them the way English does, and the author does not want them.
    *   **✅ INSTEAD** use a comma, a colon, parentheses, or restructure the sentence. Example: not `"il pH sale — aggiungi acido"`, but `"il pH sale, aggiungi acido"`.
    *   **✅ ALLOWED**: em dashes in `en.json` values, in code comments, and in English docs like this file. The ban is scoped to Italian translation values.
    *   **⚠️ AUDIT BY CODEPOINT, NOT BY EYE.** These characters are easy to miss visually and get mangled when passed through shell arguments. Use the parity+dash command in rule #8 — it counts them programmatically and must report `0`.

## 4. 🧭 Navigation & Hierarchy

This project uses a **Hierarchical Documentation System**.
- **This File** (`/AGENTS.md`): Root file of the project.
- **Deep Logic**: Look for `AGENTS.md` in subdirectories.
- **Pyramidal Structure**: Top-level AGENTS.md files are general, deeper ones are specific.
- **Fallback**: If no `AGENTS.md` exists, check for `README.md`.

## 5. 🗺️ Map of Knowledge

| Path | Content | AI Agent Action |
|------|---------|-----------------|
| `.agents/agency-agents/` | Local Sub-agents & AI Skills Repository | **READ matching skill when acting as an expert** |
| `.claude/skills/` | Project skills (committed). `add-pool-tool` = the file-by-file recipe for a new tool. | **INVOKE/READ `add-pool-tool` before building a new tool** |
| `src/app/` | Application Logic (Next.js App Router) | **SEE `src/app/AGENTS.md`** |
| `src/components/` | UI Components (Shadcn/UI) | **SEE `src/components/AGENTS.md`** |
| `src/lib/` | Utilities and Helpers | **SEE `src/lib/AGENTS.md`** |
| `src/hooks/` | Custom React Hooks (client-side state) | **SEE `src/hooks/AGENTS.md`** |
| `src/i18n/` | Internationalization Config | **SEE `src/i18n/AGENTS.md`** |
| `src/messages/` | Translation Files (JSON) | **SEE `src/messages/AGENTS.md`** |
| `src/config/` | Configuration Files (Navigation, etc.) | **SEE `src/config/AGENTS.md`** |
| `ARCHITECTURE.md` | Overview of the project's architecture | **SEE `ARCHITECTURE.md`** |
| `changelog/` | Archive of completed WIP tasks | **Store finished WIP files here** |