# ADR-0153: Observatory Trace Graph Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-010  
**Architecture Version:** v1.39 → v1.40

---

## Context

WO-S6-001 through WO-S6-009 delivered the full Observatory Shell suite: Shell, Overview, Trace Viewer, Timeline Viewer, History Viewer, Diff Viewer, I18n Foundation, Runtime Viewer, Live Event Stream, and Runtime Entity Inspector. Every viewer so far follows a list-detail or single-column pattern—there is no graph-based visualization surface.

This work order adds a **Trace Graph** panel (between Event Stream and Settings, 9 panels total) hosting a pure-CSS vertical flow graph of strategy execution steps: cards for each node (CreateWorld → GenerateTerrain → CreateFarm → CreateNPC → CreateInventory → CreateQuest) with status badges and simple vertical connector edges. It builds on the WO-S6-006.5 i18n infrastructure end-to-end (panel label, title, legend labels, status labels).

### Problem

1. **No graph surface** — every viewer so far is list-based or detail-based; the shell needs a visual graph affordance for strategy execution flows
2. **No node UI** — strategy steps need a dark card with status dot, status label, and strategy name
3. **No connector UI** — edges between nodes need a simple vertical line + arrow indicator
4. **No legend** — status meanings (completed/pending/failed) need an accessible legend

### Scope Boundaries (Explicitly NOT in this work order)

- No SVG dependency libraries (Cytoscape, D3)
- No graph layout engines — pure CSS vertical flow only (no force-directed, no horizontal branching)
- No Runtime integration (mock data only)
- No Planner changes
- No PromptBuilder changes
- No AI package changes
- No Strategy changes
- No Metadata generation changes
- No new dependencies

---

## Decision

### Panel Addition

`stores/observatory.ts` gains `'TraceGraph'` in the `ObservatoryPanel` union and `OBSERVATORY_PANELS`, positioned between `EventStream` and `Settings` (9 panels total). The sidebar, header, and content gates consume the array unchanged; the localized label resolves via the existing `observatory.panels.${panel.toLowerCase()}` convention → `observatory.panels.tracegraph` (`执行图谱` / `Trace Graph`).

### Component Hierarchy

```
apps/web/src/components/observatory/graph/
├── ObservatoryTraceGraph.vue — root: mock nodes/edges, graph layout, legend
├── TraceGraphNode.vue       — article card: status dot + label + strategy name
├── TraceGraphEdge.vue       — div connector: vertical line + arrow
└── TraceGraphLegend.vue     — section: h3 title + ul of status dots + labels
```

### Mock Graph Data

| Node | Label | Status |
|------|-------|--------|
| `node-1` | CreateWorld | completed |
| `node-2` | GenerateTerrain | completed |
| `node-3` | CreateFarm | completed |
| `node-4` | CreateNPC | completed |
| `node-5` | CreateInventory | completed |
| `node-6` | CreateQuest | completed |

Edges: linear chain `node-1 → node-2 → node-3 → node-4 → node-5 → node-6`

### Layout

Single centered column in a scrollable canvas area. Nodes rendered as min-width dark cards with green accent (completed), yellow accent (pending), or red accent (failed). Edges are pure CSS: 2px vertical line + triangular arrow. The legend sits below the canvas.

### TraceGraphNode

- `<article>` with `<header>` containing status dot (8px circle) + status label
- Strategy name displayed as `<p>` in monospace font
- `graph-node--completed|pending|failed` modifier class for accent colors
- Hover state: indigo border + darker background

### TraceGraphEdge

- `<div>` with role="img" and aria-label="connects to"
- 2px vertical line in `graph-edge-line` div
- CSS triangle arrow in `graph-edge-arrow` div

### TraceGraphLegend

- `<section>` with aria-label="Graph legend"
- `<h3>` title + `<ul>` of 3 items: completed (green)/pending (yellow)/failed (red)
- Each item: 8px dot + localized label

### I18n Keys Added

| Key | zh-CN | en-US |
|-----|-------|-------|
| `observatory.panels.tracegraph` | 执行图谱 | Trace Graph |
| `observatory.graph.title` | 执行图谱 | Trace Graph |
| `observatory.graph.legend` | 图例 | Legend |
| `observatory.graph.completed` | 已完成 | Completed |
| `observatory.graph.pending` | 进行中 | Pending |
| `observatory.graph.failed` | 失败 | Failed |

---

## Consequences

### Positive

1. **First graph surface** — the Observatory now has a visual strategy execution flow viewer
2. **Pure CSS layout** — no external graph libraries, no SVG, no D3/Cytoscape dependencies
3. **Semantic markup** — uses `article`, `section`, `header`, `h2`, `h3`, `ul`, `li`, `p` throughout; no div-as-button
4. **Keyboard reachable** — sidebar navigation works via Arrow/Home/End keys; graph is display-only (no interaction needed)
5. **Full i18n** — panel label, title, legend labels, and status labels are localized

### Negative

1. **Linear layout only** — the graph is a simple vertical chain; no branching, no DAG, no force-directed layout
2. **Display-only** — nodes are not interactive (no click, no drill-down); interaction is a future work order
3. **Mock data only** — all 6 nodes are "completed"; pending/failed statuses only appear in the standalone legend

### Neutral

1. **9 panels** — the sidebar now has 9 items; keyboard navigation cycles through all 9
