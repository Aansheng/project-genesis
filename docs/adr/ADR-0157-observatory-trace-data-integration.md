# ADR-0157: Observatory Trace Real Data Integration

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-014  
**Architecture Version:** v1.43 → v1.44

---

## Context

WO-S6-003 delivered the Trace Viewer panel (`ObservatoryTraceViewer.vue`) with hardcoded mock traces defined inside the component file. WO-S6-013 integrated the Overview dashboard with real data from `ObservatoryViewModel` via `DefaultObservatoryAdapter`. This work order extends the same pattern to the Trace Viewer.

### Problem

1. **Hardcoded traces** — `MOCK_TRACES` array with 3 entries defined inside `ObservatoryTraceViewer.vue`
2. **No ViewModel consumption** — the trace viewer does not read from `ObservatoryViewModel`
3. **No TraceViewModel type** — the ViewModel had no Trace-specific viewer DTO type
4. **No adapter coverage** — `DefaultObservatoryAdapter` had no method for mapping trace viewer data

### Scope Boundaries

- No PromptBuilder integration
- No Runtime integration
- No Planner integration
- No AI package changes
- No metadata changes
- No Strategy changes
- No prompt changes
- No visual changes to the Trace Viewer layout

---

## Decision

### 1. TraceViewModel

Added `TraceViewModel` to `ObservatoryViewModel.ts`:

```typescript
interface TraceViewModel {
  readonly id: string
  readonly strategy: string
  readonly timestamp: string
  readonly plan: string
  readonly snapshot: readonly TraceSnapshotEntryVM[]
  readonly metadata: Readonly<Record<string, unknown>>
}
```

Also added `TraceSnapshotEntryVM` for the snapshot entries:

```typescript
interface TraceSnapshotEntryVM {
  readonly key: string
  readonly value: string
}
```

### 2. ViewModel Extension

Added `traceView: readonly TraceViewModel[]` to `ObservatoryViewModel` alongside the existing `trace: readonly TraceDTO[]`.

### 3. Adapter Extension

Added `adaptTraceView()` method to `DefaultObservatoryAdapter`:

- Reads `traceView` key from raw observatory data
- Falls back to empty frozen array for missing/invalid data
- Maps each item to `TraceViewModel` with safe defaults
- Preserves frozen arrays throughout

### 4. Store Mock Extension

Added 3 trace view entries to the mock observatory:

| ID | Strategy | Timestamp |
|----|----------|-----------|
| trace-001 | CreateWorld | 10:00:01 |
| trace-002 | GenerateTerrain | 10:00:05 |
| trace-003 | CreateFarm | 10:00:09 |

### 5. Trace Viewer Integration

`ObservatoryTraceViewer.vue` updated:

- Removed `MOCK_TRACES` array entirely
- Imports `useObservatoryDataStore` and `TraceViewModel`
- Reads trace list from `dataStore.viewModel.traceView`
- Initializes `selectedId` from the first trace in the viewModel
- All existing behavior preserved: selection, keyboard navigation, details panel, layout, styles

`TraceDetails.vue` and `TraceList.vue` updated:

- Both now import `TraceViewModel` from the adapter layer instead of defining local `Trace` type
- No functional changes — the type is structurally identical

### 6. Data Flow

```
buildMockObservatory() → traceView: [...]
        ↓
DefaultObservatoryAdapter.adapt(traceView)
        ↓ (readonly TraceViewModel[])
observatoryDataStore.viewModel.traceView
        ↓ (Vue reactivity)
ObservatoryTraceViewer.vue (computed → template)
```

---

## Consequences

### Positive

1. **Real data path** — Trace Viewer no longer contains hardcoded mock traces
2. **Adapter adoption** — `DefaultObservatoryAdapter` now handles trace viewer data
3. **Type alignment** — `TraceViewModel` is the canonical type for the trace viewer panel
4. **Zero visual regressions** — all existing tests pass with updated data

### Negative

- Existing trace viewer tests needed updates (mock IDs changed from `trace-1` to `trace-001`, strategies changed, timestamps changed)
- Adapter tests needed updates (ViewModel now has 5 root properties instead of 4)

### Risks

- The `traceView` field is separate from the existing `trace` field — consumers must know which to use for which purpose
- Component no longer auto-loads mock data; consumers must call `loadMockObservatory()` or provide viewModel data before mounting

---

## Architecture Compliance

| Principle | Status |
|-----------|--------|
| No AI package imports | ✅ TraceViewModel is UI-safe DTO |
| UI-safe DTOs only | ✅ All fields are primitive or readonly |
| Adapter decoupling | ✅ DefaultObservatoryAdapter maps traceView |
| Stateless adapter | ✅ No mutable state |
| Deterministic | ✅ Same input produces same output |
| Frozen output | ✅ Adapter returns frozen arrays |

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/adapters/observatory/ObservatoryViewModel.ts` | **Modified** — added TraceViewModel, TraceSnapshotEntryVM, traceView |
| `apps/web/src/adapters/observatory/DefaultObservatoryAdapter.ts` | **Modified** — added adaptTraceView() |
| `apps/web/src/adapters/observatory/index.ts` | **Modified** — barrel exports |
| `apps/web/src/stores/observatoryData.ts` | **Modified** — mock traceView entries |
| `apps/web/src/components/observatory/trace/ObservatoryTraceViewer.vue` | **Modified** — removed MOCK_TRACES, reads from store |
| `apps/web/src/components/observatory/trace/TraceList.vue` | **Modified** — uses TraceViewModel |
| `apps/web/src/components/observatory/trace/TraceDetails.vue` | **Modified** — uses TraceViewModel |
| `apps/web/src/__tests__/ObservatoryTraceViewer.test.ts` | **Modified** — updated mock data assertions |
| `apps/web/src/__tests__/ObservatoryAdapter.test.ts` | **Modified** — root property count |
| `apps/web/src/__tests__/ObservatoryTraceDataIntegration.test.ts` | **New** — 115 integration tests |
| `docs/adr/ADR-0157-observatory-trace-data-integration.md` | **New** — this document |
| `docs/project/CHANGELOG.md` | **Modified** — WO-S6-014 entry |
| `docs/project/PROJECT_STATE.md` | **Modified** — v1.44 |
| `docs/project/AI_ARCHITECTURE.md` | **Modified** — v1.44 |