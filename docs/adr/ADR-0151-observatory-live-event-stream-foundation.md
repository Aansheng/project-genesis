# ADR-0151: Observatory Live Event Stream Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-008  
**Architecture Version:** v1.37 → v1.38

---

## Context

WO-S6-001 delivered the Observatory Shell, WO-S6-002 the Overview Dashboard, WO-S6-003 the Trace Viewer, WO-S6-004 the Timeline Viewer, WO-S6-005 the History Viewer, WO-S6-006 the Diff Viewer, WO-S6-006.5 the I18n Foundation, and WO-S6-007 the Runtime Viewer. All six viewer panels plus Runtime now have real content; the shell has not yet exposed a live, time-based surface.

This work order adds a new **Event Stream** sidebar panel (between Runtime and Settings) hosting a single-column, simulated live event feed: a top filter bar (All / Info / Warning / Error) above a scrollable list of timestamped events with level badges. A `setInterval`-driven simulation appends one mock event every 2000ms and enforces a 100-event retention cap. It builds on the WO-S6-006.5 i18n infrastructure end-to-end (panel label, title, filters, badges) — the second fully-localized viewer surface after the Runtime Viewer.

### Problem

1. **No live surface** — every viewer so far is static master-detail; the shell needs a time-driven, "live" observability affordance
2. **No event feed UI** — timestamped, level-badged event rows need a compact single-column presentation
3. **No filter affordance** — info/warning/error triage needs an accessible filter bar (All / Info / Warning / Error)
4. **No simulation plumbing** — the UI must exercise interval-driven append, retention, and teardown with zero backend

### Scope Boundaries (Explicitly NOT in this work order)

- No Runtime package changes (mock events only)
- No Planner changes
- No Pipeline changes
- No PromptBuilder changes
- No AI package changes
- No Strategy package changes
- No Metadata generation changes
- No persistence — the stream is in-memory component state that resets per mount
- No backend — auto-append is a purely client-side simulation
- No new dependencies (no external UI libraries, no Tailwind)

---

## Decision

### Panel Addition

`stores/observatory.ts` gains `'EventStream'` in the `ObservatoryPanel` union and `OBSERVATORY_PANELS`, positioned between `Runtime` and `Settings` (8 panels total). The sidebar, header, and content gates consume the array unchanged; the localized label resolves via the existing `observatory.panels.${panel.toLowerCase()}` convention → `observatory.panels.eventstream` (`事件流` / `Event Stream`).

### Component Hierarchy

```
apps/web/src/components/observatory/events/
├── ObservatoryEventStream.vue — root: mock stream, filter state, 2000ms simulation, 100-event cap
├── EventStreamList.vue        — scrollable <ul role="log"> of items (or "No events" empty state)
├── EventStreamItem.vue        — article row: timestamp / level badge / source / message (+ shared types)
└── EventFilterBar.vue         — All/Info/Warning/Error buttons with aria-pressed
```

### Root Viewer

`ObservatoryEventStream.vue` owns:

- a 20-entry `SEEDS` pool (the four spec examples plus sixteen follow-ups across Runtime/Planner/AI/Provider and info/warning/error; each seed contributes `level`, `source`, `message`)
- an `INITIAL_EVENTS` array built from `SEEDS` with generated `evt-NNN` ids and a deterministic per-instance clock (`12:00:01` … `12:00:20`)
- `events` (ref), `filter: 'all' | 'info' | 'warning' | 'error'` (ref), and a `filteredEvents` computed
- `appendEvent()` — cycles the seed pool, assigns the next id/timestamp, pushes, then `splice(0, length - 100)` when the stream exceeds `MAX_EVENTS = 100`
- `onMounted` → `setInterval(appendEvent, 2000)`; `onBeforeUnmount` → `clearInterval` (timer handle nulled)

The clock, id counter, and timer are per-instance closure state, so every mount seeds a fresh deterministic `12:00:01` stream (deterministic rendering across mounts) and unmount leak is impossible.

### Event Stream List

`EventStreamList.vue` renders a `ul[role="log"][aria-label="Event stream"]` (live-region semantics for a time-driven feed) of `EventStreamItem`s inside `li`s; the `<ul>` is the scroll container (`flex: 1; overflow-y: auto`) so the stream fills the shell content area below the header and filter bar. An empty `events` prop renders a `p.event-stream-empty` ("No events") fallback and omits the list.

### Event Stream Item

`EventStreamItem.vue` renders a four-column article row: monospace timestamp, level badge (pill: `--obs-accent` info / amber warning / red error), bold source, message (wraps). Badge and row carry per-level modifier classes (`event-badge--info|warning|error`, `event-stream-item--error` tint). The component also exports the shared `StreamEvent`, `EventLevel`, and `EventFilter` types (leaf-exports convention used by the other viewers).

### Filter Bar

`EventFilterBar.vue` renders four native `<button>`s (All / Info / Warning / Error) inside `div[role="group"][aria-label="Event stream filters"]`. The active filter carries `.event-filter-button--active` and `aria-pressed="true"`; others are `aria-pressed="false"`. Clicking emits `change` with the filter; the root viewer owns the filter state (local state only — no backend, no persistence).

### Auto Stream Simulation

- `setInterval` every **2000ms** appends one mock event from the cycling seed pool
- `MAX_EVENTS = 100`: when the stream exceeds 100, the oldest entries are spliced (retention keeps the newest 100)
- `onBeforeUnmount` clears the interval — no orphan timers after navigation or tests
- UI-only: no network, no store, no persistence

### I18n

New keys under `observatory.events.*` (zh-CN / en-US):

| key       | zh-CN      | en-US        |
| --------- | ---------- | ------------ |
| title     | 事件流      | Event Stream |
| all       | 全部       | All          |
| info      | 信息       | Info         |
| warning   | 警告       | Warning      |
| error     | 错误       | Error        |
| source    | 来源       | Source       |
| timestamp | 时间       | Timestamp    |
| message   | 消息       | Message      |

Plus `observatory.panels.eventstream` (`事件流` / `Event Stream`) for the sidebar. Title, filter labels, and level badges render through `useI18n().t()` and react to the shell language switcher; selections and the stream array survive a language switch (no remount).

### Content Integration

`ObservatoryContent.vue` gains an `isEventStream()` gate:

```vue
<ObservatoryRuntimeViewer v-else-if="isRuntime()" />
<ObservatoryEventStream v-else-if="isEventStream()" />
<div v-else class="content-grid"><!-- placeholder grid, Settings only --></div>
```

The placeholder grid still renders only for Settings.

### Styling

Dark, developer-tool aesthetic consistent with the other viewers: near-black surfaces, 1px borders, monospace timestamps/ids, pill badges, indigo accent for the active filter. Single-column flex layout (`height: 100%`; header → filter bar → scrollable list). All values via `var(--obs-*)` tokens with fallbacks — no inline styles, no new dependencies.

---

## Consequences

### Positive

1. **First live surface** — the Event Stream panel demonstrates time-driven UI without any backend
2. **Accessible triage** — native-button filter bar with `aria-pressed`, live-region list, semantic articles
3. **Fully localized** — the second viewer rendered 100% through the WO-S6-006.5 infrastructure (title, filters, badges, panel label)
4. **Self-cleaning** — interval teardown on unmount; per-instance state makes mounts deterministic and leak-free
5. **Cap enforced** — 100-event retention keeps the DOM bounded regardless of uptime
6. **Backward compatible** — one additive panel in the store array; placeholder grid preserved for Settings
7. **Tested** — 161 new tests; TypeScript 0 errors; ESLint 0 errors

### Negative

None.

### Risks

None — additive UI. Existing tests that asserted 7 panels / sidebar labels / the Settings button index were updated to 8 panels with the new label, and the placeholder-grid host stays Settings (unchanged from WO-S6-007).

---

## Compliance

- **TypeScript 0 errors** — verified (`vue-tsc --noEmit`)
- **ESLint 0 errors** — verified
- **Tests pass** — 1053 tests across 10 files in `apps/web` (161 event stream + 139 runtime + 134 i18n + 121 shell + 120 diff + 103 history + 99 trace + 99 timeline + 62 overview + 15 streaming)
- **Event Stream panel renders the viewer** — verified (store `selectedPanel === 'EventStream'`; browser smoke test)
- **Live simulation works** — verified (browser: stream auto-appends every 2s)
- **100-event retention works** — verified (fake-timer tests cap at 100 and drop the oldest)
- **Non-EventStream panels unchanged** — verified (placeholder grid still renders for Settings)
- **Mock data only** — verified (no Runtime/Planner/Pipeline/PromptBuilder/AI/Strategy imports)
- **Uses I18n infrastructure** — verified (`observatory.events.*` + `observatory.panels.eventstream` via `useI18n().t()`)
- **Architecture version** v1.37 → v1.38

---

## Completion Condition

The Event Stream is the shell's live observability surface. Future Sprint 6 work orders will replace the simulated seed pool with real observatory event consumption, and may add pause/auto-scroll controls. Prompt Explorer and a Settings viewer remain future work (the placeholder grid now only exists for Settings).