# ADR-0150: Observatory Runtime Viewer Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-007  
**Architecture Version:** v1.36 → v1.37

---

## Context

WO-S6-001 delivered the Observatory Shell, WO-S6-002 the Overview Dashboard, WO-S6-003 the Trace Viewer, WO-S6-004 the Timeline Viewer, WO-S6-005 the History Viewer, WO-S6-006 the Diff Viewer, and WO-S6-006.5 the I18n Foundation. Of the 7 sidebar panels, Overview, Trace, Timeline, History, Diff, and now Runtime need real content — the Runtime panel still rendered the "Coming Soon" placeholder grid.

This work order implements the **Runtime Viewer**: a two-column, developer-tool layout that lists mock runtime-world entities in the left pane, and shows live-looking world stats (Entities / Systems / Events / FPS) above the selected entity's details in the right pane. It follows the exact master-detail pattern established by the Trace Viewer (WO-S6-003), Timeline Viewer (WO-S6-004), History Viewer (WO-S6-005), and Diff Viewer (WO-S6-006), and is the first viewer to consume the S6-006.5 i18n infrastructure for its data labels.

### Problem

1. **No runtime viewer** — the Runtime panel was the last placeholder grid beside Settings
2. **No per-entity detail surface** — position / health / state need a structured, typed detail view
3. **No runtime stats surface** — world-level counters (entities, systems, events, FPS) need a compact stat presentation
4. **No localized runtime labels** — the viewer must render through the existing `observatory.runtime.*` catalog keys (zh-CN is the default language)

### Scope Boundaries (Explicitly NOT in this work order)

- No Runtime package changes (mock state only, no `@genesis/runtime` imports)
- No Planner changes
- No Pipeline changes
- No PromptBuilder changes
- No AI package changes
- No Strategy package changes
- No Metadata generation changes
- No store schema changes (selection is local component state)
- No real data wiring — runtime state is hardcoded mock
- No new dependencies (no external UI libraries, no Tailwind)

---

## Decision

### Component Hierarchy

```
apps/web/src/components/observatory/runtime/
├── ObservatoryRuntimeViewer.vue — root, owns mock runtime state + selectedId
├── RuntimeEntityList.vue        — selectable entity rows (nav + ul + buttons)
├── RuntimeEntityDetails.vue     — header (ID/Type) + Position / Health / State grid
└── RuntimeStatCard.vue          — reusable stat card (dt label + dd value)
```

### Root Viewer

`ObservatoryRuntimeViewer.vue` holds a local `MOCK_RUNTIME_STATE` (`worldId: 'world-001'`; stats `entities: 187, systems: 8, events: 31, fps: 60`; entities `guard-001` Guard `(10,4)` Patrol, `merchant-001` Merchant `(4,8)` Trading, `villager-001` Villager `(1,2)` Working — health 100) and a `selectedId` ref defaulting to the first entity. It composes:

```vue
<RuntimeEntityList :entities="..." :selected-id="selectedId" @select="selectEntity" />
<div class="runtime-main">
  <section class="runtime-stats" aria-labelledby="runtime-stats-title">…RuntimeStatCard × 4…</section>
  <RuntimeEntityDetails :entity="selectedEntity" />
</div>
```

Selection state is intentionally local (`ref`) — the constraint "no store schema changes" keeps panel state out of the Pinia store.

### Runtime Stats

The right panel opens with a `section[aria-labelledby="runtime-stats-title"]` containing an `h2#runtime-stats-title` ("Runtime Stats"), a monospace `world-001` identifier, and `dl.runtime-stats-grid` with four `RuntimeStatCard`s (Entities / Systems / Events / FPS). Stat labels render through `i18n.t('observatory.runtime.*')` so the section reacts to the shell's zh-CN/en-US switcher.

### Entity List

`RuntimeEntityList.vue` renders a two-column list inside a `nav[aria-label="Entity list"]`:

- Semantic markup: `nav` → `h2` → `ul` → `li` → `button.runtime-row`
- Each row shows `id` (monospace) and `type` (dim)
- Active row via `.runtime-row--active` (accent-tinted background + border) plus `aria-current="true"`
- Hover state on `.runtime-row:hover`
- Keyboard navigation: ArrowUp / ArrowDown / Home / End handled on the `nav` container, moving the active row and focusing the newly selected button (same pattern as the Trace, Timeline, History, and Diff viewers)
- `@select` emits the entity id upward

### Entity Details

`RuntimeEntityDetails.vue` renders the selected entity in `.runtime-entity-details` (article, `aria-label="Runtime entity details"`):

1. **Header** — `Runtime Entity Details` heading (h2) plus a `dl.runtime-entity-meta` with ID and Type (monospace values)
2. **Properties** — a `dl.runtime-entity-grid` with three items: Position / Health / State, each `dt` label localized via `observatory.runtime.position | health | state` and a monospace `dd` value

An overall empty state (`entity == null`) renders `No entity selected`.

### Runtime Stat Card

`RuntimeStatCard.vue` is a reusable component receiving `label` and `value` string props:

- `div.runtime-stat-card` containing `dt.runtime-stat-label` (uppercase, dim) and `dd.runtime-stat-value` (mono, 20px)
- Intended to be placed inside a parent `dl`; the card is self-contained and fully reusable
- Values use the Observatory design system (`var(--obs-*)` tokens with fallbacks)

### I18n

The viewer is the first observability viewer whose data labels use the WO-S6-006.5 infrastructure. New keys under `observatory.runtime.*`:

| key       | zh-CN      | en-US    |
| --------- | ---------- | -------- |
| entities  | 实体        | Entities |
| systems   | 系统        | Systems  |
| events    | 事件        | Events   |
| fps       | 运行帧率     | FPS      |
| position  | 位置        | Position |
| state     | 状态        | State    |
| health    | 生命值       | Health   |

Structural headings (Entity List / Runtime Stats / Runtime Entity Details, ID / Type) intentionally stay neutral English, matching the unlocalized viewer-detail scope of WO-S6-006.5. The shell language switcher re-renders the runtime labels reactively via the `stores/i18n.ts` `language` ref — no reload, no remount.

### Content Integration

`ObservatoryContent.vue` now has seven branches:

```vue
<ObservatoryOverview v-if="isOverview()" />
<ObservatoryTraceViewer v-else-if="isTrace()" />
<ObservatoryTimelineViewer v-else-if="isTimeline()" />
<ObservatoryHistoryViewer v-else-if="isHistory()" />
<ObservatoryDiffViewer v-else-if="isDiff()" />
<ObservatoryRuntimeViewer v-else-if="isRuntime()" />
<div v-else class="content-grid"> <!-- placeholder cards, Settings only --> </div>
```

The placeholder grid is preserved for Settings. Tests that used Runtime as the placeholder-grid host were re-pointed to Settings (shell, i18n, trace, timeline, history, diff, overview).

### Styling

Dark theme, developer-tool aesthetic — identical visual system to the Trace, Timeline, History, and Diff viewers: near-black surfaces, 1px subtle borders, monospace numerics, indigo accent for the active row; no bright colors, no oversized rounded cards. All values use `var(--obs-*)` shell tokens (with fallbacks) — no inline styles, no magic numbers. Two-column grid: `grid-template-columns: 300px minmax(0, 1fr)`; the right column is a flex column with the stats section above the details.

---

## Consequences

### Positive

1. **Fifth observability viewer** — the Runtime panel now shows structured world state instead of a placeholder
2. **Pattern parity with Trace/Timeline/History/Diff viewers** — same layout, semantics, styling, and keyboard behavior
3. **Reusable stat card** — `RuntimeStatCard` services all four stats and can be reused by future dashboards
4. **First i18n-aware viewer** — runtime labels flow through the WO-S6-006.5 catalog and switcher
5. **Backward compatible** — placeholder grid preserved for Settings; no store schema change
6. **No new dependencies** — same Vue 3 + Pinia stack, local state only
7. **Accessibility-first** — semantic nav/article/section/h2/dl/dt/dd/ul markup, keyboard navigation, `aria-current`, `aria-labelledby` link, no div-as-button
8. **Tested** — 139 new tests; TypeScript 0 errors; ESLint 0 errors

### Negative

None.

### Risks

None — additive UI. The only existing-file changes are the additive `v-else-if` branch in `ObservatoryContent.vue` and re-pointed placeholder-grid host tests (Runtime → Settings).

---

## Compliance

- **TypeScript 0 errors** — verified (`vue-tsc --noEmit` across the monorepo)
- **ESLint 0 errors** — verified
- **Tests pass** — 877 tests across 9 files in `apps/web` (139 runtime + 130 i18n + 120 diff + 110 shell + 103 history + 99 trace + 99 timeline + 62 overview + 15 streaming); 8473 across the monorepo
- **Runtime panel renders the viewer** — verified (store `selectedPanel === 'Runtime'`)
- **Non-Overview/Trace/Timeline/History/Diff/Runtime panels unchanged** — verified (placeholder grid still renders for Settings)
- **Mock data only** — verified (no Runtime/Planner/Pipeline/PromptBuilder/AI/Strategy imports)
- **No store changes** — verified (selection is local `ref`)
- **Uses I18n infrastructure** — verified (`observatory.runtime.*` keys consumed via `useI18n().t()`)
- **Architecture version** v1.36 → v1.37

---

## Completion Condition

The Runtime Viewer is the fifth observability viewer in the Observatory Shell. Future Sprint 6 work orders will replace mock runtime state with real `@genesis/runtime` consumption, and update the placeholder grid once Settings gains a viewer. Prompt Explorer remains future work.