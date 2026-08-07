# ADR-0146: Observatory Timeline Viewer Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-004  
**Architecture Version:** v1.32 → v1.33

---

## Context

WO-S6-001 delivered the Observatory Shell, WO-S6-002 the Overview Dashboard, and WO-S6-003 the Trace Viewer. Of the 7 sidebar panels, Overview, Trace, and Timeline panels now need real content — the Timeline panel still rendered the "Coming Soon" placeholder grid.

This work order implements the **Timeline Viewer**: a two-column, developer-tool layout that lists mock prompt-assembly timelines and displays the selected timeline's entries. It follows the exact master-detail pattern established by the Trace Viewer (WO-S6-003), giving the Observatory a consistently structured second observability viewer.

### Problem

1. **No timeline viewer** — the Timeline panel was the same placeholder as every other remaining panel
2. **No per-timeline detail surface** — timeline entries need a scrollable, indexed list UI
3. **No reusable entry card** — each timeline entry needs a consistent visual container

### Scope Boundaries (Explicitly NOT in this work order)

- No Runtime changes
- No Planner changes
- No Pipeline changes
- No PromptBuilder changes
- No AI package changes
- No Strategy package changes
- No Metadata generation changes
- No store schema changes (selection is local component state)
- No real data wiring — timeline data is hardcoded mock
- No new dependencies (no external UI libraries, no Tailwind)

---

## Decision

### Component Hierarchy

```
apps/web/src/components/observatory/timeline/
├── ObservatoryTimelineViewer.vue   — root, owns mock timeline data + selectedId state
├── TimelineList.vue                — selectable timeline rows (nav + ul + buttons)
├── TimelineDetails.vue             — header + Timeline Entries section
└── TimelineEntryCard.vue           — reusable entry card (article + header + h3)
```

### Root Viewer

`ObservatoryTimelineViewer.vue` holds a local `MOCK_TIMELINES` array (3 timelines: `timeline-001` with 12 entries, `timeline-002` with 8 entries, `timeline-003` with 4 entries) and a `selectedId` ref defaulting to the first timeline. It composes:

```vue
<TimelineList :timelines="MOCK_TIMELINES" :selected-id="selectedId" @select="selectTimeline" />
<TimelineDetails :timeline="selectedTimeline" />
```

Selection state is intentionally local (`ref`) — the constraint "no store schema changes" keeps panel state out of the Pinia store.

### Timeline List

`TimelineList.vue` renders a two-column list inside a `nav[aria-label="Timeline list"]`:

- Semantic markup: `nav` → `h2` → `ul` → `li` → `button.timeline-row`
- Each row shows `id` (monospace) and `entryCount` ("12 entries")
- Active row via `.timeline-row--active` (accent-tinted background + border) plus `aria-current="true"`
- Hover state on `.timeline-row:hover`
- Keyboard navigation: ArrowUp / ArrowDown / Home / End handled on the `nav` container, moving the active row and focusing the newly selected button (same pattern as the Trace Viewer)
- `@select` emits the timeline id upward

### Timeline Details

`TimelineDetails.vue` renders the selected timeline in `.timeline-details` (article, `aria-label="Timeline details"`):

1. **Header** — `Timeline Details` heading (h2) plus a `dl.timeline-meta-grid` with Timeline ID and Entry Count (monospace values)
2. **Timeline Entries** — a `section[aria-labelledby="timeline-entries-title"]` with an h3 heading, then a `ul.timeline-entries-list` of `TimelineEntryCard`s (one per entry)

An empty state (`timeline == null`) renders `No timeline selected`.

### Timeline Entry Card

`TimelineEntryCard.vue` is a reusable card receiving `index` and `strategy` props:

- `article.timeline-entry-card[aria-labelledby]` → `h3#timeline-entry-<index>`
- `header.timeline-entry-card-header` containing the h3 (`#0` monospace, accent) and the strategy name
- Used once per entry in the Timeline Entries list

### Content Integration

`ObservatoryContent.vue` now has four branches:

```vue
<ObservatoryOverview v-if="isOverview()" />
<ObservatoryTraceViewer v-else-if="isTrace()" />
<ObservatoryTimelineViewer v-else-if="isTimeline()" />
<div v-else class="content-grid"> <!-- placeholder cards --> </div>
```

The placeholder grid is preserved for History, Diff, and Runtime.

### Styling

Dark theme, developer-tool aesthetic — identical visual system to the Trace Viewer: near-black surfaces, 1px subtle borders, monospace numerics, indigo accent for the active row, no bright colors, no oversized rounded cards. All values use `var(--obs-*)` shell tokens (with fallbacks) — no inline styles, no magic numbers. Two-column grid: `grid-template-columns: 300px minmax(0, 1fr)`.

---

## Consequences

### Positive

1. **Second observability viewer** — the Timeline panel now shows real structured content
2. **Pattern parity with Trace Viewer** — both viewers share the same layout, semantics, styling, and keyboard behavior
3. **Reusable entry card** — `TimelineEntryCard` serves every entry and can be reused by future viewers
4. **Backward compatible** — placeholder grid preserved for History, Diff, and Runtime
5. **No new dependencies** — same Vue 3 + Pinia stack, local state only
6. **Accessibility-first** — semantic nav/article/dl/ul markup, keyboard navigation, `aria-current`, `aria-labelledby` links, no div-as-button
7. **Tested** — 99 new tests; TypeScript 0 errors; ESLint 0 errors

### Negative

None.

### Risks

None — additive UI. The only existing-file change is the additive `v-else-if` branch in `ObservatoryContent.vue`.

---

## Compliance

- **TypeScript 0 errors** — verified (`vue-tsc --noEmit`)
- **ESLint 0 errors** — verified
- **Tests pass** — 355 tests across 5 files in `apps/web` (99 timeline + 99 trace + 80 shell + 62 overview + 15 streaming)
- **Timeline panel renders the viewer** — verified (store `selectedPanel === 'Timeline'`)
- **Non-Overview/Trace/Timeline panels unchanged** — verified (placeholder grid still renders)
- **Mock data only** — verified (no Runtime/Planner/Pipeline/PromptBuilder/AI/Strategy imports)
- **No store changes** — verified (selection is local `ref`)
- **Architecture version** v1.32 → v1.33

---

## Completion Condition

The Timeline Viewer is the second observability viewer in the Observatory Shell. Future Sprint 6 work orders will implement the History, Diff, and Runtime viewers using the same master-detail pattern, and will replace mock timeline data with real `metadata.promptAssembly.timeline` consumption.