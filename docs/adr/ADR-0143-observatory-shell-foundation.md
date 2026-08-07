# ADR-0143: Observatory Shell Foundation

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-001  
**Architecture Version:** v1.29 → v1.30

---

## Context

Sprint 5 completed the Prompt Observability Layer — a rich set of diagnostic artifacts (`PromptAssemblyObservatory`, trace, timeline, history, diff, renderer, exporter, snapshot) are now produced by `DefaultPromptBuilder` and stored in `metadata.promptAssembly`. However, none of this data is visible to a human. There is no UI surface for inspecting the observatory data.

This work order creates the first visible UI milestone of Project Genesis: the **Observatory Shell** — a dark, minimal, developer-tool style application shell (Linear / Vercel / Raycast / Warp / Claude Console aesthetic) that will eventually host the Trace Viewer, Timeline Viewer, History Viewer, Diff Viewer, Runtime Graph, and Prompt Explorer.

### Problem

1. **No UI shell** — the web app only renders the game canvas; no observatory surface exists
2. **No panel navigation** — no way to switch between observatory panels
3. **No layout validation** — the shell layout must be validated before any viewer is built

### Scope Boundaries (Explicitly NOT in this work order)

- No Trace Viewer
- No Timeline Viewer
- No History Viewer
- No Diff Viewer
- No Runtime Graph
- No Prompt Explorer

UI shell only. No backend changes. No Runtime changes. No Planner changes. No PromptBuilder changes.

---

## Decision

### Route

Register a new route at `/observatory`:

```typescript
const routes: RouteRecordRaw[] = [
  {
    path: '/observatory',
    name: 'observatory',
    component: ObservatoryPage,
  },
]
```

`ObservatoryPage.vue` toggles a `body.observatory` class on mount to reset the global flex-centering styles from `App.vue` and enforce the shell's desktop-first constraints (`min-width: 1280px`, `overflow-x: hidden`). `App.vue` renders `<router-view>` only when the observatory route is active; the existing game canvas app is unchanged for all other paths.

### Component Hierarchy

```
ObservatoryPage.vue
  └── ObservatoryShell.vue            — grid layout + design tokens
        ├── ObservatoryHeader.vue     — title, status badge, version, sprint
        ├── ObservatorySidebar.vue    — 7-panel navigation (local state only)
        └── ObservatoryContent.vue    — 6 placeholder cards ("Coming Soon")
```

### Pinia Store

`apps/web/src/stores/observatory.ts` defines `useObservatoryStore` with setup-style state:

```typescript
export type ObservatoryPanel =
  | 'Overview' | 'Trace' | 'Timeline' | 'History'
  | 'Diff' | 'Runtime' | 'Settings'

export const OBSERVATORY_PANELS: readonly ObservatoryPanel[] = [
  'Overview', 'Trace', 'Timeline', 'History', 'Diff', 'Runtime', 'Settings',
]
```

State defaults: `status: 'Ready'`, `version: 'v1.29'`, `selectedPanel: 'Overview'`.

Actions: `selectPanel(panel)`, `setStatus(next)`, `setVersion(next)`.

No routing logic — local UI state only, per requirement.

### Sidebar Behavior

- Seven menu items: `Overview`, `Trace`, `Timeline`, `History`, `Diff`, `Runtime`, `Settings`
- Active state bound to `store.selectedPanel`; rendered as `sidebar-button--active` class plus `aria-current="page"`
- Hover state via CSS `:hover` on each button
- Keyboard accessible: real `<button>` elements (focusable, Enter/Space activates) with arrow-key navigation (`ArrowUp` / `ArrowDown` / `Home` / `End`) on the nav container

### Header

- Left: title `Genesis Observatory`, status badge `Ready` (green pill with `role="status"`), version `v1.29`
- Right: `Sprint 6`
- Status and version are bound to the store

### Content Area

Six placeholder cards — `Overview`, `Trace`, `Timeline`, `History`, `Diff`, `Runtime` — each containing `Coming Soon`. The card matching `store.selectedPanel` receives the `content-card--active` accent. Purpose is layout validation only; no viewers implemented.

### Styling

Dark theme, desktop-first, `min-width: 1280px`, no horizontal scroll. A spacing/token system is defined as CSS custom properties on `.observatory-shell` (inherited by all child components):

- Spacing scale: `--obs-space-1..6` (4/8/12/16/24/32 px)
- Surfaces: `--obs-bg`, `--obs-surface`, `--obs-surface-2`
- Borders: `--obs-border`, `--obs-border-strong`
- Text: `--obs-text`, `--obs-text-muted`, `--obs-text-dim`
- Accent: `--obs-accent`, success: `--obs-success`
- Monospace: `--obs-font-mono`

No new dependencies were added — Vue 3 + TypeScript + Pinia + vue-router only (no Naive UI, no TailwindCSS).

### Tests

`apps/web/src/__tests__/ObservatoryShell.test.ts` — 56 test cases covering:

| Group | Coverage |
|-------|----------|
| Store | defaults, `selectPanel`/`setStatus`/`setVersion`, panel list completeness and order |
| Header | title, status badge, version, sprint, reactive store updates, accessibility roles/labels |
| Sidebar | all 7 items, spec order, button semantics, default active, click selection, active class movement, `aria-current`, nav label, arrow/Home/End navigation, clamping, unrelated-key ignoring |
| Content | 6 cards, all card titles, no Settings card, "Coming Soon" on every card, active card sync, content landmark |
| Shell | root render, header/sidebar/content presence, grid area classes, combined shell render, panel selection sync |

---

## Consequences

### Positive

1. **First visible UI milestone** — the observatory has a human-facing surface
2. **Layout validated** — six placeholder cards prove the grid, sidebar, and header compose correctly
3. **Backward compatible** — the game canvas app is preserved at `/`; observatory only renders at `/observatory`
4. **No new dependencies** — uses the existing Vue 3 + Pinia + vue-router stack
5. **Keyboard accessible** — buttons + arrow-key navigation + ARIA attributes
6. **Consistent spacing system** — CSS custom properties avoid magic numbers
7. **Tested** — 56 new tests; TypeScript 0 errors; ESLint 0 errors

### Negative

None.

### Risks

None — this is additive UI infrastructure; no existing component was modified except for the additive `<router-view>` hook in `App.vue`.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Tests pass** — 56 new tests in `ObservatoryShell.test.ts` (71 total in `apps/web`, 7667 across the monorepo)
- **Route accessible** — `/observatory` renders the shell (verified in browser)
- **Sidebar works** — all 7 panels selectable, active state tracked
- **Header works** — title, status, version, sprint displayed
- **Dark theme applied** — verified
- **Architecture version** v1.29 → v1.30

---

## Completion Condition

The Observatory Shell is the first visible UI milestone of Project Genesis. Future Sprint 6 work orders will implement the individual viewers (Trace, Timeline, History, Diff, Runtime, Prompt Explorer) inside this shell.