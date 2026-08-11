# ADR-0161: Observatory Runtime Real Data Integration

**Status:** Accepted  
**Date:** Sprint 6  
**Work Order:** WO-S6-018  
**Architecture Version:** v1.47 → v1.48

---

## Context

WO-S6-007 delivered the Runtime Viewer panel (`ObservatoryRuntimeViewer.vue`) with hardcoded mock runtime state defined inside the component file. WO-S6-013 through WO-S6-017 integrated the Overview, Trace, Timeline, History, and Diff panels with real data from `ObservatoryViewModel` via `DefaultObservatoryAdapter`. This work order extends the same pattern to the Runtime Viewer — the sixth and final real data integration for Sprint 6 Observatory panels.

### Problem

1. **Hardcoded runtime state** — `MOCK_RUNTIME_STATE` object with 3 entities defined inside `ObservatoryRuntimeViewer.vue`
2. **Hardcoded inspected entities** — `MOCK_INSPECTED_ENTITIES` array with 3 entities and ECS-style components inside `RuntimeEntityInspector.vue`
3. **No ViewModel consumption** — the runtime viewer does not read from `ObservatoryViewModel`
4. **No RuntimeViewModel type** — the ViewModel had no Runtime-specific viewer DTO type
5. **No adapter coverage** — `DefaultObservatoryAdapter` had no method for mapping runtime viewer data

### Scope Boundaries

- No Runtime package integration
- No Planner integration
- No PromptBuilder integration
- No AI package changes
- No Strategy changes
- No metadata changes
- No prompt changes
- No visual changes to the Runtime Viewer layout

---

## Decision

### 1. RuntimeViewModel, RuntimeEntityViewModel, RuntimeComponentViewModel

Added to `ObservatoryViewModel.ts`:

```typescript
interface RuntimeComponentViewModel {
  readonly name: string
  readonly data: string       // JSON-serialized string
}

interface RuntimeEntityViewModel {
  readonly id: string
  readonly type: string
  readonly position: string
  readonly health: string     // String for UI safety
  readonly state: string
  readonly components: readonly RuntimeComponentViewModel[]
}

interface RuntimeViewModel {
  readonly worldId: string
  readonly entityCount: number
  readonly systemCount: number
  readonly eventCount: number
  readonly fps: number
  readonly entities: readonly RuntimeEntityViewModel[]
}
```

### 2. ViewModel Extension

Added `runtimeView: RuntimeViewModel` to `ObservatoryViewModel` alongside existing panel view arrays.

### 3. Adapter Extension

Added `adaptRuntimeView()` method and related helpers to `DefaultObservatoryAdapter`:

- `adaptRuntimeView()` — reads `runtimeView` key from raw observatory, returns default RuntimeViewModel for missing/invalid
- `adaptRuntimeEntities()` — maps raw entity array, handles non-array/non-object items
- `adaptRuntimeEntity()` — maps individual entity with safe defaults
- `adaptHealth()` — converts number health to string, handles NaN/Infinity
- `adaptRuntimeComponents()` — maps component array, serializes data to JSON string
- `adaptComponentData()` — serializes component data to JSON string, handles undefined/string/number
- All outputs frozen (`Object.freeze`)

### 4. Store Mock Extension

Added runtimeView mock data to `buildMockObservatory()`:

| Stat | Value |
|------|-------|
| worldId | world-001 |
| entityCount | 187 |
| systemCount | 8 |
| eventCount | 31 |
| fps | 60 |

| Entity | Type | Position | Health | State | Components |
|--------|------|----------|--------|-------|------------|
| guard-001 | Guard | (10,4) | 100 | Patrol | 3 (Position, Health, AI) |
| merchant-001 | Merchant | (4,8) | 100 | Trading | 4 (Position, Health, Inventory, AI) |
| villager-001 | Villager | (1,2) | 100 | Working | 5 (Position, Health, Inventory, AI, Schedule) |

### 5. Runtime Viewer Integration

`ObservatoryRuntimeViewer.vue` updated:

- Removed `MOCK_RUNTIME_STATE` entirely
- Imports `useObservatoryDataStore`, `RuntimeViewModel`, `RuntimeEntityViewModel`
- Reads runtime data from `dataStore.viewModel.runtimeView`
- Initializes `selectedId` from first entity in the viewModel
- All existing behavior preserved: selection, keyboard navigation, stats, details, inspector, layout, styles

`RuntimeEntityDetails.vue` updated:

- `RuntimeEntity` is now an alias for `RuntimeEntityViewModel` from the adapter layer
- `health` is now a string (previously number)

`RuntimeEntityList.vue` updated:

- Import changed from local `RuntimeEntity` to `RuntimeEntityViewModel` from adapter

`RuntimeEntityInspector.vue` updated:

- Removed `MOCK_INSPECTED_ENTITIES` entirely
- Reads from `dataStore.viewModel.runtimeView.entities` via computed
- Finds entity by ID from the viewModel

`RuntimeComponentCard.vue` updated:

- Now handles both `string` and `Record<string, unknown>` data types
- Uses `displayData` computed to render correctly
- Backward compatible with `InspectorComponent` type

### 6. Data Flow

```
buildMockObservatory() → runtimeView: { worldId, entityCount, ..., entities: [...] }
        ↓
DefaultObservatoryAdapter.adapt(runtimeView)
        ↓ (RuntimeViewModel)
observatoryDataStore.viewModel.runtimeView
        ↓ (Vue reactivity)
ObservatoryRuntimeViewer.vue (computed → template)
        ├── stats grid (entityCount, systemCount, eventCount, fps)
        ├── entity list (entities)
        ├── entity details (selected entity)
        └── entity inspector (selected entity components)
```

---

## Consequences

### Positive

1. **Real data path** — Runtime Viewer no longer contains hardcoded mock runtime state
2. **Adapter adoption** — `DefaultObservatoryAdapter` now handles runtime viewer data
3. **Type alignment** — `RuntimeViewModel` is the canonical type for the runtime viewer panel
4. **Component data serialized** — ECS-style component data is serialized to JSON strings for UI safety
5. **Zero visual regressions** — all existing tests pass with updated data

### Negative

- Runtime viewer tests needed updates (`mountViewer` now calls `loadMockObservatory()`)
- Adapter tests needed updates (ViewModel now has 9 root properties instead of 8)
- Inspector tests needed updates (no longer uses `MOCK_INSPECTED_ENTITIES`)
- `health` field changed from `number` to `string` in the entity type

### Risks

- The `runtimeView` field is a single object, not an array — different from other panel views
- Component no longer auto-loads mock data; consumers must call `loadMockObservatory()` or provide viewModel data before mounting

---

## Architecture Compliance

| Principle | Status |
|-----------|--------|
| No AI package imports | ✅ RuntimeViewModel is UI-safe DTO |
| No Runtime package imports | ✅ No @genesis/runtime types used |
| No ECS imports | ✅ Component data serialized to string |
| UI-safe DTOs only | ✅ All fields are primitive or readonly |
| Adapter decoupling | ✅ DefaultObservatoryAdapter maps runtimeView |
| Stateless adapter | ✅ No mutable state |
| Deterministic | ✅ Same input produces same output |
| Frozen output | ✅ Adapter returns frozen objects and arrays |

---

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/adapters/observatory/ObservatoryViewModel.ts` | **Modified** — added RuntimeViewModel, RuntimeEntityViewModel, RuntimeComponentViewModel, runtimeView |
| `apps/web/src/adapters/observatory/DefaultObservatoryAdapter.ts` | **Modified** — added adaptRuntimeView(), adaptRuntimeEntities(), adaptRuntimeEntity(), adaptHealth(), adaptRuntimeComponents(), adaptComponentData() |
| `apps/web/src/adapters/observatory/index.ts` | **Modified** — barrel exports |
| `apps/web/src/stores/observatoryData.ts` | **Modified** — mock runtimeView entries |
| `apps/web/src/components/observatory/runtime/ObservatoryRuntimeViewer.vue` | **Modified** — removed MOCK_RUNTIME_STATE, reads from store |
| `apps/web/src/components/observatory/runtime/RuntimeEntityDetails.vue` | **Modified** — uses RuntimeEntityViewModel from adapter |
| `apps/web/src/components/observatory/runtime/RuntimeEntityList.vue` | **Modified** — uses RuntimeEntityViewModel from adapter |
| `apps/web/src/components/observatory/runtime/RuntimeEntityInspector.vue` | **Modified** — removed MOCK_INSPECTED_ENTITIES, reads from store |
| `apps/web/src/components/observatory/runtime/RuntimeComponentCard.vue` | **Modified** — handles both string and object data |
| `apps/web/src/__tests__/ObservatoryRuntimeViewer.test.ts` | **Modified** — mountViewer calls loadMockObservatory |
| `apps/web/src/__tests__/ObservatoryRuntimeInspector.test.ts` | **Modified** — mountInspector calls loadMockObservatory |
| `apps/web/src/__tests__/ObservatoryAdapter.test.ts` | **Modified** — root property count 8→9 |
| `apps/web/src/__tests__/ObservatoryOverviewDataIntegration.test.ts` | **Modified** — added runtimeView to viewModel |
| `apps/web/src/__tests__/ObservatoryDiffDataIntegration.test.ts` | **Modified** — added runtimeView to viewModel |
| `apps/web/src/__tests__/ObservatoryHistoryDataIntegration.test.ts` | **Modified** — added runtimeView to viewModel |
| `apps/web/src/__tests__/ObservatoryTimelineDataIntegration.test.ts` | **Modified** — added runtimeView to viewModel |
| `apps/web/src/__tests__/ObservatoryTraceDataIntegration.test.ts` | **Modified** — added runtimeView to viewModel |
| `apps/web/src/__tests__/ObservatoryRuntimeDataIntegration.test.ts` | **New** — 181 integration tests |
| `docs/adr/ADR-0161-observatory-runtime-data-integration.md` | **New** — this document |
| `docs/project/CHANGELOG.md` | **Modified** — WO-S6-018 entry |
| `docs/project/PROJECT_STATE.md` | **Modified** — v1.48 |
| `docs/project/AI_ARCHITECTURE.md` | **Modified** — v1.48 |