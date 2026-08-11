# ADR-0160: Observatory Diff Real Data Integration

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-017  
**Architecture Version:** v1.46 → v1.47

---

## Context

WO-S6-006 delivered the Diff Viewer panel (`ObservatoryDiffViewer.vue`) with hardcoded mock diffs defined inside the component file. WO-S6-013 through WO-S6-016 integrated the Overview, Trace, Timeline, and History panels with real data from `ObservatoryViewModel` via `DefaultObservatoryAdapter`. This work order extends the same pattern to the Diff Viewer — the fifth and final real data integration for Sprint 6.

### Problem

1. **Hardcoded diffs** — `MOCK_DIFFS` array with 3 entries defined inside `ObservatoryDiffViewer.vue`
2. **No ViewModel consumption** — the diff viewer does not read from `ObservatoryViewModel`
3. **No DiffViewModel type** — the ViewModel had no Diff-specific viewer DTO type
4. **No adapter coverage** — `DefaultObservatoryAdapter` had no method for mapping diff viewer data

### Scope Boundaries

- No PromptBuilder integration
- No Runtime integration
- No Planner integration
- No AI package changes
- No metadata changes
- No Strategy changes
- No prompt changes
- No visual changes to the Diff Viewer layout

---

## Decision

### 1. DiffViewModel and DiffChangeViewModel

Added to `ObservatoryViewModel.ts`:

```typescript
interface DiffChangeViewModel {
  readonly name: string
}

interface DiffViewModel {
  readonly id: string
  readonly timestamp: string
  readonly added: readonly DiffChangeViewModel[]
  readonly removed: readonly DiffChangeViewModel[]
  readonly changed: readonly DiffChangeViewModel[]
}
```

### 2. ViewModel Extension

Added `diffView: readonly DiffViewModel[]` to `ObservatoryViewModel` alongside existing panel view arrays.

### 3. Adapter Extension

Added `adaptDiffView()` method to `DefaultObservatoryAdapter`:

- Reads `diffView` key from raw observatory data
- Falls back to empty frozen array for missing/invalid data
- Maps each item to `DiffViewModel` with safe defaults
- Includes `adaptDiffChangeArray()` helper that normalizes both `string[]` and `DiffChangeViewModel[]` inputs
- Preserves frozen arrays throughout

### 4. Store Mock Extension

Added 3 diff view entries to the mock observatory (`buildMockObservatory()`):

| ID | Timestamp | Added | Removed | Changed |
|----|-----------|-------|---------|---------|
| diff-001 | 12:00:01 | Tavern, Villager-1, Villager-2 | — | VillageCenter |
| diff-002 | 12:05:00 | Farm-1, Farm-2 | — | — |
| diff-003 | 12:08:00 | Guard-1, Guard-2 | OldRoad | VillageGate |

### 5. Diff Viewer Integration

`ObservatoryDiffViewer.vue` updated:

- Removed `MOCK_DIFFS` array entirely
- Imports `useObservatoryDataStore` and `DiffViewModel`
- Reads diff list from `dataStore.viewModel.diffView`
- Initializes `selectedId` from the first diff in the viewModel
- All existing behavior preserved: selection, keyboard navigation, details panel, layout, styles

`DiffDetails.vue` updated:

- `DiffEntry` is now an alias for `DiffViewModel` from the adapter layer
- Template iterates over `item.name` objects instead of raw strings
- No visual changes

`DiffList.vue` updated:

- Import changed from local `DiffEntry` to `DiffViewModel` from adapter

### 6. Data Flow

```
buildMockObservatory() → diffView: [...]
        ↓
DefaultObservatoryAdapter.adapt(diffView)
        ↓ (readonly DiffViewModel[])
observatoryDataStore.viewModel.diffView
        ↓ (Vue reactivity)
ObservatoryDiffViewer.vue (computed → template)
```

---

## Consequences

### Positive

1. **Real data path** — Diff Viewer no longer contains hardcoded mock diffs
2. **Adapter adoption** — `DefaultObservatoryAdapter` now handles diff viewer data
3. **Type alignment** — `DiffViewModel` is the canonical type for the diff viewer panel
4. **Backward compatibility** — adapter handles both `string[]` and `DiffChangeViewModel[]`
5. **Zero visual regressions** — all existing tests pass with updated data

### Negative

- Diff viewer tests needed updates (`mountViewer` now calls `loadMockObservatory()`)
- Adapter tests needed updates (ViewModel now has 8 root properties instead of 7)

### Risks

- The `diffView` field is separate from other panel views — consumers must know which to use
- Component no longer auto-loads mock data; consumers must call `loadMockObservatory()` or provide viewModel data before mounting

---

## Architecture Compliance

| Principle | Status |
|-----------|--------|
| No AI package imports | ✅ DiffViewModel is UI-safe DTO |
| UI-safe DTOs only | ✅ All fields are primitive or readonly |
| Adapter decoupling | ✅ DefaultObservatoryAdapter maps diffView |
| Stateless adapter | ✅ No mutable state |
| Deterministic | ✅ Same input produces same output |
| Frozen output | ✅ Adapter returns frozen arrays |
| Backward compatibility | ✅ Both string[] and DiffChangeViewModel[] supported |

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/adapters/observatory/ObservatoryViewModel.ts` | **Modified** — added DiffViewModel, DiffChangeViewModel, diffView |
| `apps/web/src/adapters/observatory/DefaultObservatoryAdapter.ts` | **Modified** — added adaptDiffView(), adaptDiffChangeArray() |
| `apps/web/src/adapters/observatory/index.ts` | **Modified** — barrel exports |
| `apps/web/src/stores/observatoryData.ts` | **Modified** — mock diffView entries |
| `apps/web/src/components/observatory/diff/ObservatoryDiffViewer.vue` | **Modified** — removed MOCK_DIFFS, reads from store |
| `apps/web/src/components/observatory/diff/DiffDetails.vue` | **Modified** — uses DiffViewModel from adapter |
| `apps/web/src/components/observatory/diff/DiffList.vue` | **Modified** — uses DiffViewModel from adapter |
| `apps/web/src/__tests__/ObservatoryDiffViewer.test.ts` | **Modified** — mountViewer calls loadMockObservatory |
| `apps/web/src/__tests__/ObservatoryAdapter.test.ts` | **Modified** — root property count 7→8 |
| `apps/web/src/__tests__/ObservatoryOverviewDataIntegration.test.ts` | **Modified** — added diffView to viewModel |
| `apps/web/src/__tests__/ObservatoryHistoryDataIntegration.test.ts` | **Modified** — added diffView to viewModel |
| `apps/web/src/__tests__/ObservatoryTimelineDataIntegration.test.ts` | **Modified** — added diffView to viewModel |
| `apps/web/src/__tests__/ObservatoryTraceDataIntegration.test.ts` | **Modified** — added diffView to viewModel |
| `apps/web/src/__tests__/ObservatoryDiffDataIntegration.test.ts` | **New** — 155 integration tests |
| `docs/adr/ADR-0160-observatory-diff-data-integration.md` | **New** — this document |
| `docs/project/CHANGELOG.md` | **Modified** — WO-S6-017 entry |
| `docs/project/PROJECT_STATE.md` | **Modified** — v1.47 |
| `docs/project/AI_ARCHITECTURE.md` | **Modified** — v1.47 |