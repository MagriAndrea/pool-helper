---
name: add-pool-tool
description: Use when adding a NEW calculator/tool to the pool-helper project (e.g. "create a tool that…", "new calculator", "add a tool to /tools"). Provides the exact file-by-file recipe — pure lib → public API → i18n → hook → components → page → nav → docs — plus copy-paste stubs, the golden rules, and the static verification commands, so every new tool stays consistent with the existing `chlorine-comparison` and `shock` tools. Read this BEFORE writing any tool code.
---

# Add a Pool-Helper Tool

A "tool" is a self-contained calculator under `/[locale]/tools/<slug>`. This project ships them as **vertical slices** that all follow the same shape. Copy that shape and a new tool will be consistent for free (dark/light, mobile/desktop, EN/IT, localStorage, transparent calc, public API).

**Reference implementations** (read them before starting): `chlorine-comparison` (simple, two-card comparator) and `shock` (complex, multi-step reveal flow with shared state). When in doubt, mimic `shock`.

---

## 0. Decide scope first (and maybe a WIP)

- If the task touches many layers (it always does for a real tool), create a `WIP_<Name>.md` in the repo root per the root `AGENTS.md` WIP protocol, and keep its checklist updated.
- Pick an **English slug** (kebab-case, e.g. `pool-volume`) — it becomes the route, the nav key, the lib filenames. URLs/anchors are English (root `AGENTS.md` rule #12).

---

## 1. 🛑 Golden rules (NON-NEGOTIABLE)

1. **English everywhere except `it.json` values.** Identifiers, keys, routes, anchors, comments → English. Italian lives ONLY in `src/messages/it.json` values.
2. **No hardcoded user-facing strings.** Every visible string is an i18n key used via `useTranslations('Namespace')`. Add it to BOTH `en.json` and `it.json` (keys must stay at parity).
3. **Pure logic in `src/lib/calculator/`.** Deterministic functions, no I/O, no `Date.now()`. All magic numbers go in `constants.ts` **with an inline source citation**.
4. **The lib returns numbers/codes, never localized prose.** The UI formats numbers via next-intl (so i18n stays in one place). Numbers a user reads → format with `Intl.NumberFormat(locale)` so Italian shows `1,4`.
5. **API routes are thin.** `src/app/api/v1/calculate/<x>/route.ts` validates input and calls the pure function. One route per primitive; add a wrapper route if the tool orchestrates several.
6. **Persist with the hooks, SSR-safe.** Use `useToolState` (per-tool key + shared `ph_pool_*` keys) for anything that represents pool reality and should be reused across tools; otherwise `useLocalStorage`. Hydrate inside `useEffect` (never read `localStorage` during render).
7. **Reset = full wipe.** A tool's "Start over" clears the tool key AND its mapped shared keys (`useToolState.reset` already does this). Style it red: `text-destructive font-semibold`.
8. **Theme-safe styling.** Use semantic tokens (`bg-card`, `text-foreground`, `bg-primary`/`text-primary-foreground`, `border-warning`, `text-destructive`). 🛑 Do NOT use `bg-foreground`/`text-background` for emphasis boxes — they INVERT in dark mode and break fixed-color children. For a hero box use `bg-primary text-primary-foreground`.
9. **Reuse Shadcn primitives** (`@/components/ui/*`) and the shock shared components (`StepCard`, `NumberInput`, `DontKnowToggle`, …). Don't reinvent inputs/cards.
10. **🚫 Never run `npm run dev` / `npm run build`** (the user already runs dev). Verify with `tsc`, `eslint`, and the scripts in §10.

---

## 2. Anatomy of a tool (where each file goes)

```
src/lib/calculator/<feature>.ts        # pure function(s) + add types to types.ts, numbers to constants.ts
src/lib/calculator/index.ts            # re-export the new file (barrel)
src/app/api/v1/calculate/<slug>/route.ts   # thin POST wrapper
src/messages/en.json + it.json         # Tools.<Name> namespace + Navigation.<slug> labels
src/hooks/use-<slug>.ts                # state (useToolState/useLocalStorage) + debounced fetch
src/components/tools/<slug>/*.tsx      # UI; lift shared bits into ./shared/
src/app/[locale]/tools/<slug>/page.tsx # 'use client' page that wires the hook to the components
src/config/nav-items.ts                # add an entry under tools.children (icon from lucide-react)
ARCHITECTURE.md + relevant AGENTS.md   # document the new tool
```

---

## 3. Step 1 — Pure library

Add types to `src/lib/calculator/types.ts`, numbers to `constants.ts` (cited!), then the function:

```ts
// src/lib/calculator/<feature>.ts
import { SOME_CONSTANT } from './constants';
import { makeValue } from './range';
import type { MyInput, MyResult } from './types';

/** One sentence on what this computes + the formula. */
export function computeMyThing(input: MyInput): MyResult {
  // pure, deterministic, return typed object
}
```

Re-export it:

```ts
// src/lib/calculator/index.ts
export * from './<feature>';
```

If "I don't know" answers are possible, model outputs as `RangeOrValue` (`range.ts`) and surface a **mean + a prominent warning with the range** in the UI (see `shock`'s ResultStep) rather than dumping raw extremes.

---

## 4. Step 2 — Public API route

```ts
// src/app/api/v1/calculate/<slug>/route.ts
import { NextResponse } from 'next/server';
import { computeMyThing } from '@/lib/calculator';
import type { MyInput } from '@/lib/calculator';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<MyInput>;
    // validate required fields → 400 if missing
    const result = computeMyThing(body as MyInput);
    return NextResponse.json(result);
  } catch (error) {
    console.error('<slug> error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

---

## 5. Step 3 — i18n

Add a `Tools.<Name>` namespace to `en.json` and mirror it in `it.json` (Italian values, English keys). Add `Navigation.<slug>` + `Navigation.<slug>Desc`. Number placeholders use ICU: `"line": "{volume} L × {x} = {y}"`. Keep keys identical across files (verify with §10).

---

## 6. Step 4 — Hook

Shared-value tool (reuses volume/CYA/FC/CC across tools):

```ts
// src/hooks/use-<slug>.ts
import { useToolState, SharedMapping } from './use-tool-state';
import { TOOL_KEYS, SHARED_KEYS } from '@/lib/shared-state';

export interface MyState { /* … */ }
export const DEFAULT_MY_STATE: MyState = { /* … */ };

const MAPPINGS: SharedMapping<MyState>[] = [
  { sharedKey: SHARED_KEYS.poolVolume, has: s => s.volume != null,
    get: s => s.volume ?? undefined, embed: (s, v) => ({ ...s, volume: v as MyState['volume'] }) },
];

export function useMyTool() {
  const { state, setState, reset, isHydrated } = useToolState(TOOL_KEYS.<slug>, DEFAULT_MY_STATE, MAPPINGS);
  // optional: debounced fetch to /api/v1/calculate/<slug> (see use-shock-calculator.ts)
  return { state, setState, reset, isHydrated };
}
```

Add the new key to `TOOL_KEYS` (and `SHARED_KEYS` if you introduce a new shared concept) in `src/lib/shared-state.ts`. Standalone tool with no shared values → use `useLocalStorage` directly (see `use-chlorine-comparison.ts`).

---

## 7. Step 5 — Components

- Page is `'use client'`; leaf components inherit the client boundary (no directive needed unless they use hooks/handlers — then add `'use client'`).
- Reuse `src/components/tools/shock/shared/` where possible (`StepCard`, `NumberInput`, `DontKnowToggle`, `ReassureNote`).
- Every string via `useTranslations('Tools.<Name>.…')`.
- Numbers via `new Intl.NumberFormat(useLocale(), { maximumFractionDigits: n })`.

---

## 8. Step 6 — Page

```tsx
// src/app/[locale]/tools/<slug>/page.tsx
'use client';
import { useTranslations } from 'next-intl';
import { useMyTool } from '@/hooks/use-<slug>';
// import step components…

export default function MyToolPage() {
  const t = useTranslations('Tools.<Name>');
  const { state, setState, reset } = useMyTool();
  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
      <div className="mb-8 space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t('title')}</h1>
        <p className="text-lg text-muted-foreground">{t('description')}</p>
      </div>
      {/* steps / cards wired to state + setState */}
    </div>
  );
}
```

---

## 9. Step 7 — Navigation

```ts
// src/config/nav-items.ts — inside tools.children
{ href: '/tools/<slug>', labelKey: '<slug>', descriptionKey: '<slug>Desc', icon: SomeLucideIcon }
```

Prefer an `icon` (renders in nav + FeaturesGrid). Only set `image` if the asset actually exists in `public/images/` (a missing one shows a broken background on the home FeaturesGrid).

---

## 10. Step 8 — Verify (no dev/build server!)

```bash
# Type-check the whole project (also catches breakage in existing tools)
npx tsc --noEmit 2>&1 | grep -c "error TS"          # expect 0

# Lint only your new files (the repo has some pre-existing lint debt — don't touch it)
npx eslint src/lib/calculator src/hooks/use-<slug>.ts \
  src/components/tools/<slug> "src/app/[locale]/tools/<slug>" src/app/api/v1/calculate/<slug>

# i18n key parity EN vs IT
node -e 'const en=require("./src/messages/en.json"),it=require("./src/messages/it.json");
const k=(o,p="")=>Object.entries(o).flatMap(([x,v])=>v&&typeof v=="object"&&!Array.isArray(v)?k(v,p+x+"."):[p+x]);
const E=new Set(k(en)),I=new Set(k(it));const a=[...E].filter(x=>!I.has(x)),b=[...I].filter(x=>!E.has(x));
console.log(a.length||b.length?{missingInIt:a,missingInEn:b}:"PARITY OK");'

# Every t('…') key used in components actually exists (next-intl throws on missing keys)
node -e 'const fs=require("fs"),en=require("./src/messages/en.json");
const g=(o,p)=>p.split(".").reduce((x,k)=>x&&typeof x=="object"?x[k]:undefined,o);
const fs2=require("child_process").execSync("find src/components/tools/<slug> \"src/app/[locale]/tools/<slug>\" -name \"*.tsx\"").toString().trim().split("\n");
let miss=[];for(const f of fs2){const s=fs.readFileSync(f,"utf8");const m=s.match(/useTranslations\((["\x27])([^"\x27]+)\1\)/);if(!m)continue;for(const c of s.matchAll(/\bt\((["\x27])([^"\x27]+)\1/g))if(g(en,m[2]+"."+c[2])===undefined)miss.push(f+": "+m[2]+"."+c[2]);}
console.log(miss.length?miss:"KEYS OK");'
```

Optionally compile + run a pure function against worked examples (`npx tsc src/lib/calculator/*.ts --outDir /tmp/x --module commonjs --target es2020 --moduleResolution node --skipLibCheck --esModuleInterop`, then `node`).

---

## 11. Final checklist

- [ ] Pure function in `src/lib/calculator/`, constants cited, re-exported in `index.ts`.
- [ ] API route under `api/v1/calculate/<slug>/`.
- [ ] `Tools.<Name>` + `Navigation.<slug>` keys in **both** `en.json` and `it.json` (parity OK).
- [ ] Hook (`useToolState` for shared values, else `useLocalStorage`); new `TOOL_KEYS`/`SHARED_KEYS` entry if needed.
- [ ] Components reuse Shadcn + shock shared parts; no hardcoded strings; numbers via `Intl.NumberFormat(locale)`.
- [ ] `'use client'` page wiring hook ↔ components.
- [ ] Nav entry with a lucide `icon`.
- [ ] No theme-inverting emphasis boxes; works in dark + mobile.
- [ ] Reset is a full wipe, styled red.
- [ ] `tsc` 0 errors; `eslint` clean on new files; i18n parity + key-existence pass.
- [ ] `ARCHITECTURE.md` + relevant `AGENTS.md` updated; WIP archived to `changelog/` when done.
