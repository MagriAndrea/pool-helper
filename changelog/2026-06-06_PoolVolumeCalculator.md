# WIP — Pool Volume Calculator

> **Status**: ✅ DONE — implemented & statically verified (lib + API pre-existed; this was a UI-only slice). Browser QA recommended on the PR preview.
> **Owner**: Andrea + Claude.
> **Created**: 2026-06-06.
> **Build recipe**: follow the project skill **`.claude/skills/add-pool-tool`** (file-by-file: lib → API → i18n → hook → components → page → nav → docs + the verification commands). This WIP only records the *decisions* and *what already exists*; the skill is the *how*.

---

## 1. Initial State

The Shock Calculator (`/tools/shock`) needs a pool water volume. Step 1 of that tool already has a **"Calculate volume" button that opens an empty shell modal** (`src/components/tools/shock/VolumeModal.tsx`) — this tool fills that shell and also ships as a standalone tool.

Crucially, **the computation layer already exists** (built during the shock project):
- `src/lib/calculator/pool-volume.ts` → `computePoolVolume(shape, dims)` returns `{ volumeL, volumeM3, volumeGal }`. Supports `rectangle` and `circle`, **uniform depth**, length in `m` or `ft`.
- `src/app/api/v1/calculate/pool-volume/route.ts` → POST wrapper, already live.
- `TOOL_KEYS.volume = 'ph_tool_volume'` and `SHARED_KEYS.poolVolume = 'ph_pool_volume'` already reserved in `src/lib/shared-state.ts`.

So this WIP is **almost entirely UI + integration**; no new lib math is required.

## 2. Objective

Ship a **Pool Volume Calculator** that:
- Computes pool water volume from shape + dimensions (rectangle / circle, single uniform depth).
- Is a **standalone tool** at `/[locale]/tools/pool-volume` AND the **same component reused inside the shock `VolumeModal`** (tools are agnostic to where they're called — Andrea's principle).
- Writes the result to the shared `ph_pool_volume` key so the Shock tool (and future tools) reuse it automatically. From inside the shock modal, "Apply" also sets the shock Step-1 volume field directly and closes the modal.
- Follows all golden rules in the `add-pool-tool` skill (EN/IT i18n, dark/mobile, transparent calc, localStorage, reset = full wipe, `Intl.NumberFormat` numbers).

### Decisions (frozen)
| # | Area | Decision |
|---|------|----------|
| 1 | Shapes | **Rectangle + Circle only** (no freeform). |
| 2 | Depth | **Single uniform depth** (one field). `computePoolVolume` already supports this — no lib change. |
| 3 | Length unit | Toggle **m / ft** (default by locale: IT → m, EN → ft). Output shown in **L** primarily, with **m³** and **US gal** secondary. |
| 4 | Architecture | **Standalone page + reusable `PoolVolumeCalculator` component** embedded in the shock modal. |
| 5 | Apply behaviour | Standalone: persist to `ph_pool_volume` (via `useToolState`). Modal: `onApply(volumeL)` → updates shock volume field (`{ value: liters, unit: 'L' }`) + closes modal; the shock state mapping then mirrors it to the shared key. |
| 6 | Reset | Full wipe (tool key + shared `ph_pool_volume`), red button — same as shock. |

### Non-goals
- Variable/sloped depth, oval/kidney shapes (can be a future iteration).
- Editing the existing `computePoolVolume` signature.

## 3. Target Files

```
[MOD] src/lib/shared-state.ts                         # (already has volume keys — verify only)
[NEW] src/hooks/use-pool-volume.ts                    # useToolState(ph_tool_volume, …, [poolVolume mapping]) + debounced POST
[NEW] src/components/tools/pool-volume/PoolVolumeCalculator.tsx  # the reusable core (shape toggle + dims + result). Optional onApply prop.
[NEW] src/components/tools/pool-volume/ShapePicker.tsx          # rectangle/circle segmented (or reuse a shared toggle)
[NEW] src/app/[locale]/tools/pool-volume/page.tsx     # 'use client' standalone page
[MOD] src/components/tools/shock/VolumeModal.tsx      # replace placeholder with <PoolVolumeCalculator onApply=… />
[MOD] src/app/[locale]/tools/shock/page.tsx           # pass onApply to the modal → setState({ volume: { value, unit:'L' } })
[MOD] src/messages/en.json + it.json                  # Tools.PoolVolume namespace + Navigation.poolVolume(+Desc)
[MOD] src/config/nav-items.ts                          # add /tools/pool-volume entry (icon: Ruler)
[MOD] ARCHITECTURE.md                                  # note the second tool + modal reuse pattern
[MOD] src/components/tools/AGENTS.md (if present) / src/app AGENTS.md  # as needed
```

Reuse `src/components/tools/shock/shared/NumberInput.tsx` and `StepCard.tsx` (consider promoting them to a neutral `components/tools/shared/` if a second consumer makes that cleaner).

## 4. Current Situation & Checklist

- [x] Lib `computePoolVolume` (rectangle/circle, uniform depth, m/ft → L/m³/gal) — **done in shock project**.
- [x] API `POST /api/v1/calculate/pool-volume` — **done**.
- [x] `TOOL_KEYS.volume` + `SHARED_KEYS.poolVolume` reserved — **done**.
- [ ] `use-pool-volume.ts` hook (state: shape, length unit, dims; mapped to `ph_pool_volume`; debounced fetch).
- [ ] `PoolVolumeCalculator.tsx` reusable component (+ optional `onApply`).
- [ ] Standalone page `/tools/pool-volume`.
- [ ] Fill `VolumeModal` with `PoolVolumeCalculator` + wire `onApply` in the shock page.
- [ ] i18n `Tools.PoolVolume` + `Navigation.poolVolume` in en.json & it.json (parity).
- [ ] Nav entry in `nav-items.ts` (icon `Ruler`).
- [ ] Docs (ARCHITECTURE + AGENTS.md) updated.
- [ ] Verify per skill §10 (tsc 0, eslint clean, i18n parity + key-existence).

## 5. Success Criteria

1. ✅ `/it/tools/pool-volume` and `/en/tools/pool-volume` reachable from the menu.
2. ✅ Rectangle and circle each compute correct volume (e.g. 8×4×1.5 m = 48,000 L = 48 m³ ≈ 12,680 gal — matches the lib test).
3. ✅ m/ft toggle converts/recomputes; output shows L + m³ + gal.
4. ✅ In the shock tool, "Calculate volume" opens the SAME calculator; "Apply" fills Step-1 volume and closes the modal.
5. ✅ Computed volume persists to `ph_pool_volume`; reopening the shock tool pre-fills the volume.
6. ✅ Reset is a full wipe (clears `ph_tool_volume` + `ph_pool_volume`), red button.
7. ✅ EN/IT parity; no hardcoded strings; dark + mobile correct; numbers locale-formatted.
8. ✅ `tsc` 0 errors; `eslint` clean on new files.
9. ✅ This WIP archived to `changelog/` when done; ARCHITECTURE/AGENTS updated.

---

*Built per `.claude/skills/add-pool-tool`. Because the lib + API already exist, expect this to be a UI-only slice.*
