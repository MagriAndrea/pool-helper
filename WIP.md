# Work In Progress: Testo Guide & Scrolling Page UI

## 1. Initial State
The project currently has a "tools-first" homepage (`src/app/[locale]/page.tsx`) with an `Hero` and a `FeaturesGrid`. The user provided a raw markdown file (`testo.md`) containing comprehensive pool maintenance guides (chemistry, cleaning, actions). The user wants to integrate this text into the site, but not immediately, as the text needs refinement.

## 2. Objective
- **Architecture**: Create a single, long-scrolling guide page structure.
- **Separation of Concerns**: The theoretical guide must be completely separated from the practical calculators (tools). A user should be able to use a tool without reading the history/theory.
- **Navigation**: The navbar links should use anchor tags (`#chimica`, `#pulizia`) to smoothly scroll down to the respective sections on the page, rather than navigating to entirely new pages.
- **Text Translation Strategy**: The actual implementation of `testo.md` is paused. The immediate goal is to build the visual scaffolding (UI/Layout) for this scrolling page using placeholder text (Lorem Ipsum), so it's ready when the user finalizes the content.
- **Agent Hand-off**: Establish a robust `WIP.md` tracking system.

## 3. Target Files
- `AGENTS.md` (Update WIP rules)
- `src/app/[locale]/page.tsx` (Add the new guide section below tools)
- `src/components/...` (Create new layout components for sticky nav/sidebar if needed)
- `src/i18n/...` or `src/config/...` (Update navigation links)

## 4. Current Situation & Checklist
✅ Discussed and agreed upon the architectural approach (Single page, anchor scrolling, separate theory/tools).
✅ Updated `AGENTS.md` to enforce detailed `WIP.md` tracking (Handoff document style).
✅ Created `changelog/` directory.
❌ Build the visual scaffolding (scrolling layout) in `page.tsx` using placeholder text.
❌ Update Navbar to support anchor link scrolling.
❌ Review the scaffolding with the user.

## 5. Success Criteria
- The homepage has a distinct section below the tools for the guide.
- Clicking a link in the navigation smoothly scrolls to the correct section.
- The `WIP.md` rule is strictly defined in `AGENTS.md`.
