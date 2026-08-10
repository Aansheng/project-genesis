# ADR-0154: Observatory World Graph Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-011  
**Architecture Version:** v1.40 → v1.41

---

## Context

WO-S6-001 through WO-S6-010 delivered the full Observatory Shell suite: Shell, Overview, Trace Viewer, Timeline Viewer, History Viewer, Diff Viewer, I18n Foundation, Runtime Viewer, Live Event Stream, Runtime Entity Inspector, and Trace Graph. The shell has a linear-chain graph (Trace Graph), but there is no tree-hierarchy world graph surface.

This work order adds a **World Graph** panel (between Trace Graph and Settings, 10 panels total) hosting a pure-CSS tree-hierarchy graph with a single root node (World) and 6 child nodes (Farm, Barn, WheatField, Farmer, Merchant, HarvestQuest). Each node displays its name, type badge (World/Location/NPC/Quest), and status indicator (Active/Inactive). Parent→child connections use pure CSS. A dual-section legend shows type badges and status dots.

### Problem

1. **No world graph surface** — every viewer so far is list-based, detail-based, or linear-chain; the shell needs a tree-hierarchy graph for world entity visualization
2. **No composable world node** — nodes need a type badge (4 variants) and a status indicator (active/inactive) instead of a single status
3. **No tree connector** — parent→child connections need a branch-style CSS connector (vertical line + horizontal bar)
4. **No dual legend** — legend must show both type badges (4 items) and status dots (2 items) in two groups

### Scope Boundaries (Explicitly NOT in this work order)

- No Runtime integration (mock data only)
- No Planner changes
- No PromptBuilder changes
- No AI package changes
- No Strategy changes
- No Metadata generation changes
- No new dependencies
- No graph layout engines — pure CSS tree layout only

---

## Decision

### Panel Addition

`stores/observatory.ts` gains `'WorldGraph'` in the `ObservatoryPanel` union and `OBSERVATORY_PANELS`, positioned between `TraceGraph` and `Settings` (10 panels total). The sidebar, header, and content gates consume the array unchanged; the localized label resolves via the existing `observatory.panels.${panel.toLowerCase()}` convention → `observatory.panels.worldgraph` (`世界图谱` / `World Graph`).

### Component Hierarchy

```
apps/web/src/components/observatory/world/
├── ObservatoryWorldGraph.vue — root: mock world nodes, tree layout, legend
├── WorldGraphNode.vue         — article card: type badge + status dot/label + name
├── WorldGraphConnection.vue   — CSS connector: vertical line + arrow
└── WorldGraphLegend.vue       — section: h3 title + dual-group ul (types + statuses)
```

### Mock World Data

| ID | Name | Type | Status |
|----|------|------|--------|
| `world-root` | World | world | active |
| `node-farm` | Farm | location | active |
| `node-barn` | Barn | location | inactive |
| `node-wheat` | WheatField | location | active |
| `node-farmer` | Farmer | npc | active |
| `node-merchant` | Merchant | npc | inactive |
| `node-quest` | HarvestQuest | quest | active |

Tree structure: World (root) → 6 children in a centered row below.

### Layout

Root node centered at top. Children displayed in a centered flex row below. CSS connectors use a horizontal branching bar with vertical drops to each child. Canvas is scrollable. No graph libraries, no SVG libraries.

### WorldGraphNode

- `<article>` with `<header>` containing type badge (colored pill, uppercase) + status (8px dot + label text)
- Node name displayed as `<p>` in monospace font
- `world-graph-node--${type}` modifier class (world=purple, location=blue, npc=green, quest=orange)
- `world-graph-node--${status}` modifier class (active=green dot/border, inactive=gray dot/border)
- Hover state: indigo border + darker background

### WorldGraphConnection

- `<div>` with role="img" and aria-label="connects parent to child"
- Vertical line segment + horizontal arrow indicator

### WorldGraphLegend

- `<section>` with aria-label="World graph legend"
- `<h3>` title + two groups (`<h4>` group titles):
  - **Types**: 4 colored badge pills (World/Location/NPC/Quest)
  - **Statuses**: 2 dot + label items (Active/Inactive)

### I18n Keys Added

| Key | zh-CN | en-US |
|-----|-------|-------|
| `observatory.panels.worldgraph` | 世界图谱 | World Graph |
| `observatory.world.title` | 世界图谱 | World Graph |
| `observatory.world.legend` | 图例 | Legend |
| `observatory.world.world` | 世界 | World |
| `observatory.world.location` | 地点 | Location |
| `observatory.world.npc` | NPC | NPC |
| `observatory.world.quest` | 任务 | Quest |
| `observatory.world.active` | 活跃 | Active |
| `observatory.world.inactive` | 非活跃 | Inactive |
| `observatory.labels.types` | 类型 | Types |

---

## Consequences

### Positive

1. **First tree-hierarchy graph** — the Observatory now has a world entity tree visualization
2. **Pure CSS layout** — no external graph libraries, no SVG, no D3/Cytoscape dependencies
3. **Semantic markup** — uses `article`, `section`, `header`, `h2`, `h3`, `h4`, `ul`, `li`, `p` throughout; no div-as-button
4. **Keyboard reachable** — sidebar navigation works via Arrow/Home/End keys; graph is display-only (no interaction needed)
5. **Full i18n** — panel label, title, legend labels, type labels, and status labels are localized
6. **Dual-section legend** — types and statuses are clearly separated into two legend groups

### Negative

1. **Tree layout only** — the graph is a simple single-parent tree; no DAG, no branching hierarchy, no force-directed layout
2. **Display-only** — nodes are not interactive (no click, no drill-down); interaction is a future work order
3. **Mock data only** — inactive statuses appear only on Barn and Merchant nodes in mock data

### Neutral

1. **10 panels** — the sidebar now has 10 items; keyboard navigation cycles through all 10
2. **Separate `world/` directory** — world graph lives in its own directory under `observatory/`, keeping concerns separated from `graph/` (trace graph)