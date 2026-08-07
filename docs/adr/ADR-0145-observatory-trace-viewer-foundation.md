# ADR-0145: Observatory Trace Viewer Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-003  
**Architecture Version:** v1.31 → v1.32

---

## Context

WO-S6-001 delivered the Observatory Shell and WO-S6-002 delivered the Overview Dashboard. Of the 7 sidebar panels, only the Overview panel had real content — the remaining panels (including **Trace**) still rendered the "Coming Soon" placeholder grid.

This work order implements the first real observability viewer: the **Trace Viewer**. It replaces the Trace placeholder with a two-column, developer-tool layout that lists mock prompt-assembly traces and displays the selected trace's plan, snapshot, and metadata. The viewer establishes the component pattern that future viewers (Timeline, History, Diff, Runtime) will follow.

### Problem

1. **No observability viewer exists** — the Trace panel was the same placeholder as every other panel
2. **No detail-view pattern** — no precedent for a master-detail layout inside the shell
3. **No reusable detail card** — Plan / Snapshot / Metadata sections need a common visual container

### Scope Boundaries (Explicitly NOT in this work order)

- No Runtime integration
- No Planner integration
- No Pipeline integration
- No PromptBuilder integration
- No AI package changes
- No store schema changes (selection is local component state, not Pinia)
- No real data wiring — trace data is hardcoded mock
- No new dependencies (no external UI libraries)

---

## Decision

### Component Hierarchy

```
apps/web/src/components/observatory/trace/
├── ObservatoryTraceViewer.vue   — root, owns mock trace data + selectedId state
├── TraceList.vue                — selectable trace rows (nav + ul + buttons)
├── TraceDetails.vue             — header + Plan + Snapshot + Metadata sections
└── TraceStepCard.vue            — reusable titled card (used by Plan/Snapshot/Metadata)
```

### Root Viewer

`ObservatoryTraceViewer.vue` holds a local `MOCK_TRACES` array (3 traces: `trace-1`/`create`, `trace-2`/`modify`, `trace-3`/`query`) and a `selectedId` ref defaulting to the first trace. It composes:

```vue
<TraceList :traces="MOCK_TRACES" :selected-id="selectedId" @select="selectTrace" />
<TraceDetails :trace="selectedTrace" />
```

Selection state is intentionally local (`ref`) — the constraint "no store schema changes" keeps panel state out of the Pinia store.

### Trace List

`TraceList.vue` renders a two-column list inside a `nav[aria-label="Trace list"]`:

- Semantic markup: `nav` → `h2` → `ul` → `li` → `button.trace-row`
- Each row shows `strategy` (600 weight), `id` (monospace), `timestamp` (monospace)
- Active row via `.trace-row--active` (accent-tinted background + border) plus `aria-current="true"`
- Hover state on `.trace-row:hover`
- Keyboard navigation: ArrowUp / ArrowDown / Home / End handled on the `nav` container, moving the active row and focusing the newly selected button (same pattern as the sidebar)
- `@select` emits the trace id upward

### Trace Details

`TraceDetails.vue` renders the selected trace in `.trace-details` (article, `aria-label="Trace details"`):

1. **Header** — `Trace Details` heading plus a `dl.trace-meta-grid` with Trace ID and Strategy (monospace values)
2. **Plan** — a `<pre>` block (monospace, dark background, keyboard reachable via `tabindex="0"`)
3. **Snapshot** — a `dl.trace-snapshot-grid` key/value grid (auto-fill columns, monospace values)
4. **Metadata** — a `<pre>` block showing `JSON.stringify(metadata, null, 2)` (keyboard reachable)

Each of Plan / Snapshot / Metadata is wrapped in `TraceStepCard`. An empty state (`trace == null`) renders `No trace selected`.

### Trace Step Card

`TraceStepCard.vue` is a reusable titled card with a slot:

- `section.trace-step-card[aria-labelledby]` → `h3#trace-step-<title>` heading
- Header strip (uppercase title) + `.trace-step-card-body` slot
- Used for Plan, Snapshot, and Metadata

### Content Integration

`ObservatoryContent.vue` now has three branches:

```vue
<ObservatoryOverview v-if="isOverview()" />
<ObservatoryTraceViewer v-else-if="isTrace()" />
<div v-else class="content-grid"> <!-- placeholder cards --> </div>
```

The placeholder grid is preserved for Timeline, History, Diff, and Runtime.

### Styling

Dark theme, developer-tool aesthetic (Chrome DevTools / Raycast Inspector / Linear Debug View): near-black surfaces, 1px subtle borders, small monospace numerics, indigo accent for the active row, no bright colors, no oversized rounded cards. All values use `var(--obs-*)` shell tokens (with fallbacks) — no inline styles, no magic numbers. The right panel's detail blocks use a flat dark background (`--obs-bg`) for the DevTools pre-block feel.

---

## Consequences

### Positive

1. **First observability viewer** — the Trace panel now shows real structured content
2. **Master-detail pattern established** — reusable for Timeline / History / Diff viewers
3. **Reusable card component** — `TraceStepCard` serves all future detail sections
4. **Backward compatible** — placeholder grid preserved for all non-Overview, non-Trace panels
5. **No new dependencies** — same Vue 3 + Pinia stack, local state only
6. **Accessibility-first** — semantic nav/article/dl markup, keyboard navigation, `aria-current`, keyboard-reachable pre blocks
7. **Tested** — 99 new tests; TypeScript 0 errors; ESLint 0 errors

### Negative

None.

### Risks

None — additive UI. The only existing-file change is the additive `v-else-if` branch in `ObservatoryContent.vue`.

---

## Compliance

- **TypeScript 0 errors** — verified (`vue-tsc --noEmit`)
- **ESLint 0 errors** — verified
- **Tests pass** — 245 tests across 4 files in `apps/web` (99 + 69 + 62 + 15)
- **Trace panel renders the viewer** — verified (store `selectedPanel === 'Trace'`)
- **Non-Trace/Non-Overview panels unchanged** — verified (placeholder grid still renders)
- **Mock data only** — verified (no Runtime/Planner/Pipeline/PromptBuilder imports)
- **No store changes** — verified (selection is local `ref`)
- **Architecture version** v1.31 → v1.32

---

## Completion Condition

The Trace Viewer is the first observability viewer in the Observatory Shell. Future Sprint 6 work orders will implement the Timeline, History, Diff, and Runtime viewers using the same master-detail pattern, and will replace mock trace data with real `metadata.promptAssembly.trace` consumption.