# ADR-0156: Observatory Overview Real Data Integration

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-013  
**Architecture Version:** v1.42 → v1.43

---

## Context

WO-S6-001 through WO-S6-012 delivered the Observatory UI shell, 10 panels, and a data adapter layer (`DefaultObservatoryAdapter`). The Overview dashboard (`ObservatoryOverview.vue`) currently renders hardcoded artifact counts (Trace = 12, Timeline = 8, History = 4) defined inside the component file.

The data adapter layer (ADR-0155) provides the `ObservatoryAdapter` interface and `DefaultObservatoryAdapter` implementation, but no store owns the adapted ViewModel and no component consumes it.

### Problem

1. **Hardcoded counts** — `ObservatoryOverview.vue` defines `Artifact[]` with literal `count: 12`, `count: 8`, `count: 4` that have no relationship to actual observatory data
2. **No data store** — there is no Pinia store that owns the `ObservatoryViewModel` and provides a lifecycle for loading/refreshing data
3. **Adapter not consumed** — `DefaultObservatoryAdapter` exists but has no consumer in the UI layer
4. **No integration test coverage** — the full path (mock data → adapter → store → component) is not tested

### Scope Boundaries (Explicitly NOT in this work order)

- No PromptBuilder integration
- No Runtime integration
- No Planner integration
- No AI package changes
- No metadata changes
- No Strategy changes
- No prompt changes
- No visual changes to the Overview layout

---

## Decision

### 1. New Data Store (`observatoryData.ts`)

Create `apps/web/src/stores/observatoryData.ts` — a Pinia store that owns the current `ObservatoryViewModel`.

**Store shape:**

```
state:
  viewModel: ObservatoryViewModel  (adapted through DefaultObservatoryAdapter)

actions:
  loadMockObservatory(): void      — build mock → adapt → store result
```

**Init behavior:**

- Store initializes with an empty ViewModel (all counts = 0, all arrays empty)
- `loadMockObservatory()` builds a local mock observatory object, runs it through `DefaultObservatoryAdapter.adapt()`, and stores the result

### 2. Local Mock Observatory

The mock object is defined entirely in the store file. It contains:

- `trace`: 3 entries with steps
- `timeline`: 5 entries with entries
- `history`: 2 entries with entries
- `traceSnapshot`, `timelineSnapshot`, `historySnapshot`: snapshot metadata objects

**No AI package types are imported.** The mock types (`MockTraceEntry`, `MockTimelineEntry`, `MockHistoryEntry`, `MockObservatory`) are defined locally.

**Expected ViewModel output from adapter:**

| Field | Value |
|-------|-------|
| `overview.traceCount` | 3 |
| `overview.timelineCount` | 5 |
| `overview.historyCount` | 2 |
| `trace.length` | 3 |
| `timeline.length` | 5 |
| `history.length` | 2 |

Artifact Count (snapshot) = 3 + 5 + 2 = 10.

All snapshot booleans resolve to `true`.

### 3. Overview Integration

`ObservatoryOverview.vue` updated:

- Imports `useObservatoryDataStore` alongside existing `useObservatoryStore`
- Calls `dataStore.loadMockObservatory()` during setup
- Replaces the hardcoded `artifacts: readonly Artifact[]` with `computed(() => ...)` deriving from `dataStore.viewModel`
- Replaces the hardcoded `snapshotItems: readonly SnapshotItem[]` with `computed(() => ...)` deriving from `dataStore.viewModel`

**Template remains unchanged** — same layout, same CSS, same aria labels.

### 4. Data Flow

```
buildMockObservatory()
        ↓ (plain object)
DefaultObservatoryAdapter.adapt()
        ↓ (ObservatoryViewModel)
observatoryDataStore.viewModel
        ↓ (Vue reactivity)
ObservatoryOverview.vue (computed → template)
```

---

## Consequences

### Positive

1. **Real data path** — `ObservatoryOverview.vue` no longer contains hardcoded mock values; all counts flow through `DefaultObservatoryAdapter`
2. **Adoption of adapter** — `DefaultObservatoryAdapter` now has a consumer, verifying the adapter contract works end-to-end
3. **Separation of concerns** — data ownership (store) is separate from rendering (component)
4. **Reactive** — Vue reactivity ensures any `viewModel` change propagates to the Overview template
5. **Testable** — the data path can be tested independently at store level, adapter level, and component level
6. **Zero visual changes** — the component template and CSS are untouched

### Negative

- Mock data lives in the store rather than staying in the component file (slightly more indirection for a mock)
- Extra import and store dependency in `ObservatoryOverview.vue`

### Risks

- Currently no mechanism for real data injection from PromptBuilder/Runtime; future integration will need to call a different load function
- The store always initializes before the component calls `loadMockObservatory()`, so there is a brief "empty viewModel" state visible during first render

### Mitigations

- The store exports `viewModel` as a `ref`, so components can directly assign real data in the future
- The `loadMockObservatory()` call happens in the component `setup()`, ensuring data is loaded during the same tick as component creation

---

## Architecture Compliance

| Principle | Status |
|-----------|--------|
| No AI package imports | ✅ Mock types are local |
| UI-safe DTOs only | ✅ Uses `ObservatoryViewModel` exclusively |
| Adapter decoupling | ✅ `DefaultObservatoryAdapter` bridges mock → ViewModel |
| Pure data store | ✅ No UI logic, no rendering |
| Stateless adapter | ✅ `DefaultObservatoryAdapter` has no mutable state |
| Deterministic | ✅ Same mock always produces same ViewModel |
| Frozen output | ✅ Adapter returns frozen arrays |

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/stores/observatoryData.ts` | **New** — observatory data store |
| `apps/web/src/components/observatory/ObservatoryOverview.vue` | **Modified** — consume viewModel |
| `apps/web/src/__tests__/ObservatoryOverview.test.ts` | **Modified** — update count assertions |
| `apps/web/src/__tests__/ObservatoryOverviewDataIntegration.test.ts` | **New** — 120+ integration tests |
| `docs/adr/ADR-0156-observatory-overview-data-integration.md` | **New** — this document |
| `docs/project/CHANGELOG.md` | **Modified** — WO-S6-013 entry |
| `docs/project/PROJECT_STATE.md` | **Modified** — v1.43 |
| `docs/project/AI_ARCHITECTURE.md` | **Modified** — v1.43 |