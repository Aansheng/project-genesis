# ADR-0147: Observatory History Viewer Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-005  
**Architecture Version:** v1.33 → v1.34

---

## Context

WO-S6-001 delivered the Observatory Shell, WO-S6-002 the Overview Dashboard, WO-S6-003 the Trace Viewer, and WO-S6-004 the Timeline Viewer. Of the 7 sidebar panels, Overview, Trace, Timeline, and History panels now need real content — the History panel still rendered the "Coming Soon" placeholder grid.

This work order implements the **History Viewer**: a two-column, developer-tool layout that lists mock prompt-assembly history builds and displays the selected build's prompt, result, and evolution. It follows the exact master-detail pattern established by the Trace Viewer (WO-S6-003) and Timeline Viewer (WO-S6-004), giving the Observatory a consistently structured third observability viewer.

### Problem

1. **No history viewer** — the History panel was the same placeholder as every other remaining panel
2. **No per-build detail surface** — prompt, result, and evolution need a structured, readable detail view
3. **No reusable evolution card** — each evolution addition needs a consistent visual container

### Scope Boundaries (Explicitly NOT in this work order)

- No Runtime changes
- No Planner changes
- No Pipeline changes
- No PromptBuilder changes
- No AI package changes
- No Strategy package changes
- No Metadata generation changes
- No store schema changes (selection is local component state)
- No real data wiring — history data is hardcoded mock
- No new dependencies (no external UI libraries, no Tailwind)

---

## Decision

### Component Hierarchy

```
apps/web/src/components/observatory/history/
├── ObservatoryHistoryViewer.vue   — root, owns mock history data + selectedId state
├── HistoryList.vue                — selectable history rows (nav + ul + buttons)
├── HistoryDetails.vue             — header + Prompt / Result / Evolution sections
└── HistoryEntryCard.vue           — reusable evolution entry card (article + header + h3)
```

### Root Viewer

`ObservatoryHistoryViewer.vue` holds a local `MOCK_HISTORY` array (3 builds: `history-001` Create Village, `history-002` Add Farm, `history-003` Add Guards — each with id, prompt, timestamp, result, evolution array) and a `selectedId` ref defaulting to the first build. It composes:

```vue
<HistoryList :entries="MOCK_HISTORY" :selected-id="selectedId" @select="selectHistory" />
<HistoryDetails :entry="selectedHistory" />
```

Selection state is intentionally local (`ref`) — the constraint "no store schema changes" keeps panel state out of the Pinia store.

### History List

`HistoryList.vue` renders a two-column list inside a `nav[aria-label="History list"]`:

- Semantic markup: `nav` → `h2` → `ul` → `li` → `button.history-row`
- Each row shows `id` (monospace) and `timestamp` (dim, mono)
- Active row via `.history-row--active` (accent-tinted background + border) plus `aria-current="true"`
- Hover state on `.history-row:hover`
- Keyboard navigation: ArrowUp / ArrowDown / Home / End handled on the `nav` container, moving the active row and focusing the newly selected button (same pattern as the Trace and Timeline viewers)
- `@select` emits the history id upward

### History Details

`HistoryDetails.vue` renders the selected build in `.history-details` (article, `aria-label="History details"`):

1. **Header** — `History Details` heading (h2) plus a `dl.history-meta-grid` with History ID and Timestamp (monospace values)
2. **Prompt** — a `section[aria-labelledby="history-prompt-title"]` with an h3 heading and a `<pre class="history-prompt-block">` (keyboard reachable via `tabindex="0"`, same affordance as the Trace viewer's Plan block)
3. **Result** — a `section[aria-labelledby="history-result-title"]` with an h3 heading and a mono result paragraph
4. **Evolution** — a `section[aria-labelledby="history-evolution-title"]` with an h3 heading and a `ul.history-evolution-list` of `HistoryEntryCard`s (one per added entity)

An empty state (`entry == null`) renders `No history entry selected`.

### History Entry Card

`HistoryEntryCard.vue` is a reusable card receiving a `name` prop (the added entity):

- `article.history-entry-card[aria-labelledby]` → `h3#history-entry-<name>` (slugified)
- `header.history-entry-card-header` containing a `+` add-marker (mono, success green) and the entity name
- Used once per evolution item in the Evolution list

### Content Integration

`ObservatoryContent.vue` now has five branches:

```vue
<ObservatoryOverview v-if="isOverview()" />
<ObservatoryTraceViewer v-else-if="isTrace()" />
<ObservatoryTimelineViewer v-else-if="isTimeline()" />
<ObservatoryHistoryViewer v-else-if="isHistory()" />
<div v-else class="content-grid"> <!-- placeholder cards --> </div>
```

The placeholder grid is preserved for Diff and Runtime.

### Styling

Dark theme, developer-tool aesthetic — identical visual system to the Trace and Timeline viewers: near-black surfaces, 1px subtle borders, monospace numerics, indigo accent for the active row, green `+` marker for evolution additions, no bright colors, no oversized rounded cards. All values use `var(--obs-*)` shell tokens (with fallbacks) — no inline styles, no magic numbers. Two-column grid: `grid-template-columns: 300px minmax(0, 1fr)`.

---

## Consequences

### Positive

1. **Third observability viewer** — the History panel now shows real structured content
2. **Pattern parity with Trace/Timeline viewers** — all three viewers share the same layout, semantics, styling, and keyboard behavior
3. **Reusable evolution card** — `HistoryEntryCard` serves every evolution item and can be reused by future viewers
4. **Backward compatible** — placeholder grid preserved for Diff and Runtime
5. **No new dependencies** — same Vue 3 + Pinia stack, local state only
6. **Accessibility-first** — semantic nav/article/dl/section/ul markup, keyboard navigation, `aria-current`, `aria-labelledby` links, keyboard-reachable pre block, no div-as-button
7. **Tested** — 103 new tests; TypeScript 0 errors; ESLint 0 errors

### Negative

None.

### Risks

None — additive UI. The only existing-file change is the additive `v-else-if` branch in `ObservatoryContent.vue`; existing tests re-pointed their placeholder-grid hosts from History to Diff.

---

## Compliance

- **TypeScript 0 errors** — verified (`vue-tsc --noEmit`)
- **ESLint 0 errors** — verified
- **Tests pass** — 471 tests across 6 files in `apps/web` (103 history + 99 trace + 99 timeline + 93 shell + 62 overview + 15 streaming); 8067 across the monorepo
- **History panel renders the viewer** — verified (store `selectedPanel === 'History'`)
- **Non-Overview/Trace/Timeline/History panels unchanged** — verified (placeholder grid still renders for Diff/Runtime)
- **Mock data only** — verified (no Runtime/Planner/Pipeline/PromptBuilder/AI/Strategy imports)
- **No store changes** — verified (selection is local `ref`)
- **Architecture version** v1.33 → v1.34

---

## Completion Condition

The History Viewer is the third observability viewer in the Observatory Shell. Future Sprint 6 work orders will implement the Diff and Runtime viewers using the same master-detail pattern, and will replace mock history data with real `metadata.promptAssembly.history` consumption.