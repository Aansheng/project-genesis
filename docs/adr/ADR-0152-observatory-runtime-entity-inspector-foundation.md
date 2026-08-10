# ADR-0152: Observatory Runtime Entity Inspector Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-009  
**Architecture Version:** v1.38 → v1.39

---

## Context

WO-S6-001 delivered the Observatory Shell, WO-S6-002 the Overview Dashboard, WO-S6-003 the Trace Viewer, WO-S6-004 the Timeline Viewer, WO-S6-005 the History Viewer, WO-S6-006 the Diff Viewer, WO-S6-006.5 the I18n Foundation, WO-S6-007 the Runtime Viewer, and WO-S6-008 the Live Event Stream. The Runtime Viewer now has a selectable entity list with stats and details, but lacks a way to inspect the internal ECS-style components of each runtime entity.

This work order adds an **Entity Inspector** section below the existing Entity Details in the Runtime Viewer. The inspector displays a component count header and a scrollable list of `RuntimeComponentCard` cards, each showing a component name and its formatted JSON data. It builds on the WO-S6-006.5 i18n infrastructure (the third fully-localized viewer section after the Runtime stats/property labels).

### Problem

1. **No component-level visibility** — the Runtime Viewer shows entity-level properties (Position, Health, State) but not the full ECS component graph
2. **No structured JSON preview** — developers need a formatted, monospace JSON view of each component's data
3. **No mock data with components** — the initial 3 mock entities have flat properties only; the inspector needs its own mock data with `components[]` arrays

### Scope Boundaries (Explicitly NOT in this work order)

- No Runtime integration (mock data only)
- No Planner changes
- No PromptBuilder changes
- No AI package changes
- No Strategy changes
- No Metadata generation changes
- No external syntax highlighting libraries
- No inline styles

---

## Decision

### Component Hierarchy

```
apps/web/src/components/observatory/runtime/
├── ObservatoryRuntimeViewer.vue  — extended with inspector below details
├── RuntimeEntityInspector.vue   — new: component count + component list
└── RuntimeComponentCard.vue     — new: component name + formatted JSON via <pre>
```

### Mock Entity Structure (ECS-style)

Three mock entities with 3–5 components each:

| Entity        | Components                                             | Count |
|---------------|--------------------------------------------------------|-------|
| `guard-001`   | Position, Health, AI                                   | 3     |
| `merchant-001`| Position, Health, Inventory (gold + items), AI          | 4     |
| `villager-001`| Position, Health, Inventory, AI, Schedule (wake/sleep)  | 5     |

Each component has a `name: string` and `data: Record<string, unknown>` for arbitrary JSON.

### RuntimeEntityInspector

- Receives `entityId: string | null` prop
- Looks up entity from internal mock data
- Renders `<section>` with `<h3>` title ("实体检查器" / "Entity Inspector") and component count
- Renders a scrollable list of `RuntimeComponentCard` for each component
- Re-renders on entity switch (via reactive `computed`)
- Renders nothing when `entityId` is `null` or unknown

### RuntimeComponentCard

- Receives `component: InspectorComponent` prop
- Renders `<article>` with `<header>` + `<h3>` for component name
- Renders `<pre><code>` for `JSON.stringify(data, null, 2)` — pure monospace, no external libraries
- Semantic HTML throughout (section > article > header/h3 > pre > code)

### Layout

```
runtime-main (column flex)
├── Stats (fixed)
├── Entity Details (flex-shrink: 0)
└── Entity Inspector (flex: 1, overflow-y: auto)
```

The inspector occupies the remaining vertical space below the stats and details.

### I18n Keys Added

| Key                                | zh-CN        | en-US              |
|------------------------------------|--------------|--------------------|
| `observatory.runtime.inspector`    | 实体检查器   | Entity Inspector   |
| `observatory.runtime.components`   | 组件         | Components         |
| `observatory.runtime.componentCount` | 组件数量   | Component Count    |

---

## Consequences

### Positive

1. **Component-level visibility** — developers can inspect the full ECS component graph of any runtime entity
2. **Structured JSON preview** — monospace, multi-line formatted JSON for all component data
3. **Semantic markup** — uses `section`, `article`, `header`, `h3`, `pre`, and `code` throughout
4. **Keyboard accessible** — all interaction goes through the existing Runtime Viewer's entity list
5. **Reactive** — inspector updates immediately on entity selection or language switch

### Negative

1. **Mock data only** — the inspector's mock entity data is defined inside the component, not shared with the viewer's flat entity data (intentional, no integration scope)
2. **No filtering/search** — component list is a flat render of all components; no filtering or search yet

### Neutral

1. **Two mock data sets** — the viewer has its own flat entity mock data (for EntityList/Details), and the inspector has its own ECS-component mock data. These will be unified when Runtime integration happens in a future sprint.

---

## References

- ADR-0143: Observatory Shell Foundation
- ADR-0151: Observatory Live Event Stream Foundation
- WO-S6-007: Observatory Runtime Viewer Foundation
- WO-S6-006.5: Observatory I18n Foundation