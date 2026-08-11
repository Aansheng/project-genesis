# ADR-0158: Observatory Timeline Real Data Integration

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-015  
**Architecture Version:** v1.44 → v1.45

---

## Context

WO-S6-004 delivered the Timeline Viewer panel (`ObservatoryTimelineViewer.vue`) with hardcoded mock timelines defined inside the component file. WO-S6-014 integrated the Trace Viewer with real data from `ObservatoryViewModel` via `DefaultObservatoryAdapter`. This work order extends the same pattern to the Timeline Viewer.

### Problem

1. **Hardcoded timelines** — `MOCK_TIMELINES` array with 3 entries defined inside `ObservatoryTimelineViewer.vue`
2. **No ViewModel consumption** — the timeline viewer does not read from `ObservatoryViewModel`
3. **No TimelineViewModel type** — the ViewModel had no Timeline-specific viewer DTO type
4. **No adapter coverage** — `DefaultObservatoryAdapter` had no method for mapping timeline viewer data

### Scope Boundaries

- No PromptBuilder integration
- No Runtime integration
- No Planner integration
- No AI package changes
- No metadata changes
- No Strategy changes
- No prompt changes
- No visual changes to the Timeline Viewer layout

---

## Decision

### 1. TimelineViewModel

Added `TimelineViewModel` to `ObservatoryViewModel.ts`:

```typescript
interface TimelineViewModel {
  readonly id: string
  readonly entryCount: number
  readonly entries: readonly TimelineEntryViewModel[]
}
```

Also added `TimelineEntryViewModel` for the entry items:

```typescript
interface TimelineEntryViewModel {
  readonly index: number
  readonly strategy: string
}
```

### 2. ViewModel Extension

Added `timelineView: readonly TimelineViewModel[]` to `ObservatoryViewModel` alongside the existing `timeline: readonly TimelineDTO[]`.

### 3. Adapter Extension

Added `adaptTimelineView()` method to `DefaultObservatoryAdapter`:

- Reads `timelineView` key from raw observatory data
- Falls back to deriving from `timeline` array for backward compatibility
- Falls back to empty frozen array for missing/invalid data
- Maps each item to `TimelineViewModel` with safe defaults
- Preserves frozen arrays throughout
- Pure, stateless, deterministic

### 4. Store Mock Extension

Added 3 timeline view entries to the mock observatory:

| ID | Entry Count | Strategies |
|----|------------|------------|
| timeline-001 | 5 | CreateWorld, GenerateTerrain, CreateFarm, CreateNPC, CreateQuest |
| timeline-002 | 3 | MoveEntity, QueryWorld, UpdateEntity |
| timeline-003 | 4 | DestroyEntity, CreateEntity, QueryWorld, MoveEntity |

### 5. Timeline Viewer Integration

`ObservatoryTimelineViewer.vue` updated:

- Removed `MOCK_TIMELINES` array entirely
- Imports `useObservatoryDataStore` and `TimelineViewModel`
- Reads timeline list from `dataStore.viewModel.timelineView`
- Initializes `selectedId` from the first timeline in the viewModel
- All existing behavior preserved: selection, keyboard navigation, details panel, layout, styles

`TimelineDetails.vue` and `TimelineList.vue` updated:

- Both now import `TimelineViewModel`/`TimelineEntryViewModel` from the adapter layer
- Local `Timeline` and `TimelineEntry` types are now aliases for adapter types
- No functional changes — the type is structurally identical

### 6. Data Flow

```
buildMockObservatory() → timelineView: [...]
        ↓
DefaultObservatoryAdapter.adapt(timelineView)
        ↓ (readonly TimelineViewModel[])
observatoryDataStore.viewModel.timelineView
        ↓ (Vue reactivity)
ObservatoryTimelineViewer.vue (computed → template)
```

---

## Consequences

### Positive

1. **Real data path** — Timeline Viewer no longer contains hardcoded mock timelines
2. **Adapter adoption** — `DefaultObservatoryAdapter` now handles timeline viewer data
3. **Type alignment** — `TimelineViewModel` is the canonical type for the timeline viewer panel
4. **Zero visual regressions** — all existing tests pass with updated data

### Negative

- Existing timeline viewer tests needed updates (entry counts changed from 12/8/4 to 5/3/4, strategies changed)
- Adapter tests needed updates (ViewModel now has 6 root properties instead of 5)

### Risks

- The `timelineView` field is separate from the existing `timeline` field — consumers must know which to use for which purpose
- Component no longer auto-loads mock data; consumers must call `loadMockObservatory()` or provide viewModel data before mounting

---

## Architecture Compliance

| Principle | Status |
|-----------|--------|
| No AI package imports | ✅ TimelineViewModel is UI-safe DTO |
| UI-safe DTOs only | ✅ All fields are primitive or readonly |
| Adapter decoupling | ✅ DefaultObservatoryAdapter maps timelineView |
| Stateless adapter | ✅ No mutable state |
| Deterministic | ✅ Same input produces same output |
| Frozen output | ✅ Adapter returns frozen arrays |

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/adapters/observatory/ObservatoryViewModel.ts` | **Modified** — added TimelineViewModel, TimelineEntryViewModel, timelineView |
| `apps/web/src/adapters/observatory/DefaultObservatoryAdapter.ts` | **Modified** — added adaptTimelineView() |
| `apps/web/src/adapters/observatory/index.ts` | **Modified** — barrel exports |
| `apps/web/src/stores/observatoryData.ts` | **Modified** — mock timelineView entries |
| `apps/web/src/components/observatory/timeline/ObservatoryTimelineViewer.vue` | **Modified** — removed MOCK_TIMELINES, reads from store |
| `apps/web/src/components/observatory/timeline/TimelineList.vue` | **Modified** — uses TimelineViewModel |
| `apps/web/src/components/observatory/timeline/TimelineDetails.vue` | **Modified** — uses TimelineViewModel |
| `apps/web/src/__tests__/ObservatoryTimelineViewer.test.ts` | **Modified** — updated mock data assertions |
| `apps/web/src/__tests__/ObservatoryAdapter.test.ts` | **Modified** — root property count |
| `apps/web/src/__tests__/ObservatoryTraceDataIntegration.test.ts` | **Modified** — added timelineView to viewModel assignments |
| `apps/web/src/__tests__/ObservatoryOverviewDataIntegration.test.ts` | **Modified** — added traceView/timelineView to viewModel assignments |
| `apps/web/src/__tests__/ObservatoryTimelineDataIntegration.test.ts` | **New** — 127 integration tests |
| `docs/adr/ADR-0158-observatory-timeline-data-integration.md` | **New** — this document |
| `docs/project/CHANGELOG.md` | **Modified** — WO-S6-015 entry |
| `docs/project/PROJECT_STATE.md` | **Modified** — v1.45 |
| `docs/project/AI_ARCHITECTURE.md` | **Modified** — v1.45 |