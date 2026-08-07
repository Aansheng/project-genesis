# ADR-0148: Observatory Diff Viewer Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-006  
**Architecture Version:** v1.34 → v1.35

---

## Context

WO-S6-001 delivered the Observatory Shell, WO-S6-002 the Overview Dashboard, WO-S6-003 the Trace Viewer, WO-S6-004 the Timeline Viewer, and WO-S6-005 the History Viewer. Of the 7 sidebar panels, Overview, Trace, Timeline, History, and Diff panels now need real content — the Diff panel still rendered the "Coming Soon" placeholder grid.

This work order implements the **Diff Viewer**: a two-column, developer-tool layout that lists mock prompt-assembly diffs and displays the selected diff's added / removed / changed entity lists. It follows the exact master-detail pattern established by the Trace Viewer (WO-S6-003), Timeline Viewer (WO-S6-004), and History Viewer (WO-S6-005), giving the Observatory a consistently structured fourth observability viewer.

### Problem

1. **No diff viewer** — the Diff panel was the same placeholder as the remaining panels
2. **No per-diff detail surface** — added/removed/changed lists need a structured, typed detail view
3. **No reusable change card** — each diff line needs a consistent visual container with kind indicators

### Scope Boundaries (Explicitly NOT in this work order)

- No Runtime changes
- No Planner changes
- No Pipeline changes
- No PromptBuilder changes
- No AI package changes
- No Strategy package changes
- No Metadata generation changes
- No store schema changes (selection is local component state)
- No real data wiring — diff data is hardcoded mock
- No new dependencies (no external UI libraries, no Tailwind)

---

## Decision

### Component Hierarchy

```
apps/web/src/components/observatory/diff/
├── ObservatoryDiffViewer.vue   — root, owns mock diff data + selectedId state
├── DiffList.vue                — selectable diff rows (nav + ul + buttons)
├── DiffDetails.vue             — header + Added / Removed / Changed sections
└── DiffChangeCard.vue          — reusable change card (article + header + h3 + kind marker)
```

### Root Viewer

`ObservatoryDiffViewer.vue` holds a local `MOCK_DIFFS` array (3 diffs: `diff-001` 12:00:01 adds Tavern/Villager-1/Villager-2 and changes VillageCenter, `diff-002` 12:05:00 adds Farm-1/Farm-2, `diff-003` 12:08:00 adds Guard-1/Guard-2, removes OldRoad, changes VillageGate) and a `selectedId` ref defaulting to the first diff. It composes:

```vue
<DiffList :entries="MOCK_DIFFS" :selected-id="selectedId" @select="selectDiff" />
<DiffDetails :entry="selectedDiff" />
```

Selection state is intentionally local (`ref`) — the constraint "no store schema changes" keeps panel state out of the Pinia store.

### Diff List

`DiffList.vue` renders a two-column list inside a `nav[aria-label="Diff list"]`:

- Semantic markup: `nav` → `h2` → `ul` → `li` → `button.diff-row`
- Each row shows `id` (monospace) and `timestamp` (dim, mono)
- Active row via `.diff-row--active` (accent-tinted background + border) plus `aria-current="true"`
- Hover state on `.diff-row:hover`
- Keyboard navigation: ArrowUp / ArrowDown / Home / End handled on the `nav` container, moving the active row and focusing the newly selected button (same pattern as the Trace, Timeline, and History viewers)
- `@select` emits the diff id upward

### Diff Details

`DiffDetails.vue` renders the selected diff in `.diff-details` (article, `aria-label="Diff details"`):

1. **Header** — `Diff Details` heading (h2) plus a `dl.diff-meta-grid` with Diff ID and Timestamp (monospace values)
2. **Added** — a `section[aria-labelledby="diff-added-title"]` with an h3 heading and a `ul.diff-added-list` of `DiffChangeCard`s (`kind="added"`)
3. **Removed** — a `section[aria-labelledby="diff-removed-title"]` with an h3 heading and a `ul.diff-removed-list` of `DiffChangeCard`s (`kind="removed"`)
4. **Changed** — a `section[aria-labelledby="diff-changed-title"]` with an h3 heading and a `ul.diff-changed-list` of `DiffChangeCard`s (`kind="changed"`)

Each section supports an empty state (`v-if` list length): "No additions" / "No removals" / "No changes" rendered as a paragraph. An overall empty state (`entry == null`) renders `No diff selected`.

### Diff Change Card

`DiffChangeCard.vue` is a reusable card receiving `kind: 'added' | 'removed' | 'changed'` and `name` props:

- `article.diff-change-card[aria-labelledby]` with a kind modifier class (`diff-change-card--added/--removed/--changed`)
- `header.diff-change-card-header` containing a marker span and the entity name (h3)
- Visual indicators: `+` green (added, `--obs-success`), `-` muted red (removed, `--obs-danger` fallback), `•` indigo (changed, `--obs-accent`)
- Heading id: `diff-change-<kind>-<name>` (slugified) — e.g. `diff-change-added-tavern`, `diff-change-removed-old-road`

### Content Integration

`ObservatoryContent.vue` now has six branches:

```vue
<ObservatoryOverview v-if="isOverview()" />
<ObservatoryTraceViewer v-else-if="isTrace()" />
<ObservatoryTimelineViewer v-else-if="isTimeline()" />
<ObservatoryHistoryViewer v-else-if="isHistory()" />
<ObservatoryDiffViewer v-else-if="isDiff()" />
<div v-else class="content-grid"> <!-- placeholder cards --> </div>
```

The placeholder grid is preserved for Runtime (and Settings renders no content).

### Styling

Dark theme, developer-tool aesthetic — identical visual system to the Trace, Timeline, and History viewers: near-black surfaces, 1px subtle borders, monospace numerics, indigo accent for the active row, green `+` for additions, muted red `-` for removals, indigo `•` for changes; no bright colors, no oversized rounded cards. All values use `var(--obs-*)` shell tokens (with fallbacks) — no inline styles, no magic numbers. Two-column grid: `grid-template-columns: 300px minmax(0, 1fr)`.

---

## Consequences

### Positive

1. **Fourth observability viewer** — the Diff panel now shows real structured content
2. **Pattern parity with Trace/Timeline/History viewers** — all four viewers share the same layout, semantics, styling, and keyboard behavior
3. **Reusable change card** — `DiffChangeCard` services all three sections and can be reused by future viewers (e.g., Runtime Graph)
4. **Backward compatible** — placeholder grid preserved for Runtime; Settings untouched
5. **No new dependencies** — same Vue 3 + Pinia stack, local state only
6. **Accessibility-first** — semantic nav/article/dl/section/ul markup, keyboard navigation, `aria-current`, `aria-labelledby` links, typed kind indicators, no div-as-button
7. **Tested** — 120 new tests; TypeScript 0 errors; ESLint 0 errors

### Negative

None.

### Risks

None — additive UI. The only existing-file change is the additive `v-else-if` branch in `ObservatoryContent.vue`; existing tests re-pointed their placeholder-grid hosts from Diff to Runtime.

---

## Compliance

- **TypeScript 0 errors** — verified (`vue-tsc --noEmit`)
- **ESLint 0 errors** — verified
- **Tests pass** — 604 tests across 7 files in `apps/web` (120 diff + 106 shell + 103 history + 99 trace + 99 timeline + 62 overview + 15 streaming); 8200 across the monorepo
- **Diff panel renders the viewer** — verified (store `selectedPanel === 'Diff'`)
- **Non-Overview/Trace/Timeline/History/Diff panels unchanged** — verified (placeholder grid still renders for Runtime)
- **Mock data only** — verified (no Runtime/Planner/Pipeline/PromptBuilder/AI/Strategy imports)
- **No store changes** — verified (selection is local `ref`)
- **Architecture version** v1.34 → v1.35

---

## Completion Condition

The Diff Viewer is the fourth observability viewer in the Observatory Shell. Future Sprint 6 work orders will implement the Runtime Graph using the same master-detail pattern, and will replace mock diff data with real `metadata.promptAssembly.diff` consumption.