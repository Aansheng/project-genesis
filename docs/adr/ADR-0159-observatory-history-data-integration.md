# ADR-0159: Observatory History Real Data Integration

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-016  
**Architecture Version:** v1.45 → v1.46

---

## Context

WO-S6-005 delivered the History Viewer panel (`ObservatoryHistoryViewer.vue`) with hardcoded mock history data defined inside the component file. WO-S6-015 integrated the Timeline Viewer with real data from `ObservatoryViewModel` via `DefaultObservatoryAdapter`. This work order extends the same pattern to the History Viewer.

### Problem

1. **Hardcoded history data** — `MOCK_HISTORY` array with 3 entries defined inside `ObservatoryHistoryViewer.vue`
2. **No ViewModel consumption** — the history viewer does not read from `ObservatoryViewModel`
3. **No HistoryViewModel type** — the ViewModel had no History-specific viewer DTO type
4. **No adapter coverage** — `DefaultObservatoryAdapter` had no method for mapping history viewer data

### Scope Boundaries

- No PromptBuilder integration
- No Runtime integration
- No Planner integration
- No AI package changes
- No metadata changes
- No Strategy changes
- No prompt changes
- No visual changes to the History Viewer layout

---

## Decision

### 1. HistoryViewModel

Added `HistoryViewModel` to `ObservatoryViewModel.ts`:

```typescript
interface HistoryViewModel {
  readonly id: string
  readonly timestamp: string
  readonly prompt: string
  readonly result: string
  readonly evolution: readonly HistoryEvolutionEntryViewModel[]
}
```

Also added `HistoryEvolutionEntryViewModel` for the evolution items:

```typescript
interface HistoryEvolutionEntryViewModel {
  readonly name: string
}
```

### 2. ViewModel Extension

Added `historyView: readonly HistoryViewModel[]` to `ObservatoryViewModel` alongside the existing `history: readonly HistoryDTO[]`.

### 3. Adapter Extension

Added `adaptHistoryView()` method to `DefaultObservatoryAdapter`:

- Reads `historyView` key from raw observatory data
- Falls back to deriving from `history` array for backward compatibility
- Falls back to empty frozen array for missing/invalid data
- Maps each item to `HistoryViewModel` with safe defaults
- Handles both `string[]` and `HistoryEvolutionEntryViewModel[]` evolution arrays
- Preserves frozen arrays throughout
- Pure, stateless, deterministic

### 4. Store Mock Extension

Added 3 history view entries to the mock observatory:

| ID | Timestamp | Prompt | Result | Evolution |
|----|-----------|--------|--------|-----------|
| history-001 | 10:00:00 | Create Farm Game | Farm Created | CreateWorld, GenerateTerrain, CreateFarm, CreateNPC, CreateQuest |
| history-002 | 10:05:00 | Add Villagers | 3 villagers added | CreateVillager, AssignTask, StartWork |
| history-003 | 10:10:00 | Build Defenses | Walls constructed | BuildWall, PlaceGuard |

### 5. History Viewer Integration

`ObservatoryHistoryViewer.vue` updated:

- Removed `MOCK_HISTORY` array entirely
- Imports `useObservatoryDataStore` and `HistoryViewModel`
- Reads history list from `dataStore.viewModel.historyView`
- Initializes `selectedId` from the first history entry in the viewModel
- All existing behavior preserved: selection, keyboard navigation, prompt/result/evolution display, layout, styles

`HistoryDetails.vue` and `HistoryList.vue` updated:

- Both now import `HistoryViewModel`/`HistoryEvolutionEntryViewModel` from the adapter layer
- Local `HistoryEntry` type is now an alias for `HistoryViewModel`
- Template uses `evo.name` instead of `name` iteration since evolution is now object-based
- No functional changes — the rendered output is identical

### 6. Data Flow

```
buildMockObservatory() → historyView: [...]
        ↓
DefaultObservatoryAdapter.adapt(historyView)
        ↓ (readonly HistoryViewModel[])
observatoryDataStore.viewModel.historyView
        ↓ (Vue reactivity)
ObservatoryHistoryViewer.vue (computed → template)
```

---

## Consequences

### Positive

1. **Real data path** — History Viewer no longer contains hardcoded mock history data
2. **Adapter adoption** — `DefaultObservatoryAdapter` now handles history viewer data
3. **Type alignment** — `HistoryViewModel` is the canonical type for the history viewer panel
4. **Zero visual regressions** — all existing tests pass with updated data

### Negative

- Existing history viewer tests needed updates (prompts, results, timestamps, evolution names all changed)
- Adapter tests needed updates (ViewModel now has 7 root properties instead of 6)

### Risks

- The `historyView` field is separate from the existing `history` field — consumers must know which to use for which purpose
- Component no longer auto-loads mock data; consumers must call `loadMockObservatory()` or provide viewModel data before mounting

---

## Architecture Compliance

| Principle | Status |
|-----------|--------|
| No AI package imports | ✅ HistoryViewModel is UI-safe DTO |
| UI-safe DTOs only | ✅ All fields are primitive or readonly |
| Adapter decoupling | ✅ DefaultObservatoryAdapter maps historyView |
| Stateless adapter | ✅ No mutable state |
| Deterministic | ✅ Same input produces same output |
| Frozen output | ✅ Adapter returns frozen arrays |

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/adapters/observatory/ObservatoryViewModel.ts` | **Modified** — added HistoryViewModel, HistoryEvolutionEntryViewModel, historyView |
| `apps/web/src/adapters/observatory/DefaultObservatoryAdapter.ts` | **Modified** — added adaptHistoryView() |
| `apps/web/src/adapters/observatory/index.ts` | **Modified** — barrel exports |
| `apps/web/src/stores/observatoryData.ts` | **Modified** — mock historyView entries |
| `apps/web/src/components/observatory/history/ObservatoryHistoryViewer.vue` | **Modified** — removed MOCK_HISTORY, reads from store |
| `apps/web/src/components/observatory/history/HistoryList.vue` | **Modified** — uses HistoryViewModel |
| `apps/web/src/components/observatory/history/HistoryDetails.vue` | **Modified** — uses HistoryViewModel, evo.name iteration |
| `apps/web/src/__tests__/ObservatoryHistoryViewer.test.ts` | **Modified** — updated mock data assertions |
| `apps/web/src/__tests__/ObservatoryAdapter.test.ts` | **Modified** — root property count |
| `apps/web/src/__tests__/ObservatoryOverviewDataIntegration.test.ts` | **Modified** — added historyView to viewModel assignments |
| `apps/web/src/__tests__/ObservatoryTimelineDataIntegration.test.ts` | **Modified** — added historyView to viewModel assignments |
| `apps/web/src/__tests__/ObservatoryTraceDataIntegration.test.ts` | **Modified** — added historyView to viewModel assignments |
| `apps/web/src/__tests__/ObservatoryHistoryDataIntegration.test.ts` | **New** — 136 integration tests |
| `docs/adr/ADR-0159-observatory-history-data-integration.md` | **New** — this document |
| `docs/project/CHANGELOG.md` | **Modified** — WO-S6-016 entry |
| `docs/project/PROJECT_STATE.md` | **Modified** — v1.46 |
| `docs/project/AI_ARCHITECTURE.md` | **Modified** — v1.46 |