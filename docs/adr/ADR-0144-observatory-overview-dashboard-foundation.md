# ADR-0144: Observatory Overview Dashboard Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-002  
**Architecture Version:** v1.30 → v1.31

---

## Context

WO-S6-001 delivered the Observatory Shell — a dark, minimal, developer-tool style surface at `/observatory` with a 7-panel sidebar, header, and 6 placeholder content cards ("Coming Soon"). The shell validated layout and navigation but provided no real observatory data. The first panel, **Overview**, was an empty placeholder.

This work order implements the first real dashboard inside the shell: the **Overview Dashboard**. It surfaces three sections — Artifact Summary, Observatory Snapshot, and System Status — using mock data that mirrors the shape of the Prompt Observability Layer produced in Sprint 5. The dashboard is the landing surface users see when they open `/observatory` and establishes the visual pattern that future viewers will follow.

### Problem

1. **No real content** — the Overview panel rendered the same "Coming Soon" placeholder as every other panel, giving no sense of what the observatory contains
2. **No dashboard pattern** — no precedent for how observatory data should be surfaced, structured, or styled inside the shell
3. **No semantic structure** — no `section` / `article` / `dl` semantic baseline for accessibility and future data wiring

### Scope Boundaries (Explicitly NOT in this work order)

- No Trace Viewer
- No Timeline Viewer
- No History Viewer
- No Diff Viewer
- No Runtime Graph
- No Prompt Explorer
- No real data wiring — artifact counts and snapshot values are hardcoded mock values
- No new dependencies (no chart libraries, no UI frameworks)
- No backend / Runtime / Planner / PromptBuilder changes

---

## Decision

### New Component

`apps/web/src/components/observatory/ObservatoryOverview.vue` — a single-file component rendered by `ObservatoryContent.vue` when `selectedPanel === 'Overview'`. The component reads `store.version` and `store.status` from the existing `useObservatoryStore`; all other data is local mock.

### Three Sections

#### Section 1 — Artifact Summary

Three `<article>` cards (Trace, Timeline, History), each with:
- `<h3>` title
- `<dl>` / `<dt>` / `<dd>` count (monospace numeric value: 12, 8, 4)
- `<p>` description
- `tabindex="0"` for keyboard reachability
- `aria-labelledby` pointing to the card `<h3 id>`

#### Section 2 — Observatory Snapshot

A compact status grid using `<dl class="snapshot-grid">` with 7 items:
- Artifact Count (6)
- Has Trace (Yes)
- Has Timeline (Yes)
- Has History (Yes)
- Has Trace Snapshot (Yes)
- Has Timeline Snapshot (Yes)
- Has History Snapshot (Yes)

Boolean values render as `Yes` / `No` text plus a colored dot indicator. Numeric values render in monospace.

#### Section 3 — System Status

A `<dl class="system-status-list">` with 3 items:
- **Version** — bound to `store.version` (reactive)
- **Sprint** — static `Sprint 6`
- **Status** — bound to `store.status` (reactive)

### Content Integration

`ObservatoryContent.vue` is updated to render `<ObservatoryOverview />` via `v-if="isOverview()"` and falls back to the existing 6-placeholder-card grid via `v-else` for all other panels. A small `isOverview()` helper wraps the `store.selectedPanel === 'Overview'` check for readability.

### Styling

All styling reuses the shell's CSS custom property design tokens (defined on `.observatory-shell` in WO-S6-001) via `var(--obs-*, <fallback>)`. No inline styles, no magic numbers. New tokens are not introduced — the component consumes the existing spacing scale, surfaces, borders, accent, success, and monospace font.

### Accessibility

- Semantic markup: `<section>` (with `aria-labelledby` → `<h2 id>`), `<article>`, `<h2>` / `<h3>`, `<dl>` / `<dt>` / `<dd>`
- Cards are keyboard reachable (`tabindex="0"`)
- Version and status labels have explicit `<dt>` labels
- No headless `<dl>` — every `<dl>` is paired with a heading

### Tests

Two test files, 122 tests total:

| File | Tests | Coverage |
|------|-------|----------|
| `apps/web/src/__tests__/ObservatoryOverview.test.ts` | 62 | Artifact Summary (16), Observatory Snapshot (14), System Status (15), Semantics & Accessibility (8), Deterministic Rendering (5), Overview Dashboard Integration (6) |
| `apps/web/src/__tests__/ObservatoryShell.test.ts` | 60 | Store (10), Header (9), Sidebar (18), Content (15 — updated for Overview/grid toggle), Shell (8) |

The `ObservatoryShell.test.ts` content block is updated to use a `mountContentAs(panel)` helper that selects a non-Overview panel before mounting, ensuring the placeholder grid branch renders for grid-specific assertions. New tests verify the Overview dashboard renders by default, disappears when a non-Overview panel is selected, and reappears when Overview is re-selected.

---

## Consequences

### Positive

1. **First real observatory content** — users see structured data immediately on opening `/observatory`
2. **Dashboard pattern established** — section / card / dl semantic baseline for future viewers
3. **Backward compatible** — placeholder grid preserved for all non-Overview panels
4. **No new dependencies** — reuses existing Vue 3 + Pinia stack and shell design tokens
5. **Accessibility-first** — semantic HTML, keyboard reachable, ARIA labels
6. **Tested** — 62 new tests + 4 updated content tests; TypeScript 0 errors; ESLint 0 errors

### Negative

None.

### Risks

None — additive UI content inside the existing shell; no existing component contract changed except `ObservatoryContent.vue` which now conditionally renders the Overview dashboard.

---

## Compliance

- **TypeScript 0 errors** — verified (`vue-tsc --noEmit`)
- **ESLint 0 errors** — verified
- **Tests pass** — 137 tests across 3 files in `apps/web` (60 + 62 + 15)
- **Overview renders by default** — verified (store default `selectedPanel = 'Overview'`)
- **Non-Overview panels unchanged** — verified (placeholder grid still renders)
- **No inline styles** — verified (all values via `var(--obs-*)`)
- **Architecture version** v1.30 → v1.31

---

## Completion Condition

The Overview Dashboard is the first real content surface in the Observatory. Future Sprint 6 work orders will implement the individual viewers (Trace, Timeline, History, Diff, Runtime, Prompt Explorer) and replace the mock data with real `metadata.promptAssembly.*` consumption.
